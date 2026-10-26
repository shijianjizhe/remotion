import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { SANS, SERIF } from "./config/theme";

// Noto Serif SC / Noto Sans SC（思源宋体 / 思源黑体同源，SIL OFL 1.1）
export const fontsLoaded = Promise.all([
  loadFont({
    family: SERIF,
    url: staticFile("fonts/NotoSerifSC-VF.ttf"),
    weight: "200 900",
    format: "truetype",
  }),
  loadFont({
    family: SANS,
    url: staticFile("fonts/NotoSansSC-VF.ttf"),
    weight: "100 900",
    format: "truetype",
  }),
]);
