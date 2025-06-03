require('dotenv').config();

const express = require('express');
const multer = require('multer');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.static('public'));

app.post('/process', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;

    //  이미지 Base64 인코딩
    const imageData = fs.readFileSync(filePath);
    const base64Image = imageData.toString('base64');

    //  CLOVA OCR 요청 JSON body
    const bodyData = {
      images: [
        {
          format: 'jpg',
          name: 'sample_image',
          data: base64Image
        }
      ],
      requestId: 'test-request',
      version: 'V2',
      timestamp: Date.now()
    };
    
    console.log("🔍 CLOVA OCR API 호출 시작");

    // CLOVA OCR API 요청
    const response = await fetch(process.env.NAVER_API_INVOKE_URL, {
      method: 'POST',
      headers: {
        'X-OCR-SECRET': process.env.NAVER_API_SECRET_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bodyData)
    });

    const ocrData = await response.json();
    console.log("CLOVA OCR 응답:", ocrData);

    // OCR 결과 안전 처리
    let ocrText = '';
    if (
      ocrData.images &&
      ocrData.images[0] &&
      ocrData.images[0].fields &&
      Array.isArray(ocrData.images[0].fields)
    ) {
      const words = ocrData.images[0].fields.map(field => field.inferText);
      ocrText = words.join(' ');
    } else {
      ocrText = 'OCR 결과 없음';
    }
    

    const promptContent = `아래 문서는 각종 고지서, 청구서, 안내문, 계약서와 같은 문서의 내용이야. 
                           단어 단위로 끊긴 상태인데, 이를 문장처럼 다시 정리해서 문해력과 어휘력이 초등학생 수준인 사람도 쉽게 이해할 수 있도록 바꿔줘야해. 
                           다음 사항들에 맞게 문서의 내용을 요약 및 정리해줘.\n 
                           1. 일단 당사자가 꼭 알아야 할 핵심 내용을 정리해줘. (예시1, 건강보험 고지서의 내용을 요약 - 6월 10일까지 1만원을 내야 해요. 늦게 내면 돈이 더 붙어요.
                                                                         예시2, 아르바이트 계약서의 중도 퇴사시 불이익 조항을 요약 - 일하다가 중간에 그만두면, 마지막 월급에서 돈이 빠질 수 있어요.)\n
                           2. 이후 핵심내용에 대한 이유라던지, 이해를 돕기 위한 예시 등을 부가적으로 붙여서 간단하게 설명해줘. 너무 길면 안 돼.\n
                           3. 이 때 사용하는 단어는 어려운 단어를 가급적 피해줘. 예를 들어 종합소득세 확정신고 안내문이라고 하면, 종합소득세 같은 단어는 그대로 쓰되, 납부 같은 단어는 돈을 내다, 환급금 같은 건 돌려받을 돈으로 쉽게 써준다고 생각하면 돼.\n
                           :\n${ocrText}`;

    // GPT API 호출 (쉬운 말 변환)
    console.log("🔍 GPT API 호출 시작");
    const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: '당신은 어려운 문서를 쉽게 풀어주는 도우미입니다.' },
          { role: 'user', content:  promptContent}
        ]
      })
    });

    const gptData = await gptResponse.json();
    console.log("GPT 응답:", gptData);

    // GPT 응답 안전 처리
    let easyText = '';
    if (
      gptData.choices &&
      gptData.choices[0] &&
      gptData.choices[0].message &&
      gptData.choices[0].message.content
    ) {
      easyText = gptData.choices[0].message.content;
    } else {
      easyText = 'GPT 변환 실패';
    }

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

app.listen(3000, () => console.log('서버 실행 중! http://localhost:3000'));
