import axios from 'axios';

// eslint-disable-next-line turbo/no-undeclared-env-vars
const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY; // Store in environment variable

export const searchYouTube = async (query: string) => {
  console.log('my key =', YOUTUBE_API_KEY)
  try {
    const { data } = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        maxResults: 2,
        q: query,
        key: YOUTUBE_API_KEY,
        type: 'video'
      }
    });

    return data.items.map((item:any) => ({
      videoId: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.default.url
    }));
  } catch (error:any) {
    console.error("Error =", error.response ? error.response.data : error.message);
  }
};
