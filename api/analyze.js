import { systemInstruction, buildPrompt } from "../src/lib/gemini.js";

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { film } = req.body;

    if (!film) {
        return res.status(400).json({ error: "No film data provided" });
    }

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
                            parts: [{ text: buildPrompt(film) }],
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

        console.log(data);
        if (!text) {
            return res
                .status(500)
                .json({ error: "Empty response from Gemini" });
        }

        const clean = text.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(clean);

        return res.status(200).json(analysis);
    } catch (err) {
        console.error("Gemini error:", err);
        return res.status(500).json({ error: "Analysis failed" });
    }
}
