// No LIKE, % significa "qualquer texto" e _ significa "qualquer caractere".
// Se o usuário digitar esses símbolos na busca, eles devem valer como texto comum.
function escaparLike(texto) {
  return texto.replace(/[\\%_]/g, '\\$&');
}

module.exports = { escaparLike };