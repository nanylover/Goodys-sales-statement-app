import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { google } from "googleapis";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;
  app.use(express.json());

  app.get("/api/orders", async (req, res) => {
    try {
      // 키를 한 줄로 깔끔하게 정리하는 로직
      const rawKey = process.env.GOOGLE_PRIVATE_KEY || "";
      const cleanedKey = rawKey.includes("\\n") ? rawKey.replace(/\\n/g, '\n') : rawKey;

      const auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
          private_key: cleanedKey,
        },
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      const sheets = google.sheets({ version: 'v4', auth });
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID,
        range: '주문데이터!A:N',
      });
      res.json(response.data.values || []);
    } catch (error: any) {
      console.error("서버 에러 상세:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // ... (나머지 AI 분석 API 및 Vite 설정은 그대로 유지) ...
  // ... (하단 app.listen 코드 그대로 유지) ...
}
startServer();
