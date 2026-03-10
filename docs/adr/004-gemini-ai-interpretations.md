# ADR 004: Gemini API for AI Interpretations

**Date**: 2026-03-09
**Status**: accepted

## Context

TransitWind's differentiator over myBodyGraph is personalized, plain-language AI interpretations of transit data. We need an LLM API that is:

- Cost-effective for per-user, per-day interpretations
- Good at warm, accessible tone (not clinical)
- Fast enough for interactive use

Options:
1. **Gemini API (gemini-2.5-flash)** — free credits via GCP project, fast, good quality for short-form content
2. **Claude API** — excellent quality, higher cost for high-volume per-cell interpretations
3. **OpenAI** — mature, but no free credits and higher per-token cost
4. **Local LLM** — no API cost, but deployment complexity and quality tradeoff

## Decision

Use Google Gemini API (`gemini-2.5-flash`) via the `google-genai` SDK. The API key is stored in `.env` as `GEMINI_API_KEY`. All interpreter functions include a template-based fallback when no API key is configured, so the app remains functional without AI.

## Consequences

- Free tier covers development and early users
- All AI calls are async (`client.aio.models.generate_content`)
- Fallback templates ensure the app works without an API key
- Interpretation quality depends on prompt engineering — system prompts enforce "awareness not prediction" framing
- Can be swapped to another provider by changing only `interpreter.py`
