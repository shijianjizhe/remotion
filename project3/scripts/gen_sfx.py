"""Original procedural SFX for 《看不见的代价》.
All sounds are synthesised from noise / sine partials with fixed seeds (no samples, no music, no voice).
Output: public/sfx/*.wav, 48 kHz stereo 16-bit PCM.
"""
import os
import numpy as np
from scipy import signal
from scipy.io import wavfile

SR = 48000
OUT = "public/sfx"
os.makedirs(OUT, exist_ok=True)
rng_master = np.random.default_rng(2026)


def T(sec):
    return np.arange(int(sec * SR)) / SR


def noise(sec, seed):
    return np.random.default_rng(seed).normal(0, 1, int(sec * SR))


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], btype="band", fs=SR, output="sos")
    return signal.sosfilt(sos, x)


def lp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return signal.sosfilt(signal.butter(order, f, btype="high", fs=SR, output="sos"), x)


def env_exp(sec, tau, attack=0.002):
    t = T(sec)
    a = np.clip(t / max(attack, 1e-4), 0, 1)
    return a * np.exp(-t / tau)


def env_ad(sec, a, d_start, d_len):
    t = T(sec)
    e = np.clip(t / max(a, 1e-4), 0, 1)
    rel = np.clip(1 - (t - d_start) / d_len, 0, 1)
    return e * np.where(t > d_start, rel, 1) ** 1.5


def reverb(x, sec=1.6, decay=0.5, mix=0.25, seed=7, lowcut=6000):
    rng = np.random.default_rng(seed)
    n = int(sec * SR)
    ir = rng.normal(0, 1, n) * np.exp(-np.arange(n) / (decay * SR))
    ir = lp(ir, lowcut)
    ir /= np.sqrt((ir ** 2).sum()) + 1e-9
    wet = np.pad(signal.fftconvolve(x, ir), (0, 1))[: len(x) + n]
    dry = np.concatenate([x, np.zeros(n)])
    return (1 - mix) * dry + mix * wet * 3


def stereo(x, width=0.25, seed=3):
    """Decorrelated stereo from mono: small delay + different reverb seeds."""
    d = int(0.00045 * SR)
    l = x
    r = np.concatenate([np.zeros(d), x[:-d]]) if d > 0 else x
    side = hp(np.random.default_rng(seed).normal(0, 1, len(x)) * 0, 200)
    return np.stack([l * (1 + width * 0) + side, r * (1 - width * 0) + side], 1)


def stereo_rev(x, sec=1.6, decay=0.5, mix=0.25, lowcut=6000):
    L = reverb(x, sec, decay, mix, seed=11, lowcut=lowcut)
    R = reverb(x, sec, decay, mix, seed=12, lowcut=lowcut)
    return np.stack([L, R], 1)


def metal(freqs, amps, taus, sec, seed=0, detune=0.0):
    t = T(sec)
    rng = np.random.default_rng(seed)
    y = np.zeros_like(t)
    for f, a, tau in zip(freqs, amps, taus):
        f2 = f * (1 + rng.normal(0, detune))
        ph = rng.random() * 2 * np.pi
        beat = 1 + 0.15 * np.sin(2 * np.pi * rng.uniform(0.5, 3) * t)
        y += a * np.sin(2 * np.pi * f2 * t + ph) * np.exp(-t / tau) * beat
    return y


def click(sec, seed, lo=2000, hi=9000, tau=0.004):
    return bp(noise(sec, seed), lo, hi) * env_exp(sec, tau, 0.0003)


def place(dst, src, at_sec, gain=1.0):
    i = int(at_sec * SR)
    n = min(len(src), len(dst) - i)
    if n > 0:
        dst[i : i + n] += src[:n] * gain


def save(name, x, peak_db=-3.0):
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    # short fade-out guard to avoid clicks
    fo = min(len(x), int(0.02 * SR))
    x[-fo:] *= np.linspace(1, 0, fo)[:, None]
    x = x - x.mean(0)
    pk = np.abs(x).max() + 1e-12
    x = x / pk * 10 ** (peak_db / 20)
    wavfile.write(os.path.join(OUT, name), SR, (x * 32767).astype(np.int16))
    print(f"{name:24s} {len(x)/SR:5.2f}s")


