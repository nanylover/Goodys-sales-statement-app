// 환경 변수를 사용하여 구글 시트 인증 정보를 불러옵니다.
const { GoogleSpreadsheet } = require('google-spreadsheet');

// 1. 시트 ID는 환경 변수에서 가져옵니다.
const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID);

// 2. 인증 정보를 환경 변수에서 가져옵니다.
async function authorize() {
  await doc.useServiceAccountAuth({
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // 여기서 \n을 실제 줄바꿈으로 변환해주는 것이 핵심입니다!
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  });
}

// 이후 시트 읽기/쓰기 로직...
