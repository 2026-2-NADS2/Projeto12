// Funções de apoio para datas e bimestres.
// A API manda datas em UTC; aqui elas viram horário de Brasília.

const FUSO = 'America/Sao_Paulo';

export const ANO_LETIVO = new Date().getFullYear();

const formatoData = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit' });
const formatoDataAno = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, day: '2-digit', month: '2-digit', year: 'numeric' });
const formatoHora = new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, hour: '2-digit', minute: '2-digit' });

// "18/12"
export function formatarData(iso) {
  return iso ? formatoData.format(new Date(iso)) : '—';
}

// "18/12/2026"
export function formatarDataAno(iso) {
  return iso ? formatoDataAno.format(new Date(iso)) : '—';
}

// "18/12 às 23:59"
export function formatarDataHora(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  return `${formatoData.format(data)} às ${formatoHora.format(data)}`;
}

// Quantos dias faltam até a data (arredonda para cima; nunca negativo)
export function diasAte(iso) {
  const diferenca = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diferenca / 86_400_000));
}

// Quanto do período já passou, de 0 a 100 (para a barra de progresso)
export function progressoDoPeriodo(inicioIso, fimIso) {
  const inicio = new Date(inicioIso).getTime();
  const fim = new Date(fimIso).getTime();
  const agora = Date.now();
  if (agora <= inicio) return 0;
  if (agora >= fim) return 100;
  return Math.round(((agora - inicio) / (fim - inicio)) * 100);
}

// Escolhe o bimestre "da vez": o aberto; se não houver, o último que já começou; senão o primeiro
export function bimestreAtual(bimestres) {
  if (!bimestres?.length) return null;
  const aberto = bimestres.find((b) => b.situacao === 'aberto');
  if (aberto) return aberto;
  const encerrados = bimestres.filter((b) => b.situacao === 'encerrado');
  return encerrados.at(-1) ?? bimestres[0];
}

// "Beatriz Santos" -> "Beatriz"
export function primeiroNome(nome = '') {
  return nome.trim().split(/\s+/)[0];
}

export const NOME_DO_TURNO = { manha: 'manhã', tarde: 'tarde', integral: 'integral' };


// "18/12/2026 às 23:59"
export function formatarDataHoraAno(iso) {
  if (!iso) return '—';
  const data = new Date(iso);
  return `${formatoDataAno.format(data)} às ${formatoHora.format(data)}`;
}