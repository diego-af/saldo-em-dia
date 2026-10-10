# 03: Correções, histórico e Lixeira

**What to build:** Permitir corrigir e excluir registros financeiros sem perder rastreabilidade nem deixar saldos e projeções inconsistentes.

**Blocked by:** 02: Saldo inicial e lançamentos manuais.

**Status:** resolved

- [x] Um lançamento confirmado pode ser corrigido após um aviso explícito sobre o recálculo financeiro.
- [x] Cada correção registra os dados necessários para identificar o que mudou e quando mudou.
- [x] A exclusão envia o item à Lixeira sem removê-lo imediatamente.
- [x] Um item pode ser restaurado durante 10 dias e volta a participar dos cálculos corretamente.
- [x] Itens vencidos na Lixeira são removidos definitivamente sem deixar referências inválidas.
- [x] Saldo, projeções e consultas são recalculados depois de correção, exclusão ou restauração.

## Answer

Lançamentos podem ser corrigidos com aviso explícito e histórico contendo os valores anteriores,
novos e o instante da mudança. Exclusões são lógicas, deixam de participar imediatamente dos
cálculos e podem ser restauradas por 10 dias; depois desse prazo, o lançamento e suas revisões são
removidos em uma única transação.
