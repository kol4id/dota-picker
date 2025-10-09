import { HeroService } from "./HeroService";

interface MatchupStats {
  heroId: number;
  winrate: number;
}

interface TeamData {
  allHeroesWinrate: MatchupStats[];                     
  teamHeroes: MatchupStats[];                            
  enemyHeroes: MatchupStats[];                          
  teamMatchupMap: Map<number, Map<number, number>>;     
  enemyMatchupMap: Map<number, Map<number, number>>;   
}

export class PredictionService {

    static async calculateNextPick (team: number[] = [], enemy: number[] = []) {
        if (!team.length && !enemy.length){
            const allHeroesWinrate = (await HeroService.getHeroesWinrate()).sort((a, b) => b.winrate - a.winrate);
            const sortedCandidates = allHeroesWinrate.map(hero => ({heroId: hero.heroId, deltaWR: hero.winrate}))
            return {sortedCandidates, currentTeamSynergy: 0}
        }
        
        const {allHeroesWinrate, teamHeroes, enemyHeroes, teamMatchupMap, enemyMatchupMap} = await this.prepareTeamData(team, enemy);

        const pickedHeroes = new Set([...team, ...enemy]);
        const candidates = allHeroesWinrate.filter(hero => !pickedHeroes.has(hero.heroId));

        const sortedCandidates = candidates.map(candidate => {
            const synergyDelta = teamHeroes.reduce((sum, teamHero) => {
                const expected = (candidate.winrate + teamHero.winrate) / 2;
                const actual = teamMatchupMap.get(teamHero.heroId)?.get(candidate.heroId) ?? expected;
                return sum + (actual - expected);
            }, 0);

            const counterDelta = enemyHeroes.reduce((sum, enemyHero) => {
                const expected = enemyHero.winrate;
                const actual = enemyMatchupMap.get(enemyHero.heroId)?.get(candidate.heroId) ?? expected
                return sum + (expected - actual);
            }, 0)

            const avgSynergy = team.length > 0 ? synergyDelta / team.length : 0;
            const avgCounter = enemy.length > 0 ? counterDelta / enemy.length : 0;

            const totalDelta = avgSynergy + avgCounter;

            return { heroId: candidate.heroId, deltaWR: totalDelta };
        }).sort((a, b) => b.deltaWR - a.deltaWR);
        
        if (!team.length){
            return {sortedCandidates, currentTeamSynergy: 0};    
        }
        const currentTeamSynergy = await this.calculateTeamSynergy(team, enemy, { allHeroesWinrate, teamHeroes, enemyHeroes, teamMatchupMap, enemyMatchupMap});
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

    private static async calculateTeamSynergy (team: number[], enemy: number[], data: TeamData) {
        console.time('TeamSynergy');
        if (team.length < 1) return 0;

        const { teamHeroes, enemyHeroes, teamMatchupMap, enemyMatchupMap } = data;

        let totalSynergyDelta = 0;
        let pairCount = 0;
        let totalCounterDelta = 0;
        let counterCount = 0;

        for (let i = 0; i < teamHeroes.length; i++) {
            for (let j = i + 1; j < teamHeroes.length; j++) {
                const expected = (teamHeroes[i].winrate + teamHeroes[j].winrate) / 2;
                const actual = teamMatchupMap.get(teamHeroes[i].heroId)?.get(teamHeroes[j].heroId) ?? expected;
                totalSynergyDelta += actual - expected;
                pairCount++;
            }
        }

        teamHeroes.forEach(hero =>{
            enemyHeroes.forEach(enemy =>{
                const expected = enemy.winrate;
                const actual = enemyMatchupMap.get(enemy.heroId)?.get(hero.heroId) ?? expected;
                totalCounterDelta += expected - actual;
                counterCount++;
            })
        })

        const avgSynergy = pairCount > 0 ? totalSynergyDelta / pairCount : 0;
        const avgCounter = counterCount > 0 ? totalCounterDelta / counterCount : 0;

        console.timeEnd('TeamSynergy');

        return avgSynergy + avgCounter;
    }

    private static async prepareTeamData (team: number[] = [], enemy: number[] = []): Promise<TeamData> {
        console.time('PrepareTeamData');

        console.time('WITH DATABASE RUN');
        const [allHeroesWinrate, teamStat, enemyStat] = await Promise.all([
            HeroService.getHeroesWinrate(),
            Promise.all(team.map(id => HeroService.getMatchupStats(id, 'WITH'))),
            Promise.all(enemy.map(id => HeroService.getMatchupStats(id, 'VS'))),
        ])
        console.timeEnd('WITH DATABASE RUN');

        const allHeroesMap = new Map(allHeroesWinrate.map(hero => [hero.heroId, hero]));
        const teamHeroes = team.map(id => allHeroesMap.get(id)!);
        const enemyHeroes = enemy.map(id => allHeroesMap.get(id)!);

        const toMatchup = (ids: number[], data: MatchupStats[][]) => {
            return new Map(ids.map((id, indx) => [id, new Map(data[indx].map(match => [match.heroId, match.winrate]))]));
        }

        const teamMatchupMap = toMatchup(team, teamStat);
        const enemyMatchupMap = toMatchup(enemy, enemyStat);
        
        console.timeEnd('PrepareTeamData');

        return { allHeroesWinrate, teamHeroes, enemyHeroes, teamMatchupMap, enemyMatchupMap };
    } 
}