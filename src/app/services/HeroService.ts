import prisma from "@/lib/db"; 
const STRATZ_KEY = process.env.STRATZ_KEY!

export class HeroService {
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
}