import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import axios from 'axios';
import { User } from '@repo/db'; // Ensure this imports your User model
import { db } from '@repo/db'; // Your Prisma client instance

// Helper function to validate user credentials
async function validateUser(username: string, password: string): Promise<{ data: null } | { data: User }> {
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000'; // Use environment variable for the base URL
  const url = `${baseUrl}/api/login`;
  const headers = {
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    'Client-Service': process.env.CLIENT_SERVICE_KEY || 'default-client-service',
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    'Auth-Key': process.env.AUTH_SECRET || 'AUTH_SECRET',
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  const body = new URLSearchParams();
  body.append('username', username);
  body.append('password', password);

  try {
    const response = await axios.post(url, body, { headers });

    if (response.data.status === 401) {
      throw new Error(`Authentication failed: ${response.data.message}`);
    }

    return response.data; // Return the user data from your API
  } catch (error) {
    console.error('Error validating user:', error);
    return { data: null }; // Return null on error
  }
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        username: { label: 'Email', type: 'text', placeholder: '' },
        password: { label: 'Password', type: 'password', placeholder: '' },
      },
      async authorize(credentials: any): Promise<any> {
        try {
          const user = await validateUser(credentials.username, credentials.password);
          if (user.data !== null) {
            // Persist user in the database
            const { email, name , profile_image } = user.data; // Adjust based on your user data structure

            // Create or update the user in the database
            const dbUser = await db.user.upsert({
              where: { email }, // Assuming email is unique
              update: { name }, // Update fields if user exists
              create: { email, name, profile_image }, // Create a new user
            });

            return dbUser; // Return the persisted user
          }
          return null; // Return null if user data could not be retrieved
        } catch (e) {
          console.error('Error in authorize:', e);
          return null;
        }
      },
    }),
    GoogleProvider({
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      // eslint-disable-next-line turbo/no-undeclared-env-vars
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      async profile(profile) {
        console.log("g user =", profile)
        const { email, name, picture } = profile; // Adjust based on what profile returns

        // Create or update the user in the database
        const dbUser = await db.user.upsert({
          where: { email }, // Assuming email is unique
          update: { name }, // Update fields if user exists
          create: { email, name, profile_image: picture }, // Create a new user
        });

        return dbUser;
      },
    }),
  ],
  // eslint-disable-next-line turbo/no-undeclared-env-vars
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }:any) {
      if (session?.user) {
        session.user.id = token.id; // Assuming your user model has an `id` field
      }
      return session;
    },
    async jwt({ user, token }:any) {
      if (user) {
        token.id = user.id; // Assuming your user model has an `id` field
      }
      return token;
    },
  },
  pages: {
    signIn: '/login',
  },
};
