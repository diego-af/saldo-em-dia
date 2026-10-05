# Padrões de código do Saldo em Dia

Este documento registra os padrões obrigatórios para manter o aplicativo legível, seguro e simples de evoluir.

## Organização por funcionalidade

O código é organizado pelos módulos de negócio `dashboard`, `lancamentos`, `cartoes`, `dividas`, `recorrencias`, `metas`, `relatorios` e `backup`. Cada módulo mantém próximos seus casos de uso, contratos, interface e testes.

As regras financeiras centrais não dependem de React, Electron ou SQLite. Integrações técnicas dependem dos contratos do domínio, nunca o contrário.

Pastas genéricas como `components`, `services` e `utils` não podem se tornar depósitos globais. Código compartilhado só é extraído depois de existir uso real em mais de um módulo e receber um nome que expresse sua responsabilidade.

## TypeScript e validação

Todo o código do produto usa TypeScript em modo estrito. O tipo `any` é proibido, salvo em uma integração inevitável acompanhada por justificativa local e conversão imediata para um tipo seguro.

Dados recebidos de formulários, SQLite, backups e IPC são desconhecidos até serem validados na fronteira. O domínio recebe apenas estruturas tipadas e válidas.

## Valores monetários

Valores em reais são armazenados e calculados como centavos inteiros. Núcleo, banco e IPC nunca representam dinheiro com números decimais de ponto flutuante.

A conversão entre entrada brasileira, centavos e exibição em reais ocorre somente nas fronteiras. Operações validam que o valor é um inteiro seguro e respeitam explicitamente a regra de distribuição de centavos entre parcelas.

## Datas e horários

Datas financeiras, como compra, vencimento e pagamento, são datas civis no formato `YYYY-MM-DD` e não passam por conversão de fuso horário.

Instantes técnicos, como criação e alteração de um registro, são armazenados em UTC e convertidos para o fuso local apenas na exibição. O tipo nativo `Date` não representa datas civis dentro do domínio.

## Fronteira de segurança do Electron

O renderer React executa com isolamento de contexto e sem acesso direto ao Node.js. Ele não abre SQLite, arquivos, notificações nem APIs do sistema operacional.

O processo principal controla recursos privilegiados. O preload expõe apenas uma lista pequena de operações permitidas por contratos IPC tipados; entrada e saída são validadas em tempo de execução. Canais genéricos, execução arbitrária e passagem irrestrita de mensagens são proibidos.

## Estado da interface

Estado permanece local por padrão. `useState` atende interações pequenas; formulários controlam seu próprio ciclo; hooks de cada funcionalidade consultam e atualizam dados persistidos por meio de um cache de consultas.

TanStack Query implementa esse cache no renderer. Mutações invalidam explicitamente as chaves afetadas e tornam a consultar o processo principal; dados do cache não são persistência nem fonte de verdade.

Valores derivados não são copiados para estado. Context é reservado a temas e configurações genuinamente globais. Redux e uma cópia global dos dados financeiros não fazem parte da primeira versão.

Uma store global dedicada só é introduzida quando áreas distantes precisam ler e alterar o mesmo estado temporário e estado local, composição, Context ou cache de consultas não produzem uma solução clara. A necessidade e o limite dessa store devem ser registrados junto ao módulo que a introduzir.

## Sistema visual e componentes

O Saldo em Dia possui tokens próprios para cores, tipografia, espaçamento, raios, sombras e movimento. Componentes de interface reutilizáveis consomem esses tokens e atendem navegação por teclado, foco visível, contraste e leitores de tela.

O projeto usa shadcn/ui como base acessível e Tailwind CSS para tokens e estilos. Como o código dos componentes pertence ao projeto, ele deve ser adaptado à identidade editorial financeira acolhedora do Saldo em Dia; o tema padrão do kit não é aceito como resultado final.

Bibliotecas sem estilo podem fornecer comportamentos acessíveis complexos, como diálogos e menus. Bibliotecas visuais completas que imponham aparência fechada e genérica não são adotadas. Componentes compartilhados são pequenos, compostos e não contêm regras financeiras.

Gráficos usam os componentes do shadcn/ui sobre Recharts e os mesmos tokens do produto. Todo gráfico oferece resumo textual; valores importantes não dependem somente de hover ou cor, e uma tabela alternativa acompanha visualizações que exigem detalhe.

O tema inicial segue a preferência do sistema operacional. O usuário pode escolher manualmente claro ou escuro; a preferência é global e persistida separadamente dos dados financeiros. Cores semânticas e gráficos mantêm contraste e significado nos dois temas.

### Navegação

O layout desktop usa uma barra lateral fixa e recolhível com Visão geral, Lançamentos, Cartão, Dívidas, Planejamento, Relatórios e Configurações. A ação `Novo lançamento` permanece visível em todas as áreas principais.

Em janelas menores, a barra recolhe para ícones com rótulos acessíveis. A primeira versão não mantém uma interface móvel paralela.

### Primeiro uso

