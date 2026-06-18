/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator, Plus, Sparkles, Download, ChevronLeft, ChevronRight,
  ShoppingBag, Info, Sun, Moon, Save, GripVertical, Copy,
} from "lucide-react";
import { OrderRecord, calculateGrossRevenue, calculateNetProfit } from "./types";
import { INITIAL_RECORDS, formatWonValueOnly, generateRandomId, generateOrderNumber } from "./utils";
import { EditableCell } from "./components/EditableCell";
import { AnalysisModal } from "./components/AnalysisModal";

export default function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => (localStorage.getItem("ecommerce_margin_theme") as "light" | "dark") || "light");
  const [records, setRecords] = useState<OrderRecord[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(6);
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("ALL");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // 서버에서 데이터 가져오기
  useEffect(() => {
    fetch('/api/orders')
      .then(res => res.json())
      .then((data: any[][]) => {
        // 구글 시트 2차원 배열 데이터를 OrderRecord 객체로 변환
        const formattedRecords = data.map((row) => ({
          id: generateRandomId(),
          buyerName: row[0] || "",
          orderDate: row[1] || "",
          orderNumber: row[2] || "",
          productName: row[3] || "",
          saleAmount: Number(row[4]) || 0,
          shippingRevenue: Number(row[5]) || 0,
          productCost: Number(row[6]) || 0,
          shippingExpense: Number(row[7]) || 0,
          adSpend: Number(row[8]) || 0,
          commissionFee: Number(row[9]) || 0,
          linkedFee: Number(row[10]) || 0,
          discountAmount: Number(row[11]) || 0,
          otherExpenses: Number(row[12]) || 0,
        }));
        setRecords(formattedRecords.length > 0 ? formattedRecords : INITIAL_RECORDS);
      })
      .catch(err => {
        console.error("데이터 로드 실패:", err);
        setRecords(INITIAL_RECORDS);
      });
  }, []);

  // 테마 및 기타 로직은 유지...
  useEffect(() => {
    localStorage.setItem("ecommerce_margin_theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const handleUpdateRecord = (id: string, field: keyof OrderRecord, value: any) => {
    setRecords(prev => prev.map(r => r.id !== id ? r : { ...r, [field]: value }));
  };

  const displayedRecords = useMemo(() => {
    return records.filter(r => {
      if (!r.orderDate) return false;
      const parts = r.orderDate.split("-");
      const y = parseInt(parts[0], 10) + 2000;
      const m = parseInt(parts[1], 10);
      return y === selectedYear && m === selectedMonth;
    });
  }, [records, selectedYear, selectedMonth]);

  const totals = useMemo(() => {
    return displayedRecords.reduce((acc, r) => ({
      salesAmtSum: acc.salesAmtSum + (r.saleAmount || 0),
      productCostSum: acc.productCostSum + (r.productCost || 0),
      shippingExpSum: acc.shippingExpSum + (r.shippingExpense || 0),
      grossRevenueSum: acc.grossRevenueSum + calculateGrossRevenue(r),
      netProfitSum: acc.netProfitSum + calculateNetProfit(r),
    }), { salesAmtSum: 0, productCostSum: 0, shippingExpSum: 0, grossRevenueSum: 0, netProfitSum: 0 });
  }, [displayedRecords]);

  // (아래 렌더링 부분은 기존과 동일하게 유지하시면 됩니다. 
  // 위 useEffect와 setRecords 변환 로직이 핵심입니다.)
  
  return (
    // ... 기존 return JSX 코드 그대로 사용 ...
  );
}
