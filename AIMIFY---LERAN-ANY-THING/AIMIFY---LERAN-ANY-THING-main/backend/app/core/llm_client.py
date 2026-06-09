"""
Multi-provider LLM client with automatic key rotation.

Tier 1: Gemini 2.5 Flash — up to 3 API keys, round-robin on 429 errors.
Tier 2: Groq (qwen/qwen3-32b via OpenAI SDK) — fallback when all Gemini keys exhausted.

All rotation is invisible to callers. Function signatures are unchanged.
"""
import json
import copy
import logging
from pydantic import BaseModel, ValidationError
from typing import Type, TypeVar

from google import genai
from google.genai import types
from openai import OpenAI

from app.config import settings

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)

# ──────────────────────────────────────────────────────────
# Module-level state: key pools, initialized once at import
# ──────────────────────────────────────────────────────────

# Build Gemini key pool — filter out empty/None values, deduplicate while preserving order
_seen_keys: set[str] = set()
_gemini_keys: list[str] = []
for _k in [
    settings.GEMINI_API_KEY_1,
    settings.GEMINI_API_KEY_2,
    settings.GEMINI_API_KEY_3,
    settings.GEMINI_API_KEY,  # backward compat — always checked last
]:
    if _k and _k not in _seen_keys:
        _gemini_keys.append(_k)
        _seen_keys.add(_k)

_gemini_index: int = 0  # current active Gemini key index

# Groq fallback
_groq_key: str = settings.GROQ_API_KEY

logger.info(
    f"[LLM] Initialized: {len(_gemini_keys)} Gemini key(s), "
    f"Groq fallback {'enabled' if _groq_key else 'disabled'}"
)


# ──────────────────────────────────────────────────────────
# Helpers
# ──────────────────────────────────────────────────────────

def _get_gemini_client(key_index: int) -> genai.Client:
    """Return a fresh Gemini client for the given key index."""
    return genai.Client(api_key=_gemini_keys[key_index])


def _get_groq_client() -> OpenAI:
    """Return an OpenAI-compatible client pointed at Groq."""
    return OpenAI(
        api_key=_groq_key,
        base_url="https://api.groq.com/openai/v1",
    )


def _is_quota_error(error: Exception) -> bool:
    """Detect Google 429 / ResourceExhausted / 503 overload errors."""
    s = str(error).lower()
    return (
        "429" in s
        or "resourceexhausted" in s
        or "resource_exhausted" in s
        or "quota" in s
        or "503" in s
        or "unavailable" in s
        or "overloaded" in s
        or "high demand" in s
    )


def clean_schema_for_gemini(schema_class):
    """Strip additionalProperties and title fields that confuse Gemini's JSON mode."""
    schema = copy.deepcopy(schema_class.model_json_schema())

    def _strip(obj):
        if isinstance(obj, dict):
            obj.pop("additionalProperties", None)
            obj.pop("title", None)
            for v in obj.values():
                _strip(v)
        elif isinstance(obj, list):
            for item in obj:
                _strip(item)

    _strip(schema)
    return schema


def _strip_markdown_fences(text: str) -> str:
    """Remove ```json ... ``` wrappers from LLM output."""
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence line
        parts = text.split("```", 2)
        if len(parts) >= 3:
            inner = parts[1]
            # Strip optional language tag (e.g. "json")
            if inner.startswith("json"):
                inner = inner[4:]
            text = inner.strip()
        elif len(parts) == 2:
            inner = parts[1]
            if inner.startswith("json"):
                inner = inner[4:]
            text = inner.strip()
    return text


# ──────────────────────────────────────────────────────────
# call_gemini_structured — Tier 1 + Tier 2 with rotation
# ──────────────────────────────────────────────────────────

