"use client";
import { Icons } from "@repo/ui/icons";
import { Button } from "@repo/ui/shadcn";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Image from "next/image"; // Ensure you're importing Image
import { useRouter } from "next/navigation";
import { createRoom } from "../lib/actions";
import { useRecoilValue } from "recoil";
import { userAtom } from "@repo/recoil";

export default function Home() {
  const router = useRouter();
  const user = useRecoilValue(userAtom);

  const { setTheme, theme } = useTheme();
  const { data: session } = useSession();
  const handleSpotifyConnect = () => {
    window.location.href = "/api/login";
  };

  const handleCreateRoom = async () => {
    await createRoom(user?.user_id as string);
  }

  return (
    <main className="flex justify-center items-center text-xl h-screen w-full bg-background">
      <p>{user?.name}</p>
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
      <Button onClick={handleSpotifyConnect}>Connect Spotify</Button>
      <Button
        onClick={() => signOut({ callbackUrl: "/" })} // Redirects to the homepage after logout
      >
        Logout
      </Button>
      <Button onClick={() =>  router.push("/player")}>Player</Button>
      <Button
        onClick={() => handleCreateRoom()}
      >Create room</Button>
    </main>
  );
}
