"use client";
import { Icons } from "@repo/ui/icons";
import { Avatar, AvatarFallback, Button } from "@repo/ui/shadcn";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image"; // Ensure you're importing Image
import { useRouter } from "next/navigation";
import { createRoom, fetchSpotifyTokenOfUser } from "../lib/actions";
import { useRecoilValue } from "recoil";
import { userAtom } from "@repo/recoil";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const user = useRecoilValue(userAtom);

  const [isConnected, setIsConnected] = useState<boolean>(false);

  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const handleSpotifyConnect = () => {
    window.location.href = "/api/login";
  };

  const handleCreateRoom = async () => {
    await createRoom(user?.id as string);
  }

  const isSpotifyConnected = async () =>{
    const { spotifyConnected } = await fetchSpotifyTokenOfUser(user?.id as string);
    setIsConnected(spotifyConnected as boolean)
    console.log('connecte or not  =', spotifyConnected);
  }

  useEffect(()=>{
    isSpotifyConnected()
  },[])

  return (
    <main className="flex-col justify-center items-center text-xl h-screen w-full bg-background ">
      <header className="flex justify-between items-center max-w-[80rem] px-[2rem] mx-auto">
        <p>Amuzr</p>
        <div className="flex items-center justify-between gap-2 p-5 antialiased text-sm">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
              {session?.user?.image && (
                <Image
                  src={session.user.image} // Path to the image from the session
                  alt={session.user.name as string} // Alt text from user name
                  width={40} // Provide width
                  height={40} // Provide height
                  className="rounded-full" // Optional: Add styling, e.g., rounded image
                  priority
                />
              )}
                <AvatarFallback>{user?.name.slice(0, 1)}</AvatarFallback>
              </Avatar>
              {user ? (
                <div className="flex-col gap-3">
                  <div className="font-normal text-lg">
                    {user?.name}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-4 w-[130px]" /> */}
                </div>
              )}
              {theme === "light" ? (
                <Icons.sun
                  className="cursor-pointer h-[1.2rem] w-[1.2rem]"
                  onClick={() => setTheme("dark")}
                />
              ) : (
                <Icons.moon
                  className="cursor-pointer h-[1.2rem] w-[1.2rem]"
                  onClick={() => setTheme("light")}
                />
              )}
            </div>
          </div>
      </header>
      
      <div className="grid grid-cols-1 my-60 sm:grid-cols-2 lg:grid-cols-3 grid-rows-auto max-w-[40rem] px-[2rem] mx-auto h-fit gap-2">
        <Button 
          className="gap-2"
          onClick={handleSpotifyConnect}
        >
          {isConnected && 
            <div className="h-6 w-6">
              <Image
                className="rounded-lg"
                src={'/spotify.svg'}
                alt={'spotify'}
                width={20}
                height={12}
                style={{height:'auto', width: 'auto'}}
                priority
              />
            </div>
          }
          Connect
          {/* {isConnected ? 'Connected' : 'Connect Spotify'} */}
        </Button>
      
        {
          isConnected && 
          <>
            <Button onClick={() =>  router.push("/player")}>Player</Button>
            {/* <Button
              onClick={() => handleCreateRoom()}
            >
              Create room
            </Button> */}
          </>
        }

        <Button onClick={() =>  router.push("/chat")}>Chat</Button>

        <Button
          variant={'destructive'}
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Logout
        </Button>

        
      </div>

    </main>
  );
}
