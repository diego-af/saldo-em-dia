# 01: Aplicativo desktop e persistência segura

**What to build:** Um aplicativo desktop que abra com segurança, persista dados localmente e ofereça a estrutura visual e técnica necessária para as funcionalidades financeiras seguintes.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] O aplicativo Electron abre com navegação principal, ação de novo lançamento e tema seguindo a preferência do sistema.
- [ ] O renderer permanece isolado de Node.js e acessa recursos privilegiados somente por contratos IPC tipados e validados.
- [ ] O SQLite inicializa por migrações versionadas e uma operação básica persiste após fechar e reabrir o aplicativo.
- [ ] Valores monetários usam centavos inteiros e datas financeiras usam datas civis nos contratos compartilhados.
- [ ] Formatação, lint, tipos, testes e build possuem comandos locais funcionais.
- [ ] Falhas inesperadas geram logs locais sem informações financeiras, com rotação de 5 MB e retenção de 3 dias.
