"""
原创音频合成脚本 —— 生成本片全部 BGM 与音效（无任何第三方采样，版权归项目所有）。

用法:  python scripts/gen_audio.py
依赖:  numpy, scipy
输出:  public/audio/bgm.wav, public/audio/sfx/*.wav

BGM 结构读取 src/data/timeline.json，与画面自动对齐：
  - 开场 → 琐事      轻电子：kick + 闭镲 + 拨弦琶音 + 贝斯，有推进感
  - 陪家人           鼓组撤掉，只剩钢琴 + pad，情绪下沉
  - 汇总             心跳式低频脉冲 + 钢琴，在"结余揭晓"处落一个和弦
  - 结尾提问 / 互动   ambient pad + 稀疏钢琴，留白收尾
"""
import json
import os
import wave

import numpy as np
from scipy.signal import butter, lfilter, sosfilt

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SR = 48000
rng = np.random.default_rng(7)

with open(os.path.join(ROOT, "src", "data", "timeline.json"), encoding="utf-8") as f:
    TL = json.load(f)
FPS = TL["fps"]
starts = {}
t = 0
for s in TL["scenes"]:
    starts[s["id"]] = t
    t += s["duration"] - s["transitionAfter"]
TOTAL_FRAMES = t
TOTAL = TOTAL_FRAMES / FPS
sec = lambda sid: starts[sid] / FPS  # noqa: E731


# ---------------------------------------------------------------- 基础工具
def tt(d):
    return np.arange(int(d * SR)) / SR


def env_exp(d, decay):
    return np.exp(-tt(d) / decay)


def adsr(n, a, r):
    e = np.ones(n)
    na, nr = int(a * SR), int(r * SR)
    if na:
        e[:na] = np.linspace(0, 1, na)
    if nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), "low", output="sos")
    return sosfilt(sos, x)


def hp(x, fc, order=2):
    sos = butter(order, fc / (SR / 2), "high", output="sos")
    return sosfilt(sos, x)


def bp(x, lo, hi, order=2):
    sos = butter(order, [lo / (SR / 2), hi / (SR / 2)], "band", output="sos")
    return sosfilt(sos, x)


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def place(buf, sig, at, gain=1.0, pan=0.0):
    """把单声道 sig 放进立体声 buf 的 at 秒处"""
    i = int(at * SR)
    if i >= buf.shape[1] or i + len(sig) <= 0:
        return
    j = min(buf.shape[1], i + len(sig))
    seg = sig[: j - i] * gain
    buf[0, i:j] += seg * np.sqrt(0.5 * (1 - pan))
    buf[1, i:j] += seg * np.sqrt(0.5 * (1 + pan))


def reverb(x, mix=0.25, size=1.0):
    """简易 Schroeder 混响（4 comb + 2 allpass），立体声去相关"""
    out = np.zeros((2, x.shape[1]))
    for ch, off in ((0, 0), (1, 23)):
        src = x[ch]
        acc = np.zeros_like(src)
        for d_ms, g in ((29.7, 0.80), (37.1, 0.79), (41.1, 0.77), (43.7, 0.75)):
            D = int((d_ms + off * 0.1) * size * SR / 1000)
            a = np.zeros(D + 1)
            a[0], a[D] = 1, -g
            acc += lfilter([1], a, src)
        for d_ms, g in ((5.0, 0.7), (1.7, 0.7)):
            D = int(d_ms * SR / 1000)
            b = np.zeros(D + 1)
            b[0], b[D] = -g, 1
            a = np.zeros(D + 1)
            a[0], a[D] = 1, -g
            acc = lfilter(b, a, acc)
        out[ch] = lp(acc, 6000) * 0.25
    return x * (1 - mix) + out * mix


def norm(x, peak=0.9):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def write(path, x):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    if x.ndim == 1:
        x = np.vstack([x, x])
    data = (np.clip(x.T, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data.tobytes())


# ---------------------------------------------------------------- 乐器
def kick(d=0.45):
    x = tt(d)
    f = 45 + 95 * np.exp(-x / 0.035)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-x / 0.16) + 0.25 * rng.standard_normal(len(x)) * np.exp(-x / 0.004)


