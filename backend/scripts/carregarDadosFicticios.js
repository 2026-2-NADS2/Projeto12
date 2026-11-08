// Recria o banco "sistema_escolar" do zero e o preenche com uma escola fictícia
// para demonstração. ATENÇÃO: apaga todos os dados atuais do banco.
// Uso (na pasta backend):  node scripts/carregarDadosFicticios.js --confirmar

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

const ANO = 2026;

// ---------- Sorteador com semente: parece aleatório, mas gera sempre os mesmos dados ----------
function criarSorteador(semente) {
  let estado = semente;
  const proximo = () => {
    // Algoritmo mulberry32: devolve um número entre 0 e 1
    estado = (estado + 0x6D2B79F5) | 0;
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    numero: proximo,
    inteiro: (min, max) => min + Math.floor(proximo() * (max - min + 1)),
    item: (lista) => lista[Math.floor(proximo() * lista.length)]
  };
}
const sorte = criarSorteador(ANO);

// ---------- Dados base da escola ----------
const SENHAS = { administrador: 'Admin2026', professor: 'Prof2026', responsavel: 'Resp2026' };

const AREAS = ['Linguagens e Códigos', 'Matemática', 'Ciências da Natureza', 'Ciências Humanas'];

// [nome da disciplina, posição da área em AREAS]
const DISCIPLINAS = [
  ['Língua Portuguesa', 0], ['Inglês', 0], ['Matemática', 1],
  ['Ciências', 2], ['História', 3], ['Geografia', 3]
];

// [nome, e-mail, registro funcional, disciplinas que leciona (posições em DISCIPLINAS)]
const PROFESSORES = [
  ['Beatriz Santos', 'beatriz@escola.com', 'PROF001', [0]],
  ['Fernanda Costa', 'fernanda.costa@escola.com', 'PROF002', [1]],
  ['Carlos Souza', 'carlos@escola.com', 'PROF003', [2]],
  ['Ana Ribeiro', 'ana.ribeiro@escola.com', 'PROF004', [3]],
  ['Marcos Lima', 'marcos.lima@escola.com', 'PROF005', [4, 5]]
];

// [ano/série, identificação, turno]
const TURMAS = [[5, 'A', 'manha'], [5, 'B', 'tarde'], [6, 'A', 'manha']];

// 24 alunos: dois por família (mesmo sobrenome), em turmas diferentes
const PRIMEIROS_NOMES = ['Lucas', 'Júlia', 'Gabriel', 'Laura', 'Pedro', 'Sofia', 'Rafael', 'Helena',
  'Mateus', 'Valentina', 'Enzo', 'Alice', 'Guilherme', 'Manuela', 'Davi', 'Beatriz',
  'Arthur', 'Isabela', 'Heitor', 'Lívia', 'Bernardo', 'Cecília', 'Samuel', 'Lorena'];
const SOBRENOMES = ['Oliveira', 'Silva', 'Pereira', 'Almeida', 'Ferreira', 'Rodrigues',
  'Gomes', 'Martins', 'Araújo', 'Carvalho', 'Rocha', 'Barbosa'];

// Um responsável por família: [primeiro nome, parentesco]
const RESPONSAVEIS = [['Maria', 'Mãe'], ['José', 'Pai'], ['Patrícia', 'Mãe'], ['Ricardo', 'Pai'],
  ['Juliana', 'Mãe'], ['Fábio', 'Pai'], ['Cláudia', 'Mãe'], ['Rogério', 'Pai'],
  ['Renata', 'Mãe'], ['André', 'Pai'], ['Simone', 'Mãe'], ['Paulo', 'Pai']];

const TAGS = [
  ['Participativo', 'Contribui com frequência nas aulas'],
  ['Ótimo desempenho', 'Resultados acima do esperado no bimestre'],
  ['Entrega atividades em dia', 'Cumpre os prazos das tarefas'],
  ['Precisa de reforço', 'Indicar atividades de recuperação'],
  ['Dificuldade de concentração', 'Distrai-se com facilidade durante as explicações'],
  ['Faltas frequentes', null]
];

