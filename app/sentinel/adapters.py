import json
import logging
import os
import re
from typing import Any

import httpx

from app.sentinel.models import SentinelReviewContext, SentinelVerdict

logger = logging.getLogger("oaa.sentinel.adapters")

MAX_PROMPT_CHARS = int(os.getenv("SENTINEL_MAX_PROMPT_CHARS", "200000"))

AUREA_SYSTEM = "You are AUREA, an integrity reviewer. Return STRICT JSON only."
ATLAS_SYSTEM = "You are ATLAS. Return STRICT JSON only."

INSTRUCTION = """
Return ONLY valid JSON (no markdown, no prose) with schema:
{
  "verdict": "pass" | "fail",
  "summary": "string (<=400 chars)",
  "blocking": ["..."],
  "non_blocking": ["..."],
  "epicon_checks": {
     "epicon_present": true|false,
     "docs_present": true|false,
     "notes": ["..."]
  }
}
Rules:
- "blocking" MUST include any missing EPICON/docs requirements you detect.
- Only mark "fail" if there is at least one blocking item.
- Be concrete: cite file paths when possible.
"""

ATLAS_EXTRA = """
- Look for falsifiability gaps, arbitrary thresholds, and compliance-theater risk.
"""


def _parse_model_json(text: str, sentinel: str) -> dict[str, Any]:
    json_text = text.strip()
    if json_text.startswith("```json"):
        json_text = json_text[7:]
    elif json_text.startswith("```"):
        json_text = json_text[3:]
    if json_text.endswith("```"):
        json_text = json_text[:-3]
    try:
        parsed = json.loads(json_text.strip())
    except json.JSONDecodeError as exc:
        return {
            "verdict": "fail",
            "blocking": [f"{sentinel} output was not valid JSON"],
            "non_blocking": [],
            "summary": "Parsing failed — model returned non-JSON (review failure, not SKIPPED).",
            "raw": text[:1200],
            "_parse_error": str(exc),
        }
    verdict = str(parsed.get("verdict", "fail")).lower()
    blocking = parsed.get("blocking") if isinstance(parsed.get("blocking"), list) else []
    blocking = [str(b) for b in blocking if b]
    if verdict == "pass" and not blocking:
        return {
            "verdict": "pass",
            "blocking": [],
            "non_blocking": parsed.get("non_blocking") or [],
            "summary": parsed.get("summary") or "",
        }
    return {
        "verdict": "fail",
        "blocking": blocking or [f"{sentinel} review failed"],
        "non_blocking": parsed.get("non_blocking") or [],
        "summary": parsed.get("summary") or "",
    }


def _build_prompt(sentinel: str, context: SentinelReviewContext) -> str:
    extra = ATLAS_EXTRA if sentinel == "atlas" else ""
    meta = json.dumps(context.meta, ensure_ascii=False, indent=2)
    content = f"""# {sentinel.upper()} Sentinel Review
## PR Meta
{meta}
## Changed files
{context.files}
## Diff (truncated)
{context.diff}
{INSTRUCTION}
{extra}
"""
    if len(content) > MAX_PROMPT_CHARS:
        content = content[:MAX_PROMPT_CHARS] + "\n\n[CONTENT TRUNCATED]\n"
    return content


def _skipped(sentinel: str, reason: str, summary: str) -> SentinelVerdict:
    return SentinelVerdict(
        sentinel=sentinel,
        verdict="skipped",
        blocking=[],
        non_blocking=[],
        summary=summary,
        model=None,
        cached=False,
        skip_reason=reason,
    )


