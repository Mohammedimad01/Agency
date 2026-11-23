import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { siteConfig } from "@/config/site";
import { formatDate, formatMoney } from "@/lib/format";
import { bpsToPercent } from "@/lib/finance/calculations";

const BRAND = "#1f6f5c";
const s = StyleSheet.create({
  page: { padding: 44, fontSize: 9.5, fontFamily: "Helvetica", color: "#18181b", lineHeight: 1.45 },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  mark: { width: 26, height: 26, borderRadius: 5, backgroundColor: BRAND, color: "#fff", fontSize: 15, textAlign: "center", paddingTop: 4, fontFamily: "Times-Roman" },
  brand: { fontSize: 13, fontFamily: "Helvetica-Bold", marginLeft: 8, marginTop: 5 },
  title: { fontSize: 22, fontFamily: "Helvetica-Bold", marginTop: 26, lineHeight: 1.15 },
  docNumber: { color: "#71717a", marginTop: 6 },
  muted: { color: "#71717a" },
  label: { color: "#71717a", fontSize: 8, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 3 },
  section: { marginTop: 22 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingBottom: 5, color: "#71717a", fontSize: 8.5 },
  tr: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#f0f0f2", paddingVertical: 6 },
  cDesc: { flex: 1, paddingRight: 8 },
  cNum: { width: 70, textAlign: "right" },
  totals: { marginTop: 12, marginLeft: "auto", width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2.5 },
  grand: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#18181b", paddingTop: 6, marginTop: 4, fontFamily: "Helvetica-Bold", fontSize: 11 },
  box: { marginTop: 22, padding: 12, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 6 },
  footer: { position: "absolute", bottom: 28, left: 44, right: 44, fontSize: 8, color: "#a1a1aa", flexDirection: "row", justifyContent: "space-between" },
  badge: { fontSize: 8, color: BRAND, borderWidth: 1, borderColor: BRAND, borderRadius: 3, paddingHorizontal: 6, paddingTop: 3, paddingBottom: 1, marginTop: 32, lineHeight: 1.2 },
});

export interface PdfParty {
  name: string;
  lines: (string | null | undefined)[];
}
export interface PdfLine {
  description: string;
  details?: string | null;
  quantity: number;
  unit_price_cents: number;
  amount_cents: number;
}
export interface PdfDoc {
  kind: "Invoice" | "Proposal";
  number: string;
  status: string;
  currency: string;
  issuer: PdfParty & { taxId?: string | null };
  recipient: PdfParty;
  meta: { label: string; value: string }[];
  title?: string;
  sections?: { heading: string; body: string }[];
  items: PdfLine[];
  totals: { subtotal_cents: number; discount_cents: number; discount_type: string; discount_value: number; tax_rate_bps: number; tax_cents: number; total_cents: number; amount_paid_cents?: number; balance_cents?: number };
  notes?: (string | null | undefined)[];
  paymentInstructions?: string | null;
  footer?: string | null;
}

