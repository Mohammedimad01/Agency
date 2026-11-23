import { formatMoney } from "@/lib/format";
import { bpsToPercent } from "@/lib/finance/calculations";

export interface DocLine {
  id: string;
  description: string;
  details?: string | null;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
}

/** Shared line-item + totals table for invoices and proposals (admin and portal). */
export function LineItemsTable({
  items,
  currency,
  totals,
}: {
  items: DocLine[];
  currency: string;
  totals: { subtotal_cents: number; discount_cents: number; discount_type: string; discount_value: number; tax_rate_bps: number; tax_cents: number; total_cents: number; amount_paid_cents?: number; balance_cents?: number };
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b text-left text-[12px] text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Description</th>
            <th className="w-20 py-2 text-right font-medium">Qty</th>
            <th className="w-32 py-2 text-right font-medium">Unit price</th>
            <th className="w-32 py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id} className="border-b align-top">
              <td className="py-2.5 pr-3">
                {i.description}
                {i.details ? <p className="text-[12.5px] text-muted-foreground">{i.details}</p> : null}
              </td>
              <td className="py-2.5 text-right tabular">{Number(i.quantity)}</td>
              <td className="py-2.5 text-right tabular">{formatMoney(i.unit_price_cents, currency)}</td>
              <td className="py-2.5 text-right tabular">{formatMoney(i.amount_cents, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="ml-auto mt-4 grid max-w-xs gap-1.5 text-[13.5px]">
        <Line label="Subtotal" value={formatMoney(totals.subtotal_cents, currency)} />
        {totals.discount_cents ? (
          <Line label={`Discount${totals.discount_type === "percent" ? ` (${bpsToPercent(totals.discount_value)}%)` : ""}`} value={`−${formatMoney(totals.discount_cents, currency)}`} />
        ) : null}
        {totals.tax_rate_bps ? <Line label={`Tax (${bpsToPercent(totals.tax_rate_bps)}%)`} value={formatMoney(totals.tax_cents, currency)} /> : null}
        <div className="my-1 border-t" />
        <Line label="Total" value={formatMoney(totals.total_cents, currency)} strong />
        {totals.amount_paid_cents !== undefined ? (
          <>
            <Line label="Paid" value={`−${formatMoney(totals.amount_paid_cents, currency)}`} />
            <Line label="Balance due" value={formatMoney(totals.balance_cents ?? 0, currency)} strong />
          </>
        ) : null}
      </dl>
    </div>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-[15px] font-semibold" : ""}`}>
      <dt className={strong ? "" : "text-muted-foreground"}>{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
