import React, { useState, useEffect } from "react";
import { OrderRecord } from "./types";
import { INITIAL_RECORDS, generateRandomId } from "./utils";
// ... (나머지 import들은 그대로 유지하세요)

export default function App() {
  const [records, setRecords] = useState<OrderRecord[]>([]);

  useEffect(() => {
    fetch('/api/orders')
      .then(res => {
        if (!res.ok) throw new Error("서버 응답 오류");
        return res.json();
      })
      .then((data: any[][]) => {
        if (Array.isArray(data) && data.length > 0) {
          const rows = (data[0][0] === "구매자명") ? data.slice(1) : data;
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
          setRecords(INITIAL_RECORDS);
        }
      })
      .catch(err => {
        console.error("데이터 로드 실패:", err);
        setRecords(INITIAL_RECORDS);
      });
  }, []);

  // ... (이후 렌더링을 위한 나머지 코드들은 기존 App.tsx 내용을 그대로 유지하세요)
}
