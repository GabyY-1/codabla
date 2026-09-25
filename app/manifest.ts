import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Codabla",
    short_name: "Codabla",
    description: "Assistant IA spécialisé dans le code.",
    start_url: "/",
    display: "standalone",
    background_color: "#151515",
    theme_color: "#151515",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml"
      }
    ]
  };
}
