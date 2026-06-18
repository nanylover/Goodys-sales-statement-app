/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface OrderRecord {
  id: string;
  buyerName: string;
  orderDate: string; // YYYY-MM-DD
  orderNumber: string;
  productName: string;
  saleAmount: number;
  shippingRevenue: number;
  productCost: number;
  shippingExpense: number;
  adSpend: number;
  commissionFee: number;
  linkedFee: number;
  discountAmount: number;
  otherExpenses: number;
}

export function calculateGrossRevenue(record: OrderRecord): number {
  return (record.saleAmount || 0) + (record.shippingRevenue || 0);
}

export function calculateExpenses(record: OrderRecord): number {
  return (
    (record.productCost || 0) +
    (record.shippingExpense || 0) +
    (record.adSpend || 0) +
    (record.commissionFee || 0) +
    (record.linkedFee || 0) +
    (record.discountAmount || 0) +
    (record.otherExpenses || 0)
  );
}

export function calculateNetProfit(record: OrderRecord): number {
  return calculateGrossRevenue(record) - calculateExpenses(record);
}
