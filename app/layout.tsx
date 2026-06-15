import "./globals.css";
import { FinanceProvider } from "@/lib/store";
import Sidebar from "@/components/Sidebar";

export const metadata = {
  title: "Finance OS",
  description: "Gestão financeira pessoal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <FinanceProvider userId="local-user">
          <Sidebar userEmail="" />
          <main className="lg:ml-56 min-h-screen">
            <div className="max-w-7xl mx-auto px-4 lg:px-7 pt-16 lg:pt-7 pb-10">
              {children}
            </div>
          </main>
        </FinanceProvider>
      </body>
    </html>
  );
}