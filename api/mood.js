import { systemInstruction } from "../src/lib/gemini.js";
import { callAI } from "../src/lib/ai.js";
import { Redis } from "@upstash/redis";

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { mood, slug } = req.body;
    if (!mood || !slug)
        return res.status(400).json({ error: "No mood provided" });

    try {
        const cached = await kv.get(`mood:${slug}`);
        if (cached) {
            console.log("cache hit:", slug);
            return res.status(200).json(cached);
        }
    } catch (err) {
        console.error(err);
    }

    try {
        const text = await callAI({
            system: systemInstruction,
            user: `Return a JSON array of exactly 15 films that exemplify the theme, mood, country, or director: "${mood}".
                - If it is a theme or mood, return 15 films that exemplify it.
                - If it is a country, return 15 representative films from that country.
                - If it is a director's name, return 15 films by that director, ordered chronologically.

                Each item in the array should have this exact structure:
                {
                    "title": "film title",
                    "year": 1984,
                    "relation": "one sentence explaining why this film is relevant. can be poetic or just explanatory"
                }

                Return only the JSON array. No markdown, no preamble, no explanation outside the JSON.`,
        });

        if (!text) return res.status(500).json({ error: "Empty response" });

        const clean = text.replace(/```json|```/g, "").trim();
        const films = JSON.parse(clean);

        await kv.set(`mood:${slug}`, { films }, { ex: 60 * 60 * 24 * 30 });

        return res.status(200).json({ films });
    } catch (err) {
        console.error("Mood error:", err);
        return res.status(500).json({ error: "Failed" });
    }
}
