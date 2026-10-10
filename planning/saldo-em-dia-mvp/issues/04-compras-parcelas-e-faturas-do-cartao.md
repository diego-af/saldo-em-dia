# 04: Compras, parcelas e faturas do cartão

**What to build:** Gerenciar o Cartão de Crédito próprio do usuário, desde a Compra no Cartão até o Pagamento de Fatura, preservando a diferença entre gasto assumido e Fluxo de Caixa.

**Blocked by:** 03: Correções, histórico e Lixeira.

**Status:** resolved

- [x] O usuário cadastra cartão com instituição, limite total, dia de fechamento e dia de vencimento.
- [x] Uma compra é incluída na fatura correta segundo sua data e o Fechamento da Fatura.
- [x] Uma Compra Parcelada preserva o valor total em centavos e distribui as parcelas nas faturas futuras.
- [x] Limite comprometido e Limite Disponível refletem compras ainda não liberadas.
- [x] A compra não reduz o Saldo Disponível; somente o Pagamento de Fatura integral reduz o saldo.
- [x] Relatórios futuros conseguem distinguir Compra no Cartão de Pagamento de Fatura sem duplicar a despesa.
- [x] Testes cobrem fechamento, vencimento, parcelas, centavos, limite e pagamento integral.

## Answer

O cartão próprio pode ser cadastrado e receber compras à vista ou parceladas. As parcelas preservam
os centavos e são atribuídas às faturas pelo fechamento e vencimento configurados. Compras
comprometem o limite sem alterar o caixa; somente o pagamento integral registrado separadamente
reduz o Saldo Disponível e libera o limite correspondente.
