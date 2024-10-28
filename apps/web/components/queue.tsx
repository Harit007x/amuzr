// 'use client';
import Image from "next/image";
import { Button } from "@repo/ui/shadcn";
import { Icons } from "@repo/ui/icons";
import { useRecoilState, useRecoilValue } from 'recoil';
import { queueState, searchResultsState, isSearchOpenState } from '@repo/recoil';
import { Song } from '../types/spotify';
import { addSongsToRoom } from '../lib/actions';
import { MutableRefObject } from "react";

interface QueueProps {
  user_id: string;
  playSong: (song: Song) => Promise<void>
  currentSong: Song
  isPlayerFullyReadyRef: MutableRefObject<boolean>;
}

export const Queue: React.FC<QueueProps> = (props: QueueProps) => {
  const [queue, setQueue] = useRecoilState(queueState);
  const [searchResults, setSearchResults] = useRecoilState(searchResultsState);
  const isSearchOpen = useRecoilValue(isSearchOpenState);
  const closeSearch = () => {
    setSearchResults([]);
  };

  const addToQueue = async (song: Song) => {
    // await addSongsToRoom(props.user_id, [song]);

    setQueue((prevQueue: any) => {
      const isSameSongPresent = prevQueue.some((item: Song) => item.songId === song.songId)

      if(isSameSongPresent){
        return prevQueue
      }

      const newQueue = [...prevQueue, song];
      if (!props.currentSong && props.isPlayerFullyReadyRef.current) {
        props.playSong(song);
      }
      return newQueue;
    });

    const updatedSong = { ...song, added_to_queue: true };
    setSearchResults((prevResults:any) => 
      prevResults.map((search_song: Song) => {
      return(
        search_song.songId === song.songId ? updatedSong : search_song
    )}));
  };

  const renderSongList = (songs: Song[], isSearchResults: boolean = false) => (
    <div className="overflow-y-scroll h-96 border p-4 rounded-md">
      <div className="flex justify-between items-center pb-4">
        <p>{isSearchResults ? 'Search results' : 'Current queue'}</p>
        <Button
          size={'icon'}
          variant="outline"
          className="mr-2"
          onClick={closeSearch}
        >
          <Icons.x />
        </Button>
      </div>
      {songs.map((song) => (
        <div
          key={song.songId}
          className="flex items-center justify-center py-2 border-b last:border-b-0"
        >
          <div className="flex items-center space-x-4 rounded-lg w-full">
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
            {isSearchResults && (
              <Button
                size="sm"
                variant={song.added_to_queue ? "secondary" : "outline"}
                className="whitespace-nowrap"
                type="button"
                onClick={() => addToQueue(song)}
              >
                {song.added_to_queue ? "In queue" : "Add to queue"}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <>
      {searchResults.length > 0 && isSearchOpen && renderSongList(searchResults, true)}
      {queue.length > 0 && renderSongList(queue)}
    </>
  );
};