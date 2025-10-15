import { create } from "zustand"

interface TeamState{
    allyTeam: number[],
    enemyTeam: number[],
    toggleHeroTeam: (heroId: number, team: "enemyTeam" | "allyTeam") => void,
    removeHero: (heroId: number) => void
}

export const useTeamStore = create<TeamState>((set) => ({
    allyTeam: [],
    enemyTeam: [],
    toggleHeroTeam: (heroId: number, team: "enemyTeam" | "allyTeam") => set((state) => {
        if (state[team].includes(heroId)) return{}
        if (state[team].length == 5) return{}

        const oppositeTeam = team === "allyTeam" ? "enemyTeam" : "allyTeam";
        return {
            [team]: [...state[team], heroId],
            [oppositeTeam]: state[oppositeTeam].filter((id) => id != heroId)
        }
    }),
    removeHero: (heroId: number) => set((state) => {
        return {
            allyTeam: state.allyTeam.filter(id => id != heroId),
            enemyTeam: state.enemyTeam.filter(id => id != heroId)
        }
    })
}))