import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import styles from "./styles/Dashboard.module.css";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user;

  const [scadenze, setScadenze] = useState([]);
  const [formData, setFormData] = useState({
    tipo: "",
    data_scadenza: "",
    descrizione: "",
    stato: "attiva",
    premio_annopassato: "",
    importo: "",
  });

  useEffect(() => {
    if (user?.id) {
      fetchScadenze();
    }
  }, [user?.id]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  const fetchScadenze = async () => {
    try {
      const res = await fetch(`/api/scadenze?userId=${user.id}`);
      const data = await res.json();
      setScadenze(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Errore nel recupero delle scadenze:", error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // aggiunta scadenza
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      id_utente: user.id,
    };
  
    try {
      const res = await fetch("/api/scadenze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
  
      if (res.status === 409) {
        alert("Hai già inserito una scadenza con gli stessi campi (tipo e descrizione)!.");
        return;
      }
  
      if (res.ok) {
        alert("Scadenza aggiunta con successo!");
        setFormData({
          tipo: "",
          data_scadenza: "",
          descrizione: "",
          stato: "attiva",
          premio_annopassato: "",
          importo: "",
        });
        fetchScadenze();
      } else {
        console.error("Errore durante l'aggiunta della scadenza");
        alert("Errore durante il salvataggio. Riprova.");
      }
    } catch (error) {
      console.error("Errore di rete:", error);
      alert("Errore di rete. Controlla la connessione.");
    }
  };

  // esporta in JSON
  const exportAsJSON = () => {
    const dataStr = JSON.stringify(scadenze, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "scadenze.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (status === "loading" || !user) return <p>Caricamento...</p>;

  return (
    <div className={styles.page}>
    <div className={styles.container}>
      <div className={styles.heading}>
        <h1>Ciao, {user.name}</h1>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className={`${styles.actionButton} ${styles.blueButton}`}
            onClick={() => router.push("/visualizza")}
          >
            Visualizza Scadenze
          </button>

          <button
            className={`${styles.actionButton} ${styles.greenButton}`}
            onClick={exportAsJSON}
          >
            Esporta JSON
          </button>

          <button
            className={`${styles.actionButton} ${styles.redButton}`}
            onClick={() => signOut()}
          >
            Logout
          </button>
           
        </div>
      </div>

      <h2 className={styles.subheading}>Inserisci una nuova scadenza</h2>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          className={styles.input}
          type="text"
          name="tipo"
          value={formData.tipo}
          onChange={handleChange}
          placeholder="Tipo"
          required
        />
        <input
          className={styles.input}
          type="date"
          name="data_scadenza"
          value={formData.data_scadenza}
          onChange={handleChange}
          required
        />
        <input
          className={styles.input}
          type="text"
          name="descrizione"
          value={formData.descrizione}
          onChange={handleChange}
          placeholder="Descrizione"
          required
        />
        <input
          className={styles.input}
          type="number"
          name="importo"
          value={formData.importo}
          onChange={handleChange}
          placeholder="Importo attuale (€)"
          required
        />

        {formData.tipo.toLowerCase().includes("polizza") && (
          <input
            className={styles.input}
            type="number"
            name="premio_annopassato"
            value={formData.premio_annopassato}
            onChange={handleChange}
            placeholder="Premio anno passato (€)"
          />
        )}

        <div className={styles.buttons}>
          <button type="submit">Aggiungi</button>
        </div>
      </form>
    </div>
    </div>
  );
}