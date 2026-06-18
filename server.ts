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

  // 데이터 로드 API: 명시적으로 등록
  app.get("/api/orders", async (req, res) => {
    console.log("서버가 데이터 요청을 받았습니다."); 
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
        range: '주문데이터!A:N',
      });
      res.json(response.data.values || []);
    } catch (error: any) {
      console.error("서버 에러:", error.message);
      res.status(500).json({ error: error.message });
    }
  });

  // (AI 분석 및 서버 실행 설정 코드는 기존 내용 그대로 유지하세요)
  // ... (Vite 설정 및 app.listen 등)
}
startServer();
