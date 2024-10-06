'use server';
import { db } from "@repo/db"
import axios from 'axios';

export const fetchSpotifyTokenOfUser = async (userId: string) => {
    const tokenObj = await db.spotifyTokens.findFirst({
      where: { userId }
    });

    if (!tokenObj) {
      throw new Error("No token found for this user");
    }

    // Check if the token has expired
    const currentTime = Math.floor(Date.now() / 1000); // current time in seconds
    const tokenExpiryTime = tokenObj.createdAt.getTime() / 1000 + tokenObj.expires_in;

    if (currentTime >= tokenExpiryTime) {
      // Token has expired, refresh it
      console.log('Token has expired. Refreshing...');

      const refreshToken = tokenObj.refresh_token;

      try {
        // Call the Spotify API to refresh the token
        const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: process.env.NEXT_SPOTIFY_CLIENT_ID as string,
          client_secret: process.env.NEXT_SPOTIFY_CLIENT_SECRET as string,
        }), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        const { access_token, expires_in } = response.data;
        
        // Update the database with the new access token
        await db.spotifyTokens.update({
        where: { id: tokenObj.id },
          data: {
            access_token,
            expires_in,
            createdAt: new Date() // Update with the current time
          }
        });

        console.log('Token refreshed successfully');
        return { tokenObj };

      } catch (error) {
        console.error('Error refreshing Spotify token:', error);
        throw new Error("Failed to refresh token");
      }
    }

    // Token is still valid, return it
    return { tokenObj };
}
