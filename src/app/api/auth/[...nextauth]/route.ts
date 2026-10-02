import NextAuth from "next-auth";
import { authOptions } from "@/server/platform/auth/auth.config";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
