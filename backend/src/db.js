import { Sequelize } from "sequelize";
import { config } from "./config.js";

// Use Postgres if DB_HOST is provided and not localhost, otherwise fallback to SQLite
const useSqlite = process.env.NODE_ENV === 'production' ? false : (process.env.DB_TYPE === 'sqlite' || !process.env.DB_HOST || process.env.DB_HOST === 'localhost');

console.log(`Database Mode: ${useSqlite ? 'SQLite' : 'Postgres'}`);
if (!useSqlite) {
  console.log(`Connecting to Postgres at ${config.db.host}:${config.db.port}`);
}

export const sequelize = useSqlite
  ? new Sequelize({
      dialect: "sqlite",
      storage: "./database.sqlite",
      logging: false
    })
  : new Sequelize(
      config.db.database,
      config.db.username,
      config.db.password,
      {
        host: config.db.host,
        port: config.db.port,
        dialect: "postgres",
        logging: false,
        retry: {
          max: 5
        }
      }
    );

