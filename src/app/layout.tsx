import type { Metadata } from "next";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { LenisProvider } from "@/components/motion/lenis-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Cold Outreach Platform — AI Lead Generation & Outreach",
  description: "Autonomous lead generation, duplicate-protected cold outreach, and intelligent inbox opportunity classifier.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20 selection:text-primary">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <LenisProvider>
            {children}
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
