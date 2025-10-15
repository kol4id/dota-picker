
import styles from "./page.module.css";
import Main from "./components/Main";

export default function Home() {
  return (
    <section className={styles.main_area}>
      <Main/>
    </section>
  );
}
