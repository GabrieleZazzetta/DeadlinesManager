import mysql from "mysql2/promise";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import * as Brevo from "@getbrevo/brevo";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

const apiInstance = new Brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  Brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export default async function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ error: "Metodo non consentito" });

  const today = new Date();
  const giorniDaVerificare = [30, 15, 1];
  const colonnaPerGiorni = {
    30: "email_30_sent",
    15: "email_15_sent",
    1: "email_1_sent",
  };

  try {
    const [scadenze] = await pool.query(`
      SELECT s.*, u.email, u.nome
      FROM scadenze s
      JOIN utenti u ON s.id_utente = u.id
    `);

    for (const scadenza of scadenze) {
      const dataScadenza = new Date(scadenza.data_scadenza);
      const diffGiorni = Math.ceil(
        (dataScadenza - today) / (1000 * 60 * 60 * 24)
      );

      const colonna = colonnaPerGiorni[diffGiorni];
      if (!colonna) continue;

      if (scadenza[colonna]) continue; // evita duplicazione

      const formattedDate = format(dataScadenza, "dd MMMM yyyy", { locale: it });
      let contenuto = `Ciao ${scadenza.nome},\n\nTi ricordiamo che la scadenza \"${scadenza.tipo} - ${scadenza.descrizione}\" è prevista per il giorno ${formattedDate}.\n\n`;

      if (scadenza.tipo.toLowerCase().includes("polizza")) {
        contenuto += `Confronto costi:\n- Premio anno passato: €${scadenza.premio_annopassato}\n- Premio attuale: €${scadenza.importo}\n\n`;
      }

      contenuto += "Accedi al tuo account per ulteriori dettagli.\n\nIl team DeadlinesManager";

      const email = {
        sender: { email: "zazzettagabriele@gmail.com", name: "DeadlinesManager" },  // noreply@tuodominio.it
        to: [{ email: scadenza.email, name: scadenza.nome }],
        subject: `Promemoria Scadenza: ${scadenza.tipo}`,
        textContent: contenuto,
      };

      await apiInstance.sendTransacEmail(email);
      await pool.query(
        `UPDATE scadenze SET ${colonna} = 1 WHERE id = ?`,
        [scadenza.id]
      );
    }

    return res.status(200).json({ message: "Promemoria inviati se necessario." });
  } catch (err) {
    console.error("Errore invio reminder:", err);
    return res.status(500).json({ error: "Errore interno." });
  }
}