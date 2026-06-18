import React, { useState, useEffect, useMemo } from "react";
// ... (기존 import들 동일) ...
import { OrderRecord } from "./types";
import { INITIAL_RECORDS, generateRandomId } from "./utils";

export default function App() {
  const [records, setRecords] = useState<OrderRecord[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/orders');
        const data = await response.json();
        
        console.log("서버에서 받은 원본 데이터:", data); // F12 콘솔에서 이 로그를 반드시 확인하세요!

        if (Array.isArray(data) && data.length > 0) {
          // 데이터가 헤더(첫 줄)를 포함하고 있다면 slice(1)로 제거
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
          console.warn("데이터가 비어있거나 형식 오류입니다.");
          setRecords(INITIAL_RECORDS); // 데이터 없으면 샘플이라도 보여줌
        }
      } catch (err) {
        console.error("데이터 로드 실패:", err);
      }
    }
    fetchData();
  }, []);

  // ... (이후 렌더링 코드 동일) ...
}
