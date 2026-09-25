import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://codabla.horibli.com"),
  title: {
    default: "Codabla",
    template: "%s · Codabla"
  },
  description: "Codabla, l’assistant IA spécialisé dans le code.",
  applicationName: "Codabla",
  icons: {
    icon: "/icon.svg"
  },
  openGraph: {
    title: "Codabla",
    description: "Crée, corrige, explique et améliore ton code avec Codabla.",
    url: "https://codabla.horibli.com",
    siteName: "Codabla",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
