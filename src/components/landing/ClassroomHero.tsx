import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as THREE from "three";
import ftWordmark from "@/assets/focustap-logo.png";
import ftLogo from "@/assets/focustap-icon.png";
import "./ClassroomHero.css";

/**
 * ClassroomHero — 1:1 port of reference/homepage-hero.html.
 *
 * The Three.js scene + scroll choreography is kept imperative inside a single
 * useEffect: refs/queries for the canvas + overlays, a rAF loop that drives all
 * overlay DOM directly (never React state), and full teardown on unmount. The
 * keyframe ranges in update(p) are the approved final timing and are unchanged.
 *
 * three is r152+ here, so the only render-layer change vs the reference is
 * outputEncoding/sRGBEncoding -> outputColorSpace/THREE.SRGBColorSpace.
 */
const ClassroomHero = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const q = (sel: string) => root.querySelector(sel) as HTMLElement;

    let disposed = false;

    // ── reference asset URIs, now Vite asset imports ──
    const FT_LOGO = ftLogo;
    const FT_WORDMARK = ftWordmark;

    // ── helpers (verbatim from reference) ──
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const range = (p, a, b) => clamp((p - a) / (b - a), 0, 1);
    const lerp = (a, b, t) => a + (b - a) * t;
    const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
    const TAU = Math.PI * 2;
    const SANS = '700 ZZpx "Plus Jakarta Sans", Helvetica, Arial, sans-serif';
    const SANS_REG = '500 ZZpx "Plus Jakarta Sans", Helvetica, Arial, sans-serif';
    const MONO = '600 ZZpx "IBM Plex Mono", ui-monospace, monospace';
    function font(spec, size) { return spec.replace("ZZ", size); }
    function rr(c, x, y, w, h, r) {
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    }
    function roundedShape(w, h, r) {
      const x = -w / 2, y = -h / 2, shape = new THREE.Shape();
      shape.moveTo(x + r, y);
      shape.lineTo(x + w - r, y);
      shape.quadraticCurveTo(x + w, y, x + w, y + r);
      shape.lineTo(x + w, y + h - r);
      shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      shape.lineTo(x + r, y + h);
      shape.quadraticCurveTo(x, y + h, x, y + h - r);
      shape.lineTo(x, y + r);
      shape.quadraticCurveTo(x, y, x + r, y);
      return shape;
    }

    const logoImg = new Image(); logoImg.src = FT_LOGO;
    const phoneRedraws = [];
    logoImg.addEventListener("load", function () { phoneRedraws.forEach(function (fn) { fn(); }); });
    const wordmarkImg = new Image(); wordmarkImg.src = FT_WORDMARK;
    wordmarkImg.addEventListener("load", function () { phoneRedraws.forEach(function (fn) { fn(); }); });

    function makeDashboard() {
      const c = document.createElement("canvas");
      c.width = 1920; c.height = 672;
      const x = c.getContext("2d");
      const W = c.width, H = c.height;
      x.textBaseline = "alphabetic"; x.textAlign = "left";
      x.fillStyle = "#f3f5fb"; x.fillRect(0, 0, W, H);
      x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, 104);
      x.strokeStyle = "rgba(17,24,39,0.09)"; x.lineWidth = 1.5; x.beginPath(); x.moveTo(0, 104); x.lineTo(W, 104); x.stroke();
      const bd = x.createLinearGradient(52, 38, 80, 66); bd.addColorStop(0, "#8b6cff"); bd.addColorStop(1, "#22d3ee");
      x.fillStyle = bd; rr(x, 52, 38, 28, 28, 9); x.fill();
      x.fillStyle = "#111827"; x.font = font(SANS, 38); x.fillText("Accounting 212", 96, 66);
      x.fillStyle = "#434d5c"; x.font = font(SANS_REG, 23); x.fillText("· Section 02 · 9:00 AM", 430, 66);
      x.textAlign = "right";
      x.fillStyle = "#475467"; x.font = font(MONO, 20); x.fillText("MIN 12 / 50", 1556, 66);
      x.fillStyle = "#0891b2"; x.font = font(MONO, 20); x.fillText("PROF VIEW", 1712, 66);
      x.textAlign = "left";
      x.fillStyle = "#16a34a"; x.beginPath(); x.arc(1772, 60, 8, 0, TAU); x.fill();
      x.font = font(SANS, 24); x.fillText("Live", 1790, 66);

      function card(cx, cy, cw, ch, r?) { r = r || 20; x.fillStyle = "#ffffff"; rr(x, cx, cy, cw, ch, r); x.fill(); x.strokeStyle = "rgba(17,24,39,0.08)"; x.lineWidth = 1.5; x.stroke(); }
      function klabel(t, cx, cy) { x.fillStyle = "#5b6677"; x.font = font(MONO, 18); x.fillText(t, cx, cy); }

      const top = 132, ch = 476;

      card(56, top, 420, ch);
      klabel("CLASS FOCUS INDEX", 92, top + 56);
      const grad = x.createLinearGradient(92, top + 80, 420, top + 230); grad.addColorStop(0, "#6a4cff"); grad.addColorStop(1, "#0a98c0");
      x.fillStyle = grad; x.font = font(SANS, 168); x.fillText("87", 88, top + 216);
      x.fillStyle = "#16a34a"; x.font = font(SANS, 25); x.fillText("▲ +6 pts vs last session", 92, top + 258);
      x.fillStyle = "#5b6677"; x.font = font(SANS_REG, 20); x.fillText("Term average  79", 92, top + 290);
      klabel("INDEX · LAST 8 SESSIONS", 92, top + 344);
      const spk = [68, 71, 70, 75, 79, 81, 84, 87], sx0 = 92, sx1 = 440, syb = top + 440, syt = top + 364;
      x.strokeStyle = "#6a4cff"; x.lineWidth = 3; x.lineJoin = "round"; x.beginPath();
      spk.forEach((v, i) => { const px = sx0 + i * ((sx1 - sx0) / (spk.length - 1)), py = syb - ((v - 60) / 40) * (syb - syt); if (i) x.lineTo(px, py); else x.moveTo(px, py); }); x.stroke();
      x.fillStyle = "#8b6cff"; spk.forEach((v, i) => { const px = sx0 + i * ((sx1 - sx0) / (spk.length - 1)), py = syb - ((v - 60) / 40) * (syb - syt); x.beginPath(); x.arc(px, py, 3.5, 0, TAU); x.fill(); });

      card(496, top, 724, ch);
      klabel("ENGAGEMENT · LAST 50 MIN", 532, top + 56);
      x.fillStyle = "#8b6cff"; rr(x, 1004, top + 44, 26, 10, 5); x.fill();
      x.fillStyle = "#434d5c"; x.font = font(SANS_REG, 18); x.fillText("Engaged %", 1038, top + 56);
      x.strokeStyle = "#5b6677"; x.lineWidth = 2; x.setLineDash([6, 6]); x.beginPath(); x.moveTo(1126, top + 51); x.lineTo(1152, top + 51); x.stroke(); x.setLineDash([]);
      x.fillStyle = "#434d5c"; x.fillText("Class avg", 1162, top + 56);
      const pX0 = 566, pX1 = 1184, pY0 = top + 96, pY1 = top + 396, yv = (v) => pY1 - (v / 100) * (pY1 - pY0);
      x.strokeStyle = "rgba(17,24,39,0.07)"; x.lineWidth = 1; x.fillStyle = "#7a8494"; x.font = font(MONO, 14); x.textAlign = "right";
      [0, 25, 50, 75, 100].forEach((v) => { const yy = yv(v); x.beginPath(); x.moveTo(pX0, yy); x.lineTo(pX1, yy); x.stroke(); x.fillText(v + "", pX0 - 12, yy + 5); });
      x.textAlign = "left";
      const eng = [55, 61, 58, 66, 72, 68, 77, 82, 79, 85, 84, 90], n = eng.length, slot = (pX1 - pX0) / n, bw = Math.min(40, slot - 12);
      eng.forEach((v, i) => { const bx = pX0 + i * slot + (slot - bw) / 2, by = yv(v), g = x.createLinearGradient(0, by, 0, pY1); g.addColorStop(0, "#7655ff"); g.addColorStop(1, "#b3a1f5"); x.fillStyle = g; rr(x, bx, by, bw, pY1 - by, 6); x.fill(); });
      x.strokeStyle = "#5b6677"; x.lineWidth = 2; x.setLineDash([7, 7]); x.beginPath(); x.moveTo(pX0, yv(71)); x.lineTo(pX1, yv(71)); x.stroke(); x.setLineDash([]);
      x.strokeStyle = "#4a2ddb"; x.lineWidth = 3; x.lineJoin = "round"; x.beginPath();
      eng.forEach((v, i) => { const cx2 = pX0 + i * slot + slot / 2, cy2 = yv(v); if (i) x.lineTo(cx2, cy2); else x.moveTo(cx2, cy2); }); x.stroke();
      const lx = pX0 + (n - 1) * slot + slot / 2, ly = yv(eng[n - 1]);
      x.fillStyle = "#22d3ee"; x.beginPath(); x.arc(lx, ly, 6, 0, TAU); x.fill(); x.strokeStyle = "#fff"; x.lineWidth = 2.5; x.stroke();
      x.fillStyle = "#0891b2"; x.font = font(MONO, 13); x.textAlign = "center"; x.fillText("NOW", lx, ly - 15);
      x.fillStyle = "#7a8494"; x.font = font(MONO, 14);
      [0, 10, 20, 30, 40, 50].forEach((m, i) => { const xx = pX0 + (i / 5) * (pX1 - pX0); x.fillText(i === 5 ? m + " min" : m + "", xx, pY1 + 28); });
      x.textAlign = "left";

      card(1240, top, 300, ch);
      [["28/30", "Present", "▲ 2 vs avg"], ["84%", "Avg engaged", "▲ 6%"], ["12", "Distractions", "▼ 4 fewer"]].forEach((sd, i) => {
        const yy = top + 118 + i * 104;
        x.fillStyle = "#111827"; x.font = font(SANS, 46); x.fillText(sd[0], 1276, yy);
        x.fillStyle = "#434d5c"; x.font = font(SANS_REG, 20); x.fillText(sd[1], 1278, yy + 30);
        x.fillStyle = "#16a34a"; x.font = font(SANS, 17); x.fillText(sd[2], 1428, yy - 4);
      });
      x.strokeStyle = "rgba(17,24,39,0.08)"; x.lineWidth = 1; x.beginPath(); x.moveTo(1276, top + 402); x.lineTo(1504, top + 402); x.stroke();
      [["On time", "93%"], ["Phones away", "96%"]].forEach((sd, i) => {
        const yy = top + 436 + i * 32;
        x.fillStyle = "#434d5c"; x.font = font(SANS_REG, 18); x.fillText(sd[0], 1276, yy);
        x.textAlign = "right"; x.fillStyle = "#111827"; x.font = font(SANS, 19); x.fillText(sd[1], 1504, yy); x.textAlign = "left";
      });

      card(1556, top, 308, ch);
      klabel("TOP FOCUS", 1592, top + 56);
      const vbx = 1706, vby = top + 36, vbw = 124, vbh = 34;
      const vbg = x.createLinearGradient(vbx, vby, vbx + vbw, vby + vbh); vbg.addColorStop(0, "#8b6cff"); vbg.addColorStop(1, "#22d3ee");
      x.fillStyle = vbg; rr(x, vbx, vby, vbw, vbh, 17); x.fill();
      x.fillStyle = "#ffffff"; x.font = font(SANS, 15); x.textAlign = "center"; x.fillText("Click to view ›", vbx + vbw / 2, vby + 22); x.textAlign = "left";
      [["Aisha M.", 94], ["Jordan T.", 88], ["Riley P.", 71], ["Devin K.", 63]].forEach((sd: any, i) => {
        const yy = top + 98 + i * 56;
        x.fillStyle = "#111827"; x.font = font(SANS_REG, 22); x.fillText(sd[0], 1592, yy);
        x.textAlign = "right"; x.fillStyle = "#475467"; x.font = font(SANS, 20); x.fillText(sd[1] + "", 1832, yy); x.textAlign = "left";
        x.fillStyle = "rgba(17,24,39,0.07)"; rr(x, 1592, yy + 11, 240, 9, 5); x.fill();
        const g = x.createLinearGradient(1592, 0, 1832, 0); g.addColorStop(0, "#8b6cff"); g.addColorStop(1, "#22d3ee");
        x.fillStyle = g; rr(x, 1592, yy + 11, 240 * sd[1] / 100, 9, 5); x.fill();
      });
      klabel("NEEDS A NUDGE", 1592, top + 364);
      [["Ethan W.", 44], ["Zoe C.", 48]].forEach((sd: any, i) => {
        const yy = top + 400 + i * 38;
        x.fillStyle = "#b91c1c"; x.beginPath(); x.arc(1599, yy - 6, 5, 0, TAU); x.fill();
        x.fillStyle = "#344054"; x.font = font(SANS_REG, 21); x.fillText(sd[0], 1616, yy);
        x.textAlign = "right"; x.fillStyle = "#434d5c"; x.font = font(SANS, 19); x.fillText(sd[1] + "", 1832, yy); x.textAlign = "left";
      });

      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      return tex;
    }

    function makeTagTexture() {
      const c = document.createElement("canvas");
      c.width = 640; c.height = 640;
      const x = c.getContext("2d");
      const C = 320;
      x.clearRect(0, 0, c.width, c.height);
      const shadow = x.createRadialGradient(C, C, 180, C, C, 318);
      shadow.addColorStop(0, "rgba(0,0,0,0)");
      shadow.addColorStop(0.82, "rgba(0,0,0,0)");
      shadow.addColorStop(1, "rgba(0,0,0,.22)");
      x.fillStyle = shadow; x.beginPath(); x.arc(C, C, 312, 0, TAU); x.fill();
      const g = x.createRadialGradient(C, 230, 20, C, 250, 360);
      g.addColorStop(0, "#fffdf8"); g.addColorStop(0.64, "#f6f1e6"); g.addColorStop(1, "#e2d8c8");
      x.fillStyle = g; x.beginPath(); x.arc(C, C, 286, 0, TAU); x.fill();
      x.strokeStyle = "rgba(80,67,45,.32)"; x.lineWidth = 5; x.stroke();
      x.strokeStyle = "rgba(30,58,95,.14)"; x.lineWidth = 3; x.beginPath(); x.arc(C, C, 260, 0, TAU); x.stroke();

      x.save(); x.translate(C, 210); x.strokeStyle = "#1e3a5f"; x.fillStyle = "#1e3a5f";
      x.lineWidth = 9; x.beginPath(); x.arc(0, 0, 56, 0, TAU); x.stroke();
      x.beginPath(); x.arc(0, 0, 36, Math.PI, 0); x.stroke();
      x.beginPath(); x.arc(0, 0, 15, 0, TAU); x.fill();
      x.beginPath(); x.moveTo(-74, -38); x.lineTo(0, -66); x.lineTo(74, -38); x.lineTo(0, -10); x.closePath(); x.fill();
      x.lineWidth = 7; x.beginPath(); x.moveTo(74, -38); x.lineTo(74, -4); x.stroke();
      x.beginPath(); x.arc(74, 2, 7, 0, TAU); x.fill();
      x.restore();

      x.fillStyle = "#1e3a5f"; x.textAlign = "center";
      x.font = font(SANS, 56); x.fillText("Tap to focus", C, 390);
      x.font = font(MONO, 30); x.fillText("DESK A1", C, 446);
      x.strokeStyle = "rgba(30,58,95,.45)"; x.lineWidth = 7; x.lineCap = "round";
      [[35, 0], [24, 22], [12, 42]].forEach(([r, dy]) => {
        x.beginPath(); x.arc(C, 526 + dy, r, Math.PI * 1.20, Math.PI * 1.80); x.stroke();
      });
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      return tex;
    }

    function drawPhotoCrop(ctx, img, crop, w, h) {
      ctx.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, w, h);
    }

    function makePhoneScreenTexture(mode) {
      const c = document.createElement("canvas");
      c.width = 700; c.height = 1490;
      const x = c.getContext("2d");
      const W = c.width, H = c.height;
      function paint() {
        x.clearRect(0, 0, W, H);
        x.save(); rr(x, 0, 0, W, H, 128); x.clip();
        x.fillStyle = "#ffffff"; x.fillRect(0, 0, W, H);
        x.fillStyle = "#111827"; x.textBaseline = "alphabetic"; x.textAlign = "left"; x.font = font(SANS, 30); x.fillText("8:59", 54, 72);
        x.save(); x.globalAlpha = 0.92; x.strokeStyle = "#111827"; x.lineWidth = 3; rr(x, 596, 54, 40, 20, 6); x.stroke();
        x.fillStyle = "#111827"; rr(x, 600, 58, 27, 12, 3); x.fill(); x.fillRect(639, 60, 5, 8); x.restore();
        if (logoImg.complete && logoImg.naturalWidth) { x.drawImage(logoImg, 60, 166, 64, 64); }
        else { x.fillStyle = "#8b6cff"; rr(x, 68, 182, 34, 34, 10); x.fill(); }
        x.fillStyle = "#111827"; x.textAlign = "left"; x.font = font(SANS, 46); x.fillText("FocusTap", 138, 216);
        x.textAlign = "center";
        if (mode === "checked") {
          const g = x.createLinearGradient(280, 560, 420, 720); g.addColorStop(0, "#8b6cff"); g.addColorStop(1, "#22d3ee");
          x.fillStyle = g; x.beginPath(); x.arc(350, 632, 84, 0, TAU); x.fill();
          x.strokeStyle = "#fff"; x.lineWidth = 16; x.lineCap = "round"; x.lineJoin = "round"; x.beginPath(); x.moveTo(312, 634); x.lineTo(344, 666); x.lineTo(394, 600); x.stroke();
          x.fillStyle = "#111827"; x.font = font(SANS, 48); x.fillText("Checked in", 350, 792);
          x.fillStyle = "#1e3a5f"; x.font = font(SANS, 30); x.fillText("Desk A1 · Section 02", 350, 840);
          x.fillStyle = "#98a2b3"; x.font = font(SANS_REG, 26); x.fillText("8:59 AM", 350, 882);
        } else {
          x.fillStyle = "#9aa3b2"; x.font = font(MONO, 26); x.fillText("R E A D Y", 350, 632);
          x.fillStyle = "#5b6472"; x.font = font(SANS_REG, 46);
          x.fillText("Hold near the desk tag", 350, 726);
          x.fillText("to check in", 350, 784);
        }
        x.restore(); x.textAlign = "left";
      }
      paint();
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      phoneRedraws.push(function () { paint(); tex.needsUpdate = true; });
      return tex;
    }

    function makePhoneBackTexture() {
      const c = document.createElement("canvas");
      c.width = 700; c.height = 1490;
      const x = c.getContext("2d");
      const W = c.width, H = c.height;
      function paint(img?) {
        x.save(); x.clearRect(0, 0, W, H); rr(x, 0, 0, W, H, 96); x.clip();
        if (img) {
          drawPhotoCrop(x, img, { x: 705, y: 720, w: 1800, h: 3830 }, W, H);
        } else {
          const body = x.createLinearGradient(0, 0, W, H);
          body.addColorStop(0, "#b3c6e0"); body.addColorStop(0.5, "#93abca"); body.addColorStop(1, "#8198b7");
          x.fillStyle = body; x.fillRect(0, 0, W, H);
          x.strokeStyle = "rgba(255,255,255,.32)"; x.lineWidth = 12; rr(x, 18, 18, W - 36, H - 36, 82); x.stroke();
          x.strokeStyle = "rgba(255,255,255,.10)"; x.lineWidth = 30; rr(x, 46, 46, W - 92, H - 92, 66); x.stroke();
          const sh = x.createLinearGradient(0, 0, W, H * 0.5); sh.addColorStop(0, "rgba(255,255,255,.18)"); sh.addColorStop(0.4, "rgba(255,255,255,0)");
          x.fillStyle = sh; x.fillRect(0, 0, W, H);
        }
        x.restore();
      }
      paint();
      const tex = new THREE.CanvasTexture(c);
      tex.anisotropy = 8;
      const img = new Image();
      img.onload = () => { paint(img); tex.needsUpdate = true; };
      img.src = "assets/phone-back.jpeg";
      return tex;
    }

    const container = q("#stage");
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.setClearColor(0x040406, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x040406, 14, 60);
    const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 200);

    const ambient = new THREE.AmbientLight(0x8a90a8, 0.5); scene.add(ambient);
    const key = new THREE.DirectionalLight(0xc7c9df, 0.62);
    key.position.set(7, 16, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); scene.add(key);
    const screenLight = new THREE.PointLight(0xd2dbff, 1.5, 46, 2); screenLight.position.set(0, 6.5, -25); scene.add(screenLight);
    const purpleLight = new THREE.PointLight(0x8b6cff, 0.4, 34); purpleLight.position.set(-7, 4, -16); scene.add(purpleLight);
    const cyanLight = new THREE.PointLight(0x22d3ee, 0.36, 34); cyanLight.position.set(7, 4, -16); scene.add(cyanLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x0e0f15, roughness: 0.9, metalness: 0.06 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    function makeScreenIdle() {
      const c = document.createElement("canvas"); c.width = 1920; c.height = 672;
      const x = c.getContext("2d");
      function paint() {
        const g = x.createLinearGradient(0, 0, 0, 672); g.addColorStop(0, "#ffffff"); g.addColorStop(1, "#e9edf4");
        x.fillStyle = g; x.fillRect(0, 0, 1920, 672);
        if (wordmarkImg.complete && wordmarkImg.naturalWidth) {
          const dw = 1060, dh = dw * wordmarkImg.naturalHeight / wordmarkImg.naturalWidth;
          x.drawImage(wordmarkImg, (1920 - dw) / 2, (672 - dh) / 2 - 22, dw, dh);
        }
        x.textAlign = "center"; x.textBaseline = "alphabetic"; x.fillStyle = "#9aa4ba"; x.font = font(MONO, 34); x.fillText("WAITING FOR CHECK-IN", 960, 558);
      }
      paint();
      const tex = new THREE.CanvasTexture(c); tex.anisotropy = 8;
      phoneRedraws.push(function () { paint(); tex.needsUpdate = true; });
      return tex;
    }
    const dashTex = makeDashboard(); dashTex.anisotropy = 8;
    const screenIdleTex = makeScreenIdle(); screenIdleTex.anisotropy = 8;
    const SCR_W = 26, SCR_H = 9.1;
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(SCR_W + 0.78, SCR_H + 0.78, 0.48), new THREE.MeshStandardMaterial({ color: 0x09090d, roughness: 0.48, metalness: 0.18 }));
    bezel.position.set(0, 6.8, -30.28); bezel.castShadow = true; scene.add(bezel);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCR_W, SCR_H), new THREE.MeshBasicMaterial({ map: screenIdleTex, fog: false }));
    screen.position.set(0, 6.8, -30); scene.add(screen);
    const stagePlatform = new THREE.Mesh(new THREE.BoxGeometry(35, 1.2, 6.6), new THREE.MeshStandardMaterial({ color: 0x111116, roughness: 0.82, metalness: 0.08 }));
    stagePlatform.position.set(0, 0.6, -27); stagePlatform.receiveShadow = true; scene.add(stagePlatform);

    const trussMat = new THREE.MeshStandardMaterial({ color: 0x171821, roughness: 0.68, metalness: 0.35 });
    for (let i = 0; i < 2; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(41, 0.28, 0.28), trussMat);
      b.position.set(0, 13.5, -22 - i * 3); scene.add(b);
    }
    for (let i = -5; i <= 5; i++) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.24, 3.4), trussMat);
      b.position.set(i * 3.8, 13.5, -23.5); b.rotation.y = i % 2 ? 0.32 : -0.32; scene.add(b);
    }

    const deskTopMat = new THREE.MeshStandardMaterial({ color: 0x262b39, roughness: 0.52, metalness: 0.08 });
    const farDeskMat = new THREE.MeshStandardMaterial({ color: 0x2d3341, roughness: 0.6, metalness: 0.12 });
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1a1d26, roughness: 0.72 });
    const paperMat = new THREE.MeshStandardMaterial({ color: 0xe9e9ee, roughness: 0.88, emissive: 0x202024 });
    const tagTex = makeTagTexture();
    const phoneReadyTex = makePhoneScreenTexture("ready");
    const phoneCheckedTex = makePhoneScreenTexture("checked");
    const phoneBackTex = makePhoneBackTexture();
    const chairMat = new THREE.MeshStandardMaterial({ color: 0x232734, roughness: 0.62, metalness: 0.12 });
    const chairEdgeMat = new THREE.MeshStandardMaterial({ color: 0x171a22, roughness: 0.55, metalness: 0.22 });
    const PHONE_MODEL = { w: 0.34, h: 0.71, d: 0.038 };
    const DESK_TOP_Y = 1.5, ROWS = 6, COLS = 7, ROW_Z0 = -22, ROW_DZ = 3.3, COL_X = 2.9;
    let heroDesk = null;

    function addShadowFlags(obj) {
      obj.traverse((child) => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
      });
    }
    function makePhone() {
      const phone = new THREE.Group();
      const PHONE_W = PHONE_MODEL.w, PHONE_H = PHONE_MODEL.h, PHONE_D = PHONE_MODEL.d;
      const RAD = 0.07;
      const SCREEN_W = PHONE_W * 0.935, SCREEN_H = PHONE_H * 0.93, FRONT_Z = PHONE_D / 2 + 0.010;
      const frameMat = new THREE.MeshStandardMaterial({ color: 0xb9c2cf, roughness: 0.32, metalness: 0.58 });
      const backMat = new THREE.MeshPhysicalMaterial({ color: 0x93abca, roughness: 0.42, metalness: 0.18, clearcoat: 0.55, clearcoatRoughness: 0.2 });

      const bodyGeo = new THREE.ExtrudeGeometry(roundedShape(PHONE_W, PHONE_H, RAD), {
        depth: PHONE_D,
        bevelEnabled: true,
        bevelThickness: 0.004,
        bevelSize: 0.006,
        bevelSegments: 4,
      });
      bodyGeo.translate(0, 0, -PHONE_D / 2);
      const body = new THREE.Mesh(bodyGeo, frameMat);
      phone.add(body);

      const backShape = new THREE.ShapeGeometry(roundedShape(PHONE_W * 0.9, PHONE_H * 0.915, RAD * 0.82));
      const backPanel = new THREE.Mesh(backShape, backMat);
      backPanel.position.z = -PHONE_D / 2 - 0.006;
      backPanel.rotation.y = Math.PI;
      phone.add(backPanel);

      const back = new THREE.Mesh(new THREE.PlaneGeometry(PHONE_W * 0.88, PHONE_H * 0.9), new THREE.MeshBasicMaterial({ map: phoneBackTex, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
      back.position.z = -PHONE_D / 2 - 0.013;
      back.rotation.y = Math.PI;
      phone.add(back);

      const magsafe = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.012, 16, 80), new THREE.MeshStandardMaterial({ color: 0xf3efe4, roughness: 0.36, metalness: 0.02 }));
      magsafe.position.set(0, -0.02, -PHONE_D / 2 - 0.016);
      phone.add(magsafe);

      const cameraPlate = new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(0.2, 0.2, 0.05)), new THREE.MeshStandardMaterial({ color: 0x1b3555, roughness: 0.28, metalness: 0.3 }));
      cameraPlate.position.set(-0.07, 0.30, -PHONE_D / 2 - 0.02);
      phone.add(cameraPlate);
      [[-0.125, 0.36], [-0.125, 0.24], [-0.008, 0.30]].forEach(([x, y]) => {
        const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.016, 40), new THREE.MeshStandardMaterial({ color: 0x101f33, roughness: 0.3, metalness: 0.4 }));
        housing.rotation.x = Math.PI / 2; housing.position.set(x, y, -PHONE_D / 2 - 0.028); phone.add(housing);
        const lensRim = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.044, 0.018, 40), new THREE.MeshStandardMaterial({ color: 0xbcc5d1, roughness: 0.22, metalness: 0.62 }));
        lensRim.rotation.x = Math.PI / 2; lensRim.position.set(x, y, -PHONE_D / 2 - 0.034); phone.add(lensRim);
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 40), new THREE.MeshPhysicalMaterial({ color: 0x05060a, roughness: 0.05, metalness: 0.18, clearcoat: 1 }));
        lens.rotation.x = Math.PI / 2; lens.position.set(x, y, -PHONE_D / 2 - 0.044); phone.add(lens);
      });
      const flash = new THREE.Mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.012, 28), new THREE.MeshStandardMaterial({ color: 0xf2ead7, emissive: 0x4f4a3a, roughness: 0.2 }));
      flash.rotation.x = Math.PI / 2; flash.position.set(0.078, 0.35, -PHONE_D / 2 - 0.022); phone.add(flash);
      const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 24), new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.45 }));
      lidar.rotation.x = Math.PI / 2; lidar.position.set(-0.008, 0.392, -PHONE_D / 2 - 0.03); phone.add(lidar);

      const screenMat = new THREE.MeshBasicMaterial({ map: phoneReadyTex, transparent: true, side: THREE.DoubleSide });
      const display = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), screenMat);
      display.position.z = FRONT_Z;
      display.renderOrder = 5;
      phone.add(display);

      const island = new THREE.Mesh(new THREE.ShapeGeometry(roundedShape(PHONE_W * 0.205, PHONE_H * 0.019, 0.0105)), new THREE.MeshBasicMaterial({ color: 0x050507 }));
      island.position.set(0, PHONE_H * 0.42, FRONT_Z + 0.0016);
      island.renderOrder = 6;
      phone.add(island);

      const glass = new THREE.Mesh(new THREE.PlaneGeometry(SCREEN_W, SCREEN_H), new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.045,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }));
      glass.position.z = FRONT_Z + 0.006;
      phone.add(glass);

      const buttonMat = new THREE.MeshStandardMaterial({ color: 0xa9b3c0, roughness: 0.34, metalness: 0.6 });
      const BX = PHONE_W / 2 + 0.005;
      [
        [-BX, PHONE_H * 0.30, PHONE_H * 0.045],
        [-BX, PHONE_H * 0.15, PHONE_H * 0.072],
        [-BX, PHONE_H * 0.058, PHONE_H * 0.072],
        [BX, PHONE_H * 0.18, PHONE_H * 0.11],
      ].forEach(([x, y, h]) => {
        const btn = new THREE.Mesh(new THREE.BoxGeometry(0.005, h, 0.015), buttonMat);
        btn.position.set(x, y, 0); phone.add(btn);
      });
      addShadowFlags(phone);
      phone.userData.display = display;
      return phone;
    }

    function makeChair(parent) {
      const grp = new THREE.Group();
      grp.position.set(0, 0, 0.98);
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.12, 0.62), chairMat);
      seat.position.set(0, 0.72, 0);
      grp.add(seat);
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.72, 0.12), chairMat);
      back.position.set(0, 1.08, 0.36);
      back.rotation.x = -0.08;
      grp.add(back);
      [[-0.32, -0.2], [0.32, -0.2], [-0.32, 0.24], [0.32, 0.24]].forEach(([x, z]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.72, 0.06), chairEdgeMat);
        leg.position.set(x, 0.36, z);
        grp.add(leg);
      });
      addShadowFlags(grp);
      parent.add(grp);
      return grp;
    }

    function makeDesk(px, pz, isHero, idx) {
      const grp = new THREE.Group();
      const topMat = isHero ? deskTopMat : farDeskMat;
      const top = new THREE.Mesh(new THREE.BoxGeometry(2.12, 0.14, 1.36), topMat);
      top.position.y = DESK_TOP_Y; top.castShadow = true; top.receiveShadow = true; grp.add(top);
      [[-0.9, -0.52], [0.9, -0.52], [-0.9, 0.52], [0.9, 0.52]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, DESK_TOP_Y, 0.1), legMat);
        leg.position.set(lx, DESK_TOP_Y / 2, lz); leg.castShadow = true; leg.receiveShadow = true; grp.add(leg);
      });
      if (!isHero) {
        const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.72), paperMat);
        paper.rotation.x = -Math.PI / 2; paper.position.set(-0.34, DESK_TOP_Y + 0.083, 0.09); paper.receiveShadow = true; grp.add(paper);
      }
      makeChair(grp);
      grp.position.set(px, 0, pz);
      scene.add(grp);

      if (isHero) {
        heroDesk = grp;
        const tagShadow = new THREE.Mesh(new THREE.CircleGeometry(0.205, 64), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.22, depthWrite: false }));
        tagShadow.rotation.x = -Math.PI / 2; tagShadow.position.set(0.62, DESK_TOP_Y + 0.077, -0.36); grp.add(tagShadow);

        const tag = new THREE.Mesh(new THREE.CircleGeometry(0.188, 96), new THREE.MeshBasicMaterial({
          map: tagTex,
          transparent: true,
          polygonOffset: true,
          polygonOffsetFactor: -3,
          polygonOffsetUnits: -3,
        }));
        tag.rotation.x = -Math.PI / 2; tag.position.set(0.62, DESK_TOP_Y + 0.083, -0.36); tag.renderOrder = 2; grp.add(tag);

        const rim = new THREE.Mesh(new THREE.RingGeometry(0.189, 0.198, 96), new THREE.MeshBasicMaterial({ color: 0xd7cabb, transparent: true, opacity: 0.9, side: THREE.DoubleSide }));
        rim.rotation.x = -Math.PI / 2; rim.position.copy(tag.position); rim.position.y += 0.004; grp.add(rim);

        const ring = new THREE.Mesh(new THREE.RingGeometry(0.205, 0.216, 80), new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
        ring.rotation.x = -Math.PI / 2; ring.position.set(0.62, DESK_TOP_Y + 0.095, -0.36); grp.add(ring);

        const phone = makePhone();
        grp.add(phone);
        grp.userData.tag = tag;
        grp.userData.ring = ring;
        grp.userData.phone = phone;
        grp.userData.phoneDisplay = phone.userData.display;
      }
    }

    for (let r = 0; r < ROWS; r++) {
      for (let cI = 0; cI < COLS; cI++) {
        const px = (cI - (COLS - 1) / 2) * COL_X;
        const pz = ROW_Z0 + r * ROW_DZ;
        const isHero = (r === ROWS - 1 && cI === Math.floor(COLS / 2));
        makeDesk(px, pz, isHero, r * COLS + cI);
      }
    }

    const HERO_X = 0, HERO_Z = ROW_Z0 + (ROWS - 1) * ROW_DZ;
    const camA = { pos: new THREE.Vector3(0.82, 2.42, HERO_Z + 2.35), tgt: new THREE.Vector3(0.12, DESK_TOP_Y + 0.15, HERO_Z - 0.12) };
    const camB = { pos: new THREE.Vector3(0, 8.6, HERO_Z + 12.4), tgt: new THREE.Vector3(0, 4.35, -26) };
    const camMobileA = { pos: new THREE.Vector3(0.78, 2.62, HERO_Z + 2.75), tgt: new THREE.Vector3(0.08, DESK_TOP_Y + 0.15, HERO_Z - 0.06) };
    const camMobileB = { pos: new THREE.Vector3(0, 9.6, HERO_Z + 14.2), tgt: new THREE.Vector3(0, 4.3, -24) };
    const camC = { pos: new THREE.Vector3(9.6, 7.7, -21), tgt: new THREE.Vector3(11.0, 8.5, -30) };
    const camMobileC = { pos: new THREE.Vector3(8.4, 7.6, -19.5), tgt: new THREE.Vector3(10.6, 8.4, -30) };
    const camIntro = { pos: new THREE.Vector3(0, 7.5, 14), tgt: new THREE.Vector3(0, 5.4, -27) };
    const camMobileIntro = { pos: new THREE.Vector3(0, 8.6, 17.5), tgt: new THREE.Vector3(0, 5.4, -27) };
    const _p = new THREE.Vector3(), _t = new THREE.Vector3();

    const pbar = q("#pbar");
    const hint = q("#hint");
    const cap = q("#cap");
    const capHead = q("#capHead");
    const chNum = q("#chNum");
    const chName = q("#chName");
    const analytics = q("#analytics");
    const roster = [
      ["FC-1042", "Aisha Mensah", 94, 98, "up"], ["FC-1098", "Jordan Tran", 88, 96, "up"],
      ["FC-1241", "Marcus Reyes", 83, 94, "up"], ["FC-1156", "Sofia Almeida", 79, 92, "flat"],
      ["FC-1303", "Riley Park", 71, 90, "up"], ["FC-1077", "Hannah Cole", 68, 88, "flat"],
      ["FC-1219", "Noah Bennett", 66, 86, "dn"], ["FC-1188", "Priya Nair", 63, 84, "flat"],
      ["FC-1265", "Devin Kaur", 61, 82, "up"], ["FC-1011", "Liam Doyle", 58, 80, "dn"],
      ["FC-1320", "Emma Schultz", 55, 78, "flat"], ["FC-1144", "Carlos Vega", 51, 74, "dn"],
      ["FC-1290", "Zoe Carter", 48, 70, "flat"], ["FC-1063", "Ethan Wright", 44, 66, "dn"],
    ];
    const student = q("#student");
    const pagebg = q("#pagebg");
    const cursorEl = q("#cursor");
    const clickRing = q("#clickring");
    const outro = q("#outro");
    const introEl = q("#intro");
    const experience = q("#experience");
    const scrollEl = q("#scroll");
    const rb = q("#rosterBody");
    if (rb) {
      rb.innerHTML = roster.map(function (r, i) {
        const tl = r[4] === "up" ? "▲" : (r[4] === "dn" ? "▼" : "—");
        return "<tr" + (i === 0 ? ' class="hot"' : "") + '><td class="id">' + r[0] + '</td><td class="nm">' + r[1] + "</td>"
          + '<td class="colhide"><span class="bar"><i style="width:' + r[2] + '%"></i></span></td>'
          + '<td class="r sc">' + r[2] + "</td>"
          + '<td class="colhide r pct">' + r[3] + "%</td>"
          + '<td class="r"><span class="chip ' + r[4] + '">' + tl + "</span></td>"
          + '<td class="r"><button class="viewbtn"' + (i === 0 ? ' id="viewHot"' : "") + ">View</button></td></tr>";
      }).join("");
    }
    function setZoomOrigin() {
      const hot = analytics.querySelector("tr.hot"); if (!hot) return;
      const prev = analytics.style.transform; analytics.style.transform = "none";
      const r = hot.getBoundingClientRect();
      analytics.style.transform = prev;
      const ox = (r.left + r.width * 0.30) / innerWidth * 100, oy = (r.top + r.height * 0.5) / innerHeight * 100;
      analytics.style.transformOrigin = ox.toFixed(1) + "% " + oy.toFixed(1) + "%";
    }
    addEventListener("resize", setZoomOrigin);
    const zoomTO = setTimeout(setZoomOrigin, 80);

    function getP() {
      const max = scrollEl.offsetHeight - innerHeight;
      return clamp(window.scrollY / max, 0, 1);
    }

    let lastChecked = false;
    let lastBoard = false;
    function update(p) {
      pbar.style.width = (p * 100).toFixed(1) + "%";
      hint.style.opacity = String(p > 0.04 ? 0 : 0.7);
      let num = "01", name = "Tap in";
      if (p >= 0.40) { num = "02"; name = "The room"; }
      if (p >= 0.52) { num = "03"; name = "The signal"; }
      if (p >= 0.74) { num = "04"; name = "The roster"; }
      if (p >= 0.88) { num = "05"; name = "Your focus"; }
      if (p >= 0.94) { num = "06"; name = "Get started"; }
      chNum.textContent = num; chName.textContent = name;

      const mobile = innerWidth < 760;
      const intro = mobile ? camMobileIntro : camIntro;
      const close = mobile ? camMobileA : camA;
      const wide = mobile ? camMobileB : camB;
      const zoom = mobile ? camMobileC : camC;
      const camFin = ease(range(p, 0, 0.20));
      _p.copy(intro.pos).lerp(close.pos, camFin);
      _t.copy(intro.tgt).lerp(close.tgt, camFin);
      const camF1 = ease(range(p, 0.34, 0.50));
      _p.lerp(wide.pos, camF1);
      _t.lerp(wide.tgt, camF1);
      const camF2 = ease(range(p, 0.52, 0.68));
      _p.lerp(zoom.pos, camF2);
      _t.lerp(zoom.tgt, camF2);
      camera.position.copy(_p);
      camera.lookAt(_t);
      introEl.style.opacity = (1 - ease(range(p, 0.03, 0.16))).toFixed(3);
      introEl.style.transform = "translateY(" + (-ease(range(p, 0.03, 0.16)) * 3).toFixed(2) + "vh)";
      pagebg.style.opacity = ease(range(p, 0.62, 0.70)).toFixed(3);
      const aIn = ease(range(p, 0.64, 0.72));
      const aOut = ease(range(p, 0.85, 0.905));
      analytics.style.opacity = (aIn * (1 - aOut)).toFixed(3);
      analytics.style.transform = "scale(" + (0.94 + 0.06 * aIn).toFixed(3) + ")";
      const vbtn = root.querySelector("#viewHot") as HTMLElement;
      if (vbtn) {
        const r = vbtn.getBoundingClientRect();
        const bx = r.left + r.width / 2, by = r.top + r.height / 2;
        const sx = innerWidth * 0.44, sy = innerHeight * 0.84;
        const mv = ease(range(p, 0.73, 0.82));
        cursorEl.style.left = (lerp(sx, bx, mv)).toFixed(1) + "px";
        cursorEl.style.top = (lerp(sy, by, mv)).toFixed(1) + "px";
        cursorEl.style.opacity = (ease(range(p, 0.70, 0.74)) * (1 - ease(range(p, 0.85, 0.89)))).toFixed(3);
        const pressed = p >= 0.82 && p < 0.85;
        vbtn.classList.toggle("clicked", pressed);
        cursorEl.classList.toggle("press", pressed);
        const cr = range(p, 0.82, 0.85);
        clickRing.style.left = bx + "px"; clickRing.style.top = by + "px";
        clickRing.style.opacity = (cr > 0 && cr < 1 ? 0.55 * (1 - cr) : 0).toFixed(3);
        clickRing.style.transform = "translate(-50%,-50%) scale(" + (0.3 + cr * 1.5).toFixed(2) + ")";
      }
      const sv = ease(range(p, 0.85, 0.905));
      const suOut = ease(range(p, 0.93, 1));
      student.style.opacity = (sv * (1 - suOut)).toFixed(3);
      student.style.transform = "translateY(" + (-suOut * 16).toFixed(2) + "vh) scale(" + (0.96 + 0.04 * sv).toFixed(3) + ")";
      const ov = ease(range(p, 0.915, 0.99));
      outro.style.opacity = ov.toFixed(3);
      outro.style.transform = "translateY(" + ((1 - ov) * 7).toFixed(2) + "vh)";

      const ph = heroDesk.userData.phone;
      const ring = heroDesk.userData.ring;
      const display = heroDesk.userData.phoneDisplay;
      const tap = ease(range(p, 0.05, 0.26));
      const place = ease(range(p, 0.29, 0.43));

      const start = { x: -0.26, y: DESK_TOP_Y + 0.54, z: 0.38, rx: -0.30, rz: 0.06, sc: 1 };
      const target = { x: 0.50, y: DESK_TOP_Y + 0.36, z: -0.28, rx: -0.46, rz: -0.04, sc: 0.98 };
      const down = { x: -0.24, y: DESK_TOP_Y + 0.135, z: 0.16, rx: -Math.PI / 2, rz: 0.02, sc: 1 };
      const x = lerp(lerp(start.x, target.x, tap), down.x, place);
      const y = lerp(lerp(start.y, target.y, tap), down.y, place);
      const z = lerp(lerp(start.z, target.z, tap), down.z, place);
      const rx = lerp(lerp(start.rx, target.rx, tap), down.rx, place);
      const rz = lerp(lerp(start.rz, target.rz, tap), down.rz, place);
      const sc = lerp(lerp(start.sc, target.sc, tap), down.sc, place);
      const liftArc = Math.sin(place * Math.PI) * 0.22;
      const deskSurface = DESK_TOP_Y + 0.07;
      const halfY = PHONE_MODEL.h * 0.5 + 0.035;
      const halfZ = PHONE_MODEL.d * 0.5 + 0.03;
      const tiltedVerticalHalf = (Math.abs(Math.cos(rx)) * halfY + Math.abs(Math.sin(rx)) * halfZ) * sc + 0.018;
      ph.position.set(x, Math.max(y + liftArc, deskSurface + tiltedVerticalHalf), z);
      ph.rotation.x = rx;
      ph.rotation.z = rz;
      ph.scale.setScalar(sc);

      const cring = range(p, 0.18, 0.30);
      ring.material.opacity = cring > 0 ? (1 - cring) * 0.85 : 0;
      const rs = 1 + cring * 2.25;
      ring.scale.set(rs, rs, rs);

      const checked = p >= 0.24;
      if (checked !== lastChecked) {
        display.material.map = checked ? phoneCheckedTex : phoneReadyTex;
        display.material.needsUpdate = true;
        lastChecked = checked;
      }
      const boardLive = p >= 0.24;
      if (boardLive !== lastBoard) {
        screen.material.map = boardLive ? dashTex : screenIdleTex;
        screen.material.needsUpdate = true;
        lastBoard = boardLive;
      }

      const done = range(p, 0.22, 0.28), placeDone = range(p, 0.36, 0.43);
      capHead.textContent = placeDone > 0.5 ? "Eyes up. Class begins." : (done > 0.6 ? "You're checked in." : "Tap to focus.");
      cap.style.opacity = (1 - range(p, 0.46, 0.58)).toFixed(2);
    }

    let rafId = 0;
    function loop() {
      update(getP());
      (function () { const mx = scrollEl.offsetHeight - innerHeight; experience.style.display = window.scrollY > mx + 4 ? "none" : ""; })();
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(loop);
    }
    function onResize() {
      camera.aspect = innerWidth / innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    }
    addEventListener("resize", onResize);
    document.fonts?.ready.then(() => {
      if (disposed) return;
      phoneReadyTex.needsUpdate = true;
      phoneCheckedTex.needsUpdate = true;
      dashTex.needsUpdate = true;
      tagTex.needsUpdate = true;
    });
    loop();

    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      clearTimeout(zoomTO);
      removeEventListener("resize", setZoomOrigin);
      removeEventListener("resize", onResize);
      try { renderer.dispose(); renderer.forceContextLoss(); } catch { /* noop */ }
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="classroom-hero" ref={rootRef}>
      <div id="experience">
        <div id="stage" />
        <div className="vignette" />
        <div className="grain" />
        <div id="intro" aria-hidden="true">
          <div className="icard">
            <h1 className="ihead">Know who&rsquo;s present.<br />Know who&rsquo;s engaged.</h1>
            <p className="isub">NFC tap-in attendance and real-time focus analytics &mdash; for every class.</p>
            <div className="icue"><span>Scroll to explore</span><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg></div>
          </div>
        </div>
        <div className="hud">
          <div className="chapter"><span id="chNum">01</span><b id="chName">Tap in</b></div>
        </div>
        <div className="pbar" id="pbar" />
        <div className="cap" id="cap"><div className="mono">08:59 &middot; Accounting 212 &middot; Desk A1</div><h2 id="capHead">Tap to focus.</h2></div>
        <div className="hint" id="hint"><span>Scroll</span><span className="ar" /></div>
        <div id="pagebg" />
        <div id="analytics">
          <div className="ahead">
            <div>
              <div className="atitle">Accounting 212 &middot; Session Analytics</div>
              <div className="asub">Section 02 &middot; Fri Jun 5 &middot; 50 min &middot; 30 enrolled</div>
            </div>
            <div className="live"><span className="d" />Live now</div>
          </div>
          <div className="summary">
            <div className="scard"><div className="k">Class Focus Index</div><div className="v grad">87</div></div>
            <div className="scard"><div className="k">Present</div><div className="v">28/30</div></div>
            <div className="scard"><div className="k">Avg engaged</div><div className="v">84%</div></div>
            <div className="scard"><div className="k">Distractions</div><div className="v">12</div></div>
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Student ID</th><th>Full name</th><th className="colhide">Focus</th><th className="r">FEI</th><th className="colhide r">Present</th><th className="r">Trend</th><th className="r">Details</th></tr></thead>
              <tbody id="rosterBody" />
            </table>
          </div>
        </div>
        <div id="cursor" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30"><path d="M4 2 L4 18 L8 14.5 L10.6 20.2 L13 19.1 L10.4 13.6 L16.2 13.4 Z" fill="#fff" stroke="#111827" strokeWidth="1.4" strokeLinejoin="round" /></svg></div>
        <div id="clickring" aria-hidden="true" />
        <div id="student">
          <div className="ahead">
            <div>
              <div className="atitle">Your Focus &middot; Accounting 212</div>
              <div className="asub">Aisha Mensah &middot; FC-1042 &middot; Section 02 &middot; Fri Jun 5</div>
            </div>
            <div className="ontime"><span className="d" />On time &middot; checked in 8:59 AM</div>
          </div>
          <div className="sgrid">
            <div className="panel feiPanel">
              <div className="k">Focus Engagement Index</div>
              <div className="feiBig grad">94</div>
              <div className="feiNote">+6 vs last session</div>
              <div className="comp">
                <div className="k" style={{ marginBottom: 6 }}>Your signals</div>
                <div className="crow"><div className="clab">Presence</div><div className="cval">96</div><div className="cbar"><i style={{ width: "96%" }} /></div></div>
                <div className="crow"><div className="clab">Distraction resistance</div><div className="cval">93</div><div className="cbar"><i style={{ width: "93%" }} /></div></div>
                <div className="crow"><div className="clab">Active participation</div><div className="cval">93</div><div className="cbar"><i style={{ width: "93%" }} /></div></div>
                <div className="crow"><div className="clab">Session integrity</div><div className="cval">95</div><div className="cbar"><i style={{ width: "95%" }} /></div></div>
              </div>
            </div>
            <div className="col">
              <div className="miniGrid">
                <div className="mini"><div className="k">Distractions</div><div className="v">3</div><div className="sub">2 fewer than class avg</div></div>
                <div className="mini"><div className="k">Attendance</div><div className="v">On time</div><div className="sub">12 / 12 sessions</div></div>
                <div className="mini"><div className="k">Active minutes</div><div className="v">44/50</div><div className="sub">88% of session engaged</div></div>
                <div className="mini"><div className="k">Focus streak</div><div className="v">5</div><div className="sub">sessions improving</div></div>
              </div>
              <div className="panel chartPanel">
                <div className="k">Focus vs results &middot; this term</div>
                <svg viewBox="0 0 600 250" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="gfei" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8b6cff" stopOpacity=".22" /><stop offset="1" stopColor="#8b6cff" stopOpacity="0" /></linearGradient>
                    <linearGradient id="gtest" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#22d3ee" stopOpacity=".18" /><stop offset="1" stopColor="#22d3ee" stopOpacity="0" /></linearGradient>
                  </defs>
                  <g stroke="rgba(17,24,39,0.06)" strokeWidth="1">
                    <line x1="44" y1="18" x2="588" y2="18" /><line x1="44" y1="65" x2="588" y2="65" /><line x1="44" y1="112" x2="588" y2="112" /><line x1="44" y1="159" x2="588" y2="159" /><line x1="44" y1="206" x2="588" y2="206" />
                  </g>
                  <polygon fill="url(#gfei)" points="44,123 153,91 262,103 370,63 479,46 588,25 588,206 44,206" />
                  <polygon fill="url(#gtest)" points="44,101 153,76 262,86 370,72 479,37 588,22 588,206 44,206" />
                  <polyline fill="none" stroke="#8b6cff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points="44,123 153,91 262,103 370,63 479,46 588,25" />
                  <polyline fill="none" stroke="#22d3ee" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" points="44,101 153,76 262,86 370,72 479,37 588,22" />
                  <g fill="#8b6cff"><circle cx="44" cy="123" r="4.5" /><circle cx="153" cy="91" r="4.5" /><circle cx="262" cy="103" r="4.5" /><circle cx="370" cy="63" r="4.5" /><circle cx="479" cy="46" r="4.5" /><circle cx="588" cy="25" r="5.5" /></g>
                  <g fill="#22d3ee"><circle cx="44" cy="101" r="4.5" /><circle cx="153" cy="76" r="4.5" /><circle cx="262" cy="86" r="4.5" /><circle cx="370" cy="72" r="4.5" /><circle cx="479" cy="37" r="4.5" /><circle cx="588" cy="22" r="5.5" /></g>
                  <g fill="#98a2b3" fontSize="11.5" fontFamily="IBM Plex Mono,ui-monospace,monospace">
                    <text x="44" y="232" textAnchor="start">Quiz 1</text><text x="153" y="232" textAnchor="middle">Quiz 2</text><text x="262" y="232" textAnchor="middle">Midterm</text><text x="370" y="232" textAnchor="middle">Quiz 3</text><text x="479" y="232" textAnchor="middle">Quiz 4</text><text x="588" y="232" textAnchor="end">Final</text>
                  </g>
                </svg>
                <div className="legend"><span><i style={{ background: "#8b6cff" }} />Focus (FEI)</span><span><i style={{ background: "#22d3ee" }} />Test score</span></div>
                <div className="insight">Focus and results climbed together &mdash; a dip at midterm, a stumble on Quiz 3, then a strong finish (+52 FEI).</div>
              </div>
            </div>
          </div>
        </div>
        <div id="outro" aria-hidden="true">
          <div className="ocard">
            <div className="obrand"><span className="oplate"><img src={ftWordmark} alt="FocusTap" /></span></div>
            <h2 className="ohead">Ready to get started?</h2>
            <p className="osub">Verified attendance and real engagement analytics for every classroom &mdash; no surveillance, no app installs, no distractions.</p>
            <div className="oactions">
              <button className="obtn primary" onClick={() => navigate("/demo")}>Book a demo</button>
              <button className="obtn ghost" onClick={() => navigate("/teacher-login")}>focustap.org</button>
            </div>
            <div className="ofoot">reiss@focustap.org</div>
          </div>
        </div>
      </div>
      <div id="scroll" />
    </div>
  );
};

export default ClassroomHero;
