export const fmt = (n: number, decimals = 0) => {
  const fixed = n.toFixed(decimals);
  const [i, d] = fixed.split(".");
  const withComma = i.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return d ? `${withComma}.${d}` : withComma;
};

export const pct = (part: number, whole: number, decimals = 1) =>
  `${((part / whole) * 100).toFixed(decimals)}%`;
