"use client";
import { useState } from "react";
import { searchYouTube } from "../utility/youtube-api";
import Image from "next/image"; // Ensure you're importing Image
import { Player } from "./playback";
import { Button, Input } from "@repo/ui/shadcn";

export const YouTubeSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [videoID, setVideoID] = useState("");

  const handleSearch = async (e: any) => {
    e.preventDefault();
    const songs = await searchYouTube(query);
    setResults(songs);
  };

  // const addSongToQueue = (song: any) => {
    // Emit event to add the song to the queue
    // socket.emit('addSong', { roomId, song });
  // };
  const handlePlay = (videoID: any) => {
    setVideoID(videoID);
  };
  return (
    <div>
      <form onSubmit={handleSearch} className="flex justify-center gap-2">
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search on YouTube"
        />
        <Button type="submit">Search</Button>
      </form>
      {videoID !== "" && <Player videoID={videoID} />}
      <div>
        {results.map((song: any) => (
          <div key={song.videoId} className="bg-red-400 mb-4 cursor-pointer">
            <Image
              src={song.thumbnail}
              alt={song.title as string}
              width={240}
              height={240}
              className="rounded-full"
              priority
              onClick={() => handlePlay(song.videoId)}
            />
            <h4>{song.title}</h4>
            <p>{song.artist}</p>
            {/* <Button onClick={() => addSongToQueue(song)}>Add to Queue</Button> */}
          </div>
        ))}
      </div>
    </div>
  );
};