# ---------------------------------------------------------------- ambience
def room_air():
    sec = 8
    n = lp(noise(sec, 1), 900) * 0.6 + lp(noise(sec, 2), 250)
    t = T(sec)
    hum = 0.25 * np.sin(2 * np.pi * 55 * t) + 0.12 * np.sin(2 * np.pi * 110.4 * t) + 0.05 * np.sin(2 * np.pi * 164.7 * t)
    hum *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.21 * t)
    x = n * 0.5 + hum
    x *= env_ad(sec, 2.5, 5.5, 2.5)
    L = x
    R = 0.85 * x + 0.15 * lp(noise(sec, 3), 700) * env_ad(sec, 2.5, 5.5, 2.5)
    save("room_air.wav", np.stack([L, R], 1), -6)


def wind_soft():
    sec = 6
    t = T(sec)
    n = noise(sec, 21)
    mod = 0.55 + 0.45 * np.sin(2 * np.pi * 0.18 * t + 1) * np.sin(2 * np.pi * 0.07 * t)
    x = bp(n, 250, 1400) * mod
    x = x * env_ad(sec, 1.8, 3.8, 2.2)
    y = bp(noise(sec, 22), 300, 1600) * mod[::-1] * env_ad(sec, 1.8, 3.8, 2.2)
    save("wind_soft.wav", np.stack([x, y], 1), -6)


def theater_room():
    sec = 7
    t = T(sec)
    base = lp(noise(sec, 31), 500) + 0.4 * bp(noise(sec, 32), 150, 900)
    # non-semantic crowd texture: many band-limited amplitude swells (no formants / no speech)
    crowd = np.zeros_like(t)
    rng = np.random.default_rng(33)
    for k in range(40):
        c = rng.uniform(0, sec)
        w = rng.uniform(0.4, 1.4)
        g = np.exp(-((t - c) / w) ** 2)
        crowd += g * rng.uniform(0.3, 1)
    crowd = lp(bp(noise(sec, 34), 180, 700), 650) * (0.4 + crowd / crowd.max())
    x = (base * 0.5 + crowd * 0.8) * env_ad(sec, 1.5, 5, 2)
    save("theater_room.wav", stereo_rev(x, 1.8, 0.7, 0.35, 3000), -8)


# ---------------------------------------------------------------- glass
def glass_impact():
    sec = 3.2
    t = T(sec)
    rng = np.random.default_rng(41)
    hit = hp(noise(sec, 42), 1500) * env_exp(sec, 0.035, 0.0005)
    body = lp(noise(sec, 43), 300) * env_exp(sec, 0.06, 0.001) * 0.9
    ring = np.zeros_like(t)
    for k in range(18):
        f = rng.uniform(2500, 9500)
        ring += np.sin(2 * np.pi * f * t + rng.random() * 6) * np.exp(-t / rng.uniform(0.05, 0.35)) * rng.uniform(0.1, 0.4)
    debris = np.zeros_like(t)
    for k in range(70):
        at = 0.02 + rng.exponential(0.35)
        if at > sec - 0.3:
            continue
        f = rng.uniform(3000, 11000)
        s = metal([f, f * 1.47, f * 2.13], [1, 0.5, 0.3], [0.03, 0.02, 0.015], 0.25, seed=k)
        s += click(0.25, 1000 + k) * 0.6
        place(debris, s, at, rng.uniform(0.05, 0.35) * np.exp(-at / 0.9))
    x = hit * 1.2 + body + ring * 0.6 + debris
    st = stereo_rev(x, 1.4, 0.4, 0.2, 9000)
    # spread debris a little
    st[:, 1] = 0.8 * st[:, 1] + 0.2 * np.roll(st[:, 0], 90)
    save("glass_impact.wav", st, -1.5)


def glass_tail():
    sec = 3.5
    t = T(sec)
    rng = np.random.default_rng(51)
    x = np.zeros_like(t)
    for k in range(40):
        at = rng.uniform(0, 2.6)
        f = rng.uniform(4000, 10000)
        s = metal([f, f * 1.6], [1, 0.4], [0.05, 0.03], 0.3, seed=50 + k)
        place(x, s, at, rng.uniform(0.05, 0.25) * (1 - at / 3))
    x += hp(noise(sec, 52), 5000) * 0.03 * env_ad(sec, 0.5, 1.5, 2)
    save("glass_tail.wav", stereo_rev(x, 1.5, 0.5, 0.35, 10000), -4)