// [número, abertura, encerramento] — o 4º bimestre fica aberto até 18/12
const BIMESTRES = [
  [1, '2026-02-09 07:00:00', '2026-04-30 23:59:00'],
  [2, '2026-05-04 07:00:00', '2026-07-10 23:59:00'],
  [3, '2026-08-03 07:00:00', '2026-10-02 23:59:00'],
  [4, '2026-10-05 07:00:00', '2026-12-18 23:59:00']
];

// Datas usadas no fluxo de cada bimestre
const DATAS = {
  1: { criado: '2026-04-22 19:00:00', enviado: '2026-04-28 20:00:00', revisado: '2026-05-06 10:00:00' },
  2: { criado: '2026-07-01 19:00:00', enviado: '2026-07-07 20:00:00', revisado: '2026-07-15 10:00:00' },
  3: { criado: '2026-09-24 19:00:00', enviado: '2026-09-30 20:00:00', revisado: '2026-10-07 10:00:00' },
  4: { criado: '2026-11-03 19:00:00', enviado: '2026-11-05 20:00:00', revisado: '2026-11-06 10:00:00' }
};

const DESCRICOES = {
  alta: [
    'Demonstra excelente compreensão dos conteúdos e participa ativamente das aulas.',
    'Realiza as atividades com autonomia e capricho, ajudando os colegas quando necessário.',
    'Apresentou ótimo desempenho nas avaliações e nos trabalhos em grupo.'
  ],
  media: [
    'Acompanha bem os conteúdos, mas pode se dedicar mais às atividades de casa.',
    'Tem evoluído ao longo do bimestre; precisa manter a regularidade nos estudos.',
    'Participa das aulas e cumpre as tarefas, com alguns pontos a revisar.'
  ],
  baixa: [
    'Apresenta dificuldades nos conteúdos do bimestre; recomenda-se reforço.',
    'Precisa melhorar a concentração e a entrega das atividades.',
    'Teve um bimestre irregular; será importante acompanhar os estudos em casa.'
  ]
};

const OBSERVACOES_DEVOLUCAO = [
  'Detalhar quais atividades foram realizadas no bimestre.',
  'A descrição está muito curta; incluir pontos de melhoria.',
  'Conferir a média: está diferente das avaliações registradas.'
];

const RETORNOS = [
  'Obrigada pelo retorno, vamos acompanhar as tarefas em casa.',
  'Ficamos felizes com a evolução!',
  'Gostaria de agendar uma conversa com a professora.',
  'Vamos reforçar os estudos no fim de semana.'
];

// ---------- Funções auxiliares ----------
const pad = (n) => String(n).padStart(2, '0');
const semAcento = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const arredondar = (n) => Math.round(Math.min(10, Math.max(0, n)) * 10) / 10;

function descricaoPara(media) {
  const faixa = media >= 8 ? 'alta' : media >= 6 ? 'media' : 'baixa';
  return sorte.item(DESCRICOES[faixa]);
}

function tagsPara(media) {
  const tags = [];
  if (media >= 8.5) tags.push('Ótimo desempenho');
  if (media >= 7 && sorte.numero() < 0.5) tags.push(sorte.item(['Participativo', 'Entrega atividades em dia']));
  if (media < 6) tags.push('Precisa de reforço');
  if (media < 6.5 && sorte.numero() < 0.4) tags.push('Dificuldade de concentração');
  if (sorte.numero() < 0.07) tags.push('Faltas frequentes');
  return [...new Set(tags)];
}

// No 4º bimestre (em andamento), cada lançamento está numa etapa diferente
function statusDoQuartoBimestre() {
  const r = sorte.numero();
  if (r < 0.2) return null;          // ainda sem lançamento
  if (r < 0.5) return 'rascunho';
  if (r < 0.8) return 'enviado';
  if (r < 0.9) return 'devolvido';
  return 'publicado';
}