def call_gemini_structured(
    prompt: str,
    schema: Type[T],
    system_prompt: str,
    thinking: bool = False,
    max_retries: int = 3,
) -> T:
    """
    Calls an LLM and parses the response into a Pydantic model.
    Tries all Gemini keys first, then falls back to Groq.
    Function signature is unchanged from the original.
    """
    global _gemini_index

    schema_dict = clean_schema_for_gemini(schema)
    schema_json = json.dumps(schema_dict, indent=2)
    full_prompt = (
        f"{prompt}\n\n"
        f"Respond with a JSON object matching this schema exactly:\n{schema_json}"
    )

    last_error = ""

    # ── Phase 1: Try Gemini keys ──────────────────────────
    gemini_exhausted_count = 0

    while gemini_exhausted_count < len(_gemini_keys):
        client = _get_gemini_client(_gemini_index)
        key_label = f"Gemini key {_gemini_index + 1}/{len(_gemini_keys)}"

        config = types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.3,
        )

        for attempt in range(max_retries + 1):
            try:
                if attempt > 0:
                    logger.warning(f"[LLM] {key_label} retry {attempt}. Error: {last_error}")
                    contents = (
                        f"{prompt}\n\n"
                        f"--- PREVIOUS ATTEMPT FAILED ---\n"
                        f"You returned an invalid response. Error details:\n{last_error}\n"
                        f"Please fix the error and return a valid JSON matching the exact schema."
                    )
                else:
                    logger.info(f"[LLM] Calling {key_label} (model: {settings.GEMINI_MODEL})")
                    contents = full_prompt

                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=contents,
                    config=config,
                )

                text_response = _strip_markdown_fences(response.text)
                parsed = schema.model_validate_json(text_response)
                return parsed

            except (json.JSONDecodeError, ValidationError) as e:
                last_error = f"{type(e).__name__}: {e}"
                # Retry with same key — this is a format error, not quota
                continue

            except Exception as e:
                if _is_quota_error(e):
                    logger.warning(f"[LLM] {key_label} quota exhausted. Rotating...")
                    _gemini_index = (_gemini_index + 1) % len(_gemini_keys)
                    gemini_exhausted_count += 1
                    last_error = f"QuotaExhausted: {e}"
                    break  # break retry loop → try next key
                else:
                    last_error = f"Unexpected Error: {e}"
                    # Non-quota error — still retry with same key
                    continue

    # ── Phase 2: Groq fallback ────────────────────────────
    if _groq_key:
        logger.warning("[LLM] All Gemini keys exhausted. Falling back to Groq (qwen/qwen3-32b).")
        groq_client = _get_groq_client()

        groq_prompt = (
            f"{prompt}\n\n"
            f"You MUST respond with ONLY a valid JSON object (no markdown, no explanation) "
            f"matching this schema exactly:\n{schema_json}"
        )

        for attempt in range(max_retries + 1):
            try:
                if attempt > 0:
                    logger.warning(f"[LLM] Groq retry {attempt}. Error: {last_error}")

                response = groq_client.chat.completions.create(
                    model="qwen/qwen3-32b",
                    messages=[
                        {"role": "system", "content": system_prompt + "\n\nIMPORTANT: Do NOT use <think> tags or chain-of-thought reasoning. Respond ONLY with the JSON object."},
                        {"role": "user", "content": groq_prompt},
                    ],
                    response_format={"type": "json_object"},
                    temperature=0.3,
                )

                raw = response.choices[0].message.content or ""
                raw = _strip_markdown_fences(raw)
                
                # Qwen sometimes wraps output in <think>...</think> tags — strip those
                if "<think>" in raw:
                    think_end = raw.rfind("</think>")
                    if think_end != -1:
                        raw = raw[think_end + 8:].strip()
                
                parsed = schema.model_validate_json(raw)
                logger.info("[LLM] Groq (qwen/qwen3-32b) structured call succeeded.")
                return parsed

            except (json.JSONDecodeError, ValidationError) as e:
                last_error = f"Groq {type(e).__name__}: {e}"
                continue
            except Exception as e:
                last_error = f"Groq Unexpected: {e}"
                if attempt == max_retries:
                    break
                continue

    # ── Phase 3: Everything exhausted ─────────────────────
    raise ValueError(
        f"All LLM providers exhausted. "
        f"Gemini keys: {len(_gemini_keys)}, Groq: {bool(_groq_key)}. "
        f"Last error: {last_error}. "
        f"Wait for quota reset (midnight Pacific Time) or add more API keys."
    )


# ──────────────────────────────────────────────────────────
# call_gemini_raw — Tier 1 + Tier 2 with rotation
# ──────────────────────────────────────────────────────────

def call_gemini_raw(prompt: str, system_prompt: str) -> str:
    """
    Calls an LLM and returns plain text response.
    Tries all Gemini keys first, then falls back to Groq.
    Function signature is unchanged from the original.
    """
    global _gemini_index

    last_error = ""

    # ── Phase 1: Try Gemini keys ──────────────────────────
    gemini_exhausted_count = 0

    while gemini_exhausted_count < len(_gemini_keys):
        client = _get_gemini_client(_gemini_index)
        key_label = f"Gemini key {_gemini_index + 1}/{len(_gemini_keys)}"

        try:
            logger.info(f"[LLM] Raw call via {key_label} (model: {settings.GEMINI_MODEL})")
            response = client.models.generate_content(
                model=settings.GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.3,
                ),
            )
            return response.text

        except Exception as e:
            if _is_quota_error(e):
                logger.warning(f"[LLM] {key_label} quota exhausted (raw call). Rotating...")
                _gemini_index = (_gemini_index + 1) % len(_gemini_keys)
                gemini_exhausted_count += 1
                last_error = f"QuotaExhausted: {e}"
            else:
                raise

    # ── Phase 2: Groq fallback ────────────────────────────
    if _groq_key:
        logger.warning("[LLM] All Gemini keys exhausted. Falling back to Groq (raw call).")
        groq_client = _get_groq_client()

        try:
            response = groq_client.chat.completions.create(
                model="qwen/qwen3-32b",
                messages=[
                    {"role": "system", "content": system_prompt + "\n\nIMPORTANT: Do NOT use <think> tags or chain-of-thought reasoning. Respond directly."},
                    {"role": "user", "content": prompt},
                ],
                temperature=0.5,
            )
            raw = response.choices[0].message.content or ""
            
            # Strip <think> tags if present
            if "<think>" in raw:
                think_end = raw.rfind("</think>")
                if think_end != -1:
                    raw = raw[think_end + 8:].strip()
            
            logger.info("[LLM] Groq (qwen/qwen3-32b) raw call succeeded.")
            return raw

        except Exception as e:
            last_error = f"Groq raw error: {e}"

    # ── Phase 3: Everything exhausted ─────────────────────
    raise ValueError(
        f"All LLM providers exhausted (raw call). "
        f"Gemini keys: {len(_gemini_keys)}, Groq: {bool(_groq_key)}. "
        f"Last error: {last_error}."
    )
