import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getTimestampWithoutMs, calculateRemainingTimeKST } from '@/lib/utils';

// Supabase 연결 확인
if (!supabase) {
  console.error('❌ Supabase 클라이언트 초기화 실패');
  throw new Error(
    'Supabase 클라이언트가 초기화되지 않았습니다. 환경 변수를 확인하세요.'
  );
}

// 슬롯 현황 조회
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 슬롯 현황 조회 중...');

    const { searchParams } = new URL(request.url);
    const userGroup = searchParams.get('userGroup');
    const searchQuery = searchParams.get('search');
    const customerId = searchParams.get('customerId'); // 특정 고객 ID 파라미터
    const username = searchParams.get('username'); // 실제 고객명 (customer_id와 매칭)
    const type = searchParams.get('type'); // 'slots' 또는 'slot_status' 구분
    const skipSlotsTable = searchParams.get('skipSlotsTable'); // slots 테이블 조회 건너뛰기
    const currentUser = searchParams.get('currentUser'); // 현재 로그인한 사용자

    // 🔥 권한 기반 필터링을 위한 사용자 정보 조회
    let userRole = null;
    let userDistributor = null;

    if (currentUser) {
      try {
        const { data: userProfile, error: userProfileError } = await supabase
          .from('user_profiles')
          .select('username, grade, distributor')
          .eq('username', currentUser)
          .single();

        if (userProfileError || !userProfile) {
          console.warn(
            '⚠️ 사용자 프로필 조회 실패:',
            userProfileError?.message
          );
        } else {
          userRole = userProfile.grade;
          userDistributor = userProfile.distributor;
          console.log(
            `👤 현재 사용자: ${currentUser}, 권한: ${userRole}, 소속: ${userDistributor}`
          );
        }
      } catch (err) {
        console.warn('⚠️ 사용자 프로필 조회 중 오류:', err);
      }
    }

    // distributorMap을 함수 최상위에서 정의
    let distributorMap = new Map();

    // type 파라미터에 따라 다른 테이블 조회
    if (type === 'slot_status') {
      // slot_status 테이블 조회 (쿠팡 앱 추가 페이지용) - 키워드가 있는 레코드만, 쿠팡 슬롯 타입만
      let slotStatusQuery = supabase
        .from('slot_status')
        .select(
          '*, slot_sequence, traffic_counter, last_traffic_update, traffic_reset_date'
        ) // 트래픽 카운터 필드 포함
        .not('keyword', 'eq', '') // 키워드가 비어있지 않은 레코드만
        .eq('slot_type', '쿠팡') // 쿠팡 슬롯 타입만 필터링
        .order('created_at', { ascending: false });

      // 🔥 권한 기반 필터링 적용
      if (userRole && currentUser) {
        if (userRole === '최고관리자') {
          // 최고관리자: 모든 슬롯 조회 (필터링 없음)
          console.log('🔓 최고관리자 - 모든 슬롯 조회');
        } else if (userRole === '총판회원') {
          // 총판회원: 자신의 슬롯 + 자신을 distributor로 가진 슬롯
          console.log(
            `👥 총판회원 - 자신의 슬롯 + 소속 회원 슬롯 조회 (소속: ${userDistributor})`
          );
          slotStatusQuery = slotStatusQuery.or(
            `customer_id.eq.${currentUser},distributor.eq.${userDistributor}`
          );
        } else {
          // 일반회원: 자신의 슬롯만
          console.log('👤 일반회원 - 자신의 슬롯만 조회');
          slotStatusQuery = slotStatusQuery.eq('customer_id', currentUser);
        }
      }

      // 개별 고객 필터링 (customerId와 username이 있는 경우) - 권한 필터링과 별개로 동작
      if (customerId && username) {
        slotStatusQuery = slotStatusQuery.eq('customer_id', username); // 기존 쿠팡은 username 사용
        console.log('🔍 개별 고객 슬롯 필터링:', { customerId, username });
      }

      const { data: slotStatusData, error: slotStatusError } =
        await slotStatusQuery;

      if (slotStatusError) {
        console.error('slot_status 데이터 조회 오류:', slotStatusError);
        return NextResponse.json(
          { error: '슬롯 등록 데이터를 불러오는 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      // slots 테이블에서 동일한 고객의 데이터 조회 (잔여기간/등록일·만료일 계산용)
      let slotsData = null;
      if (customerId && username && !skipSlotsTable) {
        try {
          console.log('🔍 slots 테이블 조회 시작:', { customerId, username });
          const { data: slotsQueryData, error: slotsError } = await supabase
            .from('slots')
            .select(
              'id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group'
            )
            .eq('customer_id', username)
            .eq('slot_type', '쿠팡') // 쿠팡 슬롯 타입만 필터링
            .order('created_at', { ascending: false });

          if (slotsError) {
            console.error('❌ slots 테이블 조회 오류:', slotsError);
            console.error('❌ 오류 코드:', slotsError.code);
            console.error('❌ 오류 메시지:', slotsError.message);
            console.error('❌ 오류 세부사항:', slotsError.details);
            // slots 테이블 조회 실패해도 계속 진행
            slotsData = [];
          } else {
            slotsData = slotsQueryData;
            console.log(
              '✅ slots 테이블 데이터 조회 완료:',
              slotsData?.length || 0,
              '개'
            );
          }
        } catch (err) {
          console.error('❌ slots 테이블 조회 예외:', err);
          // 예외 발생해도 계속 진행
          slotsData = [];
        }
      } else if (skipSlotsTable) {
        console.log('⏭️ slots 테이블 조회 건너뛰기 (skipSlotsTable=true)');
        slotsData = [];

        // skipSlotsTable=true일 때도 일시중지된 슬롯 필터링을 위해 필요한 slots 데이터만 조회
        if (
          type === 'slot_status' &&
          slotStatusData &&
          slotStatusData.length > 0
        ) {
          try {
            // 고유한 slot_sequence 목록 추출
            const uniqueSlotSequences = [
              ...new Set(slotStatusData.map(slot => slot.slot_sequence)),
            ];

            // slots 테이블에서 상태 정보만 조회
            const { data: slotsStatusData } = await supabase
              .from('slots')
              .select('id, status')
              .in('id', uniqueSlotSequences);

            // slotsData를 상태 정보만 포함하도록 설정
            slotsData = slotsStatusData || [];
            console.log(
              '✅ 일시중지 필터링을 위한 slots 상태 조회 완료:',
              slotsData.length,
              '개'
            );
          } catch (err) {
            console.log('slots 상태 조회 중 오류 (무시):', err);
            slotsData = [];
          }
        }
      }

      // user_profiles 테이블에서 distributor 값 조회 (type=slot_status일 때)
      if (
        type === 'slot_status' &&
        slotStatusData &&
        slotStatusData.length > 0
      ) {
        try {
          // 고유한 customer_id 목록 추출
          const uniqueCustomerIds = [
            ...new Set(slotStatusData.map(slot => slot.customer_id)),
          ];

          // user_profiles 테이블에서 distributor 값 조회
          const { data: userProfilesData } = await supabase
            .from('user_profiles')
            .select('username, distributor')
            .in('username', uniqueCustomerIds);

          // Map으로 변환하여 빠른 조회 가능하도록 함
          if (userProfilesData) {
            userProfilesData.forEach(profile => {
              distributorMap.set(
                profile.username,
                profile.distributor || '일반'
              );
            });
          }

          console.log(
            '✅ user_profiles distributor 매핑 완료:',
            distributorMap
          );
        } catch (err) {
          console.log('user_profiles distributor 조회 중 오류 (무시):', err);
        }
      }

      // slot_status 데이터를 슬롯 등록 목록 형식으로 변환 (사용자별 순번 1번부터 시작)
      const formattedSlotStatusData = slotStatusData?.map((slot, index) => {
        // slots 테이블에서 동일한 usage_days를 가진 데이터 찾기
        // slots.id와 slot_status.slot_sequence로 매칭
        const matchingSlot = slotsData?.find(
          (s: { id: number }) => s.id === slot.slot_sequence
        );

        // slots 테이블 데이터가 있으면 그것을 사용, 없으면 slot_status 데이터 사용
        const baseData = matchingSlot || slot;

        // coupangapp/add 페이지에서는 일시중지된 슬롯을 제외
        // slot-status 페이지에서는 일시중지된 슬롯도 표시 (재개 버튼을 위해)
        if (
          type === 'slot_status' &&
          matchingSlot &&
          matchingSlot.status === 'inactive'
        ) {
          return null; // coupangapp/add 페이지에서는 일시중지된 슬롯 제외
        }

        console.log('슬롯 매칭 확인:', {
          slot_status_id: slot.id,
          slot_status_slot_sequence: slot.slot_sequence,
          slots_id: matchingSlot?.id,
          slot_status_usage_days: slot.usage_days,
          slots_usage_days: matchingSlot?.usage_days,
          slot_status_created_at: slot.created_at,
          matching_slot_found: !!matchingSlot,
          matching_slot_created_at: matchingSlot?.created_at,
          final_created_at: baseData.created_at,
          using_slots_data: !!matchingSlot,
        });

        // 한국 시간(KST) 기준 잔여기간 계산 (시간대 차이 해결)
        const usageDays = baseData.usage_days || 0;

        // 일시중지된 슬롯의 경우 잔여기간을 정지
        let remainingTime;
        let remainingTimeString;

        if (matchingSlot && matchingSlot.status === 'inactive') {
          // 일시중지된 슬롯: 잔여기간을 정지 상태로 표시
          remainingTime = {
            days: Math.floor(usageDays),
            hours: 0,
            minutes: 0,
            string: `${usageDays}일 (일시중지)`,
          };
          remainingTimeString = `${usageDays}일 (일시중지)`;
        } else {
          // 정상 작동 중인 슬롯: 일반적인 잔여기간 계산
          remainingTime = calculateRemainingTimeKST(
            baseData.created_at,
            usageDays
          );
          remainingTimeString = remainingTime.string || '만료됨';
        }

        const remainingDays = remainingTime.days;
        const remainingHours = remainingTime.hours;
        const remainingMinutes = remainingTime.minutes;

        // 등록일과 만료일 계산 (한국 시간 기준)
        const createdDateKST = new Date(baseData.created_at);
        const expiryDateKST = new Date(
          createdDateKST.getTime() + usageDays * 24 * 60 * 60 * 1000
        );

        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const registrationDate = formatLocalDate(createdDateKST);
        const expiryDateString =
          usageDays > 0 ? formatLocalDate(expiryDateKST) : '';

        return {
          id: index + 1, // 순번 (1부터 시작)
          db_id: slot.id, // 실제 데이터베이스 ID (삭제용)
          customer_id: slot.customer_id,
          customer_name: slot.customer_name,
          distributor: slot.distributor,
          work_group: slot.work_group,
          keyword: slot.keyword,
          link_url: slot.link_url,
          current_rank: slot.current_rank,
          start_rank: slot.start_rank,
          slot_count: slot.slot_count,
          traffic: slot.traffic_counter || 0, // 트래픽 카운터 사용
          equipment_group: slot.equipment_group,
          remaining_days: remainingTimeString,
          registration_date: registrationDate,
          expiry_date: expiryDateString,
          status: slot.status,
          memo: slot.memo,
          created_at: slot.created_at,
          usage_days: slot.usage_days,
          traffic_counter: slot.traffic_counter || 0, // 트래픽 카운터 필드 추가
          last_traffic_update: slot.last_traffic_update,
          traffic_reset_date: slot.traffic_reset_date,
        };
      });

      return NextResponse.json({
        success: true,
        data: formattedSlotStatusData?.filter(item => item !== null), // null 값 제거
        slotsData: slotsData, // slots 테이블 데이터도 함께 반환
        userRole: userRole, // 현재 사용자 권한
        userDistributor: userDistributor, // 현재 사용자 소속 총판
        currentUser: currentUser, // 현재 사용자명
      });
    }

    // 기본: slots 테이블 조회 (슬롯 현황 페이지용) - 쿠팡 슬롯 타입만
    let slotsQuery = supabase
      .from('slots')
      .select(
        'id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group'
      )
      .eq('slot_type', '쿠팡') // 쿠팡 슬롯 타입만 필터링
      .order('created_at', { ascending: false });

    // 🔥 권한 기반 필터링 적용 (slots 테이블)
    if (userRole && currentUser) {
      if (userRole === '최고관리자') {
        // 최고관리자: 모든 슬롯 조회 (필터링 없음)
        console.log('🔓 최고관리자 - 모든 슬롯 조회 (slots 테이블)');
      } else if (userRole === '총판회원') {
        // 총판회원: 자신의 슬롯 + 자신을 distributor로 가진 슬롯
        console.log(
          `👥 총판회원 - 자신의 슬롯 + 소속 회원 슬롯 조회 (slots 테이블, 소속: ${userDistributor})`
        );

        // 총판회원의 경우 소속 회원들의 슬롯도 조회해야 하므로
        // 먼저 해당 distributor에 속한 사용자들을 조회
        const { data: distributorUsers } = await supabase
          .from('user_profiles')
          .select('username')
          .eq('distributor', userDistributor);

        if (distributorUsers && distributorUsers.length > 0) {
          const usernames = distributorUsers.map(user => user.username);
          console.log(`📋 소속 회원 목록: ${usernames.join(', ')}`);
          slotsQuery = slotsQuery.in('customer_id', usernames);
        } else {
          // 소속 회원이 없으면 자신의 슬롯만
          slotsQuery = slotsQuery.eq('customer_id', currentUser);
        }
      } else {
        // 일반회원: 자신의 슬롯만
        console.log('👤 일반회원 - 자신의 슬롯만 조회 (slots 테이블)');
        slotsQuery = slotsQuery.eq('customer_id', currentUser);
      }
    }

    // 특정 고객 필터링 (username으로 필터링) - 권한 필터링과 별개로 동작
    if (username) {
      slotsQuery = slotsQuery.eq('customer_id', username);
    }

    const { data: slotsData, error: slotsError } = await slotsQuery;

    if (slotsError) {
      console.error('slots 데이터 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '슬롯 데이터를 불러오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 특정 고객 요청인 경우 해당 고객의 슬롯 현황도 조회
    if (customerId && username) {
      console.log('🔍 특정 고객 슬롯 현황 조회:', { customerId, username });

      // 해당 고객의 슬롯 현황 (이미 username으로 필터링됨)
      const customerSlots = slotsData || [];
      console.log('📊 고객 슬롯 현황:', customerSlots);

      // 1. 모든 slot_status 데이터를 한 번에 조회 (성능 최적화)
      const { data: allSlotStatus } = await supabase
        .from('slot_status')
        .select('slot_sequence, keyword')
        .eq('customer_id', username)
        .in(
          'slot_sequence',
          customerSlots.map(slot => slot.id)
        );

      // 2. slot_sequence별로 사용중인 슬롯 개수 계산
      const usedCountBySlotSequence = new Map();
      if (allSlotStatus) {
        allSlotStatus.forEach(status => {
          if (status.keyword && status.keyword.trim() !== '') {
            const current =
              usedCountBySlotSequence.get(status.slot_sequence) || 0;
            usedCountBySlotSequence.set(status.slot_sequence, current + 1);
          }
        });
      }

      // 3. 각 slot_sequence별로 통계 계산
      const slotSequenceStats = customerSlots.map(slot => {
        // 잔여기간 계산
        const usageDays = slot.usage_days || 0;
        const remainingTime = calculateRemainingTimeKST(
          slot.created_at,
          usageDays
        );
        const isExpired =
          remainingTime.days === 0 &&
          remainingTime.hours === 0 &&
          remainingTime.minutes === 0 &&
          usageDays > 0;
        const isPaused = slot.status === 'inactive';

        // 해당 slot_sequence의 사용 중인 슬롯 개수 (메모리에서 계산)
        const usedCount = isPaused
          ? 0
          : usedCountBySlotSequence.get(slot.id) || 0;

        // 사용 가능한 슬롯 수 계산 (만료되거나 일시중지된 슬롯은 사용 불가)
        let availableSlots = slot.slot_count;
        if (isExpired || isPaused) {
          availableSlots = 0; // 만료되거나 일시중지된 슬롯은 사용 불가
        }

        return {
          slot_sequence: slot.id,
          total_slots: slot.slot_count,
          used_slots: usedCount, // 일시중지된 경우 0
          remaining_slots: availableSlots - usedCount,
          paused_slots: isPaused ? slot.slot_count : 0,
          expired_slots: isExpired ? slot.slot_count : 0,
          available_slots: availableSlots,
        };
      });

      console.log('📊 slot_sequence별 통계:', slotSequenceStats);

      // 전체 통계 계산
      const usedSlots = slotSequenceStats.reduce(
        (sum, stat) => sum + stat.used_slots,
        0
      );
      const pausedSlots = slotSequenceStats.reduce(
        (sum, stat) => sum + stat.paused_slots,
        0
      );
      const expiredSlots = slotSequenceStats.reduce(
        (sum, stat) => sum + stat.expired_slots,
        0
      );
      const availableSlots = slotSequenceStats.reduce(
        (sum, stat) => sum + stat.available_slots,
        0
      );
      const remainingSlots = slotSequenceStats.reduce(
        (sum, stat) => sum + stat.remaining_slots,
        0
      );

      // 총 슬롯 = 활성 상태이면서 만료되지 않은 슬롯만 (일시중지/만료된 슬롯은 총 개수에서 제외)
      const totalSlots = customerSlots
        .filter(slot => {
          if (slot.status !== 'active') return false;

          // 만료 여부 확인
          const usageDays = slot.usage_days || 0;
          const remainingTime = calculateRemainingTimeKST(
            slot.created_at,
            usageDays
          );
          const isExpired =
            remainingTime.days === 0 &&
            remainingTime.hours === 0 &&
            remainingTime.minutes === 0 &&
            usageDays > 0;

          return !isExpired; // 만료되지 않은 슬롯만
        })
        .reduce((sum, slot) => sum + (slot.slot_count || 0), 0);

      console.log('📊 총 통계:', {
        usedSlots,
        pausedSlots,
        expiredSlots,
        availableSlots,
        remainingSlots,
      });

      // 고객 정보 조회 (slots 테이블에서 customer_name 우선 조회)
      let customerName = '';
      let distributor = '일반';

      // slots 테이블에서 customer_name 조회
      if (customerSlots && customerSlots.length > 0) {
        customerName = customerSlots[0].customer_name || '';
        // work_group 대신 user_profiles의 distributor 값을 사용
        // distributor = customerSlots[0].work_group || '일반';
      }

      // customer_name이 없으면 user_profiles 테이블에서 조회
      if (!customerName) {
        try {
          const { data: userData } = await supabase
            .from('user_profiles')
            .select('name, distributor')
            .eq('username', username)
            .single();

          if (userData) {
            customerName = userData.name || '';
            distributor = userData.distributor || '일반';
          }
        } catch (err) {
          console.log('user_profiles 테이블 조회 중 오류 (무시):', err);
        }
      }

      // 항상 user_profiles 테이블에서 distributor 값을 조회
      try {
        const { data: userProfileData } = await supabase
          .from('user_profiles')
          .select('distributor')
          .eq('username', username)
          .single();

        if (userProfileData && userProfileData.distributor) {
          distributor = userProfileData.distributor;
          console.log('✅ user_profiles에서 distributor 조회:', distributor);
        }
      } catch (err) {
        console.log('user_profiles distributor 조회 중 오류 (무시):', err);
      }

      return NextResponse.json({
        success: true,
        data: [
          {
            id: customerId,
            customerId: customerId,
            customerName: customerName,
            slotType: customerSlots[0]?.slot_type || '쿠팡',
            slotCount: totalSlots, // 계산된 총 슬롯 수 (사용중 + 잔여 + 일시중지 + 만료됨)
            usedSlots: usedSlots,
            remainingSlots: remainingSlots,
            pausedSlots: pausedSlots,
            expiredSlots: expiredSlots,
            totalPaymentAmount: customerSlots.reduce(
              (sum, slot) => sum + (slot.payment_amount || 0),
              0
            ),
            remainingDays: customerSlots[0]?.usage_days || 0,
            registrationDate: customerSlots[0]?.payment_date || '',
            expiryDate: customerSlots[0]?.payment_date || '',
            addDate: customerSlots[0]?.payment_date || '',
            status: customerSlots[0]?.status || 'active',
            userGroup: distributor || '일반',
          },
        ],
        stats: {
          totalSlots: totalSlots, // 계산된 총 슬롯 수 (사용중 + 잔여 + 일시중지 + 만료됨)
          usedSlots: usedSlots,
          remainingSlots: remainingSlots,
          pausedSlots: pausedSlots,
          expiredSlots: expiredSlots,
          totalCustomers: 1,
        },
      });
    }

    // 전체 슬롯 현황 조회
    const { data: slotStatusData } = await supabase
      .from('slot_status')
      .select('*')
      .eq('customer_id', username)
      .order('created_at', { ascending: false });

    let filteredData =
      slotsData?.map(slot => {
        // 한국 시간(KST) 기준 잔여기간 계산 (시간대 차이 해결)
        const usageDays = slot.usage_days || 0;

        // 일시중지된 슬롯의 경우 잔여기간을 정지
        let remainingTime;
        let remainingTimeString;

        if (slot.status === 'inactive') {
          // 일시중지된 슬롯: 잔여기간을 정지 상태로 표시
          remainingTime = {
            days: Math.floor(usageDays),
            hours: 0,
            minutes: 0,
            string: `${usageDays}일 (일시중지)`,
          };
          remainingTimeString = `${usageDays}일 (일시중지)`;
        } else {
          // 정상 작동 중인 슬롯: 일반적인 잔여기간 계산
          remainingTime = calculateRemainingTimeKST(slot.created_at, usageDays);
          remainingTimeString = remainingTime.string || '만료됨';
        }

        const remainingDays = remainingTime.days;
        const remainingHours = remainingTime.hours;
        const remainingMinutes = remainingTime.minutes;

        // 등록일과 만료일 계산 (한국 시간 기준)
        const createdDateKST = new Date(slot.created_at);
        const expiryDateKST = new Date(
          createdDateKST.getTime() + usageDays * 24 * 60 * 60 * 1000
        );

        const formatLocalDate = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        };

        const registrationDate = formatLocalDate(createdDateKST);
        const expiryDateString =
          usageDays > 0 ? formatLocalDate(expiryDateKST) : '';

        // 만료 상태 확인 (잔여 시간이 0이면 만료)
        const isExpired =
          remainingDays === 0 &&
          remainingHours === 0 &&
          remainingMinutes === 0 &&
          usageDays > 0;

        return {
          id: slot.id,
          customerId: slot.customer_id,
          customerName: slot.customer_name || '', // customer_name 필드 사용
          slotType: slot.slot_type || '쿠팡',
          slotCount: slot.slot_count || 1,
          usedSlots: 0, // slot_status 테이블에서 계산
          remainingSlots: slot.slot_count || 1,
          pausedSlots: 0,
          totalPaymentAmount: slot.payment_amount || 0,
          remainingDays: remainingDays,
          remainingHours: remainingHours,
          remainingMinutes: remainingMinutes,
          remainingTimeString: remainingTimeString,
          registrationDate: registrationDate,
          expiryDate: expiryDateString,
          addDate: slot.created_at
            ? new Date(slot.created_at).toISOString().split('T')[0]
            : '',
          status: isExpired ? 'expired' : slot.status,
          userGroup:
            distributorMap.get(slot.customer_id) || slot.work_group || '일반',
        };
      }) || [];

    // 검색 필터링
    if (searchQuery) {
      filteredData = filteredData.filter(
        slot =>
          slot.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
          slot.customerName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return NextResponse.json({
      success: true,
      data: filteredData,
      userRole: userRole, // 현재 사용자 권한
      userDistributor: userDistributor, // 현재 사용자 소속 총판
      currentUser: currentUser, // 현재 사용자명
    });
  } catch (error) {
    console.error('슬롯 현황 조회 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 등록 (개별 슬롯 할당 로직)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 개별 슬롯 할당 처리 중...');

    const body = await request.json();
    console.log('받은 데이터:', body);

    // 필수 필드 검증
    const requiredFields = [
      'customer_id',
      'customer_name',
      'keyword',
      'link_url',
      'slot_count',
    ];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `필수 필드가 누락되었습니다: ${field}` },
          { status: 400 }
        );
      }
    }

    const customerId = body.customer_id;
    const requestedSlotCount = parseInt(body.slot_count) || 1;

    console.log(
      `🎯 고객 ${customerId}에게 ${requestedSlotCount}개 슬롯 할당 요청`
    );

    // 🔥 사용자의 실제 distributor 정보 조회
    const { data: userProfile, error: userProfileError } = await supabase
      .from('user_profiles')
      .select('username, distributor')
      .eq('username', customerId)
      .single();

    if (userProfileError || !userProfile) {
      console.error('사용자 프로필 조회 오류:', userProfileError);
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(
      `👤 사용자 ${customerId}의 소속 총판: ${userProfile.distributor}`
    );

    // 1. slots 테이블에서 해당 고객의 쿠팡 슬롯만 조회 (usage_days 내림차순)
    // 일시중지된 슬롯도 포함하여 조회 (재등록 시 사용 가능)
    const { data: availableSlots, error: slotsError } = await supabase
      .from('slots')
      .select(
        'id, customer_id, customer_name, slot_type, slot_count, payment_type, payer_name, payment_amount, payment_date, usage_days, memo, status, created_at, updated_at, work_group, keyword, link_url, equipment_group'
      )
      .eq('customer_id', customerId)
      .eq('slot_type', '쿠팡') // 쿠팡 슬롯 타입만 조회
      .in('status', ['active', 'inactive']) // active와 inactive 모두 포함
      .order('usage_days', { ascending: false }); // 잔여기간이 긴 순서로 정렬

    if (slotsError) {
      console.error('사용 가능한 슬롯 조회 오류:', slotsError);
      return NextResponse.json(
        { error: '사용 가능한 슬롯을 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!availableSlots || availableSlots.length === 0) {
      console.log('❌ 할당 가능한 슬롯이 없습니다.');
      return NextResponse.json(
        { error: '할당 가능한 슬롯이 없습니다.' },
        { status: 400 }
      );
    }

    // 만료된 슬롯 필터링 (실제로 사용 가능한 슬롯만 남김)
    // 일시중지된 슬롯은 만료되지 않았다면 사용 가능
    const validSlots = availableSlots.filter(slot => {
      const usageDays = slot.usage_days || 0;
      const remainingTime = calculateRemainingTimeKST(
        slot.created_at,
        usageDays
      );
      const isExpired =
        remainingTime.days === 0 &&
        remainingTime.hours === 0 &&
        remainingTime.minutes === 0 &&
        usageDays > 0;
      const isPaused = slot.status === 'inactive';

      if (isExpired) {
        console.log(`⚠️ 슬롯 ${slot.id}는 만료되어 사용할 수 없습니다.`);
        return false;
      }

      if (isPaused) {
        console.log(`✅ 슬롯 ${slot.id}는 일시중지되었지만 재등록 가능합니다.`);
        return true; // 일시중지된 슬롯도 재등록 가능
      }

      return true;
    });

    if (validSlots.length === 0) {
      console.log('❌ 모든 슬롯이 만료되어 사용할 수 없습니다.');
      return NextResponse.json(
        {
          error:
            '모든 슬롯이 만료되어 사용할 수 없습니다. 슬롯을 연장해주세요.',
        },
        { status: 400 }
      );
    }

    console.log(
      `✅ 사용 가능한 슬롯: ${validSlots.length}개 (만료된 슬롯: ${availableSlots.length - validSlots.length}개)`
    );

    console.log('📊 사용 가능한 슬롯 목록:', validSlots);

    // 1.5. 현재 사용 중인 슬롯 수 확인 (키워드가 있는 레코드만, 일시중지된 슬롯 제외)
    const { data: currentSlotStatus } = await supabase
      .from('slot_status')
      .select('slot_count, keyword, slot_sequence')
      .eq('customer_id', customerId)
      .not('keyword', 'eq', ''); // 키워드가 비어있지 않은 레코드만

    // 일시중지된 슬롯의 사용중 개수는 0으로 계산
    let currentUsedSlots = 0;
    if (currentSlotStatus && currentSlotStatus.length > 0) {
      for (const slot of currentSlotStatus) {
        // 해당 slot_sequence의 slots 테이블 상태 확인
        const matchingSlot = validSlots.find(s => s.id === slot.slot_sequence);
        if (matchingSlot && matchingSlot.status === 'active') {
          // 정상 작동 중인 슬롯만 사용중으로 계산
          currentUsedSlots += slot.slot_count || 0;
        }
        // 일시중지된 슬롯(status === 'inactive')은 사용중에서 제외
      }
    }
    const totalAvailableSlots = validSlots.reduce(
      (sum, slot) => sum + (slot.slot_count || 0),
      0
    );
    const remainingAvailableSlots = totalAvailableSlots - currentUsedSlots;

    console.log('📊 슬롯 현황:', {
      총사용가능: totalAvailableSlots,
      현재사용중: currentUsedSlots,
      남은사용가능: remainingAvailableSlots,
      요청슬롯수: requestedSlotCount,
    });

    if (remainingAvailableSlots < requestedSlotCount) {
      return NextResponse.json(
        {
          error: `사용 가능한 슬롯이 부족합니다. (사용 가능: ${remainingAvailableSlots}개, 요청: ${requestedSlotCount}개)`,
        },
        { status: 400 }
      );
    }

    // 2. 기존 slot_status 레코드 업데이트 (새 레코드 생성 방지)
    console.log('🔄 기존 slot_status 레코드 업데이트 시작...');

    // 기존 빈 레코드들 조회 (키워드가 비어있는 레코드)
    const { data: emptySlotStatus, error: emptySlotError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('customer_id', customerId)
      .eq('keyword', '')
      .order('slot_sequence', { ascending: true })
      .limit(requestedSlotCount);

    if (emptySlotError) {
      console.error('빈 slot_status 레코드 조회 오류:', emptySlotError);
      return NextResponse.json(
        { error: '기존 슬롯 레코드를 조회하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log(`📊 조회된 빈 레코드 수: ${emptySlotStatus?.length || 0}개`);

    if (!emptySlotStatus || emptySlotStatus.length < requestedSlotCount) {
      return NextResponse.json(
        {
          error: `작업등록 가능한 슬롯이 부족합니다. (사용 가능: ${emptySlotStatus?.length || 0}개, 요청: ${requestedSlotCount}개)`,
        },
        { status: 400 }
      );
    }

    // 요청된 수만큼 기존 레코드 업데이트 (잔여기간, 등록일, 만료일 보존)
    const updatePromises = [];
    for (let i = 0; i < requestedSlotCount; i++) {
      const existingRecord = emptySlotStatus[i];

      const updateData = {
        distributor: userProfile.distributor || '일반', // ✅ 실제 사용자 distributor 사용
        work_group: body.work_group || '공통',
        keyword: body.keyword,
        link_url: body.link_url,
        current_rank: body.current_rank || '',
        start_rank: body.start_rank || '',
        traffic: body.traffic || '0 (0/0)',
        equipment_group: body.equipment_group || '지정안함',
        status: body.status || '작동중',
        memo: body.memo || '',
        slot_type: body.slot_type || '쿠팡',
        slot_sequence: existingRecord.slot_sequence || i + 1, // 기존 slot_sequence 보존, 없으면 순번 생성
        updated_at: getTimestampWithoutMs(), // 업데이트 시간 추가
        // usage_days, created_at, expiry_date는 보존 (변경하지 않음)
      };

      updatePromises.push(
        supabase
          .from('slot_status')
          .update(updateData)
          .eq('id', existingRecord.id)
          .select()
      );
    }

    console.log(`📝 ${requestedSlotCount}개 레코드 업데이트 중...`);

    const updateResults = await Promise.all(updatePromises);

    // 업데이트 결과 확인
    let successCount = 0;
    const errors: string[] = [];

    updateResults.forEach((result, index) => {
      if (result.error) {
        console.error(`레코드 ${index + 1} 업데이트 실패:`, result.error);
        errors.push(result.error.message || 'Unknown error');
      } else {
        successCount++;
        console.log(`✅ 레코드 ${index + 1} 업데이트 성공`);
      }
    });

    if (successCount === 0) {
      return NextResponse.json(
        { error: '모든 슬롯 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    console.log(
      `✅ ${successCount}/${requestedSlotCount}개 레코드 업데이트 성공`
    );

    // 업데이트된 레코드들 조회
    const { data: updatedSlotStatus, error: selectError } = await supabase
      .from('slot_status')
      .select('*')
      .eq('customer_id', customerId)
      .eq('keyword', body.keyword)
      .order('slot_sequence', { ascending: true });

    if (selectError) {
      console.error('업데이트된 레코드 조회 오류:', selectError);
    }

    // 3. keywords 테이블에 키워드 정보 저장 (각 슬롯별로 개별 레코드 생성)
    if (body.keyword && updatedSlotStatus && updatedSlotStatus.length > 0) {
      try {
        // current_rank에서 숫자만 추출 (예: "5 [3]" -> 5)
        const extractRankNumber = (rankStr: string) => {
          if (!rankStr) return 1;
          const match = rankStr.match(/^(\d+)/);
          return match ? parseInt(match[1]) : 1;
        };

        // 각 슬롯별로 keywords 테이블에 개별 레코드 생성
        const keywordRecords = updatedSlotStatus.map(slot => ({
          keyword: body.keyword,
          link_url: body.link_url,
          slot_type: body.slot_type || '쿠팡',
          slot_count: 1, // 각 레코드는 1개 슬롯을 의미
          current_rank: extractRankNumber(body.current_rank),
          slot_sequence: slot.slot_sequence, // slot_status의 순번을 그대로 사용
          customer_id: customerId, // 고객 ID 추가
          slot_id: slot.id, // slot_status 레코드 ID를 slot_id로 사용
        }));

        console.log(`📝 ${keywordRecords.length}개 키워드 레코드 생성 중...`);

        // keywords 테이블에 저장
        const { error: keywordError } = await supabase
          .from('keywords')
          .insert(keywordRecords);

        if (keywordError) {
          console.error('keywords 테이블 삽입 오류:', keywordError);
          // keywords 삽입 실패해도 슬롯 등록은 성공으로 처리
        } else {
          console.log(
            `✅ keywords 테이블에 ${keywordRecords.length}개 레코드 삽입 성공`
          );
        }

        // traffic 테이블에도 동일한 데이터 저장 (keywords와 완전히 동일한 구조)
        const trafficRecords = updatedSlotStatus.map(slot => ({
          keyword: body.keyword,
          link_url: body.link_url,
          slot_type: body.slot_type || '쿠팡',
          slot_count: 1, // 각 레코드는 1개 슬롯을 의미
          current_rank: extractRankNumber(body.current_rank),
          last_check_date: null, // keywords와 동일하게 null
          created_at: null, // keywords와 동일하게 null
          updated_at: null, // keywords와 동일하게 null
          slot_sequence: slot.slot_sequence, // slot_status의 순번을 그대로 사용
          customer_id: customerId, // 고객 ID 추가
          slot_id: slot.id, // slot_status 레코드 ID를 slot_id로 사용
        }));

        console.log(`📝 ${trafficRecords.length}개 traffic 레코드 생성 중...`);

        const { error: trafficError } = await supabase
          .from('traffic')
          .insert(trafficRecords);

        if (trafficError) {
          console.error('traffic 테이블 삽입 오류:', trafficError);
          // traffic 삽입 실패해도 슬롯 등록은 성공으로 처리
        } else {
          console.log(
            `✅ traffic 테이블에 ${trafficRecords.length}개 레코드 삽입 성공`
          );
        }
      } catch (err) {
        console.error('keywords 테이블 처리 중 오류:', err);
        // keywords 처리 실패해도 슬롯 등록은 성공으로 처리
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedSlotStatus,
      message: `${requestedSlotCount}개 슬롯이 성공적으로 등록되었습니다.`,
    });
  } catch (error) {
    console.error('슬롯 등록 API 예외 발생:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
