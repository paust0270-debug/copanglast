const testData = {
  customerId: "fea25adc-5b0b-4de2-8182-63ebf5d4e2ed",
  customerName: "김주영",
  slotType: "coupang",
  slotCount: 5,
  paymentType: "deposit",
  payerName: "테스트입금자",
  paymentAmount: 250000,
  paymentDate: "2025-09-16",
  usageDays: 30,
  memo: "테스트 슬롯"
};

fetch('http://localhost:3000/api/slots', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(testData)
})
.then(response => response.json())
.then(data => {
  console.log('슬롯 추가 결과:', data);
  
  // 미정산 내역 확인
  return fetch('http://localhost:3000/api/settlements/unsettled');
})
.then(response => response.json())
.then(data => {
  console.log('미정산 내역:', data);
})
.catch(error => {
  console.error('오류:', error);
});
