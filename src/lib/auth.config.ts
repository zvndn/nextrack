import type { NextAuthConfig } from "next-auth";
import type { Session } from "next-auth";

export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login"
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }: { auth: Session | null; request: { nextUrl: URL } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute =
        nextUrl.pathname.startsWith("/dashboard") ||
        nextUrl.pathname.startsWith("/profile") ||
        nextUrl.pathname.startsWith("/settings");

      if (isOnProtectedRoute) {
        if (isLoggedIn) return true;
        return false;
      }

      if (isLoggedIn && (nextUrl.pathname === "/login" || nextUrl.pathname === "/register")) {
        return Response.redirect(new URL("/dashboard", nextUrl));
      }

      return true;
    }
  },
  providers: []
} satisfies NextAuthConfig;
