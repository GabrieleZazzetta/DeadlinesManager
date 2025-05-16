import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId mancante" });

    try {
      const [rows] = await pool.query(
        "SELECT id, tipo, data_scadenza, data_creazione, descrizione, stato, importo, premio_annopassato FROM scadenze WHERE id_utente = ?",
        [userId]
      );
      return res.status(200).json(rows);
    } catch (error) {
      console.error("Errore DB (GET):", error.message);
      return res.status(500).json({ error: "Errore nel recupero delle scadenze" });
    }
  }

  if (req.method === "POST") {
    const { id_utente, tipo, data_scadenza, descrizione, stato, importo, premio_annopassato } = req.body;

    if (!id_utente || !tipo || !data_scadenza || !descrizione || !stato) {
      return res.status(400).json({ error: "Dati mancanti" });
    }

    try {
      //  Controllo duplicato: tipo + data + id_utente
      const [duplicate] = await pool.query(
        `SELECT id FROM scadenze WHERE id_utente = ? AND tipo = ? AND descrizione = ?`,
        [id_utente, tipo, descrizione]
      );
    
      if (duplicate.length > 0) {
        return res.status(409).json({ error: "Scadenza duplicata" });
      }
    
      // inserimento se non esiste scadenza con stessi campi tipo e descrizione
      await pool.query(
        `INSERT INTO scadenze 
        (id_utente, tipo, data_scadenza, descrizione, stato, importo, premio_annopassato) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id_utente, tipo, data_scadenza, descrizione, stato, importo || null, premio_annopassato || null]
      );

      return res.status(201).json({ message: "Scadenza creata con successo" });
    } catch (error) {
      console.error("Errore DB (POST):", error.message);
      return res.status(500).json({ error: "Errore durante l'inserimento" });
    }
  }

  if (req.method === "PUT") {
    const { id, tipo, data_scadenza, descrizione, stato, importo, premio_annopassato } = req.body;

    if (!id || !tipo || !data_scadenza || !descrizione || !stato) {
      return res.status(400).json({ error: "Dati mancanti per l'aggiornamento" });
    }

    try {
      await pool.query(
        `UPDATE scadenze 
         SET tipo = ?, data_scadenza = ?, descrizione = ?, stato = ?, importo = ?, premio_annopassato = ?
         WHERE id = ?`,
        [tipo, data_scadenza, descrizione, stato, importo || null, premio_annopassato || null, id]
      );
      return res.status(200).json({ message: "Scadenza aggiornata" });
    } catch (error) {
      console.error("Errore DB (PUT):", error.message);
      return res.status(500).json({ error: "Errore durante l'aggiornamento" });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: "ID mancante per l'eliminazione" });
    }

    try {
      await pool.query("DELETE FROM scadenze WHERE id = ?", [id]);
      return res.status(200).json({ message: "Scadenza eliminata" });
    } catch (error) {
      console.error("Errore DB (DELETE):", error.message);
      return res.status(500).json({ error: "Errore durante l'eliminazione" });
    }
  }

  return res.status(405).json({ error: "Metodo non supportato" });
}