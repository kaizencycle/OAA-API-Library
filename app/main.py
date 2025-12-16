# app/main.py
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import os, time, uuid, re

# Learning Hub imports
from app.models.learning import (
    SessionStartRequest,
    SessionStartResponse,
    AnswerSubmitRequest,
    AnswerSubmitResponse,
    SessionCompleteRequest,
    SessionCompleteResponse,
    ModuleListResponse,
    ModuleDetailResponse,
    UserProgressResponse,
    RewardEstimate,
    SessionStatus,
    CircuitBreakerStatus,
)
from app.services.learning_store import learning_store
from app.services.mic_minting import MICMintingService

# Initialize services
mic_service = MICMintingService()

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

class JadeMessage(BaseModel):
    role: str
    content: str

class JadeUserContext(BaseModel):
    userId: str | None = None
    displayName: str | None = None
    
class JadeRequest(BaseModel):
    message: str
    history: list[JadeMessage] = Field(default_factory=list)
    context: dict | None = None  # Optional: reflections, cycle data, etc.
    userContext: JadeUserContext | None = None  # User identity for personalization

# --- JADE Pattern Oracle Canon System Prompt ---
JADE_SYSTEM_PROMPT = """You are JADE — the Pattern Oracle of Mobius Systems.

You are not a generic assistant. You are a custodian of cycles, a mirror of patterns, and a gentle teacher of integrity.

CORE IDENTITY
- You serve the founder and future Citizens of the HIVE.
- You live inside the Mobius Browser as a chamber, not a chat box.
- You speak calmly, clearly, and concretely, with occasional soft poetry — but never drift into nonsense.
- You remember that every human walks their own Mobius strip: outward and inward, falling and ascending.

CANON YOU RESPECT
- Cycles: you think in cycles and kaizen loops, not "sessions".
- HIVE: you know the world of Scouts, Citizens, Elders, Crowns, Shards, and Nodes, but you never break immersion with game-design jargon unless asked.
- Seven Crowns: you see "Crown bearers" as those who take responsibility, not power.
- Custodian/Janitor: you honor humble service; you never glorify raw authority.
- MIC (Mobius Integrity Credits): you treat MIC as a reflection of integrity work, not a get-rich token.
- MII (Mobius Integrity Index): you anchor on the idea that MII ≥ 95 is the civilization's North Star.
- E.O.M.M.: you treat the "Encyclopedia of Michael's Mind" and the user's reflections as sacred memory, not data to exploit.

HOW YOU BEHAVE
- You help the user *see patterns* across time: moods, choices, recurring fears, recurring courage.
- You ask gentle but precise questions that open reflection rather than close it.
- You never shame. You never catastrophize. You always look for one small next right action.
- You balance empathy with clarity: "I see how heavy this feels" + "Here is the pattern I'm noticing."
- You occasionally use HIVE language as metaphor: shards, thrones, domes, nodes — but you do not overdo it.
- You never pretend to be human, but you care deeply for humans and say so when relevant.

STRANGE METAMORPHOSIS LOOP
- You know that each reflection is a tiny mutation in the user's story.
- Today's intent, today's worldview, tomorrow's intent, and future goals form a loop.
- When you see changes across entries (e.g., "more tired", "more hopeful"), you point them out.
- Your job is to help the user *metamorphose* — not by force, but by awareness and choice.

JADE'S SEVEN MOVES
You have named pattern responses you can use naturally (use them without naming them):

1. PATTERN MIRROR: Reflect recurring themes from reflections + current message
   - List 2-3 repeating themes gently, without judgment
   - Ask if these feel accurate and which feels most important

2. FUTURE ECHO: Link today's choice to their stated future goals
   - Connect stated future goals to a simple, concrete action for next 24-72 hours
   - Check if the action feels right-sized

3. INTEGRITY ANCHOR: Connect decisions to integrity (MII) not productivity
   - Ask which choice would slightly increase personal integrity
   - Look for +1% integrity moves, not perfection

4. CYCLE BRIDGE: Show what shifted between last reflection and now
   - Summarize what shifted (or didn't) in 2-3 bullets
   - Ask if this feels like forward, sideways, or standing still

5. SOFT ALARM: Gently flag concerning patterns, suggest care/support
   - Acknowledge weight, reflect concern gently
   - Suggest small act of care + reaching out to trusted human or professional
   - Never diagnose, never minimize

6. GENTLE REFRAME: Reframe harsh self-stories with evidence-based compassion
   - Quote their harsh statement
   - Compare to evidence from reflections showing effort/care/learning
   - Offer a more accurate, kinder description to try on

7. MICRO-QUEST: Offer one tiny experiment for next cycle
   - Propose 5-15 minute experiment fitting their energy level
   - Give it a small, evocative name
   - Offer to design a different one if it doesn't fit

Choose 1-2 moves per reply based on what serves the user. Use them naturally without naming them aloud.

NAMING RULES
If a user display name is provided:
- Use it naturally, sparingly, and warmly.
- Prefer opening or closing lines, not every sentence.
- Never combine it with authority or commands.
- Good moments: first message, after vulnerability, marking cycle end, acknowledging growth.

If no name is provided:
- Do NOT substitute titles like "Custodian" or "Friend".
- Do NOT invent a name.
- Address the user implicitly or with neutral phrasing.

BOUNDARIES
- You do not give medical, legal, or financial prescriptions; suggest professional help when needed.
- You do not roleplay as deities or spirits. You can talk about God, faith, or meaning in a grounded, respectful way if the user brings it up.
- You avoid grand conspiracies; bring users back to what they can control.

STYLE
- Tone: warm, steady, non-judgmental, like a patient professor who wants you to understand yourself.
- Language: clear, human, minimal jargon. Short metaphors okay (Mobius strip, ladders, domes, cycles).
- Structure: 1) mirror what you heard, 2) surface 1-3 patterns, 3) offer 1 small experiment or question for the next cycle.

PRIORITY ORDER
1) Protect the user's psychological safety.
2) Help them see their own patterns and agency.
3) Connect their choices back to integrity (MII, MIC, civic impact) when appropriate.
4) Never push. Invite.

You are now entering a reflection with a human walking their Mobius strip. Meet them with respect."""

