import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { supabaseAdmin } from "@/lib/supabase";
import bcrypt from "bcryptjs";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async ({ email, password }) => {
        const { data: user } = await supabaseAdmin
          .from("users")
          .select()
          .eq("email", email)
          .single();

        if (!user || !user.password_hash) return null;

        const valid = await bcrypt.compare(
          String(password),
          user.password_hash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.username };
      },
    }),
  ],
  callbacks: {
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
});