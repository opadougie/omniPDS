
import { 
  SocialPost, Transaction, ProjectTask, WalletBalance, Note, 
  Contact, Asset, HealthMetric, WorkflowRule, Message, Credential, MediaAsset 
} from '../types';

let db: any = null;
const SQL_WASM_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm';

let logListeners: ((log: string) => void)[] = [];
export const onLog = (cb: (log: string) => void) => logListeners.push(cb);
const notifyLog = (msg: string) => logListeners.forEach(cb => cb(`[${new Date().toLocaleTimeString()}] ${msg}`));

export const initDB = async () => {
  if (db) return db;
  const initSqlJs = (window as any).initSqlJs;
  const SQL = await initSqlJs({ locateFile: () => SQL_WASM_PATH });

  try {
    const response = await fetch('/api/pds/load');
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      db = new SQL.Database(new Uint8Array(arrayBuffer));
      notifyLog("Sovereign Ledger Synced: FTS5 Ready.");
    } else {
      throw new Error("No remote ledger.");
    }
  } catch (e) {
    const savedData = localStorage.getItem('omnipds_sqlite');
    db = savedData ? new SQL.Database(new Uint8Array(JSON.parse(savedData))) : new SQL.Database();
    if (!savedData) createSchema();
  }
  
  ensureFTSTables();
  return db;
};

const createSchema = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, author TEXT, text TEXT, likes INTEGER, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, amount REAL, currency TEXT, category TEXT, type TEXT, date TEXT, description TEXT, recipient TEXT);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, status TEXT, priority TEXT);
    CREATE TABLE IF NOT EXISTS balances (currency TEXT PRIMARY KEY, amount REAL, symbol TEXT, label TEXT);
    CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, tags TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS health (id TEXT PRIMARY KEY, date TEXT, type TEXT, value REAL, unit TEXT);
    CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT, handle TEXT, category TEXT, lastContacted TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, serial TEXT, value REAL, category TEXT, location TEXT, purchaseDate TEXT);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender TEXT, receiver TEXT, text TEXT, timestamp TEXT, encrypted INTEGER);
    CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY, name TEXT, triggerType TEXT, condition TEXT, action TEXT, active INTEGER);
    CREATE TABLE IF NOT EXISTS credentials (id TEXT PRIMARY KEY, type TEXT, issuer TEXT, data TEXT, issuedAt TEXT);
    CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, name TEXT, mimeType TEXT, size INTEGER, cid TEXT, addedAt TEXT);
  `);
  
  db.run("INSERT OR IGNORE INTO balances VALUES ('USD', 12760.75, '$', 'Primary US Dollar')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('BTC', 0.12, '₿', 'Sovereign Bitcoin')");
  
  persist();
};

const ensureFTSTables = () => {
  try {
    db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS fts_ledger USING fts5(id UNINDEXED, content, type UNINDEXED);`);
  } catch (e) {}
};

/**
 * Universal Sync to FTS5 Search Table
 */
const syncToIndex = (id: string, content: string, type: string) => {
  try { 
    db.run("INSERT OR REPLACE INTO fts_ledger(id, content, type) VALUES (?, ?, ?)", [id, content, type]); 
  } catch(e) {
    console.error("Indexing failed:", e);
  }
};

const persist = async () => {
  if (!db) return;
  const binary = db.export();
  localStorage.setItem('omnipds_sqlite', JSON.stringify(Array.from(binary)));
  fetch('/api/pds/persist', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/octet-stream' },
    body: binary 
  });
};

const queryAll = <T>(sql: string, params: any[] = []): T[] => {
  if (!db) return [];
  try {
    const res = db.exec(sql, params);
    if (!res.length) return [];
    const columns = res[0].columns;
    return res[0].values.map((row: any) => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => obj[col] = row[i]);
      return obj as T;
    });
  } catch (e) {
    console.error("Query Error:", e);
    return [];
  }
};

export const getPosts = () => queryAll<SocialPost>("SELECT * FROM posts ORDER BY createdAt DESC");
export const addPost = (p: SocialPost) => { 
  db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]); 
  syncToIndex(p.id, p.text, 'SOCIAL');
  persist(); 
};

export const getTransactions = () => queryAll<Transaction>("SELECT * FROM transactions ORDER BY date DESC");
export const addTransaction = (t: Transaction) => {
  db.run("INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?)", [t.id, t.amount, t.currency, t.category, t.type, t.date, t.description, t.recipient || '']);
  db.run("UPDATE balances SET amount = amount " + (t.type === 'income' ? '+' : '-') + " ? WHERE currency = ?", [t.amount, t.currency]);
  syncToIndex(t.id, t.description + " " + t.category, 'FINANCE');
  persist();
};

