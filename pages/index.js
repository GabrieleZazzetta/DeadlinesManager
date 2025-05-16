import Head from "next/head";
import styles from "./styles/Home.module.css";

export default function Home() {
  return (
    <>
      <Head>
        <title>Deadlines Manager</title>
      </Head>

      <div className={styles.page}>
        <header className={styles.header}>
          <img src="/logo.png" alt="Logo Deadlines Manager" className={styles.logo} />
        </header>

        <main className={styles.main}>
            <p className={styles.tagline}>
              Gestisci le tue scadenze in modo semplice e sicuro.
            </p>
            <a href="/login" className={styles.button}>Accedi</a>
            <p className={styles.register}>
              Non hai un account? <a href="/register">Registrati</a>
            </p>
        </main>
      </div>
    </>
  );
}