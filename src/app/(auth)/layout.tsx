import { LinesShell } from "@/components/auth/lines-shell";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <LinesShell>{children}</LinesShell>;
}
