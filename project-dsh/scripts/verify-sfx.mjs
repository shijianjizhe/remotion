#!/usr/bin/env node
/**
 * verify-sfx.mjs
 * ---------------------------------------------------------------------------
 * Independent gate on the deliverables:
 *   (a) all 26 library files: exist, mono / 48 kHz / 16-bit, exact expected
 *       duration, not silent (RMS above the floor), peak below 0.95
 *   (b) the mixed master: header fields, per-channel peak + RMS, exact
 *       140.000 s duration, DC offset, zero crossings at the edges
 *
 * Run:  node scripts/verify-sfx.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const SFX_DIR = path.join(ROOT, 'public', 'sfx');
const MASTER = path.join(ROOT, 'output', '看不见的代价_sfx.wav');

const SR_EXPECTED = 48000;
const RMS_FLOOR_DB = -55; // anything below this counts as silent
const PEAK_LIMIT = 0.95;

const EXPECTED = [
  ['air-room.wav', 6.0],
  ['low-hum.wav', 4.0],
  ['glass-break.wav', 1.6],
  ['glass-tinkle.wav', 2.2],
  ['coin-tick.wav', 0.5],
  ['coin-ring.wav', 2.6],
  ['coin-land.wav', 0.7],
  ['low-boom.wav', 2.0],
  ['paper-turn.wav', 1.2],
  ['paper-open.wav', 1.6],
  ['metal-etch.wav', 1.2],
  ['ash-whoosh.wav', 2.0],
  ['ink-tap.wav', 0.4],
  ['line-flow.wav', 1.4],
  ['gear-whirr.wav', 1.4],
  ['clock-tick.wav', 0.4],
  ['sand-flow.wav', 3.2],
  ['chain-creak.wav', 1.6],
  ['balance-settle.wav', 1.4],
  ['low-breath.wav', 1.8],
  ['time-wheel.wav', 1.4],
  ['ticket-tear.wav', 0.6],
  ['theatre-creak.wav', 1.8],
  ['crowd-murmur.wav', 3.4],
  ['seal-stamp.wav', 0.9],
  ['lock-drop.wav', 1.0],
];

const linToDb = (x) => 20 * Math.log10(Math.max(1e-12, x));

function readWav(file) {
  const buf = fs.readFileSync(file);
  if (buf.length < 44) throw new Error('too short');
  if (buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WAVE') {
    throw new Error('not RIFF/WAVE');
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
      dataLen = size;
    }
    pos = body + size + (size & 1);
  }
  if (!fmt || dataOff < 0) throw new Error('missing fmt/data chunk');
  const ch = fmt.channels;
  const frames = Math.floor(dataLen / (fmt.blockAlign || ch * 2));
  const chans = [];
  for (let c = 0; c < ch; c++) chans.push(new Float64Array(frames));
  for (let i = 0; i < frames; i++) {
    for (let c = 0; c < ch; c++) {
      const off = dataOff + (i * ch + c) * 2;
      chans[c][i] = buf.readInt16LE(off) / 32768;
    }
  }
  return { fmt, frames, chans, dataLen, fileBytes: buf.length, riffBytes: buf.readUInt32LE(4) };
}

function stats(a) {
  let peak = 0, s = 0, dc = 0;
  for (let i = 0; i < a.length; i++) {
    const v = a[i];
    const av = Math.abs(v);
    if (av > peak) peak = av;
    s += v * v;
    dc += v;
  }
  return { peak, rms: Math.sqrt(s / a.length), dc: dc / a.length };
}

function gatedRms(a, sr = 48000, blockSec = 0.01, gateDb = -30) {
  const blk = Math.round(blockSec * sr);
  const nb = Math.floor(a.length / blk);
  const e = new Float64Array(nb);
  let maxE = 0;
  for (let b = 0; b < nb; b++) {
    let s = 0;
    for (let i = 0; i < blk; i++) { const v = a[b * blk + i]; s += v * v; }
    e[b] = s / blk;
    if (e[b] > maxE) maxE = e[b];
  }
  const thr = maxE * Math.pow(10, gateDb / 10);
  let acc = 0, cnt = 0;
  for (let b = 0; b < nb; b++) if (e[b] >= thr) { acc += e[b]; cnt++; }
  return Math.sqrt(acc / Math.max(1, cnt));
}

const problems = [];
const note = (m) => problems.push(m);

/* ------------------------------------------------ part (a): the library */

