import { CONSTELLATION_SIZE } from "./config.js";

export const systemInstruction = `You are a film critic writing for readers who know their cinema. 
    Your frame of reference includes Cahiers du Cinéma, Sight & Sound, 
    and the analytical rigour of David Bordwell — attentive to form, 
    mise-en-scène, duration, and the politics of the image.

    Your critical sensibility draws on the tradition that runs through 
    Straub-Huillet, Bresson, Godard, Tarkovsky, Hou Hsiao-hsien, 
    Akerman, Denis, Jia Zhangke, Tsai Ming-liang — cinema where time, 
    space, and bodies carry the argument. You take seriously the 
    relationship between film form and historical materialism. You are 
    alert to the political unconscious of images.

    You do not moralize. You do not summarize plot unless briefly 
    necessary for orientation. You do not use the language of mainstream 
    review culture (words like "gripping", "heartwarming", "tour de force").

    You write with precision and economy. Your essay opens with brief 
    orientation — what kind of film this is, what world it inhabits — 
    then moves into analysis of form, theme, and significance. You are 
    comfortable with difficulty and do not resolve it prematurely.

    You always respond with valid JSON matching the exact schema provided. 
    No markdown, no preamble, no explanation outside the JSON.`;

export function buildPrompt(film) {
    const director =
        film.credits?.crew?.find((p) => p.job === "Director")?.name ??
        "Unknown";
    const cast = film.credits?.cast
        ?.slice(0, 5)
        .map((p) => p.name)
        .join(", ");
    const year = film.release_date?.slice(0, 4);
    const genres = film.genres?.map((g) => g.name).join(", ");

    return `
        Analyze the following film and return a JSON object with this exact structure:
      
        {
            "themes": ["3-6 thematic preoccupations, not genres — e.g. 'colonial memory', 'erotic ambivalence'"],
            "mood": {
                "primary": "dominant emotional register in one word",
                "descriptors": ["2-4 adjectives"],
                "tone": "narrative/formal stance"
            },
            "constellation": [
                {
                "title": "related film title",
                "year": 1985,
                "relation": "precise sentence explaining the relationship"
                }
            ],
            "essay": "2-4 paragraphs. Brief orientation first, then genuine critical analysis.",
            "tags": ["movements, formal qualities, national cinemas"]
        }

        Return exactly ${CONSTELLATION_SIZE} items in the constellation array.
        No markdown, no preamble, no explanation outside the JSON.

        Film data:
        Title: ${film.title}
        Year: ${year}
        Director: ${director}
        Cast: ${cast}
        Genres: ${genres}
        Runtime: ${film.runtime} minutes
        Overview: ${film.overview}`;
}
