/* eslint-disable no-undef */
import { AI_PROVIDER } from "./config.js";

const PROVIDERS = {
    deepseek: {
        url: "https://api.deepseek.com/chat/completions",
        model: "deepseek-v4-flash",
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
    claude: {
        url: "https://api.anthropic.com/v1/messages",
        model: "claude-haiku-4-5",
        apiKey: () => process.env.ANTHROPIC_API_KEY,
        parseResponse: (data) => data.content?.[0]?.text,
    },
};

export async function callAI({
    provider: providerOverride,
    system,
    user,
    temperature = 0.7,
    maxTokens = 9192,
}) {
    const providerKey = providerOverride ?? AI_PROVIDER;
    const provider = PROVIDERS[providerKey];

    let url = provider.url;
    let headers = { "Content-Type": "application/json" };
    let body;

    if (providerKey === "gemini") {
        url = `${provider.url}?key=${provider.apiKey()}`;
        body = {
            system_instruction: { parts: [{ text: system }] },
            contents: [{ role: "user", parts: [{ text: user }] }],
            generationConfig: { temperature, maxOutputTokens: maxTokens },
        };
    } else if (providerKey === "claude") {
        headers["x-api-key"] = provider.apiKey();
        headers["anthropic-version"] = "2023-06-01";
        body = {
            model: provider.model,
            max_tokens: maxTokens,
            temperature,
            system,
            messages: [{ role: "user", content: user }],
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
    return provider.parseResponse(data);
}
