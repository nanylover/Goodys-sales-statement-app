import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { GoogleSpreadsheet } from 'google-spreadsheet';
import dotenv from "dotenv";

dotenv.config();

// 구글 시트 데이터 가져오는 함수
async function getSheetData(sheetId: string) {
  const doc = new GoogleSpreadsheet(sheetId);
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    private_key: process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  });
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];
  return await sheet.getRows();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. 구글 시트 데이터 호출 API
  app.get("/api/get-sheet-data", async (req, res) => {
    try {
      const sheetId = process.env.GOOGLE_SHEET_ID;
      if (!sheetId) return res.status(500).json({ error: "GOOGLE_SHEET_ID가 설정되지 않았습니다." });
      
      const rows = await getSheetData(sheetId);
      const data = rows.map(row => ({
        buyerName: row.buyerName,
        productName: row.productName,
        saleAmount: row.saleAmount,
        productCost: row.productCost,
        shippingRevenue: row.shippingRevenue,
        shippingExpense: row.shippingExpense,
        adSpend: row.adSpend,
        commissionFee: row.commissionFee,
        linkedFee: row.linkedFee,
        discountAmount: row.discountAmount,
        otherExpenses: row.otherExpenses,
        grossRevenue: row.grossRevenue,
        netProfit: row.netProfit
      }));
      res.json(data);
    } catch (error: any) {
      console.error("Sheet Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 2. AI 분석 API
  app.post("/api/analyze-sales", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY가 설정되지 않았습니다." });

      const { salesData, month, year } = req.body;
      const formattedData = salesData.map((item: any, index: number) => 
        `${index + 1}. 상품명: ${item.productName}, 총매출: ${item.grossRevenue}원, 순이익: ${item.netProfit}원`
      ).join("\n");

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `매출 데이터:\n${formattedData}`,
        config: {
          systemInstruction: `당신은 이커머스 경영 컨설턴트입니다. ${year}년 ${month}월 데이터를 분석해 주세요.`,
          temperature: 0.7,
        },
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
