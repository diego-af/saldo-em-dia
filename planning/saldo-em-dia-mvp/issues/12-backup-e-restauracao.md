# 12: Backup e restauração

**What to build:** Proteger os dados locais com cópias automáticas e permitir transferência manual e segura entre instalações Linux e Windows.

**Blocked by:** 04: Compras, parcelas e faturas do cartão; 05: Dívidas pessoais e parcelas; 06: Salário e compromissos recorrentes.

**Status:** ready-for-agent

- [ ] Um backup local diário é criado e somente os 30 mais recentes são mantidos.
- [ ] Antes de uma migração é criado um ponto de recuperação.
- [ ] O usuário exporta um backup portátil usando uma senha informada no momento da exportação.
- [ ] O arquivo usa formato versionado, `scrypt`, `AES-256-GCM`, salt e nonce aleatórios.
- [ ] Senha, chave e conteúdo financeiro não aparecem em logs nem são persistidos separadamente.
- [ ] Uma senha incorreta falha com mensagem clara sem alterar o banco atual.
- [ ] Um backup exportado em um sistema pode ser restaurado no outro preservando os registros.
