import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "ID scadenza mancante" });
  }

  // GET: recupera i dettagli
  if (req.method === "GET") {
    try {
      const [rows] = await pool.query(
        "SELECT * FROM scadenze WHERE id = ?",
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Scadenza non trovata" });
      }

      return res.status(200).json(rows[0]);
    } catch (err) {
      console.error("Errore DB GET:", err.message);
      return res.status(500).json({ error: "Errore interno al server" });
    }
  }

  // PUT: aggiorna la scadenza
  if (req.method === "PUT") {
    const {
      tipo,
      descrizione,
      stato,
      data_scadenza,
      premio_annopassato,
      importo,
    } = req.body;

    try {
      await pool.query(
        `UPDATE scadenze 
         SET tipo = ?, descrizione = ?, stato = ?, data_scadenza = ?, premio_annopassato = ?, importo = ? 
         WHERE id = ?`,
        [
          tipo,
          descrizione,
          stato,
          data_scadenza,
          premio_annopassato || null,
          importo || null,
          id,
        ]
      );

      const [updated] = await pool.query("SELECT * FROM scadenze WHERE id = ?", [id]);
      return res.status(200).json(updated[0]);
    } catch (err) {
      console.error("Errore DB PUT:", err.message);
      return res.status(500).json({ error: "Errore nel salvataggio" });
    }
  }

  return res.status(405).json({ error: "Metodo non supportato" });
}