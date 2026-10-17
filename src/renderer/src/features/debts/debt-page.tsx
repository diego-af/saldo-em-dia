import { type FormEvent, useCallback, useEffect, useState } from "react";
import {
  type PlannedDebtInstallment,
  planDebtInstallments,
} from "../../../../core/features/debts/plan-debt-installments";
import type { Debt, DebtInstallment } from "../../../../shared/contracts/debt";
import { formatBrl, parseBrl } from "../transactions/brl-money";

interface DebtPageProps {
  onChanged(): Promise<void>;
}

export function DebtPage({ onChanged }: DebtPageProps) {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [installments, setInstallments] = useState<Record<string, DebtInstallment[]>>({});
  const [plan, setPlan] = useState<PlannedDebtInstallment[]>([]);
  const [silenced, setSilenced] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [nextDebts, silencedKeys] = await Promise.all([
      window.saldoEmDia.debts.list(),
      window.saldoEmDia.reminders.listSilenced(),
    ]);
    const entries = await Promise.all(
      nextDebts.map(
        async (debt) => [debt.id, await window.saldoEmDia.debts.listInstallments(debt.id)] as const,
      ),
    );
    setDebts(nextDebts);
    setSilenced(new Set(silencedKeys));
    setInstallments(Object.fromEntries(entries));
  }, []);

  useEffect(() => {
    void load().catch(() => setError("Não foi possível carregar suas dívidas."));
  }, [load]);

  function suggest(form: HTMLFormElement) {
    const data = new FormData(form);
    const totalCents = parseBrl(String(data.get("total")));
    try {
      setPlan(
        planDebtInstallments(
          totalCents ?? 0,
          Number(data.get("installmentCount")),
          String(data.get("firstDueDate")),
        ),
      );
      setError("");
    } catch {
      setError("Informe valor, quantidade e primeiro vencimento válidos.");
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const totalCents = parseBrl(String(data.get("total")));
    if (!totalCents || plan.length === 0) {
      return setError("Gere as parcelas antes de salvar.");
    }
    try {
      await window.saldoEmDia.debts.create({
        creditorName: String(data.get("creditorName")),
        totalCents,
        installments: plan,
      });
      form.reset();
      setPlan([]);
      setError("");
      await load();
    } catch {
      setError("Não foi possível salvar. Confira se as parcelas somam o valor total.");
    }
  }

  async function pay(installment: DebtInstallment) {
    try {
      await window.saldoEmDia.debts.payInstallment({
        installmentId: installment.id,
        paymentDate: new Intl.DateTimeFormat("en-CA").format(new Date()),
      });
      setError("");
      await load();
      await onChanged();
    } catch {
      setError("Não foi possível registrar o pagamento.");
    }
  }

  async function silence(installment: DebtInstallment) {
    const key = `debt-installment:${installment.id}`;
    try {
      await window.saldoEmDia.reminders.silence(key);
      setSilenced((current) => new Set(current).add(key));
    } catch {
      setError("Não foi possível silenciar os avisos.");
    }
  }

  return (
    <div className="card-page">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <section className="panel form-panel">
        <p className="eyebrow">Obrigação pessoal</p>
        <h2>Nova dívida</h2>
        <form className="form-grid" onSubmit={save}>
          <label>
            Pessoa credora
            <input name="creditorName" maxLength={200} required />
          </label>
          <label>
            Valor total
            <input name="total" inputMode="decimal" placeholder="0,00" required />
          </label>
          <label>
            Quantidade de parcelas
            <input
              name="installmentCount"
              type="number"
              min="1"
              max="360"
              defaultValue="1"
              required
            />
          </label>
          <label>
            Primeiro vencimento
            <input name="firstDueDate" type="date" required />
          </label>
          <button
            className="secondary-action"
            type="button"
            onClick={(event) => {
              const form = event.currentTarget.form;
              if (form) suggest(form);
            }}
          >
            Sugerir parcelas
          </button>
          {plan.length > 0 && (
            <div className="full-field installment-editor">
              {plan.map((item, index) => (
                <div className="form-grid" key={item.number}>
                  <label>
                    Parcela {item.number}
                    <input
                      aria-label={`Valor da parcela ${item.number}`}
                      inputMode="decimal"
                      value={(item.amountCents / 100).toFixed(2).replace(".", ",")}
                      onChange={(event) => {
                        const amountCents = parseBrl(event.target.value);
                        if (amountCents)
                          setPlan((current) =>
                            current.map((entry, position) =>
                              position === index ? { ...entry, amountCents } : entry,
                            ),
                          );
                      }}
                    />
                  </label>
                  <label>
                    Vencimento
                    <input
                      aria-label={`Vencimento da parcela ${item.number}`}
                      type="date"
                      value={item.dueDate}
                      onChange={(event) =>
                        setPlan((current) =>
                          current.map((entry, position) =>
                            position === index ? { ...entry, dueDate: event.target.value } : entry,
                          ),
                        )
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
          <button className="primary-action" type="submit">
            Salvar dívida
          </button>
        </form>
      </section>
      <section className="panel">
        <p className="eyebrow">Acompanhamento</p>
        <h2>Dívidas pessoais</h2>
        {debts.length === 0 ? (
          <p className="supporting-text">Nenhuma dívida cadastrada.</p>
        ) : (
          <ul className="catalog-list">
            {debts.map((debt) => (
              <li key={debt.id} className="debt-item">
                <span>
                  <strong>
                    {debt.creditorName} · {formatBrl(debt.remainingCents)} em aberto
                  </strong>
                  <small>Total: {formatBrl(debt.totalCents)}</small>
                </span>
                <ul className="catalog-list full-field">
                  {(installments[debt.id] ?? []).map((item) => (
                    <li key={item.id}>
                      <span>
                        <strong>
                          {item.number}ª parcela · {formatBrl(item.amountCents)}
                        </strong>
                        <small>
                          Vence em {item.dueDate.split("-").reverse().join("/")} ·{" "}
                          {statusLabel[item.status]}
                        </small>
                      </span>
                      {item.status !== "paid" && (
                        <span className="row-actions">
                          <button
                            className="text-action"
                            type="button"
                            disabled={silenced.has(`debt-installment:${item.id}`)}
                            onClick={() => void silence(item)}
                          >
                            {silenced.has(`debt-installment:${item.id}`)
                              ? "Avisos silenciados"
                              : "Silenciar avisos"}
                          </button>
                          <button
                            className="secondary-action"
                            type="button"
                            onClick={() => void pay(item)}
                          >
                            Registrar pagamento
                          </button>
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const statusLabel = { pending: "Pendente", paid: "Paga", overdue: "Atrasada" } as const;
