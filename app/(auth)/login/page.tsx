import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="w-full max-w-sm text-center text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
