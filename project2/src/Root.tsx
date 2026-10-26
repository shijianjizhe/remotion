import { Composition } from "remotion";
import { fontsLoaded } from "./fonts";
import { TimeIsNotUniform } from "./compositions/TimeIsNotUniform";
import { TOTAL_FRAMES } from "./config/scenes";
import { FPS, H, W } from "./config/theme";

void fontsLoaded;

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="TimeIsNotUniform"
        component={TimeIsNotUniform}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ sfx: true }}
      />
      {/* Gate B：12 秒风格样片 */}
      <Composition
        id="StyleSample"
        component={TimeIsNotUniform}
        durationInFrames={360}
        fps={FPS}
        width={W}
        height={H}
        defaultProps={{ sfx: true }}
      />
    </>
  );
};
