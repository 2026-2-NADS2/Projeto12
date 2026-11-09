# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href= "https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP - Fundação de Comércio Álvares Penteado" border="0"></a>
</p>

# Plataforma Web de Acompanhamento Escolar

## KFKA

## Integrantes: Daniel Bandini Grande, João Pedro Teixeira dos Santos, Raphael Carmo Mendes, Guilherme Koide Rangel.

## Professores Orientadores: <a href="https://www.linkedin.com/in/adriano-valente/">Adriano Feix Valente</a>, <a href="https://www.linkedin.com/in/eduardo-savino/">Eduardo Savino Gomes</a>, <a href="https://www.linkedin.com/in/francisco-escobar/">Francisco Escobar</a>, <a href=https://www.linkedin.com/in/jbuesso/>Carlos Buesso Junior</a>, <a href="https://www.linkedin.com/in/ronaldo-araujo-pinto-3542811a/">Ronaldo Araujo Pinto</a>

## Descrição

<p align="center">

A **KFKA** é uma aplicação web responsiva voltada a escolas de Ensino Fundamental, projetada para apoiar o acompanhamento acadêmico bimestral e estabelecer um fluxo claro de informação entre professores, administração escolar e pais ou responsáveis.

O sistema organiza-se em três módulos principais:
1. **Módulo Administrador:** Gestão de cadastros (alunos, professores, turmas, disciplinas, tags), controle dos períodos bimestrais de digitação, fluxo de revisão e publicação de anotações, além de relatórios gerenciais e exportação em Excel.
2. **Módulo Professor:** Lançamento de observações qualitativas, médias e tags de acompanhamento para suas turmas, com opção de salvar rascunho e enviar para revisão.
3. **Módulo Pai/Responsável:** Consulta aos relatórios bimestrais já publicados, confirmação de ciência/retorno e geração de documento consolidado em PDF.

## 🛠 Estrutura de pastas

```
Projeto12/
├── backend/            API REST (Node.js + Express 5 + MySQL)
│   ├── core/           SistemaEscolar (classe principal) e Database (conexão)
│   ├── routes/         rotas da API, separadas por assunto
│   ├── services/       regras de negócio (lançamento, revisão, PDF, Excel, senha)
│   ├── repositories/   acesso ao banco (SQL)
│   ├── models/         entidades (Usuario, Aluno, Professor, Acompanhamento...)
│   ├── middlewares/    autenticação JWT e controle de perfil
│   ├── database/       schema.sql (estrutura completa do banco)
│   └── scripts/        carga de dados fictícios e criação de administrador
├── frontend/           interface web responsiva (React + Vite)
│   └── src/
│       ├── paginas/    telas de cada módulo (admin, professor, responsavel)
│       ├── componentes/ peças reutilizáveis (layout, selos, janelas, paginação)
│       ├── servicos/   comunicação com a API
│       └── index.css   guia de estilo (cores e componentes)
└── Documentos/         entregas e documentação do PI
```

## 🛠 Tecnologias

Node.js 24+ · Express 5 · MySQL 8 · bcrypt · JWT · PDFKit · ExcelJS · React 19 · React Router 7 · Vite

## 🛠 Instalação e execução

Pré-requisitos: **Node.js 24+** e **MySQL 8** em execução.

**1. Backend**

```sh
cd backend
npm install
```

Copie o arquivo `.env.example` para `.env` e preencha a senha do seu MySQL. Depois crie o banco já com os dados de demonstração:

```sh
npm run dados
npm start
```

A API sobe em `http://localhost:3001`.

**2. Frontend** (em outro terminal)

```sh
cd frontend
npm install
npm run dev
```

Acesse `http://localhost:5173`.

> No Windows PowerShell, use `npm.cmd` no lugar de `npm` caso apareça erro de política de execução.

## 🔑 Acessos de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Administrador | admin@escola.com | Admin2026 |
| Professor(a) | beatriz@escola.com, carlos@escola.com | Prof2026 |
| Responsável | maria@email.com (mãe de Lucas e Júlia) | Resp2026 |

Os dados são fictícios: 24 alunos, 3 turmas, 5 professores e 12 famílias. O 1º, o 2º e o 3º bimestres estão publicados, e o 4º está aberto para digitação.

## ✅ Requisitos atendidos

| Requisito | Onde ver |
| --- | --- |
| RF01 Autenticação e perfis | Login, recuperação de senha por link, acesso separado por perfil |
| RF02 Cadastros | Administrador → Cadastros (7 abas) |
| RF03 Vínculos da turma | Cadastros → Turmas → Alunos e disciplinas |
| RF04 Períodos bimestrais | Administrador → Bimestres |
| RF05 Acompanhamento | Professor → Minhas turmas → lançamento (descrição, média e tags) |
| RF06 Fluxo editorial | Rascunho → envio → revisão → devolução ou publicação |
| RF07 Histórico e auditoria | Administrador → Revisão → linha do tempo de cada acompanhamento |
| RF08 Consulta do responsável | Responsável → relatório por bimestre e disciplina |
| RF09 PDF | Responsável → Baixar PDF |
| Relatórios e Excel | Administrador → Relatórios (médias, tags, retornos, exportação .xlsx e .csv) |
| Ciência e retorno | Responsável registra ciência; o retorno aparece para o professor e nos relatórios |

## 📋 Licença

Projeto acadêmico desenvolvido para o Projeto Interdisciplinar do curso de Análise e Desenvolvimento de Sistemas da FECAP.run start
