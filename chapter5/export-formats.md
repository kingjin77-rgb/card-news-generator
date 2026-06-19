# epub/pdf 내보내기

## epub 형식

### epub란?
epub(Electronic Publication)은 국제 표준 전자책 형식입니다.

**장점:**
- 대부분의 전자책 리더기 지원 (리디북스, 교보ebook, Apple Books 등)
- 화면 크기에 맞게 텍스트 자동 조정
- 글꼴 크기 변경 가능

### epub 생성 방법 (위키독스)
1. 위키독스 책 대시보드 → **전자책 만들기**
2. **epub** 선택 → **생성** 클릭
3. 완료 후 **다운로드**

### epub 생성 방법 (로컬, Pandoc)
```bash
pandoc README.md chapter1/*.md chapter2/*.md \
  -o my-ebook.epub \
  --metadata title="GitHub 전자책 만들기 가이드"
```

---

## pdf 형식

### pdf 생성 방법 (위키독스)
1. 위키독스 책 대시보드 → **전자책 만들기**
2. **pdf** 선택 → **생성** 클릭
3. 완료 후 **다운로드**

---

## 배포 체크리스트

- [ ] `SUMMARY.md` 목차가 모든 챕터를 포함하는지 확인
- [ ] 이미지 경로가 올바른지 확인
- [ ] GitBook에서 미리보기 확인
- [ ] epub/pdf 다운로드 후 실제 리더기에서 테스트