console.log('=== (a) SFX library: public/sfx ==========================================');
console.log(
  'file'.padEnd(20) + 'dur s'.padStart(7) + 'frames'.padStart(9) + 'sr'.padStart(9) +
  'ch'.padStart(4) + 'bits'.padStart(6) + 'peak'.padStart(8) + 'dBFS'.padStart(9) + '  status'
);
console.log('-'.repeat(90));

let libBytes = 0;
for (const [name, expDur] of EXPECTED) {
  const file = path.join(SFX_DIR, name);
  if (!fs.existsSync(file)) {
    note(name + ': MISSING');
    console.log(name.padEnd(20) + '  MISSING');
    continue;
  }
  let w;
  try {
    w = readWav(file);
  } catch (e) {
    note(name + ': unreadable (' + e.message + ')');
    console.log(name.padEnd(20) + '  UNREADABLE: ' + e.message);
    continue;
  }
  libBytes += w.fileBytes;
  const st = stats(w.chans[0]);
  const frames = w.frames;
  const dur = frames / w.fmt.sampleRate;
  const expFrames = Math.round(expDur * SR_EXPECTED);
  const issues = [];
  if (w.fmt.sampleRate !== SR_EXPECTED) issues.push('sampleRate=' + w.fmt.sampleRate);
  if (w.fmt.channels !== 1) issues.push('channels=' + w.fmt.channels);
  if (w.fmt.bitsPerSample !== 16) issues.push('bits=' + w.fmt.bitsPerSample);
  if (w.fmt.audioFormat !== 1) issues.push('format=' + w.fmt.audioFormat);
  if (frames !== expFrames) issues.push('frames ' + frames + ' != ' + expFrames);
  if (linToDb(st.rms) < RMS_FLOOR_DB) issues.push('SILENT (rms ' + linToDb(st.rms).toFixed(1) + ' dBFS)');
  if (st.peak >= PEAK_LIMIT) issues.push('peak ' + st.peak.toFixed(3) + ' >= ' + PEAK_LIMIT);
  if (Math.abs(st.dc) > 0.002) issues.push('DC ' + st.dc.toFixed(4));
  if (Math.abs(w.chans[0][0]) > 1e-6) issues.push('starts at ' + w.chans[0][0]);
  if (Math.abs(w.chans[0][frames - 1]) > 1e-6) issues.push('ends at ' + w.chans[0][frames - 1]);

  console.log(
    name.padEnd(20) +
      dur.toFixed(3).padStart(7) +
      String(frames).padStart(9) +
      String(w.fmt.sampleRate).padStart(9) +
      String(w.fmt.channels).padStart(4) +
      String(w.fmt.bitsPerSample).padStart(6) +
      st.peak.toFixed(3).padStart(8) +
      linToDb(st.rms).toFixed(1).padStart(9) +
      '  ' + (issues.length ? 'FAIL: ' + issues.join('; ') : 'ok')
  );
  for (const i of issues) note(name + ': ' + i);
}
console.log('-'.repeat(90));
console.log('library: ' + EXPECTED.length + ' files, ' + (libBytes / 1048576).toFixed(2) + ' MiB on disk');

/* ------------------------------------------------ part (b): the master */

