#!/usr/bin/env node
/**
 * mix-sfx.mjs
 * ---------------------------------------------------------------------------
 * Places every event from src/config/sfx.json onto a stereo timeline and
 * renders the mastered 140.000 s 48 kHz / 16-bit WAV.
 *
 *  - sample-accurate placement: round(startFrame / fps * sampleRate)
 *  - per event: truncate or zero-pad to durationFrames, raised-cosine
 *    fade-in / fade-out, volume, constant-power pan
 *  - missing source files are a hard error, never a silent skip
 *  - one gentle soft-clip stage only if the sum actually exceeds full scale,
 *    then normalised so the absolute peak equals targetPeakDb
 *
 * Run:  node scripts/mix-sfx.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const CFG_PATH = path.join(ROOT, 'src', 'config', 'sfx.json');
const SFX_DIR = path.join(ROOT, 'public', 'sfx');
const OUT_DIR = path.join(ROOT, 'output');
const OUT_PATH = path.join(OUT_DIR, '看不见的代价_sfx.wav');

const dbToLin = (d) => Math.pow(10, d / 20);
const linToDb = (x) => 20 * Math.log10(Math.max(1e-12, x));

/* ------------------------------------------------------------- WAV reading */

function readWav(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 44) throw new Error(file + ': file too short to be a WAV');
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error(file + ': not a RIFF/WAVE file');
  }
  let pos = 12;
  let fmt = null;
  let dataOff = -1;
  let dataLen = 0;
  while (pos + 8 <= buf.length) {
    const id = buf.toString('ascii', pos, pos + 4);
    const size = buf.readUInt32LE(pos + 4);
    const body = pos + 8;
    if (id === 'fmt ') {
      fmt = {
        audioFormat: buf.readUInt16LE(body),
        channels: buf.readUInt16LE(body + 2),
        sampleRate: buf.readUInt32LE(body + 4),
        byteRate: buf.readUInt32LE(body + 8),
        blockAlign: buf.readUInt16LE(body + 12),
        bitsPerSample: buf.readUInt16LE(body + 14),
      };
    } else if (id === 'data') {
      dataOff = body;
      dataLen = Math.min(size, buf.length - body);
    }
    pos = body + size + (size & 1);
  }
  if (!fmt) throw new Error(file + ': no fmt chunk');
  if (dataOff < 0) throw new Error(file + ': no data chunk');
  if (fmt.audioFormat !== 1) throw new Error(file + ': only PCM (format 1) is supported');
  if (fmt.bitsPerSample !== 16) throw new Error(file + ': expected 16-bit PCM, got ' + fmt.bitsPerSample);

  const ch = fmt.channels;
  const frames = Math.floor(dataLen / (fmt.blockAlign || ch * 2));
  const out = new Float64Array(frames);
  if (ch === 1) {
    for (let i = 0; i < frames; i++) out[i] = buf.readInt16LE(dataOff + i * 2) / 32768;
  } else {
    // downmix any multichannel source to mono for placement
    for (let i = 0; i < frames; i++) {
      let s = 0;
      for (let c = 0; c < ch; c++) s += buf.readInt16LE(dataOff + (i * ch + c) * 2) / 32768;
      out[i] = s / ch;
    }
  }
  return { samples: out, sampleRate: fmt.sampleRate, channels: ch, bits: fmt.bitsPerSample };
}

/* ------------------------------------------------------------- WAV writing */

function writeWavStereo16(file, L, R, sr) {
  const frames = L.length;
  const dataBytes = frames * 2 * 2;
  const buf = Buffer.alloc(44 + dataBytes);
  buf.write('RIFF', 0, 'ascii');
  buf.writeUInt32LE(36 + dataBytes, 4);
  buf.write('WAVE', 8, 'ascii');
  buf.write('fmt ', 12, 'ascii');
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(2, 22);
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2 * 2, 28);
  buf.writeUInt16LE(4, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36, 'ascii');
  buf.writeUInt32LE(dataBytes, 40);
  let o = 44;
  for (let i = 0; i < frames; i++) {
    const l = Math.round(Math.max(-1, Math.min(1, L[i])) * 32767);
    const r = Math.round(Math.max(-1, Math.min(1, R[i])) * 32767);
    buf.writeInt16LE(l, o);
    buf.writeInt16LE(r, o + 2);
    o += 4;
  }
  fs.writeFileSync(file, buf);
  return buf.length;
}

/* ---------------------------------------------------------------- the mix */

