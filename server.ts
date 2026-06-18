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
  const rows = await sheet.getRows();
  
  // 데이터 확인용 로그 (Vercel 로그에서 확인 가능)
  console.log(`불러온 행 개수: ${rows.length}`);
  if (rows.length > 0) {
    console.log("첫 번째 행 샘플:", JSON.stringify(rows[0]._rawData));
  }
  
  return rows;
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
      
      // 시트의 각 행을 JSON 객체로 변환
      const data = rows.map(row => ({
        // 시트의 헤더 이름과 아래 키 값이 일치해야 합니다.
        buyerName: row.buyerName || "",
        productName: row.productName || "",
        saleAmount: row.saleAmount || 0,
        productCost: row.productCost || 0,
        shippingRevenue: row.shippingRevenue || 0,
        shippingExpense: row.shippingExpense || 0,
        adSpend: row.adSpend || 0,
        commissionFee: row.commissionFee || 0,
        linkedFee: row.linkedFee || 0,
        discountAmount: row.discountAmount || 0,
        otherExpenses: row.otherExpenses || 0,
        grossRevenue: row.grossRevenue || 0,
        netProfit: row.netProfit || 0
      }));
      
      res.json(data);
    } catch (error: any) {
      console.error("Sheet Error:", error);
      res.status(500).json({ error: "데이터를 불러오는 중 오류가 발생했습니다: " + error.message });
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
