import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for AI analysis using Gemini SDK
  app.post("/api/analyze-sales", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY가 설정되지 않았습니다. AI 경영 분석 기능을 사용하려면 API 키가 필요합니다."
        });
      }

      const { salesData, month, year } = req.body;
      if (!salesData || !Array.isArray(salesData)) {
        return res.status(400).json({ error: "올바른 판매 데이터가 제공되지 않았습니다." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const formattedData = salesData.map((item, index) => {
        return `${index + 1}. 구매자: ${item.buyerName || "미입력"}, 상품명: ${item.productName || "미입력"}, 판매금액: ${item.saleAmount ?? 0}원, 배송비수입: ${item.shippingRevenue ?? 0}원, 상품원가: ${item.productCost ?? 0}원, 배송비지출: ${item.shippingExpense ?? 0}원, 광고비: ${item.adSpend ?? 0}원, 수수료: ${item.commissionFee ?? 0}원, 연동수수료: ${item.linkedFee ?? 0}원, 할인금액: ${item.discountAmount ?? 0}원, 기타비용: ${item.otherExpenses ?? 0}원 (총매출: ${item.grossRevenue ?? 0}원, 순이익: ${item.netProfit ?? 0}원)`;
      }).join("\n");

      const systemInstruction = `당신은 쿠팡, 스마트스토어 등 이커머스 쇼핑몰의 전문 경영 분석 및 마진 설계 컨설턴트입니다. 
제공된 이커머스 매출 및 지출 데이터(매출 계산표)를 면밀히 분석하고, 가독성 높은 마크다운 형식으로 사업가에게 피드백을 제공해 주세요.

지침:
1. 경영 현황 요약: 분석하는 연도(${year}년) 및 월(${month}월)의 매출 상황을 요약합니다. 총 판매금액, 총 원가율(상품원가/판매금액), 배송비 마진(수입 - 지출), 그리고 최종 순이익률(순이익/총매출)을 계산하여 알려주세요.
2. 강점 및 약점 도출: 어떤 상품이 가장 이익률이 높은지 혹은 어떤 비용(수수료, 배송비, 광고비, 기타비용) 부문이 너무 큰지 지적해 주세요.
3. 구체적인 경영 개선 제안: 마진율을 높이기 위해 원가 절감 처방, 배송비 세팅 조정(무료배송 vs 유료배송), 광고 효율 개선 제안, 대행 수수료 또는 기타 지출 최적화 팁을 구체적으로 제안하세요. 
4. 따뜻하고 전문적인 어조: 사업가들이 힘을 내어 개선할 수 있도록 격려하고 전문적이면서도 알기 쉽게 설명하세요.
5. 출력은 완성도 높은 Markdown 표와 텍스트 형태로 한국어로 답변해 주세요.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `매출 데이터:\n${formattedData || "이번 달 데이터가 비어 있습니다. 새로운 주문 행을 추가하고 데이터를 분석해 주세요."}`,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      return res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("AI Analysis Error:", error);
      return res.status(500).json({ error: error.message || "AI 분석 중 오류가 발생했습니다." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