export function BusinessDocument({ doc }: { doc: PdfDoc }) {
  const money = (v: number) => formatMoney(v, doc.currency);
  return (
    <Document title={`${doc.kind} ${doc.number}`} author={siteConfig.name} creator={siteConfig.name}>
      <Page size="A4" style={s.page}>
        <View style={s.between}>
          <View style={s.row}>
            <Text style={s.mark}>{siteConfig.logo.mark}</Text>
            <Text style={s.brand}>{doc.issuer.name}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            {doc.issuer.lines.filter(Boolean).map((l, i) => (
              <Text key={i} style={s.muted}>{l}</Text>
            ))}
            {doc.issuer.taxId ? <Text style={s.muted}>Tax ID: {doc.issuer.taxId}</Text> : null}
          </View>
        </View>

        <View style={s.between}>
          <View>
            <Text style={s.title}>{doc.kind}</Text>
            <Text style={s.docNumber}>{doc.number}</Text>
          </View>
          <Text style={s.badge}>{doc.status.replace(/_/g, " ").toUpperCase()}</Text>
        </View>

        <View style={[s.between, s.section]}>
          <View style={{ width: "50%" }}>
            <Text style={s.label}>{doc.kind === "Invoice" ? "Bill to" : "Prepared for"}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>{doc.recipient.name}</Text>
            {doc.recipient.lines.filter(Boolean).map((l, i) => (
              <Text key={i} style={s.muted}>{l}</Text>
            ))}
          </View>
          <View style={{ width: "40%" }}>
            {doc.meta.map((m) => (
              <View key={m.label} style={s.totalRow}>
                <Text style={s.muted}>{m.label}</Text>
                <Text>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {doc.title ? <Text style={{ marginTop: 22, fontSize: 13, fontFamily: "Helvetica-Bold" }}>{doc.title}</Text> : null}
        {(doc.sections ?? []).filter((x) => x.body).map((sec) => (
          <View key={sec.heading} style={{ marginTop: 12 }}>
            <Text style={s.label}>{sec.heading}</Text>
            <Text>{sec.body}</Text>
          </View>
        ))}

        <View style={s.section}>
          <View style={s.th}>
            <Text style={s.cDesc}>Description</Text>
            <Text style={s.cNum}>Qty</Text>
            <Text style={s.cNum}>Unit price</Text>
            <Text style={s.cNum}>Amount</Text>
          </View>
          {doc.items.map((i, idx) => (
            <View key={idx} style={s.tr} wrap={false}>
              <View style={s.cDesc}>
                <Text>{i.description}</Text>
                {i.details ? <Text style={[s.muted, { fontSize: 8.5 }]}>{i.details}</Text> : null}
              </View>
              <Text style={s.cNum}>{String(Number(i.quantity))}</Text>
              <Text style={s.cNum}>{money(i.unit_price_cents)}</Text>
              <Text style={s.cNum}>{money(i.amount_cents)}</Text>
            </View>
          ))}
          <View style={s.totals}>
            <View style={s.totalRow}><Text style={s.muted}>Subtotal</Text><Text>{money(doc.totals.subtotal_cents)}</Text></View>
            {doc.totals.discount_cents ? (
              <View style={s.totalRow}>
                <Text style={s.muted}>Discount{doc.totals.discount_type === "percent" ? ` (${bpsToPercent(doc.totals.discount_value)}%)` : ""}</Text>
                <Text>-{money(doc.totals.discount_cents)}</Text>
              </View>
            ) : null}
            {doc.totals.tax_rate_bps ? (
              <View style={s.totalRow}><Text style={s.muted}>Tax ({bpsToPercent(doc.totals.tax_rate_bps)}%)</Text><Text>{money(doc.totals.tax_cents)}</Text></View>
            ) : null}
            <View style={s.grand}><Text>Total</Text><Text>{money(doc.totals.total_cents)}</Text></View>
            {doc.totals.amount_paid_cents !== undefined ? (
              <>
                <View style={s.totalRow}><Text style={s.muted}>Paid</Text><Text>-{money(doc.totals.amount_paid_cents)}</Text></View>
                <View style={[s.totalRow, { fontFamily: "Helvetica-Bold" }]}><Text>Balance due</Text><Text>{money(doc.totals.balance_cents ?? 0)}</Text></View>
              </>
            ) : null}
          </View>
        </View>

        {doc.paymentInstructions ? (
          <View style={s.box} wrap={false}>
            <Text style={s.label}>Payment instructions</Text>
            <Text>{doc.paymentInstructions}</Text>
            <Text style={[s.muted, { marginTop: 4 }]}>Please use {doc.number} as your payment reference.</Text>
          </View>
        ) : null}
        {(doc.notes ?? []).filter(Boolean).map((n, i) => (
          <Text key={i} style={[s.muted, { marginTop: 10 }]}>{n}</Text>
        ))}

        <View style={s.footer} fixed>
          <Text>{doc.footer || `${siteConfig.name} · ${siteConfig.contact.email}`}</Text>
          <Text render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
        </View>
      </Page>
    </Document>
  );
}

export const fmtDate = (d: string | null | undefined) => formatDate(d);
