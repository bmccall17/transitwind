"""
AI interpretation service using Gemini API.

Generates personalized daily transit interpretations.
"""

import json
from pathlib import Path
from google import genai

from backend.app.config import GEMINI_API_KEY

_data_dir = Path(__file__).parent.parent / "data"
_gates_data: dict | None = None
_channels_data: dict | None = None
_centers_data: dict | None = None


def _load_knowledge_base():
    global _gates_data, _channels_data, _centers_data
    if _gates_data is None:
        with open(_data_dir / "gates.json") as f:
            _gates_data = json.load(f)
        with open(_data_dir / "channels.json") as f:
            _channels_data = json.load(f)
        with open(_data_dir / "centers.json") as f:
            _centers_data = json.load(f)


def _build_context(overlay: dict, natal_chart: dict) -> str:
    """Build a context string describing the overlay for the AI prompt."""
    _load_knowledge_base()

    parts = []

    # User's chart basics
    parts.append(f"**User's Chart**: {natal_chart['type']}, {natal_chart['authority']} Authority, Profile {natal_chart['profile']}")
    parts.append(f"**Defined Centers**: {', '.join(natal_chart['defined_centers'])}")
    parts.append(f"**Undefined/Open Centers**: {', '.join(natal_chart['undefined_centers'])}")

    # Today's key transits
    if overlay["completed_channels"]:
        parts.append("\n**Channels Completed by Today's Transits:**")
        for ch in overlay["completed_channels"]:
            gates = ch["gates"]
            name = ch["name"]
            centers = ch["centers"]
            gate_a_info = _gates_data.get(str(gates[0]), {})
            gate_b_info = _gates_data.get(str(gates[1]), {})
            parts.append(
                f"- Channel {gates[0]}-{gates[1]} ({name}): "
                f"{centers[0]} ↔ {centers[1]}. "
                f"Gate {gates[0]}: {gate_a_info.get('name', '')} — {gate_a_info.get('theme', '')}. "
                f"Gate {gates[1]}: {gate_b_info.get('name', '')} — {gate_b_info.get('theme', '')}."
            )

    if overlay["newly_defined_centers"]:
        parts.append(f"\n**Centers Temporarily Defined by Transits**: {', '.join(overlay['newly_defined_centers'])}")
        for center in overlay["newly_defined_centers"]:
            c_info = _centers_data.get(center, {})
            parts.append(f"- {center}: When defined — {c_info.get('defined_theme', '')}. Normally open for this person — {c_info.get('open_theme', '')}")

    if overlay["reinforced_gates"]:
        parts.append(f"\n**Reinforced Gates** (transit activating natal gates): {overlay['reinforced_gates']}")

    if overlay["transit_only_gates"]:
        top_transit = overlay["transit_only_gates"][:5]
        parts.append(f"\n**Notable Transit-Only Gates**: {top_transit}")
        for g in top_transit:
            g_info = _gates_data.get(str(g), {})
            parts.append(f"- Gate {g}: {g_info.get('name', '')} — {g_info.get('theme', '')}")

    return "\n".join(parts)


