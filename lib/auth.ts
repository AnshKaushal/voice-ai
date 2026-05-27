import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/user";
import { Business } from "@/lib/models/business";
import { VerificationToken } from "@/lib/models/verification-token";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = (credentials.email as string).toLowerCase();

        // OTP flow (used during registration)
        if (credentials.otp) {
          const otp = credentials.otp as string;
          await connectDB();

          const stored = await VerificationToken.findOne({
            identifier: email,
            token: otp,
            expires: { $gt: new Date() },
          });

          if (!stored) return null;

          await VerificationToken.deleteOne({ _id: stored._id });

          let user = await User.findOne({ email });
          if (!user) {
            user = await User.create({
              email,
              emailVerified: new Date(),
              onboardingCompleted: false,
            });
          } else if (!user.emailVerified) {
            user.emailVerified = new Date();
            await user.save();
          }

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || "",
            image: user.image || "",
            onboardingCompleted: user.onboardingCompleted,
            businessId: user.businessId?.toString() || null,
          };
        }

        // Password flow (used during login)
        if (credentials.password) {
          await connectDB();
          const user = await User.findOne({ email });
          if (!user || !user.password) return null;

          const valid = await bcrypt.compare(credentials.password as string, user.password);
          if (!valid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name || "",
            image: user.image || "",
            onboardingCompleted: user.onboardingCompleted,
            businessId: user.businessId?.toString() || null,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        await connectDB();
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create({
            email: user.email!.toLowerCase(),
            name: user.name || "",
            image: user.image || "",
            emailVerified: new Date(),
            onboardingCompleted: false,
          });
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.id = user.id;
        token.onboardingCompleted = (user as Record<string, unknown>).onboardingCompleted ?? false;
        token.businessId = (user as Record<string, unknown>).businessId ?? null;
      }

      if (trigger === "update") {
        if (updateData) {
          const data = updateData as Record<string, unknown>;
          if (typeof data.onboardingCompleted !== "undefined") {
            token.onboardingCompleted = data.onboardingCompleted as boolean;
          }
          if (typeof data.businessId !== "undefined") {
            token.businessId = data.businessId as string | null;
          }
          if (typeof data.name === "string") {
            token.name = data.name;
          }
        } else {
          await connectDB();
          const dbUser = await User.findById(token.id);
          if (dbUser) {
            token.onboardingCompleted = dbUser.onboardingCompleted;
            token.businessId = dbUser.businessId?.toString() || null;
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        (session.user as unknown as Record<string, unknown>).onboardingCompleted = token.onboardingCompleted;
        (session.user as unknown as Record<string, unknown>).businessId = token.businessId;
      }
      return session;
    },
    authorized({ auth: session }) {
      return !!session?.user;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
