import { create } from "zustand";
import { Hero } from "../utils/types";


interface HeroState{
    heroesData: Map<number, Hero>
    setHeroes: (heroes: Hero[]) => void
}

export const useHeroStore = create<HeroState>((set) => ({
    heroesData: new Map(),
    setHeroes: (heroes: Hero[]) => set(() => {
        return {heroesData: new Map(heroes.map(hero => [hero.id, hero]))}
    })
}))