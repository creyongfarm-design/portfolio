/* 레이싱 소리: 엔진(기어 따라 오르내림) · 타이어 · 바람 · 니트로 · 부딪힘 · 신호음 · 배경 음악 (전부 그 자리에서 합성, 파일 없음) */
export function makeAudio(on){
  const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return {update(){}, sfx(){}, music(){}, set(){}, close(){}, resume(){}};
  const c = new AC(), out = c.createGain(); out.gain.value = on ? 0.85 : 0; const comp = c.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 5; out.connect(comp).connect(c.destination);
  const G = (v, to = out) => { const g = c.createGain(); g.gain.value = v; g.connect(to); return g; };
  /* 엔진 */
  const eg = G(0), lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 900; lp.Q.value = 2.5; lp.connect(eg);
  const sh = c.createWaveShaper(); { const n = 256, cv = new Float32Array(n); for(let k = 0; k < n; k++){ const x = k / (n - 1) * 2 - 1; cv[k] = Math.tanh(x * 2.6); } sh.curve = cv; } sh.connect(lp);
  const osc = [["sawtooth", 1, 0.5], ["sawtooth", 1.505, 0.22], ["square", 0.5, 0.42], ["sawtooth", 2.01, 0.12]].map(([type, mul, vol]) => { const o = c.createOscillator(); o.type = type; o.frequency.value = 60 * mul; const g = c.createGain(); g.gain.value = vol; o.connect(g).connect(sh); o.start(); return [o, mul]; });
  /* 잡음 하나로 바람 · 타이어 · 니트로 */
  const nb = c.createBuffer(1, c.sampleRate * 2, c.sampleRate); { const d = nb.getChannelData(0); for(let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1; }
  const noise = c.createBufferSource(); noise.buffer = nb; noise.loop = true; noise.start();
  const band = (type, f, q, g) => { const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; const gg = G(0); noise.connect(b).connect(gg); return [gg, b]; };
  const [wind, windF] = band("lowpass", 500, 0.4), [sq, sqF] = band("bandpass", 1650, 9), [sq2] = band("bandpass", 2300, 12), [nit, nitF] = band("bandpass", 900, 0.7);
  const T = () => c.currentTime;
  const tone = (f, t, d, o = {}) => { const os = c.createOscillator(), g = c.createGain(); os.type = o.type || "sine"; os.frequency.setValueAtTime(f, t); if(o.to) os.frequency.exponentialRampToValueAtTime(o.to, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(o.vol || 0.3, t + (o.att || 0.008)); g.gain.exponentialRampToValueAtTime(0.0001, t + d); os.connect(g).connect(o.dst || out); os.start(t); os.stop(t + d + 0.03); };
  const burst = (t, d, f, q, vol, type = "bandpass", dst = out) => { const s = c.createBufferSource(); s.buffer = nb; s.loop = true; const b = c.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; const g = c.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d); s.connect(b).connect(g).connect(dst); s.start(t, Math.random()); s.stop(t + d + 0.03); };
  /* 음악: 124 BPM 신스 (Am F C G) */
  const mg = G(0.0), MU = {on:false, step:0, next:0, iv:0};
  const CH = [[45, 57, 60, 64], [41, 57, 60, 65], [36, 55, 60, 64], [43, 55, 59, 62]], mt = m => 440 * Math.pow(2, (m - 69) / 12);
  function sched(){
    const spb = 60 / 124 / 4; while(MU.next < T() + 0.14){ const s = MU.step % 64, bar = (s / 16 | 0) % 4, q = s % 16, t = MU.next, ch = CH[bar];
      if(q % 4 === 0) tone(150, t, 0.2, {to:42, vol:0.9, dst:mg});
      if(q % 4 === 2) burst(t, 0.045, 7500, 1, 0.22, "highpass", mg); if(q === 4 || q === 12) burst(t, 0.16, 1800, 0.8, 0.5, "bandpass", mg);
      if(q % 2 === 0 && q % 4 !== 0 || q % 4 === 3) tone(mt(ch[0]) / 2, t, 0.16, {type:"sawtooth", vol:0.32, dst:mg});
      const ar = [1, 2, 3, 2, 1, 3, 2, 3][q % 8]; if(MU.step >= 32 || q % 2 === 0) tone(mt(ch[ar] + 12), t, 0.12, {type:"square", vol:0.055, dst:mg});
      if(q === 0 && MU.step % 128 >= 64) tone(mt(ch[3] + 12), t, 1.6, {type:"triangle", vol:0.12, att:0.2, dst:mg});
      MU.step++; MU.next += spb; } }
  let closed = false;
  return {
    ctx:c,
    resume(){ if(c.state === "suspended") c.resume().catch(() => {}); },
    set(v){ on = v; out.gain.setTargetAtTime(v ? 0.85 : 0, T(), 0.05); },
    update(s){   // {rpm 0~1, gas 0~1, speed m/s, slip 0~1, nitro bool, live bool}
      if(closed) return; const t = T(), f = 46 + s.rpm * 168;
      for(const [o, mul] of osc) o.frequency.setTargetAtTime(f * mul, t, 0.03);
      lp.frequency.setTargetAtTime(380 + s.rpm * 2400 * (0.45 + 0.55 * s.gas), t, 0.05); eg.gain.setTargetAtTime(s.live ? 0.1 + 0.13 * s.gas + 0.05 * s.rpm : 0, t, 0.06);
      wind.gain.setTargetAtTime(s.live ? Math.min(0.5, s.speed / 80 * 0.42) : 0, t, 0.1); windF.frequency.setTargetAtTime(300 + s.speed * 16, t, 0.1);
      sq.gain.setTargetAtTime(s.live ? s.slip * 0.5 : 0, t, 0.04); sq2.gain.setTargetAtTime(s.live ? s.slip * 0.24 : 0, t, 0.04); sqF.frequency.setTargetAtTime(1500 + s.slip * 320 + Math.sin(t * 31) * 60, t, 0.03);
      nit.gain.setTargetAtTime(s.live && s.nitro ? 0.6 : 0, t, 0.06); nitF.frequency.setTargetAtTime(s.nitro ? 1500 : 700, t, 0.25);
    },
    sfx(k, a = 1){ if(closed || !on) return; const t = T() + 0.005;
      if(k === "beep") tone(440, t, 0.22, {type:"square", vol:0.22}); else if(k === "go"){ tone(880, t, 0.7, {type:"square", vol:0.25}); tone(1320, t, 0.7, {type:"triangle", vol:0.12}); }
      else if(k === "crash"){ burst(t, 0.3 + a * 0.2, 420, 0.6, 0.9 * a, "lowpass"); tone(90, t, 0.25, {to:40, vol:0.8 * a}); burst(t, 0.12, 3200, 2, 0.4 * a); }
      else if(k === "rub"){ burst(t, 0.16, 2600, 3, 0.4 * a); tone(120, t, 0.1, {to:70, vol:0.35}); }
      else if(k === "near"){ burst(t, 0.42, 900, 1.2, 0.5); tone(700, t, 0.3, {to:260, type:"sine", vol:0.12}); }
      else if(k === "shift"){ burst(t, 0.07, 2000, 1, 0.14); }
      else if(k === "boost"){ tone(220, t, 0.5, {to:880, type:"sawtooth", vol:0.16}); burst(t, 0.5, 1400, 0.8, 0.4); }
      else if(k === "nitro"){ burst(t, 0.6, 1100, 0.7, 0.6); tone(160, t, 0.6, {to:640, type:"sawtooth", vol:0.14}); }
      else if(k === "lap"){ [660, 880, 1100].forEach((f, q) => tone(f, t + q * 0.09, 0.22, {type:"triangle", vol:0.2})); }
      else if(k === "win"){ [523, 659, 784, 1047, 1319].forEach((f, q) => tone(f, t + q * 0.13, 0.5, {type:"triangle", vol:0.24})); }
      else if(k === "lose"){ [440, 392, 330].forEach((f, q) => tone(f, t + q * 0.18, 0.4, {type:"triangle", vol:0.2})); }
    },
    music(v){ if(closed) return; if(v && !MU.on){ MU.on = true; MU.step = 0; MU.next = T() + 0.08; mg.gain.setTargetAtTime(0.34, T(), 0.4); MU.iv = setInterval(sched, 50); sched(); } else if(!v && MU.on){ MU.on = false; clearInterval(MU.iv); mg.gain.setTargetAtTime(0, T(), 0.3); } },
    duck(v){ mg.gain.setTargetAtTime(v ? 0.14 : 0.34, T(), 0.2); },
    close(){ closed = true; clearInterval(MU.iv); try { c.close(); } catch(_){} }
  };
}