def glass_restore():
    sec = 1.8
    t = T(sec)
    x = np.zeros_like(t)
    rng = np.random.default_rng(61)
    for k in range(14):
        f = rng.uniform(2500, 7000)
        x += np.sin(2 * np.pi * f * t) * rng.uniform(0.2, 0.6)
    e = np.clip(t / 1.2, 0, 1) ** 2 * np.clip((sec - t) / 0.12, 0, 1)
    x = x * e + hp(noise(sec, 62), 4000) * e * 0.2
    save("glass_restore.wav", stereo_rev(x, 1.0, 0.3, 0.3), -6)


# ---------------------------------------------------------------- coins / metal
def coin_tap(seed=71, name="coin_tap.wav"):
    sec = 0.9
    rng = np.random.default_rng(seed)
    f0 = rng.uniform(3200, 3700)
    x = metal([f0, f0 * 1.52, f0 * 2.27, f0 * 2.96], [1, 0.7, 0.45, 0.3], [0.12, 0.08, 0.05, 0.04], sec, seed=seed, detune=0.004)
    x += click(sec, seed + 1, 3000, 12000, 0.002) * 0.9
    save(name, stereo_rev(x, 0.6, 0.15, 0.18, 9000), -3)


def coin_chime():
    sec = 3.0
    f0 = 1180
    x = metal([f0, f0 * 2.76, f0 * 5.40, f0 * 8.93, f0 * 1.5], [1, 0.55, 0.3, 0.12, 0.2], [1.1, 0.7, 0.4, 0.2, 0.5], sec, seed=81, detune=0.002)
    x += click(sec, 82, 2000, 9000, 0.003) * 0.4
    x *= env_exp(sec, 1.2, 0.004)
    save("coin_chime.wav", stereo_rev(x, 1.8, 0.6, 0.3, 8000), -4)


def coin_low():
    sec = 4.0
    f0 = 392
    x = metal([f0, f0 * 2.76, f0 * 5.4, f0 * 0.5], [1, 0.4, 0.15, 0.5], [1.8, 1.0, 0.5, 2.2], sec, seed=91, detune=0.001)
    x *= np.clip(T(sec) / 0.02, 0, 1)
    save("coin_low.wav", stereo_rev(x, 2.2, 0.8, 0.35, 5000), -4)


def coin_bright():
    sec = 1.6
    f0 = 2093
    x = metal([f0, f0 * 2.0, f0 * 3.01, f0 * 4.2], [1, 0.5, 0.3, 0.15], [0.6, 0.4, 0.25, 0.15], sec, seed=95)
    x *= np.clip(T(sec) / 0.004, 0, 1)
    save("coin_bright.wav", stereo_rev(x, 1.2, 0.4, 0.3, 9000), -5)


def low_thump():
    sec = 3.0
    t = T(sec)
    f = 48 + 30 * np.exp(-t / 0.15)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * env_exp(sec, 0.7, 0.008) + lp(noise(sec, 101), 180) * env_exp(sec, 0.25, 0.005) * 0.4
    save("low_thump.wav", stereo_rev(x, 1.5, 0.6, 0.2, 2000), -3)


def title_swell():
    sec = 3.5
    t = T(sec)
    f = 55 + 8 * t / sec
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.8 + 0.3 * np.sin(2 * np.pi * np.cumsum(2 * f) / SR)
    x += bp(noise(sec, 111), 200, 1200) * 0.15
    e = np.clip(t / 1.4, 0, 1) ** 2 * np.clip((sec - t) / 1.6, 0, 1)
    save("title_swell.wav", stereo_rev(x * e, 2, 0.8, 0.3, 3000), -4)


def brass_clink():
    sec = 1.6
    f0 = 1620
    x = metal([f0, f0 * 2.4, f0 * 3.9, f0 * 0.71], [1, 0.5, 0.25, 0.35], [0.5, 0.3, 0.15, 0.6], sec, seed=121, detune=0.003)
    x += click(sec, 122, 1500, 8000, 0.003) * 0.8
    save("scale_clink.wav", stereo_rev(x, 1.2, 0.4, 0.25), -4)


