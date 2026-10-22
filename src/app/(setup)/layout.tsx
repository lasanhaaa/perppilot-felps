import { PlatformDataProvider } from "@/lib/platform-data";

/** Full-page flows that sit outside the platform shell (no sidebar). */
export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <PlatformDataProvider>{children}</PlatformDataProvider>;
}
