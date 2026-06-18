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

 // server.ts 의 app.get("/api/orders", ...) 부분에 아래 로그를 추가해 보세요
app.get("/api/orders", async (req, res) => {
  console.log("서버가 데이터 요청을 받았습니다."); // 1. 이게 찍히는지 확인
  try {
    // ... 기존 시트 연동 코드 ...
    res.json(response.data.values || []);
  } catch (error: any) {
    console.error("서버 에러:", error);
    res.status(500).json({ error: error.message });
  }
});

  // ... (나머지 AI 분석 API 및 Vite 설정은 그대로 유지) ...
  // ... (하단 app.listen 코드 그대로 유지) ...
}
startServer();
