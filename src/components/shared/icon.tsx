import {
  AppWindow,
  BrainCircuit,
  ChartColumn,
  ChartPie,
  CodeXml,
  Globe,
  PenTool,
  Sparkles,
  Workflow,
  Layers,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  globe: Globe,
  "app-window": AppWindow,
  "pen-tool": PenTool,
  sparkles: Sparkles,
  "bar-chart-3": ChartColumn,
  "chart-column": ChartColumn,
  "pie-chart": ChartPie,
  "chart-pie": ChartPie,
  "brain-circuit": BrainCircuit,
  workflow: Workflow,
  "code-2": CodeXml,
  "code-xml": CodeXml,
};

export const SERVICE_ICON_OPTIONS = ["globe", "app-window", "pen-tool", "sparkles", "chart-column", "chart-pie", "brain-circuit", "workflow", "code-xml"];

export function ServiceIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = (name && ICONS[name]) || Layers;
  return <Icon className={className} />;
}