function main() {
  if (!fs.existsSync(CFG_PATH)) fail('config not found: ' + CFG_PATH);
  const cfg = JSON.parse(fs.readFileSync(CFG_PATH, 'utf8'));

  const SR = cfg.sampleRate ?? 48000;
  const CH = cfg.channels ?? 2;
  const FPS = cfg.fps ?? 30;
  const TOTAL_FRAMES = cfg.totalFrames ?? 4200;
  const TARGET_PEAK_DB = cfg.targetPeakDb ?? -9;
  const events = cfg.events ?? [];

  if (CH !== 2) fail('this mixer renders stereo only, config says channels=' + CH);
  if (!Array.isArray(events) || events.length === 0) fail('config has no events');

  const totalSamples = Math.round((TOTAL_FRAMES / FPS) * SR);
  console.log('mix-sfx: ' + events.length + ' events');
  console.log('         ' + TOTAL_FRAMES + ' frames @ ' + FPS + ' fps = ' +
    (TOTAL_FRAMES / FPS).toFixed(3) + ' s = ' + totalSamples + ' samples/channel @ ' + SR + ' Hz\n');

  // ---- 1. validate every referenced file up front (never skip silently)
  const needed = [...new Set(events.map((e) => e.file))].sort();
  const missing = needed.filter((f) => !fs.existsSync(path.join(SFX_DIR, f)));
  if (missing.length) {
    fail('missing ' + missing.length + ' source file(s) in ' + SFX_DIR + ':\n   ' + missing.join('\n   '));
  }
  const sources = new Map();
  for (const f of needed) {
    const wav = readWav(path.join(SFX_DIR, f));
    if (wav.sampleRate !== SR) fail(f + ': sampleRate ' + wav.sampleRate + ' != config ' + SR);
    sources.set(f, wav);
  }
  console.log('   sources validated: ' + needed.length + ' unique file(s)');

  // ---- 2. accumulate
  const L = new Float64Array(totalSamples);
  const R = new Float64Array(totalSamples);

  const perEvent = [];
  events.forEach((ev, idx) => {
    const src = sources.get(ev.file);
    const start = Math.round((ev.startFrame / FPS) * SR);
    const dur = Math.round((ev.durationFrames / FPS) * SR);
    const vol = ev.volume ?? 1;
    const pan = Math.max(-1, Math.min(1, ev.pan ?? 0));
    const fadeInN = Math.max(0, Math.min(dur, Math.round(((ev.fadeInFrames ?? 0) / FPS) * SR)));
    const fadeOutN = Math.max(0, Math.min(dur, Math.round(((ev.fadeOutFrames ?? 0) / FPS) * SR)));

    const endFrame = ev.startFrame + ev.durationFrames;
    const past = endFrame > TOTAL_FRAMES;
    const fromFile = Math.min(dur, src.samples.length);
    const padded = dur - fromFile;

    // constant-power pan
    const theta = ((pan + 1) / 2) * (Math.PI / 2);
    const gainL = Math.cos(theta);
    const gainR = Math.sin(theta);

    for (let i = 0; i < dur; i++) {
      const out = start + i;
      if (out < 0 || out >= totalSamples) continue;
      let s = i < fromFile ? src.samples[i] : 0;
      if (s === 0 && i >= fromFile) continue;
      if (fadeInN > 0 && i < fadeInN) s *= 0.5 - 0.5 * Math.cos((Math.PI * i) / fadeInN);
      if (fadeOutN > 0 && i >= dur - fadeOutN) {
        const k = i - (dur - fadeOutN);
        s *= 0.5 - 0.5 * Math.cos((Math.PI * k) / fadeOutN);
      }
      s *= vol;
      L[out] += s * gainL;
      R[out] += s * gainR;
    }

    perEvent.push({
      idx,
      id: ev.id,
      file: ev.file,
      start,
      dur,
      startSec: start / SR,
      endSec: (start + dur) / SR,
      endFrame,
      past,
      fromFile,
      padded,
      srcFrames: src.samples.length,
      accepted: Math.min(dur, Math.max(0, totalSamples - start)),
      vol,
      pan,
    });
  });

  // ---- 3. analysis of the raw sum
  let peak = 0;
  for (let i = 0; i < totalSamples; i++) {
    const a = Math.abs(L[i]);
    const b = Math.abs(R[i]);
    if (a > peak) peak = a;
    if (b > peak) peak = b;
  }
  const rawPeak = peak;
  const rawPeakDb = linToDb(rawPeak);
  console.log('   raw summed peak before mastering: ' + rawPeak.toFixed(4) +
    ' (' + rawPeakDb.toFixed(2) + ' dBFS)');

  // ---- 4. gentle soft-clip only if the sum actually overshoots
  let clipped = false;
  if (peak > 1.0) {
    clipped = true;
    const thigh = 0.85;
    for (let i = 0; i < totalSamples; i++) {
      L[i] = softClip(L[i], thigh);
      R[i] = softClip(R[i], thigh);
    }
    let p2 = 0;
    for (let i = 0; i < totalSamples; i++) p2 = Math.max(p2, Math.abs(L[i]), Math.abs(R[i]));
    peak = p2;
    console.log('   sum exceeded full scale -> soft-clip knee applied, peak now ' + peak.toFixed(4));
  } else {
    console.log('   sum is within full scale -> no limiter needed');
  }

  // ---- 5. normalise to the target peak
  const targetLin = dbToLin(TARGET_PEAK_DB);
  const normGain = targetLin / peak;
  let finPeak = 0;
  let sumSqL = 0;
  let sumSqR = 0;
  for (let i = 0; i < totalSamples; i++) {
    const l = L[i] * normGain;
    const r = R[i] * normGain;
    L[i] = l;
    R[i] = r;
    const a = Math.abs(l);
    const b = Math.abs(r);
    if (a > finPeak) finPeak = a;
    if (b > finPeak) finPeak = b;
    sumSqL += l * l;
    sumSqR += r * r;
  }
  const rmsL = Math.sqrt(sumSqL / totalSamples);
  const rmsR = Math.sqrt(sumSqR / totalSamples);

  // ---- 6. write it
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const bytes = writeWavStereo16(OUT_PATH, L, R, SR);

  // ---- 7. report
  console.log('\n--- mix report -------------------------------------------------');
  console.log('events placed ............ ' + events.length);
  console.log('unique files used ........ ' + needed.length + ' (of 26 in the library)');
  console.log('  ' + needed.join(', '));
  console.log('duration ................. ' + (totalSamples / SR).toFixed(3) + ' s (' + totalSamples + ' samples/ch)');
  console.log('raw pre-normalisation peak ' + rawPeakDb.toFixed(2) + ' dBFS');
  console.log('limiter .................. ' + (clipped ? 'engaged (soft-clip)' : 'bypassed'));
  console.log('normalisation gain ....... ' + linToDb(normGain).toFixed(2) + ' dB -> target ' + TARGET_PEAK_DB + ' dBFS');
  console.log('final peak ............... ' + linToDb(finPeak).toFixed(2) + ' dBFS (' + finPeak.toFixed(4) + ')');
  console.log('final RMS L / R .......... ' + linToDb(rmsL).toFixed(2) + ' / ' + linToDb(rmsR).toFixed(2) + ' dBFS');
  console.log('output ................... ' + OUT_PATH);
  console.log('output size .............. ' + bytes + ' bytes (' + (bytes / 1048576).toFixed(2) + ' MiB)');

  if (Math.abs(totalSamples / SR - 140) > 1e-9) fail('duration is not exactly 140.000 s');
  console.log('duration check ........... 140.000 s exactly  OK');

  const pastEnd = perEvent.filter((e) => e.past);
  const paddedEvents = perEvent.filter((e) => e.padded > 0);
  console.log('\nper-event sanity');
  console.log('  events past the end of the timeline: ' + pastEnd.length +
    (pastEnd.length ? ' -> ' + pastEnd.map((e) => e.id).join(', ') : ''));
  if (pastEnd.length) fail('events extend past the end of the timeline');
  console.log('  events zero-padded because the source is shorter: ' + paddedEvents.length);
  for (const e of paddedEvents) {
    console.log('     ' + e.id.padEnd(12) + ' src ' + (e.srcFrames / SR).toFixed(2) +
      ' s -> placed ' + (e.dur / SR).toFixed(2) + ' s (+' + (e.padded / SR).toFixed(2) + ' s silence)');
  }
  const last = perEvent.reduce((a, b) => (b.endSec > a.endSec ? b : a));
  console.log('  last event ends at frame ' + last.endFrame + ' (' + last.endSec.toFixed(3) +
    ' s) of ' + TOTAL_FRAMES + ' -> OK');
  const first = perEvent.reduce((a, b) => (b.start < a.start ? b : a));
  console.log('  first event "' + first.id + '" starts at sample ' + first.start +
    ' (' + first.startSec.toFixed(4) + ' s, frame ' + Math.round(first.startSec * FPS) + ')');

  // sanity: no NaN / Inf anywhere
  for (let i = 0; i < totalSamples; i++) {
    if (!Number.isFinite(L[i]) || !Number.isFinite(R[i])) fail('non-finite sample at ' + i);
  }
  console.log('  all ' + totalSamples * 2 + ' samples finite: OK');
}

function softClip(x, thigh) {
  const a = Math.abs(x);
  if (a <= thigh) return x;
  const over = (a - thigh) / (1 - thigh);
  const shaped = thigh + (1 - thigh) * Math.tanh(over);
  return Math.sign(x) * shaped;
}

function fail(msg) {
  console.error('\nMIX ERROR: ' + msg);
  process.exit(1);
}

main();