async def generate_daily_interpretation(overlay: dict, natal_chart: dict) -> dict:
    """Generate a daily transit interpretation using Gemini.

    Returns: {"summary": str, "prompts": list[str]}
    """
    context = _build_context(overlay, natal_chart)

    system_prompt = """You are a Human Design transit interpreter. Your role is to help people
understand how today's planetary transits interact with their personal Human Design chart.

Guidelines:
- Use warm, accessible language. avoid jargon unless you explain it
- Frame everything as awareness, not prediction. Use "you may notice" not "you will"
- Focus on the most significant interactions (completed channels, newly defined centers)
- Provide practical awareness prompts the person can reflect on today
- Keep the summary to 2-4 paragraphs
- End with 2-3 specific reflection prompts
- Never make health, financial, or relationship predictions
- Frame open/undefined centers as places of wisdom and sensitivity, not weakness
- This is a tool for self-awareness, not fortune-telling

Respond with valid JSON: {"summary": "...", "prompts": ["...", "...", "..."]}"""

    user_prompt = f"""Based on this transit overlay data, write a personalized daily transit interpretation:

{context}

Remember: Focus on the most impactful transits. Be specific to THIS person's chart.
Write as if you're a knowledgeable friend helping them notice the energetic weather of the day."""

    if not GEMINI_API_KEY:
        # Fallback when no API key is configured
        return {
            "summary": _generate_fallback(overlay, natal_chart),
            "prompts": _generate_fallback_prompts(overlay),
        }

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=f"{system_prompt}\n\n{user_prompt}",
        config=genai.types.GenerateContentConfig(
            max_output_tokens=1024,
            response_mime_type="application/json",
        ),
    )

    raw = response.text or ""

    # Strip markdown code fences if present
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.split("\n", 1)[-1]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

    try:
        result = json.loads(cleaned)
        return {
            "summary": result["summary"],
            "prompts": result.get("prompts", []),
        }
    except (json.JSONDecodeError, KeyError, TypeError):
        # If JSON parsing fails, use the raw text as the summary
        return {
            "summary": raw if raw else _generate_fallback(overlay, natal_chart),
            "prompts": [],
        }


async def generate_upcoming_summary(ranked_changes: list[dict], natal_chart: dict) -> str:
    """Generate a 2-3 sentence AI summary of the most important upcoming transit shifts."""
    _load_knowledge_base()

    high_changes = [c for c in ranked_changes if c["significance"] == "high"]
    medium_changes = [c for c in ranked_changes if c["significance"] == "medium"]

    parts = []
    parts.append(f"User chart: {natal_chart['type']}, {natal_chart['authority']} Authority, Profile {natal_chart['profile']}")
    parts.append(f"Defined gates: {natal_chart['defined_gates']}")

    if high_changes:
        parts.append("\nHigh-significance upcoming changes:")
        for c in high_changes:
            gate_info = _gates_data.get(str(c["next_gate"]), {})
            parts.append(f"- {c['planet']} entering Gate {c['next_gate']} ({gate_info.get('name', '')}) — {c['reason']}")

    if medium_changes:
        parts.append("\nMedium-significance changes:")
        for c in medium_changes[:3]:
            gate_info = _gates_data.get(str(c["next_gate"]), {})
            parts.append(f"- {c['planet']} entering Gate {c['next_gate']} ({gate_info.get('name', '')})")

    context = "\n".join(parts)

    if not GEMINI_API_KEY:
        if high_changes:
            summaries = []
            for c in high_changes[:2]:
                summaries.append(f"{c['planet']} is about to enter Gate {c['next_gate']}, {c['reason'].lower()}.")
            return " ".join(summaries) + " Pay attention to these shifts."
        return "No major channel-completing transits in the near future. A quieter period for your chart."

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            "You are a Human Design transit interpreter. Write 2-3 concise sentences summarizing "
            "the most personally significant upcoming planetary gate changes for this person. "
            "Focus on what will matter most to THEM based on their chart. Use warm, accessible language. "
            "No jargon. No predictions — only awareness.\n\n" + context
        ),
        config=genai.types.GenerateContentConfig(max_output_tokens=256),
    )
    return (response.text or "").strip()