def chain_gear():
    sec = 3.0
    x = np.zeros(int(sec * SR))
    rng = np.random.default_rng(131)
    at = 0.0
    while at < 2.4:
        f = rng.uniform(2500, 5200)
        s = metal([f, f * 1.7], [1, 0.5], [0.02, 0.015], 0.12, seed=int(at * 1000)) + click(0.12, int(at * 977), 2000, 9000, 0.002)
        place(x, s, at, rng.uniform(0.2, 0.6) * (1 - at / 2.8))
        at += rng.uniform(0.03, 0.11)
    # gear ratchet
    for k in range(10):
        place(x, click(0.05, 140 + k, 800, 4000, 0.004), 0.3 + k * 0.17, 0.5)
    save("chain_gear.wav", stereo_rev(x, 1.0, 0.3, 0.2), -4)


def dial_wheel():
    sec = 2.8
    x = np.zeros(int(sec * SR))
    times = np.cumsum(np.concatenate([np.linspace(0.16, 0.05, 14), np.linspace(0.05, 0.18, 12)]))
    for k, at in enumerate(times):
        if at < sec - 0.1:
            place(x, click(0.08, 150 + k, 1200, 6000, 0.003) + metal([2900], [0.3], [0.02], 0.08, seed=k), at, 0.6)
    save("dial_wheel.wav", stereo_rev(x, 0.8, 0.2, 0.2), -5)


def clock_ticks():
    sec = 5.0
    x = np.zeros(int(sec * SR))
    for k in range(10):
        lo, hi = (1800, 7000) if k % 2 == 0 else (1200, 5000)
        s = click(0.1, 160 + k, lo, hi, 0.003) + metal([3100 if k % 2 == 0 else 2600], [0.25], [0.025], 0.1, seed=k)
        place(x, s, 0.05 + k * 0.5, 0.8)
    save("clock_ticks.wav", stereo_rev(x, 0.8, 0.25, 0.2), -5)


def lock_on():
    sec = 1.4
    x = click(sec, 171, 600, 5000, 0.006) * 1.2
    x += metal([880, 1320, 2210], [0.5, 0.3, 0.15], [0.5, 0.3, 0.2], sec, seed=172) * np.clip(T(sec) / 0.01, 0, 1)
    save("lock_on.wav", stereo_rev(x, 1.0, 0.35, 0.25), -4)


def lock_drop():
    sec = 1.2
    x = click(sec, 181, 300, 3000, 0.01) * 1.2 + lp(noise(sec, 182), 200) * env_exp(sec, 0.05) * 0.8
    x += metal([620, 1490, 2650], [0.6, 0.4, 0.2], [0.25, 0.15, 0.1], sec, seed=183)
    save("lock_drop.wav", stereo_rev(x, 0.9, 0.3, 0.2), -4)


def focus_ping(name="focus_ping.wav", f0=1568, sec=1.6, seed=191):
    x = metal([f0, f0 * 2.01, f0 * 3.0], [1, 0.3, 0.1], [0.5, 0.3, 0.2], sec, seed=seed) * np.clip(T(sec) / 0.01, 0, 1)
    save(name, stereo_rev(x, 1.4, 0.5, 0.35), -5)


def echo_far():
    sec = 3.0
    base = metal([988, 1976], [1, 0.3], [0.3, 0.2], 0.6, seed=201)
    x = np.zeros(int(sec * SR))
    for k in range(5):
        place(x, lp(base, 4000 - k * 600), k * 0.32, 0.8 * 0.55 ** k)
    save("echo_far.wav", stereo_rev(x, 1.5, 0.6, 0.4, 4000), -6)


# ---------------------------------------------------------------- paper
def paper(name, sec, seed, density=60, lo=1500, hi=9000, body=0.5):
    rng = np.random.default_rng(seed)
    t = T(sec)
    x = np.zeros_like(t)
    # crackles
    for k in range(int(density * sec)):
        at = rng.uniform(0, sec - 0.05)
        place(x, click(0.05, seed * 100 + k, lo, hi, rng.uniform(0.001, 0.006)), at, rng.uniform(0.1, 0.6))
    sweep = bp(noise(sec, seed + 1), 800, 6000) * body
    e = np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 1.5
    x = (x + sweep) * e
    save(name, stereo_rev(x, 0.7, 0.2, 0.18, 9000), -5)


