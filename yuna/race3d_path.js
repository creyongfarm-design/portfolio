/* 레이싱 코스 길 계산 (2026-11-28 감독님 "이 안에서 레이싱게임도. 진짜 레이싱게임처럼. 니드포스피드처럼")
   - 밤 도시 서킷 한 바퀴. 가운데 선을 2m 간격 점으로 뽑아 둠 (위치·방향·굽은 정도·높이)
   - three 없이 숫자만 다룸 → 차·배경·미니맵이 다 이 표를 씀 */

export const HALF_W = 8.5;          // 도로 반폭 (4차로)
export const LANES = [-5.6, -1.9, 1.9, 5.6];

/* 코스 목록 (2026-11-29 감독님 "맵도 좀 더 필요해"). 위에서 본 모양 (x 오른쪽, z 아래), 출발 직선은 +x 쪽으로.
   zone = 터널·다리 구간 (한 바퀴를 0~1로): 배경이 이걸 보고 세움. hills = [가운데, 반폭, 높이] 완만한 언덕 */
export const TRACKS = {
  city:{name:"도심 서킷", sub:"터널 · 강 다리 · 헤어핀",   // 출발 직선 → 큰 우회전 → 터널 → S자 → 강 다리 → 헤어핀 → 연속 코너 → 출발선
    ctrl:[[-150, 0], [80, 0], [290, 0], [420, 42], [470, 150], [462, 285], [400, 392], [292, 436], [200, 398], [108, 440], [-10, 500], [-200, 506], [-390, 484], [-486, 402], [-468, 300], [-380, 262], [-296, 200], [-318, 112], [-286, 26]],
    zone:{tunnel:[0.262, 0.372], bridge:[0.535, 0.665]}, hills:[[0.60, 0.085, 7.5], [0.86, 0.05, 2.6], [0.14, 0.05, 1.8]]},
  river:{name:"강변 순환로", sub:"긴 직선 · 큰 다리 · 고속 코너",   // 긴 출발 직선 → 넓은 우회전 → 긴 강 다리 → 시케인 → 터널 → 언덕 고속 코너
    ctrl:[[-260, 0], [0, 0], [260, 0], [470, 10], [610, 90], [650, 240], [600, 390], [470, 470], [300, 480], [150, 440], [30, 500], [-110, 560], [-290, 560], [-450, 500], [-560, 380], [-590, 230], [-540, 100], [-430, 20]],
    zone:{tunnel:[0.70, 0.79], bridge:[0.335, 0.455]}, hills:[[0.395, 0.08, 6.5], [0.90, 0.05, 3.2], [0.58, 0.04, 2.0]]}};
const SCALE = 0.86;

function catmull(p0, p1, p2, p3, t){   // centripetal Catmull-Rom
  const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) || 1e-4;
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3), u = t1 + (t2 - t1) * t;
  const L = (a, b, ta, tb) => [(a[0] * (tb - u) + b[0] * (u - ta)) / (tb - ta), (a[1] * (tb - u) + b[1] * (u - ta)) / (tb - ta)];
  const A1 = L(p0, p1, t0, t1), A2 = L(p1, p2, t1, t2), A3 = L(p2, p3, t2, t3);
  const B1 = L(A1, A2, t0, t2), B2 = L(A2, A3, t1, t3);
  return L(B1, B2, t1, t2);
}

