"""
原创音效合成脚本 —— 生成本片全部 SFX（纯程序合成，无任何第三方采样，版权归项目所有）。

用法:  python scripts/gen_audio.py
依赖:  numpy, scipy
输入:  src/config/sfxCues.json（场景 + 场景内帧号 + 音效名 + 增益）、src/config/scenes.json（总时长）
输出:  public/sfx/<name>.wav（单个音效） + public/sfx/sfx_stem.wav（按 cue 表混好的整轨）
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(1905)

with open(os.path.join(ROOT, "src", "config", "scenes.json"), encoding="utf-8") as f:
    SC = json.load(f)
with open(os.path.join(ROOT, "src", "config", "sfxCues.json"), encoding="utf-8") as f:
    CUES = json.load(f)["cues"]
FPS = SC["fps"]
TOTAL = sum(s["duration"] for s in SC["scenes"]) / FPS
STARTS = {}
_t = 0
for s in SC["scenes"]:
    STARTS[s["id"]] = _t / FPS
    _t += s["duration"]


# ---------------------------------------------------------------- 工具
def tt(d):
    return np.arange(int(d * SR)) / SR


def filt(x, fc, kind="low", order=2):
    if isinstance(fc, (list, tuple)):
        fc = [c / (SR / 2) for c in fc]
    else:
        fc = fc / (SR / 2)
    return sosfilt(butter(order, fc, kind, output="sos"), x)


def noise(d):
    return rng.standard_normal(int(d * SR))


def fade(x, a=0.005, r=0.02):
    n = len(x)
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return x * e


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def bell(freq, d, decay, partials=((1, 1), (2.76, 0.5), (5.4, 0.25), (8.93, 0.12))):
    t = tt(d)
    y = sum(a * np.sin(2 * np.pi * freq * k * t) * np.exp(-t / (decay / (1 + k * 0.4))) for k, a in partials)
    return fade(y, 0.001, 0.05)


def stereo(x, width=0.0):
    """单声道 → 立体声；width>0 时做轻微 Haas 展宽"""
    if width <= 0:
        return np.stack([x, x], 1)
    dly = int(width * SR)
    r = np.concatenate([np.zeros(dly), x])[: len(x)]
    return np.stack([x, r * 0.95], 1)


def reverb(x, size=1.2, mix=0.25):
    """简易卷积混响：指数衰减噪声脉冲"""
    ir = noise(size) * np.exp(-tt(size) / (size / 5))
    ir = filt(ir, 5000)
    ir /= np.sqrt(np.sum(ir ** 2))
    wet = np.convolve(x, ir)[: len(x) + int(size * SR)]
    dry = np.concatenate([x, np.zeros(len(wet) - len(x))])
    return dry * (1 - mix) + wet * mix


# ---------------------------------------------------------------- 音效
def s_chime():
    y = bell(1318.5, 3.5, 1.4) + 0.5 * bell(659.25, 3.5, 1.8)
    return norm(reverb(y, 2.2, 0.35))


def s_chimesoft():
    y = filt(bell(880, 3.0, 1.2) + 0.5 * bell(440, 3.0, 1.5), 1800)
    return norm(reverb(y, 2.5, 0.5), 0.6)


def s_tick():
    t = tt(0.06)
    click = noise(0.06) * np.exp(-t / 0.004)
    click = filt(click, [2000, 9000], "band")
    ring = np.sin(2 * np.pi * 3200 * t) * np.exp(-t / 0.008) * 0.4
    return norm(reverb(click + ring, 0.4, 0.15), 0.8)


def s_tickhi():
    t = tt(0.06)
    click = filt(noise(0.06) * np.exp(-t / 0.003), [3500, 12000], "band")
    ring = np.sin(2 * np.pi * 4600 * t) * np.exp(-t / 0.006) * 0.4
    return norm(reverb(click + ring, 0.4, 0.15), 0.7)


def s_tickstretch():
    """被拉长的滴答：一次滴答 + 慢慢衰减的金属余振"""
    t = tt(1.4)
    click = filt(noise(1.4) * np.exp(-t / 0.005), [1500, 8000], "band")
    ring = np.sin(2 * np.pi * 1600 * t * (1 - 0.04 * t)) * np.exp(-t / 0.45) * 0.35
    return norm(reverb(click + ring, 1.5, 0.4), 0.8)


def s_gear():
    d = 0.9
    y = np.zeros(int(d * SR))
    for i in range(7):
        c = s_tick() * (0.5 + 0.5 * rng.random())
        o = int((0.04 + i * 0.11 + rng.random() * 0.02) * SR)
        y[o : o + len(c)] += c[: len(y) - o]
    t = tt(d)
    y += filt(noise(d), 300) * np.exp(-t / 0.3) * 0.6
    return norm(fade(y, 0.002, 0.2), 0.8)


def s_lowpush():
    d = 2.5
    t = tt(d)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2
    y = np.sin(2 * np.pi * 55 * t) * 0.6 + filt(noise(d), 180) * 0.8
    return norm(y * env, 0.7)


def s_shimmer():
    d = 3.0
    t = tt(d)
    y = np.zeros_like(t)
    for f0 in (1760, 2217, 2637, 3520):
        y += np.sin(2 * np.pi * f0 * t + rng.random() * 6) * (0.5 + 0.5 * np.sin(2 * np.pi * (0.7 + rng.random()) * t))
    env = np.sin(np.pi * t / d) ** 2
    return norm(reverb(y * env, 2.0, 0.5), 0.5)


def s_paper():
    d = 0.7
    t = tt(d)
    y = filt(noise(d), [1200, 7000], "band")
    env = np.exp(-((t - 0.18) ** 2) / 0.006) + 0.5 * np.exp(-((t - 0.38) ** 2) / 0.004)
    y *= env * (0.6 + 0.4 * np.abs(filt(noise(d), 40)))
    return norm(fade(y, 0.01, 0.1), 0.7)


def s_slide():
    d = 1.4
    t = tt(d)
    env = np.sin(np.pi * t / d) ** 3
    sweep = np.cumsum(np.linspace(400, 2400, len(t))) / SR
    y = filt(noise(d), [600, 4000], "band") * env + 0.15 * np.sin(2 * np.pi * sweep) * env
    return norm(reverb(y, 1.0, 0.3), 0.6)


def s_pulse():
    t = tt(1.2)
    y = np.sin(2 * np.pi * 110 * t) * np.exp(-t / 0.25) + 0.4 * np.sin(2 * np.pi * 880 * t) * np.exp(-t / 0.08)
    return norm(reverb(y, 1.2, 0.3), 0.8)


def s_readout():
    t = tt(0.8)
    y = np.sin(2 * np.pi * 1975 * t) * np.exp(-t / 0.12) + 0.3 * np.sin(2 * np.pi * 2960 * t) * np.exp(-t / 0.06)
    return norm(reverb(y, 1.0, 0.3), 0.7)


def s_readout2():
    t = tt(0.8)
    y = np.sin(2 * np.pi * 1480 * t) * np.exp(-t / 0.12) + 0.3 * np.sin(2 * np.pi * 2220 * t) * np.exp(-t / 0.06)
    return norm(reverb(y, 1.0, 0.3), 0.7)


def s_resonance():
    d = 5.0
    t = tt(d)
    y = sum(a * np.sin(2 * np.pi * f0 * t) for f0, a in ((49, 1), (73.5, 0.5), (98, 0.3), (147.3, 0.12)))
    env = (1 - np.exp(-t / 0.4)) * np.exp(-t / 2.2)
    return norm(reverb(y * env, 2.5, 0.35), 0.8)


def s_plane():
    d = 9.0
    t = tt(d)
    env = np.sin(np.pi * t / d) ** 2
    hum = sum(np.sin(2 * np.pi * f0 * t * (1 + 0.01 * np.sin(2 * np.pi * 0.2 * t))) * a for f0, a in ((92, 1), (184, 0.4), (276, 0.2)))
    y = (filt(noise(d), [150, 900], "band") * 0.8 + hum * 0.3) * env
    return norm(y, 0.6)


def s_scan():
    t = tt(0.5)
    sweep = np.cumsum(np.linspace(900, 2400, len(t))) / SR
    y = np.sin(2 * np.pi * sweep) * np.exp(-t / 0.12)
    return norm(reverb(y, 0.8, 0.35), 0.6)


def s_alert():
    t = tt(1.0)
    y = np.zeros_like(t)
    for k in range(2):
        tk = t - k * 0.22
        m = (tk >= 0).astype(float)
        y += m * np.sin(2 * np.pi * 620 * tk) * np.exp(-np.clip(tk, 0, None) / 0.09)
    return norm(reverb(y, 0.8, 0.3), 0.6)


def s_align():
    t = tt(2.0)
    y = sum(np.sin(2 * np.pi * f0 * t) * np.exp(-t / 0.6) * a for f0, a in ((1046.5, 1), (1568, 0.6), (2093, 0.3)))
    y += np.sin(2 * np.pi * 523 * t) * np.exp(-t / 0.9) * 0.5
    return norm(reverb(y, 2.0, 0.4), 0.7)


def s_muffle():
    """转折：钟声被低通压闷 + 低频收束"""
    y = filt(bell(659.25, 4.0, 1.6), 600, order=4) * 1.5
    t = tt(4.0)
    y += np.sin(2 * np.pi * 41 * t) * np.exp(-t / 1.2) * 0.4
    return norm(reverb(y, 2.5, 0.45), 0.8)


def s_saccade():
    d = 0.25
    t = tt(d)
    sweep = np.cumsum(np.linspace(3000, 500, len(t))) / SR
    y = filt(noise(d), [2000, 9000], "band") * np.exp(-t / 0.05) + 0.3 * np.sin(2 * np.pi * sweep) * np.exp(-t / 0.06)
    return norm(fade(y, 0.002, 0.05), 0.7)


def s_heartbeat():
    t = tt(0.6)
    lub = np.sin(2 * np.pi * 52 * t) * np.exp(-t / 0.06)
    t2 = np.clip(t - 0.17, 0, None)
    dub = (t >= 0.17) * np.sin(2 * np.pi * 64 * t2) * np.exp(-t2 / 0.05) * 0.7
    return norm(filt(lub + dub, 200), 0.85)


def s_wind():
    d = 2.6
    t = tt(d)
    env = np.clip(t / d, 0, 1) ** 1.5
    y = filt(noise(d), [200, 2400], "band") * env + filt(noise(d), 120) * env * 0.8
    y = fade(y, 0.05, 0.01)
    return norm(y, 0.7)


def s_thud():
    t = tt(2.5)
    sweep = np.cumsum(np.linspace(90, 35, len(t))) / SR
    y = np.sin(2 * np.pi * sweep) * np.exp(-t / 0.35) + filt(noise(2.5), 250) * np.exp(-t / 0.08) * 0.6
    return norm(y, 0.9)


def s_reverse():
    d = 3.2
    t = tt(d)
    y = s_shimmer()[: len(t)]
    y = y[::-1] * np.clip(t / d, 0, 1) ** 2
    return norm(fade(y, 0.2, 0.05), 0.6)


def s_hit():
    """冲击：低频下扫 + 短促瞬态（读数落点、镜头冲击）"""
    t = tt(1.2)
    sweep = np.cumsum(np.linspace(140, 45, len(t))) / SR
    body = np.sin(2 * np.pi * sweep) * np.exp(-t / 0.22)
    click = filt(noise(1.2), [1500, 7000], "band") * np.exp(-t / 0.012) * 0.5
    return norm(reverb(body + click, 1.4, 0.3), 0.95)


def s_whoosh():
    d = 0.7
    t = tt(d)
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2 * np.exp(-t / 0.5)
    y = filt(noise(d), [400, 6000], "band") * env
    return norm(fade(y, 0.01, 0.1), 0.7)


def s_bed():
    """全片底噪：极低频气声 + 微弱长音，按场景起落（物理段偏暗，感知段更窄更空）"""
    d = TOTAL
    t = tt(d)
    y = filt(noise(d), 160, order=4) * 0.9 + np.sin(2 * np.pi * 36.7 * t) * 0.15
    env = np.interp(
        t,
        [0, 2, 8, STARTS["eye"], STARTS["eye"] + 1.0, STARTS["chronostasis"], STARTS["ending"], d - 3, d],
        [0, 0.6, 0.8, 0.8, 0.2, 0.6, 0.6, 0.3, 0],
    )
    return y * env * 0.35


SFX = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}


# ---------------------------------------------------------------- 输出
def write_wav(path, x):
    x = np.clip(x, -1, 1)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    pcm = (x * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


def main():
    out = os.path.join(ROOT, "public", "sfx")
    os.makedirs(out, exist_ok=True)
    cache = {}
    for name, fn in SFX.items():
        cache[name] = fn()
        if name != "bed":
            write_wav(os.path.join(out, f"{name}.wav"), cache[name])

    n = int(TOTAL * SR)
    mix = np.zeros((n, 2))
    for c in CUES:
        x = cache[c["file"]]
        count = c.get("count", 1)
        every = c.get("every", 0)
        for k in range(count):
            # 重复的滴答带一点随机音量，避免机械感
            g = c["gain"] * (1 if count == 1 else 0.85 + 0.15 * rng.random())
            base = STARTS[c["scene"]] * FPS + c["at"] if "scene" in c else c["frame"]
            o = int((base + k * every) / FPS * SR)
            if o >= n:
                continue
            seg = stereo(x, 0.0 if c["file"] in ("bed", "heartbeat", "thud") else 0.004) * g
            end = min(n, o + len(seg))
            mix[o:end] += seg[: end - o]

    peak = np.max(np.abs(mix))
    target = 10 ** (-1.0 / 20)  # −1 dBFS 峰值，避免削波
    mix *= target / peak
    write_wav(os.path.join(out, "sfx_stem.wav"), mix)
    print(f"stem: {TOTAL:.2f}s, peak scaled from {peak:.2f} to -1 dBFS, {len(CUES)} cues")


if __name__ == "__main__":
    main()