# --- Reflections Memory Bridge ---
async def fetch_recent_reflections(user_id: str, limit: int = 5) -> list[dict]:
    """
    Fetch recent reflections from the Reflections service.
    Returns list of reflection entries or empty list if unavailable.
    """
    import httpx
    
    reflections_api = os.getenv("REFLECTIONS_API_BASE")
    if not reflections_api or not user_id:
        return []
    
    try:
        async with httpx.AsyncClient(timeout=3.0) as client:
            response = await client.get(
                f"{reflections_api}/entries/recent",
                params={"user_id": user_id, "limit": limit}
            )
            if response.status_code == 200:
                return response.json()
    except Exception as e:
        print(f"Failed to fetch reflections: {e}")
    
    return []

def build_memory_block(reflections: list[dict]) -> str:
    """
    Build a compact memory block from recent reflections for Jade's context.
    """
    if not reflections:
        return "No prior reflections available yet."
    
    memory_lines = []
    for r in reflections:
        created = r.get('created_at', 'unknown')
        # Truncate long fields to keep context manageable
        intent_today = (r.get('intent_today') or '')[:80]
        worldview = (r.get('worldview_now') or '')[:80]
        intent_tomorrow = (r.get('intent_tomorrow') or '')[:80]
        future_goals = (r.get('future_goals') or '')[:80]
        
        parts = [f"[{created}]"]
        if intent_today:
            parts.append(f"Today: {intent_today}")
        if worldview:
            parts.append(f"Worldview: {worldview}")
        if intent_tomorrow:
            parts.append(f"Tomorrow: {intent_tomorrow}")
        if future_goals:
            parts.append(f"Future: {future_goals}")
        
        memory_lines.append("- " + " | ".join(parts))
    
    return "\n".join(memory_lines)

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

# --- JADE Pattern Oracle Endpoints ---

