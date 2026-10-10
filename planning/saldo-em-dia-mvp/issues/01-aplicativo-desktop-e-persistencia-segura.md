# 01: Aplicativo desktop e persistência segura

**What to build:** Um aplicativo desktop que abra com segurança, persista dados localmente e ofereça a estrutura visual e técnica necessária para as funcionalidades financeiras seguintes.

**Blocked by:** None (can start immediately).

**Status:** resolved

- [x] O aplicativo Electron abre com navegação principal, ação de novo lançamento e tema seguindo a preferência do sistema.
- [x] O renderer permanece isolado de Node.js e acessa recursos privilegiados somente por contratos IPC tipados e validados.
- [x] O SQLite inicializa por migrações versionadas e uma operação básica persiste após fechar e reabrir o aplicativo.
- [x] Valores monetários usam centavos inteiros e datas financeiras usam datas civis nos contratos compartilhados.
- [x] Formatação, lint, tipos, testes e build possuem comandos locais funcionais.
- [x] Falhas inesperadas geram logs locais sem informações financeiras, com rotação de 5 MB e retenção de 3 dias.

## Answer

A fundação foi implementada com Electron, React, SQLite WebAssembly persistido em arquivo,
migração versionada, contratos IPC validados por Zod, tipos de centavos e data civil, shell visual
responsivo e logs técnicos locais com rotação e retenção. `pnpm check`, `pnpm test` e `pnpm build`
passam localmente.
