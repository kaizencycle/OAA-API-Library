# app/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import os, time, uuid, re

# Default origins include Vercel preview deployments and localhost
DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8080",
    "https://mobius-browser-shell.vercel.app",
]

# Parse additional origins from environment
env_origins = os.getenv("ORIGINS", "")
extra_origins = [o.strip() for o in env_origins.split(",") if o.strip()]

ORIGINS = DEFAULT_ORIGINS + extra_origins

# Vercel preview deployment pattern
# Matches: mobius-browser-shell.vercel.app
#          mobius-browser-shell-abc123-team.vercel.app
#          mobius-browser-shell-iv2a4ld68-kaizencycles-projects.vercel.app
VERCEL_PREVIEW_PATTERN = re.compile(r"^https://mobius-browser-shell(-[a-z0-9]+-[a-z0-9]+-projects)?(-[a-z0-9]+)*\.vercel\.app$")

app = FastAPI(title="OAA-API-Library", version="0.1.0")

# Custom CORS middleware to handle Vercel preview deployments
@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    
    # Check if origin is allowed (static list or Vercel preview pattern)
    is_allowed = origin in ORIGINS or VERCEL_PREVIEW_PATTERN.match(origin)
    
    # Handle preflight OPTIONS requests
    if request.method == "OPTIONS":
        response = JSONResponse(content={}, status_code=200)
        if is_allowed:
            response.headers["Access-Control-Allow-Origin"] = origin
            response.headers["Access-Control-Allow-Credentials"] = "true"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With"
            response.headers["Access-Control-Max-Age"] = "86400"
        return response
    
    # Process the request
    response = await call_next(request)
    
    # Add CORS headers to response
    if is_allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
    
    return response

# --- Models ---
class AgentSpec(BaseModel):
    name: str
    roles: list[str] = Field(default_factory=list)
    tools: list[str] = Field(default_factory=list)
    version: str = "0.1.0"

class AgentQuery(BaseModel):
    agent: str
    query: str
    user_id: str | None = None
    context: dict | None = None

class LearnArtifact(BaseModel):
    user_id: str
    module_id: str
    content: str

class TutorMessage(BaseModel):
    role: str
    content: str

class TutorRequest(BaseModel):
    subject: str = "mathematics"
    message: str
    conversationHistory: list[TutorMessage] = Field(default_factory=list)

# --- Subject-specific system prompts for tutor ---
SUBJECT_PROMPTS = {
    "mathematics": "You are a patient, encouraging mathematics tutor. Explain concepts clearly with step-by-step examples. Use analogies when helpful.",
    "physics": "You are an insightful physics tutor. Connect mathematical formulas to physical intuition and real-world examples.",
    "chemistry": "You are a thorough chemistry tutor. Explain atomic and molecular behavior clearly with visual descriptions.",
    "biology": "You are an engaging biology tutor. Connect concepts across scales from molecular to ecosystem.",
    "computer-science": "You are a practical computer science tutor. Use code examples and explain algorithms step by step.",
    "economics": "You are a balanced economics tutor. Present multiple perspectives and use real-world examples.",
    "philosophy": "You are a thoughtful philosophy tutor. Ask Socratic questions to guide understanding.",
    "history": "You are a narrative history tutor. Connect events to broader patterns and human experiences.",
    "literature": "You are an insightful literature tutor. Explore themes, symbolism, and cultural context.",
    "general": "You are a helpful, patient tutor. Explain concepts clearly and encourage questions.",
}

# --- In-memory registry (replace with DB later) ---
AGENTS: dict[str, AgentSpec] = {}

@app.get("/health")
def health():
    return {"ok": True, "ts": time.time()}

@app.post("/agents/register")
def register_agent(spec: AgentSpec):
    key = spec.name.lower()
    AGENTS[key] = spec
    return {"ok": True, "registered": key, "count": len(AGENTS)}

@app.post("/agents/query")
def query_agent(req: AgentQuery):
    key = req.agent.lower()
    if key not in AGENTS:
        raise HTTPException(404, f"Agent '{req.agent}' not found")
    # STUB: route to LLM/tooling later
    reply = f"[{req.agent}] acknowledges: {req.query}"
    return {"ok": True, "agent": req.agent, "response": reply}

@app.post("/oaa/learn/submit")
def submit_learning(a: LearnArtifact):
    # STUB: write to Civic Ledger if CIVIC_LEDGER_URL set
    att = uuid.uuid4().hex
    return {"ok": True, "attestation": att, "module": a.module_id}

