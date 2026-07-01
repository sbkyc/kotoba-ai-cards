import type { MetadataRoute } from "next";
import { withBasePath } from "@/lib/site/paths";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kotoba AI Cards",
    short_name: "Kotoba",
    description: "CET-4, CET-6, and JLPT N5-N1 vocabulary practice with AI quizzes.",
    id: withBasePath("/"),
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    orientation: "portrait",
    background_color: "#f5f2ea",
    theme_color: "#f5f2ea",
    categories: ["education", "productivity"],
    icons: [
      {
        src: withBasePath("/kotoba-icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: withBasePath("/kotoba-icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBasePath("/kotoba-icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
