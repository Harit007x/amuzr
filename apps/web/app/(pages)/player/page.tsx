import MusicPlayer from "../../../components/player";
import { fetchSpotifyTokenOfUser } from "../../../lib/actions";

export default async function Page() {
  const access_token = await fetchSpotifyTokenOfUser('cm1oizfkm0000e4rxr2xe6gb0')
  console.log('token =', access_token)
  if (!access_token) {
    // Handle the case where access_token is null, e.g. show an error message or return null
    return <div>No token found</div>;
  }
  return(
    <MusicPlayer
      access_token={access_token.tokenObj.access_token}
    />
  )
}
