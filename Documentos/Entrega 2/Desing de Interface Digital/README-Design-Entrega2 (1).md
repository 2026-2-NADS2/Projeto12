# Design de Interface Digital — Entrega 2

**Projeto:** KFKA — Plataforma de Acompanhamento Escolar

| Material | Link |
|---|---|
| Mapa de navegação | [FigJam](COLE_AQUI_O_LINK_DO_MAPA) |
| Protótipo navegável | [Figma – Protótipo](COLE_AQUI_O_LINK_DO_PROTOTIPO) |
| Design System | [Figma – Design System](COLE_AQUI_O_LINK_DO_DESIGN_SYSTEM) |

---

## Sobre a entrega

Nesta etapa, o grupo transformou o sistema desenvolvido ao longo do semestre em um **protótipo navegável no Figma**, que representa visualmente o layout, o design e a interatividade da plataforma. O protótipo permite validar o fluxo de navegação e a experiência do usuário de ponta a ponta, do login até as funcionalidades de cada perfil.

As telas foram construídas a partir do sistema real, com dados fictícios. Isso garante que o design apresentado no Figma seja fiel ao que foi implementado no código e mantenha a mesma identidade visual definida na Entrega 1 (paleta de cores, tipografia, componentes e espaçamentos).

---

## 1. Mapa de navegação

O mapa de navegação mostra como as telas da plataforma se conectam. Ele começa no Login, passa pela identificação do perfil do usuário e se divide nas áreas de cada setor. Com ele é possível entender rapidamente os caminhos que cada usuário percorre dentro do sistema e as decisões envolvidas no fluxo, como o envio, a revisão, a devolução e a publicação dos acompanhamentos.

---

## 2. Protótipo navegável

O protótipo é totalmente navegável: as telas estão conectadas entre si por meio dos botões, menus, abas e janelas do sistema, simulando o uso real da plataforma. A navegação é organizada nos **três setores** do projeto.

### Administrador (escola)
Área de gestão da escola. O administrador acessa o painel inicial, os cadastros (alunos, professores, responsáveis, áreas, disciplinas, turmas e tags), a configuração dos bimestres, a fila de revisão dos acompanhamentos enviados pelos professores e os relatórios com exportação de dados. Também é nessa área que ele revisa, devolve ou publica os registros para as famílias.

### Professor
Área de lançamento dos acompanhamentos. O professor visualiza suas turmas e disciplinas, acompanha a situação de cada aluno por bimestre e registra a descrição, a média e as tags do acompanhamento. Os registros podem ser salvos como rascunho e enviados para revisão da escola.

### Responsável (família)
Área de consulta. O responsável vê os alunos vinculados à sua conta, consulta os relatórios publicados por bimestre, baixa o relatório em PDF e registra a ciência da leitura.

### Navegação
- Cada setor tem seu próprio **ponto de início** no protótipo, o que permite testar a experiência de cada perfil separadamente.
- O **menu lateral**, as **abas** e os **botões de ação** levam às telas correspondentes, mantendo uma navegação clara e consistente.
- As **janelas (pop-ups)** de cadastro, edição e confirmação também fazem parte do fluxo.
- O protótipo segue o mesmo padrão visual em todas as telas, garantindo coerência e uma experiência intuitiva.

---

## 3. Design System

O Design System reúne a base visual reutilizável da plataforma, para que todas as telas sigam os mesmos padrões e o design e o desenvolvimento usem a mesma linguagem. Ele contém:

- **Princípios de design:** clareza, confiança, eficiência e acessibilidade.
- **Tokens:** cores, tipografia, espaçamentos, cantos arredondados e outros valores visuais, com os mesmos nomes usados no código.
- **Componentes:** botões, campos de formulário, selos de situação, tags, cartões, abas, filtros, tabelas, janelas (modais), avisos e navegação, com suas variações e regras de uso.
- **Padrões de uso:** orientações para formulários, listas, fluxo dos acompanhamentos e responsividade.
- **Modelos de tela:** a estrutura base das telas internas e de acesso.
- **Relação Figma ↔ Código:** a correspondência entre os componentes do Figma e os componentes do sistema.

---

## Conclusão

Com esta entrega, o grupo consolida a parte visual e de experiência do usuário da plataforma KFKA. O mapa de navegação organiza os caminhos, o protótipo permite navegar por todo o sistema e o Design System padroniza os elementos de interface. Juntos, eles mostram uma solução coerente, intuitiva e alinhada às necessidades da escola, dos professores e das famílias.

---
**Grupo KFKA** · Projeto Interdisciplinar — ADS · 2º Semestre de 2026
