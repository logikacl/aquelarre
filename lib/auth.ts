import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { backendPost } from "@/lib/backend";

const adminEmails = (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase());

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (creds) => {
        const email = String(creds?.email ?? "").toLowerCase();
        const password = String(creds?.password ?? "");
        try {
          const user = await backendPost<{ email: string; name: string }>(
            "/api/auth/login",
            { email, password },
            "web",
          );
          return { id: user.email, email: user.email, name: user.name };
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    jwt({ token }) {
      token.isAdmin = adminEmails.includes(String(token.email ?? "").toLowerCase());
      return token;
    },
    session({ session, token }) {
      (session as any).isAdmin = token.isAdmin ?? false;
      return session;
    },
  },
});
