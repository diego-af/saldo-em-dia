import { type FormEvent, useCallback, useEffect, useState } from "react";
import type {
  CardInvoice,
  CardPurchase,
  CardSummary,
  CreditCard,
} from "../../../../shared/contracts/credit-card";
import type { FinancialCategory, FinancialInstitution } from "../../../../shared/contracts/finance";
import { formatBrl, parseBrl } from "../transactions/brl-money";

interface CreditCardPageProps {
  categories: FinancialCategory[];
  institutions: FinancialInstitution[];
  onChanged(): Promise<void>;
}

export function CreditCardPage({ categories, institutions, onChanged }: CreditCardPageProps) {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [summary, setSummary] = useState<CardSummary>();
  const [invoices, setInvoices] = useState<CardInvoice[]>([]);
  const [purchases, setPurchases] = useState<CardPurchase[]>([]);
  const [error, setError] = useState("");
  const activeInstitutions = institutions.filter(({ active }) => active);
  const expenseCategories = categories.filter(({ active, type }) => active && type === "expense");

  const load = useCallback(async () => {
    const nextCards = await window.saldoEmDia.creditCards.getCards();
    setCards(nextCards);
    const card = nextCards[0];
    if (!card) return;
    const [nextSummary, nextInvoices, nextPurchases] = await Promise.all([
      window.saldoEmDia.creditCards.getSummary(card.id),
      window.saldoEmDia.creditCards.listInvoices(card.id),
      window.saldoEmDia.creditCards.getPurchases(card.id),
    ]);
    setSummary(nextSummary);
    setInvoices(nextInvoices);
    setPurchases(nextPurchases);
  }, []);

  useEffect(() => {
    void load().catch(() => setError("Não foi possível carregar o cartão."));
  }, [load]);

  async function saveCard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const limitCents = parseBrl(String(data.get("limit")));
    if (!limitCents || limitCents <= 0) return setError("Informe um limite válido.");
    try {
      await window.saldoEmDia.creditCards.saveCard({
        institutionId: String(data.get("institutionId")),
        limitCents,
        closingDay: Number(data.get("closingDay")),
        dueDay: Number(data.get("dueDay")),
      });
      setError("");
      await load();
    } catch {
      setError("Não foi possível salvar o cartão. Confira os dados.");
    }
  }

  async function savePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!summary) return;
    const data = new FormData(event.currentTarget);
    const totalCents = parseBrl(String(data.get("total")));
    if (!totalCents || totalCents <= 0) return setError("Informe um valor válido.");
    try {
      await window.saldoEmDia.creditCards.createPurchase({
        cardId: summary.card.id,
        categoryId: String(data.get("categoryId")),
        description: String(data.get("description")).trim() || undefined,
        totalCents,
        purchaseDate: String(data.get("purchaseDate")),
        installmentCount: Number(data.get("installmentCount")),
      });
      event.currentTarget.reset();
      setError("");
      await load();
      await onChanged();
    } catch {
      setError("Não foi possível salvar a compra. Verifique o limite e os dados.");
    }
  }

  async function pay(invoice: CardInvoice) {
    const paymentDate = new Intl.DateTimeFormat("en-CA").format(new Date());
    try {
      await window.saldoEmDia.creditCards.payInvoice({
        cardId: invoice.cardId,
        month: invoice.month,
        paymentDate,
      });
      setError("");
      await load();
      await onChanged();
    } catch {
      setError("Não foi possível pagar a fatura.");
    }
  }

  if (cards.length === 0) {
    return (
      <section className="panel form-panel">
        <p className="eyebrow">Cartão próprio</p>
        <h2>Cadastrar cartão</h2>
        {error && <p className="form-error">{error}</p>}
        {activeInstitutions.length === 0 ? (
          <p className="notice">Cadastre uma instituição ativa em Configurações primeiro.</p>
        ) : (
          <form className="form-grid" onSubmit={saveCard}>
            <label>
              Instituição
              <select name="institutionId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {activeInstitutions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Limite total
              <input name="limit" inputMode="decimal" placeholder="0,00" required />
            </label>
            <label>
              Dia de fechamento
              <input name="closingDay" type="number" min="1" max="31" required />
            </label>
            <label>
              Dia de vencimento
              <input name="dueDay" type="number" min="1" max="31" required />
            </label>
            <button className="primary-action" type="submit">
              Salvar cartão
            </button>
          </form>
        )}
      </section>
    );
  }

  return (
    <div className="card-page">
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      {summary && (
        <div className="summary-grid">
          <Summary title="Limite total" value={summary.limitCents} />
          <Summary title="Limite comprometido" value={summary.committedCents} />
          <Summary title="Limite disponível" value={summary.availableCents} />
        </div>
      )}
      <section className="panel form-panel">
        <p className="eyebrow">Gasto assumido</p>
        <h2>Nova compra no cartão</h2>
        {expenseCategories.length === 0 ? (
          <p className="notice">Crie uma categoria de saída ativa antes de lançar.</p>
        ) : (
          <form className="form-grid" onSubmit={savePurchase}>
            <label>
              Valor total
              <input name="total" inputMode="decimal" placeholder="0,00" required />
            </label>
            <label>
              Data da compra
              <input name="purchaseDate" type="date" required />
            </label>
            <label>
              Parcelas
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
              Categoria
              <select name="categoryId" required defaultValue="">
                <option value="" disabled>
                  Selecione
                </option>
                {expenseCategories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="full-field">
              Descrição (opcional)
              <input name="description" maxLength={500} />
            </label>
            <button className="primary-action" type="submit">
              Salvar compra
            </button>
          </form>
        )}
      </section>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Obrigações futuras</p>
            <h2>Faturas</h2>
          </div>
        </div>
        {invoices.length === 0 ? (
          <p className="supporting-text">Nenhuma fatura.</p>
        ) : (
          <ul className="catalog-list">
            {invoices.map((invoice) => (
              <li key={invoice.month}>
                <span>
                  <strong>
                    {invoice.month.split("-").reverse().join("/")} ·{" "}
                    {formatBrl(invoice.amountCents)}
                  </strong>
                  <small>
                    Vence em {invoice.dueDate.split("-").reverse().join("/")} ·{" "}
                    {invoice.paidAt ? "Paga" : "Pendente"}
                  </small>
                </span>
                {!invoice.paidAt && (
                  <button
                    className="secondary-action"
                    type="button"
                    onClick={() => void pay(invoice)}
                  >
                    Pagar integralmente
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="panel">
        <p className="eyebrow">Compras</p>
        <h2>Histórico do cartão</h2>
        <ul className="catalog-list">
          {purchases.map((purchase) => (
            <li key={purchase.id}>
              <span>
                <strong>{purchase.description || "Compra"}</strong>
                <small>
                  {formatBrl(purchase.totalCents)} · {purchase.installmentCount}x ·{" "}
                  {purchase.purchaseDate.split("-").reverse().join("/")}
                </small>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Summary({ title, value }: { title: string; value: number }) {
  return (
    <article className="summary-card">
      <p>{title}</p>
      <strong>{formatBrl(value)}</strong>
    </article>
  );
}
