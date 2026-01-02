
import { SocialPost, Transaction, ProjectTask, WalletBalance, Note, Contact, Asset, HealthMetric, WorkflowRule } from '../types';

let db: any = null;
const SQL_WASM_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm';

export const initDB = async () => {
  if (db) return db;

  // @ts-ignore
  const SQL = await window.initSqlJs({
    locateFile: () => SQL_WASM_PATH
  });

  try {
    const response = await fetch('/api/pds/load');
    if (response.ok) {
      const arrayBuffer = await response.arrayBuffer();
      const u8 = new Uint8Array(arrayBuffer);
      const header = String.fromCharCode(...u8.slice(0, 15));
      if (header.includes("SQLite format 3")) {
        db = new SQL.Database(u8);
        console.log("[OmniPDS] Sovereign Ledger synchronized.");
      } else {
        throw new Error("Invalid header.");
      }
    } else {
      throw new Error(`Status: ${response.status}`);
    }
  } catch (e) {
    console.warn("[OmniPDS] Local Fallback Active.", e);
    const savedData = localStorage.getItem('omnipds_sqlite');
    if (savedData) {
      try {
        const u8 = new Uint8Array(JSON.parse(savedData));
        db = new SQL.Database(u8);
      } catch (innerE) {
        db = new SQL.Database();
        createSchema();
      }
    } else {
      db = new SQL.Database();
      createSchema();
    }
  }
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

    -- FTS Global Search Index (Simulated if FTS5 is unavailable, but used as search pool)
    CREATE TABLE IF NOT EXISTS fts_global (id TEXT, table_name TEXT, content TEXT);
  `);

  // Default Balances
  db.run("INSERT OR IGNORE INTO balances VALUES ('USD', 12450.00, 'US Dollar', '$')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('BTC', 0.12, 'Bitcoin', '₿')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('ETH', 2.4, 'Ethereum', 'Ξ')");
  
  persist();
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

// RELATIONAL DATA FETCHING
export const getHealthMetrics = (): HealthMetric[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM health ORDER BY date DESC LIMIT 100");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as HealthMetric;
  });
};

export const addHealthMetric = (m: HealthMetric) => {
  db.run("INSERT INTO health (id, date, type, value, unit) VALUES (?, ?, ?, ?, ?)", [m.id, m.date, m.type, m.value, m.unit]);
  persist();
};

export const getWorkflowRules = (): WorkflowRule[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM workflows");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return { ...obj, active: !!obj.active } as WorkflowRule;
  });
};

export const getUnifiedFeed = () => {
  if (!db) return [];
  const results: any[] = [];
  try {
    const posts = db.exec("SELECT 'SOCIAL' as type, createdAt as date, text as title, author as subtitle FROM posts ORDER BY createdAt DESC LIMIT 10");
    const txs = db.exec("SELECT 'FINANCE' as type, date, description as title, amount || ' ' || currency as subtitle FROM transactions ORDER BY date DESC LIMIT 10");
    const tasks = db.exec("SELECT 'PROJECT' as type, title as title, status as subtitle, id as date FROM tasks LIMIT 10");

    [posts, txs, tasks].forEach(res => {
      if (res.length) {
        res[0].values.forEach((row: any) => {
          results.push({ type: row[0], date: row[1], title: row[2], subtitle: row[3] });
        });
      }
    });
  } catch (e) {}
  return results.sort((a,b) => b.date.localeCompare(a.date));
};

// RE-EXPORTING EXISTING SERVICES WITH PERSISTENCE ENFORCEMENT
export const universalSearch = (term: string) => {
  if (!db || !term) return [];
  const query = `%${term}%`;
  const results: any[] = [];
  const tables = [
    { name: 'notes', col: 'content', type: 'VAULT' },
    { name: 'posts', col: 'text', type: 'SOCIAL' },
    { name: 'transactions', col: 'description', type: 'FINANCE' },
    { name: 'health', col: 'type', type: 'HEALTH' }
  ];
  tables.forEach(t => {
    try {
      const res = db.exec(`SELECT * FROM ${t.name} WHERE ${t.col} LIKE ?`, [query]);
      if (res.length) {
        res[0].values.forEach((row: any) => {
          const obj: any = { _type: t.type };
          res[0].columns.forEach((col: string, i: number) => obj[col] = row[i]);
          results.push(obj);
        });
      }
    } catch (e) {}
  });
  return results;
};

// PASSTHROUGHS
export const getPosts = () => { if(!db) return []; const r = db.exec("SELECT * FROM posts ORDER BY createdAt DESC"); return r.length ? r[0].values.map((v:any) => { const o:any={}; r[0].columns.forEach((c:any,i:any)=>o[c]=v[i]); return o;}) : []; };
export const getTransactions = () => { if(!db) return []; const r = db.exec("SELECT * FROM transactions ORDER BY date DESC"); return r.length ? r[0].values.map((v:any) => { const o:any={}; r[0].columns.forEach((c:any,i:any)=>o[c]=v[i]); return o;}) : []; };
export const getBalances = () => { if(!db) return []; const r = db.exec("SELECT * FROM balances"); return r.length ? r[0].values.map((v:any) => { const o:any={}; r[0].columns.forEach((c:any,i:any)=>o[c]=v[i]); return o;}) : []; };
export const getTasks = () => { if(!db) return []; const r = db.exec("SELECT * FROM tasks"); return r.length ? r[0].values.map((v:any) => { const o:any={}; r[0].columns.forEach((c:any,i:any)=>o[c]=v[i]); return o;}) : []; };
export const getNotes = () => { if(!db) return []; const r = db.exec("SELECT * FROM notes ORDER BY updatedAt DESC"); return r.length ? r[0].values.map((v:any) => { const o:any={}; r[0].columns.forEach((c:any,i:any)=>o[c]=v[i]); return o;}) : []; };
export const getContacts = () => { if(!db) return []; const r = db.exec("SELECT * FROM contacts"); return r.length ? r[0].values.map((v:any) => { const o:any={}; r[0].columns.forEach((c:any,i:any)=>o[c]=v[i]); return o;}) : []; };
export const getAssets = () => { if(!db) return []; const r = db.exec("SELECT * FROM assets"); return r.length ? r[0].values.map((v:any) => { const o:any={}; r[0].columns.forEach((c:any,i:any)=>o[c]=v[i]); return o;}) : []; };

export const addPost = (p: SocialPost) => { db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]); persist(); };
export const addTransaction = (t: Transaction) => { 
  db.run("INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?,?)", [t.id, t.amount, t.currency, t.category, t.type, t.date, t.description, t.recipient, t.contactId]); 
  db.run("UPDATE balances SET amount = amount " + (t.type === 'income' ? '+' : '-') + " ? WHERE currency = ?", [t.amount, t.currency]);
  persist(); 
};
export const addTask = (t: ProjectTask) => { db.run("INSERT INTO tasks VALUES (?,?,?,?,?)", [t.id, t.title, t.status, t.priority, t.projectId]); persist(); };
export const updateTaskStatus = (id: string, s: string) => { db.run("UPDATE tasks SET status = ? WHERE id = ?", [s, id]); persist(); };
export const addNote = (n: Note) => { db.run("INSERT INTO notes VALUES (?,?,?,?,?)", [n.id, n.title, n.content, n.tags, n.updatedAt]); persist(); };
export const addContact = (c: Contact) => { db.run("INSERT INTO contacts VALUES (?,?,?,?,?,?)", [c.id, c.name, c.handle, c.category, c.lastContacted, c.notes]); persist(); };
export const addAsset = (a: Asset) => { db.run("INSERT INTO assets VALUES (?,?,?,?,?,?,?)", [a.id, a.name, a.serial, a.value, a.category, a.location, a.purchaseDate]); persist(); };

export const getDBSize = () => { const d = localStorage.getItem('omnipds_sqlite'); return d ? (d.length / 1024).toFixed(2) + " KB" : "0 KB"; };
export const getTableRowCount = (t: string) => { if(!db) return 0; try { const r = db.exec(`SELECT COUNT(*) FROM ${t}`); return r[0].values[0][0]; } catch(e){return 0;} };
export const executeRawSQL = (q: string) => { if(!db) return {success:false}; try { const r = db.exec(q); persist(); return {success:true, data:r}; } catch(e:any){return {success:false, error:e.message};} };
