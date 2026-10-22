import { AuthArt } from "@/components/auth/auth-art";
import { AuthFooter } from "@/components/auth/auth-ui";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <AuthArt />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col">
        {children}
        <AuthFooter />
      </main>
    </div>
  );
}
