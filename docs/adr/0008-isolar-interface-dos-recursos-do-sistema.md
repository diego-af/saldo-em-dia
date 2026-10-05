# Isolar a interface dos recursos do sistema

A interface React não terá acesso direto a Node.js, SQLite, arquivos ou APIs do sistema; esses recursos serão controlados pelo processo principal do Electron e expostos por operações IPC específicas, tipadas e validadas. Essa separação reduz a superfície de ataque e impede que uma falha de renderização se transforme em acesso arbitrário ao computador, aceitando o custo de manter contratos explícitos entre processos.
