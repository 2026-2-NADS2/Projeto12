const ExcelJS = require('exceljs');

// Colunas da planilha, na ordem em que aparecem
const COLUNAS = [
  { header: 'Aluno', key: 'aluno', width: 28 },
  { header: 'Matrícula', key: 'matricula', width: 12 },
  { header: 'Turma', key: 'turma', width: 12 },
  { header: 'Disciplina', key: 'disciplina', width: 22 },
  { header: 'Professor(a)', key: 'professor', width: 22 },
  { header: 'Bimestre', key: 'bimestre', width: 22 },
  { header: 'Média', key: 'media', width: 8 },
  { header: 'Status', key: 'status', width: 12 },
  { header: 'Tags', key: 'tags', width: 30 },
  { header: 'Descrição', key: 'descricao', width: 60 },
  { header: 'Publicado em', key: 'publicadoEm', width: 18 },
  { header: 'Ciências registradas', key: 'ciencias', width: 12 }
];

function formatarData(data) {
  return data ? new Date(data).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : '';
}

// Gera a exportação compatível com Excel (RF11)
class ExportadorPlanilha {
  async xlsx(linhas) {
    const pasta = new ExcelJS.Workbook();
    pasta.creator = 'KFKA';
    const aba = pasta.addWorksheet('Acompanhamentos');

    aba.columns = COLUNAS;
    aba.getRow(1).font = { bold: true };
    aba.views = [{ state: 'frozen', ySplit: 1 }];             // cabeçalho fixo ao rolar
    aba.autoFilter = { from: 'A1', to: 'L1' };                 // filtros no cabeçalho

    for (const linha of linhas) {
      aba.addRow({ ...linha, publicadoEm: formatarData(linha.publicadoEm) });
    }
    aba.getColumn('media').numFmt = '0.0';
    aba.getColumn('descricao').alignment = { wrapText: true, vertical: 'top' };

    return pasta.xlsx.writeBuffer();
  }

  csv(linhas) {
    // Campos com ; aspas ou quebra de linha vão entre aspas (regra do formato CSV)
    const escapar = (valor) => {
      const texto = valor === null || valor === undefined ? '' : String(valor);
      return /[";\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    };

    const cabecalho = COLUNAS.map((c) => c.header).join(';');
    const corpo = linhas.map((linha) => COLUNAS.map((c) => {
      if (c.key === 'media') return linha.media.toFixed(1).replace('.', ',');
      if (c.key === 'publicadoEm') return formatarData(linha.publicadoEm);
      return escapar(linha[c.key]);
    }).join(';'));

    // \uFEFF (BOM) faz o Excel reconhecer os acentos (UTF-8)
    return '\uFEFF' + [cabecalho, ...corpo].join('\r\n');
  }
}

module.exports = ExportadorPlanilha;