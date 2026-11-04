require('dotenv').config();
const mysql = require('mysql2');

class Database {
  #pool; // atributo privado: conjunto de conexões reutilizáveis

  constructor() {
    this.#pool = null;
  }

  conectar() {
    this.#pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
      waitForConnections: true, // se todas estiverem ocupadas, espera uma ficar livre
      connectionLimit: 10       // no máximo 10 conexões abertas ao mesmo tempo
    });

    // O pool só abre conexões quando precisa. Pedimos uma agora para testar
    // as credenciais logo na inicialização, e a devolvemos em seguida.
    return new Promise((resolve, reject) => {
      this.#pool.getConnection((erro, conexao) => {
        if (erro) {
          reject(erro);
          return;
        }
        conexao.release();
        console.log('Conectado ao MySQL!');
        resolve();
      });
    });
  }

  query(sql, valores = []) {
    return new Promise((resolve, reject) => {
      this.#pool.query(sql, valores, (erro, resultado) => {
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