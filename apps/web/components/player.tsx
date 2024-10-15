"use client";
import Image from "next/image";
import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { Play, Pause, SkipForward, Volume2 } from "lucide-react";
import { Button, Input, ScrollArea, Slider } from "@repo/ui/shadcn";
import { searchSpotify } from "../lib/spotify";
import { cn } from "@repo/ui/utils";
import { addSongsToRoom } from "../lib/actions";
import { useRecoilValue } from "recoil";
import { userAtom } from "@repo/recoil";
import { ISpotifyPlayer, WebPlaybackInstance } from "../types/spotify";

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

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [queue, setQueue] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [newSong, setNewSong] = useState("");
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [spotifyPlayer, setSpotifyPlayer] = useState<ISpotifyPlayer | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const user = useRecoilValue(userAtom);
  const [progress, setProgress] = useState(0);  // Current playback time (in milliseconds)
  const [duration, setDuration] = useState(0);  // Total duration of the song (in milliseconds)
  const [isDragging, setIsDragging] = useState(false);
  const [trackDuration, setTrackDuration] = useState(0);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.length === 1 ? '0' : ''}${seconds}`;
  };

  useLayoutEffect(() => {
    if (!props.access_token) return;
  
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
  
    window.onSpotifyWebPlaybackSDKReady = () => {
      const player = new window.Spotify.Player({
        name: 'Web Playback SDK',
        getOAuthToken: (cb: any) => { cb(props.access_token as string); },
        volume: 0.5,
      });
  
      setSpotifyPlayer(player);
  
      const handlePlayerReady = ({ device_id }: WebPlaybackInstance) => {
        console.log('Ready with Device ID', device_id);
        playerRef.current = player;
        deviceIdRef.current = device_id;
        setDeviceId(device_id);
        setIsPlayerReady(true);
      };
  
      const handlePlayerNotReady = ({ device_id }: WebPlaybackInstance) => {
        console.log('Device ID has gone offline', device_id);
        setDeviceId(null);
      };
  
      const handlePlayerStateChanged = (state: any) => {
        console.log('State changed', state);
        setIsPlaying(!state.paused);
        setProgress(state.position);
        setDuration(state.duration);
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
      player.addListener('not_ready', handlePlayerNotReady);
      player.addListener('player_state_changed', handlePlayerStateChanged);
  
      player.connect().then((success:boolean) => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!', success);
        }
      });

      // Cleanup function
      // return () => {
      //   console.log("cleanup called")
      //   player.removeListener('ready', handlePlayerReady);
      //   player.removeListener('not_ready', handlePlayerNotReady);
      //   player.removeListener('player_state_changed', handlePlayerStateChanged);
      //   player.disconnect();
  
      //   if (script && document.body.contains(script)) {
      //     document.body.removeChild(script);
      //   }
      // };
    };
  
    // In case the script fails to load or is removed externally
    return () => {
      if (script && document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [props.access_token]);
  
  

  useEffect(() => {
    if (!isPlayerReady) return; // Only proceed if the player is ready
    console.log("outside player =", spotifyPlayer);
  
    const updatePlayerState = async () => {
      if (spotifyPlayer) {
        console.log("inside player =", spotifyPlayer);

        try {
          const state = await spotifyPlayer.getCurrentState();
          if (state) {
            const { position, duration } = state;
            if (!isDragging) {
              setProgress(position);
            }
            setDuration(duration);
          }
        } catch (error) {
          console.error("Error getting current state:", error);
        }
      }
    };
  
    const intervalId = setInterval(() => {
      updatePlayerState();
    }, 1000); // Update every second
  
    return () => clearInterval(intervalId);
  }, [spotifyPlayer, isDragging]);
  

  // useEffect(() => {
  //   if (isPlayerReady && player) {
  //     player.setVolume(volume / 100).catch(console.error);
  //   }
  // }, [isPlayerReady, volume]);
  // useEffect(() => {
  //   const intervalId = setInterval(() => {
  //     if (player) {
  //       player.getCurrentState().then((state: any) => {
  //         if (state) {
  //           const { position, duration } = state;
  //           if (!isDragging) {
  //             setProgress(position);
  //           }
  //           setDuration(duration);
  //         }
  //       }).catch((error: any) => {
  //         console.error("Error getting current state:", error);
  //       });
  //     }
  //   }, 1000); // Update every second

  //   return () => clearInterval(intervalId);
  // }, [player, isDragging, deviceId]);

  const addSong = (song: Song) => {
    setQueue([...queue, song]);
    // saveSongsToDb([...[], song]);

    if (!currentSong) {
      // setCurrentSong(song);
      playSong(song);
    }
  };

  const playSong = async (song: Song) => {
    if (!spotifyPlayer || !deviceId) {
      console.error("Spotify Web Playback SDK not initialized or device ID not available");
      return;
    }

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        body: JSON.stringify({ uris: [song.uri] }),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${props.access_token}`
        },
      });
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing the song:", error);
    }
  };

  const nextSong = () => {
    setQueue(queue.slice(1));
    const nextSong = queue[1];
    if (nextSong) {
      setCurrentSong(nextSong);
      playSong(nextSong);
    } else {
      setCurrentSong(null);
      spotifyPlayer?.pause();
      setIsPlaying(false);
    }
  };

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
  
      if (progress_ms !== undefined && item) {
        const trackDuration = item.duration_ms;
        console.log(`Track progress: ${progress_ms} / ${trackDuration}`);
        setProgress(progress_ms); // Update the progress in the state
        setTrackDuration(trackDuration); // Update track duration in the state
      } else {
        console.log("No track is currently playing.");
      }
  
    } catch (error) {
      console.error("Error fetching track progress:", error);
    }
  };
  
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchTrackProgress();
    }, 1000); // Call every second
  
    return () => clearInterval(intervalId); // Cleanup interval on component unmount
  }, [currentSong]); // Run effect when access_token changes
  
  if (!props.access_token) {
    return <div>Error: No valid token provided</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
        <div className="p-6 space-y-4">
          {currentSong && 
            <p>Now playing</p>
          }
          <div className="flex items-center space-x-4">
            {currentSong && (
              <Image
                className="rounded-lg"
                src={currentSong.imageUrl}
                alt={currentSong.title}
                width={96}
                height={24}
                style={{height:'auto', width: 'auto'}}
                priority
              />
            )}
            <div>
              <h2 className="text-2xl font-bold">
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
                // onMouseDown={handleSeekMouseDown}
                // onMouseUp={handleSeekMouseUp}
                step={1}
                // onChange={(value) => handleSeekTrack(value)}
                className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer appearance-none"
                // thumbClassName="w-4 h-4 bg-green-500 rounded-full shadow-md"
                // trackClassName="bg-green-500 h-2"
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

          <form onSubmit={handleSearch} className="flex justify-center gap-2 relative h-[26rem]">
            <Input
              type="text"
              value={newSong}
              onChange={(e) => setNewSong(e.target.value)}
              placeholder="Search songs on Spotify"
            />
            <Button type="submit">Search</Button>
            <div className="absolute top-14 w-full px-0">
              <ScrollArea className={cn("h-96 rounded border p-4", {
                hidden: searchResults.length <= 0
              })}>
                <p className="pb-2">Search results</p>
                {searchResults.map((song) => (
                  <div
                    key={song.videoId}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex justify-center items-center gap-4">
                      <Image
                        className="rounded-lg"
                        src={song.imageUrl}
                        alt={song.title}
                        width={64}
                        height={16}
                        style={{height:'auto', width: 'auto'}}
                        priority
                      />
                      <div>
                        <p className="font-medium">{song.title}</p>
                        <p className="text-sm">{song.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        type="button"
                        onClick={() => addSong(song)}
                      >
                        Add to queue
                      </Button>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </form>

          {queue.length > 0 && (
            <ScrollArea className="h-64 rounded border p-4">
              {queue.map((song) => (
                <div
                  key={song.videoId}
                  className="flex items-center justify-between py-2 border-b last:border-b-0"
                >
                  <div className="flex justify-center items-center gap-4">
                    <Image
                      className="rounded-lg"
                      src={song.imageUrl}
                      alt={song.title}
                      width={96}
                      height={24}
                      style={{height:'auto', width: 'auto'}}
                      priority
                    />
                    <div>
                      <p className="font-medium">{song.title}</p>
                      <p className="text-sm">{song.artist}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{song.votes} votes</span>
                    {/* <Button
                      size="sm"
                      variant="outline"
                      onClick={() => upvoteSong(song.videoId)}
                    >
                      Upvote
                    </Button> */}
                  </div>
                </div>
              ))}
            </ScrollArea>
          )}
        </div>
      </div>
    </div>
  );
}