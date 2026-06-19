# 제3장: GitBook 연동하기

## 목차
1. [GitBook 설정 방법](gitbook-setup.md)

---

## GitBook이란?

GitBook은 GitHub 저장소의 마크다운 파일을 아름다운 문서/전자책으로 자동 변환해주는 서비스입니다.

## 연동 특징
- GitHub에 push → GitBook 자동 업데이트
- 웹 URL로 바로 공유 가능
- 무료 플랜: 1개 Space, 공개 문서 무제한

## 핵심 파일: SUMMARY.md

`SUMMARY.md`는 GitBook의 목차를 정의하는 핵심 파일입니다:

```markdown
# 목차

* [소개](README.md)

## 제1장: 제목
* [1장 개요](chapter1/README.md)
* [1절: 내용](chapter1/section1.md)
```
