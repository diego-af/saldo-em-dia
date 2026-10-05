# 02: Saldo inicial e lançamentos manuais

**What to build:** Permitir que o usuário comece o controle financeiro, registre entradas e saídas e consulte o Saldo Disponível calculado a partir dos registros confirmados.

**Blocked by:** 01: Aplicativo desktop e persistência segura.

**Status:** ready-for-agent

- [ ] O usuário informa Saldo Inicial e data de início do controle.
- [ ] O usuário cria, renomeia e desativa Categoria Financeira e Instituição Financeira sem alterar o histórico.
- [ ] O usuário registra Receita Avulsa ou despesa como prevista ou confirmada, com descrição e observação opcionais.
- [ ] Apenas recebimentos e pagamentos confirmados alteram o Saldo Disponível; valores previstos afetam somente projeções.
- [ ] A interface usa reais brasileiros e apresenta validações acessíveis em português.
- [ ] Testes cobrem o cálculo de saldo e a persistência das operações principais em SQLite.
