export const config = { runtime: "edge" };

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { pad, style, bpm, vibe } = body;

    const prompt = vibe
      ? `You are an AI ${pad.role} musician. Style: ${style}. BPM: ${bpm}.
Influences: ${(pad.tags || []).join(", ") || "none"}.
Standing direction: ${pad.direction || "none"}.
The band leader set a vibe: "${vibe}".
Interpret this vibe for your instrument.
Respond ONLY in JSON, no markdown:
{"reply":"max 8 words lowercase in-character","steps":[16 values 0 or 1],"feel":"one word"}`
      : `You are an AI ${pad.role} musician. Style: ${style}. BPM: ${bpm}.
Influences: ${(pad.tags || []).join(", ") || "none"}.
Standing direction: ${pad.direction || "none"}.
The band leader hummed this rhythm (steps 0-15 with hits): ${JSON.stringify(
          (pad.steps || []).map((s, i) => (s ? i : null)).filter(i => i !== null)
        )}.
Interpret this for your instrument with personality.
Respond ONLY in JSON, no markdown:
{"reply":"max 8 words lowercase in-character","steps":[16 values 0 or 1],"feel":"one word"}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.9, maxOutputTokens: 300 },
        }),
      }
    );

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cook error:", err);
    return new Response(
      JSON.stringify({ reply: "having a moment.", steps: new Array(16).fill(0), feel: "quiet" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
