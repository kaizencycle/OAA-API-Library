from typing import Literal

from pydantic import BaseModel, Field, field_validator


class JobClaimRequest(BaseModel):
    request_id: str = Field(min_length=8, max_length=128)
    job_id: str = Field(min_length=3, max_length=128)
    cycle: str = Field(pattern=r"^C-\d+$")
    runtime_id: str = Field(min_length=3, max_length=128)
    evidence_hash: str = Field(pattern=r"^sha256:[a-f0-9]{64}$")
    repositories: list[str] = Field(min_length=1, max_length=12)
    scope_paths: list[str] = Field(min_length=1, max_length=100)
    branch: str = Field(min_length=1, max_length=255)
    lease_seconds: int = Field(default=7200, ge=300, le=7200)

    @field_validator("repositories", "scope_paths")
    @classmethod
    def reject_empty_or_duplicate_values(cls, values: list[str]) -> list[str]:
        normalized = [value.strip() for value in values]
        if any(not value for value in normalized):
            raise ValueError("values must be non-empty")
        if len(set(normalized)) != len(normalized):
            raise ValueError("duplicate values are not allowed")
        return normalized


class JobHeartbeatRequest(BaseModel):
    claim_id: str = Field(min_length=32, max_length=64)
    lease_seconds: int = Field(default=7200, ge=300, le=7200)


class JobReleaseRequest(BaseModel):
    claim_id: str = Field(min_length=32, max_length=64)
    outcome: Literal["review", "blocked", "released", "complete"]
    branch: str | None = Field(default=None, max_length=255)
    pull_request_url: str | None = Field(default=None, max_length=500)
    evidence_url: str | None = Field(default=None, max_length=500)
    note: str | None = Field(default=None, max_length=2000)


class JobLease(BaseModel):
    job_id: str
    claim_id: str
    request_id: str
    cycle: str
    agent_id: str
    runtime_id: str
    evidence_hash: str
    repositories: list[str]
    scope_paths: list[str]
    branch: str
    state: Literal["active", "review", "blocked", "released", "complete", "expired"]
    claimed_at: str
    lease_expires_at: str
    last_heartbeat_at: str
    version: int
    execution_authorized: bool = False


class JobClaimResponse(BaseModel):
    ok: bool = True
    lease: JobLease
    authority: Literal["assignment_only"] = "assignment_only"
    notion_projection_required: bool = True


class JobConflictResponse(BaseModel):
    ok: bool = False
    code: Literal["ACTIVE_CLAIM_CONFLICT"] = "ACTIVE_CLAIM_CONFLICT"
    incumbent: JobLease


class ActiveJobsResponse(BaseModel):
    jobs: list[JobLease]
    authority: Literal["assignment_only"] = "assignment_only"
