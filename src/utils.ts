/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OrderRecord } from "./types";

export function formatWon(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

export function formatWonValueOnly(value: number): string {
  return value.toLocaleString("ko-KR");
}

export const INITIAL_RECORDS: OrderRecord[] = [
  {
    id: "1",
    buyerName: "김태호",
    orderDate: "26-06-02",
    orderNumber: "-5877779-06-02",
    productName: "1에어로시티",
    saleAmount: 25000,
    shippingRevenue: 3000,
    productCost: 14900,
    shippingExpense: 3000,
    adSpend: 0,
    commissionFee: 862,
    linkedFee: 712,
    discountAmount: 0,
    otherExpenses: 1250,
  },
  {
    id: "2",
    buyerName: "이지민",
    orderDate: "26-06-02",
    orderNumber: "-5877779-06-02",
    productName: "ADT모자",
    saleAmount: 21000,
    shippingRevenue: 0,
    productCost: 12900,
    shippingExpense: 0,
    adSpend: 0,
    commissionFee: 739,
    linkedFee: 611,
    discountAmount: 0,
    otherExpenses: 630,
  },
  {
    id: "3",
    buyerName: "홍정민",
    orderDate: "26-06-02",
    orderNumber: "-5877779-06-02",
    productName: "에어로시티티셔츠2",
    saleAmount: 25000,
    shippingRevenue: 3000,
    productCost: 14900,
    shippingExpense: 3000,
    adSpend: 0,
    commissionFee: 907,
    linkedFee: 750,
    discountAmount: 0,
    otherExpenses: 0,
  },
  {
    id: "4",
    buyerName: "강민석",
    orderDate: "26-06-15",
    orderNumber: "-3124512-06-15",
    productName: "에어포스 클래식",
    saleAmount: 129000,
    shippingRevenue: 3000,
    productCost: 75000,
    shippingExpense: 3000,
    adSpend: 5000,
    commissionFee: 4500,
    linkedFee: 3870,
    discountAmount: 10000,
    otherExpenses: 1500,
  },
  {
    id: "5",
    buyerName: "최윤서",
    orderDate: "26-05-18",
    orderNumber: "-1948512-05-18",
    productName: "여름 린넨 셔츠",
    saleAmount: 39000,
    shippingRevenue: 0,
    productCost: 18000,
    shippingExpense: 2500,
    adSpend: 2000,
    commissionFee: 1350,
    linkedFee: 1170,
    discountAmount: 3000,
    otherExpenses: 500,
  }
];

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function generateOrderNumber(dateStr: string): string {
  const code = Math.floor(1000000 + Math.random() * 9000000);
  const parts = dateStr.split("-");
  const suffix = parts.length >= 2 ? parts.slice(1).join("-") : dateStr;
  return `-${code}-${suffix}`;
}

/**
 * A robust and beautiful custom Markdown parser to format Gemini insights as styled react elements.
 * Avoids React 19 package version mismatches and renders beautifully in styled containers.
 */
export function parseMarkdown(text: string): string {
  // Simple markdown to HTML representation for custom rendering.
  // We can convert markdown characters into HTML elements safely.
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Bold text
  html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  
  // Underline or italic
  html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");

  // Headers (### Header)
  html = html.replace(/^### (.*?)$/gm, "<h4 class='text-lg font-bold text-gray-800 mt-4 mb-2 border-b pb-1'>$1</h4>");
  html = html.replace(/^## (.*?)$/gm, "<h3 class='text-xl font-bold text-slate-900 mt-6 mb-3 border-l-4 border-indigo-500 pl-2'>$1</h3>");
  html = html.replace(/^# (.*?)$/gm, "<h2 class='text-2xl font-bold text-slate-900 mt-8 mb-4'>$1</h2>");

  // Unordered list items
  html = html.replace(/^\- (.*?)$/gm, "<li class='ml-4 list-disc text-gray-700 my-1'>$1</li>");
  html = html.replace(/^\* (.*?)$/gm, "<li class='ml-4 list-disc text-gray-700 my-1'>$1</li>");

  // Ordered list items
  html = html.replace(/^(\d+)\. (.*?)$/gm, "<li class='ml-4 list-decimal text-gray-700 my-1'>$2</li>");

  // Paragraph breaks (double newlines) and list grouping
  html = html.replace(/\n\n/g, "</p><p class='text-gray-700 leading-relaxed my-2'>");
  
  return html;
}
