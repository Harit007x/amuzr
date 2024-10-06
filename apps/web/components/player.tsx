"use client";
import Image from "next/image";
import { useState } from "react";
import { Play, Pause, SkipForward, Volume2 } from "lucide-react";
import { Button, Input, ScrollArea, Slider } from "@repo/ui/shadcn";
import { searchSpotify } from "../lib/spotify";
import { SpotifyTokens } from "@prisma/client";

interface Song {
  id: string;
  title: string;
  artist: string;
  votes: number;
  uri: string;
  imageUrl: string;
}

interface IMusicPlayer {
    access_token: string | undefined
}

export default function MusicPlayer(props: IMusicPlayer) {
  const [queue, setQueue] = useState<Song[]>([]);
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(50);
  const [newSong, setNewSong] = useState("");
  const [spotifyToken, setSpotifyToken] = useState<string | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);

  const addSong = (song: Song) => {
    setQueue([...queue, song]);
  };

  const upvoteSong = (id: string) => {
    setQueue(
      queue.map((song) =>
        song.id === id ? { ...song, votes: song.votes + 1 } : song
      )
    );
  };

  const skipSong = () => {
    setQueue(queue.slice(1));
    setCurrentSong(queue[1] || null);
  };

  const handleSearch = async (e: any) => {
    e.preventDefault();
    const results = await searchSpotify(
      newSong,
      props.access_token
    );
    const formattedResults = results.map((item: any) => ({
      id: item.id,
      title: item.name,
      artist: item.artists[0].name,
      votes: 0,
      uri: item.uri,
      imageUrl: item.album.images[0]?.url
    }));
    setSearchResults([...searchResults, ...formattedResults]);
    // setQueue([...queue, ...formattedResults]);
    // setNewSong("");
  };

  if (!props.access_token) {
    return <div>Error: No valid token provided</div>;
  }
  console.log("wowwowowowow =", searchResults)
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-4">
            {currentSong != null &&
              <Image
                className="rounded-lg"
                src={currentSong?.imageUrl as string}
                alt={currentSong?.title as string}
                width={96}
                height={24}
                style={{height:'auto', width: 'auto'}}
                priority
              />
            }
            <div>
              <h2 className="text-2xl font-bold">
                {queue[0]?.title || "No song in queue"}
              </h2>
              <p>
                {queue[0]?.artist || "Add songs to the queue"}
              </p>
            </div>
          </div>

          {currentSong != null &&
            <div className="flex items-center justify-between">
              <div className="space-x-2">
                <Button
                  onClick={() => setIsPlaying(!isPlaying)}
                  variant="outline"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button onClick={skipSong} variant="outline">
                  <SkipForward className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4" />
                <Slider
                  className="w-32"
                  value={[volume]}
                  onValueChange={(value: any) => setVolume(value[0])}
                  max={100}
                  step={1}
                />
              </div>
            </div>
          }

          <form onSubmit={handleSearch} className="flex justify-center gap-2 relative h-[26rem] bg-green-400">
            <Input
              type="text"
              value={newSong}
              onChange={(e) => setNewSong(e.target.value)}
              placeholder="Search songs on Spotify"
            />
            <Button type="submit">Add</Button>
            <div className="absolute top-14 bg-red-400 w-full px-0">
            <ScrollArea className="h-96 rounded border p-4">
              {searchResults.map((song) => (
                <div
                  key={song.id}
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
                      onClick={() => upvoteSong(song.id)}
                    >
                      Add to queue
                    </Button>
                  </div>
                </div>
              ))}
              </ScrollArea>
            </div>
          </form>

          {queue.length > 0 && <ScrollArea className="h-64 rounded border p-4">
            {queue.map((song) => (
              <div
                key={song.id}
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
                  <span className="text-sm">
                    {song.votes} votes
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => upvoteSong(song.id)}
                  >
                    Upvote
                  </Button>
                </div>
              </div>
            ))}
          </ScrollArea>}
        </div>
      </div>
    </div>
  );
}
