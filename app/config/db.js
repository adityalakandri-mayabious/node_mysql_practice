import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const myPool = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DATABASE,
  waitForConnections: true,
  connectionLimit: 10,
});

export default myPool;
