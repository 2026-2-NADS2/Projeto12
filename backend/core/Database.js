require('dotenv').config();
const mysql = require('mysql2');

class Database {
  #connection;

  constructor() {
    this.#connection = null;
  }

  conectar() {
    return new Promise((resolve, reject) => {
      this.#connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT
      });

      this.#connection.connect((erro) => {
        if (erro) {
          reject(erro);
          return;
        }
        console.log('Conectado ao MySQL!');
        resolve();
      });
    });
  }

  query(sql, valores = []) {
    return new Promise((resolve, reject) => {
      this.#connection.query(sql, valores, (erro, resultado) => {
        if (erro) {
          reject(erro);
          return;
        }
        resolve(resultado);
      });
    });
  }
}

module.exports = Database;