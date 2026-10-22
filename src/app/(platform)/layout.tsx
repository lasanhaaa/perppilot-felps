import { AppShell } from "@/components/shell/app-shell";
import { PlatformDataProvider } from "@/lib/platform-data";

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <PlatformDataProvider>
      <AppShell>{children}</AppShell>
    </PlatformDataProvider>
  );
}
