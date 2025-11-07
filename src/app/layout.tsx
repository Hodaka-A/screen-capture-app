import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HeartSync - Screen Recording with Heart Rate",
  description: "Screen recording application with heart rate monitoring",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