def hat(d=0.06, open_=False):
    n = rng.standard_normal(int(d * SR))
    return hp(n, 7000) * env_exp(d, 0.05 if open_ else 0.012)


def pluck(freq, d=0.6, bright=4000):
    x = tt(d)
    sig = sum(np.sin(2 * np.pi * freq * k * x) / k ** 1.4 for k in range(1, 7))
    sig = lp(sig, bright) * np.exp(-x / 0.18)
    return sig * adsr(len(x), 0.003, 0.05)


def bass(freq, d):
    x = tt(d)
    sig = np.sin(2 * np.pi * freq * x) + 0.3 * np.sin(2 * np.pi * freq * 2 * x)
    return lp(sig, 400) * adsr(len(x), 0.01, 0.08) * 0.8


def piano(freq, d=2.6, vel=1.0):
    x = tt(d)
    sig = np.zeros_like(x)
    for k, amp in enumerate([1.0, 0.45, 0.25, 0.12, 0.07, 0.04], start=1):
        fk = freq * k * np.sqrt(1 + 0.0004 * k * k)  # 轻微非谐性
        sig += amp * np.sin(2 * np.pi * fk * x) * np.exp(-x * (0.9 + k * 0.6))
    hammer = lp(rng.standard_normal(len(x)), 2500) * np.exp(-x / 0.01) * 0.15
    return (sig + hammer) * adsr(len(x), 0.002, 0.3) * vel


def pad(freqs, d, cutoff=1400, attack=1.5, release=1.5):
    x = tt(d)
    sig = np.zeros_like(x)
    for fq in freqs:
        for det in (-0.12, 0.0, 0.11):
            f = fq * 2 ** (det / 12)
            ph = rng.uniform(0, 1)
            saw = 2 * ((f * x + ph) % 1) - 1
            sig += saw
    sig = lp(sig / (len(freqs) * 3), cutoff, 2)
    lfo = 1 + 0.15 * np.sin(2 * np.pi * 0.2 * x)
    return sig * lfo * adsr(len(x), attack, release)


