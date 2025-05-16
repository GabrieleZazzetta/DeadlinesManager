import { signIn, getCsrfToken } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import styles from "./styles/Login.module.css";

export default function Login({ csrfToken }) {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    if (result.ok) {
      router.push("/dashboard");
    } else {
      setError("Credenziali non valide");
    }
  };

  return (
    <>
      <Head>
        <title>Login - Deadline Manager</title>
      </Head>
      <div className={styles.page}>
        <div className={styles.header}>
          <img src="/logo.png" alt="Logo Deadline Manager" className={styles.logo} />
        </div>

        <main className={styles.main}>
          <div className={styles.card}>
            <h1 className={styles.title}>Accedi</h1>
            <form onSubmit={handleSubmit} className={styles.form}>
              <input name="csrfToken" type="hidden" defaultValue={csrfToken} />

              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                required
              />

              <input
                name="password"
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />

              {error && <p className={styles.error}>{error}</p>}

              <button type="submit" className={styles.button}>Login</button>
            </form>
          </div>
        </main>
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  return {
    props: {
      csrfToken: await getCsrfToken(context),
    },
  };
}