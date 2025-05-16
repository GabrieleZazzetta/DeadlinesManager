import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "../styles/DettaglioScadenza.module.css";

export default function DettaglioScadenza() {
  const router = useRouter();
  const { id } = router.query;
  const [scadenza, setScadenza] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [anteprime, setAnteprime] = useState({});
  const [modifica, setModifica] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const res = await fetch(`/api/scadenze/${id}`);
      const data = await res.json();
      setScadenza(data);
    };

    const fetchFiles = async () => {
      const res = await fetch(`/api/scadenze/files?id=${id}`);
      const data = await res.json();
      setFiles(data);
    };

    fetchData();
    fetchFiles();
  }, [id]);

  useEffect(() => {
    if (scadenza) {
      setFormData({
        tipo: scadenza.tipo,
        descrizione: scadenza.descrizione,
        stato: scadenza.stato,
        data_scadenza: scadenza.data_scadenza.split("T")[0],
        premio_annopassato: scadenza.premio_annopassato || "",
        importo: scadenza.importo || "",
      });
    }
  }, [scadenza]);

  const handleUpload = async (e) => {
    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => {
      formData.append("files", file);
    });
    formData.append("scadenzaId", id);
    setUploading(true);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (res.ok) {
      const uploaded = await res.json();
      setFiles((prev) => [...prev, ...uploaded.files]);
    }
  };

  const handleDeleteFile = async (fileId, fileName) => {
    const conferma = confirm("Vuoi davvero eliminare questo file?");
    if (!conferma) return;

    const res = await fetch("/api/scadenze/files", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fileId, fileName }),
    });

    if (res.ok) {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      setAnteprime((prev) => {
        const updated = { ...prev };
        delete updated[fileName];
        return updated;
      });
    }
  };

  const toggleAnteprima = (fileName) => {
    setAnteprime((prev) => ({
      ...prev,
      [fileName]: !prev[fileName],
    }));
  };

  const handleSalva = async () => {
    try {
      const res = await fetch(`/api/scadenze/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
  
      if (!res.ok) {
        alert("Errore nel salvataggio. Riprova.");
        return;
      }
  
      const updated = await res.json();
      setScadenza(updated);
      setModifica(false); // esce dalla modalità modifica
    } catch (error) {
      console.error("Errore durante il salvataggio:", error);
      alert("Si è verificato un errore.");
    }
  };  

  if (!scadenza) return <p>Caricamento dettagli...</p>;

  return (
    <div className={styles.page}>
    <div className={styles.container}>
      {!modifica && (
        <button
          onClick={() => router.push("/visualizza")}
          className={styles.backButton}
        >
          ← Tutte le mie scadenze
        </button>
      )}

      {modifica ? (
        <>
          <div className={styles.formGroup}>
            <label>Tipo</label>
            <input
              className={styles.editInput}
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label>Descrizione</label>
            <input
              className={styles.editInput}
              value={formData.descrizione}
              onChange={(e) =>
                setFormData({ ...formData, descrizione: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label>Data scadenza</label>
            <input
              type="date"
              className={styles.editInput}
              value={formData.data_scadenza}
              onChange={(e) =>
                setFormData({ ...formData, data_scadenza: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label>Stato</label>
            <select
              className={styles.editInput}
              value={formData.stato}
              onChange={(e) =>
                setFormData({ ...formData, stato: e.target.value })
              }
            >
              <option value="attiva">Attiva</option>
              <option value="non attiva">Non attiva</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Premio anno passato (€)</label>
            <input
              type="number"
              className={styles.editInput}
              value={formData.premio_annopassato}
              onChange={(e) =>
                setFormData({ ...formData, premio_annopassato: e.target.value })
              }
            />
          </div>

          <div className={styles.formGroup}>
            <label>Importo attuale (€)</label>
            <input
              type="number"
              className={styles.editInput}
              value={formData.importo}
              onChange={(e) => setFormData({ ...formData, importo: e.target.value })}
            />
          </div>

          <button onClick={handleSalva} className={styles.saveButton}>
            Salva
          </button>
          <button
            onClick={() => setModifica(false)}
            className={styles.cancelButton}
          >
            Annulla
          </button>
        </>
      ) : (
        <>
          <h1>{scadenza.tipo}</h1>
          <p><strong>Descrizione:</strong> {scadenza.descrizione}</p>
          <p><strong>Data:</strong> {new Date(scadenza.data_scadenza).toLocaleDateString("it-IT")}</p>
          <p><strong>Stato:</strong> {scadenza.stato}</p>
          {scadenza.premio_annopassato && (
            <p><strong>Premio anno passato:</strong> €{scadenza.premio_annopassato}</p>
          )}
          {scadenza.importo && (
            <p><strong>Importo attuale:</strong> €{scadenza.importo}</p>
          )}
          <button onClick={() => setModifica(true)} className={styles.editButton}>
            Modifica
          </button>

          <hr />
          <h3>Documenti allegati</h3>

          {files.length > 0 ? (
            <ul className={styles.fileList}>
              {files.map((f) => {
                const nomePulito = f.nome_file.replace(/^\w{24}_/, "");
                const isPreviewing = anteprime[f.nome_file];

                return (
                  <li key={`${f.id}-${f.nome_file}`}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <a
                        href={`/uploads/${f.nome_file}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.fileLink}
                      >
                        {nomePulito}
                      </a>
                      <button onClick={() => toggleAnteprima(f.nome_file)} className={styles.previewButton}>
                        Anteprima
                      </button>
                      <button onClick={() => handleDeleteFile(f.id, f.nome_file)} className={styles.deleteButton}>
                        Elimina
                      </button>
                    </div>
                    {isPreviewing && (
                      <div style={{ marginTop: "10px" }}>
                        <iframe
                          src={`/uploads/${f.nome_file}`}
                          width="100%"
                          height="450px"
                          style={{ border: "1px solid #ccc", borderRadius: "6px" }}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Nessun file caricato.</p>
          )}

          <label className={styles.uploadLabel}>
            Carica PDF
            <input type="file" onChange={handleUpload} multiple accept="application/pdf" />
          </label>

          {uploading && <p>Caricamento in corso...</p>}
        </>
      )}
    </div>
    </div>
  );
}