console.log('\n=== (b) master: output/看不见的代价_sfx.wav ===============================');
if (!fs.existsSync(MASTER)) {
  note('MASTER MISSING: ' + MASTER);
  console.log('  MISSING');
} else {
  const w = readWav(MASTER);
  const dur = w.frames / w.fmt.sampleRate;
  const stL = stats(w.chans[0]);
  const stR = stats(w.chans[1]);
  const stM = stats(w.chans[0].map((v, i) => (v + w.chans[1][i]) / 2));

  console.log('  channels ............. ' + w.fmt.channels);
  console.log('  sampleRate ........... ' + w.fmt.sampleRate + ' Hz');
  console.log('  bitsPerSample ........ ' + w.fmt.bitsPerSample + ' (' + (w.fmt.audioFormat === 1 ? 'PCM' : '?') + ')');
  console.log('  blockAlign ........... ' + w.fmt.blockAlign);
  console.log('  byteRate ............. ' + w.fmt.byteRate + ' B/s');
  console.log('  data length .......... ' + w.dataLen + ' bytes = ' + w.frames + ' frames/channel');
  console.log('  RIFF size field ...... ' + w.riffBytes + ' (+8 = ' + (w.riffBytes + 8) + ' = file size ' + w.fileBytes + ')');
  console.log('  duration ............. ' + dur.toFixed(6) + ' s');
  console.log('  peak  L / R .......... ' + stL.peak.toFixed(4) + ' / ' + stR.peak.toFixed(4) +
    '   (' + linToDb(Math.max(stL.peak, stR.peak)).toFixed(2) + ' dBFS)');
  console.log('  RMS   L / R .......... ' + linToDb(stL.rms).toFixed(2) + ' / ' + linToDb(stR.rms).toFixed(2) + ' dBFS');
  console.log('  gated RMS L / R ...... ' + linToDb(gatedRms(w.chans[0])).toFixed(2) + ' / ' +
    linToDb(gatedRms(w.chans[1])).toFixed(2) + ' dBFS (active regions, -30 dB gate)');
  console.log('  DC offset L / R ...... ' + stL.dc.toExponential(2) + ' / ' + stR.dc.toExponential(2));
  console.log('  mono-sum peak ........ ' + stM.peak.toFixed(4));
  console.log('  first / last sample .. ' + w.chans[0][0].toFixed(6) + ' / ' + w.chans[0][w.frames - 1].toFixed(6));
  console.log('  file size ............ ' + w.fileBytes + ' bytes');

  if (w.fmt.channels !== 2) note('master: channels ' + w.fmt.channels + ' != 2');
  if (w.fmt.sampleRate !== SR_EXPECTED) note('master: sampleRate ' + w.fmt.sampleRate);
  if (w.fmt.bitsPerSample !== 16) note('master: bits ' + w.fmt.bitsPerSample);
  if (Math.abs(dur - 140) > 1e-9) note('master: duration ' + dur + ' != 140.000 s');
  if (w.frames !== 6720000) note('master: frames ' + w.frames + ' != 6720000');
  if (w.dataLen !== 6720000 * 4) note('master: data bytes ' + w.dataLen + ' != ' + 6720000 * 4);
  if (w.fileBytes !== 44 + 6720000 * 4) note('master: file size ' + w.fileBytes);
  if (w.riffBytes + 8 !== w.fileBytes) note('master: RIFF size mismatch');
  if (Math.max(stL.peak, stR.peak) > 0.36) note('master: peak above the -9 dBFS target (' + linToDb(Math.max(stL.peak, stR.peak)).toFixed(2) + ')');
  if (Math.max(stL.peak, stR.peak) < 0.34) note('master: peak below the -9 dBFS target');
  if (stM.rms < 1e-6) note('master is silent');
}

/* ------------------------------- part (c): spectral character --------- */

/** In-place iterative radix-2 FFT. */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      let t = re[i]; re[i] = re[j]; re[j] = t;
      t = im[i]; im[i] = im[j]; im[j] = t;
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + len / 2] * cr - im[i + k + len / 2] * ci;
        const vi = re[i + k + len / 2] * ci + im[i + k + len / 2] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + len / 2] = ur - vr; im[i + k + len / 2] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

