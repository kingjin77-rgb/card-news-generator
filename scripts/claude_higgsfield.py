#!/usr/bin/env python3
"""
Claude + Higgsfield.ai 자동화 스크립트
카드뉴스 콘텐츠를 Claude로 생성하고 Higgsfield API로 영상을 만든다.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path

import anthropic
import requests

OUTPUT_DIR = Path("output")
HIGGSFIELD_BASE = "https://platform.higgsfield.ai"
POLL_INTERVAL = 30  # seconds
POLL_TIMEOUT = 600  # 10 minutes


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--topic", required=True)
    parser.add_argument("--tone", default="informative")
    parser.add_argument("--model", default="kling3_0")
    return parser.parse_args()


def check_secrets():
    missing = [k for k in ("ANTHROPIC_API_KEY", "HF_API_KEY", "HF_API_SECRET") if not os.getenv(k)]
    if missing:
        print(f"[ERROR] 다음 GitHub Secrets가 설정되지 않았습니다: {', '.join(missing)}")
        print("Settings → Secrets → Actions 에서 추가해 주세요.")
        sys.exit(1)


TONE_MAP = {
    "informative": "사실과 데이터 중심으로 명확하게 전달하세요.",
    "persuasive": "독자가 행동하도록 강한 메시지와 설득력 있는 표현을 사용하세요.",
    "educational": "단계별 설명과 쉬운 언어로 이해를 돕는 교육적 내용을 작성하세요.",
    "trendy": "MZ세대 친화적이고 트렌디한 표현과 감각적인 어투를 사용하세요.",
    "expert": "심층 분석과 전문 용어를 사용해 전문가 수준의 내용을 작성하세요.",
}

CARD_NEWS_SYSTEM = """당신은 카드뉴스 콘텐츠 전문가입니다. 주어진 주제로 매력적인 카드뉴스를 만드세요.
반드시 아래 JSON 형식만 출력하고 다른 텍스트는 절대 포함하지 마세요."""

CARD_NEWS_USER = """\
주제: {topic}
톤: {tone_guide}

아래 JSON 스키마를 정확히 따라 카드뉴스 콘텐츠를 한국어로 작성하세요:

{{
  "topic": "주제 요약 제목",
  "tag": "카테고리 태그",
  "cover": {{"title": "메인 헤드라인 (20자 이내)", "subtitle": "부제목 (30자 이내)"}},
  "intro": {{"overline": "도입 태그", "heading": "소제목", "body": "2-3문장 소개"}},
  "points": [
    {{"num": "01", "label": "핵심 포인트 제목", "detail": "상세 설명 2-3문장", "highlight": "핵심 키워드"}},
    {{"num": "02", "label": "핵심 포인트 제목", "detail": "상세 설명 2-3문장", "highlight": "핵심 키워드"}},
    {{"num": "03", "label": "핵심 포인트 제목", "detail": "상세 설명 2-3문장", "highlight": "핵심 키워드"}}
  ],
  "quote": {{"text": "인상적인 인용구 또는 핵심 메시지", "source": "출처 또는 화자"}},
  "closing": {{"overline": "마무리 태그", "heading": "마무리 헤드라인", "cta": "독자에게 전하는 행동 촉구 메시지"}},
  "video_prompt": "A cinematic video about {topic_en}. [영어로 된 Higgsfield 최적화 영상 프롬프트: 시각적 장면 묘사, 카메라 움직임, 분위기를 영어로 2-3문장]"
}}"""


def generate_content_with_claude(topic: str, tone: str) -> dict:
    print(f"[1/3] Claude로 카드뉴스 콘텐츠 생성 중... (주제: {topic})")
    client = anthropic.Anthropic(api_key=os.environ["ANTHROPIC_API_KEY"])

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=2000,
        system=CARD_NEWS_SYSTEM,
        messages=[
            {
                "role": "user",
                "content": CARD_NEWS_USER.format(
                    topic=topic,
                    tone_guide=TONE_MAP.get(tone, TONE_MAP["informative"]),
                    topic_en=topic,
                ),
            }
        ],
    )

    raw = message.content[0].text.strip()
    # JSON 블록 추출
    import re
    match = re.search(r"\{[\s\S]*\}", raw)
    if not match:
        print("[ERROR] Claude 응답에서 JSON을 찾을 수 없습니다.")
        print(raw)
        sys.exit(1)

    content = json.loads(match.group())
    print(f"  ✓ 콘텐츠 생성 완료: {content.get('topic', topic)}")
    return content


def submit_higgsfield_job(video_prompt: str, model: str) -> dict:
    print(f"[2/3] Higgsfield API로 영상 생성 요청 중... (모델: {model})")
    api_key = os.environ["HF_API_KEY"]
    api_secret = os.environ["HF_API_SECRET"]

    url = f"{HIGGSFIELD_BASE}/jobs/v2/{model}"
    headers = {
        "Content-Type": "application/json",
        "x-api-key": f"{api_key}:{api_secret}",
    }
    payload = {
        "prompt": video_prompt,
        "duration": 5,
    }

    resp = requests.post(url, json=payload, headers=headers, timeout=30)
    if resp.status_code not in (200, 201, 202):
        print(f"[ERROR] Higgsfield API 오류 {resp.status_code}: {resp.text}")
        sys.exit(1)

    job = resp.json()
    print(f"  ✓ 작업 제출 완료 (request_id: {job.get('request_id', 'N/A')})")
    return job


def poll_job(job: dict) -> str:
    status_url = job.get("status_url")
    if not status_url:
        print("[ERROR] status_url을 찾을 수 없습니다.")
        sys.exit(1)

    print(f"[3/3] 영상 생성 대기 중... (최대 {POLL_TIMEOUT // 60}분)")
    api_key = os.environ["HF_API_KEY"]
    api_secret = os.environ["HF_API_SECRET"]
    headers = {"x-api-key": f"{api_key}:{api_secret}"}

    elapsed = 0
    while elapsed < POLL_TIMEOUT:
        time.sleep(POLL_INTERVAL)
        elapsed += POLL_INTERVAL

        resp = requests.get(status_url, headers=headers, timeout=30)
        if resp.status_code != 200:
            print(f"  상태 확인 오류 {resp.status_code}, 재시도...")
            continue

        data = resp.json()
        status = data.get("status", "unknown")
        print(f"  [{elapsed}s] 상태: {status}")

        if status == "completed":
            video = data.get("video", {})
            video_url = video.get("url") if isinstance(video, dict) else None
            if not video_url:
                print("[ERROR] 완료됐지만 비디오 URL이 없습니다.")
                print(json.dumps(data, indent=2))
                sys.exit(1)
            return video_url

        if status in ("failed", "nsfw"):
            print(f"[ERROR] 작업 실패: {status}")
            print(json.dumps(data, indent=2))
            sys.exit(1)

    print("[ERROR] 타임아웃: 영상 생성이 완료되지 않았습니다.")
    sys.exit(1)


def download_video(url: str, dest: Path):
    print(f"  영상 다운로드 중...")
    resp = requests.get(url, stream=True, timeout=120)
    resp.raise_for_status()
    with open(dest, "wb") as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    size_mb = dest.stat().st_size / 1024 / 1024
    print(f"  ✓ 저장 완료: {dest} ({size_mb:.1f} MB)")


def save_summary(content: dict, video_path: Path, topic: str, tone: str, model: str):
    summary = f"""# 카드뉴스 생성 결과

## 기본 정보
- **주제:** {topic}
- **톤:** {tone}
- **비디오 모델:** {model}

## 생성된 콘텐츠

**제목:** {content.get('topic', '')}
**태그:** {content.get('tag', '')}

### 커버
> {content.get('cover', {}).get('title', '')}
> {content.get('cover', {}).get('subtitle', '')}

### 핵심 포인트
"""
    for p in content.get("points", []):
        summary += f"- **{p.get('num')}. {p.get('label')}**: {p.get('highlight')}\n"

    summary += f"""
### 인용구
> "{content.get('quote', {}).get('text', '')}"
> — {content.get('quote', {}).get('source', '')}

## 생성 파일
- `content.json` — 카드뉴스 전체 JSON
- `{video_path.name}` — Higgsfield 생성 영상 (MP4)
"""
    (OUTPUT_DIR / "summary.md").write_text(summary, encoding="utf-8")
    print("  ✓ 요약 저장 완료: output/summary.md")


def main():
    args = parse_args()
    check_secrets()
    OUTPUT_DIR.mkdir(exist_ok=True)

    content = generate_content_with_claude(args.topic, args.tone)

    content_path = OUTPUT_DIR / "content.json"
    content_path.write_text(json.dumps(content, ensure_ascii=False, indent=2), encoding="utf-8")

    video_prompt = content.get("video_prompt", f"A cinematic video about {args.topic}")
    job = submit_higgsfield_job(video_prompt, args.model)

    video_url = poll_job(job)
    video_path = OUTPUT_DIR / "video.mp4"
    download_video(video_url, video_path)

    save_summary(content, video_path, args.topic, args.tone, args.model)

    print("\n완료! output/ 폴더를 확인하세요.")


if __name__ == "__main__":
    main()