def ledger_drop():
    sec = 1.0
    x = lp(noise(sec, 211), 500) * env_exp(sec, 0.04, 0.002) * 1.5 + bp(noise(sec, 212), 1000, 6000) * env_exp(sec, 0.08, 0.01) * 0.5
    save("ledger_drop.wav", stereo_rev(x, 0.8, 0.25, 0.2), -4)


def ink_dot():
    sec = 0.5
    x = bp(noise(sec, 221), 600, 3000) * env_exp(sec, 0.012, 0.001) + metal([1900], [0.1], [0.05], sec, seed=3)
    save("ink_dot.wav", stereo_rev(x, 0.6, 0.2, 0.2), -6)


def book_close():
    sec = 1.4
    x = lp(noise(sec, 231), 350) * env_exp(sec, 0.06, 0.003) * 1.4
    x += bp(noise(sec, 232), 700, 5000) * env_ad(sec, 0.25, 0.25, 0.15) * 0.35
    save("book_close.wav", stereo_rev(x, 1.2, 0.4, 0.25, 4000), -4)


def stamp():
    sec = 0.9
    x = lp(noise(sec, 241), 400) * env_exp(sec, 0.03, 0.001) * 1.6 + bp(noise(sec, 242), 1500, 7000) * env_exp(sec, 0.01) * 0.4
    save("stamp.wav", stereo_rev(x, 0.7, 0.2, 0.2), -3)


def ticket_tear():
    sec = 0.8
    rng = np.random.default_rng(251)
    x = np.zeros(int(sec * SR))
    for k in range(60):
        at = 0.05 + k * 0.006 + rng.uniform(0, 0.003)
        place(x, click(0.03, 2500 + k, 2000, 10000, 0.002), at, rng.uniform(0.2, 0.7))
    save("ticket_tear.wav", stereo_rev(x, 0.5, 0.15, 0.15), -5)


# ---------------------------------------------------------------- air / sand
def ash_disperse():
    sec = 3.5
    t = T(sec)
    x = bp(noise(sec, 261), 2500, 9000) * env_ad(sec, 0.3, 1.0, 2.4) * 0.5
    rng = np.random.default_rng(262)
    for k in range(50):
        place(x, click(0.03, 2620 + k, 4000, 12000, 0.001), rng.uniform(0, 3), rng.uniform(0.05, 0.2) * 0.6)
    # downward airy sweep
    x += lp(noise(sec, 263), 1200) * env_ad(sec, 0.5, 1.2, 2.2) * 0.4
    save("ash_disperse.wav", stereo_rev(x, 1.5, 0.6, 0.35), -6)


def sand(name, sec, seed, rate=900):
    rng = np.random.default_rng(seed)
    t = T(sec)
    n = int(rate * sec)
    x = np.zeros_like(t)
    idx = rng.integers(0, len(t) - 200, n)
    grain = click(0.004, seed, 3000, 12000, 0.0006)
    for i in idx:
        x[i : i + len(grain)] += grain * rng.uniform(0.1, 1)
    x += bp(noise(sec, seed + 1), 2000, 8000) * 0.05
    x *= env_ad(sec, 0.6, sec - 1.3, 1.2)
    save(name, stereo_rev(x, 0.9, 0.3, 0.25), -6)


def line_light():
    sec = 1.6
    t = T(sec)
    f = 660 * (1 + 0.5 * np.clip(t / 0.6, 0, 1))
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + 0.2 * np.sin(2 * np.pi * np.cumsum(f * 2.5) / SR)
    x = x * env_ad(sec, 0.25, 0.5, 1.0)
    x += bp(noise(sec, 271), 3000, 9000) * env_ad(sec, 0.2, 0.4, 0.8) * 0.1
    save("line_light.wav", stereo_rev(x, 1.3, 0.5, 0.35), -6)


