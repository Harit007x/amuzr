import { useEffect, useRef, useCallback } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { currentSongState, isPlayingState, queueState, progressState, durationState, searchResultsState } from '@repo/recoil';
import { spotifyApiCall } from '../utility/helpers/spotifyApiCall';
import { Song } from '../types/spotify';

export const useSpotifyPlayer = (access_token: string | undefined, user_id: string) => {
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const playerStateRef = useRef<any>(null);
  const isPlayerFullyReadyRef = useRef<boolean>(false);
  const queueRef = useRef<Song[]>([]); // Ref to hold the latest queue state

  const [currentSong, setCurrentSong] = useRecoilState(currentSongState);
  const [isPlaying, setIsPlaying] = useRecoilState(isPlayingState);
  const [searchResults, setSearchResults] = useRecoilState(searchResultsState);
  const [queue, setQueue] = useRecoilState(queueState);
  // const [trackDuration, setTrackDuration] = useState(0);
  const [progress, setProgress] = useRecoilState(progressState);
  const [trackDuration, setTrackDuration] = useRecoilState(durationState);

  const playSong = useCallback(async (song: Song) => {
    if (!isPlayerFullyReadyRef.current || !playerRef.current || !deviceIdRef.current) {
      setTimeout(() => playSong(song), 1000);
      return;
    }

    try {
      await spotifyApiCall(
        (access_token: string) => {
          fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [song.uri] }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${access_token}`
            },
          });
        },
        user_id,
        access_token as string
      );

      setIsPlaying(true);
      setCurrentSong(song);
    } catch (error) {
      console.error("Error playing the song:", error);
    }
  }, [access_token]);
  
  const handleTrackEnd = useCallback(() => {
    setQueue((currentQueue:any) => {
      console.log('Current queue in handleTrackEnd:', currentQueue);
      
      if (!currentQueue || currentQueue.length === 0) {
        console.log('Queue is empty');
        setTimeout(()=>{
          setIsPlaying(false);
        },0)
        if (playerRef.current) {
          playerRef.current.pause().catch(console.error);
        }
        return currentQueue;
      }
      console.log('current queue =', currentQueue)
      const newQueue = currentQueue.slice(1);
      const nextSong = newQueue[0];
      console.log('inspect =', newQueue,  'wow =',nextSong)
      const previousSong = currentQueue[0];
      console.log('Next song:', nextSong);
      console.log('New queue:', newQueue);

      if (nextSong) {
        // Schedule state updates for the next tick to avoid batch updates
        setTimeout(() => {
          setCurrentSong(nextSong);
          setIsPlaying(true);
          playSong(nextSong);
        }, 0);

        if (previousSong) {
          console.log('prev song =', previousSong)
          setTimeout(()=>{
            setSearchResults((prevResults: Song[]) => 
              prevResults?.map((search_song) => {
                console.log('updating record =', prevResults)
                const updatedSong = {...search_song, added_to_queue: false}
                return(
                  search_song.songId === previousSong.songId 
                  ? updatedSong
                  : search_song
                )
              }) || []
            );
          },0)
        }
      }

      return newQueue;
    });
  }, [setQueue, setCurrentSong, setIsPlaying, playSong, setSearchResults, searchResults, isPlaying]);
  // console.log('udpate resutls =', searchResults)

  const initializePlayer = useCallback(() => {
    if (!access_token) return;

    const player = new window.Spotify.Player({
      name: 'Web Playback SDK',
      getOAuthToken: (cb: any) => { cb(access_token); },
      volume: 0.5,
    });

    playerRef.current = player;

    player.addListener('ready', ({ device_id }:any) => {
      deviceIdRef.current = device_id;
      isPlayerFullyReadyRef.current = true;
    });

    player.addListener('player_state_changed', (state: any) => {
      setTrackDuration(state.duration);
      
      if (playerStateRef.current && !playerStateRef.current.paused && state.paused && state.position === 0) {
        handleTrackEnd();
      }
      
      const track = state.track_window.current_track;
      playerStateRef.current = state;
      if (track) {
        setCurrentSong({
          title: track.name,
          artist: track.artists[0].name,
          songId: track.id,
          votes: 0,
          imageUrl: track.album.images[0]?.url,
          uri: track.uri,
        });
      }
    });

    player.connect();

    return () => {
      player.disconnect();
    };
  }, [access_token]);


  const handleProgressChange = (value: number[]) => {
    const newProgress = value[0];
    setProgress(newProgress as number)
  }

  const handleSeekTrack = async (positionMs: number[]) => {
    const ms: number = positionMs[0] || 0
    if (positionMs === undefined || ms < 0) {
      console.error("Invalid position to seek.");
      return;
    }
  
    try {
      await spotifyApiCall(
        (access_token: string) => {
          fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${ms}&device_id=${deviceIdRef.current}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json'
            },
          }); 
        },
        user_id,
        access_token as string
      );
      console.log(`Track seeked to ${ms} milliseconds.`);
    } catch (error) {
      console.error("Error seeking the track:", error);
    }
  };

  let progressIntervalId: NodeJS.Timeout | null = null;

  const startProgressPolling = useCallback(() => {
    if (progressIntervalId) {
      clearInterval(progressIntervalId);
    }
  
    progressIntervalId = setInterval(() => {
      fetchTrackProgress();
    }, 1000);
  
    return progressIntervalId;
  }, []);

  const stopProgressPolling = useCallback(() => {
    if (progressIntervalId) {
      clearInterval(progressIntervalId);
      progressIntervalId = null;
    }
  }, []);

  const handleDragStart = () => {
    // setIsDragging(true);
    stopProgressPolling();
  };
  
  const handleDragEnd = () => {
    // setIsDragging(false);
  };

  const fetchTrackProgress = async () => {
    try {
      const response = await spotifyApiCall(
        (access_token: string) => {
          return fetch('https://api.spotify.com/v1/me/player', {
            headers: {
              'Authorization': `Bearer ${access_token}`,
              'Content-Type': 'application/json',
            },
          });
        },
        user_id,
        access_token as string
      );
      
      if (!response.ok) {
        console.error("Failed to fetch track progress:", response.statusText);
        return;
      }
  
      // Check if the response body is empty
      const textResponse = await response.text();
      if (!textResponse) {
        console.log("Empty response body, no track is playing.");
        return;
      }
  
      const data = JSON.parse(textResponse);
      const { progress_ms, item } = data;
  
      if (progress_ms !== undefined && item) {
        const trackDuration = item.duration_ms;
        
        setProgress(progress_ms);
        setTrackDuration(trackDuration);
      } else {
        console.log("No track is currently playing.");
      }
  
    } catch (error) {
      console.error("Error fetching track progress:", error);
    }
  };

  useEffect(() => {
    let intervalId = undefined
 
    if(!isPlaying){
      stopProgressPolling()
      return;
    }

    if(currentSong){
      intervalId = startProgressPolling(); 
    }
  
    return () => clearInterval(intervalId);
  }, [currentSong, isPlaying]);
 
  return {
    playerRef,
    deviceIdRef,
    isPlayerFullyReadyRef,
    queueRef,
    playSong,
    initializePlayer,
    handleProgressChange,
    handleSeekTrack,
    handleDragStart,
    handleDragEnd,
    progress,
    trackDuration,
    currentSong
  };
};