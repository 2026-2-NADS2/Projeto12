import { useCallback, useEffect, useState } from 'react';

// Gancho (hook) para buscar dados da API ao abrir uma tela.
// Devolve { dados, carregando, erro, recarregar }.
// "chave": quando muda (ex.: o bimestre escolhido), a busca é refeita.
export function useCarregar(carregar, chave = '') {
  const [versao, setVersao] = useState(0);
  const pedido = `${chave}#${versao}`;
  const [resultado, setResultado] = useState({ pedido: null, dados: null, erro: '' });

  useEffect(() => {
    let ativo = true; // evita gravar a resposta se a tela já foi fechada
    carregar()
      .then((dados) => { if (ativo) setResultado({ pedido, dados, erro: '' }); })
      .catch((falha) => { if (ativo) setResultado({ pedido, dados: null, erro: falha.message }); });
    return () => { ativo = false; };
    // A função "carregar" muda a cada renderização; quem decide quando buscar de novo é o "pedido"
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);

  const recarregar = useCallback(() => setVersao((v) => v + 1), []);
  const atualizando = resultado.pedido !== pedido;
  // Só mostra "Carregando…" na primeira busca; ao recarregar, os dados antigos ficam na tela até chegar a resposta
  const carregando = atualizando && resultado.dados === null;

  return { dados: resultado.dados, carregando, atualizando, erro: atualizando ? '' : resultado.erro, recarregar };
}