import "dotenv/config";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "../generated/client/index.js";

const adapter = new PrismaMariaDb({
  host: process.env.DB_SERVER ?? "localhost",
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? "root",
  password: process.env.DB_PASSWORD ?? "",
  database: process.env.DB_DATABASE ?? "sigace_db",
  connectionLimit: 5,
  dateStrings: true,
});

export const prisma = new PrismaClient({ adapter });
