
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
  if (!initSqlJs) {
    notifyLog("FATAL: SQL.js not found in global scope.");
    return null;
  }

  const SQL = await initSqlJs({
    locateFile: () => SQL_WASM_PATH
  });

  try {
    const response = await fetch('/api/pds/load');
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      db = new SQL.Database(new Uint8Array(arrayBuffer));
      notifyLog("Sovereign Ledger Synced: FTS5 Engine Online.");
    } else {
      throw new Error("Remote ledger empty.");
    }
  } catch (e) {
    const savedData = localStorage.getItem('omnipds_sqlite');
    if (savedData) {
      db = new SQL.Database(new Uint8Array(JSON.parse(savedData)));
    } else {
      db = new SQL.Database();
      createSchema();
    }
  }
  
  // Ensure FTS tables exist even on existing DBs
  ensureFTSTables();
  return db;
};

const createSchema = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, author TEXT, text TEXT, likes INTEGER, createdAt TEXT);
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, amount REAL, currency TEXT, category TEXT, type TEXT, date TEXT, description TEXT, recipient TEXT, contactId TEXT);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, status TEXT, priority TEXT, projectId TEXT);
    CREATE TABLE IF NOT EXISTS balances (currency TEXT PRIMARY KEY, amount REAL, label TEXT, symbol TEXT);
    CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, tags TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT, handle TEXT, category TEXT, lastContacted TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, serial TEXT, value REAL, category TEXT, location TEXT, purchaseDate TEXT);
    CREATE TABLE IF NOT EXISTS health (id TEXT PRIMARY KEY, date TEXT, type TEXT, value REAL, unit TEXT);
    CREATE TABLE IF NOT EXISTS workflows (id TEXT PRIMARY KEY, name TEXT, triggerType TEXT, condition TEXT, action TEXT, active INTEGER);
    CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, sender TEXT, receiver TEXT, text TEXT, timestamp TEXT, encrypted INTEGER);
    CREATE TABLE IF NOT EXISTS system_audit (id INTEGER PRIMARY KEY AUTOINCREMENT, event TEXT, timestamp TEXT);
  `);

  db.run("INSERT OR IGNORE INTO balances VALUES ('USD', 12450.00, 'US Dollar', '$')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('BTC', 0.12, 'Bitcoin', '₿')");
  
  persist();
};

const ensureFTSTables = () => {
  try {
    // Create FTS5 Virtual Table for universal search muscle
    db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS fts_index USING fts5(id UNINDEXED, content, type UNINDEXED);`);
  } catch (e) {
    console.warn("FTS5 initialization error:", e);
  }
};

const updateSearchIndex = (id: string, content: string, type: string) => {
  try {
    db.run("INSERT OR REPLACE INTO fts_index(id, content, type) VALUES (?, ?, ?)", [id, content, type]);
  } catch (e) {}
};

const persist = async () => {
  if (!db) return;
  const binary = db.export();
  localStorage.setItem('omnipds_sqlite', JSON.stringify(Array.from(binary)));
  try {
    await fetch('/api/pds/persist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: binary
    });
  } catch (e) {}
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

// Data Access Methods
export const getMessages = () => queryAll<Message>("SELECT * FROM messages ORDER BY timestamp DESC");
export const addMessage = (m: Message) => {
  db.run("INSERT INTO messages VALUES (?,?,?,?,?,?)", [m.id, m.sender, m.receiver, m.text, m.timestamp, m.encrypted ? 1 : 0]);
  updateSearchIndex(m.id, m.text, 'COMMS');
  persist();
};

export const getPosts = () => queryAll<SocialPost>("SELECT * FROM posts ORDER BY createdAt DESC");
export const addPost = (p: SocialPost) => { 
  db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]); 
  updateSearchIndex(p.id, p.text, 'SOCIAL');
  persist(); 
};

