import { useCallback, useEffect, useState } from "react";
import type {
  FinanceSummary,
  FinancialCategory,
  FinancialInstitution,
  Transaction,
} from "../../../shared/contracts/finance";
import { financeSummarySchema } from "../../../shared/contracts/finance";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    try {
      const [nextSummary, nextCategories, nextInstitutions, nextTransactions] = await Promise.all([
        window.saldoEmDia.finance.getSummary(),
        window.saldoEmDia.finance.getCategories(),
        window.saldoEmDia.finance.getInstitutions(),
        window.saldoEmDia.finance.getTransactions(),
      ]);
      setSummary(nextSummary);
      setCategories(nextCategories);
      setInstitutions(nextInstitutions);
      setTransactions(nextTransactions);
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
    setShowTransaction(true);
  };
  const savedTransaction = async () => {
    await refresh();
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
              onCancel={() => setShowTransaction(false)}
              onSaved={savedTransaction}
            />
          ) : section === "Visão geral" ? (
            <Overview summary={summary} onConfigure={() => setSection("Configurações")} />
          ) : section === "Lançamentos" ? (
            <Transactions transactions={transactions} categories={categories} />
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
  categories,
}: {
  transactions: Transaction[];
  categories: FinancialCategory[];
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
