# Criptografar backups portáteis com primitivas padrão

Arquivos de backup exportados derivarão uma chave da senha com `scrypt` e serão protegidos por `AES-256-GCM`, usando salt e nonce aleatórios e um formato versionado. Essa escolha evita algoritmos próprios, protege tanto a confidencialidade quanto a integridade dos dados e mantém a restauração compatível entre Linux e Windows, aceitando que uma senha esquecida torne o arquivo irrecuperável.
