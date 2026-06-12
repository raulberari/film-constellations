/* eslint-disable no-undef */
import { buildEssayPrompt, systemInstruction } from "../src/lib/gemini.js";
import { callAI } from "../src/lib/ai.js";
import { Redis } from "@upstash/redis";

const kv = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
});

export default async function handler(req, res) {
    const MIN_WORDS = 350;
    const MAX_RETRIES = 2;

    let text = null;
    let attempts = 0;

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { film, slug } = req.body;
    if (!film || !slug)
        return res.status(400).json({ error: "No film data provided" });

    // check cache
    try {
        const cached = await kv.get(`essay:${slug}`);
        if (cached) {
            return res.status(200).json(cached);
        }
    } catch (err) {
        console.error(err);
    }

    try {
        while (attempts < MAX_RETRIES) {
            text = await callAI({
                provider: "claude",
                system: systemInstruction,
                user: buildEssayPrompt(film),
            });

            const wordCount = text
                ?.replace(/```json|```/g, "")
                .trim()
                .split(/\s+/).length;

            if (wordCount >= MIN_WORDS) break;

            attempts++;
            console.log(
                `Essay too short (${wordCount} words), retrying... attempt ${attempts}`,
            );
        }

        if (!text) return res.status(500).json({ error: "Empty response" });

        const clean = text.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(clean);

        await kv.set(`essay:${slug}`, analysis);

        return res.status(200).json(analysis);
    } catch (err) {
        console.error("Analysis error:", err);
        return res.status(500).json({ error: "Analysis failed" });
    }
}
