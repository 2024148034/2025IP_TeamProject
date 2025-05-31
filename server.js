require('dotenv').config();

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public')); // public 폴더 제공

app.post('/process', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;

    // OCR.Space API 요청 준비
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('language', 'kor');
    form.append('isOverlayRequired', 'false');
    form.append('apikey', process.env.OCR_SPACE_API_KEY);

    console.log("🔍 OCR API 호출 시작");

    // OCR.Space API 호출
    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: form,
      headers: {
        ...form.getHeaders()
      }
    });

    // 응답 타입 확인 (json or text)
    const contentType = ocrResponse.headers.get('content-type');
    let ocrText = '';
    if (contentType && contentType.includes('application/json')) {
      const ocrData = await ocrResponse.json();
      console.log("✅ OCR 결과:", ocrData);
      ocrText = ocrData.ParsedResults?.[0]?.ParsedText || 'OCR 실패';
    } else {
      const textData = await ocrResponse.text();
      console.log("❌ OCR 오류 응답:", textData);
      throw new Error('OCR API 응답이 JSON이 아님');
    }

    // GPT API 호출 (쉬운 말 변환)
    console.log("🔍 GPT API 호출 시작");
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '당신은 어려운 문서를 쉽게 풀어주는 도우미입니다.' },
          { role: 'user', content: `아래 문서를 초등학생도 이해할 수 있도록 바꿔줘:\n${ocrText}` }
        ]
      })
    });

    const gptData = await gptResponse.json();
    const easyText = gptData.choices[0].message.content;

    // 클라이언트로 응답
    res.json({
      ocr: ocrText,
      easy: easyText
    });

    // 업로드된 파일 삭제
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류: ' + error.message });
  }
});

app.listen(3000, () => console.log('✅ 서버 실행 중! http://localhost:3000'));