/** Average magnitude spectrum over the loudest windows + centroid/band split. */
function spectrumProfile(a, sr, N = 1024) {
  const nb = Math.floor(a.length / N);
  const spec = new Float64Array(N / 2);
  const wins = Math.max(1, Math.min(40, nb));
  const stride = Math.max(1, Math.floor(nb / wins));
  const re = new Float64Array(N), im = new Float64Array(N);
  let used = 0;
  for (let b = 0; b < nb; b += stride) {
    let s = 0;
    for (let i = 0; i < N; i++) { const v = a[b * N + i]; s += v * v; }
    if (s < 1e-9) continue;
    for (let i = 0; i < N; i++) {
      re[i] = a[b * N + i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)));
      im[i] = 0;
    }
    fft(re, im);
    for (let k = 0; k < N / 2; k++) spec[k] += Math.hypot(re[k], im[k]);
    used++;
  }
  if (!used) return null;
  for (let k = 0; k < N / 2; k++) spec[k] /= used;
  const binHz = sr / N;
  let num = 0, den = 0;
  for (let k = 1; k < N / 2; k++) { num += k * binHz * spec[k]; den += spec[k]; }
  // band shares are power-based: the honest energy distribution across bands
  // (a magnitude sum would over-weight the very wide HF bands)
  let pden = 0;
  for (let k = 1; k < N / 2; k++) pden += spec[k] * spec[k];
  const band = (lo, hi) => {
    let s = 0;
    for (let k = 1; k < N / 2; k++) {
      const f = k * binHz;
      if (f >= lo && f < hi) s += spec[k] * spec[k];
    }
    return pden > 0 ? s / pden : 0;
  };
  return {
    centroid: den > 0 ? num / den : 0,
    b0: band(0, 250),
    b1: band(250, 2000),
    b2: band(2000, 8000),
    b3: band(8000, 24000),
  };
}

console.log('\n=== (c) spectral character of the library ==============================');
console.log('file'.padEnd(20) + 'centroid'.padStart(10) + '  <250'.padStart(8) + '250-2k'.padStart(8) +
  '2k-8k'.padStart(8) + '>8k'.padStart(8) + '   expected palette (energy %)');
console.log('-'.repeat(90));

const EXPECT_CHAR = {
  'air-room.wav': ['dark room air', (p) => p.centroid < 600 && p.b1 + p.b0 > 0.6],
  'low-hum.wav': ['low machinery', (p) => p.centroid < 300 && p.b0 > 0.5],
  'glass-break.wav': ['bright shatter', (p) => p.centroid > 1500],
  'glass-tinkle.wav': ['high glass grains', (p) => p.centroid > 2000],
  'coin-tick.wav': ['small metal, short', (p) => p.centroid > 1500],
  'coin-ring.wav': ['mid metal ring', (p) => p.centroid > 300 && p.centroid < 3000],
  'coin-land.wav': ['metal taps', (p) => p.centroid > 800],
  'low-boom.wav': ['sub accent', (p) => p.centroid < 250 && p.b0 > 0.6],
  'paper-turn.wav': ['mid paper', (p) => p.centroid > 300 && p.centroid < 6000],
  'paper-open.wav': ['mid paper', (p) => p.centroid > 300 && p.centroid < 6000],
  'metal-etch.wav': ['thin high metal', (p) => p.centroid > 2500],
  'ash-whoosh.wav': ['band-swept dust', (p) => p.centroid > 200 && p.centroid < 6000],
  'ink-tap.wav': ['tiny click', (p) => p.centroid > 300],
  'line-flow.wav': ['narrow rising band', (p) => p.centroid > 800 && p.centroid < 6000],
  'gear-whirr.wav': ['small mechanism', (p) => p.centroid > 500 && p.centroid < 6000],
  'clock-tick.wav': ['dry tick', (p) => p.centroid > 500],
  'sand-flow.wav': ['granular highs', (p) => p.centroid > 1000],
  'chain-creak.wav': ['low friction', (p) => p.b0 + p.b1 > 0.8 && p.b3 < 0.05],
  'balance-settle.wav': ['soft metal', (p) => p.centroid > 500],
  'low-breath.wav': ['very low swell', (p) => p.b0 > 0.8],
  'time-wheel.wav': ['ratchet clicks', (p) => p.centroid > 1500],
  'ticket-tear.wav': ['grainy HF burst', (p) => p.centroid > 1000],
  'theatre-creak.wav': ['very low creak', (p) => p.centroid < 800],
  'crowd-murmur.wav': ['smeared 200-1800 Hz', (p) => p.centroid > 150 && p.centroid < 1800 && p.b3 < 0.08],
  // a wax seal is dominated by the low thump, but the squish must be audible
  'seal-stamp.wav': ['low thump + audible squish', (p) => p.b0 > 0.6 && p.b1 > 0.03 && p.b1 < 0.35],
  'lock-drop.wav': ['solid metal clank', (p) => p.centroid > 300],
};