def fade_whoosh():
    sec = 3.0
    t = T(sec)
    cut = 3000 * np.exp(-t / 1.2) + 300
    x = bp(noise(sec, 281), 400, 6000) * env_ad(sec, 0.2, 0.6, 2.3)
    x = lp(x, 2500) * 0.8 + hp(x, 2500) * np.exp(-t / 0.7)[..., ] * 0.6
    save("fade_whoosh.wav", stereo_rev(x, 1.6, 0.6, 0.4, 4000), -6)


def breath_low():
    sec = 3.5
    t = T(sec)
    x = lp(noise(sec, 291), 220) * 1.2 + 0.3 * np.sin(2 * np.pi * 73 * t)
    x *= np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 2
    save("breath_low.wav", stereo_rev(x, 1.4, 0.6, 0.3, 1500), -5)


def door_creak():
    sec = 2.4
    t = T(sec)
    rng = np.random.default_rng(301)
    f = 95 + 40 * np.sin(np.pi * t / sec) + 15 * np.sin(2 * np.pi * 1.3 * t)
    # stick-slip pulse train
    ph = np.cumsum(f * (1 + 0.15 * rng.normal(0, 1, len(t)))) / SR
    pulses = (np.diff(np.floor(ph), prepend=0) > 0).astype(float)
    x = signal.lfilter([1], [1, -0.95], pulses)
    x = bp(x, 400, 2600, 2) * 1.5 + bp(x, 900, 1100, 2) * 0.8
    x *= env_ad(sec, 0.3, 1.6, 0.8)
    x += lp(noise(sec, 302), 200) * env_ad(sec, 0.5, 1.2, 1.2) * 0.3
    save("door_creak.wav", stereo_rev(x, 1.5, 0.6, 0.35, 4000), -5)


def scale_hum():
    sec = 3.5
    t = T(sec)
    x = 0.7 * np.sin(2 * np.pi * 82 * t) + 0.3 * np.sin(2 * np.pi * 164.5 * t) + 0.12 * np.sin(2 * np.pi * 247 * t)
    x *= (0.75 + 0.25 * np.sin(2 * np.pi * 0.8 * t)) * np.sin(np.pi * np.clip(t / sec, 0, 1)) ** 1.2
    save("scale_hum.wav", stereo_rev(x, 1.6, 0.6, 0.3, 2000), -6)


def engrave():
    sec = 1.4
    t = T(sec)
    x = bp(noise(sec, 311), 3000, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 11 * t) ** 2)
    x += metal([4200, 6100], [0.2, 0.1], [0.4, 0.3], sec, seed=312)
    x *= env_ad(sec, 0.1, 0.9, 0.4)
    save("engrave.wav", stereo_rev(x, 0.8, 0.25, 0.2), -7)


def pencil_draw():
    sec = 1.8
    t = T(sec)
    strokes = (np.sin(2 * np.pi * 2.2 * t) > -0.2).astype(float)
    strokes = lp(strokes, 30)
    x = bp(noise(sec, 321), 1800, 6000) * strokes
    x *= env_ad(sec, 0.1, 1.4, 0.4)
    save("pencil_draw.wav", stereo_rev(x, 0.6, 0.2, 0.15), -7)


if __name__ == "__main__":
    room_air(); wind_soft(); theater_room()
    glass_impact(); glass_tail(); glass_restore()
    coin_tap(71, "coin_tap.wav"); coin_tap(74, "coin_tap_b.wav"); coin_chime(); coin_low(); coin_bright()
    low_thump(); title_swell(); brass_clink(); chain_gear(); dial_wheel(); clock_ticks()
    lock_on(); lock_drop(); focus_ping(); focus_ping("focus_short.wav", 2349, 0.8, 192); echo_far()
    paper("paper_rustle.wav", 1.6, 401, 70)
    paper("page_turn.wav", 1.2, 402, 45, body=0.8)
    paper("ticket_fold.wav", 1.0, 403, 90, 2000, 10000, 0.4)
    paper("paper_close.wav", 2.0, 404, 30, 800, 5000, 0.6)
    ledger_drop(); ink_dot(); book_close(); stamp(); ticket_tear()
    ash_disperse(); sand("sand_flow.wav", 4.5, 501, 1400); sand("sand_fall.wav", 3.5, 502, 700)
    line_light(); fade_whoosh(); breath_low(); door_creak(); scale_hum(); engrave(); pencil_draw()