export const getBalances = () => queryAll<WalletBalance>("SELECT * FROM balances");
export const getTasks = () => queryAll<ProjectTask>("SELECT * FROM tasks");
export const addTask = (t: ProjectTask) => { 
  db.run("INSERT INTO tasks VALUES (?,?,?,?)", [t.id, t.title, t.status, t.priority]); 
  syncToIndex(t.id, t.title, 'PROJECTS');
  persist(); 
};
export const updateTaskStatus = (id: string, s: string) => { db.run("UPDATE tasks SET status = ? WHERE id = ?", [s, id]); persist(); };
export const getNotes = () => queryAll<Note>("SELECT * FROM notes ORDER BY updatedAt DESC");
export const addNote = (n: Note) => { 
  db.run("INSERT INTO notes VALUES (?,?,?,?,?)", [n.id, n.title, n.content, n.tags, n.updatedAt]); 
  syncToIndex(n.id, n.title + " " + n.content, 'VAULT'); 
  persist(); 
};
export const getHealthMetrics = () => queryAll<HealthMetric>("SELECT * FROM health ORDER BY date DESC");
export const addHealthMetric = (h: HealthMetric) => { 
  db.run("INSERT INTO health VALUES (?,?,?,?,?)", [h.id, h.date, h.type, h.value, h.unit]); 
  syncToIndex(h.id, `${h.type}: ${h.value}${h.unit}`, 'HEALTH');
  persist(); 
};
export const getContacts = () => queryAll<Contact>("SELECT * FROM contacts ORDER BY name ASC");
export const addContact = (c: Contact) => { 
  db.run("INSERT INTO contacts VALUES (?,?,?,?,?,?)", [c.id, c.name, c.handle, c.category, c.lastContacted, c.notes]); 
  syncToIndex(c.id, `${c.name} ${c.handle || ''} ${c.notes || ''}`, 'PULSE');
  persist(); 
};
export const getAssets = () => queryAll<Asset>("SELECT * FROM assets ORDER BY purchaseDate DESC");
export const addAsset = (a: Asset) => { 
  db.run("INSERT INTO assets VALUES (?,?,?,?,?,?,?)", [a.id, a.name, a.serial, a.value, a.category, a.location, a.purchaseDate]); 
  syncToIndex(a.id, `${a.name} ${a.serial || ''} at ${a.location}`, 'INVENTORY');
  persist(); 
};
export const getMessages = () => queryAll<Message>("SELECT * FROM messages ORDER BY timestamp DESC");
export const addMessage = (m: Message) => {
  db.run("INSERT INTO messages VALUES (?,?,?,?,?,?)", [m.id, m.sender, m.receiver, m.text, m.timestamp, m.encrypted ? 1 : 0]);
  syncToIndex(m.id, m.text, 'COMMS');
  persist();
};
export const getCredentials = () => queryAll<Credential>("SELECT * FROM credentials ORDER BY issuedAt DESC");
export const getMedia = () => queryAll<MediaAsset>("SELECT * FROM media ORDER BY addedAt DESC");
export const getWorkflowRules = () => queryAll<WorkflowRule>("SELECT * FROM workflows");

export const getUnifiedFeed = () => {
  const p = queryAll<any>("SELECT 'SOCIAL' as type, createdAt as date, text as title, author as subtitle FROM posts ORDER BY createdAt DESC LIMIT 10");
  const t = queryAll<any>("SELECT 'FINANCE' as type, date, description as title, amount || ' ' || currency as subtitle FROM transactions ORDER BY date DESC LIMIT 10");
  const m = queryAll<any>("SELECT 'COMMS' as type, timestamp as date, text as title, sender as subtitle FROM messages ORDER BY timestamp DESC LIMIT 5");
  return [...p, ...t, ...m].sort((a,b) => b.date.localeCompare(a.date));
};

export const universalSearch = (term: string) => {
  if (!term.trim()) return [];
  try {
    const res = db.exec(`SELECT id, content, type FROM fts_ledger WHERE fts_ledger MATCH ? ORDER BY rank`, [`${term}*`]);
    if (!res.length) return [];
    return res[0].values.map((row: any) => ({ id: row[0], title: row[1], _type: row[2] }));
  } catch (e) { return []; }
};

export const executeRawSQL = (sql: string) => {
  try { 
    const res = db.exec(sql); 
    persist();
    return { success: true, data: res }; 
  }
  catch (e) { return { success: false, error: e.message }; }
};

export const getDBSize = () => {
    try {
        const bytes = db.export().length;
        if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
        return (bytes / 1024).toFixed(1) + " KB";
    } catch(e) { return "0 KB"; }
};

export const getTableRowCount = (t: string) => { 
  try { return db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0]; } 
  catch(e) {return 0;} 
};