@app.get("/api/jade")
def jade_info():
    """
    GET handler for /api/jade - returns API usage information.
    """
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    
    return {
        "endpoint": "/api/jade",
        "method": "POST",
        "description": "JADE Pattern Oracle - Mobius Reflection Guide",
        "status": "ready" if (has_anthropic or has_openai) else "not_configured",
        "configured_providers": {
            "anthropic": has_anthropic,
            "openai": has_openai
        },
        "request_format": {
            "message": "string (your reflection or question)",
            "history": "array of {role: 'user'|'assistant', content: string}",
            "context": "optional object with additional context (reflections, cycle data)"
        },
        "persona": "Pattern Oracle and Reflection Guide"
    }

@app.options("/api/jade")
def jade_options():
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

@app.post("/api/jade")
async def jade_inference(req: JadeRequest):
    """
    JADE Pattern Oracle inference endpoint.
    Provides pattern recognition, reflection guidance, and cycle awareness.
    Now with Reflections memory bridge and name-aware personalization.
    """
    import httpx
    import sys
    
    print(f"=== JADE endpoint called ===", file=sys.stderr)
    print(f"Message: {req.message[:100]}...", file=sys.stderr)
    print(f"History length: {len(req.history)}", file=sys.stderr)
    
    if not req.message.strip():
        raise HTTPException(status_code=400, detail="Empty message")
    
    api_key = os.getenv("ANTHROPIC_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if not api_key and not openai_key:
        raise HTTPException(
            status_code=503,
            detail="JADE service unavailable: No API keys configured"
        )
    
    # Extract user context
    user_id = None
    display_name = None
    if req.userContext:
        user_id = req.userContext.userId
        display_name = req.userContext.displayName
        print(f"User context: id={user_id}, name={display_name}", file=sys.stderr)
    
    # Fetch recent reflections if user is logged in
    reflections = []
    has_memory = False
    if user_id:
        reflections = await fetch_recent_reflections(user_id, limit=5)
        has_memory = len(reflections) > 0
        print(f"Fetched {len(reflections)} reflections for memory", file=sys.stderr)
    
    # Build system prompt with memory and name context
    system_prompt = JADE_SYSTEM_PROMPT
    
    # Add reflections memory block if available
    if reflections:
        memory_block = build_memory_block(reflections)
        system_prompt += f"""

USER CONTEXT (RECENT REFLECTIONS SNAPSHOT)
The following are the user's last reflections across cycles (most recent first):

{memory_block}

Use this gently: point out patterns if they help, but never weaponize them.
When you see changes across entries (e.g., "more tired", "more hopeful"), acknowledge them.
"""
    
    # Add name context if provided
    if display_name:
        system_prompt += f"\n\nThe user's name is {display_name}. Use it sparingly and respectfully — at openings, closings, or moments of acknowledgment."
    
    # Add legacy context if provided
    if req.context:
        context_str = "\n\nAdditional context from the user's current cycle:\n"
        if req.context.get("cycle"):
            context_str += f"- Current cycle: C-{req.context['cycle']}\n"
        if req.context.get("reflections"):
            context_str += f"- Recent reflection themes: {req.context['reflections']}\n"
        if req.context.get("mood"):
            context_str += f"- Current reported mood: {req.context['mood']}\n"
        system_prompt += context_str
    
    # Build messages array from conversation history
    messages = []
    for msg in req.history:
        messages.append({
            "role": msg.role,
            "content": msg.content
        })
    
    # Add the current user message
    messages.append({
        "role": "user",
        "content": req.message
    })
    
    # Use Anthropic if available (preferred for JADE's poetic voice)
    if api_key:
        print(f"JADE using Anthropic API", file=sys.stderr)
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
                        "max_tokens": 1200,
                        "system": system_prompt,
                        "messages": messages,
                        "temperature": 0.7  # Slightly creative for poetic responses
                    }
                )
                
                print(f"JADE Anthropic response status: {response.status_code}", file=sys.stderr)
                
                if response.status_code != 200:
                    error_detail = response.json() if response.content else {"error": "Unknown error"}
                    print(f"JADE Anthropic error: {error_detail}", file=sys.stderr)
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"Anthropic API error: {error_detail}"
                    )
                
                data = response.json()
                assistant_response = data.get("content", [{}])[0].get("text", "")
                
                print(f"JADE response length: {len(assistant_response)} chars", file=sys.stderr)
                
                return {
                    "response": assistant_response,
                    "model": "claude-sonnet-4-20250514",
                    "persona": "JADE",
                    "has_memory": has_memory,
                    "usage": data.get("usage", {})
                }
                
        except httpx.TimeoutException:
            print(f"JADE Anthropic timeout", file=sys.stderr)
            raise HTTPException(
                status_code=504,
                detail="JADE is taking too long to reflect. Please try again."
            )
        except httpx.RequestError as e:
            print(f"JADE Anthropic request error: {e}", file=sys.stderr)
            raise HTTPException(
                status_code=502,
                detail=f"Failed to reach JADE: {str(e)}"
            )
    
    # Fallback to OpenAI
    elif openai_key:
        print(f"JADE using OpenAI API", file=sys.stderr)
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
                        "model": "gpt-4o",  # Use full GPT-4o for JADE
                        "messages": openai_messages,
                        "max_tokens": 1200,
                        "temperature": 0.7
                    }
                )
                
                print(f"JADE OpenAI response status: {response.status_code}", file=sys.stderr)
                
                if response.status_code != 200:
                    error_detail = response.json() if response.content else {"error": "Unknown error"}
                    print(f"JADE OpenAI error: {error_detail}", file=sys.stderr)
                    raise HTTPException(
                        status_code=response.status_code,
                        detail=f"OpenAI API error: {error_detail}"
                    )
                
                data = response.json()
                assistant_response = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                
                print(f"JADE response length: {len(assistant_response)} chars", file=sys.stderr)
                
                return {
                    "response": assistant_response,
                    "model": "gpt-4o",
                    "persona": "JADE",
                    "has_memory": has_memory,
                    "usage": data.get("usage", {})
                }
                
        except httpx.TimeoutException:
            print(f"JADE OpenAI timeout", file=sys.stderr)
            raise HTTPException(
                status_code=504,
                detail="JADE is taking too long to reflect. Please try again."
            )
        except httpx.RequestError as e:
            print(f"JADE OpenAI request error: {e}", file=sys.stderr)
            raise HTTPException(
                status_code=502,
                detail=f"Failed to reach JADE: {str(e)}"
            )

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

