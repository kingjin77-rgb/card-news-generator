# 제2장: GitHub 저장소 준비하기

## 목차
1. [마크다운 기초](markdown-basics.md)

---

## 저장소 생성 방법

### 1단계: GitHub 계정 생성
[github.com](https://github.com)에서 무료 계정을 만듭니다.

### 2단계: 새 저장소 만들기
1. 우측 상단 **`+`** 버튼 → **New repository**
2. **Repository name** 입력 (예: `my-ebook`)
3. **Public** 선택 (GitBook 무료 연동 조건)
4. **Add a README file** 체크
5. **Create repository** 클릭

### 3단계: 필수 파일 구조

```
/
├── README.md        # 책 소개 (GitBook 홈페이지)
├── SUMMARY.md       # 목차 정의 (필수!)
├── .gitbook.yaml    # GitBook 설정
└── chapter1/
    └── README.md
```

> **핵심**: `SUMMARY.md` 파일이 GitBook의 목차를 결정합니다.
