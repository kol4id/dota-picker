'use client'
import Image from "next/image";
import { FC } from "react"
import styles from './TeamList.module.scss'
import { useHeroStore } from "../store/heroStore";
import { useTeamStore } from "../store/teamStore";

interface IProps {
    teamType: "ally" | "enemy";
}

const TeamList: FC<IProps> = ({teamType}) =>{

    const heroMap = useHeroStore((state) => state.heroesData);
    const team = useTeamStore((state) => teamType == 'ally' ? state.allyTeam : state.enemyTeam);
    const removeHero = useTeamStore((state) => state.removeHero);

    if (!heroMap.size) return <></>

    return (
        <section className={styles.team}>
            <ul>
                {team.map(hero => {
                    const heroData = heroMap.get(hero)!;
                    return(
                        <li key={heroData.id}  onDoubleClick={() => removeHero(heroData.id)}>
                            <Image
                                src={`/${heroData.displayName.toLowerCase()}.jpg`}
                                alt={`${heroData.displayName}`}
                                width={70}
                                height={45}
                            />
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}

export default TeamList