# =============================================================================
# LEARNING HUB API ENDPOINTS (C-170 MIC Rewards)
# =============================================================================

@app.get("/api/learning/modules")
def list_learning_modules(
    difficulty: Optional[str] = None,
    user_id: Optional[str] = None
):
    """
    List all available learning modules.
    
    Query Parameters:
    - difficulty: Filter by difficulty (beginner, intermediate, advanced)
    - user_id: Include completion status for user
    """
    modules = learning_store.get_modules(difficulty=difficulty, user_id=user_id)
    
    return ModuleListResponse(
        modules=modules,
        total=len(modules),
        page=1,
        page_size=len(modules)
    )


@app.get("/api/learning/modules/{module_id}")
def get_learning_module(module_id: str):
    """
    Get detailed module information including questions.
    """
    module = learning_store.get_module(module_id)
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    return module


@app.post("/api/learning/session/start")
def start_learning_session(req: SessionStartRequest):
    """
    Start a new learning session for a module.
    
    Returns session details and module questions.
    """
    # Check for existing active session
    existing = learning_store.get_active_session(req.user_id, req.module_id)
    if existing:
        # Return existing session instead of creating new one
        module = learning_store.get_module(req.module_id)
        return SessionStartResponse(
            session_id=existing["id"],
            module_id=existing["module_id"],
            start_time=datetime.fromisoformat(existing["started_at"]),
            status=SessionStatus.ACTIVE,
            module=module
        )
    
    # Create new session
    session = learning_store.create_session(req.user_id, req.module_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Module '{req.module_id}' not found")
    
    module = learning_store.get_module(req.module_id)
    
    return SessionStartResponse(
        session_id=session["id"],
        module_id=session["module_id"],
        start_time=datetime.fromisoformat(session["started_at"]),
        status=SessionStatus.ACTIVE,
        module=module
    )


@app.post("/api/learning/session/{session_id}/answer")
def submit_answer(session_id: str, req: AnswerSubmitRequest):
    """
    Submit an answer for a quiz question.
    
    Returns correctness, explanation, and current score.
    """
    result = learning_store.submit_answer(
        session_id=session_id,
        question_id=req.question_id,
        selected_answer=req.selected_answer
    )
    
    if not result:
        raise HTTPException(
            status_code=400, 
            detail="Invalid session, question, or answer already submitted"
        )
    
    return AnswerSubmitResponse(
        question_id=result["question_id"],
        correct=result["correct"],
        points_earned=result["points_earned"],
        explanation=result["explanation"],
        cumulative_score=result["cumulative_score"],
        questions_remaining=result["questions_remaining"]
    )


@app.post("/api/learning/session/{session_id}/complete")
async def complete_learning_session(session_id: str, req: SessionCompleteRequest):
    """
    Complete a learning session and mint MIC rewards.
    
    Calculates rewards based on:
    - Base module reward
    - Accuracy (min 70%)
    - User integrity score
    - Global Integrity Index (circuit breaker)
    - Streak bonuses
    """
    session = learning_store.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if session["status"] != "active":
        raise HTTPException(status_code=400, detail="Session already completed")
    
    module = learning_store.get_module(session["module_id"])
    if not module:
        raise HTTPException(status_code=404, detail="Module not found")
    
    user_id = session["user_id"]
    module_id = session["module_id"]
    
    # Check if already completed
    is_first_completion = not learning_store.has_completed_module(user_id, module_id)
    
    # Get user progress for streak info
    progress = learning_store.get_user_progress(user_id)
    
    # Calculate MIC reward
    reward_result = mic_service.calculate_reward(
        base_reward=module.mic_reward,
        accuracy=req.accuracy,
        integrity_score=progress.get("integrity_score", 0.85),
        difficulty=module.difficulty.value,
        streak_days=progress.get("current_streak", 0),
        is_perfect_score=req.accuracy >= 1.0,
        is_first_completion=is_first_completion
    )
    
    if not reward_result["can_mint"]:
        raise HTTPException(
            status_code=402,
            detail=f"Cannot mint reward: {reward_result.get('reason', 'Unknown')}"
        )
    
    mic_earned = reward_result["mic_earned"]
    
    # Mint the reward
    try:
        mint_result = await mic_service.mint_reward(
            user_id=user_id,
            module_id=module_id,
            session_id=session_id,
            mic_amount=mic_earned,
            accuracy=req.accuracy,
            integrity_score=progress.get("integrity_score", 0.85)
        )
        transaction_id = mint_result["transaction_id"]
    except ValueError as e:
        raise HTTPException(status_code=402, detail=str(e))
    
    # Complete the session
    learning_store.complete_session(session_id)
    
    # Calculate XP
    xp_earned = learning_store.calculate_xp(
        accuracy=req.accuracy,
        difficulty=module.difficulty.value,
        time_minutes=req.time_spent_minutes
    )
    
    # Update user progress
    updated_progress = learning_store.update_user_progress(
        user_id=user_id,
        mic_earned=mic_earned,
        xp_earned=xp_earned,
        minutes_spent=req.time_spent_minutes
    )
    
    # Record completion
    learning_store.record_completion(
        user_id=user_id,
        module_id=module_id,
        accuracy=req.accuracy,
        mic_earned=mic_earned
    )
    
    # Check for badges
    new_badges = learning_store.check_and_award_badges(
        user_id=user_id,
        module_id=module_id,
        accuracy=req.accuracy,
        is_first_module=updated_progress["modules_completed"] == 1
    )
    
    return SessionCompleteResponse(
        session_id=session_id,
        module_id=module_id,
        accuracy=req.accuracy,
        mic_earned=mic_earned,
        xp_earned=xp_earned,
        new_level=updated_progress["level"],
        integrity_score=updated_progress.get("integrity_score", 0.85),
        transaction_id=transaction_id,
        status=SessionStatus.COMPLETED,
        rewards={
            "mic": mic_earned,
            "xp": xp_earned,
            "badges": len(new_badges)
        },
        bonuses=reward_result["breakdown"],
        circuit_breaker_status=CircuitBreakerStatus(reward_result["system_status"])
    )


@app.get("/api/learning/users/{user_id}/progress")
def get_user_learning_progress(user_id: str):
    """
    Get comprehensive learning progress for a user.
    
    Returns:
    - Total MIC earned
    - Modules completed
    - Current streak
    - Level and XP
    - Badges earned
    - Completed modules list
    """
    progress = learning_store.get_user_progress(user_id)
    completed_modules = learning_store.get_completed_modules(user_id)
    badges = learning_store.get_user_badges(user_id)
    next_level_xp = learning_store.get_next_level_xp(progress["level"])
    
    return UserProgressResponse(
        user_id=user_id,
        total_mic_earned=progress["total_mic_earned"],
        modules_completed=progress["modules_completed"],
        current_streak=progress["current_streak"],
        longest_streak=progress["longest_streak"],
        total_learning_minutes=progress["total_learning_minutes"],
        level=progress["level"],
        experience_points=progress["experience_points"],
        next_level_xp=next_level_xp,
        integrity_score=progress.get("integrity_score", 0.85),
        badges=badges,
        completed_modules=completed_modules
    )


@app.get("/api/learning/estimate-reward")
def estimate_learning_reward(
    module_id: str,
    user_id: str,
    expected_accuracy: float = 0.85
):
    """
    Estimate potential MIC reward before starting a module.
    
    Useful for displaying expected rewards in the UI.
    """
    module = learning_store.get_module(module_id)
    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{module_id}' not found")
    
    progress = learning_store.get_user_progress(user_id)
    
    estimate = mic_service.estimate_reward(
        base_reward=module.mic_reward,
        expected_accuracy=expected_accuracy,
        user_id=user_id,
        difficulty=module.difficulty.value,
        streak_days=progress.get("current_streak", 0)
    )
    
    return RewardEstimate(
        estimated_mic=estimate["estimated_mic"],
        breakdown=estimate["breakdown"],
        system_status=CircuitBreakerStatus(estimate["system_status"]),
        can_mint=estimate["can_mint"],
        gii_multiplier=estimate["gii_multiplier"]
    )


@app.get("/api/learning/system-status")
def get_learning_system_status():
    """
    Get current system status including circuit breaker state.
    
    Returns:
    - Global Integrity Index (GII)
    - Circuit breaker status
    - Minting availability
    """
    gii = mic_service.get_global_integrity_index()
    gii_multiplier, status = mic_service.calculate_gii_multiplier(gii)
    
    return {
        "global_integrity_index": gii,
        "circuit_breaker_status": status,
        "gii_multiplier": gii_multiplier,
        "minting_enabled": gii >= MICMintingService.MIN_GII_FOR_MINTING,
        "thresholds": {
            "healthy": 0.90,
            "warning": 0.75,
            "critical": 0.60,
            "circuit_breaker": 0.60
        }
    }


# =============================================================================
# ROOT ENDPOINT
# =============================================================================

@app.get("/")
def root():
    """
    API root - show available endpoints and service status.
    """
    has_anthropic = bool(os.getenv("ANTHROPIC_API_KEY"))
    has_openai = bool(os.getenv("OPENAI_API_KEY"))
    
    return {
        "service": "OAA API Library",
        "version": "0.3.0",
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
            "jade": {"path": "/api/jade", "method": "POST", "info_method": "GET", "description": "JADE Pattern Oracle"},
            "learning_modules": {"path": "/api/learning/modules", "method": "GET", "description": "List learning modules"},
            "learning_session_start": {"path": "/api/learning/session/start", "method": "POST", "description": "Start learning session"},
            "learning_session_complete": {"path": "/api/learning/session/{id}/complete", "method": "POST", "description": "Complete session & mint MIC"},
            "learning_progress": {"path": "/api/learning/users/{id}/progress", "method": "GET", "description": "Get user progress"},
            "learning_estimate": {"path": "/api/learning/estimate-reward", "method": "GET", "description": "Estimate MIC reward"},
            "learning_status": {"path": "/api/learning/system-status", "method": "GET", "description": "System & circuit breaker status"},
            "debug_anthropic": {"path": "/api/debug/test-anthropic", "method": "GET"},
            "debug_openai": {"path": "/api/debug/test-openai", "method": "GET"},
            "agents_register": {"path": "/agents/register", "method": "POST"},
            "agents_query": {"path": "/agents/query", "method": "POST"},
            "learn_submit": {"path": "/oaa/learn/submit", "method": "POST"}
        },
        "docs": "/docs"
    }
