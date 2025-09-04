import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import LinkedInProvider from "next-auth/providers/linkedin"
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import { MongoClient } from "mongodb"

const client = new MongoClient(process.env.MONGODB_URI!)
const clientPromise = client.connect()

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid profile email',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Custom sign-in logic will be handled here
      // We'll trigger OTP generation after OAuth success
      return true
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.provider = token.provider as string
        session.user.providerAccountId = token.providerAccountId as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
}