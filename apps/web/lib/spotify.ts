import axios from "axios";
import qs from "qs";
const client_id = "eca06e3857cb4d93a7af41a0ffe8d1fc";
const redirect_uri = "http://localhost:3000/api/callback";

console.log('hello api =', redirect_uri)

const scopes = [
  "user-read-private",
  "user-read-email",
  "user-modify-playback-state",
  "user-read-playback-state",
  "user-library-read",
  "user-library-modify",
  "playlist-modify-public",
  "playlist-modify-private",
  "streaming",
  "user-read-currently-playing"
].join(" ");

const spotifyAuthUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&scope=${encodeURIComponent(
  scopes
)}&redirect_uri=${encodeURIComponent(redirect_uri)}&show_dialog=true`;

export const getSpotifyAuthUrl = () => {
  return spotifyAuthUrl;
};

export async function getSpotifyAccessToken(code: string) {
  const url = "https://accounts.spotify.com/api/token";
  const data = qs.stringify({
    grant_type: "authorization_code",
    code: code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data; // contains access_token, refresh_token, expires_in
  } catch (error) {
    console.error("Error getting Spotify access token:", error);
    throw new Error("Failed to get Spotify access token");
  }
}

// lib/spotify.ts
export async function refreshSpotifyAccessToken(refreshToken: string) {
  const url = "https://accounts.spotify.com/api/token";
  const data = qs.stringify({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: process.env.SPOTIFY_CLIENT_ID,
    client_secret: process.env.SPOTIFY_CLIENT_SECRET,
  });

  const headers = {
    "Content-Type": "application/x-www-form-urlencoded",
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data; // contains new access_token and expires_in
  } catch (error) {
    console.error("Error refreshing Spotify access token:", error);
    throw new Error("Failed to refresh Spotify access token");
  }
}
  
export const searchSpotify = async (query: string, accessToken: string | undefined) => {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to search songs");
  }

  const data = await response.json();
  return data.tracks.items; // List of tracks
};
  