async def generate_gate_context(planet: str, gate: int, line: int, natal_chart: dict) -> str:
    """Generate a short 1-2 sentence context for a specific planet in a gate/line."""
    _load_knowledge_base()

    gate_info = _gates_data.get(str(gate), {})
    context_parts = [
        f"Planet: {planet} in Gate {gate}.{line}",
        f"Gate {gate}: {gate_info.get('name', '')} — {gate_info.get('theme', '')}",
        f"User chart: {natal_chart['type']}, {natal_chart['authority']} Authority",
        f"User's defined gates: {natal_chart['defined_gates']}",
    ]

    # Check if this gate is in their natal chart
    if gate in natal_chart["defined_gates"]:
        context_parts.append(f"Gate {gate} IS in their natal chart — this transit reinforces their definition.")
    else:
        context_parts.append(f"Gate {gate} is NOT in their natal chart — this is a conditioning influence.")

    context = "\n".join(context_parts)

    if not GEMINI_API_KEY:
        if gate in natal_chart["defined_gates"]:
            return f"The {planet} is reinforcing your natal Gate {gate} ({gate_info.get('name', '')}). You may feel this energy more intensely today."
        return f"The {planet} in Gate {gate} ({gate_info.get('name', '')}) is conditioning your chart with the theme of {gate_info.get('theme', 'this energy')}."

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            "You are a Human Design transit interpreter. Write 1-2 concise sentences about what "
            "this specific planetary transit means for this person's chart. Be personal. No jargon. "
            "Frame as awareness, not prediction.\n\n" + context
        ),
        config=genai.types.GenerateContentConfig(max_output_tokens=128),
    )
    return (response.text or "").strip()


async def generate_cell_interpretation(planet: str, gate: int, line: int, date: str, natal_chart: dict) -> str:
    """Generate interpretation for an ephemeris calendar cell."""
    _load_knowledge_base()

    gate_info = _gates_data.get(str(gate), {})
    context_parts = [
        f"Date: {date}",
        f"Planet: {planet} in Gate {gate}.{line}",
        f"Gate {gate}: {gate_info.get('name', '')} — {gate_info.get('theme', '')}",
        f"User chart: {natal_chart['type']}, {natal_chart['authority']} Authority",
        f"User's defined gates: {natal_chart['defined_gates']}",
    ]

    if gate in natal_chart["defined_gates"]:
        context_parts.append(f"Gate {gate} IS in their natal chart — reinforcement.")

    context = "\n".join(context_parts)

    if not GEMINI_API_KEY:
        return f"{planet} in Gate {gate}.{line} ({gate_info.get('name', '')}): {gate_info.get('theme', 'A transit influence on your chart.')}."

    client = genai.Client(api_key=GEMINI_API_KEY)
    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=(
            "You are a Human Design transit interpreter. Write 2-3 sentences about this specific "
            "transit for this person. Be personal and practical. No jargon. Frame as awareness.\n\n" + context
        ),
        config=genai.types.GenerateContentConfig(max_output_tokens=192),
    )
    return (response.text or "").strip()


def _generate_fallback(overlay: dict, natal_chart: dict) -> str:
    """Simple template-based fallback when no AI API key is available."""
    _load_knowledge_base()
    parts = []

    parts.append(f"Today's transit weather for your {natal_chart['type']} chart:")

    if overlay["completed_channels"]:
        for ch in overlay["completed_channels"]:
            name = ch["name"]
            centers = ch["centers"]
            parts.append(
                f"\nA transit is completing your Channel of {name} "
                f"({centers[0]} ↔ {centers[1]}). You may notice this energy "
                f"flowing more consistently today."
            )

    if overlay["newly_defined_centers"]:
        for center in overlay["newly_defined_centers"]:
            c_info = _centers_data.get(center, {})
            parts.append(
                f"\nYour normally open {center} center is temporarily defined by transits. "
                f"You might experience: {c_info.get('defined_theme', 'a more consistent energy here')}."
            )

    if not overlay["completed_channels"] and not overlay["newly_defined_centers"]:
        parts.append("\nToday's transits are activating gates in your chart without completing "
                     "new channels. This is a subtler day. notice any background themes.")

    return " ".join(parts)


def _generate_fallback_prompts(overlay: dict) -> list[str]:
    prompts = ["What are you noticing in your body right now?"]
    if overlay["completed_channels"]:
        prompts.append("Where do you feel new energy flowing today?")
    if overlay["newly_defined_centers"]:
        prompts.append("How does it feel when a usually open part of your design gets activated?")
    return prompts