Um assistente curto coleta saldo inicial, salário mensal, cartão próprio, dívidas existentes e confirmação da meta financeira. Cada etapa pode ser pulada e concluída depois nas configurações.

O assistente chama os mesmos casos de uso das telas normais; ele não possui regras ou caminhos de gravação paralelos. Ao concluir, direciona para um dashboard preenchido com os dados disponíveis.

## Testes

Testes unitários cobrem as regras financeiras com maior risco: centavos, distribuição de parcelas, saldo, faturas, recorrências e meta. Testes de integração enxutos validam migrações e operações principais contra um SQLite temporário real.

A primeira versão não exige uma suíte extensa de componentes nem automação completa do Electron. Antes de uma versão instalável, uma lista curta de fluxos críticos é verificada manualmente.

## Erros e logs

Erros esperados usam mensagens claras em português e orientam a correção. Operações com falha não deixam alterações parciais nem exibem detalhes técnicos na interface.

Falhas inesperadas geram logs locais de diagnóstico, acessíveis por uma ação que abre sua pasta. Logs não contêm valores financeiros, descrições, observações, conteúdo de backups nem senhas. Erros técnicos são convertidos em tipos de erro da aplicação antes de atravessar o IPC.

Os logs são locais e estruturados, contendo somente horário, nível, módulo, ação, código do erro e versão do aplicativo. Cada arquivo é limitado a 5 MB, sofre rotação ao atingir esse tamanho e é removido depois de 3 dias.

A primeira versão não usa telemetria, Sentry, serviço de métricas nem qualquer envio automático de diagnóstico pela internet.

## SQLite e migrações

Um caso de uso que altera vários registros executa em uma única transação SQLite: ou todas as alterações são confirmadas, ou nenhuma é mantida.

Mudanças de esquema são migrações numeradas, versionadas junto ao código e executadas automaticamente antes do uso do banco. Uma migração presente em uma versão publicada é imutável; correções usam uma nova migração. Antes de migrar, o aplicativo cria um ponto de recuperação local.

## Idioma e nomenclatura

Arquivos, tipos, variáveis e funções usam inglês. Interface, mensagens ao usuário e documentação do negócio usam português brasileiro.

Termos financeiros mantêm uma tradução canônica entre `CONTEXT.md` e o código. Nomes revelam intenção; termos genéricos como `Manager`, `Helper`, `Utils`, `Data` e `Info` são evitados quando existe um conceito mais preciso.

## Qualidade automatizada

Biome é a ferramenta única de formatação, lint e organização de imports. TypeScript executa a verificação de tipos separadamente.

O código precisa passar por formatação, lint, checagem de tipos e testes essenciais antes de gerar uma versão instalável. Regras automáticas devem prevenir defeitos e inconsistências reais, não impor preferências sem benefício de leitura.

## Dependências

pnpm é o único gerenciador de pacotes. O lockfile é versionado e instalações reproduzíveis não podem misturar arquivos ou comandos de npm, Yarn ou outros gerenciadores.

Uma dependência nova precisa eliminar trabalho relevante ou reduzir risco real. Funcionalidade pequena e estável permanece no projeto; pacotes abandonados, redundantes ou usados para uma única função trivial são evitados.

## Formato de backup portátil

Backups exportados derivam uma chave da senha por `scrypt` e usam `AES-256-GCM` para confidencialidade e verificação de integridade. Cada exportação recebe salt e nonce gerados por fonte criptograficamente segura.

O contêiner inclui versão de formato e metadados não sensíveis necessários à restauração. Senha e chave nunca são persistidas nem registradas. Algoritmos criptográficos próprios são proibidos.

## Versões e atualizações

Versões do aplicativo seguem numeração semântica e são instaladas manualmente. A primeira versão não possui serviço de atualização automática.

Uma atualização preserva o diretório de dados, cria backup preventivo e executa migrações antes de abrir a interface. Falha de migração interrompe a inicialização normal e oferece restauração, sem continuar com banco parcialmente atualizado.

## Empacotamento

A primeira distribuição gera pacote `.deb` para Ubuntu e instalador `.exe` para Windows. Formatos portáteis ficam fora do escopo inicial.

A ferramenta de empacotamento precisa incluir os recursos do renderer, migrações e componentes nativos do driver SQLite na arquitetura de destino. Um artefato só é publicado depois de ser instalado e aberto no sistema correspondente.

## Comandos do projeto

- `pnpm check`: formatação, lint e tipos;
- `pnpm test`: testes financeiros e integrações SQLite essenciais;
- `pnpm build`: compilação de produção;
- comandos separados geram os pacotes Linux e Windows.

A primeira versão não exige CI/CD. Os mesmos comandos locais formam a futura fronteira de automação, sem manter uma segunda sequência exclusiva para pipeline.

## Build

Vite compila o renderer React e electron-vite coordena builds separados de `main`, `preload` e `renderer`, seguindo sua estrutura convencional para reduzir configuração própria. Vitest compartilha a base Vite nos testes essenciais.

