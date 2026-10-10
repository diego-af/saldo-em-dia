# 02: Saldo inicial e lançamentos manuais

**What to build:** Permitir que o usuário comece o controle financeiro, registre entradas e saídas e consulte o Saldo Disponível calculado a partir dos registros confirmados.

**Blocked by:** 01: Aplicativo desktop e persistência segura.

**Status:** resolved

- [x] O usuário informa Saldo Inicial e data de início do controle.
- [x] O usuário cria, renomeia e desativa Categoria Financeira e Instituição Financeira sem alterar o histórico.
- [x] O usuário registra Receita Avulsa ou despesa como prevista ou confirmada, com descrição e observação opcionais.
- [x] Apenas recebimentos e pagamentos confirmados alteram o Saldo Disponível; valores previstos afetam somente projeções.
- [x] A interface usa reais brasileiros e apresenta validações acessíveis em português.
- [x] Testes cobrem o cálculo de saldo e a persistência das operações principais em SQLite.

## Answer

Saldo Inicial, categorias, instituições e lançamentos manuais foram implementados de ponta a ponta,
com valores em centavos, datas civis, validação nas fronteiras IPC e persistência local. O Saldo
Disponível considera somente lançamentos confirmados, enquanto o saldo projetado inclui os previstos;
renomear ou desativar catálogos preserva os vínculos e a classificação do histórico.
