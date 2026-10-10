import { type FormEvent, useState } from "react";
import type {
  FinanceSummary,
  FinancialCategory,
  FinancialInstitution,
} from "../../../../shared/contracts/finance";
import { formatBrl, parseBrl } from "./brl-money";

interface SettingsPageProps {
  summary: FinanceSummary;
  categories: FinancialCategory[];
  institutions: FinancialInstitution[];
  onChanged(): Promise<void>;
}

export function SettingsPage({ summary, categories, institutions, onChanged }: SettingsPageProps) {
  const [category, setCategory] = useState<FinancialCategory>();
  const [institution, setInstitution] = useState<FinancialInstitution>();
  const [error, setError] = useState("");

  async function saveInitialBalance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const amountCents = parseBrl(String(data.get("amount")));
    if (amountCents === null) return setError("Informe um saldo inicial válido em reais.");
    try {
      await window.saldoEmDia.finance.setInitialBalance({
        amountCents,
        date: String(data.get("date")),
      });
      setError("");
      await onChanged();
    } catch {
      setError("Não foi possível salvar o saldo inicial.");
    }
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await window.saldoEmDia.finance.saveCategory({
      id: category?.id,
      name: String(data.get("name")),
      type: category?.type ?? (String(data.get("type")) as "income" | "expense"),
      active: category?.active ?? true,
    });
    setCategory(undefined);
    event.currentTarget.reset();
    await onChanged();
  }

  async function saveInstitution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await window.saldoEmDia.finance.saveInstitution({
      id: institution?.id,
      name: String(data.get("name")),
      active: institution?.active ?? true,
    });
    setInstitution(undefined);
    event.currentTarget.reset();
    await onChanged();
  }

  return (
    <div className="settings-grid">
      <section className="panel">
        <p className="eyebrow">Começo do controle</p>
        <h2>Saldo inicial</h2>
        <p className="supporting-text">
          {summary.initialBalance
            ? `Atual: ${formatBrl(summary.initialBalance.amountCents)} em ${summary.initialBalance.date.split("-").reverse().join("/")}`
            : "Ainda não informado."}
        </p>
        <form className="stack-form" onSubmit={saveInitialBalance}>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <label>
            Valor em reais
            <input name="amount" inputMode="decimal" placeholder="0,00" required />
          </label>
          <label>
            Data de início
            <input name="date" type="date" required />
          </label>
          <button className="primary-action" type="submit">
            Salvar saldo inicial
          </button>
        </form>
      </section>

      <CatalogPanel<FinancialCategory>
        title="Categorias"
        items={categories}
        onEdit={setCategory}
        onToggle={async (item) => {
          await window.saldoEmDia.finance.saveCategory({
            id: item.id,
            name: item.name,
            type: item.type,
            active: !item.active,
          });
          await onChanged();
        }}
      >
        <form className="inline-form" onSubmit={saveCategory} key={category?.id ?? "new-category"}>
          <label>
            Nome
            <input name="name" defaultValue={category?.name} required />
          </label>
          <label>
            Tipo
            <select name="type" defaultValue={category?.type ?? "expense"} disabled={!!category}>
              <option value="expense">Saída</option>
              <option value="income">Entrada</option>
            </select>
          </label>
          <button className="secondary-action" type="submit">
            {category ? "Renomear" : "Adicionar"}
          </button>
        </form>
      </CatalogPanel>

      <CatalogPanel<FinancialInstitution>
        title="Instituições"
        items={institutions}
        onEdit={setInstitution}
        onToggle={async (item) => {
          await window.saldoEmDia.finance.saveInstitution({
            id: item.id,
            name: item.name,
            active: !item.active,
          });
          await onChanged();
        }}
      >
        <form
          className="inline-form"
          onSubmit={saveInstitution}
          key={institution?.id ?? "new-institution"}
        >
          <label>
            Nome
            <input name="name" defaultValue={institution?.name} required />
          </label>
          <button className="secondary-action" type="submit">
            {institution ? "Renomear" : "Adicionar"}
          </button>
        </form>
      </CatalogPanel>
    </div>
  );
}

function CatalogPanel<T extends { id: string; name: string; active: boolean }>({
  title,
  items,
  children,
  onEdit,
  onToggle,
}: {
  title: string;
  items: T[];
  children: React.ReactNode;
  onEdit(item: T): void;
  onToggle(item: T): Promise<void>;
}) {
  return (
    <section className="panel">
      <p className="eyebrow">Organização</p>
      <h2>{title}</h2>
      {children}
      <ul className="catalog-list">
        {items.map((item) => (
          <li key={item.id}>
            <span>
              <strong>{item.name}</strong>
              <small>{item.active ? "Ativa" : "Desativada"}</small>
            </span>
            <span className="row-actions">
              <button type="button" className="text-action" onClick={() => onEdit(item)}>
                Editar
              </button>
              <button type="button" className="text-action" onClick={() => void onToggle(item)}>
                {item.active ? "Desativar" : "Reativar"}
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
