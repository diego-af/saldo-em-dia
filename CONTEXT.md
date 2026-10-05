# Gestão Financeira Pessoal

Este contexto representa as finanças pessoais que o usuário informa e acompanha no aplicativo.

## Language

**Lançamento**:
Registro financeiro informado manualmente pelo usuário, representando uma entrada ou uma saída de dinheiro.
_Avoid_: Transação bancária, movimentação sincronizada

**Receita Avulsa**:
Entrada de dinheiro esperada ou recebida que não se repete segundo uma frequência definida.
_Avoid_: Receita recorrente, empréstimo

**Receita Recorrente**:
Entrada de dinheiro que se repete segundo uma frequência definida, como salário ou pagamento mensal.
_Avoid_: Receita avulsa

**Salário**:
Receita recorrente mensal de valor previsto fixo, alterada manualmente quando houver mudança e confirmada quando for recebida.
_Avoid_: Receita avulsa, saldo inicial

**Receita Prevista**:
Receita ainda não recebida que integra o saldo projetado, mas não o saldo disponível.
_Avoid_: Receita recebida, saldo disponível

**Categoria Financeira**:
Classificação editável usada para agrupar receitas e despesas em consultas e relatórios, preservada no histórico quando desativada.
_Avoid_: Instituição financeira, descrição

**Saldo Disponível**:
Valor único que representa todo o dinheiro atualmente disponível ao usuário, sem separação por banco, conta ou dinheiro em espécie.
_Avoid_: Saldo consolidado, saldo por conta

**Saldo Inicial**:
Valor do dinheiro disponível informado pelo usuário na data em que inicia o controle financeiro, sem exigir o cadastro do histórico anterior.
_Avoid_: Receita, entrada

**Instituição Financeira**:
Banco, banco digital ou operadora usado para identificar a origem de uma despesa e permitir sua organização em relatórios; não possui saldo próprio.
_Avoid_: Conta financeira, conta bancária

**Compra no Cartão**:
Despesa que cria uma obrigação futura no cartão de crédito e não reduz o saldo disponível no momento da compra.
_Avoid_: Saída paga, pagamento

**Compra Parcelada**:
Compra no cartão cujo valor total é dividido em uma quantidade definida de parcelas distribuídas por faturas futuras.
_Avoid_: Despesa recorrente, dívida pessoal

**Cartão de Crédito**:
Meio de pagamento vinculado a uma instituição financeira, com compras, parcelas e faturas próprias.
_Avoid_: Instituição financeira, conta financeira

**Limite Disponível**:
Parcela do limite total do cartão que ainda pode ser utilizada, descontados os valores comprometidos por compras ainda não liberadas.
_Avoid_: Saldo disponível

**Fatura**:
Conjunto de compras e demais encargos de um cartão que devem ser pagos em um vencimento determinado.
_Avoid_: Despesa avulsa, cartão

**Fechamento da Fatura**:
Data mensal que encerra as compras de uma fatura; compras posteriores pertencem à fatura seguinte.
_Avoid_: Vencimento da fatura

**Vencimento da Fatura**:
Data limite mensal para pagamento de uma fatura.
_Avoid_: Fechamento da fatura

**Pagamento de Fatura**:
Quitação integral de uma fatura que reduz o saldo disponível pelo valor pago.
_Avoid_: Compra no cartão

**Saldo Projetado**:
Estimativa do dinheiro que permanecerá disponível depois de considerar entradas, saídas e obrigações futuras conhecidas.
_Avoid_: Saldo disponível

**Gasto por Compra**:
Visão das despesas na data em que foram assumidas e em sua categoria, independentemente de quando o dinheiro será pago.
_Avoid_: Fluxo de caixa, pagamento

**Fluxo de Caixa**:
Visão das entradas e saídas nas datas em que o dinheiro efetivamente altera o saldo disponível.
_Avoid_: Gasto por compra, saldo projetado

**Meta Financeira**:
Objetivo de alcançar um valor mínimo de saldo disponível até uma data definida.
_Avoid_: Saldo projetado, limite de gasto

**Limite de Gasto da Meta**:
Valor máximo que pode ser gasto em um período sem impedir a meta financeira, consideradas as receitas previstas e as obrigações conhecidas.
_Avoid_: Limite do cartão, saldo disponível

**Impacto na Meta**:
Efeito de uma nova despesa ou alteração financeira sobre a possibilidade de atingir a meta, apresentado sem impedir o lançamento.
_Avoid_: Bloqueio de gasto, limite do cartão

**Dívida Pessoal**:
Obrigação do usuário de devolver dinheiro a outra pessoa, acompanhada por seu valor, parcelas, vencimentos e pagamentos, sem representar o cartão dessa pessoa.
_Avoid_: Cartão de terceiro, fatura de terceiro

**Pessoa Credora**:
Pessoa para quem o usuário deve pagar uma dívida pessoal.
_Avoid_: Banco, instituição financeira

**Parcela de Dívida**:
Parte de uma dívida pessoal com valor e vencimento próprios, que pode estar pendente, paga ou atrasada.
_Avoid_: Parcela do cartão, fatura

**Parcela Atrasada**:
Parcela de dívida cujo vencimento passou sem que um pagamento tenha sido registrado.
_Avoid_: Parcela pendente

**Despesa Recorrente**:
Compromisso que se repete em uma frequência definida e gera ocorrências com vencimento e situação próprios.
_Avoid_: Compra parcelada, despesa avulsa

**Ocorrência Recorrente**:
Vencimento individual gerado por uma despesa recorrente, que permanece pendente até ser pago e pode ficar atrasado.
_Avoid_: Despesa recorrente, parcela de dívida

**Lembrete de Vencimento**:
Aviso sobre uma parcela, fatura ou ocorrência recorrente que está próxima do vencimento ou continua pendente depois dele.
_Avoid_: Despesa, vencimento
