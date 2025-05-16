import path from "path";
import fs from "fs";
import formidable from "formidable";
import mysql from "mysql2/promise";

export const config = {
  api: {
    bodyParser: false,
  },
};

const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const pool = mysql.createPool({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DB,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const form = formidable({ multiples: true, keepExtensions: true });
  form.uploadDir = uploadDir;

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: "Errore parsing upload" });

    const scadenzaId = fields.scadenzaId;
    const fileArray = Array.isArray(files.files) ? files.files : [files.files];
    const savedFiles = [];

    try {
      for (const file of fileArray) {
        const originalName = file.originalFilename;
        const tempPath = file.filepath;
        const finalPath = path.join(uploadDir, originalName);

        fs.renameSync(tempPath, finalPath);

        // Salva nel DB e ottieni l'ID del file
        const [result] = await pool.query(
          "INSERT INTO scadenze_files (id_scadenza, nome_file) VALUES (?, ?)",
          [scadenzaId, originalName]
        );

        const insertedId = result.insertId;

        savedFiles.push({
          id: insertedId,
          nome_file: originalName,
        });
      }

      return res.status(200).json({ files: savedFiles });
    } catch (e) {
      console.error("Errore salvataggio file:", e);
      return res.status(500).json({ error: "Errore durante l’upload" });
    }
  });
}