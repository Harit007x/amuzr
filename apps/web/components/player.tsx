'use client'
import { useCallback, useEffect } from 'react';
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer';
import { RecoilRoot, useRecoilState, useSetRecoilState } from 'recoil';
import { PlayerControls } from './playerControls';
import { SearchBar } from './searchBar';
import { Queue } from './queue';
import { Slider } from '@repo/ui/shadcn';
import Image from "next/image";
import { currentSongState, queueState, searchResultsState } from '@repo/recoil';
import { Song } from '../types/spotify';

interface IMusicPlayer {
  access_token: string | undefined;
  user_id: string
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady: () => void;
    Spotify: any;
  }
}
export default function MusicPlayer({ access_token, user_id }: IMusicPlayer) {
  const [queue, setQueue] = useRecoilState(queueState);
  const setSearchResults = useSetRecoilState(searchResultsState);
  const [currentSong, setCurrentSong] = useRecoilState(currentSongState);

  const {
    playerRef,
    deviceIdRef,
    isPlayerFullyReadyRef,
    playSong,
    initializePlayer,
    handleProgressChange,
    handleSeekTrack,
    handleDragStart,
    handleDragEnd,
    progress,
    trackDuration
  } = useSpotifyPlayer(access_token, user_id);

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

  if (!access_token) {
    return <div>Error: No valid token provided</div>;
  }

  const nextSong = useCallback(() => {
    if (!queue || queue.length === 0) {
      console.log('Queue is empty');
      return;
    }

    const newQueue = queue.slice(1);
    const nextSong = newQueue[0];
    const previousSong = currentSong;

    if (nextSong) {
      // First, update the queue
      setQueue(newQueue);

      // Then, update the current song
      setCurrentSong(nextSong);

      // If we have a previous song, update the search results
      if (previousSong) {
        setSearchResults((prevResults: Song[]) => 
          prevResults?.map((search_song) => 
            search_song.songId === previousSong.songId 
              ? { ...search_song, added_to_queue: false } 
              : search_song
          ) || []
        );
      }

      // Finally, play the song
      playSong(nextSong);
    } else {
      console.log('No next song available');
    }
  }, [queue, currentSong, setQueue, setCurrentSong, setSearchResults, playSong]);

  useEffect(() => {
    console.log('Queue state changed:', queue);
  }, [queue]);
  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = ((milliseconds % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds.length === 1 ? '0' : ''}${seconds}`;
  };
  return (
      <div className="min-h-screen bg-background text-foreground p-0">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="p-6 space-y-4">
            {/* <NowPlaying /> */}
            {/* <ProgressBar /> */}
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
            <div className="flex items-center justify-between text-sm text-gray-600">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(trackDuration)}</span>
            </div>
            <Slider
              value={[progress]}
              max={trackDuration}
              onValueCommit={handleSeekTrack}
              onValueChange={handleProgressChange}
              onPointerDown={handleDragStart}
              onPointerUp={handleDragEnd}
              step={1}
              className="w-full h-2 bg-gray-200 rounded-lg cursor-pointer appearance-none"
            />
            <PlayerControls
              access_token={access_token}
              user_id={user_id}
              deviceId={deviceIdRef.current}
              onNext={nextSong}
            />
            <SearchBar access_token={access_token} />
            <Queue 
              user_id={user_id}
              playSong={playSong}
              currentSong={currentSong}
              isPlayerFullyReadyRef={isPlayerFullyReadyRef}
            />
          </div>
        </div>
      </div>
  );
}