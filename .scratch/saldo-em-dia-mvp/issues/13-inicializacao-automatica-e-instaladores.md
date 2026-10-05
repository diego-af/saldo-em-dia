# 13: Inicialização automática e instaladores

**What to build:** Distribuir uma primeira versão instalável que inicie com o sistema, mantenha os lembretes ativos e preserve os dados durante atualizações.

**Blocked by:** 07: Lembretes de vencimento; 09: Dashboard financeiro; 10: Assistente de primeiro uso; 11: Relatórios e exportação CSV; 12: Backup e restauração.

**Status:** ready-for-agent

- [ ] O aplicativo pode iniciar com a sessão do sistema operacional e permanecer em segundo plano.
- [ ] Uma atualização preserva dados, cria backup preventivo e executa migrações antes de abrir a interface.
- [ ] Falha de migração interrompe a abertura normal e oferece restauração segura.
- [ ] Os fluxos críticos definidos na especificação passam pela verificação manual em Linux e Windows.
- [ ] A distribuição gera pacote `.deb` instalável para Ubuntu.
- [ ] A distribuição gera instalador `.exe` para Windows.
- [ ] Os artefatos incluem renderer, migrações e dependências nativas necessárias.