# --- Tutor API Endpoints ---

@app.get("/api/tutor")
def tutor_info():
    """
    GET handler for /api/tutor - returns API usage information.
    The actual tutor chat requires a POST request.
    """
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    
    return {
        "endpoint": "/api/tutor",
        "method": "POST",
        "description": "AI Tutor endpoint for OAA Learning Hub",
        "status": "ready" if (has_anthropic or has_openai) else "not_configured",
        "configured_providers": {
            "anthropic": has_anthropic,
            "openai": has_openai
        },
        "request_format": {
            "subject": "string (e.g., 'mathematics', 'physics', 'chemistry')",
            "message": "string (your question)",
            "conversationHistory": "array of {role: 'user'|'assistant', content: string}"
        },
        "example_curl": 'curl -X POST https://oaa-api-library.onrender.com/api/tutor -H "Content-Type: application/json" -d \'{"subject":"mathematics","message":"What is calculus?","conversationHistory":[]}\''
    }

@app.options("/api/tutor")
def tutor_options():
    """
    Explicit OPTIONS handler for CORS preflight requests.
    """
    return JSONResponse(
        content={},
        status_code=204,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
            "Access-Control-Max-Age": "86400"
        }
    )

@app.post("/api/tutor")
async def tutor_chat(req: TutorRequest):
    """
    AI Tutor endpoint using Anthropic Claude.
    Supports multiple subjects with specialized system prompts.
    """
    import httpx
    import sys
    
    print(f"=== Tutor endpoint called ===", file=sys.stderr)
    print(f"Subject: {req.subject}", file=sys.stderr)
    print(f"Message: {req.message[:100]}...", file=sys.stderr)
    print(f"History length: {len(req.conversationHistory)}", file=sys.stderr)
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    # Try Anthropic first, fallback to OpenAI
    if not api_key and not openai_key:
        raise HTTPException(
            status_code=503,
            detail="Tutor service unavailable: No API keys configured (ANTHROPIC_API_KEY or OPENAI_API_KEY)"
        )
    
    # Get subject-specific system prompt
    system_prompt = SUBJECT_PROMPTS.get(
        req.subject.lower(),
        SUBJECT_PROMPTS["general"]
    )
    
    # Build messages array from conversation history
    messages = []
    for msg in req.conversationHistory:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Add the current user message
    messages.append({
        "role": "user",
        "content": req.message
    })
    
    # Use Anthropic if available
    if api_key:
        print(f"Using Anthropic API", file=sys.stderr)
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 2000,
                        "system": system_prompt,
                        "messages": messages,
                        "temperature": 0.7
                    }
                )
                
                print(f"Anthropic response status: {response.status_code}", file=sys.stderr)
                
                if response.status_code != 200:
                    error_detail = response.json() if response.content else {"error": "Unknown error"}
                    print(f"Anthropic error: {error_detail}", file=sys.stderr)
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Anthropic API error: {error_detail}"
                    )
                
                data = response.json()
                assistant_response = data.get("content", [{}])[0].get("text", "")
                
                print(f"Response length: {len(assistant_response)} chars", file=sys.stderr)
                
                return {
                    "response": assistant_response,
                    "model": "claude-sonnet-4-20250514",
                    "subject": req.subject,
                    "usage": data.get("usage", {})
                }
                
        except httpx.TimeoutException:
            print(f"Anthropic timeout", file=sys.stderr)
            raise HTTPException(
                status_code=504,
                detail="Request to AI service timed out"
            )
        except httpx.RequestError as e:
            print(f"Anthropic request error: {e}", file=sys.stderr)
            raise HTTPException(
                status_code=502,
                detail=f"Failed to connect to AI service: {str(e)}"
            )
    
    # Fallback to OpenAI
    elif openai_key:
        print(f"Using OpenAI API", file=sys.stderr)
        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                openai_messages = [{"role": "system", "content": system_prompt}] + messages
                
                response = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {openai_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "gpt-4o-mini",
                        "messages": openai_messages,
                        "max_tokens": 2000,
                        "temperature": 0.7
                    }
                )
                
                print(f"OpenAI response status: {response.status_code}", file=sys.stderr)
                
                if response.status_code != 200:
                    error_detail = response.json() if response.content else {"error": "Unknown error"}
                    print(f"OpenAI error: {error_detail}", file=sys.stderr)
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"OpenAI API error: {error_detail}"
                    )
                
                data = response.json()
                assistant_response = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                print(f"Response length: {len(assistant_response)} chars", file=sys.stderr)
                
                return {
                    "response": assistant_response,
                    "model": "gpt-4o-mini",
                    "subject": req.subject,
                    "usage": data.get("usage", {})
                }
                
        except httpx.TimeoutException:
            print(f"OpenAI timeout", file=sys.stderr)
            raise HTTPException(
                status_code=504,
                detail="Request to AI service timed out"
            )
        except httpx.RequestError as e:
            print(f"OpenAI request error: {e}", file=sys.stderr)
            raise HTTPException(
                status_code=502,
                detail=f"Failed to connect to AI service: {str(e)}"
            )

