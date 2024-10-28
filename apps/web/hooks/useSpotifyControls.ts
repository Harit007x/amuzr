import { useCallback } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { currentSongState, isPlayingState, queueState, volumeState } from '@repo/recoil';
import { spotifyApiCall } from '../utility/helpers/spotifyApiCall';

export const useSpotifyControls = (access_token: string, user_id: string, deviceId: string | null) => {
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [volume, setVolume] = useRecoilState(volumeState);
  const currentSong = useRecoilValue(currentSongState);

  const togglePlayPause = useCallback(async () => {
    try {
      const url = !isPlaying 
        ? 'https://api.spotify.com/v1/me/player/play'
        : 'https://api.spotify.com/v1/me/player/pause';

      await spotifyApiCall(
        (token: string) => {
          fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
        },
        user_id,
        access_token
      );
      
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error("Error toggling playback:", error);
    }
  }, [isPlaying, access_token, user_id]);

  const handleVolumeChange = useCallback(async (newVolume: number) => {
    try {
      await spotifyApiCall(
        (token: string) => {
          fetch(
            `https://api.spotify.com/v1/me/player/volume?volume_percent=${newVolume}&device_id=${deviceId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
        },
        user_id,
        access_token
      );
      
      setVolume(newVolume);
    } catch (error) {
      console.error("Error updating volume:", error);
    }
  }, [deviceId, access_token, user_id]);

  return {
    isPlaying,
    volume,
    currentSong,
    togglePlayPause,
    handleVolumeChange,
  };
};