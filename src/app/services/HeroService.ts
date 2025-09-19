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

        console.log('fetching heroes');

        const response = await fetch("https://api.stratz.com/graphql", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${STRATZ_KEY}`
            },
            body: JSON.stringify({ query: query })
        });
        
        console.log('heroes fetched, status:', response.status);
        const data = await response.json();
        return data.data.constants.heroes;
    }
}