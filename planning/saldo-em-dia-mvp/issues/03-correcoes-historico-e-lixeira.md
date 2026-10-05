# 03: Correções, histórico e Lixeira

**What to build:** Permitir corrigir e excluir registros financeiros sem perder rastreabilidade nem deixar saldos e projeções inconsistentes.

**Blocked by:** 02: Saldo inicial e lançamentos manuais.

**Status:** ready-for-agent

- [ ] Um lançamento confirmado pode ser corrigido após um aviso explícito sobre o recálculo financeiro.
- [ ] Cada correção registra os dados necessários para identificar o que mudou e quando mudou.
- [ ] A exclusão envia o item à Lixeira sem removê-lo imediatamente.
- [ ] Um item pode ser restaurado durante 10 dias e volta a participar dos cálculos corretamente.
- [ ] Itens vencidos na Lixeira são removidos definitivamente sem deixar referências inválidas.
- [ ] Saldo, projeções e consultas são recalculados depois de correção, exclusão ou restauração.
