from typing import Any, Literal

from pydantic import BaseModel, Field


class SentinelReviewContext(BaseModel):
    meta: dict[str, Any] = Field(default_factory=dict)
    files: str = ""
    diff: str = ""


class SentinelReviewRequest(BaseModel):
    task: str = "pr_sentinel_review"
    sentinels: list[str]
    tier: int = 1
    policy_ref: str = "base"
    context_hash: str
    context: SentinelReviewContext
    prompt_version: str


class SentinelVerdict(BaseModel):
    sentinel: str
    verdict: Literal["pass", "fail", "skipped"]
    blocking: list[str] = Field(default_factory=list)
    non_blocking: list[str] = Field(default_factory=list)
    summary: str = ""
    model: str | None = None
    cached: bool = False
    attestation: str | None = None
    skip_reason: str | None = None


class SentinelReviewResponse(BaseModel):
    verdicts: list[SentinelVerdict]
    prompt_version: str
    attestations_persisted: bool = False
