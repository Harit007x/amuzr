"use client";
import YouTube from "react-youtube";

export const Player = (props: { videoID: any }) => {
  const onReady = (event: any) => {
    event.target.playVideo();
  };

  return (
    <YouTube
      videoId={props.videoID}
      opts={{
        height: "390",
        width: "640",
        playerVars: {
          autoplay: 1,
        },
      }}
      onReady={onReady}
    />
  );
};
