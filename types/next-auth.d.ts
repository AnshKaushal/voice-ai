import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      onboardingCompleted: boolean;
      businessId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    onboardingCompleted?: boolean;
    businessId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    onboardingCompleted: boolean;
    businessId: string | null;
  }
}
