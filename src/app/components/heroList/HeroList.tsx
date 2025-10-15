'use client'

import { useQuery } from "@tanstack/react-query";
import { useHeroStore } from "../../store/heroStore";
import { useEffect, useState } from "react";

import styles from './HeroList.module.scss'
import HeroCard from "./HeroCard";
import { Hero } from "@/app/utils/types";

const fetchHeroes = async () => {
    const res = await fetch('/api/heroes');
    if (!res.ok) {
        console.log(res.status) 
        throw new Error('Failed to fetch');
    }
    return res.json();
}

const HeroList = () =>{
    const heroMap = useHeroStore((state) => state.heroesData);
    const setHeroes = useHeroStore((state) => state.setHeroes);
    const [value, setValue] = useState('');

    const {data, isLoading, isError, error} = useQuery({
        queryKey: ['heroes'],
        queryFn: fetchHeroes
    })

    const textMatch = (hero: Hero) =>{
        const searchTerm = value.toLowerCase() 
        const itemText = (hero.displayName + hero.shortName).toLowerCase();
        return itemText.indexOf(searchTerm) !== -1;
    }

    const filteredList = heroMap.values().filter(textMatch);

    useEffect(()=>{
        if (data) setHeroes(data);
    }, [data, setHeroes])

    if (isLoading) return(
        <div>загружаем список героев</div>
    )

    return(
        <>
            <article className={styles.hero_search}>
                <input
                    type="text"
                    onChange={e => setValue(e.target.value)}
                    value={value}
                />
                <section className={styles.hero_list}>
                    
                    <ul>
                        {filteredList.map(hero => 
                            <li key={hero.id}> 
                                <HeroCard hero={hero}/>
                            </li>
                        )}
                    </ul>
                </section>
            </article>
        </>
    )
}

export default HeroList