import { Hero } from "@/app/utils/types"
import { FC } from "react"
import Image from "next/image";

import styles from './HeroCard.module.scss'
import { useTeamStore } from "@/app/store/teamStore";

interface IProps{ 
    hero: Hero
}

const HeroCard: FC<IProps> = ({hero}) =>{
    const toggleHero = useTeamStore((state) => state.toggleHeroTeam);
    const removeHero = useTeamStore((state) => state.removeHero);

    return(
        <article className={styles.card}>
            <Image
                src={`/${hero.displayName.toLowerCase()}.jpg`}
                alt={`${hero.displayName}`}
                width={75}
                height={50}
            />
            <div className={styles.card_info}>
                <p>{hero.displayName}</p>
                <section className={styles.card_info_buttons}>
                    <button onClick={() => toggleHero(hero.id, 'allyTeam')}>команда</button>
                    <button onClick={() => toggleHero(hero.id, 'enemyTeam')}>враги</button>
                </section>
                <button onClick={() => removeHero(hero.id)}>удалить</button>
            </div>
        </article>
    )
}

export default HeroCard