// Faz o navegador "baixar" um arquivo recebido da API (PDF, planilha...).
// Cria um link temporário apontando para o arquivo em memória, clica nele e depois o descarta.
export function baixarArquivo(blob, nomeArquivo) {
  const endereco = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = endereco;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(endereco), 1000);
}