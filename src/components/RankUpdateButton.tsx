'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

interface RankUpdateButtonProps {
  username: string | null;
  customerId: string | null;
  slotType: string | null;
  customers: any[];
  selectedCustomers?: Set<number>; // 🔥 선택된 슬롯 ID 목록
  onRankUpdate: (count: number) => void;
}

export default function RankUpdateButton({
  username,
  customerId,
  slotType,
  customers,
  selectedCustomers,
  onRankUpdate,
}: RankUpdateButtonProps) {
  // 🔥 초기 상태를 null로 설정하여 체크 완료 전까지는 아무것도 렌더링하지 않음
  const [rankUpdateCooldown, setRankUpdateCooldown] = useState<number | null>(
    null
  );
  const [isButtonDisabled, setIsButtonDisabled] = useState<boolean | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  // 🔥 username이 실제로 있는지 확인 (customers에서도 추출 가능)
  const actualUsernameForCooldown =
    username ||
    customers[0]?.customerId ||
    customers[0]?.customer_id ||
    customers[0]?.customer ||
    null;

  // 🔥 컴포넌트 마운트 시 즉시 동기적으로 localStorage 체크
  useEffect(() => {
    // username이 없으면 즉시 활성화 (쿨다운 체크 불가)
    if (!actualUsernameForCooldown) {
      setRankUpdateCooldown(0);
      setIsButtonDisabled(false);
      return;
    }

    const storageKey = `rankUpdateCooldown_${actualUsernameForCooldown}`;
    const COOLDOWN_TIME = 60 * 60 * 1000; // 1시간 (밀리초)

    // 🔥 즉시 동기적으로 localStorage 체크 (비동기 작업 전에)
    const checkLocalStorage = () => {
      const lastClickTime = localStorage.getItem(storageKey);
      if (!lastClickTime) {
        return 0;
      }

      const timePassed = Date.now() - parseInt(lastClickTime);
      const remainingTime = COOLDOWN_TIME - timePassed;

      if (remainingTime > 0) {
        return Math.ceil(remainingTime / 1000);
      } else {
        localStorage.removeItem(storageKey);
        return 0;
      }
    };

    // 🔥 즉시 로컬 스토리지 체크하여 상태 설정
    const immediateCooldown = checkLocalStorage();
    if (immediateCooldown > 0) {
      // 쿨다운이 있으면 즉시 비활성화
      setRankUpdateCooldown(immediateCooldown);
      setIsButtonDisabled(true);
    } else {
      // 쿨다운이 없으면 서버 확인 전까지는 비활성화 상태 유지
      setRankUpdateCooldown(0);
      setIsButtonDisabled(true); // 서버 확인 후 활성화
    }

    // 서버 쿨다운 체크 (비동기)
    const checkServerCooldown = async () => {
      let serverCooldown = 0;
      try {
        const response = await fetch(
          `/api/rank-update/cooldown?username=${encodeURIComponent(actualUsernameForCooldown)}`
        );
        const result = await response.json();

        if (result.success && result.cooldownRemaining) {
          serverCooldown = Math.ceil(result.cooldownRemaining);
        }
      } catch (error) {
        console.error('쿨다운 정보 조회 오류:', error);
      }

      // 로컬 스토리지 재체크
      const updatedLocalCooldown = checkLocalStorage();
      const finalCooldown = Math.max(updatedLocalCooldown, serverCooldown);

      setRankUpdateCooldown(finalCooldown);
      setIsButtonDisabled(finalCooldown > 0);

      // DOM 레벨에서도 비활성화
      if (buttonRef.current) {
        buttonRef.current.disabled = finalCooldown > 0;
      }
    };

    // 서버 쿨다운 체크 실행
    checkServerCooldown();

    // 1초마다 쿨다운 업데이트
    const interval = setInterval(() => {
      const currentCooldown = checkLocalStorage();
      if (currentCooldown > 0) {
        setRankUpdateCooldown(currentCooldown);
        setIsButtonDisabled(true);
        if (buttonRef.current) {
          buttonRef.current.disabled = true;
        }
      } else {
        checkServerCooldown();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [actualUsernameForCooldown]);

  const getRemainingCooldown = () => {
    if (rankUpdateCooldown === null || rankUpdateCooldown === 0) return '0:00';
    const minutes = Math.floor(rankUpdateCooldown / 60);
    const seconds = rankUpdateCooldown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleRankUpdate = async () => {
    // 🔥 선택된 슬롯 필터링 (먼저 필터링하여 슬롯 정보 확인)
    const slotsToUpdate =
      selectedCustomers && selectedCustomers.size > 0
        ? customers.filter(customer => selectedCustomers.has(customer.id))
        : customers;

    if (slotsToUpdate.length === 0) {
      if (selectedCustomers && selectedCustomers.size > 0) {
        alert(
          '순위갱신할 슬롯이 선택되지 않았습니다. 체크박스를 선택해주세요.'
        );
      } else {
        alert('등록된 슬롯이 없습니다.');
      }
      return;
    }

    // 🔥 username 추출: searchParams > customers 배열 > 선택된 슬롯 순서로 시도
    const firstSlot = slotsToUpdate[0];
    const actualUsername =
      username ||
      customers[0]?.customerId ||
      customers[0]?.customer_id ||
      customers[0]?.customer ||
      firstSlot?.customerId ||
      firstSlot?.customer_id ||
      firstSlot?.customer ||
      null;

    if (!actualUsername) {
      console.error('🔴 username을 찾을 수 없습니다.');
      console.error('🔴 searchParams username:', username);
      console.error('🔴 첫 번째 슬롯 데이터:', firstSlot);
      console.error('🔴 customers[0] 데이터:', customers[0]);
      alert(
        `고객 정보를 찾을 수 없습니다.\n\nURL에 username 파라미터가 있는지 확인해주세요.\n\n예: ?username=testuser`
      );
      return;
    }

    // 🔥 즉시 localStorage를 다시 체크 (클라이언트에서 우회 방지)
    const storageKey = `rankUpdateCooldown_${actualUsername}`;
    const COOLDOWN_TIME = 60 * 60 * 1000;
    const lastClickTime = localStorage.getItem(storageKey);
    if (lastClickTime) {
      const timePassed = Date.now() - parseInt(lastClickTime);
      const remainingTime = COOLDOWN_TIME - timePassed;
      if (remainingTime > 0) {
        const minutes = Math.floor(remainingTime / 60000);
        const seconds = Math.floor((remainingTime % 60000) / 1000);
        alert(
          `순위갱신은 1시간마다 사용할 수 있습니다.\n남은 시간: ${minutes}분 ${seconds}초`
        );
        // 상태도 즉시 업데이트
        const cooldownSeconds = Math.ceil(remainingTime / 1000);
        setRankUpdateCooldown(cooldownSeconds);
        setIsButtonDisabled(true);
        if (buttonRef.current) {
          buttonRef.current.disabled = true;
        }
        return;
      }
    }

    // 🔥 추가 안전장치: 상태가 초기화되지 않았으면 차단
    if (rankUpdateCooldown === null || isButtonDisabled === null) {
      alert('순위갱신 기능을 준비하는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    if (
      isButtonDisabled ||
      (rankUpdateCooldown !== null && rankUpdateCooldown > 0)
    ) {
      const minutes =
        rankUpdateCooldown !== null ? Math.floor(rankUpdateCooldown / 60) : 0;
      const seconds = rankUpdateCooldown !== null ? rankUpdateCooldown % 60 : 0;
      alert(
        `순위갱신은 1시간마다 사용할 수 있습니다.\n남은 시간: ${minutes}분 ${seconds}초`
      );
      return;
    }

    // 🔥 실제 데이터베이스 ID 사용 (db_id 우선, 없으면 id)
    const slotIds = slotsToUpdate
      .map(customer => {
        // db_id가 있으면 db_id 사용, 없으면 id 사용
        return customer.db_id || customer.id;
      })
      .filter(id => id !== null && id !== undefined); // null/undefined 제거

    if (slotIds.length === 0) {
      alert('유효한 슬롯 ID를 찾을 수 없습니다.');
      return;
    }

    const confirmMessage =
      selectedCustomers && selectedCustomers.size > 0
        ? `선택된 ${slotIds.length}개의 슬롯을 순위갱신 하시겠습니까?`
        : `${slotIds.length}개의 슬롯을 순위갱신 하시겠습니까?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // 즉시 버튼 비활성화 및 로컬 스토리지에 클릭 시간 저장
    setIsButtonDisabled(true);
    const currentTime = Date.now();
    // storageKey는 위에서 이미 정의되었으므로 재사용
    localStorage.setItem(storageKey, currentTime.toString());
    setRankUpdateCooldown(3600); // 1시간 = 3600초

    try {
      console.log('🔵 순위갱신 요청 데이터:', {
        username: actualUsername,
        slotType: slotType || '쿠팡',
        slotIds,
        slotIdsLength: slotIds.length,
        customersLength: customers.length,
      });

      const response = await fetch('/api/rank-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: customerId || null, // customerId가 없어도 처리 가능하도록
          slotType: slotType || '쿠팡',
          username: actualUsername, // 🔥 실제 username 사용
          slotIds: slotIds.length < customers.length ? slotIds : undefined, // 🔥 선택된 슬롯 ID 전달 (전체면 undefined)
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert(`✅ ${result.count}개의 슬롯이 순위갱신 될 예정입니다.`);
        onRankUpdate(result.count);

        // 서버에서 쿨다운이 설정되었으므로 즉시 다시 조회
        const cooldownResponse = await fetch(
          `/api/rank-update/cooldown?username=${encodeURIComponent(actualUsername)}`
        );
        const cooldownResult = await cooldownResponse.json();
        if (cooldownResult.success && cooldownResult.cooldownRemaining) {
          const serverCooldown = Math.ceil(cooldownResult.cooldownRemaining);
          setRankUpdateCooldown(Math.max(3600, serverCooldown));
        } else {
          setRankUpdateCooldown(3600);
        }
      } else {
        if (result.cooldownRemaining !== undefined) {
          const serverCooldown = Math.ceil(result.cooldownRemaining);
          setRankUpdateCooldown(Math.max(3600, serverCooldown));
        } else {
          setRankUpdateCooldown(3600);
        }
        alert(`❌ 순위갱신 실패: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('순위갱신 오류:', error);
      alert('순위갱신 중 오류가 발생했습니다.');
      setRankUpdateCooldown(3600);
    }
  };

  // 🔥 상태가 아직 초기화되지 않았으면 비활성화된 버튼만 렌더링
  if (rankUpdateCooldown === null || isButtonDisabled === null) {
    return (
      <Button
        disabled
        variant="outline"
        size="sm"
        className="min-w-[120px]"
        style={{ pointerEvents: 'none', cursor: 'not-allowed' }}
      >
        순위갱신
      </Button>
    );
  }

  // 상태 초기화 완료 후 실제 버튼 렌더링
  const selectedCount = selectedCustomers?.size || 0;
  const hasSlots = customers.length > 0;
  const isDisabled =
    isButtonDisabled ||
    (rankUpdateCooldown !== null && rankUpdateCooldown > 0) ||
    (selectedCount === 0 && hasSlots); // 🔥 선택된 것이 없고 슬롯이 있으면 비활성화

  // 버튼 텍스트 설정
  const buttonText = isDisabled
    ? `순위갱신${rankUpdateCooldown !== null && rankUpdateCooldown > 0 ? ` (${getRemainingCooldown()})` : ''}`
    : selectedCount > 0
      ? `순위갱신 (${selectedCount}개)`
      : '순위갱신';

  return (
    <Button
      ref={buttonRef}
      onClick={handleRankUpdate}
      disabled={isDisabled}
      variant="outline"
      size="sm"
      className="min-w-[120px]"
      style={{
        pointerEvents: isDisabled ? 'none' : 'auto',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.6 : 1,
      }}
      aria-disabled={isDisabled}
      title={
        selectedCount === 0 && hasSlots ? '순위갱신할 슬롯을 선택해주세요' : ''
      }
    >
      {buttonText}
    </Button>
  );
}
