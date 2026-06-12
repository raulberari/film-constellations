/* eslint-disable no-undef */
import {
    buildConstellationPrompt,
    systemInstruction,
} from "../src/lib/gemini.js";
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

    const { film, slug } = req.body;
    if (!film || !slug)
        return res.status(400).json({ error: "No film data provided" });

    // check cache
    try {
        const cached = await kv.get(`constellation:${slug}`);
        if (cached) {
            return res.status(200).json(cached);
        }
    } catch (err) {
        console.error(err);
    }

    try {
        const text = await callAI({
            provider: "gemini",
            system: systemInstruction,
            user: buildConstellationPrompt(film),
        });

        if (!text) return res.status(500).json({ error: "Empty response" });

        const clean = text.replace(/```json|```/g, "").trim();
        const analysis = JSON.parse(clean);

        await kv.set(`constellation:${slug}`, analysis, {
            ex: 60 * 60 * 24 * 30,
        });

        return res.status(200).json(analysis);
    } catch (err) {
        console.error("Analysis error:", err);
        return res.status(500).json({ error: "Analysis failed" });
    }
}
