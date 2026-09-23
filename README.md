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
<img src="https://pix4free.org/assets/library/2021-01-20/originals/game.jpg" alt="KFKA - Plataforma de Acompanhamento Escolar" border="0">
  Game by <a href="http://www.nyphotographic.com/">Nick Youngson</a> <a rel="license" href="https://creativecommons.org/licenses/by-sa/3.0/">CC BY-SA 3.0</a> <a href="http://pix4free.org/">Pix4free</a>
</p>

A **KFKA** é uma aplicação web responsiva voltada a escolas de Ensino Fundamental, projetada para apoiar o acompanhamento acadêmico bimestral e estabelecer um fluxo claro de informação entre professores, administração escolar e pais ou responsáveis.

O sistema organiza-se em três módulos principais:
1. **Módulo Administrador:** Gestão de cadastros (alunos, professores, turmas, disciplinas, tags), controle dos períodos bimestrais de digitação, fluxo de revisão e publicação de anotações, além de relatórios gerenciais e exportação em Excel.
2. **Módulo Professor:** Lançamento de observações qualitativas, médias e tags de acompanhamento para suas turmas, com opção de salvar rascunho e enviar para revisão.
3. **Módulo Pai/Responsável:** Consulta aos relatórios bimestrais já publicados, confirmação de ciência/retorno e geração de documento consolidado em PDF.

<br>
May the force be with you!
<br><br>

## 🛠 Estrutura de pastas

- Raiz<br>
|<br>
|-->documentos<br>
  &emsp;|-->antigos<br>
  &emsp;|PI_2ADS_202602_KFKA_FINAL.pdf<br>
|-->executáveis<br>
  &emsp;|-->windows<br>
  &emsp;|-->android<br>
  &emsp;|-->HTML<br>
|-->imagens<br>
|-->src<br>
  &emsp;|-->Backend<br>
  &emsp;|-->Frontend<br>
|readme.md<br>

A pasta raiz contém dois arquivos principais:

<b>README.md</b>: Arquivo com a documentação e visão geral do projeto.

E as seguintes pastas:

<b>documentos</b>: Contém a documentação técnica, modelo de banco de dados, especificações de requisitos e PDFs do PI.

<b>executáveis</b>: Binários, builds exportados ou ambiente estático de demonstração.

<b>imagens</b>: Imagens, capturas de tela e recursos visuais do sistema.

<b>src</b>: Código-fonte do projeto (separado em subpastas Backend e Frontend).

## 🛠 Instalação

<b>Backend:</b>

1. Certifique-se de ter o Node.js/Java/.NET e o Banco de Dados (MySQL/PostgreSQL/SQLite) instalados.
2. Acesse a pasta do backend e instale as dependências:

```sh
cd src/Backend
npm install
npm run start
