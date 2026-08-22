"""Atomic agent job lease broker (C-410 Phase 2)."""

from app.jobs.router import router as jobs_router

__all__ = ["jobs_router"]
