import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Artventure Judge Console",
  description: "Internal fan art judging, scoring, ranking, and audit workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
