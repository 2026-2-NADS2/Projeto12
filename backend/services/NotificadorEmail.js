// Envio de e-mails do sistema.
// Em desenvolvimento, o "e-mail" é mostrado no console do servidor.
// Para enviar de verdade, troca-se só a implementação deste método
// (por exemplo, com a biblioteca nodemailer e um servidor SMTP).
class NotificadorEmail {
  async enviarRecuperacaoSenha({ para, nome, link, validadeMinutos }) {
    console.log([
      '',
      '========== E-MAIL (simulado) ==========',
      `Para: ${para}`,
      'Assunto: KFKA – Recuperação de senha',
      '',
      `Olá, ${nome}.`,
      `Para criar uma nova senha, acesse o link abaixo (válido por ${validadeMinutos} minutos):`,
      link,
      '',
      'Se você não pediu a recuperação, ignore esta mensagem.',
      '========================================',
      ''
    ].join('\n'));
  }
}

module.exports = NotificadorEmail;