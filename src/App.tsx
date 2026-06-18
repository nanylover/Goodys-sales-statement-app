import React, { useState, useEffect, useMemo } from "react";
// ... (기존 import문 동일하게 유지)

export default function App() {
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태 추가

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const response = await fetch('/api/orders');
        if (!response.ok) throw new Error(`서버 에러: ${response.status}`);
        
        const data = await response.json();
        console.log("서버에서 받은 원본 데이터:", data); // F12 콘솔창에서 꼭 확인하세요!

        if (Array.isArray(data) && data.length > 0) {
          // 데이터가 헤더(첫 줄)를 포함하고 있다면 slice(1)로 제거 후 변환
          const rows = data[0][0] === "구매자명" ? data.slice(1) : data;
          
          const formatted = rows.map((row: any[]) => ({
            id: generateRandomId(),
            buyerName: row[0] || "",
            orderDate: row[1] || "",
            orderNumber: row[2] || "",
            productName: row[3] || "",
            saleAmount: Number(row[4] || 0),
            shippingRevenue: Number(row[5] || 0),
            productCost: Number(row[6] || 0),
            shippingExpense: Number(row[7] || 0),
            adSpend: Number(row[8] || 0),
            commissionFee: Number(row[9] || 0),
            linkedFee: Number(row[10] || 0),
            discountAmount: Number(row[11] || 0),
            otherExpenses: Number(row[12] || 0),
          }));
          setRecords(formatted);
        } else {
          console.warn("데이터가 비어있습니다. 샘플 데이터를 사용합니다.");
          setRecords(INITIAL_RECORDS);
        }
      } catch (err) {
        console.error("데이터 불러오기 실패:", err);
        setRecords(INITIAL_RECORDS); // 에러나면 샘플이라도 보여줌
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // ... (나머지 JSX 렌더링 코드 동일)
}
