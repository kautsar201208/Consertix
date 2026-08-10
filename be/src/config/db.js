const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

const dbConfig = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

if (process.env.DB_SSL_MODE === "REQUIRED" || process.env.DB_SSL_CA) {
  const sslCaPath = process.env.DB_SSL_CA
    ? path.resolve(process.cwd(), process.env.DB_SSL_CA)
    : path.join(__dirname, "../../ca.pem");

  if (fs.existsSync(sslCaPath)) {
    dbConfig.ssl = {
      rejectUnauthorized: true,
      ca: fs.readFileSync(sslCaPath),
    };
  } else {
    dbConfig.ssl = {
      rejectUnauthorized: true,
    };
  }
}

const db = mysql.createConnection(dbConfig);

db.connect((err) => {
  if (err) {
    console.error("❌ Gagal terhubung ke database:", err.message);
    return;
  }

  console.log("✅ Database MySQL berhasil terhubung");
});

module.exports = db;