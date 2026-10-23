import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONT_FAMILY } from "./theme";

// Noto Sans SC（思源黑体同源，SIL OFL 1.1）可变字重字体
export const fontsLoaded = loadFont({
  family: FONT_FAMILY,
  url: staticFile("fonts/NotoSansSC-VF.ttf"),
  weight: "100 900",
  format: "truetype",
});
