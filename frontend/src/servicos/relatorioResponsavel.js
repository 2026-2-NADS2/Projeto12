import { api } from './api';

// Busca o relatório publicado de um aluno num bimestre.
// Se ainda não houver nada publicado, a API responde 404: aqui isso vira null (não é erro para a tela).
export async function buscarRelatorio(alunoId, anoLetivo, numero) {
  try {
    return await api(`/responsavel/alunos/${alunoId}/relatorio?anoLetivo=${anoLetivo}&bimestre=${numero}`);
  } catch (falha) {
    if (falha.status === 404) return null;
    throw falha;
  }
}