Versões exatas não são antecipadas neste documento. Antes de instalar ou atualizar dependências, a compatibilidade atual é verificada na documentação oficial via Context7 e fixada no lockfile.

## Casos de uso sem framework

Ações que alteram dados são comandos com nomes de verbo, como `CreateExpense` e `PayInvoice`; leituras são consultas, como `GetDashboard` e `ListUpcomingPayments`. Entradas e saídas são tipadas, e componentes React não orquestram transações financeiras.

Essa divisão é uma convenção leve, não uma implementação de CQRS nem um framework interno. Funções simples são preferidas; classes, barramentos, adaptadores e interfaces só existem quando isolam uma integração real ou tornam testes relevantes mais claros.

## Controle de complexidade

O projeto aplica YAGNI: não cria extensibilidade, generalização ou infraestrutura para possibilidades futuras. Uma abstração precisa resolver duplicação ou acoplamento existente e demonstrável.

## Composição de dependências

O processo principal possui um ponto de composição explícito que cria banco, repositórios e casos de uso. Não há container de injeção, decorators ou descoberta por reflexão.

Dependências relevantes entram por argumentos ou funções de criação pequenas. Testes fornecem implementações controladas diretamente, sem um framework de mocks global.

## Resultados e exceções

Situações esperadas do negócio usam uniões discriminadas tipadas, permitindo que cada consumidor trate casos como dados inválidos, fatura já paga ou senha incorreta de forma exaustiva.

Exceções representam falhas inesperadas de infraestrutura ou invariantes violadas e seguem para o tratamento global. `null`, booleanos soltos e strings genéricas não representam múltiplos resultados diferentes.

## Estrutura do aplicativo

O repositório contém um único pacote de aplicativo, sem monorepo. Seus limites principais são:

- `main`: ciclo do Electron, SQLite, arquivos, backups e notificações;
- `preload`: ponte IPC segura e limitada;
- `renderer`: React e interface;
- `core`: regras financeiras puras e independentes de frameworks.

Os módulos de negócio atravessam essas fronteiras por contratos explícitos, sem importações do renderer para main nem dependência do core em infraestrutura.

```text
src/
├── main/
│   ├── app/
│   ├── database/
│   ├── ipc/
│   ├── notifications/
│   └── backup/
├── preload/
├── renderer/
│   ├── index.html
│   └── src/
│       ├── app/
│       ├── design-system/
│       └── features/
│           ├── dashboard/
│           ├── transactions/
│           ├── credit-cards/
│           ├── debts/
│           ├── planning/
│           └── reports/
├── core/
│   ├── money/
│   ├── dates/
│   └── features/
└── shared/
    └── contracts/
```

Testes ficam próximos do código testado, e migrações ficam junto ao banco. `shared` recebe apenas contratos usados entre processos; uma pasta prevista na árvore só é criada quando possuir conteúdo real.

## Persistência

O acesso ao SQLite usa uma camada leve e tipada de esquema e consultas, com Drizzle como opção preferida sujeita à verificação de compatibilidade antes da implementação. Não se adota um ORM com entidades ativas ou comportamento oculto.

Casos de uso dependem de interfaces de repositório. Implementações SQLite e detalhes da biblioteca permanecem em `main`; o domínio não importa esquema, driver nem comandos SQL.

## Formulários e validação

React Hook Form controla formulários e Zod valida estruturas nas fronteiras da interface e do IPC. Schemas compartilhados validam formato, mas regras financeiras que exigem contexto permanecem nos casos de uso do domínio.

Erros aparecem em português junto ao campo e são associados semanticamente ao controle. Uma tentativa inválida de salvar conduz o foco ao primeiro erro; validação nunca depende apenas de cor.

## Clareza e tamanho

Funções realizam uma tarefa em um único nível de abstração. Componentes não misturam consulta, regra financeira e apresentação. Muitos parâmetros são substituídos por um objeto nomeado quando isso torna o contrato mais claro.

Um arquivo acima de aproximadamente 250 linhas ou uma função difícil de compreender em uma tela dispara revisão de responsabilidade, mas não uma divisão automática. Comentários explicam decisões e restrições; não narram código evidente. Abstrações surgem de necessidade concreta e não de uso futuro hipotético.

## Limites entre módulos

Cada funcionalidade expõe uma API pública pequena. Outros módulos não importam seus arquivos internos nem consultam diretamente as tabelas que ela possui.

Integrações usam tipos, casos de uso ou eventos explicitamente públicos. Importações profundas entre funcionalidades são proibidas e dependências circulares precisam ser removidas pelo desenho, não mascaradas pela ferramenta de build.

## Fontes de verdade e dados derivados

Saldo inicial, receitas recebidas, despesas pagas e pagamentos de faturas ou dívidas são registros autoritativos. Saldo disponível, projeções, limites e totais de relatório são derivados desses registros e não podem existir como valores editáveis concorrentes.

Otimizações futuras podem materializar resultados com mecanismo explícito de reconstrução e invalidação. Um cache nunca se torna fonte financeira independente.
