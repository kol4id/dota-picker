import { HeroService } from "./HeroService";

interface MatchupStats {
  heroId: number;
  winrate: number;
}

interface TeamData {
  allHeroesWinrate: { heroId: number; winrate: number }[];
  teamHeroes: { heroId: number; winrate: number }[];
  teamMatchupMap: Map<number, Map<number, number>>;
}

export class PredictionService {

    static async calculateNextPick (team: number[]) {
        const {allHeroesWinrate, teamHeroes, teamMatchupMap} = await this.prepareTeamData(team);

        const candidates = allHeroesWinrate.filter(hero => !team.includes(hero.heroId));
        const sortedCandidates = candidates.map(candidate => {
                const totalDelta = teamHeroes.reduce((sum, t) => {
                    const expected = (candidate.winrate + t.winrate) / 2;
                    const actual = teamMatchupMap.get(t.heroId)?.get(candidate.heroId) ?? 0;
                    return sum + (actual - expected);
                }, 0);
                return { heroId: candidate.heroId, deltaWR: totalDelta / team.length };
            })
            .sort((a, b) => b.deltaWR - a.deltaWR);

        const currentTeamSynergy = await this.calculateTeamSynergy(team, {allHeroesWinrate, teamHeroes, teamMatchupMap});
        return {sortedCandidates, currentTeamSynergy};
    }

    static async calculateWinrateForHero (id: number) {
        const heroesWinrate = await HeroService.getHeroesWinrate();
        const matchupStats = await HeroService.getMatchupStats(id, 'WITH');

        const mainHero = heroesWinrate.find(hero => hero.heroId == id)!;
        const heroesWinrateNoMH = heroesWinrate.filter(hero => hero.heroId != id)

        const synergyDeltaWR = [];

        console.time('WinrateForHero');
        for (let i = 0; i < heroesWinrateNoMH.length; i++){

            const expectedWR = (heroesWinrateNoMH[i].winrate + mainHero.winrate) / 2;
            const deltaWR = matchupStats[i].winrate - expectedWR;
            synergyDeltaWR.push({
                heroId: heroesWinrateNoMH[i].heroId,
                deltaWR: deltaWR
            })
        }

        console.timeEnd('WinrateForHero');
        
        synergyDeltaWR.sort((a, b) => b.deltaWR - a.deltaWR);
        return synergyDeltaWR
    }

    private static async calculateTeamSynergy (team: number[], data: TeamData){
        console.time('TeamSynergy');
        if (team.length < 2) return 0;

        const { teamHeroes, teamMatchupMap } = data;

        let totalSynergyDelta = 0;
        let pairCount = 0;

        for (let i = 0; i < teamHeroes.length; i++) {
            for (let j = i + 1; j < teamHeroes.length; j++) {
                const expected = (teamHeroes[i].winrate + teamHeroes[j].winrate) / 2;
                const actual = teamMatchupMap.get(teamHeroes[i].heroId)?.get(teamHeroes[j].heroId) ?? 0;
                totalSynergyDelta += actual - expected;
                pairCount++;
            }
        }
        console.timeEnd('TeamSynergy');
        return pairCount > 0 ? (totalSynergyDelta / pairCount) : 0;
    }

    private static async prepareTeamData (team: number[]): Promise<TeamData> {
        console.time('PrepareTeamData');
        const allHeroesWinrate = await HeroService.getHeroesWinrate();
        const teamHeroes = allHeroesWinrate.filter(h => team.includes(h.heroId));

        const matchupList = await Promise.all(
            teamHeroes.map(hero => HeroService.getMatchupStats(hero.heroId, 'WITH'))
        );

        const teamMatchupMap = new Map<number, Map<number, number>>();
        teamHeroes.forEach((hero, indx) => {
            teamMatchupMap.set(hero.heroId, new Map(matchupList[indx].map(m => [m.heroId, m.winrate])));
        });
        console.timeEnd('PrepareTeamData');
        return { allHeroesWinrate, teamHeroes, teamMatchupMap };
    }
}