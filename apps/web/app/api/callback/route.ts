import { NextResponse } from "next/server";
import axios from "axios";
import { db } from "@repo/db";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";
// import { toast } from 'sonner';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  console.log("session =", session?.user?.name);

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const redirect_uri = process.env.NEXT_SPOTIFY_REDIRECT_URI as string;
  const client_id = process.env.NEXT_SPOTIFY_CLIENT_ID as string;
  const client_secret = process.env.NEXT_SPOTIFY_CLIENT_SECRET as string;
  console.log('jhey ehey  - - - - - ', redirect_uri, client_id, typeof client_secret)
  try {
    // Exchange authorization code for access token
    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri,
      client_id,
      client_secret,
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    console.log("all data =", response.data)
    const { access_token, refresh_token, expires_in } = response.data;
    
    // Create Spotify tokens for the user
    await createSpotifyTokensForUser(session?.user?.id, access_token, refresh_token, expires_in);
    // toast.success("Spotify account connected successfully", {
    //   duration: 1500,
    // });
    console.log("checking it passed - - - -- - - -")
    return NextResponse.redirect(new URL('/', request.url));
    
  } catch (error) {
    console.error('Error fetching Spotify token:', error);
    return NextResponse.json({ error: 'Failed to fetch Spotify token' }, { status: 500 });
  }
}

async function createSpotifyTokensForUser(userId: string, accessToken: string, refreshToken: string, expires_in: number) {
  console.log("check the params =", userId, accessToken, refreshToken);
  try {
    const spotifyToken = await db.spotifyTokens.create({
      data: {
        access_token: accessToken,
        refresh_token: refreshToken,
        expires_in: expires_in,
        user: {
          connect: { id: userId },
        }
      }
    });

    console.log('Spotify Tokens created:', spotifyToken);
  } catch (error) {
    console.error('Error creating Spotify token:', error);
    throw error; // Ensure any error is thrown to be caught in the main handler
  } finally {
    await db.$disconnect();
  }
}
