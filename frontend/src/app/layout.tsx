import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/crm/ClientLayout";
import AIAssistant from "@/components/ai/AIAssistant"; 

export const metadata: Metadata = {
  title: "CRM 360",
  description: "IT 360 CRM",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('theme') || 'light';
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('light');
                }
              })();
            `,
          }}
        />
      </head>

      <body className="font-sans h-full antialiased bg-bg-main text-txt-primary">
        <ClientLayout>
          {children}

          
          <AIAssistant />
        </ClientLayout>
      </body>
    </html>
  );
}