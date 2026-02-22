import NextAuth, { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";

export const authOptions: NextAuthOptions = {
    providers: [
        DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID as string,
            clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
            authorization: { params: { scope: 'identify guilds' } },
        }),
    ],
    callbacks: {
        async jwt({ token, account, profile }) {
            if (account) {
                token.accessToken = account.access_token;
                token.providerAccountId = account.providerAccountId;
            }
            if (profile) {
                token.id = (profile as any).id;
                token.username = (profile as any).username;
                token.global_name = (profile as any).global_name;
                token.image_url = (profile as any).avatar
                    ? `https://cdn.discordapp.com/avatars/${(profile as any).id}/${(profile as any).avatar}.png`
                    : null;
            }
            return token;
        },
        async session({ session, token }) {
            session.user = {
                ...session.user,
                id: token.id as string,
                username: token.username as string,
                global_name: token.global_name as string,
                image_url: token.image_url as string,
            } as any;
            return session;
        },
    },
    pages: {
        signIn: '/',
    },
    secret: process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET || "fallback_secret",
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
