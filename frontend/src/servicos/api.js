// Cliente da API: todas as telas chamam o backend por aqui.
// Ele envia o token automaticamente e transforma as respostas de erro em mensagens.

// No computador, a API fica em localhost:3001. Na versão publicada (build), API e telas ficam no mesmo endereço.
const URL_API = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:3001');
const CHAVE_TOKEN = 'kfka_token';

// O navegador pode bloquear o armazenamento (aba anônima, por exemplo): por isso o try/catch
export const tokenSalvo = {
  ler() {
    try { return localStorage.getItem(CHAVE_TOKEN); } catch { return null; }
  },
  gravar(token) {
    try { localStorage.setItem(CHAVE_TOKEN, token); } catch { /* sem armazenamento disponível */ }
  },
  apagar() {
    try { localStorage.removeItem(CHAVE_TOKEN); } catch { /* sem armazenamento disponível */ }
  }
};

// Função chamada quando o token vence (o contexto de autenticação define qual é)
let aoExpirarSessao = () => {};
export function definirAoExpirarSessao(funcao) {
  aoExpirarSessao = funcao;
}

export class ErroApi extends Error {
  constructor(status, mensagem) {
    super(mensagem);
    this.status = status;
  }
}

export async function api(caminho, { metodo = 'GET', corpo, resposta = 'json' } = {}) {
  const cabecalhos = {};
  const token = tokenSalvo.ler();
  if (token) cabecalhos.Authorization = `Bearer ${token}`;
  if (corpo !== undefined) cabecalhos['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(`${URL_API}${caminho}`, {
      method: metodo,
      headers: cabecalhos,
      body: corpo !== undefined ? JSON.stringify(corpo) : undefined
    });
  } catch {
    throw new ErroApi(0, 'Não foi possível conectar ao servidor. Verifique se a API está rodando.');
  }

  // Token vencido ou inválido: encerra a sessão e volta para o login
  if (res.status === 401 && token) {
    aoExpirarSessao();
  }

  if (!res.ok) {
    let mensagem = 'Não foi possível concluir. Tente novamente.';
    try {
      const dados = await res.json();
      if (dados.erro) mensagem = dados.erro;
    } catch { /* resposta sem JSON */ }
    throw new ErroApi(res.status, mensagem);
  }

  if (res.status === 204) return null;
  if (resposta === 'arquivo') return res.blob();
  return res.json();
}