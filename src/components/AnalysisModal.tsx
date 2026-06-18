/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Sparkles, Copy, Check, BarChart2, TrendingUp, AlertCircle, RefreshCw } from "lucide-react";
import { OrderRecord } from "../types";
import { parseMarkdown, formatWon } from "../utils";

interface AnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesData: OrderRecord[];
  month: number;
  year: number;
}

export function AnalysisModal({
  isOpen,
  onClose,
  salesData,
  month,
  year,
}: AnalysisModalProps) {
  const [loading, setLoading] = useState(false);
  const [analysisHtml, setAnalysisHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const triggerAnalysis = async () => {
    setLoading(true);
    setErrorMsg("");
    setAnalysisHtml("");
    try {
      const response = await fetch("/api/analyze-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salesData, month, year }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "AI 분석 도중 서버에서 오류가 발생했습니다.");
      }

      setAnalysisHtml(parseMarkdown(data.analysis || ""));
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "분석 요청에 실패했습니다. 다시 시도해 주세요.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      triggerAnalysis();
    }
  }, [isOpen, salesData, month, year]);

  const handleCopy = () => {
    // Get text from html content
    const el = document.createElement("div");
    el.innerHTML = analysisHtml;
    const textContent = el.textContent || el.innerText || "";
    
    navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Safe checks
  const totalSalesAmt = salesData.reduce((acc, curr) => acc + (curr.saleAmount || 0), 0);
  const totalCost = salesData.reduce((acc, curr) => acc + (curr.productCost || 0), 0);
  const netProfitTotal = salesData.reduce((acc, curr) => {
    const gross = (curr.saleAmount || 0) + (curr.shippingRevenue || 0);
    const cost = (curr.productCost || 0) + (curr.shippingExpense || 0) + (curr.adSpend || 0) + (curr.commissionFee || 0) + (curr.linkedFee || 0) + (curr.discountAmount || 0) + (curr.otherExpenses || 0);
    return acc + (gross - cost);
  }, 0);

  const profitMarginPercent = totalSalesAmt > 0 ? ((netProfitTotal / totalSalesAmt) * 100).toFixed(1) : "0.0";

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900 bg-opacity-50 transition-opacity"
          />

          {/* Modal Content Wrapper */}
          <div className="flex min-h-screen items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-none shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-5 text-white flex items-center justify-between shadow-md">
                <div className="flex items-center gap-2.5">
                  <div className="bg-white/10 p-2 rounded-none">
                    <Sparkles className="w-5 h-5 text-indigo-200 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg md:text-xl tracking-tight text-white">
                      {year}년 {month}월 AI 경영 분석 리포트
                    </h3>
                    <p className="text-indigo-100 text-xs mt-0.5">
                      Gemini 가 데이터 요약 및 마진 최적화 처방을 직접 제안합니다.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-none transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Container */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Visual Highlights Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-none p-4 border border-indigo-100/70 dark:border-indigo-900/30 flex items-center gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2.5 rounded-none text-indigo-600 dark:text-indigo-400">
                      <BarChart2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">분석 대상 상품 판매액</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{formatWon(totalSalesAmt)}</p>
                    </div>
                  </div>

                  <div className="bg-emerald-50/50 dark:bg-emerald-950/20 rounded-none p-4 border border-emerald-100/70 dark:border-emerald-900/30 flex items-center gap-3">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-none text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">총 합산 순이익</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{formatWon(netProfitTotal)}</p>
                    </div>
                  </div>

                  <div className="bg-violet-50/50 dark:bg-violet-950/20 rounded-none p-4 border border-violet-100/70 dark:border-violet-900/30 flex items-center gap-3">
                    <div className="bg-violet-100 dark:bg-violet-900/50 p-2.5 rounded-none text-violet-600 dark:text-violet-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-550 dark:text-slate-400 font-medium">예상 최종 순이익률</p>
                      <p className="font-bold text-slate-800 dark:text-slate-200 text-base">{profitMarginPercent}%</p>
                    </div>
                  </div>
                </div>

                {/* Main AI Body */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-none bg-slate-50 dark:bg-slate-950 p-5 min-h-[300px]">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4 font-sans">
                      <div className="relative">
                        <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-950 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                        <Sparkles className="w-6 h-6 text-indigo-500 dark:text-indigo-400 absolute inset-0 m-auto animate-pulse" />
                      </div>
                      <div className="text-center space-y-1.5">
                        <p className="text-slate-700 dark:text-slate-300 font-medium text-sm">실시간 AI 경영 지표 정밀 진단 중...</p>
                        <p className="text-slate-400 dark:text-slate-500 text-xs text-center">
                          원가와 수수료 지출 배율을 대조하여 개선 팁을 구성하고 있습니다.
                        </p>
                      </div>
                    </div>
                  ) : errorMsg ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4 text-center">
                      <div className="bg-rose-50 dark:bg-rose-950/25 p-3 rounded-none text-rose-500">
                        <AlertCircle className="w-8 h-8" />
                      </div>
                      <div className="max-w-md">
                        <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-1">분석 도중 문제가 발생했습니다</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed">{errorMsg}</p>
                      </div>
                      <button
                        onClick={triggerAnalysis}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none text-xs font-semibold transition shadow-md"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        재시도
                      </button>
                    </div>
                  ) : (
                    <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 space-y-3 font-sans">
                      {/* CSS embedded styling inside HTML rendering ensures gorgeous lists and tables */}
                      <div
                        className="markdown-body p-1 text-slate-800 dark:text-slate-200"
                        dangerouslySetInnerHTML={{ __html: analysisHtml }}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-slate-50 dark:bg-slate-900/80 px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={triggerAnalysis}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-none text-xs font-medium transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  새로고침
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    disabled={!analysisHtml || loading}
                    className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-none text-xs font-semibold transition disabled:opacity-50 disabled:hover:bg-transparent"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-550 dark:text-emerald-450" />
                        복사 완료!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        리포트 텍스트 복사
                      </>
                    )}
                  </button>
                  <button
                    onClick={onClose}
                    className="px-5 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-none text-xs font-semibold transition shadow"
                  >
                    확인
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
