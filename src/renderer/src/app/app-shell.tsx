import { useCallback, useEffect, useState } from "react";
import type {
  FinanceSummary,
  FinancialCategory,
  FinancialInstitution,
  Transaction,
  TransactionRevision,
} from "../../../shared/contracts/finance";
import { financeSummarySchema } from "../../../shared/contracts/finance";
import { CreditCardPage } from "../features/credit-cards/credit-card-page";
import { formatBrl } from "../features/transactions/brl-money";
import { SettingsPage } from "../features/transactions/settings-page";
import { TransactionForm } from "../features/transactions/transaction-form";

const navigation = [
  ["⌂", "Visão geral"],
  ["↕", "Lançamentos"],
  ["▭", "Cartão"],
  ["◎", "Dívidas"],
  ["◇", "Planejamento"],
  ["▥", "Relatórios"],
  ["⚙", "Configurações"],
] as const;
const emptySummary = financeSummarySchema.parse({
  initialBalance: null,
  availableCents: 0,
  projectedCents: 0,
  receivedThisMonthCents: 0,
  paidThisMonthCents: 0,
});

export function AppShell() {
  const [section, setSection] = useState("Visão geral");
  const [showTransaction, setShowTransaction] = useState(false);
  const [summary, setSummary] = useState<FinanceSummary>(emptySummary);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<Transaction>();
  const [revisions, setRevisions] = useState<Record<string, TransactionRevision[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [nextSummary, nextCategories, nextInstitutions, nextTransactions, nextDeleted] =
        await Promise.all([
          window.saldoEmDia.finance.getSummary(),
          window.saldoEmDia.finance.getCategories(),
          window.saldoEmDia.finance.getInstitutions(),
          window.saldoEmDia.finance.getTransactions(),
          window.saldoEmDia.finance.getDeletedTransactions(),
        ]);
      setSummary(nextSummary);
      setCategories(nextCategories);
      setInstitutions(nextInstitutions);
      setTransactions(nextTransactions);
      setDeletedTransactions(nextDeleted);
      setError("");
    } catch {
      setError("Não foi possível carregar seus dados. Feche e abra o aplicativo novamente.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);
  const openTransaction = () => {
    setSection("Lançamentos");
    setEditingTransaction(undefined);
    setShowTransaction(true);
  };
  const savedTransaction = async () => {
    await refresh();
    setEditingTransaction(undefined);
    setShowTransaction(false);
  };

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true">
            S
          </span>
          <span>
            <strong>Saldo em Dia</strong>
            <small>Finanças com calma</small>
          </span>
        </div>
        <nav aria-label="Navegação principal">
          {navigation.map(([icon, label]) => (
            <button
              className={section === label ? "nav-item active" : "nav-item"}
              key={label}
              type="button"
              onClick={() => {
                setSection(label);
                setShowTransaction(false);
              }}
            >
              <span aria-hidden="true">{icon}</span>
              {label}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" />
          Seus dados ficam neste computador
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Controle financeiro local</p>
            <h1>{section}</h1>
          </div>
          <button className="primary-action" type="button" onClick={openTransaction}>
            <span aria-hidden="true">＋</span> Novo lançamento
          </button>
        </header>
        <section className="content" aria-live="polite">
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {loading ? (
            <p>Carregando…</p>
          ) : showTransaction ? (
            <TransactionForm
              categories={categories}
              institutions={institutions}
              transaction={editingTransaction}
              onCancel={() => setShowTransaction(false)}
              onSaved={savedTransaction}
            />
          ) : section === "Visão geral" ? (
            <Overview summary={summary} onConfigure={() => setSection("Configurações")} />
          ) : section === "Lançamentos" ? (
            <Transactions
              transactions={transactions}
              deletedTransactions={deletedTransactions}
              categories={categories}
              revisions={revisions}
              onEdit={(transaction) => {
                setEditingTransaction(transaction);
                setShowTransaction(true);
              }}
              onDelete={async (transaction) => {
                await window.saldoEmDia.finance.deleteTransaction(transaction.id);
                await refresh();
              }}
              onRestore={async (transaction) => {
                await window.saldoEmDia.finance.restoreTransaction(transaction.id);
                await refresh();
              }}
              onHistory={async (transaction) => {
                const history = await window.saldoEmDia.finance.getTransactionRevisions(
                  transaction.id,
                );
                setRevisions((current) => ({ ...current, [transaction.id]: history }));
              }}
            />
          ) : section === "Cartão" ? (
            <CreditCardPage
              categories={categories}
              institutions={institutions}
              onChanged={refresh}
            />
          ) : section === "Configurações" ? (
            <SettingsPage
              summary={summary}
              categories={categories}
              institutions={institutions}
              onChanged={refresh}
            />
          ) : (
            <ComingSoon section={section} />
          )}
        </section>
      </main>
    </div>
  );
}

function Overview({ summary, onConfigure }: { summary: FinanceSummary; onConfigure(): void }) {
  return (
    <>
      <article className="balance-card">
        <p>Saldo disponível</p>
        <strong>{formatBrl(summary.availableCents)}</strong>
        <span>
          {summary.initialBalance
            ? `Projetado: ${formatBrl(summary.projectedCents)}`
            : "Comece informando seu saldo inicial"}
        </span>
      </article>
      <div className="section-heading">
        <div>
          <p className="eyebrow">Seu mês</p>
          <h2>Uma visão simples do que importa</h2>
        </div>
        <span className="privacy-badge">100% local</span>
      </div>
      <div className="summary-grid">
        <Summary
          title="Entradas recebidas"
          value={summary.receivedThisMonthCents}
          icon="↗"
          kind="income"
        />
        <Summary
          title="Despesas pagas"
          value={summary.paidThisMonthCents}
          icon="↘"
          kind="expense"
        />
        <article className="summary-card warm">
          <span className="card-icon planning" aria-hidden="true">
            ◇
          </span>
          <p>Saldo projetado</p>
          <strong>{formatBrl(summary.projectedCents)}</strong>
          <small>Com valores previstos</small>
        </article>
      </div>
      {!summary.initialBalance && (
        <article className="empty-state">
          <div>
            <p className="eyebrow">Primeiros passos</p>
            <h2>Vamos organizar sua vida financeira?</h2>
            <p>
              Registre seu saldo inicial para acompanhar o que entra, o que sai e planejar com
              tranquilidade.
            </p>
          </div>
          <button className="secondary-action" type="button" onClick={onConfigure}>
            Configurar agora
          </button>
        </article>
      )}
    </>
  );
}
function Summary({
  title,
  value,
  icon,
  kind,
}: {
  title: string;
  value: number;
  icon: string;
  kind: string;
}) {
  return (
    <article className="summary-card">
      <span className={`card-icon ${kind}`} aria-hidden="true">
        {icon}
      </span>
      <p>{title}</p>
      <strong>{formatBrl(value)}</strong>
      <small>Neste mês</small>
    </article>
  );
}
function Transactions({
  transactions,
  deletedTransactions,
  categories,
  revisions,
  onEdit,
  onDelete,
  onRestore,
  onHistory,
}: {
  transactions: Transaction[];
  deletedTransactions: Transaction[];
  categories: FinancialCategory[];
  revisions: Record<string, TransactionRevision[]>;
  onEdit(transaction: Transaction): void;
  onDelete(transaction: Transaction): Promise<void>;
  onRestore(transaction: Transaction): Promise<void>;
  onHistory(transaction: Transaction): Promise<void>;
}) {
  const names = new Map(categories.map((item) => [item.id, item.name]));
  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Histórico</p>
          <h2>Lançamentos</h2>
        </div>
        <span className="privacy-badge">{transactions.length} registros</span>
      </div>
      {transactions.length === 0 ? (
        <p className="supporting-text">Nenhum lançamento registrado.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Situação</th>
                <th>Valor</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((item) => (
                <tr key={item.id}>
                  <td>{item.date.split("-").reverse().join("/")}</td>
                  <td>{item.description || "Sem descrição"}</td>
                  <td>{names.get(item.categoryId)}</td>
                  <td>{item.isConfirmed ? "Confirmado" : "Previsto"}</td>
                  <td>{formatBrl(item.amountCents)}</td>
                  <td>
                    <span className="row-actions">
                      <button className="text-action" type="button" onClick={() => onEdit(item)}>
                        Corrigir
                      </button>
                      <button
                        className="text-action"
                        type="button"
                        onClick={() => void onDelete(item)}
                      >
                        Excluir
                      </button>
                      <button
                        className="text-action"
                        type="button"
                        onClick={() => void onHistory(item)}
                      >
                        Histórico
                      </button>
                    </span>
                    {revisions[item.id] && (
                      <ul className="revision-list">
                        {revisions[item.id].length === 0 ? (
                          <li>Sem correções.</li>
                        ) : (
                          revisions[item.id].map((revision) => (
                            <li key={revision.id}>
                              {new Date(revision.changedAt).toLocaleString("pt-BR")}: valor de{" "}
                              {formatBrl(revision.before.amountCents)} para{" "}
                              {formatBrl(revision.after.amountCents)}
                            </li>
                          ))
                        )}
                      </ul>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="section-heading compact-heading">
        <div>
          <p className="eyebrow">Exclusão temporária</p>
          <h2>Lixeira</h2>
        </div>
        <span className="privacy-badge">{deletedTransactions.length} itens</span>
      </div>
      {deletedTransactions.length === 0 ? (
        <p className="supporting-text">A lixeira está vazia.</p>
      ) : (
        <ul className="catalog-list">
          {deletedTransactions.map((item) => (
            <li key={item.id}>
              <span>
                <strong>{item.description || names.get(item.categoryId) || "Lançamento"}</strong>
                <small>
                  {formatBrl(item.amountCents)} · removido em{" "}
                  {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString("pt-BR") : ""}
                </small>
              </span>
              <button className="text-action" type="button" onClick={() => void onRestore(item)}>
                Restaurar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
function ComingSoon({ section }: { section: string }) {
  return (
    <article className="empty-state">
      <div>
        <p className="eyebrow">Próxima etapa</p>
        <h2>{section}</h2>
        <p>Esta área será habilitada nas próximas issues da especificação.</p>
      </div>
    </article>
  );
}
