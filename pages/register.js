import Head from "next/head";
import styles from "./styles/Register.module.css";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

export default function Register() {
  const [userData, setUserData] = useState({
    nome: "",
    cognome: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: ""
  });

  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const validatePassword = (password) => {
    const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    return re.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (userData.password !== userData.confirmPassword) {
      alert("Le password non coincidono");
      return;
    }

    if (!validatePassword(userData.password)) {
      alert("La password deve contenere almeno 8 caratteri, una maiuscola e un numero.");
      return;
    }

    const res = await fetch("/api/auth/registrazione", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData)
    });

    if (res.ok) {
      const loginRes = await signIn("credentials", {
        redirect: false,
        email: userData.email,
        password: userData.password
      });

      if (loginRes?.ok) {
        router.push("/dashboard");
      } else {
        alert("Registrazione riuscita ma login fallito.");
        router.push("/login");
      }
    } else {
      alert("Errore durante la registrazione.");
    }
  };

  return (
    <>
      <Head>
        <title>Registrati - Deadline Manager</title>
      </Head>

      <div className={styles.page}>
        <div className={styles.header}>
          <img src="/logo.png" alt="Logo Deadline Manager" className={styles.logo} />
        </div>

        <main className={styles.main}>
          <div className={styles.card}>
            <h1 className={styles.title}>Registrati</h1>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.row}>
                <input
                  type="text"
                  name="nome"
                  value={userData.nome}
                  onChange={handleChange}
                  placeholder="Nome"
                  required
                />
                <input
                  type="text"
                  name="cognome"
                  value={userData.cognome}
                  onChange={handleChange}
                  placeholder="Cognome"
                  required
                />
              </div>

              <input
                type="email"
                name="email"
                value={userData.email}
                onChange={handleChange}
                placeholder="Email"
                required
              />

              <input
                type="password"
                name="password"
                value={userData.password}
                onChange={handleChange}
                placeholder="Password"
                required
              />
              <small className={styles.note}>
                La password deve contenere almeno 8 caratteri, una lettera maiuscola e un numero.
              </small>

              <input
                type="password"
                name="confirmPassword"
                value={userData.confirmPassword}
                onChange={handleChange}
                placeholder="Conferma Password"
                required
              />

              <input
                type="text"
                name="telefono"
                value={userData.telefono}
                onChange={handleChange}
                placeholder="Telefono"
                required
              />

              <button type="submit" className={styles.button}>Registrati</button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}