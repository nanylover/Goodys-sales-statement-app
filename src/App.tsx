/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Calculator,
  Plus,
  Trash2,
  Sparkles,
  Download,
  RotateCcw,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Info,
  Sun,
  Moon,
  Coins,
  ArrowRight,
  UserCheck,
  Save,
  GripVertical,
  Copy,
} from "lucide-react";
import { OrderRecord, calculateGrossRevenue, calculateExpenses, calculateNetProfit } from "./types";
import { INITIAL_RECORDS, formatWon, formatWonValueOnly, generateRandomId, generateOrderNumber } from "./utils";
import { EditableCell } from "./components/EditableCell";
import { AnalysisModal } from "./components/AnalysisModal";

export default function App() {
  // 0. Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("ecommerce_margin_theme");
    return (savedTheme as "light" | "dark") || "light";
  });

  useEffect(() => {
    localStorage.setItem("ecommerce_margin_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  // 1. Data States
  const [records, setRecords] = useState<OrderRecord[]>(() => {
    const saved = localStorage.getItem("ecommerce_margin_records");
    let loaded: OrderRecord[] = INITIAL_RECORDS;
    if (saved) {
      try {
        loaded = JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse saved records, loading defaults.", e);
      }
    }
    // Automatically normalize loaded date formats to YY-MM-DD
    return loaded.map((r) => {
      if (r.orderDate && r.orderDate.length === 10 && r.orderDate.includes("-")) {
        const parts = r.orderDate.split("-");
        if (parts[0].length === 4) {
          const twoDigitYear = parts[0].slice(-2);
          return {
            ...r,
            orderDate: `${twoDigitYear}-${parts[1]}-${parts[2]}`,
          };
        }
      }
      return r;
    });
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("ecommerce_margin_records", JSON.stringify(records));
  }, [records]);

  // 2. Filter & Navigation States
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(6); // Default 6월 as in image
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("ALL"); // Default 전체보기

  // 3. AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // 3.5 Drag and Drop & Save States
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [canDrag, setCanDrag] = useState<boolean>(false);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Keyboard Copy & Paste States
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [copiedRecord, setCopiedRecord] = useState<OrderRecord | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showCopyPasteToast = (msg: string) => {
    setToastMessage(msg);
    const timeoutId = setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
    return () => clearTimeout(timeoutId);
  };

  // Keyboard Shortcut listener (Ctrl+C / Ctrl+V / Escape / Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If user typing in active textfields, skip row-level keyboard actions
      const activeEl = document.activeElement;
      if (
        activeEl &&
        (activeEl.tagName === "INPUT" ||
          activeEl.tagName === "TEXTAREA" ||
          activeEl.getAttribute("contenteditable") === "true")
      ) {
        return;
      }

      const isModKey = e.ctrlKey || e.metaKey;

      if (e.key === "Escape") {
        setSelectedRowId(null);
        return;
      }

      // Delete: Delete key deletes the selected row
      if (e.key === "Delete") {
        if (selectedRowId) {
          const rec = records.find((r) => r.id === selectedRowId);
          if (rec) {
            e.preventDefault();
            handleDeleteRow(selectedRowId);
            setSelectedRowId(null);
            showCopyPasteToast(`"${rec.buyerName || "지정되지 않은 구매자"}" 행이 삭제되었습니다.`);
          }
        }
        return;
      }

      // Copy: Ctrl+C or Cmd+C
      if (isModKey && e.key.toLowerCase() === "c") {
        if (selectedRowId) {
          const rec = records.find((r) => r.id === selectedRowId);
          if (rec) {
            setCopiedRecord(rec);
            showCopyPasteToast(`"${rec.buyerName || "지정되지 않은 구매자"}" 행이 클립보드에 복사되었습니다. (Ctrl+V로 원하는 위치 아래에 붙여넣기)`);
          }
        }
      }

      // Paste: Ctrl+V or Cmd+V
      if (isModKey && e.key.toLowerCase() === "v") {
        if (copiedRecord) {
          e.preventDefault();

          const duplicatedRecord: OrderRecord = {
            ...copiedRecord,
            id: generateRandomId(),
            buyerName: copiedRecord.buyerName ? `${copiedRecord.buyerName} (복사)` : "(복사된 구매자)",
            orderNumber: generateOrderNumber(copiedRecord.orderDate || "26-06-02"),
          };

          const nextRecords = [...records];
          let insertIndex = nextRecords.length;

          if (selectedRowId) {
            const idx = nextRecords.findIndex((r) => r.id === selectedRowId);
            if (idx !== -1) {
              insertIndex = idx + 1;
            }
          }

          nextRecords.splice(insertIndex, 0, duplicatedRecord);
          setRecords(nextRecords);
          setSelectedRowId(duplicatedRecord.id); // Focus new row
          showCopyPasteToast(`새로운 복사본 행이 삽입되었습니다.`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRowId, copiedRecord, records]);

  const handleManualSave = () => {
    localStorage.setItem("ecommerce_margin_records", JSON.stringify(records));
    setShowSaveSuccess(true);
    setTimeout(() => {
      setShowSaveSuccess(false);
    }, 2000);
  };

  // Drag and drop event handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    const isCopy = e.altKey || e.ctrlKey || e.metaKey;
    e.dataTransfer.effectAllowed = isCopy ? "copy" : "move";
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (id !== draggedId) {
      setHoveredId(id);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setHoveredId(null);
    setCanDrag(false);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedId) {
      handleDragEnd();
      return;
    }

    const srcIndex = records.findIndex((r) => r.id === draggedId);
    const dstIndex = records.findIndex((r) => r.id === targetId);

    if (srcIndex !== -1 && dstIndex !== -1) {
      const nextRecords = [...records];
      const isCopy = e.altKey || e.ctrlKey || e.metaKey;

      if (isCopy) {
        // Drag-and-drop Copy/Paste (Duplication) mode
        const sourceRecord = records[srcIndex];
        const duplicatedRecord: OrderRecord = {
          ...sourceRecord,
          id: generateRandomId(),
          buyerName: sourceRecord.buyerName ? `${sourceRecord.buyerName} (복사)` : "(복사된 구매자)",
          orderNumber: generateOrderNumber(sourceRecord.orderDate || "26-06-02"), 
        };
        // Insert copied row at destination index
        nextRecords.splice(dstIndex, 0, duplicatedRecord);
        setRecords(nextRecords);
      } else {
        // Standard drag-to-move row position
        if (draggedId !== targetId) {
          const [removed] = nextRecords.splice(srcIndex, 1);
          nextRecords.splice(dstIndex, 0, removed);
          setRecords(nextRecords);
        }
      }
    }

    handleDragEnd();
  };

  // 4. Reset to default mockup data
  const handleResetData = () => {
    if (window.confirm("정말로 최초 샘플 주문 데이터로 리셋하시겠습니까?\n기존에 기입된 데이터가 교체됩니다.")) {
      setRecords(INITIAL_RECORDS);
      setSelectedYear(2026);
      setSelectedMonth(6);
      setSelectedDayFilter("ALL");
    }
  };

  // 5. Computed lists filtered by selected Year and Month
  const monthlyRecords = useMemo(() => {
    return records.filter((r) => {
      if (!r.orderDate) return false;
      const parts = r.orderDate.split("-");
      if (parts.length < 2) return false;
      let y = parseInt(parts[0], 10);
      if (y < 100) {
        y += 2000; // Correctly map 2-digit years to 2000+ for accurate filter matching
      }
      const m = parseInt(parts[1], 10);
      return y === selectedYear && m === selectedMonth;
    });
  }, [records, selectedYear, selectedMonth]);

  // Distinct day filter tags dynamically computed from selected month's records
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    monthlyRecords.forEach((r) => {
      if (!r.orderDate) return;
      const parts = r.orderDate.split("-");
      if (parts.length === 3) {
        days.add(parts[2]);
      }
    });
    return Array.from(days).sort();
  }, [monthlyRecords]);

  // Ensure SelectedDayFilter is still valid when month changes
  useEffect(() => {
    if (selectedDayFilter !== "ALL" && !availableDays.includes(selectedDayFilter)) {
      setSelectedDayFilter("ALL");
    }
  }, [availableDays, selectedDayFilter]);

  // Final records filtered by Day as well
  const displayedRecords = useMemo(() => {
    if (selectedDayFilter === "ALL") return monthlyRecords;
    return monthlyRecords.filter((r) => {
      const parts = r.orderDate.split("-");
      return parts[2] === selectedDayFilter;
    });
  }, [monthlyRecords, selectedDayFilter]);

  // 6. Action Handlers
  const handleUpdateRecord = (id: string, field: keyof OrderRecord, value: any) => {
    setRecords((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        return { ...r, [field]: value };
      })
    );
  };

  const handleAddRow = () => {
    const formattedMonth = selectedMonth.toString().padStart(2, "0");
    const today = new Date();
    const dayStr = today.getDate().toString().padStart(2, "0");
    const yearStr = selectedYear.toString().slice(-2);
    const orderDate = `${yearStr}-${formattedMonth}-${dayStr}`;
    const orderNumber = generateOrderNumber(orderDate);

    const newRecord: OrderRecord = {
      id: generateRandomId(),
      buyerName: "",
      orderDate,
      orderNumber,
      productName: "",
      saleAmount: 0,
      shippingRevenue: 0,
      productCost: 0,
      shippingExpense: 0,
      adSpend: 0,
      commissionFee: 0,
      linkedFee: 0,
      discountAmount: 0,
      otherExpenses: 0,
    };

    setRecords((prev) => [...prev, newRecord]);
    setSelectedDayFilter("ALL"); // Reset search to view newly added row
  };

  const handleDeleteRow = (id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // 7. Summary Totals Calculations based on dynamic DISPLAYED records
  const totals = useMemo(() => {
    let salesAmtSum = 0;
    let shippingRevSum = 0;
    let productCostSum = 0;
    let shippingExpSum = 0;
    let adSpendSum = 0;
    let commissionFeeSum = 0;
    let linkedFeeSum = 0;
    let discountAmountSum = 0;
    let otherExpensesSum = 0;
    let grossRevenueSum = 0;
    let netProfitSum = 0;

    displayedRecords.forEach((r) => {
      salesAmtSum += r.saleAmount || 0;
      shippingRevSum += r.shippingRevenue || 0;
      productCostSum += r.productCost || 0;
      shippingExpSum += r.shippingExpense || 0;
      adSpendSum += r.adSpend || 0;
      commissionFeeSum += r.commissionFee || 0;
      linkedFeeSum += r.linkedFee || 0;
      discountAmountSum += r.discountAmount || 0;
      otherExpensesSum += r.otherExpenses || 0;

      grossRevenueSum += calculateGrossRevenue(r);
      netProfitSum += calculateNetProfit(r);
    });

    return {
      salesAmtSum,
      shippingRevSum,
      productCostSum,
      shippingExpSum,
      adSpendSum,
      commissionFeeSum,
      linkedFeeSum,
      discountAmountSum,
      otherExpensesSum,
      grossRevenueSum,
      netProfitSum,
    };
  }, [displayedRecords]);

  // 8. CSV Export Utility
  const handleExportCSV = () => {
    if (displayedRecords.length === 0) {
      alert("출력할 주문 데이터가 없습니다.");
      return;
    }

    const headers = [
      "구매자명",
      "주문일",
      "주문번호",
      "상품명",
      "판매금액",
      "배송비수입",
      "상품원가",
      "배송비지출",
      "광고비",
      "수수료",
      "연동수수료",
      "할인금액",
      "기타비용",
      "총매출",
      "순이익",
    ];

    const rows = displayedRecords.map((r) => [
      r.buyerName || "",
      r.orderDate || "",
      r.orderNumber || "",
      r.productName || "",
      r.saleAmount,
      r.shippingRevenue,
      r.productCost,
      r.shippingExpense,
      r.adSpend,
      r.commissionFee,
      r.linkedFee,
      r.discountAmount,
      r.otherExpenses,
      calculateGrossRevenue(r),
      calculateNetProfit(r),
    ]);

    const csvContent =
      "\uFEFF" + // UTF-8 BOM representation for correct Korean loading in Excel
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `매출계산표_${selectedYear}년_${selectedMonth}월_${selectedDayFilter === "ALL" ? "전체" : selectedDayFilter + "일"}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased pb-20 transition-colors duration-350">
      
      {/* Upper Brand Indicator and Theme Swapper Bar */}
      <div className="w-full border-b border-slate-200/60 dark:border-slate-900 bg-white dark:bg-slate-900/90 py-3.5 px-4 sm:px-6 lg:px-8 transition-colors duration-350 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-indigo-600 rounded-none text-white font-black text-sm tracking-widest">
              GOODY's
            </span>
            <div className="h-4 w-[1px] bg-slate-200 dark:bg-slate-700" />
            <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
              GOODY's E-Commerce Margin Analyzer Pro
            </h2>
          </div>
          
          {/* Light / Dark Mode Toggle button */}
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-none border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all text-xs font-semibold text-slate-650 dark:text-slate-350 shadow-sm hover:shadow active:scale-95"
            title="다크/라이트 테마 변경"
          >
            {theme === "light" ? (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-600" />
                <span>다크 모드</span>
              </>
            ) : (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-500 animate-spin-slow" />
                <span>라이트 모드</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Navigation / Calendar Filters Card */}
        <div id="filter-card" className="bg-white dark:bg-slate-900 rounded-none shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-5.5 space-y-4">
          
          {/* Year & Month select row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Year selector */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">기준 연도:</span>
              <div className="flex items-center bg-slate-100/80 dark:bg-slate-950 rounded-none p-1 border border-slate-200/80 dark:border-slate-800">
                <button
                  onClick={() => setSelectedYear((y) => y - 1)}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-none transition-colors text-slate-600 dark:text-slate-450 hover:text-indigo-600 dark:hover:text-indigo-400"
                  title="이전 연도"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="px-4.5 font-bold text-slate-800 dark:text-slate-200 text-sm select-none">
                  {selectedYear}년
                </span>
                <button
                  onClick={() => setSelectedYear((y) => y + 1)}
                  className="p-1.5 hover:bg-white dark:hover:bg-slate-800 rounded-none transition-colors text-slate-600 dark:text-slate-450 hover:text-indigo-600 dark:hover:text-indigo-400"
                  title="다음 연도"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Month grid (1월 to 12월) */}
            <div className="flex flex-wrap gap-1 items-center justify-start md:justify-end">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const isActive = selectedMonth === m;
                return (
                  <button
                    key={m}
                    onClick={() => {
                      setSelectedMonth(m);
                      setSelectedDayFilter("ALL");
                    }}
                    className={`px-3 py-1.5 rounded-none text-xs sm:text-sm font-bold transition-all duration-200 border ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-150 dark:shadow-none"
                        : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200/70 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800"
                    }`}
                  >
                    {m}월
                  </button>
                );
              })}
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/60" />

          {/* Date day filter tag row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3.5">
            <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 min-w-[70px]">
              날짜 필터:
            </span>
            <div className="flex flex-wrap gap-1.5 items-center">
              <button
                onClick={() => setSelectedDayFilter("ALL")}
                className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all border ${
                  selectedDayFilter === "ALL"
                    ? "bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900 shadow-sm"
                    : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                전체보기
              </button>
              {availableDays.map((day) => {
                const isActive = selectedDayFilter === day;
                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDayFilter(day)}
                    className={`px-3 py-1.5 rounded-none text-xs font-semibold transition-all border ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-900/60 text-indigo-700 dark:text-indigo-400 font-bold"
                        : "bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {day}일
                  </button>
                );
              })}
              {availableDays.length === 0 && (
                <span className="text-xs text-slate-400 dark:text-slate-500 italic ml-2">
                  선택한 월에 아직 기입된 거래가 없습니다.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Title Card */}
        <div className="bg-white dark:bg-slate-900 rounded-none shadow-sm border border-slate-200/80 dark:border-slate-800/80 p-5.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-3.5">
            <div className="bg-indigo-50 dark:bg-slate-950 p-3 rounded-none border border-indigo-120 dark:border-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Calculator className="w-6 h-6 shrink-0" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                지표 입력 및 마진 계산기
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5 font-semibold leading-relaxed">
                각 셀을 가볍게 탭해 판매금액, 원가, 기타 지출을 수정하세요. 실시간으로 즉시 마진율이 집계됩니다.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5 w-full md:w-auto">
            {/* AI analysis */}
            <button
              onClick={() => setIsAiModalOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 dark:from-violet-550 dark:to-indigo-550 dark:hover:from-violet-600 dark:hover:to-indigo-600 text-white rounded-none text-xs font-bold transition-all shadow-md shadow-violet-100 dark:shadow-none hover:translate-y-[-1px] active:translate-y-[1px]"
            >
              <Sparkles className="w-4 h-4 text-indigo-100" />
              AI 경영 진단
            </button>

            {/* Add row */}
            <button
              onClick={handleAddRow}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-none text-xs font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none hover:translate-y-[-1px] active:translate-y-[1px]"
            >
              <Plus className="w-4 h-4" />
              거래행 추가
            </button>
          </div>
        </div>

        {/* Main Spreadsheet Table Card */}
        <div className="bg-white dark:bg-slate-900 rounded-none shadow-sm border border-slate-200/80 dark:border-slate-800/80 overflow-hidden flex flex-col">
          {/* Table Toolbar */}
          <div className="px-6 py-4 bg-slate-50/70 dark:bg-slate-950/80 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-50 dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 px-2.5 py-1 rounded-none">
                SPREADSHEET
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* CSV export */}
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-250 dark:border-slate-850 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-none text-xs font-bold transition shadow-2xs"
                title="엑셀 호환 CSV 파일 저장"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                CSV 다운로드
              </button>

              {/* Black Save Button */}
              <button
                onClick={handleManualSave}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 border rounded-none text-xs font-bold transition shadow-2xs ${
                  showSaveSuccess
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                    : "bg-slate-950 hover:bg-slate-850 text-white border-slate-955 dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-950 dark:border-slate-100"
                }`}
                title="브라우저에 데이터 수동 저장"
              >
                <Save className="w-3.5 h-3.5" />
                {showSaveSuccess ? "저장 완료 ✓" : "저장하기"}
              </button>
            </div>
          </div>

          {/* Horizontal Scroll wrapper */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed min-w-[1600px] font-sans">
              <thead>
                <tr className="bg-slate-50/90 dark:bg-slate-950/95 text-slate-505 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 text-xs font-bold">
                  <th className="sticky left-0 bg-slate-100 dark:bg-slate-950 z-20 w-[120px] px-3.5 py-3.5 text-left tracking-tight border-r border-slate-200/80 dark:border-slate-800/70 font-bold shadow-[1px_0_0_0_rgba(226,232,240,0.8)]">구매자명</th>
                  <th className="w-[125px] px-2 py-3.5 tracking-tight border-r border-slate-100/50 dark:border-slate-800/40">주문일</th>
                  <th className="w-[155px] px-2 py-3.5 tracking-tight border-r border-slate-100/50 dark:border-slate-800/40">주문번호</th>
                  <th className="w-[170px] px-2 py-3.5 tracking-tight border-r border-slate-100/50 dark:border-slate-800/40">상품명</th>
                  
                  {/* Revenue Segment (Blueish Accent) */}
                  <th className="w-[130px] px-2 py-3.5 text-right tracking-tight text-blue-700 dark:text-blue-350 bg-blue-100/80 dark:bg-blue-950/45 border-r border-slate-200 dark:border-slate-800 font-extrabold text-xs shadow-[inset_-1px_0_0_0_rgba(226,232,240,0.5)]">판매금액</th>
                  <th className="w-[105px] px-2 py-3.5 text-right tracking-tight text-blue-600 dark:text-blue-400 bg-blue-50/15 dark:bg-blue-950/10 border-r border-slate-100/50 dark:border-slate-800/40">배송비수입</th>
                  
                  {/* Expense Segment (Rose/Amber Accents) */}
                  <th className="w-[130px] px-2 py-3.5 text-right tracking-tight text-rose-700 dark:text-rose-350 bg-rose-100/80 dark:bg-rose-950/45 border-r border-slate-200 dark:border-slate-800 font-extrabold text-xs shadow-[inset_-1px_0_0_0_rgba(226,232,240,0.5)]">상품원가</th>
                  <th className="w-[105px] px-2 py-3.5 text-right tracking-tight text-rose-500 dark:text-rose-455 bg-rose-50/10 dark:bg-rose-950/5 border-r border-slate-100/50 dark:border-slate-800/40">배송비지출</th>
                  <th className="w-[100px] px-2 py-3.5 text-right tracking-tight text-slate-650 dark:text-slate-400 border-r border-slate-100/50 dark:border-slate-800/40">광고비</th>
                  <th className="w-[100px] px-2 py-3.5 text-right tracking-tight text-slate-650 dark:text-slate-400 border-r border-slate-100/50 dark:border-slate-800/40">수수료</th>
                  <th className="w-[110px] px-2 py-3.5 text-right tracking-tight text-slate-650 dark:text-slate-400 border-r border-slate-100/50 dark:border-slate-800/40">연동 수수료</th>
                  <th className="w-[110px] px-2 py-3.5 text-right tracking-tight text-slate-650 dark:text-slate-400 border-r border-slate-100/50 dark:border-slate-800/40">할인금액</th>
                  <th className="w-[110px] px-2 py-3.5 text-right tracking-tight text-slate-650 dark:text-slate-400 border-r border-slate-100/50 dark:border-slate-800/40">기타비용</th>
                  
                  {/* Aggregates (Grey / Green) */}
                  <th className="w-[130px] px-3 py-3.5 text-right text-slate-900 dark:text-slate-200 bg-slate-50 dark:bg-slate-950/70 border-r border-slate-150 dark:border-slate-800">총매출</th>
                  <th className="sticky right-0 bg-emerald-100 dark:bg-emerald-950 z-20 w-[135px] px-3 py-3.5 text-right text-emerald-850 dark:text-emerald-400 border-r border-slate-150 dark:border-slate-800 font-bold border-l border-slate-200/50 dark:border-slate-800/50">순이익</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {displayedRecords.map((item) => {
                  const grossRevenue = calculateGrossRevenue(item);
                  const netProfit = calculateNetProfit(item);
                  const isSelected = selectedRowId === item.id;

                  return (
                    <tr
                      key={item.id}
                      draggable={canDrag}
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragOver={(e) => handleDragOver(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, item.id)}
                      onClick={() => setSelectedRowId(item.id)}
                      className={`hover:bg-slate-50/55 dark:hover:bg-slate-800/30 transition-colors group/row cursor-pointer ${
                        isSelected 
                          ? "bg-indigo-50/20 dark:bg-indigo-950/15 ring-1 ring-indigo-400 dark:ring-indigo-700/50" 
                          : ""
                      } ${
                        draggedId === item.id ? "opacity-30 bg-indigo-50/30 dark:bg-indigo-950/20" : ""
                      } ${
                        hoveredId === item.id ? "border-t-2 border-t-indigo-500 transition-all font-semibold" : ""
                      }`}
                    >
                      {/* Buyer Name - STICKY LEFT */}
                      <td className={`sticky left-0 z-10 px-2 py-1.5 border-r border-slate-200/80 dark:border-slate-800/70 shadow-[1px_0_0_0_rgba(226,232,240,0.8)] transition-colors ${
                        isSelected 
                          ? "bg-indigo-55/90 dark:bg-indigo-950/90 text-indigo-900 dark:text-indigo-300"
                          : "bg-white dark:bg-slate-900 group-hover/row:bg-slate-100/95 dark:group-hover/row:bg-slate-800/95"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {/* Drag handle */}
                          <div
                            onMouseDown={() => setCanDrag(true)}
                            onMouseUp={() => setCanDrag(false)}
                            onMouseLeave={() => setCanDrag(false)}
                            className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-indigo-500 dark:hover:text-indigo-400 p-0.5 shrink-0 transition-colors select-none"
                            title="드래그해서 이 행의 위치를 변경하세요 (Alt 키를 누르고 드래그하면 행 복사)"
                          >
                            <GripVertical className="w-3.5 h-3.5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <EditableCell
                              value={item.buyerName}
                              type="text"
                              onChange={(val) => handleUpdateRecord(item.id, "buyerName", val)}
                              placeholder="이름 입력"
                              colorClass="font-bold text-slate-850 dark:text-slate-200"
                            />
                          </div>
                        </div>
                      </td>

                      {/* Order Date */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.orderDate}
                          type="text"
                          onChange={(val) => handleUpdateRecord(item.id, "orderDate", val)}
                          placeholder="YY-MM-DD"
                          colorClass="font-mono text-xs text-slate-700 dark:text-slate-350 font-semibold"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.orderNumber}
                          type="text"
                          onChange={(val) => handleUpdateRecord(item.id, "orderNumber", val)}
                          placeholder="번호 입력"
                          colorClass="font-mono text-xs text-slate-500 dark:text-slate-400"
                        />
                      </td>

                      {/* Product Name */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.productName}
                          type="text"
                          onChange={(val) => handleUpdateRecord(item.id, "productName", val)}
                          placeholder="상품명 입력"
                          colorClass="text-slate-750 dark:text-slate-200 font-semibold truncate"
                        />
                      </td>

                      {/* Sale Amount (Blue) */}
                      <td className="px-2 py-1.5 bg-blue-50/20 dark:bg-blue-950/15 border-r border-slate-150 dark:border-slate-800/70 group-hover/row:bg-blue-100/35 dark:group-hover/row:bg-blue-900/30 transition-colors">
                        <EditableCell
                          value={item.saleAmount}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "saleAmount", val)}
                          colorClass="text-blue-700 dark:text-blue-400 font-extrabold font-mono text-sm"
                        />
                      </td>

                      {/* Shipping Revenue */}
                      <td className="px-2 py-1.5 bg-blue-50/5 dark:bg-blue-950/5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.shippingRevenue}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "shippingRevenue", val)}
                          colorClass="text-slate-600 dark:text-slate-300"
                        />
                      </td>

                      {/* Product Cost (Red) */}
                      <td className="px-2 py-1.5 bg-rose-50/25 dark:bg-rose-950/15 border-r border-slate-150 dark:border-slate-800/70 group-hover/row:bg-rose-100/25 dark:group-hover/row:bg-rose-900/25 transition-colors">
                        <EditableCell
                          value={item.productCost}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "productCost", val)}
                          colorClass="text-rose-600 dark:text-rose-450 font-extrabold font-mono text-sm"
                        />
                      </td>

                      {/* Shipping Expense (Red) */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.shippingExpense}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "shippingExpense", val)}
                          colorClass="text-rose-500 dark:text-rose-400"
                        />
                      </td>

                      {/* Ad Spend */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.adSpend}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "adSpend", val)}
                          colorClass="text-slate-650 dark:text-slate-300 font-mono text-xs"
                        />
                      </td>

                      {/* Commission Fee */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.commissionFee}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "commissionFee", val)}
                          colorClass="text-slate-650 dark:text-slate-300 font-mono text-xs"
                        />
                      </td>

                      {/* Linked Fee */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.linkedFee}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "linkedFee", val)}
                          colorClass="text-slate-650 dark:text-slate-300 font-mono text-xs"
                        />
                      </td>

                      {/* Discount Amount */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.discountAmount}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "discountAmount", val)}
                          colorClass="text-slate-650 dark:text-slate-300 font-mono text-xs"
                        />
                      </td>

                      {/* Other Expenses */}
                      <td className="px-2 py-1.5 border-r border-slate-100/40 dark:border-slate-800/30">
                        <EditableCell
                          value={item.otherExpenses}
                          type="number"
                          onChange={(val) => handleUpdateRecord(item.id, "otherExpenses", val)}
                          colorClass="text-slate-650 dark:text-slate-300"
                        />
                      </td>

                      {/* Calculated Gross Revenue (Bold Dark) */}
                      <td className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/60 text-right text-slate-850 dark:text-slate-100 font-bold font-mono border-r border-slate-150 dark:border-slate-800">
                        {formatWonValueOnly(grossRevenue)}
                      </td>

                      {/* Calculated Net Profit (Bold Green) - STICKY RIGHT */}
                      <td className={`sticky right-0 z-10 text-right font-bold font-mono border-r border-slate-150 dark:border-slate-800 border-l border-slate-200/50 dark:border-slate-800/50 transition-colors px-3 py-1.5 ${
                        isSelected
                          ? (netProfit >= 0 
                              ? "bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300" 
                              : "bg-rose-100 dark:bg-rose-900 text-rose-600 dark:text-rose-400")
                          : (netProfit >= 0 
                              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover/row:bg-emerald-100/90 dark:group-hover/row:bg-emerald-900/90" 
                              : "bg-rose-50 dark:bg-rose-950 text-rose-500 group-hover/row:bg-rose-100/90 dark:group-hover/row:bg-rose-900/90")
                      }`}>
                        {formatWonValueOnly(netProfit)}
                      </td>
                    </tr>
                  );
                })}

                {/* If empty state matches current month */}
                {displayedRecords.length === 0 && (
                  <tr>
                    <td
                      colSpan={15}
                      className="px-6 py-20 text-center text-slate-400 bg-slate-50/10 dark:bg-slate-950/20"
                    >
                      <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-2.5" />
                      <p className="text-sm font-bold text-slate-600 dark:text-slate-400">조회할 주문이 없습니다</p>
                      <p className="text-xs text-slate-400 dark:text-slate-505 mt-1 max-w-sm mx-auto leading-relaxed">
                        오른쪽 상단의 <span className="font-bold text-indigo-500">"+ 거래행 추가"</span> 버튼 또는{" "}
                        <span className="font-bold text-indigo-550">"샘플 리로드"</span>를 눌러 계산을 시작해 보세요.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot className="border-t-2 border-slate-250 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-950/95 font-bold text-xs text-slate-805 dark:text-slate-100">
                <tr className="divide-y divide-slate-100/50 dark:divide-slate-850">
                  {/* Sticky Buyer Name */}
                  <td className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-950 px-3.5 py-3 border-r border-slate-200 dark:border-slate-800 font-extrabold text-slate-900 dark:text-slate-100 shadow-[1px_0_0_0_rgba(226,232,240,0.8)]">
                    합계
                  </td>
                  {/* Order Date */}
                  <td className="px-2 py-3 border-r border-slate-100/40 dark:border-slate-800/30 text-slate-500 dark:text-slate-400 italic">
                    {displayedRecords.length}건
                  </td>
                  {/* Order Number */}
                  <td className="px-2 py-3 border-r border-slate-100/40 dark:border-slate-800/30"></td>
                  {/* Product Name */}
                  <td className="px-2 py-3 border-r border-slate-100/40 dark:border-slate-800/30"></td>

                  {/* Sale Amount (Blue Highlight) */}
                  <td className="px-2 py-3 bg-blue-100/70 dark:bg-blue-950/45 text-right font-black text-blue-700 dark:text-blue-350 border-r border-slate-200 dark:border-slate-800 font-mono text-sm leading-tight">
                    {formatWonValueOnly(totals.salesAmtSum)}
                  </td>
                  {/* Shipping Revenue */}
                  <td className="px-2 py-3 bg-blue-50/10 dark:bg-blue-950/10 text-right font-bold text-slate-600 dark:text-slate-455 border-r border-slate-100/40 dark:border-slate-800/30 font-mono">
                    {formatWonValueOnly(totals.shippingRevSum)}
                  </td>

                  {/* Product Cost (Red Highlight) */}
                  <td className="px-2 py-3 bg-rose-100/70 dark:bg-rose-950/45 text-right font-black text-rose-700 dark:text-rose-350 border-r border-slate-200 dark:border-slate-800 font-mono text-sm leading-tight">
                    {formatWonValueOnly(totals.productCostSum)}
                  </td>
                  {/* Shipping Expense */}
                  <td className="px-2 py-3 text-right font-bold text-slate-700 dark:text-slate-400 border-r border-slate-100/40 dark:border-slate-800/30 font-mono">
                    {formatWonValueOnly(totals.shippingExpSum)}
                  </td>
                  {/* Ad Spend */}
                  <td className="px-2 py-3 text-right font-bold text-slate-700 dark:text-slate-400 border-r border-slate-100/40 dark:border-slate-800/30 font-mono">
                    {formatWonValueOnly(totals.adSpendSum)}
                  </td>
                  {/* Commission Fee */}
                  <td className="px-2 py-3 text-right font-bold text-slate-700 dark:text-slate-400 border-r border-slate-100/40 dark:border-slate-800/30 font-mono">
                    {formatWonValueOnly(totals.commissionFeeSum)}
                  </td>
                  {/* Linked Fee */}
                  <td className="px-2 py-3 text-right font-bold text-slate-750 dark:text-slate-400 border-r border-slate-100/40 dark:border-slate-800/30 font-mono">
                    {formatWonValueOnly(totals.linkedFeeSum)}
                  </td>
                  {/* Discount Amount */}
                  <td className="px-2 py-3 text-right font-bold text-slate-700 dark:text-slate-400 border-r border-slate-100/40 dark:border-slate-800/30 font-mono">
                    {formatWonValueOnly(totals.discountAmountSum)}
                  </td>
                  {/* Other Expenses */}
                  <td className="px-2 py-3 text-right font-bold text-slate-700 dark:text-slate-400 border-r border-slate-100/40 dark:border-slate-800/30 font-mono">
                    {formatWonValueOnly(totals.otherExpensesSum)}
                  </td>

                  {/* Calculated Gross Revenue (Bold Dark) */}
                  <td className="px-3 py-3 bg-slate-100/80 dark:bg-slate-900 text-right text-slate-900 dark:text-slate-100 font-extrabold font-mono border-r border-slate-200 dark:border-slate-800">
                    {formatWonValueOnly(totals.grossRevenueSum)}
                  </td>

                  {/* Calculated Net Profit (Bold Green) - STICKY RIGHT */}
                  <td className={`sticky right-0 z-10 px-3 py-3 text-right font-black font-mono border-r border-slate-200 dark:border-slate-850 border-l border-slate-200/50 dark:border-slate-800/50 text-sm leading-tight transition-colors ${
                    totals.netProfitSum >= 0 
                      ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400" 
                      : "bg-rose-100 dark:bg-rose-950 text-rose-500 dark:text-rose-405"
                  }`}>
                    {formatWonValueOnly(totals.netProfitSum)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* References/Instructions Box between Table and KPI Cards */}
        <div className="bg-slate-50/70 dark:bg-slate-950/40 p-4 border border-slate-200/80 dark:border-slate-800/80 rounded-none flex items-start gap-3 select-none">
          <div className="text-base leading-none shrink-0 mt-0.5">💡</div>
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 font-sans leading-relaxed">
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs tracking-tight">작업 팁: 행 간편 복사 & 붙여넣기 및 드래그 가이드</span>
            <p>
              테이블 내 아무 곳이나 마우스로 <span className="font-semibold text-indigo-600 dark:text-indigo-400">행을 한 번 클릭</span>하여 선택(파란 테두리 활성화)한 후, 키보드로 <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200 font-bold rounded-none">Ctrl + C</kbd> 복사, <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-800 dark:text-slate-200 font-bold rounded-none">Ctrl + V</kbd> 붙여넣기, <kbd className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-rose-600 dark:text-rose-400 font-bold rounded-none">Delete</kbd> 키로 행 삭제가 가능합니다. (선택 해제는 <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-400 font-bold rounded-none">ESC</kbd> 사용)
            </p>
            <p className="text-[11px] text-slate-500 dark:text-slate-500">
              * 왼쪽의 손잡이 핸들(<span className="font-semibold text-indigo-500">⋮⋮</span>)을 드래그 앤 드롭하면 자유롭게 순서가 바뀌며, <kbd className="font-bold">Alt</kbd> 키를 누른 채 드래그하면 직관적인 마우스 복사 삽입도 지원합니다.
            </p>
          </div>
        </div>

        {/* Bottom Total Indicators Cards matching mockup */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Total Sales Amount */}
          <div className="bg-white dark:bg-slate-900 rounded-none p-5.5 shadow-xs border border-slate-200/80 dark:border-slate-800/80 border-l-[6px] border-l-blue-500/80 dark:border-l-blue-550/80 flex flex-col justify-between">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tight flex items-center gap-1.5">
              총 판매금액
              <span className="text-[10px] text-blue-500 dark:text-blue-400 bg-blue-55/10 dark:bg-blue-900/40 px-1.5 py-0.5 rounded-none font-bold">합산</span>
            </span>
            <div className="mt-3.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                {formatWonValueOnly(totals.salesAmtSum)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">원</span>
            </div>
          </div>

          {/* Total Cost */}
          <div className="bg-white dark:bg-slate-900 rounded-none p-5.5 shadow-xs border border-slate-200/80 dark:border-slate-800/80 border-l-[6px] border-l-rose-500/80 dark:border-l-rose-550/80 flex flex-col justify-between">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tight flex items-center gap-1.5">
              총 상품원가
              <span className="text-[10px] text-rose-500 dark:text-rose-400 bg-rose-55/10 dark:bg-rose-900/40 px-1.5 py-0.5 rounded-none font-bold">원가</span>
            </span>
            <div className="mt-3.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                {formatWonValueOnly(totals.productCostSum)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">원</span>
            </div>
          </div>

          {/* Total Shipping Expense */}
          <div className="bg-white dark:bg-slate-900 rounded-none p-5.5 shadow-xs border border-slate-200/80 dark:border-slate-800/80 border-l-[6px] border-l-amber-500/80 dark:border-l-amber-550/80 flex flex-col justify-between">
            <span className="text-xs font-black text-slate-500 dark:text-slate-400 tracking-tight flex items-center gap-1.5">
              총 배송비지출
              <span className="text-[10px] text-amber-500 dark:text-amber-450 bg-amber-55/10 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-none font-bold">물류</span>
            </span>
            <div className="mt-3.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                {formatWonValueOnly(totals.shippingExpSum)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400">원</span>
            </div>
          </div>

          {/* Total Net Profit */}
          <div className="bg-emerald-600 dark:bg-emerald-700 text-white rounded-none p-5.5 shadow-md border border-emerald-500 dark:border-emerald-600 flex flex-col justify-between ring-2 ring-emerald-600/30 dark:ring-emerald-500/20 transition-all hover:shadow-lg">
            <span className="text-xs font-black text-emerald-50 tracking-tight flex items-center gap-1.5">
              총 순이익
              <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded-none font-extrabold pb-0.5 shadow-xs">최종실적</span>
            </span>
            <div className="mt-3.5 flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-black text-white font-mono tracking-tight drop-shadow-sm">
                {formatWonValueOnly(totals.netProfitSum)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-100">원</span>
            </div>
          </div>
        </div>

        {/* Informational Hint footer alert */}
        <div className="bg-slate-100 dark:bg-slate-900/50 rounded-none p-4.5 border border-slate-200/70 dark:border-slate-800/80 flex items-start gap-3">
          <Info className="w-5 h-5 text-slate-400 dark:text-slate-500 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1.5 font-sans">
            <p className="font-bold text-slate-700 dark:text-slate-200">💡 마진 자동계산 공식 정보</p>
            <p className="leading-normal">• <span className="font-semibold text-slate-650 dark:text-slate-350">총매출</span> = 판매금액 + 배송비수입</p>
            <p className="leading-normal">• <span className="font-semibold text-slate-650 dark:text-slate-350">순이익</span> = 총매출 - (상품원가 + 배송비지출 + 광고비 + 대행수수료 + 연동수수료 + 할인금액 + 기타비용)</p>
          </div>
        </div>
      </div>

      {/* AI Consulting Modal component */}
      <AnalysisModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        salesData={displayedRecords}
        month={selectedMonth}
        year={selectedYear}
      />

      {/* Copy-Paste Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 dark:bg-slate-800 text-white px-4.5 py-3 border border-slate-800 dark:border-slate-700 shadow-2xl flex items-center gap-2.5 rounded-none font-sans text-xs font-semibold"
          >
            <div className="bg-indigo-600 p-1.5 text-white">
              <Copy className="w-3.5 h-3.5" />
            </div>
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

