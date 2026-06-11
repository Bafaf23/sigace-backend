import { createPool } from "mysql2/promise";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(
  join(__dirname, "../src/sql/migrations/001_create_lapses.sql"),
  "utf8",
);

const pool = await createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "sigace_db",
  port: 3306,
  multipleStatements: true,
});

try {
  await pool.query(sql);
  const [tables] = await pool.query("SHOW TABLES LIKE 'lapses'");
  console.log(tables.length ? "Tabla lapses creada o ya existía." : "Error: tabla no encontrada.");
} finally {
  await pool.end();
}
