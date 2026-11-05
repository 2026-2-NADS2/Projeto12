-- Schema do banco sistema_escolar (MySQL 8)
-- Pode ser executado em qualquer máquina: cria o banco se não existir e já o seleciona.

CREATE DATABASE IF NOT EXISTS sistema_escolar;
USE sistema_escolar;
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  senha_hash VARCHAR(255) NOT NULL,
  perfil ENUM('administrador', 'professor', 'responsavel') NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alunos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  data_nascimento DATE NOT NULL,
  matricula VARCHAR(20) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS professores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  registro_funcional VARCHAR(30) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_professores_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS responsaveis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL UNIQUE,
  telefone VARCHAR(11) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_responsaveis_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS responsavel_aluno (
  responsavel_id INT NOT NULL,
  aluno_id INT NOT NULL,
  parentesco VARCHAR(30) NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (responsavel_id, aluno_id),
  CONSTRAINT fk_ra_responsavel FOREIGN KEY (responsavel_id) REFERENCES responsaveis(id),
  CONSTRAINT fk_ra_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

CREATE TABLE IF NOT EXISTS areas_disciplina (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS disciplinas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  area_id INT NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_disciplinas_area FOREIGN KEY (area_id) REFERENCES areas_disciplina(id)
);

CREATE TABLE IF NOT EXISTS turmas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ano_serie TINYINT NOT NULL,
  identificacao VARCHAR(10) NOT NULL,
  turno ENUM('manha', 'tarde', 'integral') NOT NULL,
  ano_letivo SMALLINT NOT NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT uq_turmas_serie_ident_ano UNIQUE (ano_serie, identificacao, ano_letivo),
  CONSTRAINT chk_turmas_ano_serie CHECK (ano_serie BETWEEN 1 AND 9)
);

CREATE TABLE IF NOT EXISTS tags (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE,
  descricao VARCHAR(255) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS turma_aluno (
  turma_id INT NOT NULL,
  aluno_id INT NOT NULL,
  ano_letivo SMALLINT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (turma_id, aluno_id),
  CONSTRAINT uq_turma_aluno_ano UNIQUE (aluno_id, ano_letivo),
  CONSTRAINT fk_ta_turma FOREIGN KEY (turma_id) REFERENCES turmas(id),
  CONSTRAINT fk_ta_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id)
);

CREATE TABLE IF NOT EXISTS turma_disciplina_professor (
  turma_id INT NOT NULL,
  disciplina_id INT NOT NULL,
  professor_id INT NOT NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (turma_id, disciplina_id),
  INDEX idx_tdp_professor (professor_id),
  CONSTRAINT fk_tdp_turma FOREIGN KEY (turma_id) REFERENCES turmas(id),
  CONSTRAINT fk_tdp_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
  CONSTRAINT fk_tdp_professor FOREIGN KEY (professor_id) REFERENCES professores(id)
);