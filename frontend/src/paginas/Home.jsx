import { Link } from 'react-router-dom';
import {
  ArrowRight, Bell, CalendarDays, Check, CheckCircle2, ClipboardList, Download, FileDown,
  GraduationCap, HeartHandshake, Lock, LogIn, ShieldCheck, Smartphone, UserCog, Users, ClipboardCheck
} from 'lucide-react';
import './Home.css';

// Página inicial pública (antes do login)
const NUMEROS = [
  { icone: Users, titulo: '3 perfis de acesso', texto: 'Escola, professor e família' },
  { icone: CalendarDays, titulo: '4 bimestres', texto: 'Com períodos de lançamento' },
  { icone: FileDown, titulo: 'PDF em um clique', texto: 'Relatório pronto para guardar' },
  { icone: Smartphone, titulo: '100% responsivo', texto: 'Computador, tablet e celular' }
];

const PASSOS = [
  { titulo: 'Professor registra', texto: 'Escreve a descrição, informa a média e marca as tags de cada aluno, dentro do período do bimestre.', selo: 'Rascunho', tipo: 'cinza' },
  { titulo: 'Envia para revisão', texto: 'Quando termina, envia o registro para a administração da escola.', selo: 'Enviado', tipo: 'azul' },
  { titulo: 'Escola revisa', texto: 'A administração confere, ajusta se precisar, devolve para correção ou publica. Tudo fica no histórico.', selo: 'Em revisão', tipo: 'amarelo' },
  { titulo: 'Família acompanha', texto: 'O responsável vê o relatório publicado, registra ciência e baixa o PDF.', selo: 'Publicado', tipo: 'verde' }
];

const PERFIS = [
  { icone: UserCog, titulo: 'Administração', texto: 'Organiza a estrutura da escola e garante a qualidade das informações publicadas.',
    itens: ['Cadastros de alunos, turmas, professores e tags', 'Abertura e encerramento dos bimestres', 'Revisão e publicação com histórico', 'Relatórios e exportação para Excel'] },
  { icone: ClipboardList, titulo: 'Professor', destaque: true, texto: 'Registra o desenvolvimento dos alunos de forma rápida e organizada.',
    itens: ['Vê só as suas turmas e disciplinas', 'Descrição, média e várias tags por aluno', 'Salva rascunho e envia quando quiser', 'Acompanha devoluções e retornos das famílias'] },
  { icone: HeartHandshake, titulo: 'Pais e responsáveis', texto: 'Acompanham a vida escolar dos filhos com clareza e de onde estiverem.',
    itens: ['Relatórios por bimestre e disciplina', 'Mais de um filho na mesma conta', 'Registro de ciência e observações', 'Download do relatório em PDF'] }
];

const SEGURANCA = [
  { icone: ShieldCheck, titulo: 'De acordo com a LGPD', texto: 'Coletamos só os dados necessários e mostramos cada informação apenas a quem tem vínculo com o aluno.' },
  { icone: Lock, titulo: 'Acesso protegido', texto: 'Senhas criptografadas, sessões que expiram e permissões separadas para cada perfil.' },
  { icone: ClipboardCheck, titulo: 'Tudo rastreável', texto: 'Cada alteração e publicação fica registrada com o autor, a data e o que mudou.' }
];

const NOTAS = [
  { disciplina: 'Matemática', tags: ['Evolução', 'Participativo'], media: '8,5' },
  { disciplina: 'Língua Portuguesa', tags: ['Leitura fluente'], media: '9,0' },
  { disciplina: 'Ciências', tags: ['Atenção às entregas'], media: '6,0', baixa: true }
];

function Marca() {
  return (
    <span className="home-marca" aria-label="KFKA">
      <span className="home-marca-simbolo"><b>[</b>K<i>&lt;</i><b>]</b></span>
      <span className="home-marca-nome">K F K <i>Λ</i></span>
    </span>
  );
}

