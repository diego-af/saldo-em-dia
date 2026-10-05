# 07: Lembretes de vencimento

**What to build:** Avisar o usuário sobre faturas, Parcelas de Dívida e Ocorrências Recorrentes pendentes mesmo quando a janela estiver fechada.

**Blocked by:** 04: Compras, parcelas e faturas do cartão; 05: Dívidas pessoais e parcelas; 06: Salário e compromissos recorrentes.

**Status:** ready-for-agent

- [ ] Um compromisso pendente gera aviso às 9h dois dias antes, um dia antes e no dia do vencimento.
- [ ] Um compromisso vencido continua gerando aviso diário até o pagamento.
- [ ] O usuário pode silenciar os avisos de um compromisso específico.
- [ ] O pagamento interrompe novos avisos do compromisso.
- [ ] O aplicativo permanece em segundo plano quando a janela é fechada.
- [ ] Ao iniciar depois de um período desligado, avisos pendentes são recuperados sem duplicação indevida.
