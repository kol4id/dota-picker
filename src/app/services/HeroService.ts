import prisma from "@/lib/db"; 
import { Hero, Prisma } from "@prisma/client";
import { PredictionService } from "./PredictionService";

const STRATZ_KEY = process.env.STRATZ_KEY!;
const STRATZ_API = 'https://api.stratz.com/graphql';


interface StratzMatchupDetail {
    heroId2: number, 
    winCount: number, 
    matchCount: number, 
}

interface StratzApiMatchup {
    vs: StratzMatchupDetail[],
    with: StratzMatchupDetail[]
}

export class HeroService {
    static async getHeroes(){
        return prisma.hero.findMany();
    }

    static async getHeroesMatchups(){
        return prisma.heroMatchup.findMany();
    }

    static async fetchHeroes(){
        const query = 
            `query {
                constants { 
                    heroes {id displayName shortName}
                }
            }`;

        const data = await this.stratzFetcher<{constants:{heroes: Hero[]}}>(query);
        const heroes = data.constants.heroes;

        await prisma.hero.createMany({
            data: heroes,
            skipDuplicates: true,
        });
        
        return heroes;
    }

    static async fetchHerosMatchUps (){
        const heroes = await this.getHeroes();
        const heroIds = heroes.map(hero => hero.id);

        const query = `
            query HeroStatsQuery {
                heroStats {
                    matchUp(heroIds: [${heroIds.toString()}], take: ${heroIds.length}, bracketBasicIds: [LEGEND_ANCIENT, DIVINE_IMMORTAL, CRUSADER_ARCHON]) {
                        vs { heroId2 winCount matchCount }
                        with { heroId2 winCount matchCount }
                    }
                }
            }`;

        const data = await this.stratzFetcher<{heroStats: {matchUp: StratzApiMatchup[]}}>(query); 
        const upsertPromises = await this.generateMatchupUpsert(data.heroStats.matchUp, heroes);

        console.log(`Получено ${upsertPromises.length} комбинаций.`);
        console.time('transaction');

        const result = await prisma.$transaction(upsertPromises);

        console.timeEnd('transaction');
        console.log(`Транзакция выполнена ${result.length} операций применено`);
        return result;
    }

    static async getHeroWinrate (identifier: string): Promise<number>;
    static async getHeroWinrate (identifier: number): Promise<number>;

    static async getHeroWinrate (identifier: string | number): Promise<number> {
        const where: Prisma.HeroWhereInput = typeof(identifier) == "number"
            ? {id: identifier}
            : {OR: [
                {shortName: {equals: identifier, mode: 'insensitive'}},
                {displayName: {equals: identifier, mode: 'insensitive'}}
            ]}
        
        const hero = await prisma.hero.findFirst({where});
        if (!hero) return -1;

        const result = await prisma.heroMatchup.aggregate({
            where: {heroA_id: hero.id},
            _sum: {winCount: true, matchCount: true}
        })
       
        return ((result._sum.winCount ?? 0) / (result._sum.matchCount ?? 0));
    }

    static async getHeroesWinrate () {
        const heroesStats = await prisma.heroMatchup.groupBy({
            by: ['heroA_id'],
            _sum: {
                winCount: true,
                matchCount: true
            }
        })

        const result = heroesStats.map(hero => ({
            heroId: hero.heroA_id,
            winrate: hero._sum.winCount! / hero._sum.matchCount!,
        }));

        return result.sort((a,b) => a.heroId - b.heroId);
    }

    static async getMatchupStats (heroId: number, matchType: 'VS' | 'WITH') {
        const stats = await prisma.heroMatchup.findMany({
            where: {heroA_id: heroId, matchupType: matchType}
        })

        const result = stats.map(stat => ({
            heroId: stat.heroB_id,
            winrate: stat.winCount! / stat.matchCount!,
        }));

        return result.sort((a, b) => a.heroId - b.heroId)
    }

    private static async generateMatchupUpsert (matchupData: StratzApiMatchup[], heroes: Hero[]) {
        const createUpsertPromise = (heroA_id: number, heroB_id: number, type: 'VS' | 'WITH', matchCount: number, winCount: number) =>{
            return prisma.heroMatchup.upsert({
                where: {
                    heroA_id_heroB_id_matchupType: { heroA_id, heroB_id, matchupType: type }
                },
                update: { matchCount, winCount },
                create: { heroA_id, heroB_id, matchupType: type, matchCount, winCount }
            });
        }

        return matchupData.flatMap((matchup, index) =>{
            const vs = matchup.vs.map(vs => createUpsertPromise(heroes[index].id, vs.heroId2, 'VS', vs.matchCount, vs.winCount));
            const withUp = matchup.with.map(vs => createUpsertPromise(heroes[index].id, vs.heroId2, 'WITH', vs.matchCount, vs.winCount));
            return vs.concat(withUp);
        })
    }

    private static async stratzFetcher<T> (query: string): Promise<T> {
        const response = await fetch(STRATZ_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRATZ_KEY}`
            },
            body: JSON.stringify({ query: query })
        })

        if (!response.ok) throw new Error(response.status.toString());
        return (await response.json()).data;
    }
}