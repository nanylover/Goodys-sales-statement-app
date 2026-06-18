import React, { useState, useEffect } from "react";
import { OrderRecord } from "./types";
import { generateRandomId } from "./utils";
// ... (기존에 사용하던 나머지 import문들은 그대로 유지하세요)

export default function App() {
  const [records, setRecords] = useState<OrderRecord[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then((data: any[][]) => {
        // 첫 행이 헤더인 경우 제외
        const rows = (data.length > 0 && data[0][0] === "구매자명") ? data.slice(1) : data;
        
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
      })
      .catch(err => console.error("데이터 로드 실패:", err));
  }, []);

  // ... (기존 App 컴포넌트 내부의 나머지 JSX와 함수들은 그대로 두세요)
}
