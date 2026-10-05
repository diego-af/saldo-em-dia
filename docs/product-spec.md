# Saldo em Dia — primeira versão

## Propósito

Aplicativo desktop pessoal para registrar manualmente entradas, despesas, cartão de crédito e dívidas com outras pessoas. O produto mostra o dinheiro disponível, compromissos futuros e quanto o usuário ainda pode gastar sem comprometer sua meta financeira.

## Plataforma e privacidade

- Instalável em Linux e Windows.
- Funciona sem internet e sem integração bancária.
- Não possui conta online nem senha própria; confia na sessão autenticada do sistema operacional.
- Mantém os dados localmente em SQLite.
- Inicia com o computador e permanece em segundo plano para emitir notificações.
- Não sincroniza dados automaticamente entre computadores.
- Trabalha somente com reais brasileiros e formatação brasileira.

## Saldo e lançamentos

- Existe um único saldo disponível, sem saldos separados por banco.
- O controle começa com um saldo inicial e sua data.
- Receitas recebidas aumentam o saldo.
- Despesas pagas e pagamentos integrais de fatura reduzem o saldo.
- Receitas e despesas previstas afetam apenas projeções enquanto não forem confirmadas.
- Lançamentos são informados manualmente e aceitam descrição e observações em texto.
- Não há anexos de fotos ou documentos.
- Entradas e despesas podem ser avulsas ou recorrentes.
- Uma recorrência pode ser alterada apenas na ocorrência escolhida ou nela e em todas as futuras; ocorrências passadas não são reescritas em massa.
- Lançamentos pagos ou recebidos podem ser corrigidos mediante aviso, com recálculo dos saldos, relatórios e metas e registro da alteração.
- Itens excluídos permanecem na Lixeira por 10 dias antes da remoção definitiva.

## Organização

- Despesas podem ser associadas a uma instituição financeira para organização e relatórios, mas a instituição não possui saldo próprio.
- Receitas e despesas usam categorias iniciais editáveis.
- Categorias podem ser criadas, renomeadas e desativadas.
- A desativação não altera a categoria dos lançamentos históricos.

## Receitas

- Receitas avulsas e recorrentes são suportadas.
- O salário é uma receita recorrente mensal com valor previsto fixo.
- O usuário confirma ou corrige o valor recebido em cada mês.
- Um aumento salarial é informado manualmente e altera apenas as previsões futuras.

## Cartão de crédito próprio

- A primeira versão aceita o cartão próprio do usuário e mantém o modelo preparado para mais cartões.
- Cada cartão pertence a uma instituição financeira e possui limite total, dia de fechamento e dia de vencimento.
- O aplicativo calcula o limite comprometido e o limite disponível.
- Uma compra no cartão cria obrigação futura, mas não reduz imediatamente o saldo disponível.
- O aplicativo determina a fatura pelo dia da compra e pelo fechamento informado.
- Compras parceladas são cadastradas pelo valor total e quantidade de parcelas.
- Os centavos são distribuídos preservando exatamente o valor total, e a primeira parcela pode ser ajustada se necessário.
- Parcelas são projetadas nas faturas futuras.
- Somente o pagamento integral da fatura é tratado na primeira versão.
- Pagamento parcial, rotativo e cálculo automático de juros ficam fora do escopo.

## Dívidas com outras pessoas

- Cartões de terceiros não são cadastrados como cartões do usuário.
- Uma dívida pessoal identifica a pessoa credora, valor total, parcelas e vencimentos.
- Parcelas iguais são calculadas por padrão, mas cada parcela pode ter valor e vencimento próprios.
- Cada parcela pode estar pendente, paga ou atrasada.
- Uma parcela fica atrasada automaticamente quando o vencimento passa sem pagamento.
- Somente o pagamento registrado reduz o saldo disponível.

## Recorrências e notificações

- Despesas recorrentes geram ocorrências com vencimento e situação próprios.
- Parcelas, faturas e ocorrências recorrentes produzem lembretes enquanto estiverem pendentes.
- Os avisos aparecem às 9h, no horário local do computador:
  - dois dias antes do vencimento;
  - um dia antes;
  - no dia do vencimento;
  - diariamente depois do vencimento, até o pagamento.
- Um compromisso específico pode ter seus avisos silenciados.
- O aviso é interrompido quando o pagamento é registrado.
- Ao iniciar depois de um período desligado, o aplicativo recupera avisos pendentes.

## Meta financeira e planejamento

- A meta inicial é alcançar saldo disponível mínimo de R$ 7.000 em 30 de junho de 2027.
- O cálculo considera saldo atual, salário e demais receitas previstas, despesas recorrentes, faturas e parcelas conhecidas.
- O aplicativo informa quanto ainda pode ser gasto no mês e uma média diária até o fim do mês.
- O plano é recalculado depois de cada entrada, despesa ou alteração de compromisso.
- Gastar menos em um mês aumenta a margem futura; gastar mais reduz os limites seguintes.
- Compras no cartão reduzem imediatamente a margem da meta, embora só reduzam o saldo disponível no pagamento da fatura.
- Nenhum lançamento é bloqueado por comprometer a meta.
- Antes de confirmar uma despesa que prejudique a meta, o aplicativo deixa claro o impacto, a insuficiência projetada e o ajuste de gasto ou renda necessário.

## Visões financeiras

- A visão de gastos atribui a despesa à data em que ela foi assumida e à sua categoria.
- A visão de fluxo de caixa atribui entradas e saídas às datas em que alteram o saldo disponível.
- Compra no cartão e pagamento da fatura não são contados como duas despesas no mesmo relatório.
- A projeção oferece horizontes de 3, 6 e 12 meses e uma visão até a última parcela conhecida.

## Tela inicial

- Saldo disponível atual.
- Saldo projetado ao fim do mês.
- Entradas recebidas e despesas pagas no mês.
- Próxima fatura do cartão.
- Total ainda devido a outras pessoas.
- Próximos vencimentos e itens atrasados.
- Limite mensal e média diária compatíveis com a meta.

## Relatórios e exportação

- Gastos por categoria.
- Gastos por instituição financeira.
- Evolução mensal de entradas e saídas.
- Evolução do saldo disponível.
- Faturas e parcelas futuras.
- Progresso da meta financeira.
- Todos os relatórios possuem filtro de período.
- Dados filtrados podem ser exportados em CSV para Excel ou LibreOffice.
- Exportação em PDF fica fora da primeira versão.

## Backup e restauração

- O aplicativo cria um backup local diário e mantém os 30 mais recentes.
- O usuário pode exportar e restaurar manualmente um arquivo de backup.
- O formato portátil funciona entre instalações Linux e Windows.
- O arquivo exportado é criptografado com uma senha escolhida no momento da exportação.
- Se a senha do arquivo for esquecida, o backup portátil não poderá ser restaurado.

## Critérios de sucesso da primeira versão

- O saldo disponível nunca é alterado por valores apenas previstos.
- Uma compra no cartão aparece na fatura correta e afeta a meta sem reduzir o saldo antes do pagamento.
- Pagamentos não duplicam despesas nos relatórios.
- Projeções são recalculadas após qualquer mudança relevante.
- Vencimentos pendentes geram os avisos acordados mesmo com a janela fechada.
- Dados sobrevivem ao fechamento do aplicativo e podem ser recuperados por backup.
- Uma exportação CSV reflete os filtros exibidos na tela.
