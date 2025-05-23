const { Pool } = require('pg');
require('dotenv').config();

// Configuration de la connexion à la base de données
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false }
});

// Fonction pour tester la connexion à la base de données
const testConnection = async () => {
  try {
    const client = await pool.connect();
    client.release();
    return true;
  } catch (err) {
    console.error('Erreur de connexion à la base de données:', err);
    return false;
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  testConnection
};
