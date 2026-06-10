import { systemInstruction } from "../src/lib/gemini.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { mood } = req.body;
    if (!mood) return res.status(400).json({ error: "No mood provided" });

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemInstruction }],
                    },
                    contents: [
                        {
                            role: "user",
                            parts: [
                                {
                                    text: `Return a JSON array of exactly 12 films that exemplify the theme or mood: "${mood}".
                                            If the mood is a country, return 12 films from that country that are representative of it.

                                            Each item in the array should have this exact structure:
                                            {
                                            "title": "film title",
                                            "year": 1984,
                                            "relation": "one sentence explaining why this film exemplifies the theme"
                                            }

                                            Return only the JSON array. No markdown, no preamble, no explanation outside the JSON.`,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 1.0,
                        maxOutputTokens: 8192,
                    },
                }),
            },
        );

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.findLast(
            (p) => p.text,
        )?.text;
        if (!text) return res.status(500).json({ error: "Empty response" });

        const clean = text.replace(/```json|```/g, "").trim();
        const films = JSON.parse(clean);
        return res.status(200).json({ films });
    } catch (err) {
        console.error("Mood error:", err);
        return res.status(500).json({ error: "Failed" });
    }
}
