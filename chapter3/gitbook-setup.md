# GitBook 설정 방법

## 1단계: GitBook 계정 생성
1. [gitbook.com](https://gitbook.com) 접속
2. **Sign up** → GitHub 계정으로 로그인 (권장)

## 2단계: 새 Space 생성
1. 로그인 후 **+ New Space** 클릭
2. Space 이름 입력 (예: "GitHub 전자책 가이드")
3. **Create** 클릭

## 3단계: GitHub 연동
1. Space 설정 → **Integrations** 탭
2. **GitHub** 선택 → **Connect with GitHub** 클릭
3. GitHub 인증 → 연동할 저장소 선택
4. 브랜치 선택 (보통 `main`)
5. **Save** 클릭

## 4단계: 동기화 확인
연동 후 GitBook이 저장소의 마크다운 파일을 읽어 자동으로 문서를 생성합니다.

## 자주 발생하는 문제

| 문제 | 해결 방법 |
|------|----------|
| GitBook에 내용이 반영 안 됨 | `SUMMARY.md`에 해당 파일 경로 추가 확인 |
| 목차 순서가 이상함 | `SUMMARY.md` 파일 순서 재정렬 |
| 이미지가 안 보임 | 이미지 경로가 상대경로인지 확인 |