for (const [name] of EXPECTED) {
  const file = path.join(SFX_DIR, name);
  if (!fs.existsSync(file)) continue;
  const w = readWav(file);
  const p = spectrumProfile(w.chans[0], w.fmt.sampleRate);
  if (!p) { note(name + ': no spectral content'); continue; }
  const [label, test] = EXPECT_CHAR[name] || ['-', () => true];
  const ok = test(p);
  console.log(
    name.padEnd(20) +
      (p.centroid.toFixed(0) + ' Hz').padStart(10) +
      (p.b0 * 100).toFixed(0).padStart(7) + '%' +
      (p.b1 * 100).toFixed(0).padStart(7) + '%' +
      (p.b2 * 100).toFixed(0).padStart(7) + '%' +
      (p.b3 * 100).toFixed(0).padStart(7) + '%' +
      '   ' + label + (ok ? '' : '   <-- OUT OF CHARACTER')
  );
  if (!ok) note(name + ': spectral character off (' + label + ', centroid ' + p.centroid.toFixed(0) + ' Hz)');
}

/* --------------------------- master timeline profile ------------------- */

if (fs.existsSync(MASTER)) {
  console.log('\n=== (d) master timeline profile (peak per 10 s block) =================');
  const w = readWav(MASTER);
  const blk = w.fmt.sampleRate * 10;
  let line = '';
  let silentRun = 0, maxSilentRun = 0, gaps = 0;
  for (let b = 0; b * blk < w.frames; b++) {
    let pk = 0;
    const end = Math.min(w.frames, (b + 1) * blk);
    for (let i = b * blk; i < end; i++) {
      const v = Math.max(Math.abs(w.chans[0][i]), Math.abs(w.chans[1][i]));
      if (v > pk) pk = v;
    }
    const d = linToDb(pk);
    line += String(b).padStart(3) + ':' + d.toFixed(1).padStart(6) + '  ';
    if (d < -70) { silentRun++; gaps++; maxSilentRun = Math.max(maxSilentRun, silentRun); }
    else silentRun = 0;
    if (b % 5 === 4) { console.log('  ' + line.trimEnd()); line = ''; }
  }
  if (line.trim()) console.log('  ' + line.trimEnd());
  console.log('  fully silent 10 s blocks: ' + gaps + ' (no event gap longer than 10 s expected)');
  if (maxSilentRun > 0) note('master has ' + maxSilentRun + ' consecutive silent 10 s block(s)');
}

/* ------------------------------------------------------------- verdict */

console.log('\n=== verdict ===========================================================');
if (problems.length === 0) {
  console.log('ALL CHECKS PASSED  (' + EXPECTED.length + ' library files + master)');
  process.exit(0);
}
console.log(problems.length + ' PROBLEM(S):');
for (const p of problems) console.log('  - ' + p);
process.exit(1);