# ---------------------------------------------------------------- BGM
def build_bgm():
    N = int((TOTAL + 0.5) * SR)
    drums = np.zeros((2, N))
    mel = np.zeros((2, N))
    pads = np.zeros((2, N))

    BPM = 112.5  # 一拍 = 16 帧 @30fps
    beat = 60 / BPM
    # Am - F - C - G （两小节一个和弦）
    chords = [
        (57, [57, 60, 64, 69]),
        (53, [53, 57, 60, 65]),
        (48, [55, 60, 64, 67]),
        (55, [55, 59, 62, 67]),
    ]
    beat_end = sec("family")  # 鼓组在"陪家人"前撤掉
    arp_in = 2 * beat * 4  # 前两小节只有 pad + 琶音进入
    kick_in = sec("total") - 0.2

    nbeats = int(TOTAL / beat) + 1
    for b in range(nbeats):
        at = b * beat
        bar = b // 4
        root, notes = chords[(bar // 2) % 4]
        # 鼓
        if kick_in <= at < beat_end - 0.05:
            fade = np.clip((beat_end - at) / 4.0, 0.35, 1.0)
            place(drums, kick(), at, 0.85 * fade)
            place(drums, hat(), at + beat / 2, 0.22 * fade, pan=0.3)
            if b % 4 == 3:
                place(drums, hat(0.25, True), at + beat * 0.75, 0.12 * fade, pan=-0.3)
            if b % 2 == 0:
                place(mel, bass(midi(root - 12), beat * 1.9), at, 0.55 * fade)
        # 琶音（十六分音符）
        if arp_in * 0.5 <= at < beat_end:
            fade = np.clip((beat_end - at) / 5.0, 0.0, 1.0)
            for s16 in range(4):
                n = notes[(b * 4 + s16) % 4] + (12 if s16 == 3 else 0)
                place(mel, pluck(midi(n + 12), 0.5, 3200 + 1200 * fade), at + s16 * beat / 4, 0.16 * fade, pan=(-0.4 if s16 % 2 else 0.4))

    # 前半段 pad
    for bar in range(0, int(beat_end / (beat * 4)) + 1):
        if bar % 2:
            continue
        root, notes = chords[(bar // 2) % 4]
        at = bar * beat * 4
        place(pads, pad([midi(n) for n in notes], beat * 8 + 1.0, 1100, 1.0, 1.2), at, 0.20)

    # 陪家人：钢琴 + 暖 pad
    fam = sec("family")
    sumt = sec("summary")
    piano_seq = [(0.0, 69), (0.9, 72), (1.8, 76), (3.0, 74), (4.2, 72), (5.0, 69)]
    for dt, n in piano_seq:
        if fam + dt < sumt:
            place(mel, piano(midi(n), 3.0, 0.5), fam + 0.4 + dt, 0.5, pan=0.1)
    place(pads, pad([midi(n) for n in (53, 57, 60, 64)], sumt - fam + 1.5, 900, 1.2, 1.5), fam, 0.26)

    # 汇总：心跳脉冲 + 和弦渐强，结余揭晓处（PHASE_B+30 帧）落和弦
    reveal = sumt + (118 + 30) / FPS
    hb = sumt + 0.2
    while hb < reveal - 0.1:
        place(drums, lp(kick(0.5), 200), hb, 0.45)
        place(drums, lp(kick(0.4), 200), hb + 0.28, 0.25)
        hb += 1.2
    place(pads, pad([midi(n) for n in (45, 57, 60, 64)], reveal - sumt + 0.5, 700, 2.0, 0.5), sumt, 0.24)
    for dt, n in [(0, 57), (0, 64), (0, 69), (0.02, 72), (0.04, 76)]:
        place(mel, piano(midi(n), 4.5, 0.7), reveal + dt, 0.45)
    place(drums, lp(kick(1.2), 120), reveal, 0.9)
    it = sec("interact")
    place(pads, pad([midi(n) for n in (48, 55, 60, 64, 67)], it - reveal + 2.0, 1600, 0.3, 2.0), reveal, 0.24)

    # 互动：轻柔琶音回归，C 大调收在明亮的位置
    for i in range(int((TOTAL - it) / (beat / 2))):
        at = it + 0.3 + i * beat / 2
        n = [60, 64, 67, 72, 67, 64][i % 6] + 12
        fade = np.clip((TOTAL - 0.8 - at) / 2.5, 0, 1) * np.clip(i / 6, 0, 1)
        place(mel, pluck(midi(n), 0.7, 2500), at, 0.12 * fade, pan=(-0.3 if i % 2 else 0.3))
    place(pads, pad([midi(n) for n in (48, 55, 60, 64, 67)], TOTAL - it + 0.5, 1000, 1.5, 2.5), it, 0.22)

    mix = drums * 0.9 + reverb(mel, 0.35, 1.2) + reverb(pads, 0.45, 1.5)
    mix = hp(mix, 30)
    # 软削波，防止峰值
    mix = np.tanh(norm(mix, 0.95) * 1.2) / np.tanh(1.2)
    out = norm(mix, 0.89)
    end = int(TOTAL * SR)
    out = out[:, :end]
    out[:, -int(1.2 * SR):] *= np.linspace(1, 0, int(1.2 * SR))
    return out


# ---------------------------------------------------------------- 音效
def sfx():
    S = {}
    # 数字跳动
    x = tt(0.04)
    S["tick"] = np.sin(2 * np.pi * 2200 * x) * np.exp(-x / 0.008) * 0.6
    # UI 点击
    x = tt(0.07)
    S["click"] = (np.sin(2 * np.pi * 1400 * x) * np.exp(-x / 0.012) + 0.4 * hp(rng.standard_normal(len(x)), 3000) * np.exp(-x / 0.004)) * 0.7
    # whoosh
    d = 0.7
    x = tt(d)
    n = rng.standard_normal(len(x))
    sweep = np.zeros_like(n)
    for k in range(0, len(x), 2400):
        seg = n[k:k + 2400]
        fc = 300 + 3500 * np.sin(np.pi * k / len(x))
        sweep[k:k + 2400] = bp(seg, max(100, fc * 0.5), min(SR / 2 - 100, fc * 1.5))
    S["whoosh"] = sweep * np.sin(np.pi * x / d) ** 2 * 1.4
    # 手机滑动
    d = 0.25
    x = tt(d)
    S["swipe"] = bp(rng.standard_normal(len(x)), 1500, 6000) * np.sin(np.pi * x / d) ** 3 * 0.8
    # 进度条填充：上升音
    d = 0.9
    x = tt(d)
    f = 300 + 900 * (x / d) ** 1.5
    S["fill"] = np.sin(2 * np.pi * np.cumsum(f) / SR) * adsr(len(x), 0.05, 0.3) * 0.35
    # 翻页
    d = 0.3
    x = tt(d)
    S["page"] = bp(rng.standard_normal(len(x)), 800, 5000) * (np.exp(-x / 0.05) + 0.5 * np.exp(-((x - 0.12) ** 2) / 0.001)) * 0.7
    # 打印机：节奏性的步进噪声
    d = 2.6
    x = tt(d)
    steps = (np.sin(2 * np.pi * 22 * x) > 0.6).astype(float)
    S["printer"] = (bp(rng.standard_normal(len(x)), 900, 4000) * steps * 0.5 + 0.15 * np.sin(2 * np.pi * 110 * x)) * adsr(len(x), 0.05, 0.3)
    # 印章：低频冲击 + 纸面拍击
    d = 0.6
    x = tt(d)
    S["stamp"] = lp(kick(d), 300) * 0.9 + lp(rng.standard_normal(len(x)), 2000) * np.exp(-x / 0.02) * 0.6
    # 通知
    x = tt(0.5)
    S["notify"] = (np.sin(2 * np.pi * 1318 * x) * np.exp(-x / 0.08) + np.sin(2 * np.pi * 1760 * np.maximum(0, x - 0.09)) * np.exp(-np.maximum(0, x - 0.09) / 0.12) * (x > 0.09)) * 0.4
    # 低频氛围冲击
    d = 2.2
    x = tt(d)
    S["boom"] = lp(np.sin(2 * np.pi * (38 + 30 * np.exp(-x / 0.1)) * x), 180) * np.exp(-x / 0.6) + lp(rng.standard_normal(len(x)), 500) * np.exp(-x / 0.08) * 0.3
    # 扣款：短促的下行双音
    x = tt(0.35)
    f = np.where(x < 0.1, 880, 587)
    S["charge"] = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x / 0.12) * 0.45
    # riser
    d = 2.2
    x = tt(d)
    f = 200 + 1600 * (x / d) ** 2
    S["riser"] = (bp(rng.standard_normal(len(x)), 400, 6000) * 0.4 + np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.2) * (x / d) ** 2
    # 撕纸
    d = 0.5
    x = tt(d)
    S["tear"] = bp(rng.standard_normal(len(x)), 1500, 8000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 60 * x))) * np.exp(-x / 0.2)
    # 闪光 shimmer
    d = 1.8
    x = tt(d)
    sh = np.zeros_like(x)
    for k, n in enumerate([84, 88, 91, 96]):
        xx = np.maximum(0, x - k * 0.06)
        sh += np.sin(2 * np.pi * midi(n) * xx) * np.exp(-xx / 0.5) * (x > k * 0.06)
    S["shimmer"] = sh * 0.18
    return S


if __name__ == "__main__":
    out_dir = os.path.join(ROOT, "public", "audio")
    for name, sig in sfx().items():
        st = reverb(np.vstack([sig, sig]), 0.15, 0.8)
        write(os.path.join(out_dir, "sfx", f"{name}.wav"), norm(st, 0.85))
        print("sfx", name)
    bgm = build_bgm()
    write(os.path.join(out_dir, "bgm.wav"), bgm)
    print(f"bgm.wav  {bgm.shape[1] / SR:.2f}s  (timeline {TOTAL_FRAMES} frames = {TOTAL:.2f}s)")
