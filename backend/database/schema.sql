-- Schema do banco sistema_escolar
-- Executar com: USE sistema_escolar; antes, ou já estando conectado ao banco correto

CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('administrador', 'professor', 'responsavel') NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE NOT NULL,
  matricula VARCHAR(20) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE professores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  registro_funcional VARCHAR(30) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_professores_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);