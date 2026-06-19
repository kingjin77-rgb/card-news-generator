# 제5장: 전자책 배포 및 출판

## 목차
1. [epub/pdf 내보내기](export-formats.md)

---

## 배포 방법 요약

| 배포 방식 | 도구 | 특징 |
|----------|------|------|
| 웹 문서 | GitBook | URL 공유, 실시간 업데이트 |
| epub | Wikidocs | 전자책 리더기 호환 |
| pdf | Wikidocs | 인쇄·오프라인 열람 |
| 웹사이트 | GitHub Pages | 완전 커스터마이징 |

## 업데이트 흐름

```
원고 수정 (마크다운)
    ↓
git add & commit
    ↓
git push origin main
    ↓
GitBook 자동 갱신 ←→ Wikidocs 수동 동기화
```
