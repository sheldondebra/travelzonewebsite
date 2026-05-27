import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import {
  getUserForSession,
  verifyCredentials,
} from "@/server/services/auth/verify-credentials";
import { loginSchema } from "@/server/validations/auth";
import { normalizeEmail } from "@/lib/auth/email";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse({
          email: credentials?.email,
          password: credentials?.password,
        });

        if (!parsed.success) {
          throw new Error("Invalid email or password");
        }

        const user = await verifyCredentials(
          parsed.data.email,
          parsed.data.password,
        );

        if (!user) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          email: normalizeEmail(user.email),
          name: user.name,
          businessId: user.businessId,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.businessId = user.businessId ?? null;
        token.role = user.role;
      }

      if (trigger === "update") {
        let assumedBusinessId: string | null | undefined;
        if (
          session?.businessId !== undefined &&
          token.role === "PLATFORM_ADMIN"
        ) {
          const { prisma } = await import("@/lib/prisma");
          const business = await prisma.business.findUnique({
            where: { id: String(session.businessId) },
            select: { id: true },
          });
          if (business) {
            assumedBusinessId = business.id;
          }
        }
        if (token.id) {
          const dbUser = await getUserForSession(token.id as string);
          if (dbUser) {
            token.role = dbUser.role;
            token.name = dbUser.name;
            token.email = dbUser.email;
            token.businessId =
              assumedBusinessId !== undefined
                ? assumedBusinessId
                : dbUser.businessId;
          }
        } else if (assumedBusinessId !== undefined) {
          token.businessId = assumedBusinessId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id as string,
        email: (token.email as string) ?? "",
        name: (token.name as string | null) ?? null,
        businessId: (token.businessId as string | null) ?? null,
        role: (token.role as string) ?? undefined,
      };
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
};
