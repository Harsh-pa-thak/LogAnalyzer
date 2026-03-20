from fastapi import HTTPException, Request
from datetime import datetime, timezone


# ─── Limits (adjust freely, revert before production) ───────────────────────
ANON_LIMIT = 3     # free anonymous requests per day
USER_LIMIT = 20    # authenticated requests per day
# ─────────────────────────────────────────────────────────────────────────────


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def is_new_day(last_request) -> bool:
    """True if last_request was on a previous UTC day."""
    if last_request is None:
        return True
    # last_request may be a string (from Supabase) or a datetime
    if isinstance(last_request, str):
        last_request = datetime.fromisoformat(last_request.replace("Z", "+00:00"))
    now = _utc_now()
    return last_request.date() < now.date()


# ─── Main entry point ────────────────────────────────────────────────────────

async def usage_guard(request: Request, user=None, supabase_admin=None):
    """
    Call at the top of /analyze-stream BEFORE any AI logic.

    :param request:        FastAPI Request (used for headers + client IP)
    :param user:           Decoded JWT payload dict if authenticated, else None
    :param supabase_admin: Supabase admin client (pass-in to avoid circular import)
    """
    anon_id = request.headers.get("x-anon-id", "").strip()
    ip = request.client.host if request.client else "unknown"

    # Safety: validate anon_id length
    if anon_id and len(anon_id) > 100:
        raise HTTPException(status_code=400, detail="Invalid anon_id")

    if user:
        await _check_user_limit(user["sub"], supabase_admin)
    elif anon_id:
        await _check_anon_limit(anon_id, ip, supabase_admin)
    else:
        raise HTTPException(status_code=400, detail="Missing identity")


# ─── Anonymous limit logic ──────────────────────────────────────────────────

async def _check_anon_limit(anon_id: str, ip: str, supabase_admin):
    if supabase_admin is None:
        return  # Graceful no-op if DB not configured

    try:
        result = supabase_admin.table("anonymous_usage") \
            .select("id, request_count, last_request") \
            .eq("anon_id", anon_id) \
            .single() \
            .execute()
        record = result.data
    except Exception:
        record = None

    if record is None:
        # First visit — create record
        supabase_admin.table("anonymous_usage").insert({
            "anon_id": anon_id,
            "ip_address": ip,
            "request_count": 1,
            "last_request": _utc_now().isoformat(),
        }).execute()
        return

    # Day reset
    if is_new_day(record["last_request"]):
        supabase_admin.table("anonymous_usage").update({
            "request_count": 1,
            "last_request": _utc_now().isoformat(),
        }).eq("anon_id", anon_id).execute()
        return

    # Limit check
    if record["request_count"] >= ANON_LIMIT:
        raise HTTPException(status_code=403, detail="FREE_LIMIT_REACHED")

    # Increment
    supabase_admin.table("anonymous_usage").update({
        "request_count": record["request_count"] + 1,
        "last_request": _utc_now().isoformat(),
    }).eq("anon_id", anon_id).execute()


# ─── Authenticated user limit logic ─────────────────────────────────────────

async def _check_user_limit(user_id: str, supabase_admin):
    if supabase_admin is None:
        return  # Graceful no-op if DB not configured

    try:
        result = supabase_admin.table("user_usage") \
            .select("id, request_count, last_request") \
            .eq("user_id", user_id) \
            .single() \
            .execute()
        record = result.data
    except Exception:
        record = None

    if record is None:
        # First request for this user
        supabase_admin.table("user_usage").insert({
            "user_id": user_id,
            "request_count": 1,
            "last_request": _utc_now().isoformat(),
        }).execute()
        return

    # Day reset
    if is_new_day(record["last_request"]):
        supabase_admin.table("user_usage").update({
            "request_count": 1,
            "last_request": _utc_now().isoformat(),
        }).eq("user_id", user_id).execute()
        return

    # Limit check
    if record["request_count"] >= USER_LIMIT:
        raise HTTPException(status_code=403, detail="USER_LIMIT_REACHED")

    # Increment
    supabase_admin.table("user_usage").update({
        "request_count": record["request_count"] + 1,
        "last_request": _utc_now().isoformat(),
    }).eq("user_id", user_id).execute()
