/* eslint-disable no-undef */
import { AI_PROVIDER } from "./config.js";

const PROVIDERS = {
    deepseek: {
        url: "https://api.deepseek.com/chat/completions",
        model: "deepseek-chat",
        apiKey: () => process.env.DEEPSEEK_API_KEY,
        parseResponse: (data) => data.choices?.[0]?.message?.content,
    },
    groq: {
        url: "https://api.groq.com/openai/v1/chat/completions",
        model: "llama-3.3-70b-versatile",
        apiKey: () => process.env.GROQ_API_KEY,
        parseResponse: (data) => data.choices?.[0]?.message?.content,
    },
    gemini: {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`,
        model: null,
        apiKey: () => process.env.GEMINI_API_KEY,
        parseResponse: (data) =>
            data.candidates?.[0]?.content?.parts?.findLast((p) => p.text)?.text,
    },
};

export async function callAI({
    system,
    user,
    temperature = 0.7,
    maxTokens = 2048,
}) {
    const provider = PROVIDERS[AI_PROVIDER];

    let url = provider.url;
    let headers = { "Content-Type": "application/json" };
    let body;

    if (AI_PROVIDER === "gemini") {
        url = `${provider.url}?key=${provider.apiKey()}`;
        body = {
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens },
        };
    } else {
        headers["Authorization"] = `Bearer ${provider.apiKey()}`;
        body = {
            model: provider.model,
            temperature,
            max_tokens: maxTokens,
            messages: [
                { role: "system", content: system },
                { role: "user", content: user },
            ],
        };
    }

    const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    const data = await response.json();
    console.log(data);
    return provider.parseResponse(data);
}
