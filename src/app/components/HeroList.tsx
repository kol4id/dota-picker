'use client'
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useHeroStore } from "../store/heroStore";
import { useCallback, useEffect } from "react";


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

    const {data, isLoading, isError, error} = useQuery({
        queryKey: ['heroes'],
        queryFn: fetchHeroes
    })

    useEffect(()=>{
        if (data) setHeroes(data);
    }, [data, setHeroes])

    if (isLoading) return(
        <div>загружаем список героев</div>
    )

    return(
        <>
            <ul>
                {heroMap.values().map(hero => 

                    <li key={hero.id}> 
                    <Image
                        src={`/${hero.displayName.toLowerCase()}.jpg`}
                        alt={`${hero.displayName}`}
                        width={65}
                        height={50}
                    ></Image>{`${hero.id},  ${hero.displayName},  ${hero.shortName}`} </li>
                )}
            </ul>
        </>
    )
}

export default HeroList