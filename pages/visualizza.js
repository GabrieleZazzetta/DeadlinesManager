import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import styles from "./styles/Visualizza.module.css";
import DeleteIcon from "@mui/icons-material/Delete";
import PushPinIcon from "@mui/icons-material/PushPin";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";

export default function Visualizza() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [scadenze, setScadenze] = useState([]);
  const [filtri, setFiltri] = useState({ tipo: "", stato: "", descrizione: "" });
  const [selezionate, setSelezionate] = useState([]);
  const [pinned, setPinned] = useState([]);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [sortOption, setSortOption] = useState(null);
  const [selezionaMenuOpen, setSelezionaMenuOpen] = useState(false);
  const sortRef = useRef();
  const selezionaRef = useRef();

  const user = session?.user;

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status === "authenticated" && user?.id) {
      fetch(`/api/scadenze?userId=${user.id}`)
        .then(res => res.json())
        .then(data => setScadenze(Array.isArray(data) ? data : []))
        .catch(err => console.error("Errore nel caricamento:", err));
    }
  }, [status, user?.id, router]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortMenuOpen(false);
      if (selezionaRef.current && !selezionaRef.current.contains(e.target)) setSelezionaMenuOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleSelezione = (id) => {
    setSelezionate(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const toggleSelezionaTutti = () => {
    if (selezionate.length === scadenze.length) {
      setSelezionate([]);
    } else {
      setSelezionate(scadenze.map(s => s.id));
    }
    setSelezionaMenuOpen(false);
  };

  const togglePin = (id) => {
    setPinned(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const eliminaSelezionati = async () => {
    if (!confirm("Confermi eliminazione?")) return;
    await Promise.all(
      selezionate.map(id => fetch(`/api/scadenze?id=${id}`, { method: "DELETE" }))
    );
    setScadenze(scadenze.filter(s => !selezionate.includes(s.id)));
    setSelezionate([]);
  };

  const filteredAndSorted = [...scadenze]
    .filter(s =>
      s.tipo.toLowerCase().includes(filtri.tipo.toLowerCase()) &&
      s.descrizione.toLowerCase().includes(filtri.descrizione.toLowerCase()) &&
      (filtri.stato ? s.stato === filtri.stato : true)
    )
    .sort((a, b) => {
      if (!sortOption) return 0;
      const { campo, ordine } = sortOption;
      const valA = new Date(a[campo]).getTime();
      const valB = new Date(b[campo]).getTime();

      if (isNaN(valA) || isNaN(valB)) return 0;

      return ordine === "asc" ? valA - valB : valB - valA;
    });

  const pinnedItems = filteredAndSorted.filter(s => pinned.includes(s.id));
  const unpinnedItems = filteredAndSorted.filter(s => !pinned.includes(s.id));

  return (
    <div className={styles.page}>
    <div className={styles.container}>
      <h1 className={styles.heading}>Le tue scadenze</h1>
      <button onClick={() => router.push("/dashboard")} className={styles.backButton}>← Torna alla Dashboard</button>

      <div className={styles.filtri}>
        <input type="text" placeholder="Filtra per tipo" value={filtri.tipo} onChange={e => setFiltri({ ...filtri, tipo: e.target.value })} />
        <input type="text" placeholder="Filtra per descrizione" value={filtri.descrizione} onChange={e => setFiltri({ ...filtri, descrizione: e.target.value })} />
        <select value={filtri.stato} onChange={e => setFiltri({ ...filtri, stato: e.target.value })}>
          <option value="">Tutti</option>
          <option value="attiva">Attiva</option>
          <option value="non attiva">Non attiva</option>
        </select>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.dropdown} ref={selezionaRef}>
          <button title="Seleziona tutte" className={styles.iconButton} onClick={() => setSelezionaMenuOpen(prev => !prev)}>
            <input type="checkbox" checked={selezionate.length === scadenze.length} readOnly />
            <ArrowDropDownIcon />
          </button>
          {selezionaMenuOpen && (
            <div className={styles.dropdownMenu}>
              <div onClick={toggleSelezionaTutti}>Tutti</div>
            </div>
          )}
        </div>
        <button onClick={eliminaSelezionati} className={styles.iconButton}><DeleteIcon /></button>
        <button onClick={() => selezionate.forEach(togglePin)} className={styles.iconButton}><PushPinIcon /></button>
        <div className={styles.dropdown} ref={sortRef}>
          <button onClick={() => setSortMenuOpen(!sortMenuOpen)} className={styles.iconButton}>Ordina per <ArrowDropDownIcon /></button>
          {sortMenuOpen && (
            <div className={styles.dropdownMenu}>
              <div onClick={() => setSortOption({ campo: "data_scadenza", ordine: "asc" })}>Data scadenza ↑</div>
              <div onClick={() => setSortOption({ campo: "data_scadenza", ordine: "desc" })}>Data scadenza ↓</div>
              <div onClick={() => setSortOption({ campo: "data_creazione", ordine: "asc" })}>Data inserimento ↑</div>
              <div onClick={() => setSortOption({ campo: "data_creazione", ordine: "desc" })}>Data inserimento ↓</div>
            </div>
          )}
        </div>
      </div>

      <ul className={styles.list}>
        {[...pinnedItems, ...unpinnedItems].map((s) => (
          <li key={s.id} className={`${styles.item} ${pinned.includes(s.id) ? styles.pinned : ""}`}>
            <input type="checkbox" checked={selezionate.includes(s.id)} onChange={() => toggleSelezione(s.id)} />
            <div className={styles.content} onClick={() => router.push(`/scadenza/${s.id}`)}>
              <strong>{s.tipo}</strong> – {s.descrizione}<br />
              <span>{new Date(s.data_scadenza).toLocaleDateString("it-IT")}</span>
              <span className={`${styles.stato} ${s.stato === "attiva" ? styles.attiva : styles.nonAttiva}`}>{s.stato}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
    </div>
  );
}