export default function Home() {
  return (
    <div className="home">
      <header className="home-topo home-container">
        <Marca />
        <nav className="home-menu" aria-label="Seções">
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-quem">Para quem é</a>
          <a href="#seguranca">Segurança</a>
        </nav>
        <Link to="/login" className="home-botao home-botao-primario home-botao-pequeno">
          <LogIn size={16} aria-hidden="true" /> Entrar
        </Link>
      </header>

      <section className="home-hero home-container">
        <div className="home-hero-texto">
          <span className="home-etiqueta"><GraduationCap size={15} aria-hidden="true" /> Plataforma de acompanhamento escolar</span>
          <h1>Acompanhe o desenvolvimento do aluno <span className="home-destaque">a cada bimestre</span></h1>
          <p className="home-lead">
            Professores registram, a escola revisa e publica, e a família consulta e baixa o relatório em PDF.
            Tudo em um só lugar, no computador ou no celular.
          </p>
          <div className="home-acoes">
            <Link to="/login" className="home-botao home-botao-primario">Acessar a plataforma <ArrowRight size={18} aria-hidden="true" /></Link>
            <a href="#como-funciona" className="home-botao home-botao-contorno">Ver como funciona</a>
          </div>
          <p className="home-aviso"><Lock size={14} aria-hidden="true" /> O acesso é feito com o e-mail e a senha fornecidos pela escola.</p>
        </div>

        {/* Ilustração: um relatório de exemplo */}
        <div className="home-vitrine" aria-hidden="true">
          <div className="home-flutuante home-flutuante-topo">
            <span className="home-flutuante-icone"><Bell size={18} /></span>
            <span><strong>Novo relatório publicado</strong><small>2º bimestre disponível</small></span>
          </div>
          <div className="home-relatorio">
            <div className="home-relatorio-topo">
              <span className="home-avatar">A</span>
              <span className="home-relatorio-aluno"><strong>Ana Beatriz Souza</strong><small>5º ano A · 2º bimestre · 2026</small></span>
              <span className="home-selo home-selo-verde">Publicado</span>
            </div>
            {NOTAS.map((n) => (
              <div key={n.disciplina} className="home-nota">
                <div>
                  <strong>{n.disciplina}</strong>
                  <div className="home-tags">{n.tags.map((t) => <span key={t} className="home-tag">{t}</span>)}</div>
                </div>
                <span className={`home-media ${n.baixa ? 'home-media-baixa' : ''}`}>{n.media}</span>
              </div>
            ))}
            <div className="home-relatorio-acoes">
              <span className="home-botao home-botao-contorno home-botao-mini">Registrar ciência</span>
              <span className="home-botao home-botao-primario home-botao-mini"><Download size={14} /> Baixar PDF</span>
            </div>
          </div>
          <div className="home-flutuante home-flutuante-base">
            <span className="home-flutuante-icone home-flutuante-verde"><CheckCircle2 size={18} /></span>
            <span><strong>Ciência registrada</strong><small>Responsável · hoje, 14:32</small></span>
          </div>
        </div>
      </section>

      <section className="home-faixa">
        {NUMEROS.map(({ icone: Icone, titulo, texto }) => (
          <div key={titulo} className="home-faixa-item">
            <Icone size={22} strokeWidth={1.6} aria-hidden="true" />
            <span><strong>{titulo}</strong><small>{texto}</small></span>
          </div>
        ))}
      </section>

      <section id="como-funciona" className="home-secao home-container">
        <p className="home-sobretitulo">Como funciona</p>
        <h2>Do registro do professor ao relatório da família</h2>
        <p className="home-secao-lead">Cada acompanhamento passa pela revisão da escola antes de chegar aos responsáveis, o que garante informação correta e uma comunicação oficial.</p>
        <div className="home-grade-4">
          {PASSOS.map((passo, i) => (
            <article key={passo.titulo} className="home-cartao">
              <span className="home-numero">{i + 1}</span>
              <h3>{passo.titulo}</h3>
              <p>{passo.texto}</p>
              <span className={`home-selo home-selo-${passo.tipo}`}>{passo.selo}</span>
            </article>
          ))}
        </div>
      </section>

      <section id="para-quem" className="home-secao home-container">
        <p className="home-sobretitulo">Para quem é</p>
        <h2>Um espaço pensado para cada perfil</h2>
        <p className="home-secao-lead">Cada pessoa vê apenas o que precisa, com permissões separadas para a escola, os professores e as famílias.</p>
        <div className="home-grade-3">
          {PERFIS.map(({ icone: Icone, titulo, texto, itens, destaque }) => (
            <article key={titulo} className={`home-cartao home-perfil ${destaque ? 'home-perfil-destaque' : ''}`}>
              <span className="home-icone"><Icone size={20} strokeWidth={1.7} aria-hidden="true" /></span>
              <h3>{titulo}</h3>
              <p>{texto}</p>
              <ul>
                {itens.map((item) => <li key={item}><Check size={16} aria-hidden="true" /> {item}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="seguranca" className="home-secao home-container">
        <p className="home-sobretitulo">Segurança e privacidade</p>
        <h2>Dados de crianças tratados com cuidado</h2>
        <div className="home-grade-3">
          {SEGURANCA.map(({ icone: Icone, titulo, texto }) => (
            <article key={titulo} className="home-cartao home-seguranca">
              <span className="home-icone"><Icone size={20} strokeWidth={1.7} aria-hidden="true" /></span>
              <div><h3>{titulo}</h3><p>{texto}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section className="home-container">
        <div className="home-chamada">
          <div>
            <h2>Já recebeu seu acesso da escola?</h2>
            <p>Entre com o e-mail cadastrado pela secretaria e veja os acompanhamentos publicados.</p>
          </div>
          <Link to="/login" className="home-botao home-botao-primario">Acessar a plataforma <ArrowRight size={18} aria-hidden="true" /></Link>
        </div>
      </section>

      <footer className="home-rodape home-container">
        <div className="home-rodape-marca">
          <span className="home-marca-simbolo"><b>[</b>K<i>&lt;</i><b>]</b></span>
          <small>© 2026 KFKA · Projeto Interdisciplinar · ADS · FECAP</small>
        </div>
        <nav aria-label="Rodapé">
          <a href="#como-funciona">Como funciona</a>
          <a href="#para-quem">Para quem é</a>
          <a href="#seguranca">Privacidade</a>
          <Link to="/login">Entrar</Link>
        </nav>
      </footer>
    </div>
  );
}
