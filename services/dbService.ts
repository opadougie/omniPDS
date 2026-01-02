
import { 
  SocialPost, Transaction, ProjectTask, WalletBalance, Note, 
  Contact, Asset, HealthMetric, WorkflowRule, Message 
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
      notifyLog("Ledger Mounted: FTS5 Indexed.");
    } else {
      throw new Error("Local only");
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
  // Fix: Added missing tables to support contacts, assets, messages, and workflows
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, author TEXT, text TEXT, likes INTEGER, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, amount REAL, currency TEXT, category TEXT, type TEXT, date TEXT, description TEXT);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, status TEXT, priority TEXT);
    CREATE TABLE IF NOT EXISTS balances (currency TEXT PRIMARY KEY, amount REAL, symbol TEXT);
    CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, tags TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS health (id TEXT PRIMARY KEY, date TEXT, type TEXT, value REAL, unit TEXT);
    CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT, handle TEXT, category TEXT, lastContacted TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, serial TEXT, value REAL, category TEXT, location TEXT, purchaseDate TEXT);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender TEXT, receiver TEXT, text TEXT, timestamp TEXT, encrypted INTEGER);
    CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY, name TEXT, triggerType TEXT, condition TEXT, action TEXT, active INTEGER);
  `);
  db.run("INSERT OR IGNORE INTO balances VALUES ('USD', 5000.0, '$')");
  persist();
};

const ensureFTSTables = () => {
  try {
    db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS fts_ledger USING fts5(id UNINDEXED, content, type UNINDEXED);`);
  } catch (e) {}
};

const updateIndex = (id: string, content: string, type: string) => {
  try { db.run("INSERT OR REPLACE INTO fts_ledger(id, content, type) VALUES (?, ?, ?)", [id, content, type]); } catch(e) {}
};

const persist = async () => {
  if (!db) return;
  const binary = db.export();
  localStorage.setItem('omnipds_sqlite', JSON.stringify(Array.from(binary)));
  fetch('/api/pds/persist', { method: 'POST', body: binary });
};

const queryAll = <T>(sql: string, params: any[] = []): T[] => {
  if (!db) return [];
  const res = db.exec(sql, params);
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as T;
  });
};

export const getPosts = () => queryAll<SocialPost>("SELECT * FROM posts ORDER BY createdAt DESC");
export const addPost = (p: SocialPost) => { 
  db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]); 
  updateIndex(p.id, p.text, 'SOCIAL');
  persist(); 
};

export const getTransactions = () => queryAll<Transaction>("SELECT * FROM transactions ORDER BY date DESC");
export const addTransaction = (t: Transaction) => {
  db.run("INSERT INTO transactions VALUES (?,?,?,?,?,?,?)", [t.id, t.amount, t.currency, t.category, t.type, t.date, t.description]);
  updateIndex(t.id, t.description, 'FINANCE');
  persist();
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
  try { return { success: true, data: db.exec(sql) }; }
  catch (e) { return { success: false, error: e.message }; }
};

export const getBalances = () => queryAll<WalletBalance>("SELECT * FROM balances");
export const getTasks = () => queryAll<ProjectTask>("SELECT * FROM tasks");
export const addTask = (t: ProjectTask) => { db.run("INSERT INTO tasks VALUES (?,?,?,?)", [t.id, t.title, t.status, t.priority]); persist(); };
export const updateTaskStatus = (id: string, s: string) => { db.run("UPDATE tasks SET status = ? WHERE id = ?", [s, id]); persist(); };
export const getNotes = () => queryAll<Note>("SELECT * FROM notes");
export const addNote = (n: Note) => { db.run("INSERT INTO notes VALUES (?,?,?,?,?)", [n.id, n.title, n.content, n.tags, n.updatedAt]); updateIndex(n.id, n.title + " " + n.content, 'VAULT'); persist(); };
export const getHealthMetrics = () => queryAll<HealthMetric>("SELECT * FROM health");
export const addHealthMetric = (h: HealthMetric) => { db.run("INSERT INTO health VALUES (?,?,?,?,?)", [h.id, h.date, h.type, h.value, h.unit]); persist(); };
export const getUnifiedFeed = () => {
  const p = queryAll<any>("SELECT 'SOCIAL' as type, createdAt as date, text as title FROM posts LIMIT 5");
  const t = queryAll<any>("SELECT 'FINANCE' as type, date, description as title FROM transactions LIMIT 5");
  return [...p, ...t].sort((a,b) => b.date.localeCompare(a.date));
};
// Fix: Fixed division precedence in getDBSize
export const getDBSize = () => ((localStorage.getItem('omnipds_sqlite')?.length || 0) / 1024).toFixed(1) + " KB";
export const getTableRowCount = (t: string) => { try { return db.exec(`SELECT COUNT(*) FROM ${t}`)[0].values[0][0]; } catch(e) {return 0;} };

// Fix: Implemented getAssets to fix existence error in App.tsx
export const getAssets = () => queryAll<Asset>("SELECT * FROM assets");

// Fix: Implemented addAsset to fix existence error in App.tsx
export const addAsset = (a: Asset) => {
  db.run("INSERT INTO assets VALUES (?,?,?,?,?,?,?)", [a.id, a.name, a.serial, a.value, a.category, a.location, a.purchaseDate]);
  persist();
};

// Fix: Implemented addContact to fix existence error in App.tsx
export const addContact = (c: Contact) => {
  db.run("INSERT INTO contacts VALUES (?,?,?,?,?,?)", [c.id, c.name, c.handle, c.category, c.lastContacted, c.notes]);
  persist();
};

// Fix: Implemented getMessages to fix existence error in CommsModule.tsx
export const getMessages = () => queryAll<Message>("SELECT * FROM messages ORDER BY timestamp DESC");

// Fix: Implemented addMessage to fix existence error in CommsModule.tsx
export const addMessage = (m: Message) => {
  db.run("INSERT INTO messages VALUES (?,?,?,?,?,?)", [m.id, m.sender, m.receiver, m.text, m.timestamp, m.encrypted ? 1 : 0]);
  persist();
};

export const getCredentials = () => [];
export const getMedia = () => [];

// Fix: Implemented getContacts to return actual data from ledger
export const getContacts = () => queryAll<Contact>("SELECT * FROM contacts");

// Fix: Implemented getWorkflowRules to return actual data from ledger
export const getWorkflowRules = () => queryAll<WorkflowRule>("SELECT * FROM workflows");
