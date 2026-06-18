import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // 1. 구글 시트 데이터를 가져오는 API
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
        range: '주문데이터!A:N', // 탭 이름이 '주문데이터'인지 반드시 확인하세요!
      });

      res.json(response.data.values || []);
    } catch (error) {
      console.error("구글 시트 읽기 오류:", error);
      res.status(500).json({ error: "데이터를 불러올 수 없습니다." });
    }
  });

  // 2. 기존 AI 분석 API
  app.post("/api/analyze-sales", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "API 키가 없습니다." });
      }

      const { salesData, month, year } = req.body;
      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `당신은 전문 이커머스 컨설턴트입니다. ${year}년 ${month}월 매출 상황을 요약하고, 마진율 개선을 위한 구체적인 전략을 제안하세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `매출 데이터: ${JSON.stringify(salesData)}`,
        config: { systemInstruction, temperature: 0.7 },
      });

      return res.json({ analysis: response.text });
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return res.status(500).json({ error: "분석 실패" });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
