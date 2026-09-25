import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Codabla",
  description: "Une IA spécialisée dans le code."
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
