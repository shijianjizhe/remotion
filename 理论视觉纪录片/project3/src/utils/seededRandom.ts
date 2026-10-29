import {random} from "remotion";

/** 确定性随机：同一 seed 永远得到同一结果。 */
export const rnd = (seed: string | number) => random(`ic-${seed}`);
export const rndRange = (seed: string | number, a: number, b: number) => a + (b - a) * rnd(seed);
export const rndSigned = (seed: string | number) => rnd(seed) * 2 - 1;
