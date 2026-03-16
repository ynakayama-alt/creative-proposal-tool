import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "企画書作成ツール",
  description: "AIを活用した企画書自動作成ツール",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 min-h-screen">{children}</body>
    </html>
  );
}
