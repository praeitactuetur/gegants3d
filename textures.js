import * as THREE from 'three';
function createCanvas(size = 512) { const canvas = document.createElement('canvas'); canvas.width = size; canvas.height = size; return { canvas, ctx: canvas.getContext('2d') }; }
export function createCobblestonePBR() {
  const size = 512, diff = createCanvas(size), norm = createCanvas(size), rough = createCanvas(size);
  diff.ctx.fillStyle = '#47433e'; diff.ctx.fillRect(0, 0, size, size);
  norm.ctx.fillStyle = 'rgb(128,128,255)'; norm.ctx.fillRect(0, 0, size, size);
  rough.ctx.fillStyle = '#e5e5e5'; rough.ctx.fillRect(0, 0, size, size);
  const rows = 10, cols = 8, cellW = size / cols, cellH = size / rows;
  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (cellW * 0.5);
    for (let c = -1; c <= cols; c++) {
      const x = c * cellW + offset + 3, y = r * cellH + 3, w = cellW - 6, h = cellH - 6;
      const shade = 115 + Math.floor(Math.sin(r * 13 + c * 7) * 18 + Math.random() * 14);
      const warm = Math.floor(Math.random() * 10);
      diff.ctx.fillStyle = `rgb(${shade + warm}, ${shade}, ${shade - 6})`;
      diff.ctx.beginPath(); diff.ctx.roundRect(x, y, w, h, 8); diff.ctx.fill();
      const grad = norm.ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, 'rgb(155, 155, 255)'); grad.addColorStop(0.5, 'rgb(128, 128, 255)'); grad.addColorStop(1, 'rgb(100, 100, 240)');
      norm.ctx.fillStyle = grad; norm.ctx.beginPath(); norm.ctx.roundRect(x, y, w, h, 8); norm.ctx.fill();
      const rVal = 150 + Math.floor(Math.random() * 65);
      rough.ctx.fillStyle = `rgb(${rVal},${rVal},${rVal})`; rough.ctx.beginPath(); rough.ctx.roundRect(x, y, w, h, 8); rough.ctx.fill();
    }
  }
  const map = new THREE.CanvasTexture(diff.canvas), normalMap = new THREE.CanvasTexture(norm.canvas), roughnessMap = new THREE.CanvasTexture(rough.canvas);
  [map, normalMap, roughnessMap].forEach((t) => { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(18, 36); });
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, normalMap, roughnessMap };
}
export function createBrocadeFabricPBR(primaryHex, accentHex = '#eab308') {
  const size = 512, diff = createCanvas(size), norm = createCanvas(size);
  diff.ctx.fillStyle = primaryHex; diff.ctx.fillRect(0, 0, size, size);
  norm.ctx.fillStyle = 'rgb(128,128,255)'; norm.ctx.fillRect(0, 0, size, size);
  diff.ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let i = 0; i < size; i += 4) { diff.ctx.fillRect(i, 0, 1, size); diff.ctx.fillRect(0, i, size, 1); }
  diff.ctx.strokeStyle = accentHex; diff.ctx.fillStyle = accentHex; diff.ctx.lineWidth = 2.5;
  const step = 64;
  for (let y = step / 2; y < size; y += step) {
    for (let x = step / 2; x < size; x += step) {
      diff.ctx.save(); diff.ctx.translate(x, y); diff.ctx.globalAlpha = 0.55;
      diff.ctx.beginPath(); diff.ctx.moveTo(0, -14); diff.ctx.quadraticCurveTo(10, 0, 0, 14); diff.ctx.quadraticCurveTo(-10, 0, 0, -14); diff.ctx.stroke();
      diff.ctx.beginPath(); diff.ctx.arc(0, 0, 3.5, 0, Math.PI * 2); diff.ctx.fill(); diff.ctx.restore();
      norm.ctx.fillStyle = 'rgb(142, 142, 255)'; norm.ctx.beginPath(); norm.ctx.arc(x, y, 8, 0, Math.PI * 2); norm.ctx.fill();
    }
  }
  const map = new THREE.CanvasTexture(diff.canvas), normalMap = new THREE.CanvasTexture(norm.canvas);
  [map, normalMap].forEach((t) => { t.wrapS = THREE.RepeatWrapping; t.wrapT = THREE.RepeatWrapping; t.repeat.set(4, 4); });
  map.colorSpace = THREE.SRGBColorSpace;
  return { map, normalMap };
}
export function createFacadeTexture(baseHex = '#e6dcc8') {
  const size = 512, { canvas, ctx } = createCanvas(size);
  ctx.fillStyle = baseHex; ctx.fillRect(0, 0, size, size);
  for (let i = 0; i < 4500; i++) {
    const x = Math.random() * size, y = Math.random() * size, r = 1 + Math.random() * 3;
    ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(60,50,40,0.06)';
    ctx.fillRect(x, y, r, r);
  }
  ctx.strokeStyle = 'rgba(70,60,50,0.22)'; ctx.lineWidth = 2;
  for (let y = 320; y < size; y += 32) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(size, y); ctx.stroke();
    const off = ((y / 32) % 2) * 40;
    for (let x = off; x < size; x += 80) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 32); ctx.stroke(); }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
export function createWoodTexture() {
  const size = 256, { canvas, ctx } = createCanvas(size);
  ctx.fillStyle = '#7c4a27'; ctx.fillRect(0, 0, size, size);
  for (let y = 0; y < size; y += 2) {
    const wave = Math.sin(y * 0.12) * 14;
    ctx.fillStyle = y % 4 === 0 ? 'rgba(42, 22, 10, 0.25)' : 'rgba(180, 120, 70, 0.14)';
    ctx.fillRect(0, y, size + wave, 1.5);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}