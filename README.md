# FECAP - Fundação de Comércio Álvares Penteado

<p align="center">
<a href= "https://www.fecap.br/"><img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRhZPrRa89Kma0ZZogxm0pi-tCn_TLKeHGVxywp-LXAFGR3B1DPouAJYHgKZGV0XTEf4AE&usqp=CAU" alt="FECAP - Fundação de Comércio Álvares Penteado" border="0"></a>
</p>

# Projeto Interdisciplinar: KFKA – Plataforma de Gestão Educacional

Para executar o sistema no Windows, consulte o [passo a passo para iniciar o sistema](#️-instalação-e-configuração-windows). Para só usar, acesse o **[sistema online](https://projeto12-production.up.railway.app)**.

## Nome do Grupo: MarketMob

## Integrantes: Daniel Bandini Grande, Guilherme Koide Rangel, João Pedro Teixeira dos Santos, Raphael Carmo Mendes

## Professores Orientadores: <a href="https://www.linkedin.com/in/adriano-valente/">Adriano Valente</a>, <a href="https://www.linkedin.com/in/eduardo-savino/">Eduardo Savino</a>, <a href="https://www.linkedin.com/in/francisco-escobar/">Francisco (Chico) Escobar</a>, <a href="https://www.linkedin.com/in/jbuesso/">Carlos Buesso</a>, <a href="https://www.linkedin.com/in/ronaldo-araujo-pinto-3542811a/">Ronaldo Araújo</a>

## Descrição

<p align="center">
  <img src="imagens/logo-marketmob.png" width="220" alt="Logo MarketMob">
</p>

Em muitas escolas, o acompanhamento do aluno fica espalhado entre cadernos, planilhas e mensagens soltas, e a família só fica sabendo do desempenho no fim do bimestre. A **KFKA**, criada pelo grupo **MarketMob**, resolve isso reunindo tudo em um só lugar: uma plataforma web responsiva de **gestão educacional** para escolas de Ensino Fundamental, em que o professor registra, a escola revisa e a família acompanha.

Cada acompanhamento tem uma descrição, uma média de 0 a 10 e tags (como *Participativo* ou *Precisa de reforço*). Ele só chega aos pais depois de revisado e publicado pela administração, e tudo fica registrado no histórico: quem alterou, quando e o que mudou. Os responsáveis confirmam a leitura, podem mandar um retorno para a escola e baixam o relatório em PDF.

<table>
  <tr>
    <th width="33%">🏫 Escola (Administrador)</th>
    <th width="33%">👩‍🏫 Professor</th>
    <th width="33%">👨‍👩‍👧 Família (Responsável)</th>
  </tr>
  <tr>
    <td valign="top">
      • Cadastra alunos, turmas, professores, responsáveis, disciplinas e tags<br>
      • Abre e fecha os 4 bimestres<br>
      • Revisa, devolve ou publica<br>
      • Gera relatórios e exporta para Excel
    </td>
    <td valign="top">
      • Vê só as suas turmas<br>
      • Lança descrição, média e tags<br>
      • Salva rascunho e envia para revisão<br>
      • Corrige o que foi devolvido
    </td>
    <td valign="top">
      • Vê só os seus filhos<br>
      • Consulta o que foi publicado<br>
      • Registra ciência e retorno<br>
      • Baixa o relatório em PDF
    </td>
  </tr>
</table>

## 🛠️ Estrutura de pastas

```
Projeto12
│
├── backend                 API REST (Node.js + Express + MySQL)
│   ├── core                SistemaEscolar (classe principal) e Database (conexão)
│   ├── routes              rotas da API, separadas por assunto
│   ├── services            regras de negócio (lançamento, revisão, PDF, Excel, senha)
│   ├── repositories        acesso ao banco (SQL)
│   ├── models              entidades (Usuario, Aluno, Professor, Acompanhamento...)
│   ├── middlewares         autenticação JWT e controle de perfil
│   ├── database            schema.sql (estrutura completa do banco)
│   └── scripts             carga de dados fictícios e criação de administrador
│
├── frontend                interface web responsiva (React + Vite)
│   └── src
│       ├── paginas         telas de cada módulo (admin, professor, responsavel)
│       ├── componentes     peças reutilizáveis (layout, selos, janelas, paginação)
│       ├── servicos        comunicação com a API
│       └── index.css       guia de estilo (cores e componentes)
│
├── Documentos              entregas e documentação do PI
│
├── imagens                 logo e imagens deste README
│
└── README.md
```

---

## 🧰 Tecnologias por camada

<table>
  <tr>
    <th>🖥️ Telas</th>
    <th>⚙️ API</th>
    <th>🗄️ Dados e arquivos</th>
    <th>🚢 Entrega</th>
  </tr>
  <tr>
    <td valign="top">
      <img src="https://cdn.simpleicons.org/react" width="18" alt=""> <b>React 19</b><br><sub>componentes de cada tela</sub><br><br>
      <img src="https://cdn.simpleicons.org/reactrouter" width="18" alt=""> <b>React Router 7</b><br><sub>navegação por perfil</sub><br><br>
      <img src="https://cdn.simpleicons.org/vite" width="18" alt=""> <b>Vite</b><br><sub>servidor local e build</sub><br><br>
      <img src="https://cdn.simpleicons.org/css" width="18" alt=""> <b>CSS</b><br><sub>tema escuro e ciano</sub>
    </td>
    <td valign="top">
      <img src="https://cdn.simpleicons.org/nodedotjs" width="18" alt=""> <b>Node.js 24+</b><br><sub>executa a API</sub><br><br>
      <img src="https://cdn.simpleicons.org/express/888888" width="18" alt=""> <b>Express 5</b><br><sub>rotas e middlewares</sub><br><br>
      <img src="https://cdn.simpleicons.org/jsonwebtokens/888888" width="18" alt=""> <b>JWT</b><br><sub>sessão e permissões</sub><br><br>
      🔒 <b>bcrypt</b><br><sub>senhas com hash</sub>
    </td>
    <td valign="top">
      <img src="https://cdn.simpleicons.org/mysql" width="18" alt=""> <b>MySQL 8</b><br><sub>banco relacional</sub><br><br>
      📄 <b>PDFKit</b><br><sub>relatório do aluno</sub><br><br>
      📊 <b>ExcelJS</b><br><sub>exportação .xlsx e .csv</sub>
    </td>
    <td valign="top">
      <img src="https://cdn.simpleicons.org/figma" width="18" alt=""> <b>Figma</b><br><sub>guia de estilo e protótipo</sub><br><br>
      <img src="https://cdn.simpleicons.org/github/888888" width="18" alt=""> <b>Git e GitHub</b><br><sub>versionamento</sub><br><br>
      <img src="https://cdn.simpleicons.org/railway/888888" width="18" alt=""> <b>Railway</b><br><sub>sistema no ar</sub>
    </td>
  </tr>
</table>

<sub>Ícones: <a href="https://simpleicons.org/">Simple Icons</a> (CC0). As marcas pertencem aos seus donos.</sub>

---

## 🚀 Como executar o projeto

O projeto tem duas partes: o **backend** (API + banco de dados) e o **frontend** (telas). Para o sistema funcionar completamente, **você precisa rodar o backend e o frontend em terminais separados**, com o MySQL ligado.

> Só quer usar o sistema? Não precisa instalar nada: acesse **<https://projeto12-production.up.railway.app>** e entre com um dos [acessos de demonstração](#-acessos-de-demonstração).

### Pré-requisitos

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| **Node.js** | 24 ou superior | Rodar a API e o frontend |
| **npm** | Vem junto com o Node.js | Instalar dependências e rodar os scripts |
| **MySQL** | 8 | Guardar os dados do sistema |
| **Git** | Qualquer versão recente | Clonar o repositório (opcional se recebeu o `.zip`) |
| **Navegador** | Chrome, Edge, Firefox ou Safari atualizados | Usar o sistema |

## 🛠️ Instalação e Configuração (Windows)

Siga os passos abaixo para baixar o projeto e preparar o ambiente no Windows.

### 1. Instalar os pré-requisitos

Abra o **PowerShell** e instale o Node.js (versão LTS), o MySQL e o Git:

```sh
winget install OpenJS.NodeJS.LTS
winget install Oracle.MySQL
winget install Git.Git
```

Feche e abra o terminal novamente depois da instalação. Confira se tudo foi instalado:

```sh
node -v
npm -v
git --version
```

> Durante a instalação do MySQL, anote a senha do usuário `root`. Ela vai no arquivo `.env` do backend.

### 2. Clonar o repositório

```sh
git clone https://github.com/2026-2-NADS2/Projeto12.git
```

Entre na pasta que foi criada:

```sh
cd Projeto12
```

### 3. Executar o Backend

Abra o terminal e entre na pasta do backend:

```sh
cd backend
npm install
```

Crie o arquivo de configuração a partir do exemplo e preencha a senha do seu MySQL:

```sh
Copy-Item .env.example .env
notepad .env
```

Crie o banco já com os dados de demonstração e suba a API:

```sh
npm run dados
npm start
```

A API sobe em `http://localhost:3001`.

### 4. Executar o Frontend

Abra **outro terminal** (deixe o do backend rodando) e entre na pasta do frontend:

```sh
cd frontend
npm install
npm run dev
```

O Vite inicia o servidor local do frontend (geralmente em `http://localhost:5173`). Abra o link exibido no terminal.

> 💡 Se o PowerShell mostrar erro de política de execução, use `npm.cmd` no lugar de `npm`.

---

## 🔑 Acessos de demonstração

| Perfil | E-mail | Senha |
| --- | --- | --- |
| 🏫 Administrador | admin@escola.com | Admin2026 |
| 👩‍🏫 Professor(a) | beatriz@escola.com, carlos@escola.com | Prof2026 |
| 👨‍👩‍👧 Responsável | maria@email.com (mãe de Lucas e Júlia) | Resp2026 |

Os dados são fictícios: **24 alunos, 3 turmas, 5 professores e 12 famílias**. O 1º, o 2º e o 3º bimestres estão publicados, e o 4º está aberto para digitação.

## ✅ O que o sistema entrega (requisitos)

| | Requisito | Onde encontrar |
| :---: | --- | --- |
| ✅ | RF01 Autenticação e perfis | Login, recuperação de senha por link, acesso separado por perfil |
| ✅ | RF02 Cadastros escolares | Administrador → Cadastros (7 abas) |
| ✅ | RF03 Vínculos da turma | Cadastros → Turmas → Alunos e disciplinas |
| ✅ | RF04 Períodos bimestrais | Administrador → Bimestres |
| ✅ | RF05 Acompanhamento | Professor → Minhas turmas → lançamento |
| ✅ | RF06 Fluxo editorial | Rascunho → envio → revisão → devolução ou publicação |
| ✅ | RF07 Histórico e auditoria | Administrador → Revisão → linha do tempo |
| ✅ | RF08 Consulta do responsável | Responsável → relatório por bimestre e disciplina |
| ✅ | RF09 PDF | Responsável → Baixar PDF |
| ✅ | RF10 Relatórios gerenciais | Administrador → Relatórios |
| ✅ | RF11 Exportação | Relatórios → `.xlsx` e `.csv` |
| ✅ | RF12 Comunicação e retorno | Ciência e retorno do responsável, visíveis ao professor e nos relatórios |

## 🤖 Uso de Inteligência Artificial

Seguimos o **Guia para o Uso Responsável de Inteligência Artificial na FECAP**. A declaração completa, etapa por etapa, está em **[Documentos/Declaracao_Uso_IA.pdf](Documentos/Declaracao_Uso_IA.pdf)**.

Usamos o **Claude (Anthropic)** como apoio técnico para: discutir e estruturar soluções; explicar conceitos; propor código para o backend e o frontend; revisar as telas e converter o design em componentes; encontrar e corrigir erros; organizar os testes e automatizar o teste de ponta a ponta; orientar a implantação em nuvem; e escrever a primeira versão de parte da documentação técnica.

As decisões de escopo e de design, a montagem e integração do sistema, a execução dos testes, a implantação e a validação dos resultados ficaram sob responsabilidade total dos integrantes. Todo código foi executado e testado pelo grupo antes de ir para o repositório.

---

## 📋 Licença/License

<p xmlns:cc="http://creativecommons.org/ns#"><a href="https://github.com/2026-2-NADS2/Projeto12">KFKA (MarketMob)</a> © 2026 by Daniel, Guilherme, João Pedro, Raphael is licensed under <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noopener noreferrer">CC BY 4.0</a> <img src="https://mirrors.creativecommons.org/presskit/icons/cc.svg" alt="" width="22"> <img src="https://mirrors.creativecommons.org/presskit/icons/by.svg" alt="" width="22"></p>

---

## 📚 Referências e Documentação de Apoio

Abaixo estão as principais fontes de consulta, documentações oficiais e normas usadas no desenvolvimento e na fundamentação deste projeto.

### 📜 Documentos Institucionais e Normativos

- **FECAP.** *Guia para o Uso Responsável de Inteligência Artificial na FECAP.* Versão 2.0, 2026.
- **BRASIL.** *Lei Geral de Proteção de Dados Pessoais (LGPD).* Lei nº 13.709, de 14 de agosto de 2018. [Acessar Lei](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm)
- **ORGANIZAÇÃO DAS NAÇÕES UNIDAS (ONU).** *Objetivos de Desenvolvimento Sustentável (ODS)* — ODS 4 e ODS 10. [Acessar ODS](https://brasil.un.org/pt-br/sdgs)

### 🎨 Ferramentas de Design e Apoio

- **Figma:** [Central de Ajuda](https://help.figma.com/)
- **Railway:** [Documentação Oficial](https://docs.railway.com/)
- **Simple Icons:** [Biblioteca de ícones usada neste README](https://simpleicons.org/)
- **Creative Commons:** [Escolha de licença](https://chooser-beta.creativecommons.org/)
- **Modelo de README:** [iuricode/readme-template](https://github.com/iuricode/readme-template)

<br> <p align="center"> <img src="imagens/logo-marketmob.png" width="40" alt="MarketMob"><br> <sub><b>MarketMob</b> · FECAP · 2026</sub> </p>
