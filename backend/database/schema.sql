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

CREATE TABLE IF NOT EXISTS bimestres (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ano_letivo SMALLINT NOT NULL,
  numero TINYINT NOT NULL,
  abertura DATETIME NOT NULL,
  encerramento DATETIME NOT NULL,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_bimestres_ano_numero UNIQUE (ano_letivo, numero),
  CONSTRAINT chk_bimestres_numero CHECK (numero BETWEEN 1 AND 4),
  CONSTRAINT chk_bimestres_periodo CHECK (encerramento > abertura)
);

CREATE TABLE IF NOT EXISTS acompanhamentos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id INT NOT NULL,
  turma_id INT NOT NULL,
  disciplina_id INT NOT NULL,
  professor_id INT NOT NULL,
  bimestre_id INT NOT NULL,
  descricao TEXT NOT NULL,
  media DECIMAL(3,1) NOT NULL,
  status ENUM('rascunho', 'enviado', 'devolvido', 'publicado') NOT NULL DEFAULT 'rascunho',
  observacao_revisao VARCHAR(500) NULL,
  revisor_id INT NULL,
  enviado_em DATETIME NULL,
  revisado_em DATETIME NULL,
  publicado_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_acomp_aluno_disc_bim UNIQUE (aluno_id, disciplina_id, bimestre_id),
  INDEX idx_acomp_status_bimestre (status, bimestre_id),
  INDEX idx_acomp_professor (professor_id, turma_id, disciplina_id),
  INDEX idx_acomp_aluno_status (aluno_id, status),
  CONSTRAINT chk_acomp_media CHECK (media BETWEEN 0 AND 10),
  CONSTRAINT fk_acomp_aluno FOREIGN KEY (aluno_id) REFERENCES alunos(id),
  CONSTRAINT fk_acomp_turma FOREIGN KEY (turma_id) REFERENCES turmas(id),
  CONSTRAINT fk_acomp_disciplina FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id),
  CONSTRAINT fk_acomp_professor FOREIGN KEY (professor_id) REFERENCES professores(id),
  CONSTRAINT fk_acomp_bimestre FOREIGN KEY (bimestre_id) REFERENCES bimestres(id),
  CONSTRAINT fk_acomp_revisor FOREIGN KEY (revisor_id) REFERENCES usuarios(id)
);

CREATE TABLE IF NOT EXISTS acompanhamento_tag (
  acompanhamento_id INT NOT NULL,
  tag_id INT NOT NULL,
  PRIMARY KEY (acompanhamento_id, tag_id),
  INDEX idx_acg_tag (tag_id),
  CONSTRAINT fk_acg_acompanhamento FOREIGN KEY (acompanhamento_id) REFERENCES acompanhamentos(id) ON DELETE CASCADE,
  CONSTRAINT fk_acg_tag FOREIGN KEY (tag_id) REFERENCES tags(id)
);