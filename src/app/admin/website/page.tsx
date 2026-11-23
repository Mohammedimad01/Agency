import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { requireTeam } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { TabNav } from "@/components/shared/tab-nav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormDialog } from "@/components/shared/form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { DeleteContentButton, FaqForm, PortfolioForm, TestimonialForm } from "@/features/website/components/content-forms";
import { portfolioMetrics } from "@/features/website/queries";

export const metadata = { title: "Website" };

export default async function WebsiteAdmin({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const ctx = await requireTeam("content.manage");
  const { tab = "portfolio" } = await searchParams;
  const sb = await createClient();
  const [portfolio, testimonials, faqs] = await Promise.all([
    sb.from("portfolio_items").select("*").eq("organization_id", ctx.organizationId).order("sort_order"),
    sb.from("testimonials").select("*").eq("organization_id", ctx.organizationId).order("sort_order"),
    sb.from("faqs").select("*").eq("organization_id", ctx.organizationId).order("sort_order"),
  ]);
  const add =
    tab === "testimonials" ? (
      <FormDialog title="New testimonial" trigger={<Button size="sm"><Plus /> Testimonial</Button>}>
        <TestimonialForm />
      </FormDialog>
    ) : tab === "faqs" ? (
      <FormDialog title="New FAQ" trigger={<Button size="sm"><Plus /> FAQ</Button>}>
        <FaqForm />
      </FormDialog>
    ) : (
      <FormDialog size="xl" title="New case study" trigger={<Button size="sm"><Plus /> Case study</Button>}>
        <PortfolioForm />
      </FormDialog>
    );
  return (
    <>
      <PageHeader
        title="Website content"
        description="Edit what visitors see. Services are managed in the service catalogue."
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href="/" target="_blank">
                View site <ExternalLink />
              </Link>
            </Button>
            {add}
          </>
        }
      />
      <TabNav
        baseHref="/admin/website"
        active={tab}
        tabs={[
          { key: "portfolio", label: "Case studies", count: portfolio.data?.length },
          { key: "testimonials", label: "Testimonials", count: testimonials.data?.length },
          { key: "faqs", label: "FAQs", count: faqs.data?.length },
        ]}
      />
      {tab === "portfolio" ? (
        portfolio.data?.length ? (
          <Card>
            <ul className="divide-y">
              {portfolio.data.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-[13.5px]">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{p.title}</p>
                    <p className="truncate text-[12.5px] text-muted-foreground">
                      {p.client_name} · /portfolio/{p.slug}
                    </p>
                  </div>
                  {p.is_featured ? <Badge variant="default">Featured</Badge> : null}
                  <Badge variant={p.is_published ? "success" : "neutral"}>{p.is_published ? "Published" : "Draft"}</Badge>
                  <FormDialog size="xl" title="Edit case study" trigger={<Button variant="ghost" size="icon-sm" aria-label="Edit"><Pencil /></Button>}>
                    <PortfolioForm
                      id={p.id}
                      item={{
                        title: p.title, slug: p.slug, client_name: p.client_name ?? "", industry: p.industry ?? "", year: p.year ?? "", summary: p.summary ?? "",
                        challenge: p.challenge ?? "", solution: p.solution ?? "", results: p.results ?? "", metrics: portfolioMetrics(p).map((m) => `${m.label} | ${m.value}`).join("\n"),
                        cover_image_url: p.cover_image_url ?? "", services: p.services.join("\n"), tech_stack: p.tech_stack.join("\n"), project_url: p.project_url ?? "",
                        is_published: p.is_published, is_featured: p.is_featured, sort_order: p.sort_order,
                      }}
                    />
                  </FormDialog>
                  <DeleteContentButton table="portfolio_items" id={p.id} />
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title="No case studies" description="Published case studies appear on the homepage and /portfolio." />
        )
      ) : null}
      {tab === "testimonials" ? (
        testimonials.data?.length ? (
          <Card>
            <ul className="divide-y">
              {testimonials.data.map((t) => (
                <li key={t.id} className="flex items-start gap-3 px-5 py-3 text-[13.5px]">
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2">“{t.quote}”</p>
                    <p className="text-[12.5px] text-muted-foreground">
                      {t.author_name}
                      {t.company ? ` · ${t.company}` : ""}
                    </p>
                  </div>
                  <Badge variant={t.is_published ? "success" : "neutral"}>{t.is_published ? "Published" : "Draft"}</Badge>
                  <FormDialog title="Edit testimonial" trigger={<Button variant="ghost" size="icon-sm" aria-label="Edit"><Pencil /></Button>}>
                    <TestimonialForm id={t.id} item={{ author_name: t.author_name, author_title: t.author_title ?? "", company: t.company ?? "", quote: t.quote, rating: t.rating ?? "", is_published: t.is_published, sort_order: t.sort_order }} />
                  </FormDialog>
                  <DeleteContentButton table="testimonials" id={t.id} />
                </li>
              ))}
            </ul>
          </Card>
        ) : (
          <EmptyState title="No testimonials" description="Ask happy clients — completed projects send a review request automatically." />
        )
      ) : null}
      {tab === "faqs" ? (
        <Card>
          <ul className="divide-y">
            {(faqs.data ?? []).map((f) => (
              <li key={f.id} className="flex items-start gap-3 px-5 py-3 text-[13.5px]">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{f.question}</p>
                  <p className="line-clamp-1 text-[12.5px] text-muted-foreground">{f.answer}</p>
                </div>
                <Badge variant={f.is_published ? "success" : "neutral"}>{f.is_published ? "Published" : "Hidden"}</Badge>
                <FormDialog title="Edit FAQ" trigger={<Button variant="ghost" size="icon-sm" aria-label="Edit"><Pencil /></Button>}>
                  <FaqForm id={f.id} item={{ question: f.question, answer: f.answer, category: f.category, is_published: f.is_published, sort_order: f.sort_order }} />
                </FormDialog>
                <DeleteContentButton table="faqs" id={f.id} />
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </>
  );
}
