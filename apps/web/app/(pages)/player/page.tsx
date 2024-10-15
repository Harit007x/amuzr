import MusicPlayer from "../../../components/player";
import { fetchSpotifyTokenOfUser } from "../../../lib/actions"; // Import the action
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../lib/auth";

// This is a server component in Next.js
export default async function Page() {
  // Get the session from NextAuth
  const session = await getServerSession(authOptions);

  // Fetch the Spotify token for the current user using the server action
  const { access_token } = await fetchSpotifyTokenOfUser(session?.user?.id);

  // Handle the case where access_token is null or undefined
  if (!access_token) {
    return <div>No Spotify token found. Please connect your Spotify account.</div>;
  }

  // Pass the token to your MusicPlayer component
  return (
    <MusicPlayer
      access_token={access_token} // Pass the fetched access token
    />
  );
}