export const getTransactions = () => queryAll<Transaction>("SELECT * FROM transactions ORDER BY date DESC");
export const addTransaction = (t: Transaction) => { 
  db.run("INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?,?)", [t.id, t.amount, t.currency, t.category, t.type, t.date, t.description, t.recipient, t.contactId]); 
  db.run("UPDATE balances SET amount = amount " + (t.type === 'income' ? '+' : '-') + " ? WHERE currency = ?", [t.amount, t.currency]);
  updateSearchIndex(t.id, t.description, 'FINANCE');
  persist(); 
};

export const getNotes = () => queryAll<Note>("SELECT * FROM notes ORDER BY updatedAt DESC");
export const addNote = (n: Note) => { 
  db.run("INSERT INTO notes VALUES (?,?,?,?,?)", [n.id, n.title, n.content, n.tags, n.updatedAt]); 
  updateSearchIndex(n.id, n.content + " " + n.title, 'VAULT');
  persist(); 
};

export const getBalances = () => queryAll<WalletBalance>("SELECT * FROM balances");
export const getTasks = () => queryAll<ProjectTask>("SELECT * FROM tasks");
export const addTask = (t: ProjectTask) => { db.run("INSERT INTO tasks VALUES (?,?,?,?,?)", [t.id, t.title, t.status, t.priority, t.projectId]); persist(); };
export const updateTaskStatus = (id: string, s: string) => { db.run("UPDATE tasks SET status = ? WHERE id = ?", [s, id]); persist(); };
export const getContacts = () => queryAll<Contact>("SELECT * FROM contacts");
export const addContact = (c: Contact) => { db.run("INSERT INTO contacts VALUES (?,?,?,?,?,?)", [c.id, c.name, c.handle, c.category, c.lastContacted, c.notes]); persist(); };
export const getAssets = () => queryAll<Asset>("SELECT * FROM assets");
export const addAsset = (a: Asset) => { db.run("INSERT INTO assets VALUES (?,?,?,?,?,?,?)", [a.id, a.name, a.serial, a.value, a.category, a.location, a.purchaseDate]); persist(); };
export const getHealthMetrics = () => queryAll<HealthMetric>("SELECT * FROM health ORDER BY date DESC LIMIT 100");
export const addHealthMetric = (m: HealthMetric) => { db.run("INSERT INTO health VALUES (?,?,?,?,?)", [m.id, m.date, m.type, m.value, m.unit]); persist(); };
export const getWorkflowRules = () => queryAll<WorkflowRule>("SELECT * FROM workflows");

export const getUnifiedFeed = () => {
  const posts = queryAll<any>("SELECT 'SOCIAL' as type, createdAt as date, text as title, author as subtitle FROM posts ORDER BY createdAt DESC LIMIT 10");
  const txs = queryAll<any>("SELECT 'FINANCE' as type, date, description as title, amount || ' ' || currency as subtitle FROM transactions ORDER BY date DESC LIMIT 10");
  return [...posts, ...txs].sort((a,b) => b.date.localeCompare(a.date));
};

export const universalSearch = (term: string) => {
  if (!term.trim()) return [];
  // Muscular FTS5 Query
  try {
    const res = db.exec(`SELECT id, content, type FROM fts_index WHERE fts_index MATCH ? ORDER BY rank`, [`${term}*`]);
    if (!res.length) return [];
    return res[0].values.map((row: any) => ({
      id: row[0],
      title: row[1],
      _type: row[2]
    }));
  } catch (e) {
    // Fallback if FTS5 fails
    return [];
  }
};

export const getDBSize = () => { 
  const d = localStorage.getItem('omnipds_sqlite'); 
  return d ? (JSON.parse(d).length / 1024).toFixed(1) + " KB" : "0 KB"; 
};
export const getTableRowCount = (t: string) => { 
  if(!db) return 0; 
  try { 
    const r = db.exec(`SELECT COUNT(*) FROM ${t}`); 
    return r[0].values[0][0]; 
  } catch(e) { return 0; } 
};
export const executeRawSQL = (q: string) => { 
  if(!db) return {success:false}; 
  try { 
    const r = db.exec(q); 
    persist(); 
    return {success:true, data:r}; 
  } catch(e:any) { return {success:false, error:e.message}; } 
};
export const getCredentials = () => [];
export const getMedia = () => [];
