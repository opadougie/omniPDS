
import { SocialPost, Transaction, ProjectTask, WalletBalance } from '../types';

let db: any = null;

const SQL_WASM_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm';

export const initDB = async () => {
  if (db) return db;

  // @ts-ignore
  const SQL = await window.initSqlJs({
    locateFile: () => SQL_WASM_PATH
  });

  const savedData = localStorage.getItem('omnipds_sqlite');
  if (savedData) {
    try {
      const u8 = new Uint8Array(JSON.parse(savedData));
      db = new SQL.Database(u8);
    } catch (e) {
      console.error("Failed to load existing DB, creating fresh.", e);
      db = new SQL.Database();
      createSchema();
    }
  } else {
    db = new SQL.Database();
    createSchema();
  }
  return db;
};

const createSchema = () => {
  db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author TEXT,
      text TEXT,
      likes INTEGER,
      createdAt TEXT
    );
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      amount REAL,
      currency TEXT,
      category TEXT,
      type TEXT,
      date TEXT,
      description TEXT,
      recipient TEXT
    );
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT,
      status TEXT,
      priority TEXT
    );
    CREATE TABLE IF NOT EXISTS balances (
      currency TEXT PRIMARY KEY,
      amount REAL,
      label TEXT,
      symbol TEXT
    );
  `);

  // Seed initial data
  db.run("INSERT OR IGNORE INTO balances VALUES ('USD', 8450.20, 'US Dollar', '$')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('EUR', 3210.55, 'Euro', '€')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('GBP', 1100.00, 'British Pound', '£')");
  db.run("INSERT OR IGNORE INTO balances VALUES ('BTC', 0.045, 'Bitcoin', '₿')");
  persist();
};

const persist = () => {
  if (!db) return;
  const binary = db.export();
  localStorage.setItem('omnipds_sqlite', JSON.stringify(Array.from(binary)));
};

export const getDBSize = () => {
  const data = localStorage.getItem('omnipds_sqlite');
  return data ? (data.length / 1024).toFixed(2) + " KB" : "0 KB";
};

export const getTableRowCount = (table: string): number => {
  try {
    const res = db.exec(`SELECT COUNT(*) FROM ${table}`);
    return res[0].values[0][0];
  } catch (e) {
    return 0;
  }
};

export const getPosts = (): SocialPost[] => {
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

export const getTransactions = (): Transaction[] => {
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
  
  db.run("UPDATE balances SET amount = amount " + (t.type === 'income' ? '+' : '-') + " ? WHERE currency = ?", 
    [t.amount, t.currency]);
  
  persist();
};

export const getBalances = (): WalletBalance[] => {
  const res = db.exec("SELECT * FROM balances");
  if (!res.length) return [];
  const columns = res[0].columns;
  return res[0].values.map((row: any) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => obj[col] = row[i]);
    return obj as WalletBalance;
  });
};

export const getTasks = (): ProjectTask[] => {
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
  db.run("INSERT INTO tasks (id, title, status, priority) VALUES (?, ?, ?, ?)",
    [task.id, task.title, task.status, task.priority]);
  persist();
};

export const updateTaskStatus = (id: string, status: string) => {
  db.run("UPDATE tasks SET status = ? WHERE id = ?", [status, id]);
  persist();
};

export const executeRawSQL = (query: string) => {
  try {
    const res = db.exec(query);
    persist();
    return { success: true, data: res };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
