import { Button } from "@repo/ui/shadcn";
import React from "react";
import { YouTubeSearch } from "../../../components/youtube-search";

const Page = () => {
  return (
    <main className="flex justify-center items-center text-xl h-screen w-full bg-blue-300">
      <YouTubeSearch />
    </main>
  );
};

export default Page;
