import { Input, Button } from "@repo/ui/shadcn";
import { useRecoilState, useRecoilValue } from 'recoil';
import { searchResultsState, isSearchOpenState, queueState } from '@repo/recoil';
import { searchSpotify } from '../lib/spotify';
import { useState } from "react";
import { Song } from "../types/spotify";

interface SearchBarProps {
  access_token: string | undefined;
}

export const SearchBar: React.FC<SearchBarProps> = ({ access_token }) => {
  const [newSong, setNewSong] = useState("");
  const [, setSearchResults] = useRecoilState(searchResultsState);
  const [, setIsSearchOpen] = useRecoilState(isSearchOpenState);
  const queue = useRecoilValue(queueState);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newSong === "") return;

    const results = await searchSpotify(newSong, access_token);
    console.log('handle seajh ququeu =', queue)
    let formattedResults = results.map((item: any) => {
      const matchedSong = queue.find((song: Song) => song.songId === item.id);
      if(matchedSong){
        console.log('found matched song ==========', matchedSong)
        const updatedSong = { ...matchedSong, added_to_queue: true };
        return updatedSong
      }else{
        return {
          songId: item.id,
          title: item.name,
          artist: item.artists[0].name,
          votes: 0,
          uri: item.uri,
          imageUrl: item.album.images[0]?.url
        }
      }
    });
    setSearchResults(formattedResults);
    setIsSearchOpen(true);
    setNewSong("");
  };

  return (
    <form onSubmit={handleSearch} className="flex-col gap-4 space-y-4">
      <div className="flex justify-between w-full items-center gap-2">
        <Input
          type="text"
          value={newSong}
          onChange={(e) => setNewSong(e.target.value)}
          placeholder="Search songs on Spotify"
        />
        <Button type="submit">Search</Button>
      </div>
    </form>
  );
};