# 04: Compras, parcelas e faturas do cartão

**What to build:** Gerenciar o Cartão de Crédito próprio do usuário, desde a Compra no Cartão até o Pagamento de Fatura, preservando a diferença entre gasto assumido e Fluxo de Caixa.

**Blocked by:** 03: Correções, histórico e Lixeira.

**Status:** ready-for-agent

- [ ] O usuário cadastra cartão com instituição, limite total, dia de fechamento e dia de vencimento.
- [ ] Uma compra é incluída na fatura correta segundo sua data e o Fechamento da Fatura.
- [ ] Uma Compra Parcelada preserva o valor total em centavos e distribui as parcelas nas faturas futuras.
- [ ] Limite comprometido e Limite Disponível refletem compras ainda não liberadas.
- [ ] A compra não reduz o Saldo Disponível; somente o Pagamento de Fatura integral reduz o saldo.
- [ ] Relatórios futuros conseguem distinguir Compra no Cartão de Pagamento de Fatura sem duplicar a despesa.
- [ ] Testes cobrem fechamento, vencimento, parcelas, centavos, limite e pagamento integral.
