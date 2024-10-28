import { Button, Slider } from "@repo/ui/shadcn";
import { Icons } from "@repo/ui/icons";
import { Volume2 } from "lucide-react";
import { useSpotifyControls } from '../hooks/useSpotifyControls';

interface PlayerControlsProps {
  access_token: string;
  user_id: string;
  deviceId: string | null;
  onNext?: () => void;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  access_token,
  user_id,
  deviceId,
  onNext
}) => {
  
  const {
    isPlaying,
    volume,
    togglePlayPause,
    handleVolumeChange,
  } = useSpotifyControls(access_token, user_id, deviceId);

  return (
    <div className="flex items-center justify-between">
      <div className="space-x-2">
        <Button onClick={togglePlayPause} variant="outline">
          {isPlaying ? (
            <Icons.circlePause className="h-4 w-4" />
          ) : (
            <Icons.circlePlay className="h-4 w-4" />
          )}
        </Button>
        <Button onClick={onNext} variant="outline">
          <Icons.skipForward className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex items-center space-x-2">
        <Volume2 className="h-4 w-4" />
        <Slider
          className="w-32"
          value={[volume]}
          onValueChange={(value) => handleVolumeChange(value[0] as number)}
          max={100}
          step={1}
        />
      </div>
    </div>
  );
};