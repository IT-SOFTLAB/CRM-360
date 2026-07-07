import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/crm/ClientLayout";

export const metadata: Metadata = {
  title: "CRM 360",
  description: "Next-generation Odoo-style Enterprise CRM platform UI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="font-sans h-full antialiased bg-bg-main text-txt-primary">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
