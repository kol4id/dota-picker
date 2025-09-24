import prisma from "@/lib/db"; 
import { Hero, HeroMatchup, Prisma } from "@prisma/client";
const STRATZ_KEY = process.env.STRATZ_KEY!

interface IMatchUp {
    vs: [{ 
        heroId2: number,
        winCount: number,
        matchCount: number,
    }] 
    with: [{ 
        heroId2: number, 
        winCount: number, 
        matchCount: number, 
    }] 
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
                heroes { 
                    id 
                    displayName 
                    shortName
                }
            }
        }`;

        const response = await fetch("https://api.stratz.com/graphql", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRATZ_KEY}`
            },
            body: JSON.stringify({ query: query })
        });
        
        const data = await response.json();
        await prisma.hero.createMany({
            data: data.data.constants.heroes,
            skipDuplicates: true,
        });
        
        return data.data.constants.heroes;
    }

    static async fetchHerosMatchUps (){
        const heroes = await this.getHeroes();
        const idsList = heroes.map(hero => hero.id);

        const query = `
            query HeroStatsQuery { 
                heroStats { 
                    matchUp(heroIds: [${idsList.toString()}] take: ${idsList.length + 1}) { 
                        vs { 
                            heroId2 
                            winCount 
                            matchCount 
                        } 
                        with { 
                            heroId2 
                            winCount 
                            matchCount 
                        } 
                    } 
                } 
            }`
       
        const response = await fetch("https://api.stratz.com/graphql", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRATZ_KEY}`
            },
            body: JSON.stringify({ query: query })
        });

        const data = await response.json();
        const matchUps = data.data.heroStats.matchUp as IMatchUp[];
        const upsertPromises = await this.generateMatchupUpsert(matchUps, heroes);

        console.log(`Получено ${upsertPromises.length} комбинаций.`);
        console.time('transaction');

        const result = await prisma.$transaction(upsertPromises);

        console.timeEnd('transaction');
        console.log(`Транзакция выполнена ${result.length} операций применено`);
        return result;
    }

    private static async generateMatchupUpsert (data: IMatchUp[], heroes: Hero[]) {
        const upsertPromises: Prisma.PrismaPromise<HeroMatchup>[] = [];
        let indx = 0;
        
        const generateUpsert = (index: number, type: 'VS' | 'WITH', hero: IMatchUp) =>{
            const address = type == "VS" ? 'vs' : 'with';

            return hero[address].map(match => prisma.heroMatchup.upsert({
                where: {
                    heroA_id_heroB_id_matchupType: {
                        heroA_id: heroes[index].id,
                        heroB_id: match.heroId2,
                        matchupType: type,
                    }
                },
                update: {
                    matchCount: match.matchCount,
                    winCount: match.winCount
                },
                create: {
                    heroA_id: heroes[index].id,
                    heroB_id: match.heroId2,
                    matchupType: type,
                    matchCount: match.matchCount,
                    winCount: match.winCount
                }
            }))
        }
       
        console.time('upsert gen');
        data.forEach(hero => {
            upsertPromises.push(...generateUpsert(indx, 'VS', hero));
            upsertPromises.push(...generateUpsert(indx, 'WITH', hero));
            indx++;
        })

        console.timeEnd('upsert gen');

        return upsertPromises;
    }
}