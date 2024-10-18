"use client";
import Image from "next/image";
import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { SkipForward, Volume2 } from "lucide-react";
import { Button, Input, ScrollArea, Slider } from "@repo/ui/shadcn";
import { searchSpotify } from "../lib/spotify";
import { cn } from "@repo/ui/utils";
import { useRecoilValue } from "recoil";
import { userAtom } from "@repo/recoil";
import { ISpotifyPlayer, WebPlaybackInstance } from "../types/spotify";
import { Icons } from "@repo/ui/icons";

export interface Song {
  title: string;
  artist: string;
  videoId: string;
  votes: number;
  imageUrl: string;
  uri: string;
}

interface IMusicPlayer {
  access_token: string | undefined;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}

export default function MusicPlayer(props: IMusicPlayer) {
  const playerRef = useRef<any>(null);
  const deviceIdRef = useRef<string | null>(null);
  const playerStateRef = useRef<any>(null);

  const [queue, setQueue] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [volume, setVolume] = useState(50);
  const [newSong, setNewSong] = useState("");
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);  // Current playback time (in milliseconds)
  const [duration, setDuration] = useState(0);  // Total duration of the song (in milliseconds)
  const [trackDuration, setTrackDuration] = useState(0);
  const isPlayerFullyReadyRef = useRef<boolean>(false);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.length === 1 ? '0' : ''}${seconds}`;
  };

  const initializePlayer = useCallback(() => {
    if (!props.access_token) return;

    const player = new window.Spotify.Player({
      name: 'Web Playback SDK',
      getOAuthToken: (cb: any) => { cb(props.access_token as string); },
      volume: 0.5,
    });

    playerRef.current = player;

    const handlePlayerReady = ({ device_id }: WebPlaybackInstance) => {
      console.log('Ready with Device ID', device_id);
      deviceIdRef.current = device_id;
      setDeviceId(device_id);
      isPlayerFullyReadyRef.current = true;
    };

    const handlePlayerStateChanged = (state: any) => {
      console.log('State changed', state.position, state.duration);
      setProgress(state.position);
      setDuration(state.duration);
      
      if (playerStateRef.current && !playerStateRef.current.paused && state.paused && state.position === 0) {
        console.log('Track ended');
        handleTrackEnd();
      }
      
      const track = state.track_window.current_track;
      playerStateRef.current = state;
      if (track) {
        setCurrentSong({
          title: track.name,
          artist: track.artists[0].name,
          videoId: track.id,
          votes: 0,
          imageUrl: track.album.images[0]?.url,
          uri: track.uri,
        });
      }
    };

    player.addListener('ready', handlePlayerReady);
    player.addListener('not_ready', ({ device_id }: WebPlaybackInstance) => {
      console.log('Device ID has gone offline', device_id);
      setDeviceId(null);
      isPlayerFullyReadyRef.current = false;
    });
    player.addListener('player_state_changed', handlePlayerStateChanged);

    player.connect().then((success: boolean) => {
      if (success) {
        console.log('The Web Playback SDK successfully connected to Spotify!');
      }
    });

    return () => {
      player.removeListener('ready', handlePlayerReady);
      player.removeListener('not_ready');
      player.removeListener('player_state_changed', handlePlayerStateChanged);
      player.disconnect();
    };
  }, [props.access_token]);
  
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;

    document.body.appendChild(script);

    script.onload = () => {
      if (window.Spotify) {
        initializePlayer();
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, [initializePlayer]);

  const handleTrackEnd = useCallback(() => {
    setQueue((prevQueue) => {
      const newQueue = prevQueue.slice(1);
      const nextSong = newQueue[0];
      if (nextSong) {
        console.log('Playing next song');
        setCurrentSong(nextSong);
        playSong(nextSong);
      } else {
        console.log('Queue is empty');
        setCurrentSong(null);
        if (playerRef.current) {
          playerRef.current.pause().catch(console.error);
        }
      }
      return newQueue;
    });
  }, []);
  
  console.log('present queue -', queue)
  const playSong = useCallback(async (song: Song) => {
    if (!isPlayerFullyReadyRef.current || !playerRef.current || !deviceIdRef.current) {
      console.error("Spotify Web Playback SDK not initialized or device ID not available");
      // Optionally, you can retry after a short delay
      setTimeout(() => playSong(song), 1000);
      return;
    }

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceIdRef.current}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [song.uri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${props.access_token}`
        },
      });
      setCurrentSong(song);
    } catch (error) {
      console.error("Error playing the song:", error);
    }
  }, [props.access_token]);
  
  const addSong = useCallback((song: Song) => {
    setQueue((prevQueue) => {
      const newQueue = [...prevQueue, song];
      if (!currentSong && isPlayerFullyReadyRef.current) {
        playSong(song);
      }
      return newQueue;
    });
  }, [currentSong, playSong]);

  const nextSong = useCallback(() => {
    setQueue((prevQueue) => {
      const newQueue = prevQueue.slice(1);
      const nextSong = newQueue[0];
      if (nextSong) {
        setCurrentSong(nextSong);
        playSong(nextSong);
      } else {
        setCurrentSong(null);
        if (playerRef.current) {
          playerRef.current.pause().catch(console.error);
        }
      }
      return newQueue;
    });
  }, [playSong]);


  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const results = await searchSpotify(newSong, props.access_token);
    const formattedResults = results.map((item: any) => ({
      videoId: item.id,
      title: item.name,
      artist: item.artists[0].name,
      votes: 0,
      uri: item.uri,
      imageUrl: item.album.images[0]?.url
    }));
    setSearchResults(formattedResults);
    setNewSong("");
  };

  const handleSeekTrack = async (positionMs: number[]) => {
    const ms: number = positionMs[0] || 0
    console.log("check the seconds =", ms)
    if (positionMs === undefined || ms < 0) {
      console.error("Invalid position to seek.");
      return;
    }
  
    try {
      await fetch(`https://api.spotify.com/v1/me/player/seek?position_ms=${ms}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${props.access_token}`,
          'Content-Type': 'application/json'
        },
      });
  
      console.log(`Track seeked to ${ms} milliseconds.`);
    } catch (error) {
      console.error("Error seeking the track:", error);
    }
  };
  

  const handleVolumeChange = async (value: number[]) => {
    const newVolume = value[0];
  
    if (newVolume === undefined) {
      console.error("New volume not defined.");
      return;
    }
  
    try {
      await fetch(`https://api.spotify.com/v1/me/player/volume?volume_percent=${newVolume}&device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${props.access_token}`
        },
      });
      console.log("Volume updated to", newVolume);
    } catch (error) {
      console.error("Error updating the volume:", error);
    }
  
    setVolume(newVolume);
  };
  
  const fetchTrackProgress = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me/player', {
        headers: {
          'Authorization': `Bearer ${props.access_token}`,
          'Content-Type': 'application/json',
        },
      });
  
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
  
      console.log('current queueu =' , queue)
      if (progress_ms !== undefined && item) {
        const trackDuration = item.duration_ms;
        // console.log(`Track progress: ${progress_ms} / ${trackDuration}`);
        
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
    if(currentSong){
      intervalId = setInterval(() => {
        fetchTrackProgress();
      }, 1000); // Call every second
    }
  
    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [currentSong]); // Run effect when access_token changes
  
  if (!props.access_token) {
    return <div>Error: No valid token provided</div>;
  }


  const closeSearch = () => {
    setIsSearchOpen(false);
    setSearchResults([])
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-0">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="p-6 space-y-4">
          {currentSong && 
            <p className="font-bold">Now playing</p>
          }
          <div className="flex items-center space-x-4">
            {currentSong && (
              <Image
                className="rounded-lg"
                src={currentSong.imageUrl}
                alt={currentSong.title}
                width={56}
                height={24}
                style={{height:'auto', width: 'auto'}}
                priority
              />
            )}
            <div>
              <h2 className="text-md font-medium">
                {currentSong?.title || "No song playing"}
              </h2>
              <p>{currentSong?.artist || "Add songs to the queue"}</p>
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>

            <Slider
              value={[progress]}
              max={trackDuration}
              onValueChange={handleSeekTrack}
              step={1}
              className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer appearance-none"
            />
          </div>

          {currentSong && (
            <div className="flex items-center justify-between">
              <div className="space-x-2">
                {/* <Button onClick={togglePlayPause} variant="outline">
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button> */}
                <Button onClick={nextSong} variant="outline">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <Slider
                  className="w-32"
                  value={[volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          )}

          <form onSubmit={handleSearch} className="flex-col gap-4 space-y-4">
            <div className="flex justify-between w-full items-center gap-2">
              <Input
                type="text"
                value={newSong}
                onChange={(e) => setNewSong(e.target.value)}
                placeholder="Search songs on Spotify"
              />
              <Button type="submit" onClick={() => setIsSearchOpen(true)}>Search</Button>
            </div>
            {searchResults.length > 0 && isSearchOpen &&
              <div className="overflow-y-scroll h-96 border p-4 rounded-md">
                <div className="flex justify-between items-center pb-4">
                  <p>Search results</p>
                  <Button
                    size={'icon'}
                    variant="outline"
                    className="mr-2"
                    onClick={closeSearch}
                  >
                    <Icons.x className=""/>
                  </Button>
                </div>
                {searchResults.map((song) => (
                  <div
                    key={song.videoId}
                    className="flex items-center justify-center py-2 border-b last:border-b-0"
                  >
                    <div key={song.videoId} className="flex items-center space-x-4 rounded-lg w-full">
                      <Image
                        className="rounded-sm"
                        src={song.imageUrl}
                        alt={song.title}
                        width={48}
                        height={12}
                        style={{ height: 'auto', width: 'auto' }}
                        priority
                      />
                      <div className="flex-grow min-w-20">
                        <h3 className="font-medium truncate">{song.title}</h3>
                        <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="whitespace-nowrap"
                        type="button"
                        onClick={() => addSong(song)}
                      >
                        Add to queue
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </form>

          {queue.length > 0 && (
            <div className="overflow-y-scroll h-96 border p-4 rounded-md">
            <div className="flex justify-between items-center pb-4">
              <p>Current queue</p>
              <Button
                size={'icon'}
                variant="outline"
                className="mr-2"
                onClick={closeSearch}
              >
                <Icons.x className=""/>
              </Button>
            </div>
            {queue.map((song) => (
              <div
                key={song.videoId}
                className="flex items-center justify-center py-2 border-b last:border-b-0"
              >
                <div key={song.videoId} className="flex items-center space-x-4 rounded-lg w-full">
                  <Image
                    className="rounded-sm"
                    src={song.imageUrl}
                    alt={song.title}
                    width={48}
                    height={12}
                    style={{ height: 'auto', width: 'auto' }}
                    priority
                  />
                  <div className="flex-grow min-w-20">
                    <h3 className="font-medium truncate">{song.title}</h3>
                    <p className="text-sm text-gray-400 truncate">{song.artist}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="whitespace-nowrap"
                    type="button"
                    // onClick={() => addSong(song)}
                  >
                    Upvote
                  </Button>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}