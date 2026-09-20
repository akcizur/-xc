// Realistic Procedural Textures for Materials using HTML Canvas
import * as THREE from 'three';

// Generates a subtle micro-scratched / injection-molded plastic roughness and bump map
export function createPlasticTextureMaps(): { roughnessMap: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Neutral base
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Micro surface noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 18;
    data[i] = Math.min(255, Math.max(0, 128 + noise));
    data[i + 1] = Math.min(255, Math.max(0, 128 + noise));
    data[i + 2] = Math.min(255, Math.max(0, 128 + noise));
    data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle injection mold flow streaks
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const w = Math.random() * 80 + 30;
    const h = Math.random() * 2 + 0.5;
    ctx.fillRect(x, y, w, h);
  }

  const bumpTex = new THREE.CanvasTexture(canvas);
  bumpTex.wrapS = THREE.RepeatWrapping;
  bumpTex.wrapT = THREE.RepeatWrapping;
  bumpTex.repeat.set(2, 2);

  // Roughness variation canvas
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#3a3a3a'; // Base glossy plastic ~0.22 roughness
  rCtx.fillRect(0, 0, size, size);

  // Slight fingerprint & handling smudges
  rCtx.fillStyle = 'rgba(255, 255, 255, 0.05)';
  for (let i = 0; i < 25; i++) {
    const cx = Math.random() * size;
    const cy = Math.random() * size;
    const rad = Math.random() * 40 + 10;
    rCtx.beginPath();
    rCtx.arc(cx, cy, rad, 0, Math.PI * 2);
    rCtx.fill();
  }

  const roughTex = new THREE.CanvasTexture(roughCanvas);
  roughTex.wrapS = THREE.RepeatWrapping;
  roughTex.wrapT = THREE.RepeatWrapping;
  roughTex.repeat.set(2, 2);

  return { roughnessMap: roughTex, bumpMap: bumpTex };
}

// Generates an architectural studio concrete / carbon matte floor with subtle 0.5m tiles
export function createFloorTextures(): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Dark studio slate floor
  ctx.fillStyle = '#22252c';
  ctx.fillRect(0, 0, size, size);

  // Micro noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 14;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Modular studio panel borders (subtle inset grooves)
  ctx.strokeStyle = '#181a1f';
  ctx.lineWidth = 3;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  // Dot matrix markers for engineering precision
  ctx.fillStyle = '#323742';
  for (let x = 64; x < size; x += 128) {
    for (let y = 64; y < size; y += 128) {
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const floorTex = new THREE.CanvasTexture(canvas);
  floorTex.wrapS = THREE.RepeatWrapping;
  floorTex.wrapT = THREE.RepeatWrapping;
  floorTex.repeat.set(60, 60);

  // Floor roughness canvas
  const rCanvas = document.createElement('canvas');
  rCanvas.width = 512;
  rCanvas.height = 512;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.fillStyle = '#c0c0c0'; // ~0.75 roughness
  rCtx.fillRect(0, 0, 512, 512);

  const floorRough = new THREE.CanvasTexture(rCanvas);
  floorRough.wrapS = THREE.RepeatWrapping;
  floorRough.wrapT = THREE.RepeatWrapping;
  floorRough.repeat.set(60, 60);

  return { map: floorTex, roughnessMap: floorRough };
}

// Generates an embossed "BYLDR" logo bump map for stud caps
export function createStudLogoBumpMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Neutral bump plane (50% gray = zero displacement)
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  // Outer bevel ring on stud cap
  ctx.strokeStyle = '#a5a5a5';
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) - 16, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#5a5a5a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, (size / 2) - 10, 0, Math.PI * 2);
  ctx.stroke();

  // Embossed BYLDR brand typography
  ctx.save();
  ctx.translate(size / 2, size / 2);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 48px system-ui, -apple-system, sans-serif';
  ctx.letterSpacing = '2px';

  // Lower dark shadow for emboss depth
  ctx.fillStyle = '#484848';
  ctx.fillText('BYLDR', 1.5, 2.5);

  // Upper bright highlight for emboss raise
  ctx.fillStyle = '#dcdcdc';
  ctx.fillText('BYLDR', -1.5, -1.5);

  // Main raised face
  ctx.fillStyle = '#b0b0b0';
  ctx.fillText('BYLDR', 0, 0);

  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
