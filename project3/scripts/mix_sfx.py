"""Offline SFX mix from src/config/sfx-events.json (same data the Remotion SfxTimeline uses).
usage: python mix_sfx.py OUT.wav [startFrame] [numFrames]
- 48 kHz stereo 16-bit PCM, length exactly numFrames/30 s
- constant-power pan, linear fades in frames
- peak ceiling −9 dBFS (headroom for the user's own licensed music); errors on missing files
"""
import json
import sys
import numpy as np
from scipy.io import wavfile

SR = 48000
FPS = 30
SPF = SR // FPS  # 1600 samples per frame
CEIL_DB = -9.0

out = sys.argv[1]
start = int(sys.argv[2]) if len(sys.argv) > 2 else 0
nframes = int(sys.argv[3]) if len(sys.argv) > 3 else 4200
events = json.load(open("src/config/sfx-events.json", encoding="utf8"))

mix = np.zeros((nframes * SPF, 2), np.float64)
cache = {}
for e in events:
    path = f"public/sfx/{e['file']}"
    if path not in cache:
        sr, data = wavfile.read(path)  # raises if missing
        assert sr == SR, f"{path}: sample rate {sr}"
        data = data.astype(np.float64) / 32768.0
        if data.ndim == 1:
            data = np.stack([data, data], 1)
        cache[path] = data
    src = cache[path][: e["durationFrames"] * SPF].copy()
    n = len(src)
    env = np.ones(n)
    fi = e["fadeInFrames"] * SPF
    fo = e["fadeOutFrames"] * SPF
    if fi > 0:
        env[: min(fi, n)] = np.linspace(0, 1, min(fi, n))
    if fo > 0:
        k = min(fo, n)
        env[n - k :] *= np.linspace(1, 0, k)
    pan = float(e.get("pan", 0))
    th = (pan + 1) * np.pi / 4
    gl, gr = np.cos(th) * np.sqrt(2), np.sin(th) * np.sqrt(2)
    src[:, 0] *= env * e["volume"] * gl
    src[:, 1] *= env * e["volume"] * gr
    s0 = (e["startFrame"] - start) * SPF
    a = max(0, s0)
    b = min(len(mix), s0 + n)
    if b > a:
        mix[a:b] += src[a - s0 : b - s0]

peak = np.abs(mix).max()
peak_db = 20 * np.log10(peak + 1e-12)
ceil = 10 ** (CEIL_DB / 20)
if peak > ceil:
    mix *= ceil / peak * 0.98
final_peak = 20 * np.log10(np.abs(mix).max() + 1e-12)
rms = 20 * np.log10(np.sqrt((mix**2).mean()) + 1e-12)
wavfile.write(out, SR, (np.clip(mix, -1, 1) * 32767).astype(np.int16))
print(f"{out}: {len(mix)/SR:.3f}s  raw peak {peak_db:.1f} dBFS -> final peak {final_peak:.1f} dBFS, RMS {rms:.1f} dBFS")
