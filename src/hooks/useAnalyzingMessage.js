import { useState, useEffect } from "react";

const ANALYZING_MESSAGES = [
    "Cutting...",
    "Splicing...",
    "Developing...",
    "Exposing...",
    "Framing...",
    "Focusing...",
    "Grading...",
    "Syncing...",
    "Dubbing...",
    "Printing...",
    "Projecting...",
    "Rewinding...",
];

export function useAnalyzingMessage(status) {
    const [message, setMessage] = useState(ANALYZING_MESSAGES[0]);

    useEffect(() => {
        if (status !== "analyzing") return;
        const interval = setInterval(() => {
            setMessage((current) => {
                const others = ANALYZING_MESSAGES.filter((m) => m !== current);
                return others[Math.floor(Math.random() * others.length)];
            });
        }, 1500);
        return () => clearInterval(interval);
    }, [status]);

    return message;
}
