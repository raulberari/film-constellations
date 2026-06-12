# Film Constellations

Live here:
[https://film-constellations.vercel.app/](https://film-constellations.vercel.app/)

A React app for film discovery and recommendation using TMDB for film info and Gemini & Deepseek prompts for info and related films.

### Core features

- Search by film title (with optional year e.g. "Stalker 1979")
- Search falls back to mood/constellation if no film found
- Film page with 12 related films in a 6-left / center / 6-right grid
- Mood/theme pages with 12 films, triggered by clicking themes, directors, countries, or typing directly
- Clickable constellation: any recommended film opens its own full analysis page
- Persistent shared cache: first request generates, all subsequent requests are instant
- Rotating film stills as homepage background
- Critical essay in the voice of Cahiers du Cinéma / Sight & Sound per film

### Frontend

- React 19 via Vite
- React Router for client-side routing
- Zustand for global state management
- Vanilla CSS

### Backend

- Vercel Serverless Functions (Node.js) for API proxying

### AI

- DeepSeek V4 Flash (current) for film analysis
- Gemini 3.1 Flash Lite for generating the constellation of 12 films based on a film/mood
- Previously tried: Gemini 2.5 Flash, Groq with Llama 3.3 70B, Claude Haiku 4.5

### Data

- TMDB API for film metadata, posters, backdrops, and image selection
- Upstash Redis (via Vercel KV) for shared persistent caching with 30-day TTL

### Deployment

- Vercel for hosting and serverless functions
- GitHub for version control
