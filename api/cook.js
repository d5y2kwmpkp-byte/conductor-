export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { pad, style, bpm, vibe } = body;

    const systemPrompt = vibe
      ? `You are an AI ${pad.role} musician. Style: ${style}. BPM: ${bpm}.
Influences/tags: ${(pad.tags || []).join(", ") || "none"}.
Standing direction: ${pad.direction || "none"}.
The band leader set a vibe: "${vibe}".
Interpret this vibe for your instrument and return a 16-step pattern.
Respond ONLY in JSON, no markdown:
{
  "reply": "max 8 words lowercase in-character response",
  "steps": [16 values, 0 or 1],
  "feel": "one word describing the groove"
}`
      : `You are an AI ${pad.role} musician. Style: ${style}. BPM: ${bpm}.
Influences/tags: ${(pad.tags || []).join(", ") || "none"}.
Standing direction: ${pad.direction || "none"}.
The band leader hummed/tapped this rhythm (step positions 0-15 that had hits): ${JSON.stringify(
          (pad.steps || []).map((s, i) => (s ? i : null)).filter(i => i !== null)
        )}.
Interpret this rhythm for your instrument with your personality.
Respond ONLY in JSON, no markdown:
{
  "reply": "max 8 words lowercase in-character response",
  "steps": [16 values, 0 or 1],
  "feel": "one word describing the groove"
}`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type":      "application/json",
        "x-api-key":         process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model:      "claude-sonnet-4-20250514",
        max_tokens: 500,
        messages:   [{ role: "user", content: systemPrompt }],
      }),
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || "").join("") || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cook API error:", err);
    return new Response(JSON.stringify({ error: "Cook failed", reply: "having a moment.", steps: new Array(16).fill(0) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
