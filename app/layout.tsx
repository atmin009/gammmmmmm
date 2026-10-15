import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "วงลับ • Spy Circle",
  description: "เกมสปายคำลับ เล่นกับเพื่อนต่อหน้า แจกคำส่วนตัว พูดใบ้ และโหวตจับสปาย",
  referrer: "no-referrer",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className="antialiased">{children}</body>
    </html>
  );
}
