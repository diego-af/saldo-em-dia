import { type FormEvent, useState } from "react";
import type { FinancialCategory, FinancialInstitution } from "../../../../shared/contracts/finance";
import { parseBrl } from "./brl-money";

interface TransactionFormProps {
  categories: FinancialCategory[];
  institutions: FinancialInstitution[];
  onCancel(): void;
  onSaved(): Promise<void>;
}

export function TransactionForm({
  categories,
  institutions,
  onCancel,
  onSaved,
}: TransactionFormProps) {
  const [error, setError] = useState("");
  const activeCategories = categories.filter(({ active }) => active);
  const activeInstitutions = institutions.filter(({ active }) => active);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const amountCents = parseBrl(String(data.get("amount") ?? ""));
    if (amountCents === null || amountCents <= 0) {
      setError("Informe um valor válido em reais, como 150,00.");
      return;
    }

    try {
      await window.saldoEmDia.finance.saveTransaction({
        description: String(data.get("description") ?? "").trim() || undefined,
        amountCents,
        categoryId: String(data.get("categoryId")),
        institutionId: String(data.get("institutionId") ?? "") || undefined,
        date: String(data.get("date")),
        isConfirmed: data.get("status") === "confirmed",
        notes: String(data.get("notes") ?? "").trim() || undefined,
      });
      await onSaved();
    } catch {
      setError("Não foi possível salvar o lançamento. Confira os dados e tente novamente.");
    }
  }

  return (
    <section className="panel form-panel" aria-labelledby="transaction-title">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Lançamento manual</p>
          <h2 id="transaction-title">Novo lançamento</h2>
        </div>
        <button className="text-action" type="button" onClick={onCancel}>
          Cancelar
        </button>
      </div>
      {activeCategories.length === 0 ? (
        <p className="notice" role="status">
          Crie uma categoria ativa em Configurações antes de lançar.
        </p>
      ) : (
        <form onSubmit={submit}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="form-grid">
            <label>
              Valor em reais
              <input name="amount" inputMode="decimal" placeholder="0,00" required />
            </label>
            <label>
              Data
              <input name="date" type="date" required />
            </label>
            <label>
              Categoria
              <select name="categoryId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} · {category.type === "income" ? "entrada" : "saída"}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Instituição (opcional)
              <select name="institutionId" defaultValue="">
                <option value="">Sem instituição</option>
                {activeInstitutions.map((institution) => (
                  <option key={institution.id} value={institution.id}>
                    {institution.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Descrição (opcional)
              <input name="description" maxLength={500} />
            </label>
            <label>
              Situação
              <select name="status" defaultValue="confirmed">
                <option value="confirmed">Confirmado</option>
                <option value="planned">Previsto</option>
              </select>
            </label>
            <label className="full-field">
              Observação (opcional)
              <textarea name="notes" maxLength={500} rows={3} />
            </label>
          </div>
          <button className="primary-action" type="submit">
            Salvar lançamento
          </button>
        </form>
      )}
    </section>
  );
}
