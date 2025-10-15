import HeroList from "./heroList/HeroList"
import TeamList from "./TeamList"

import styles from './Main.module.scss'

const Main = () =>{
    return (
        <div className={styles.window_main}>
            <section className={styles.teams}>
                <TeamList teamType="ally"/>
                <TeamList teamType="enemy"/>
            </section>

            <HeroList/>
        </div>
    )
}

export default Main