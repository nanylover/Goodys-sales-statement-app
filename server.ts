// api/get-sheet-data.js
import { GoogleSpreadsheet } from 'google-spreadsheet';

export default async function handler(req, res) {
  try {
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const doc = new GoogleSpreadsheet(sheetId);
    
    await doc.useServiceAccountAuth({
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });

    await doc.loadInfo();
    const sheet = doc.sheetsByIndex[0];
    const rows = await sheet.getRows();
    
    const data = rows.map(row => ({
      buyerName: row.buyerName || "",
      productName: row.productName || "",
      saleAmount: row.saleAmount || 0,
      grossRevenue: row.grossRevenue || 0,
      netProfit: row.netProfit || 0
    }));

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
