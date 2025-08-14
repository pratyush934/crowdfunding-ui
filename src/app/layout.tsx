import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import { SolanaProvider } from "@/components/SolanaProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SolanaProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 w-full flex flex-col items-center">
                <div className="w-full">{children}</div>
              </main>
              <Footer />
            </div>
          </SolanaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
