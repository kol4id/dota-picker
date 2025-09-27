import { HeroService } from "./HeroService";

export class PredictionService {
    static async calculateWinrateForHero (id: number) {
        const heroesWinrate = await HeroService.getHeroesWinrate();
        const matchupStats = await HeroService.getMatchupStats(id, 'WITH');

        const mainHero = heroesWinrate.find(hero => hero.heroId == id)!;
        const heroesWinrateNoMH = heroesWinrate.filter(hero => hero.heroId != id)

        const synergyDeltaWR = [];

        for (let i = 0; i < heroesWinrateNoMH.length; i++){
            console.log(`${heroesWinrateNoMH[i].heroId}  |  ${matchupStats[i].heroId}`)

            const expectedWR = (heroesWinrateNoMH[i].winrate + mainHero.winrate) / 2;
            const deltaWR = matchupStats[i].winrate - expectedWR;
            synergyDeltaWR.push({
                heroId: heroesWinrateNoMH[i].heroId,
                deltaWR: deltaWR
            })
        }

        
        synergyDeltaWR.sort((a, b) => b.deltaWR - a.deltaWR);
        return synergyDeltaWR
    }
}