// Insere várias linhas num único comando e devolve o id da primeira
async function inserir(conexao, tabela, colunas, linhas) {
  if (linhas.length === 0) return null;
  const [resultado] = await conexao.query(`INSERT INTO ${tabela} (${colunas.join(', ')}) VALUES ?`, [linhas]);
  return resultado.insertId;
}

// ---------- Execução ----------
async function main() {
  if (!process.argv.includes('--confirmar')) {
    console.log('Este script APAGA o banco sistema_escolar e o recria com dados fictícios.');
    console.log('Para continuar, rode: node scripts/carregarDadosFicticios.js --confirmar');
    process.exit(1);
  }

  // Conexão própria, sem banco selecionado (ele vai ser apagado) e aceitando
  // vários comandos de uma vez, para executar o schema.sql inteiro
  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    multipleStatements: true,
    dateStrings: true
  });

  try {
    console.log('1/7 Recriando o banco a partir do schema.sql...');
    await conexao.query('DROP DATABASE IF EXISTS sistema_escolar');
    const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
    await conexao.query(schema); // o próprio schema cria e seleciona o banco (USE)

    console.log('2/7 Usuários, professores e responsáveis...');
    const hashes = {};
    for (const [perfil, senha] of Object.entries(SENHAS)) {
      hashes[perfil] = await bcrypt.hash(senha, 10);
    }

    const familias = RESPONSAVEIS.map(([primeiroNome, parentesco], i) => {
      const sobrenome = SOBRENOMES[i];
      let email = `${semAcento(primeiroNome)}.${semAcento(sobrenome)}@email.com`.toLowerCase();
      if (i === 0) email = 'maria@email.com';
      if (i === 1) email = 'jose@email.com';
      return {
        nome: `${primeiroNome} ${sobrenome}`,
        email,
        parentesco,
        telefone: `119${String(87650000 + i * 1111).padStart(8, '0')}`
      };
    });

    const usuarios = [['Secretaria KFKA', 'admin@escola.com', hashes.administrador, 'administrador']];
    PROFESSORES.forEach(([nome, email]) => usuarios.push([nome, email, hashes.professor, 'professor']));
    familias.forEach((f) => usuarios.push([f.nome, f.email, hashes.responsavel, 'responsavel']));

    const primeiroUsuarioId = await inserir(conexao, 'usuarios', ['nome', 'email', 'senha_hash', 'perfil'], usuarios);
    const adminId = primeiroUsuarioId;
    const usuarioDoProfessor = (p) => primeiroUsuarioId + 1 + p;
    const usuarioDoResponsavel = (r) => primeiroUsuarioId + 1 + PROFESSORES.length + r;

    const primeiroProfessorId = await inserir(conexao, 'professores', ['usuario_id', 'registro_funcional'],
      PROFESSORES.map(([, , registro], p) => [usuarioDoProfessor(p), registro]));
    const primeiroResponsavelId = await inserir(conexao, 'responsaveis', ['usuario_id', 'telefone'],
      familias.map((f, r) => [usuarioDoResponsavel(r), f.telefone]));

    console.log('3/7 Áreas, disciplinas, tags e bimestres...');
    const primeiraAreaId = await inserir(conexao, 'areas_disciplina', ['nome'], AREAS.map((nome) => [nome]));
    const primeiraDisciplinaId = await inserir(conexao, 'disciplinas', ['nome', 'area_id'],
      DISCIPLINAS.map(([nome, area]) => [nome, primeiraAreaId + area]));
    const primeiraTagId = await inserir(conexao, 'tags', ['nome', 'descricao'], TAGS);
    const tagId = (nome) => primeiraTagId + TAGS.findIndex(([n]) => n === nome);
    const primeiroBimestreId = await inserir(conexao, 'bimestres', ['ano_letivo', 'numero', 'abertura', 'encerramento'],
      BIMESTRES.map(([numero, abertura, encerramento]) => [ANO, numero, abertura, encerramento]));

    console.log('4/7 Turmas e professores por disciplina...');
    const primeiraTurmaId = await inserir(conexao, 'turmas', ['ano_serie', 'identificacao', 'turno', 'ano_letivo'],
      TURMAS.map(([serie, identificacao, turno]) => [serie, identificacao, turno, ANO]));

    // Para cada disciplina, a posição do professor que a leciona
    const professorDaDisciplina = DISCIPLINAS.map((_, d) => PROFESSORES.findIndex(([, , , lista]) => lista.includes(d)));

    const alocacoes = [];
    TURMAS.forEach((_, t) => DISCIPLINAS.forEach((_, d) => {
      alocacoes.push([primeiraTurmaId + t, primeiraDisciplinaId + d, primeiroProfessorId + professorDaDisciplina[d]]);
    }));
    await inserir(conexao, 'turma_disciplina_professor', ['turma_id', 'disciplina_id', 'professor_id'], alocacoes);

    console.log('5/7 Alunos, matrículas e vínculos com responsáveis...');
    const alunos = PRIMEIROS_NOMES.map((primeiroNome, i) => {
      const turma = i % TURMAS.length;
      const anoNascimento = ANO - (TURMAS[turma][0] + 5) - sorte.inteiro(0, 1);
      return {
        nome: `${primeiroNome} ${SOBRENOMES[Math.floor(i / 2)]}`,
        matricula: `${ANO}${String(i + 1).padStart(3, '0')}`,
        nascimento: `${anoNascimento}-${pad(sorte.inteiro(1, 12))}-${pad(sorte.inteiro(1, 28))}`,
        turma,
        familia: Math.floor(i / 2),
        nivel: 5 + sorte.numero() * 4.5 // "nível" do aluno: base das médias dele
      };
    });

    const primeiroAlunoId = await inserir(conexao, 'alunos', ['nome', 'data_nascimento', 'matricula'],
      alunos.map((a) => [a.nome, a.nascimento, a.matricula]));
    await inserir(conexao, 'turma_aluno', ['turma_id', 'aluno_id', 'ano_letivo'],
      alunos.map((a, i) => [primeiraTurmaId + a.turma, primeiroAlunoId + i, ANO]));
    await inserir(conexao, 'responsavel_aluno', ['responsavel_id', 'aluno_id', 'parentesco'],
      alunos.map((a, i) => [primeiroResponsavelId + a.familia, primeiroAlunoId + i, familias[a.familia].parentesco]));

    console.log('6/7 Acompanhamentos, tags e histórico de auditoria...');
    const lancamentos = [];
    alunos.forEach((aluno, a) => {
      DISCIPLINAS.forEach((_, d) => {
        BIMESTRES.forEach(([numero], b) => {
          const status = numero < 4 ? 'publicado' : statusDoQuartoBimestre();
          if (!status) return;
          const media = arredondar(aluno.nivel + (sorte.numero() * 2 - 1) + b * 0.15);
          lancamentos.push({
            a, d, b, numero, status, media,
            descricao: descricaoPara(media),
            tags: tagsPara(media),
            observacao: status === 'devolvido' ? sorte.item(OBSERVACOES_DEVOLUCAO) : null
          });
        });
      });
    });

    const primeiroAcompanhamentoId = await inserir(conexao, 'acompanhamentos',
      ['aluno_id', 'turma_id', 'disciplina_id', 'professor_id', 'bimestre_id', 'descricao', 'media', 'status',
        'observacao_revisao', 'revisor_id', 'enviado_em', 'revisado_em', 'publicado_em', 'criado_em', 'atualizado_em'],
      lancamentos.map((l) => {
        const datas = DATAS[l.numero];
        const enviado = l.status !== 'rascunho' ? datas.enviado : null;
        const revisado = ['devolvido', 'publicado'].includes(l.status) ? datas.revisado : null;
        const publicado = l.status === 'publicado' ? datas.revisado : null;
        return [
          primeiroAlunoId + l.a, primeiraTurmaId + alunos[l.a].turma, primeiraDisciplinaId + l.d,
          primeiroProfessorId + professorDaDisciplina[l.d], primeiroBimestreId + l.b,
          l.descricao, l.media, l.status, l.observacao, revisado ? adminId : null,
          enviado, revisado, publicado, datas.criado, revisado ?? enviado ?? datas.criado
        ];
      }));

    const tagsDosLancamentos = [];
    const historico = [];
    lancamentos.forEach((l, i) => {
      const id = primeiroAcompanhamentoId + i;
      const datas = DATAS[l.numero];
      const usuarioProfessor = usuarioDoProfessor(professorDaDisciplina[l.d]);
      const tagIds = l.tags.map(tagId);
      tagIds.forEach((t) => tagsDosLancamentos.push([id, t]));

      // Retrato do acompanhamento em cada etapa (o mesmo formato usado pela aplicação)
      const retrato = (status, observacaoRevisao = null) =>
        JSON.stringify({ descricao: l.descricao, media: l.media, status, observacaoRevisao, tagIds });

      historico.push(['acompanhamento', id, 'criado', usuarioProfessor, null, retrato('rascunho'), null, datas.criado]);
      if (l.status !== 'rascunho') {
        historico.push(['acompanhamento', id, 'enviado', usuarioProfessor, retrato('rascunho'), retrato('enviado'), null, datas.enviado]);
      }
      if (l.status === 'devolvido') {
        historico.push(['acompanhamento', id, 'devolvido', adminId, retrato('enviado'),
          retrato('devolvido', l.observacao), l.observacao, datas.revisado]);
      }
      if (l.status === 'publicado') {
        historico.push(['acompanhamento', id, 'publicado', adminId, retrato('enviado'), retrato('publicado'), null, datas.revisado]);
      }
    });

    await inserir(conexao, 'acompanhamento_tag', ['acompanhamento_id', 'tag_id'], tagsDosLancamentos);
    await inserir(conexao, 'historico_auditoria',
      ['entidade', 'entidade_id', 'acao', 'usuario_id', 'estado_anterior', 'estado_posterior', 'observacao', 'criado_em'],
      historico);

    console.log('7/7 Ciências e retornos dos responsáveis...');
    const ciencias = [];
    alunos.forEach((aluno, a) => {
      [0, 1, 2].forEach((b) => { // bimestres encerrados
        if (sorte.numero() < 0.7) {
          ciencias.push([
            primeiroResponsavelId + aluno.familia, primeiroAlunoId + a, primeiroBimestreId + b,
            sorte.numero() < 0.3 ? sorte.item(RETORNOS) : null,
            `${DATAS[b + 1].revisado.slice(0, 10)} 18:30:00`
          ]);
        }
      });
    });
    await inserir(conexao, 'ciencias', ['responsavel_id', 'aluno_id', 'bimestre_id', 'retorno', 'registrada_em'], ciencias);

    // Resumo
    const contagem = {};
    lancamentos.forEach((l) => { contagem[l.status] = (contagem[l.status] ?? 0) + 1; });
    console.log('\nPronto! Banco recriado com:');
    console.log(`  ${alunos.length} alunos, ${TURMAS.length} turmas, ${PROFESSORES.length} professores, ${familias.length} responsáveis`);
    console.log(`  ${lancamentos.length} acompanhamentos:`, contagem);
    console.log(`  ${historico.length} registros de histórico, ${ciencias.length} ciências`);
    console.log('\nAcessos (senhas):');
    console.log(`  administrador: admin@escola.com / ${SENHAS.administrador}`);
    console.log(`  professores:   beatriz@escola.com, carlos@escola.com ... / ${SENHAS.professor}`);
    console.log(`  responsáveis:  maria@email.com, jose@email.com ... / ${SENHAS.responsavel}`);
  } finally {
    await conexao.end();
  }
}

main().catch((erro) => {
  console.error('Erro ao carregar os dados:', erro);
  process.exit(1);
});