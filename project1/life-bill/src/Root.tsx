import { Composition } from "remotion";
import { fontsLoaded } from "./fonts";
import { LifeBill } from "./LifeBill";
import { FPS, HEIGHT, TOTAL_FRAMES, WIDTH } from "./data/timeline";

// 确保渲染前字体已加载
void fontsLoaded;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="LifeBill"
        component={LifeBill}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
        defaultProps={{ showCaptions: false, musicVolume: 0.55 }}
      />
    </>
  );
};
