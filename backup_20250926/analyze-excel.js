const XLSX = require('xlsx');
const path = require('path');

// 엑셀 파일 경로
const excelPath = 'C:\\Users\\qkrwn\\Desktop\\1.판다 고객_대량등록_양식.xlsx';

try {
  console.log('🔄 엑셀 파일 분석 시작...');
  console.log('파일 경로:', excelPath);
  
  // 파일 존재 확인
  const fs = require('fs');
  if (!fs.existsSync(excelPath)) {
    console.error('❌ 파일이 존재하지 않습니다:', excelPath);
    process.exit(1);
  }
  
  console.log('✅ 파일 존재 확인 완료');
  
  // 엑셀 파일 읽기
  const workbook = XLSX.readFile(excelPath);
  console.log('✅ 엑셀 파일 읽기 완료');
  
  // 시트 이름 확인
  console.log('시트 이름들:', workbook.SheetNames);
  
  // 첫 번째 시트 선택
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  // 시트를 JSON으로 변환
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  console.log('총 행 수:', jsonData.length);
  console.log('첫 5행 데이터:');
  jsonData.slice(0, 5).forEach((row, index) => {
    console.log(`행 ${index + 1}:`, row);
  });
  
  // 헤더 확인
  if (jsonData.length > 0) {
    const header = jsonData[0];
    console.log('헤더:', header);
    console.log('헤더 컬럼 수:', header.length);
  }
  
  // 데이터 행 확인
  const dataRows = jsonData.slice(1);
  console.log('데이터 행 수:', dataRows.length);
  
  // 각 데이터 행 분석
  dataRows.forEach((row, index) => {
    const rowNumber = index + 2;
    console.log(`\n=== 행 ${rowNumber} 분석 ===`);
    console.log('원본 데이터:', row);
    console.log('컬럼 수:', row.length);
    
    if (row.length >= 6) {
      const [no, distributor, username, name, phone, joinDate, slotCount] = row;
      console.log('파싱된 데이터:', {
        no, distributor, username, name, phone, joinDate, slotCount
      });
      
      // 필수 필드 검증
      if (!username || !name || username.toString().trim() === '' || name.toString().trim() === '') {
        console.log('❌ 필수 필드 누락:', { username, name });
      } else {
        console.log('✅ 필수 필드 확인 완료');
      }
    } else {
      console.log('❌ 컬럼 수 부족 (필요: 6개, 실제:', row.length, '개)');
    }
  });
  
  console.log('\n🎉 엑셀 파일 분석 완료!');
  
} catch (error) {
  console.error('❌ 엑셀 파일 분석 중 오류:', error);
}

