// Configuração de cada aba da tela de Cadastros.
// Em vez de escrever 7 telas quase iguais, descrevemos aqui o que muda em cada cadastro
// (endereço da API, colunas da tabela e campos do formulário) e uma única tela usa essas descrições.
// feminino: true faz os textos virarem "Nova disciplina", "cadastrada" etc.
import { ANO_LETIVO, NOME_DO_TURNO } from '../../utils/formatar';

// "2015-12-06" -> "06/12/2015"
const dataBR = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('/') : '—');

// "11987654321" -> "(11) 98765-4321"
function telefoneBR(digitos) {
  if (!digitos) return '—';
  const meio = digitos.length === 11 ? 7 : 6;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, meio)}-${digitos.slice(meio)}`;
}

const TURNOS = Object.entries(NOME_DO_TURNO).map(([valor, rotulo]) => ({ valor, rotulo }));
const ANOS_SERIE = Array.from({ length: 9 }, (_, i) => ({ valor: String(i + 1), rotulo: `${i + 1}º ano` }));

const CAMPO_SENHA = {
  nome: 'senha', rotulo: 'Senha inicial', tipo: 'password', obrigatorio: true, somenteNovo: true,
  dica: 'De 8 a 72 caracteres, com letra e número. A pessoa pode trocar depois em "Esqueci minha senha".'
};

export const CADASTROS = [
  {
    aba: 'alunos', titulo: 'Alunos', singular: 'aluno', endereco: '/alunos', paginado: true,
    colunas: [
      { rotulo: 'Nome', valor: (i) => i.nome, destaque: true },
      { rotulo: 'Matrícula', valor: (i) => i.matricula },
      { rotulo: 'Nascimento', valor: (i) => dataBR(i.dataNascimento) }
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome completo', obrigatorio: true, exemplo: 'Ex.: Lucas Oliveira' },
      { nome: 'dataNascimento', rotulo: 'Data de nascimento', tipo: 'date', obrigatorio: true },
      { nome: 'matricula', rotulo: 'Matrícula', obrigatorio: true, exemplo: 'Ex.: 2026025' }
    ]
  },
  {
    aba: 'professores', titulo: 'Professores', singular: 'professor', endereco: '/professores', paginado: true,
    colunas: [
      { rotulo: 'Nome', valor: (i) => i.nome, destaque: true },
      { rotulo: 'E-mail', valor: (i) => i.email },
      { rotulo: 'Registro', valor: (i) => i.registroFuncional }
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome completo', obrigatorio: true },
      { nome: 'email', rotulo: 'E-mail (login)', tipo: 'email', obrigatorio: true },
      { nome: 'registroFuncional', rotulo: 'Registro funcional', obrigatorio: true, exemplo: 'Ex.: PROF006' },
      CAMPO_SENHA
    ]
  },
  {
    aba: 'responsaveis', titulo: 'Responsáveis', singular: 'responsável', endereco: '/responsaveis', paginado: true,
    colunas: [
      { rotulo: 'Nome', valor: (i) => i.nome, destaque: true },
      { rotulo: 'E-mail', valor: (i) => i.email },
      { rotulo: 'Telefone', valor: (i) => telefoneBR(i.telefone) }
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome completo', obrigatorio: true },
      { nome: 'email', rotulo: 'E-mail (login)', tipo: 'email', obrigatorio: true },
      { nome: 'telefone', rotulo: 'Telefone (opcional)', tipo: 'tel', exemplo: '(11) 98765-4321' },
      CAMPO_SENHA
    ],
    paraFormulario: (i) => ({ ...i, telefone: i.telefone ? telefoneBR(i.telefone) : '' }),
    paraCorpo: (v) => ({ ...v, telefone: v.telefone?.trim() || null }),
    detalhe: { rotulo: 'Alunos vinculados', link: (i) => `/admin/responsaveis/${i.id}` }
  },
  {
    aba: 'areas', titulo: 'Áreas', singular: 'área', feminino: true, endereco: '/areas',
    colunas: [{ rotulo: 'Área de disciplina', valor: (i) => i.nome, destaque: true }],
    campos: [{ nome: 'nome', rotulo: 'Nome da área', obrigatorio: true, exemplo: 'Ex.: Linguagens e Códigos' }]
  },
  {
    aba: 'disciplinas', titulo: 'Disciplinas', singular: 'disciplina', feminino: true, endereco: '/disciplinas',
    colunas: [
      { rotulo: 'Disciplina', valor: (i) => i.nome, destaque: true },
      { rotulo: 'Área', valor: (i) => i.area?.nome ?? '—' }
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome da disciplina', obrigatorio: true },
      { nome: 'areaId', rotulo: 'Área', tipo: 'select', obrigatorio: true, opcoesDe: '/areas' }
    ],
    paraFormulario: (i) => ({ nome: i.nome, areaId: String(i.area?.id ?? '') }),
    paraCorpo: (v) => ({ nome: v.nome, areaId: Number(v.areaId) })
  },
  {
    aba: 'turmas', titulo: 'Turmas', singular: 'turma', feminino: true, endereco: '/turmas', enderecoLista: `/turmas?anoLetivo=${ANO_LETIVO}`,
    colunas: [
      { rotulo: 'Turma', valor: (i) => i.nome, destaque: true },
      { rotulo: 'Turno', valor: (i) => NOME_DO_TURNO[i.turno] },
      { rotulo: 'Ano letivo', valor: (i) => i.anoLetivo }
    ],
    campos: [
      { nome: 'anoSerie', rotulo: 'Ano / série', tipo: 'select', obrigatorio: true, opcoes: ANOS_SERIE },
      { nome: 'identificacao', rotulo: 'Identificação', obrigatorio: true, exemplo: 'Ex.: A' },
      { nome: 'turno', rotulo: 'Turno', tipo: 'select', obrigatorio: true, opcoes: TURNOS },
      { nome: 'anoLetivo', rotulo: 'Ano letivo', tipo: 'number', obrigatorio: true, padrao: String(ANO_LETIVO) }
    ],
    paraFormulario: (i) => ({ ...i, anoSerie: String(i.anoSerie), anoLetivo: String(i.anoLetivo) }),
    paraCorpo: (v) => ({ ...v, anoSerie: Number(v.anoSerie), anoLetivo: Number(v.anoLetivo) }),
    detalhe: { rotulo: 'Alunos e disciplinas', link: (i) => `/admin/turmas/${i.id}` }
  },
  {
    aba: 'tags', titulo: 'Tags', singular: 'tag', feminino: true, endereco: '/tags',
    colunas: [
      { rotulo: 'Tag', valor: (i) => i.nome, destaque: true },
      { rotulo: 'Descrição', valor: (i) => i.descricao ?? '—' }
    ],
    campos: [
      { nome: 'nome', rotulo: 'Nome da tag', obrigatorio: true, exemplo: 'Ex.: Participativo' },
      { nome: 'descricao', rotulo: 'Descrição (opcional)', exemplo: 'Ex.: Contribui com frequência nas aulas' }
    ],
    paraCorpo: (v) => ({ nome: v.nome, descricao: v.descricao?.trim() || null })
  }
];