import mysql from "mysql2/promise";
import fs from "fs";
import path from "path";

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === "GET") {
    if (!id) return res.status(400).json({ error: "ID scadenza mancante" });

    try {
      const [rows] = await pool.query(
        "SELECT id, nome_file FROM scadenze_files WHERE id_scadenza = ?",
        [id]
      );
      return res.status(200).json(rows);
    } catch (err) {
      console.error("Errore DB:", err.message);
      return res.status(500).json({ error: "Errore interno" });
    }
  }

  if (req.method === "DELETE") {
    const { fileId, fileName } = req.body;
  
    if (!fileId || !fileName) {
      return res.status(400).json({ error: "Dati mancanti per la rimozione" });
    }
  
    try {
      console.log("Eliminazione richiesta per:", fileId, fileName); // Debug temporaneo
      
      // eliminazione dal disco
      const filePath = path.join(process.cwd(), "public", "uploads", fileName);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("File fisico eliminato:", filePath);
      } else {
        console.log("File non trovato sul disco:", filePath);
      }
      
      // eliminazione dal DB
      const [result] = await pool.query(
        "DELETE FROM scadenze_files WHERE id = ? AND nome_file = ?",
        [fileId, fileName]
      );
  
      console.log("Record DB eliminato:", result.affectedRows);
  
      return res.status(200).json({ message: "File eliminato" });
    } catch (err) {
      console.error("Errore eliminazione file:", err.message);
      return res.status(500).json({ error: "Errore durante l'eliminazione" });
    }
  }
  
  return res.status(405).json({ error: "Metodo non supportato" });
}