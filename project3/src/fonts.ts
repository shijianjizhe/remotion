import {loadFont} from "@remotion/fonts";
import {staticFile} from "remotion";
import {FONT_CN, FONT_LATIN} from "./config/film";

// 本地打包的开源字体（SIL OFL 1.1），渲染时不依赖网络。
export const fontsReady = Promise.all([
  loadFont({family: FONT_CN, url: staticFile("fonts/NotoSerifSC-VF.ttf"), weight: "200 900"}),
  loadFont({family: FONT_LATIN, url: staticFile("fonts/EBGaramond.ttf"), weight: "400 800"}),
  loadFont({family: FONT_LATIN, url: staticFile("fonts/EBGaramond-Italic.ttf"), weight: "400 800", style: "italic"}),
]);
