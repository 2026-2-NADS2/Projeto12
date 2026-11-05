const PDFDocument = require('pdfkit');

// Gera o PDF do relatório de acompanhamento (RF09) e devolve o arquivo em memória
class GeradorPdf {
  relatorioDoAluno({ aluno, turma, anoLetivo, bimestre, disciplinas }) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });

      // O pdfkit entrega o arquivo em pedaços; juntamos tudo num único Buffer
      const partes = [];
      doc.on('data', (parte) => partes.push(parte));
      doc.on('end', () => resolve(Buffer.concat(partes)));
      doc.on('error', reject);

      // Cabeçalho
      doc.fontSize(18).fillColor('#0369a1').text('KFKA – Relatório de Acompanhamento', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(11).fillColor('#555').text(`${bimestre.nome} de ${anoLetivo}`, { align: 'center' });
      doc.moveDown();

      doc.fillColor('black').fontSize(11);
      doc.text(`Aluno(a): ${aluno.nome}`);
      doc.text(`Matrícula: ${aluno.matricula}`);
      doc.text(`Turma: ${turma ?? 'não informada'}`);
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
      doc.moveDown();

      // Uma seção por disciplina
      for (const item of disciplinas) {
        const media = item.media.toFixed(1).replace('.', ',');
        doc.fontSize(13).fillColor('black').text(`${item.disciplina}  —  média ${media}`);
        doc.fontSize(9).fillColor('#555').text(`Professor(a): ${item.professor}`);
        if (item.tags.length > 0) {
          doc.text(`Tags: ${item.tags.map((t) => t.nome).join(', ')}`);
        }
        doc.moveDown(0.3);
        doc.fontSize(11).fillColor('black').text(item.descricao, { align: 'justify' });
        doc.moveDown();
      }

      // Rodapé com data e hora de Brasília
      const geradoEm = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      doc.moveDown();
      doc.fontSize(8).fillColor('#777').text(`Documento gerado em ${geradoEm}.`, { align: 'right' });

      doc.end();
    });
  }
}

module.exports = GeradorPdf;