def review_aurea(context: SentinelReviewContext) -> SentinelVerdict:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return _skipped(
            "aurea",
            "OPENAI_API_KEY not configured on broker",
            "AUREA review skipped — vendor key absent on broker.",
        )

    model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    prompt = _build_prompt("aurea", context)

    try:
        with httpx.Client(timeout=120.0) as client:
            res = client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": model,
                    "temperature": 0.1,
                    "messages": [
                        {"role": "system", "content": AUREA_SYSTEM},
                        {"role": "user", "content": prompt},
                    ],
                },
            )
    except httpx.HTTPError as exc:
        return _skipped(
            "aurea",
            f"OpenAI transport error: {exc}",
            "AUREA request failed at vendor transport layer.",
        )

    if res.status_code >= 400:
        return _skipped(
            "aurea",
            f"OpenAI HTTP {res.status_code}",
            "AUREA request failed at vendor transport layer.",
        )

    data = res.json()
    text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
    parsed = _parse_model_json(text, "AUREA")
    return SentinelVerdict(
        sentinel="aurea",
        verdict=parsed["verdict"],
        blocking=parsed.get("blocking") or [],
        non_blocking=parsed.get("non_blocking") or [],
        summary=parsed.get("summary") or "",
        model=model,
        cached=False,
    )


def review_atlas(context: SentinelReviewContext) -> SentinelVerdict:
    prompt = _build_prompt("atlas", context)
    anthropic_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
    openai_key = os.getenv("OPENAI_API_KEY", "").strip()

    if anthropic_key:
        model = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-4-20250514")
        try:
            with httpx.Client(timeout=120.0) as client:
                res = client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json",
                    },
                    json={
                        "model": model,
                        "max_tokens": 1200,
                        "temperature": 0.1,
                        "system": ATLAS_SYSTEM,
                        "messages": [{"role": "user", "content": prompt}],
                    },
                )
        except httpx.HTTPError as exc:
            return _skipped(
                "atlas",
                f"Anthropic transport error: {exc}",
                "ATLAS request failed at vendor transport layer.",
            )

        if res.status_code >= 400:
            return _skipped(
                "atlas",
                f"Anthropic HTTP {res.status_code}",
                "ATLAS request failed at vendor transport layer.",
            )

        data = res.json()
        parts = data.get("content") or []
        text = "\n".join(p.get("text", "") for p in parts).strip()
        parsed = _parse_model_json(text, "ATLAS")
        return SentinelVerdict(
            sentinel="atlas",
            verdict=parsed["verdict"],
            blocking=parsed.get("blocking") or [],
            non_blocking=parsed.get("non_blocking") or [],
            summary=parsed.get("summary") or "",
            model=model,
            cached=False,
        )

    if openai_key:
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        try:
            with httpx.Client(timeout=120.0) as client:
                res = client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": model,
                        "temperature": 0.1,
                        "messages": [
                            {"role": "system", "content": "You are ATLAS, a skeptical systems auditor. Return STRICT JSON only."},
                            {"role": "user", "content": prompt},
                        ],
                    },
                )
        except httpx.HTTPError as exc:
            return _skipped(
                "atlas",
                f"OpenAI fallback transport error: {exc}",
                "ATLAS request failed at vendor transport layer (OpenAI fallback).",
            )

        if res.status_code >= 400:
            return _skipped(
                "atlas",
                f"OpenAI HTTP {res.status_code}",
                "ATLAS request failed at vendor transport layer (OpenAI fallback).",
            )

        data = res.json()
        text = (data.get("choices") or [{}])[0].get("message", {}).get("content", "") or ""
        parsed = _parse_model_json(text, "ATLAS")
        return SentinelVerdict(
            sentinel="atlas",
            verdict=parsed["verdict"],
            blocking=parsed.get("blocking") or [],
            non_blocking=parsed.get("non_blocking") or [],
            summary=parsed.get("summary") or "",
            model=model,
            cached=False,
        )

    return _skipped(
        "atlas",
        "No vendor keys configured on broker",
        "ATLAS review skipped — configure ANTHROPIC_API_KEY or OPENAI_API_KEY on broker.",
    )


def normalize_sentinel_name(name: str) -> str:
    return re.sub(r"[^a-z]", "", name.lower())
