import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis"; // 추가됨
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // [추가] 구글 시트 데이터 가져오기 API
  app.get("/api/orders", async (req, res) => {
    try {
      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: '주문데이터!A:N', // 시트 이름이 '주문데이터'인지 확인!
      });

      res.json(response.data.values || []);
    } catch (error) {
      console.error("시트 로드 오류:", error);
      res.status(500).json({ error: "데이터 로드 실패" });
    }
  });

  // 기존 AI 분석 API (내용은 그대로)
  app.post("/api/analyze-sales", async (req, res) => {
    try {
      const { salesData, month, year } = req.body;
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `매출 데이터: ${JSON.stringify(salesData)}`,
        config: { systemInstruction: "전문 경영 분석가입니다.", temperature: 0.7 },
      });
      return res.json({ analysis: response.text });
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  });

  // Vite 설정 및 서버 실행 코드 (기존 내용 그대로 유지)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
