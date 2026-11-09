const SistemaEscolar = require('./core/SistemaEscolar');

// Na nuvem, a plataforma informa a porta pela variável PORT; no computador, usamos a 3001
const sistema = new SistemaEscolar(Number(process.env.PORT) || 3001);
sistema.iniciar();