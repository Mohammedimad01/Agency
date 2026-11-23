import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";

export const alt = siteConfig.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0f1513", color: "#f4f4f5" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 30 }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, background: "#1f6f5c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>{siteConfig.logo.mark}</div>
          {siteConfig.name}
        </div>
        <div style={{ fontSize: 68, lineHeight: 1.05, maxWidth: 980, letterSpacing: -1.5 }}>{siteConfig.tagline}</div>
        <div style={{ fontSize: 24, color: "#a1a1aa" }}>Web · Product · Data · AI</div>
      </div>
    ),
    size,
  );
}
