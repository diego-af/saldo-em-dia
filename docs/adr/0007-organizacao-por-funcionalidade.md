# Organizar o código por funcionalidade

O projeto será dividido pelos módulos financeiros do produto, mantendo casos de uso, interface e testes próximos, enquanto o domínio permanece independente de React, Electron e SQLite. Essa estrutura foi escolhida em vez de grandes camadas técnicas globais porque facilita localizar mudanças, reduz acoplamento entre funcionalidades e evita pastas genéricas que acumulam responsabilidades sem relação.
