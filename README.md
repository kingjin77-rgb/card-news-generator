# Claude AI 앱 모음

Claude AI API를 활용한 싱글-파일 웹 앱 모음입니다. 브라우저로 직접 열어 사용할 수 있습니다.

---

## ⚖️ 나만의 변호사 AI (`lawyer-ai.html`)

Claude AI가 대한민국 법률에 기반한 법률 문서와 상담을 제공하는 앱입니다.

### 주요 기능
- **계약서 작성** — 임대차/용역/매매 등 계약서 초안 자동 생성
- **법률 상담** — 법적 상황 분석 및 대처 방안 안내
- **내용증명 작성** — 공식 내용증명 서신 초안 생성
- **계약서 검토** — 위험 조항 분석 및 개선안 제시
- **고소장/진정서** — 고소장·진정서 초안 생성
- **권리 설명** — 상황별 법적 권리 안내

### 사용법
1. `lawyer-ai.html`을 브라우저로 열기
2. 법률 서비스 카테고리 선택
3. 상황 설명 입력
4. Claude API Key 입력 (`sk-ant-...`) — [발급](https://console.anthropic.com)
5. **문서 생성** 버튼 클릭
6. 인쇄(PDF) 또는 PNG로 저장

API 키 없이 **샘플 미리보기** 버튼으로 먼저 체험 가능.

> ⚠️ **법적 고지:** AI 생성 문서는 참고용입니다. 실제 법적 효력이 없으며, 중요한 법률 문제는 공인 변호사와 상담하세요.

---

## 📰 카드뉴스 자동생성기 (`card-news-generator.html`)

주제를 입력하면 Claude AI가 콘텐츠를 작성하고, VoiceBox 디자인 시스템으로 카드뉴스를 자동 생성합니다.

### 주요 기능
- Claude AI로 주제에 맞는 콘텐츠 자동 생성
- 이미지 자동 삽입 (내용에 따라 AI가 판단)
- 4가지 컬러 테마 (Classic / Dark / Navy / Green)
- PNG 고해상도 다운로드 (3× 스케일)
- API 키 없이 샘플 미리보기 가능

### 실행 방법

`카드뉴스_실행.bat` 더블클릭 → Edge 브라우저에서 자동 오픈

또는 `card-news-generator.html` 을 브라우저로 직접 열기

### 사용법
1. Claude API Key 입력 (`sk-ant-...`) — [발급](https://console.anthropic.com)
2. 주제 입력 (예: `AI가 바꾸는 미래 직업`)
3. 카드뉴스 생성 버튼 클릭
4. PNG 다운로드

---

## 디자인 시스템

[VoiceBox by DesignMD](https://designmd.ai/chef/voicebox) — Bold, magazine-style
