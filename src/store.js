import { create } from "zustand";

const useStore = create((set) => ({
  films: {},
  status: "idle", // "idle" | "searching" | "analyzing" | "done" | "error",

  setFilm: (slug, data) =>
    set((state) => ({
      films: { ...state.films, [slug]: data },
    })),
  setStatus: (status) => set({ status }),
}));

export default useStore;
