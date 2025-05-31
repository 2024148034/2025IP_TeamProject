require('dotenv').config();

const express = require('express');
const multer = require('multer');
const fs = require('fs');
const FormData = require('form-data');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public')); // public 폴더 (index.html 등) 제공

// OCR.Space API + GPT API 처리 엔드포인트
app.post('/process', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;

    // OCR.Space API 호출
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('language', 'kor'); // 한국어
    form.append('isOverlayRequired', 'false');
    form.append('apikey', process.env.OCR_SPACE_API_KEY); // API 키는 환경변수로 보관

    const ocrResponse = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      body: form
    });
    const ocrData = await ocrResponse.json();
    const ocrText = ocrData.ParsedResults?.[0]?.ParsedText || 'OCR 실패';

    // GPT API 호출 (쉬운 말로 변환)
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: '당신은 문서를 아주 쉽게 풀어주는 도우미입니다.' },
          { role: 'user', content: `아래 문서를 초등학생도 이해할 수 있도록 바꿔줘:\n${ocrText}` }
        ]
      })
    });
    const gptData = await gptResponse.json();
    const easyText = gptData.choices[0].message.content;

    // 응답: OCR 원본 + 쉬운 문장
    res.json({
      ocr: ocrText,
      easy: easyText
    });

    // 업로드된 파일 삭제
    fs.unlinkSync(filePath);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: '서버 오류' });
  }
});

app.listen(3000, () => console.log('서버 실행 중! http://localhost:3000'));
