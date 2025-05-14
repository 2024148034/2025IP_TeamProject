import requests
import json

# ✅ 본인의 인증키를 아래에 붙여넣기
API_KEY = "7376444b4d6f68723436526d73634a"
url = f"http://openapi.seoul.go.kr:8088/{API_KEY}/json/culturalEventInfo/1/1000/"

# ✅ API 요청 보내기
response = requests.get(url)
if response.status_code == 200:
    data = response.json()
    
    # ✅ JSON 파일로 저장
    with open("culturalEvents.json", "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print("✅ culturalEvents.json 파일 저장 완료!")
else:
    print(f"❌ 요청 실패: {response.status_code}")
