
import { SocialPost, Transaction, ProjectTask, WalletBalance, Note, Contact, Asset } from '../types';

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
      
      // Check for SQLite header: 'SQLite format 3'
      const header = String.fromCharCode(...u8.slice(0, 15));
      if (header.includes("SQLite format 3")) {
        db = new SQL.Database(u8);
        console.log("[OmniPDS] Sovereign Ledger synchronized from Relay.");
      } else {
        throw new Error("Remote file is not a valid SQLite database.");
      }
    } else {
      throw new Error(`Relay response: ${response.status}`);
    }
  } catch (e) {
    console.warn("[OmniPDS] Remote load failed or fresh install. Falling back to local cache/memory.", e);
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
    CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, amount REAL, currency TEXT, category TEXT, type TEXT, date TEXT, description TEXT, recipient TEXT);
    CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, status TEXT, priority TEXT);
    CREATE TABLE IF NOT EXISTS balances (currency TEXT PRIMARY KEY, amount REAL, label TEXT, symbol TEXT);
    CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, tags TEXT, updatedAt TEXT);
    CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT, handle TEXT, category TEXT, lastContacted TEXT, notes TEXT);
    CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, serial TEXT, value REAL, category TEXT, location TEXT, purchaseDate TEXT);
  `);

  db.run("INSERT OR IGNORE INTO balances VALUES ('USD', 8450.20, 'US Dollar', '$')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('EUR', 3210.55, 'Euro', '€')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('BTC', 0.045, 'Bitcoin', '₿')");
  persist();
};

const persist = async () => {
  if (!db) return;
  const binary = db.export();
  // Backup to localStorage for high availability
  localStorage.setItem('omnipds_sqlite', JSON.stringify(Array.from(binary)));
  try {
    await fetch('/api/pds/persist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: binary
    });
  } catch (e) {
    console.error("[OmniPDS] Persist to Relay failed, saved to LocalStorage only.");
  }
};

export const universalSearch = (term: string) => {
  if (!db || !term || term.length < 2) return [];
  const results: any[] = [];
  const query = `%${term}%`;

  const tables = [
    { name: 'notes', col: 'title', type: 'VAULT' },
    { name: 'posts', col: 'text', type: 'SOCIAL' },
    { name: 'contacts', col: 'name', type: 'PULSE' },
    { name: 'assets', col: 'name', type: 'INVENTORY' },
    { name: 'transactions', col: 'description', type: 'FINANCE' }
  ];

  tables.forEach(t => {
    try {
      const res = db.exec(`SELECT * FROM ${t.name} WHERE ${t.col} LIKE ?`, [query]);
      if (res.length) {
        const columns = res[0].columns;
        res[0].values.forEach((row: any) => {
          const obj: any = { _type: t.type };
          columns.forEach((col: string, i: number) => obj[col] = row[i]);
          results.push(obj);
        });
      }
    } catch (e) {}
  });

  return results;
};

export const getDBSize = () => {
  const data = localStorage.getItem('omnipds_sqlite');
  return data ? (data.length / 1024).toFixed(2) + " KB" : "0 KB";
};

export const getTableRowCount = (table: string): number => {
  if (!db) return 0;
  try {
    const res = db.exec(`SELECT COUNT(*) FROM ${table}`);
    return res[0].values[0][0];
  } catch (e) { return 0; }
};

// ASSETS
export const getAssets = (): Asset[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM assets ORDER BY purchaseDate DESC");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as Asset;
  });
};

export const addAsset = (asset: Asset) => {
  db.run("INSERT INTO assets (id, name, serial, value, category, location, purchaseDate) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [asset.id, asset.name, asset.serial, asset.value, asset.category, asset.location, asset.purchaseDate]);
  persist();
};

// NOTES
export const getNotes = (): Note[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM notes ORDER BY updatedAt DESC");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as Note;
  });
};

export const addNote = (note: Note) => {
  db.run("INSERT INTO notes (id, title, content, tags, updatedAt) VALUES (?, ?, ?, ?, ?)",
    [note.id, note.title, note.content, note.tags, note.updatedAt]);
  persist();
};

// CONTACTS
export const getContacts = (): Contact[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM contacts ORDER BY lastContacted DESC");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as Contact;
  });
};

export const addContact = (contact: Contact) => {
  db.run("INSERT INTO contacts (id, name, handle, category, lastContacted, notes) VALUES (?, ?, ?, ?, ?, ?)",
    [contact.id, contact.name, contact.handle, contact.category, contact.lastContacted, contact.notes]);
  persist();
};

// SOCIAL
export const getPosts = (): SocialPost[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM posts ORDER BY createdAt DESC");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as SocialPost;
  });
};

export const addPost = (post: SocialPost) => {
  db.run("INSERT INTO posts (id, author, text, likes, createdAt) VALUES (?, ?, ?, ?, ?)", 
    [post.id, post.author, post.text, post.likes, post.createdAt]);
  persist();
};

// FINANCE
export const getTransactions = (): Transaction[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM transactions ORDER BY date DESC");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as Transaction;
  });
};

export const addTransaction = (t: Transaction) => {
  db.run("INSERT INTO transactions (id, amount, currency, category, type, date, description, recipient) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    [t.id, t.amount, t.currency, t.category, t.type, t.date, t.description, t.recipient || null]);
  db.run("UPDATE balances SET amount = amount " + (t.type === 'income' ? '+' : '-') + " ? WHERE currency = ?", [t.amount, t.currency]);
  persist();
};

export const getBalances = (): WalletBalance[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM balances");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as WalletBalance;
  });
};

// PROJECTS
export const getTasks = (): ProjectTask[] => {
  if (!db) return [];
  const res = db.exec("SELECT * FROM tasks");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as ProjectTask;
  });
};

export const addTask = (task: ProjectTask) => {
  db.run("INSERT INTO tasks (id, title, status, priority) VALUES (?, ?, ?, ?)", [task.id, task.title, task.status, task.priority]);
  persist();
};

export const updateTaskStatus = (id: string, status: string) => {
  db.run("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);
  persist();
};

export const executeRawSQL = (query: string) => {
  if (!db) return { success: false, error: "Database not initialized" };
  try {
    const res = db.exec(query);
    persist();
    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
