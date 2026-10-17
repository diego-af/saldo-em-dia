import { type FormEvent, useCallback, useEffect, useState } from "react";
import type { FinancialCategory } from "../../../../shared/contracts/finance";
import type { Recurrence, RecurrenceOccurrence } from "../../../../shared/contracts/recurrence";
import { formatBrl, parseBrl } from "../transactions/brl-money";

interface RecurrencePanelProps {
  categories: FinancialCategory[];
  onChanged(): Promise<void>;
}

interface OccurrenceDraft {
  amount: string;
  dueDate: string;
}

export function RecurrencePanel({ categories, onChanged }: RecurrencePanelProps) {
  const [recurrences, setRecurrences] = useState<Recurrence[]>([]);
  const [occurrences, setOccurrences] = useState<Record<string, RecurrenceOccurrence[]>>({});
  const [drafts, setDrafts] = useState<Record<string, OccurrenceDraft>>({});
  const [silenced, setSilenced] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const activeCategories = categories.filter(({ active }) => active);

  const load = useCallback(async () => {
    const [nextRecurrences, silencedKeys] = await Promise.all([
      window.saldoEmDia.recurrences.list(),
      window.saldoEmDia.reminders.listSilenced(),
    ]);
    const entries = await Promise.all(
      nextRecurrences.map(
        async (recurrence) =>
          [
            recurrence.id,
            await window.saldoEmDia.recurrences.listOccurrences(recurrence.id),
          ] as const,
      ),
    );
    const nextOccurrences = Object.fromEntries(entries);
    setRecurrences(nextRecurrences);
    setSilenced(new Set(silencedKeys));
    setOccurrences(nextOccurrences);
    setDrafts(
      Object.fromEntries(
        entries.flatMap(([, items]) =>
          items.map((item) => [
            item.id,
            {
              amount: ((item.actualAmountCents ?? item.amountCents) / 100)
                .toFixed(2)
                .replace(".", ","),
              dueDate: item.dueDate,
            },
          ]),
        ),
      ),
    );
  }, []);

  useEffect(() => {
    void load().catch(() => setError("Não foi possível carregar as recorrências."));
  }, [load]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const amountCents = parseBrl(String(data.get("amount")));
    if (!amountCents) return setError("Informe um valor válido.");
    try {
      await window.saldoEmDia.recurrences.create({
        description: String(data.get("description")),
        categoryId: String(data.get("categoryId")),
        amountCents,
        startDate: String(data.get("startDate")),
        isSalary: data.get("isSalary") === "on",
      });
      form.reset();
      setError("");
      await load();
      await onChanged();
    } catch {
      setError("Não foi possível salvar a recorrência. Confira os dados.");
    }
  }

  function readDraft(item: RecurrenceOccurrence) {
    const draft = drafts[item.id];
    const amountCents = parseBrl(draft?.amount ?? "");
    if (!draft || !amountCents) throw new Error("Dados inválidos");
    return { amountCents, dueDate: draft.dueDate };
  }

  async function update(item: RecurrenceOccurrence, scope: "single" | "future") {
    try {
      await window.saldoEmDia.recurrences.updateOccurrence({
        occurrenceId: item.id,
        ...readDraft(item),
        scope,
      });
      setError("");
      await load();
      await onChanged();
    } catch {
      setError("Não foi possível alterar a ocorrência.");
    }
  }

  async function confirm(item: RecurrenceOccurrence) {
    try {
      const { amountCents } = readDraft(item);
      await window.saldoEmDia.recurrences.confirmOccurrence({
        occurrenceId: item.id,
        amountCents,
        confirmationDate: new Intl.DateTimeFormat("en-CA").format(new Date()),
      });
      setError("");
      await load();
      await onChanged();
    } catch {
      setError("Não foi possível confirmar a ocorrência.");
    }
  }

  async function silence(item: RecurrenceOccurrence) {
    const key = `recurrence-occurrence:${item.id}`;
    try {
      await window.saldoEmDia.reminders.silence(key);
      setSilenced((current) => new Set(current).add(key));
    } catch {
      setError("Não foi possível silenciar os avisos.");
    }
  }

  return (
    <section className="panel form-panel">
      <p className="eyebrow">Valores mensais</p>
      <h2>Salário e recorrências</h2>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {activeCategories.length === 0 ? (
        <p className="notice">Crie uma categoria ativa antes de cadastrar uma recorrência.</p>
      ) : (
        <form className="form-grid" onSubmit={create}>
          <label>
            Descrição
            <input name="description" maxLength={500} required />
          </label>
          <label>
            Valor previsto
            <input name="amount" inputMode="decimal" placeholder="0,00" required />
          </label>
          <label>
            Primeiro vencimento
            <input name="startDate" type="date" required />
          </label>
          <label>
            Categoria
            <select name="categoryId" defaultValue="" required>
              <option value="" disabled>
                Selecione
              </option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox-field">
            <input name="isSalary" type="checkbox" /> É meu salário mensal
          </label>
          <button className="primary-action" type="submit">
            Salvar recorrência
          </button>
        </form>
      )}
      {recurrences.map((recurrence) => (
        <div key={recurrence.id} className="recurrence-group">
          <h3>
            {recurrence.description}
            {recurrence.isSalary ? " · Salário" : ""}
          </h3>
          <ul className="catalog-list">
            {(occurrences[recurrence.id] ?? []).map((item) => (
              <li key={item.id}>
                <span>
                  <strong>
                    {item.dueDate.split("-").reverse().join("/")} · {statusLabel[item.status]}
                  </strong>
                  <small>Previsto: {formatBrl(item.amountCents)}</small>
                </span>
                {item.status !== "confirmed" && (
                  <span className="row-actions">
                    <input
                      aria-label={`Valor de ${recurrence.description} em ${item.dueDate}`}
                      inputMode="decimal"
                      value={drafts[item.id]?.amount ?? ""}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...current[item.id], amount: event.target.value },
                        }))
                      }
                    />
                    <input
                      aria-label={`Vencimento de ${recurrence.description}`}
                      type="date"
                      value={drafts[item.id]?.dueDate ?? item.dueDate}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [item.id]: { ...current[item.id], dueDate: event.target.value },
                        }))
                      }
                    />
                    <button
                      className="text-action"
                      type="button"
                      onClick={() => void update(item, "single")}
                    >
                      Alterar esta
                    </button>
                    <button
                      className="text-action"
                      type="button"
                      onClick={() => void update(item, "future")}
                    >
                      Esta e futuras
                    </button>
                    <button
                      className="text-action"
                      type="button"
                      disabled={silenced.has(`recurrence-occurrence:${item.id}`)}
                      onClick={() => void silence(item)}
                    >
                      {silenced.has(`recurrence-occurrence:${item.id}`)
                        ? "Avisos silenciados"
                        : "Silenciar avisos"}
                    </button>
                    <button
                      className="secondary-action"
                      type="button"
                      onClick={() => void confirm(item)}
                    >
                      Confirmar
                    </button>
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

const statusLabel = { pending: "Pendente", overdue: "Atrasada", confirmed: "Confirmada" } as const;
