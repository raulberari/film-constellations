import { create } from "zustand";

const useStore = create((set) => ({
    films: {},
    moods: {},
    status: "idle",

    setFilm: (slug, data) =>
        set((state) => ({
            films: { ...state.films, [slug]: data },
        })),
    setMood: (slug, data) =>
        set((state) => ({
            moods: { ...state.moods, [slug]: data },
        })),
    setStatus: (status) => set({ status }),
}));

export default useStore;
