import { refreshSpotifyToken } from "../../lib/actions";

export const spotifyApiCall = async (originalAPIcall:any, user_id:string, access_token: string) => {
    try{
        const response = await originalAPIcall(access_token);
        return response
    }catch(error:any){
        console.log('erro = = = == = = = = = =', error)
        if (error.response && error.response.status === 401) {
            console.log('Checking the function ')
            const new_access_token = await refreshSpotifyToken(user_id);
            const response = await originalAPIcall(new_access_token)
            return response
        }
        else {
            console.error('Error calling Spotify API:', error);
            throw error;
        }
    }
}

