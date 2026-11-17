import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import { StoreProvider } from "@/lib/store";
import { PrototypeBar } from "@/components/prototype-bar";
import "./globals.css";

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter-tight",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PerpPilot · New design 2027 prototype",
  description: "Clickable prototype of the new PerpPilot onboarding: sign up, connect an exchange, start a bot.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={interTight.variable}>
      <body>
        <StoreProvider>
          {children}
          <PrototypeBar />
        </StoreProvider>
      </body>
    </html>
  );
}
