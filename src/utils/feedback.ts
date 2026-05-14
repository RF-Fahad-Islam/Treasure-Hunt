let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function noise(duration = 0.04, gain = 0.08) {
  const c = getCtx();
  const buf = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * gain;
  const src = c.createBufferSource();
  src.buffer = buf;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  src.connect(g).connect(c.destination);
  src.start();
  src.stop(c.currentTime + duration);
}

function beep(freq = 600, duration = 0.06, gain = 0.06) {
  const c = getCtx();
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
  osc.connect(g).connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + duration);
}

let lastVibrate = 0;
function vibrate(ms = 8) {
  if (typeof navigator.vibrate !== "function") return;
  const now = Date.now();
  if (now - lastVibrate < 40) return;
  lastVibrate = now;
  navigator.vibrate(ms);
}

export function lightClick() {
  noise(0.025, 0.06);
  vibrate(6);
}

export function heavyClick() {
  noise(0.05, 0.12);
  vibrate(12);
}

export function confirmSound() {
  beep(880, 0.08, 0.07);
  setTimeout(() => beep(1100, 0.1, 0.06), 80);
  vibrate(10);
}

export function errorSound() {
  beep(300, 0.12, 0.08);
  setTimeout(() => beep(220, 0.15, 0.07), 100);
  vibrate(20);
}

export function successSound() {
  beep(660, 0.07, 0.07);
  setTimeout(() => beep(880, 0.07, 0.07), 70);
  setTimeout(() => beep(1100, 0.12, 0.06), 140);
  vibrate(10);
}