export function buildPath(ds = 2, track = "city"){
  const TR = TRACKS[track] || TRACKS.city, CTRL = TR.ctrl.map(p => [p[0] * SCALE, p[1] * SCALE]), HILLS = TR.hills;
  const n = CTRL.length, fine = [];
  for(let k = 0; k < n; k++){ const p0 = CTRL[(k + n - 1) % n], p1 = CTRL[k], p2 = CTRL[(k + 1) % n], p3 = CTRL[(k + 2) % n];
    for(let q = 0; q < 80; q++) fine.push(catmull(p0, p1, p2, p3, q / 80)); }
  const acc = [0]; for(let k = 1; k <= fine.length; k++){ const a = fine[k - 1], b = fine[k % fine.length]; acc.push(acc[k - 1] + Math.hypot(b[0] - a[0], b[1] - a[1])); }
  const total = acc[fine.length], N = Math.round(total / ds), step = total / N;
  const px = new Float32Array(N), pz = new Float32Array(N), py = new Float32Array(N), tx = new Float32Array(N), tz = new Float32Array(N), kv = new Float32Array(N), sl = new Float32Array(N);
  let f = 0;
  for(let k = 0; k < N; k++){ const s = k * step; while(acc[f + 1] < s) f++;
    const a = fine[f], b = fine[(f + 1) % fine.length], u = (s - acc[f]) / (acc[f + 1] - acc[f] || 1);
    px[k] = a[0] + (b[0] - a[0]) * u; pz[k] = a[1] + (b[1] - a[1]) * u; }
  for(let k = 0; k < N; k++){ const a = (k + N - 1) % N, b = (k + 1) % N; let x = px[b] - px[a], z = pz[b] - pz[a]; const l = Math.hypot(x, z) || 1; tx[k] = x / l; tz[k] = z / l; }
  const raw = new Float32Array(N);
  for(let k = 0; k < N; k++){ const a = (k + N - 1) % N, b = (k + 1) % N; raw[k] = (tx[a] * tz[b] - tz[a] * tx[b]) / (2 * step); }   // + 면 오른쪽(시계)으로 굽음
  for(let k = 0; k < N; k++){ let s = 0; for(let q = -4; q <= 4; q++) s += raw[(k + q + N) % N]; kv[k] = s / 9; }
  const bump = u => { let y = 0; for(const [c, w, h] of HILLS){ let d = Math.abs(u - c); d = Math.min(d, 1 - d); if(d < w) y += h * (0.5 + 0.5 * Math.cos(Math.PI * d / w)); } return y; };
  for(let k = 0; k < N; k++) py[k] = bump(k / N);
  for(let k = 0; k < N; k++) sl[k] = (py[(k + 1) % N] - py[(k + N - 1) % N]) / (2 * step);
  return {N, step, total, px, pz, py, tx, tz, kv, sl, zone:TR.zone, track:TRACKS[track] ? track : "city"};
}

/* 점 (x,z)가 코스 어디쯤인지: 지난번 칸(hint) 근처만 뒤짐. 돌려주는 것 {k 칸, u 칸 안 0~1, d 가운데서 오른쪽으로 몇 m} */
export function locate(P, x, z, hint, out){
  let best = hint, bd = 1e12; const N = P.N;
  for(let q = -14; q <= 26; q++){ const k = ((hint + q) % N + N) % N, dx = x - P.px[k], dz = z - P.pz[k], d = dx * dx + dz * dz; if(d < bd){ bd = d; best = k; } }
  const dx = x - P.px[best], dz = z - P.pz[best], along = dx * P.tx[best] + dz * P.tz[best];
  out.k = best; out.u = along / P.step; out.d = dx * -P.tz[best] + dz * P.tx[best];   // 오른쪽 법선 = (-tz, tx)
  return out;
}
export function locateFar(P, x, z){ let best = 0, bd = 1e12; for(let k = 0; k < P.N; k += 2){ const dx = x - P.px[k], dz = z - P.pz[k], d = dx * dx + dz * dz; if(d < bd){ bd = d; best = k; } } return best; }

/* 칸 번호(소수 가능)와 옆 거리 → 위치·방향 */
export function at(P, s, d, out){
  const N = P.N; let k = Math.floor(s); const u = s - k; k = (k % N + N) % N; const b = (k + 1) % N;
  const tx = P.tx[k] + (P.tx[b] - P.tx[k]) * u, tz = P.tz[k] + (P.tz[b] - P.tz[k]) * u;
  out.x = P.px[k] + (P.px[b] - P.px[k]) * u - tz * d; out.z = P.pz[k] + (P.pz[b] - P.pz[k]) * u + tx * d;
  out.y = P.py[k] + (P.py[b] - P.py[k]) * u; out.tx = tx; out.tz = tz; out.sl = P.sl[k] + (P.sl[b] - P.sl[k]) * u; out.kv = P.kv[k] + (P.kv[b] - P.kv[k]) * u;
  return out;
}
export const inZone = (P, k, z) => { const u = (((k % P.N) + P.N) % P.N) / P.N; return u >= z[0] && u <= z[1]; };