@app.get("/api/tutor/providers")
def tutor_providers():
    """
    Get available AI providers for the tutor.
    """
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    has_deepseek = bool(os.getenv("DEEPSEEK_API_KEY"))
    
    providers = []
    if has_anthropic:
        providers.append("anthropic")
    if has_openai:
        providers.append("openai")
    if has_deepseek:
        providers.append("deepseek")
    
    return {
        "providers": providers if providers else ["none"],
        "default": "anthropic" if has_anthropic else ("openai" if has_openai else "none"),
        "configured": {
            "anthropic": has_anthropic,
            "openai": has_openai,
            "deepseek": has_deepseek
        }
    }

@app.get("/api/tutor/subjects")
def tutor_subjects():
    """
    Get available subjects for the tutor.
    """
    return {
        "subjects": list(SUBJECT_PROMPTS.keys()),
        "default": "mathematics"
    }

# --- Debug endpoints ---

@app.get("/api/debug/test-anthropic")
async def test_anthropic():
    """
    Debug endpoint to verify Anthropic API is working.
    """
    import httpx
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return {"status": "error", "error": "ANTHROPIC_API_KEY not set"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": "claude-sonnet-4-20250514",
                    "max_tokens": 50,
                    "messages": [{"role": "user", "content": "Say 'test successful' in exactly those words."}]
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                text = data.get("content", [{}])[0].get("text", "")
                return {"status": "success", "test_response": text, "model": "claude-sonnet-4-20250514"}
            else:
                return {"status": "error", "code": response.status_code, "error": response.json()}
    except Exception as e:
        return {"status": "error", "type": type(e).__name__, "error": str(e)}

@app.get("/api/debug/test-openai")
async def test_openai():
    """
    Debug endpoint to verify OpenAI API is working.
    """
    import httpx
    
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return {"status": "error", "error": "OPENAI_API_KEY not set"}
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "model": "gpt-4o-mini",
                    "messages": [{"role": "user", "content": "Say 'test successful' in exactly those words."}],
                    "max_tokens": 50
                }
            )
            
            if response.status_code == 200:
                data = response.json()
                text = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                return {"status": "success", "test_response": text, "model": "gpt-4o-mini"}
            else:
                return {"status": "error", "code": response.status_code, "error": response.json()}
    except Exception as e:
        return {"status": "error", "type": type(e).__name__, "error": str(e)}

# --- Root endpoint ---

@app.get("/")
def root():
    """
    API root - show available endpoints and service status.
    """
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    
    return {
        "service": "OAA API Library",
        "version": "0.2.0",
        "status": "ready" if (has_anthropic or has_openai) else "limited",
        "ai_providers": {
            "anthropic": "configured" if has_anthropic else "not_configured",
            "openai": "configured" if has_openai else "not_configured"
        },
        "endpoints": {
            "health": {"path": "/health", "method": "GET"},
            "tutor": {"path": "/api/tutor", "method": "POST", "info_method": "GET"},
            "tutor_providers": {"path": "/api/tutor/providers", "method": "GET"},
            "tutor_subjects": {"path": "/api/tutor/subjects", "method": "GET"},
            "debug_anthropic": {"path": "/api/debug/test-anthropic", "method": "GET"},
            "debug_openai": {"path": "/api/debug/test-openai", "method": "GET"},
            "agents_register": {"path": "/agents/register", "method": "POST"},
            "agents_query": {"path": "/agents/query", "method": "POST"},
            "learn_submit": {"path": "/oaa/learn/submit", "method": "POST"}
        },
        "docs": "/docs"
    }
