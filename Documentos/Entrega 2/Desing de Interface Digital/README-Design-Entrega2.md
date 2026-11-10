# Design de Interface Digital — Entrega 2

**Projeto:** KFKA — Plataforma de Acompanhamento Escolar

| Material | Link |
|---|---|
| Mapa de navegação | [FigJam](COLE_AQUI_O_LINK_DO_FIGJAM) |
| Protótipo navegável (desktop) | [Figma – Protótipo](COLE_AQUI_O_LINK_DO_PROTOTIPO_DESKTOP) |
| Protótipo navegável (mobile) | [Figma – Protótipo mobile](COLE_AQUI_O_LINK_DO_PROTOTIPO_MOBILE) |
| Design System | [Figma – Design System](COLE_AQUI_O_LINK_DO_DESIGN_SYSTEM) |

---

## 1. Mapa de navegação
Fluxo completo do sistema: Login e recuperação de senha, a escolha do perfil e as áreas do **Administrador**, do **Professor** e do **Responsável**, incluindo as decisões "Período aberto?", "Devolvido?" e "Aprovar ou devolver?" e o retorno ao professor quando um registro é devolvido.

## 2. Protótipo navegável
Cerca de 100 telas conectadas, criadas a partir do sistema publicado com dados fictícios, incluindo os estados preenchido, com erro e vazio:
- **Público:** Login (vazio, preenchido, com erro), Esqueci minha senha, Redefinir senha
- **Administrador:** Início, Cadastros (7 abas, cada uma com os modais Novo, Editar e Inativar, mais a busca), Detalhe da turma, Detalhe do responsável, Bimestres (modal de período), Fila de revisão (4 abas e a tela de cada estado), Revisar acompanhamento (modal Devolver), Relatórios (5 agrupamentos, filtro e exportação para Excel)
- **Professor:** Início, Minhas turmas, Lançamentos (3 turmas, 4 bimestres, filtros por situação), Formulário de lançamento (novo, preenchido, com erro, devolvido e somente leitura)
- **Responsável:** Início, Relatório do aluno (4 bimestres e dois filhos), PDF gerado, registro de ciência
- **Mobile:** versões de celular das telas principais

O protótipo tem um ponto de início para cada perfil (Administrador, Professor e Responsável), o que permite validar o fluxo de ponta a ponta do PI: o administrador abre o bimestre, o professor registra e envia, o administrador revisa e publica, e o responsável consulta e baixa o PDF.

## 3. Design System
- **Princípios:** clareza, confiança, eficiência no lançamento e acessibilidade
- **Tokens:** cores (neutros, ação, estados), tipografia, espaçamento, raios, movimento, breakpoints e camadas, com os mesmos nomes das variáveis CSS do código
- **14 componentes** com anatomia, variantes, estados e regras de uso: botão, campo, selo de situação, tag, média, identificação do usuário, cartões, feedback, estado da tela, abas e filtros, tabela e paginação, modal, navegação e histórico
- **Padrões:** fluxo editorial, formulários, listas, ações de risco, responsividade e microtexto
- **Modelos de tela** e a tabela **Figma ↔ Código**, que liga cada componente ao arquivo React correspondente

**Acessibilidade:** os pares de texto e fundo passam no WCAG 2.1 AA, há foco visível, alvos de toque de 42 px ou mais e nenhum estado é indicado só pela cor.

---
**Grupo KFKA** · Projeto Interdisciplinar — ADS · 2º Semestre de 2026
