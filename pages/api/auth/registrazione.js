import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// Crea una pool di connessione al database
const pool = mysql.createPool({
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
});

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { nome, email, password, telefono } = req.body;
        try {
            const hashedPassword = await bcrypt.hash(password, 10);
        
            console.log("Inserisco nel DB:", { nome, email, hashedPassword, telefono });
        
            const [rows] = await pool.query(
                `INSERT INTO utenti (nome, email, password, telefono) VALUES (?, ?, ?, ?)`,
                [nome, email, hashedPassword, telefono]
            );
        
            console.log("Inserimento completato:", rows);

            // salvataggio su file json
            const filePath = path.join(process.cwd(), 'data', 'utenti.json');

            if (!fs.existsSync(path.dirname(filePath))) {
                fs.mkdirSync(path.dirname(filePath), { recursive: true });
            }

            let utentiSalvati = [];
            if (fs.existsSync(filePath)) {
                const fileData = fs.readFileSync(filePath, 'utf-8');
                utentiSalvati = JSON.parse(fileData);
            }

            // non salvo sul json la pw per sicurezza
            utentiSalvati.push({
                nome,
                email,
                telefono,
                dataRegistrazione: new Date().toISOString()
            });

            fs.writeFileSync(filePath, JSON.stringify(utentiSalvati, null, 2), 'utf-8');
        
            res.status(201).json({ message: 'Utente registrato con successo' });
        } catch (error) {
            console.error("ERRORE durante INSERT:", error); // log
            res.status(500).json({ message: 'Errore durante la registrazione', error: error.message });
        }
        
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
