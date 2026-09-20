import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { BRICK_TYPES, BrickType, COLORS, BRICK_GRID_UNIT } from './types';
import { playSnapSound, playRemoveSound, playRotateSound } from './audio';
import { createPlasticTextureMaps, createFloorTextures, createStudLogoBumpMap } from './textures';

export interface EngineCallbacks {
  onBrickCountChange: (count: number) => void;
  onCanUndoChange: (canUndo: boolean) => void;
  onStatusChange: (status: 'loading' | 'ready' | 'error', text?: string) => void;
  onHeightChange?: (height: number) => void;
}

export class BrickEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private raycaster: THREE.Raycaster;
  
  private brickModelCache: Map<string, THREE.Group> = new Map();
  private defaultBrickModel: THREE.Group | null = null;
  private ghost: THREE.Group | null = null;
  private bricks: THREE.Group[] = [];
  private undoStack: THREE.Group[] = [];

  // PBR Texture maps
  private plasticRoughnessMap: THREE.CanvasTexture | null = null;
  private plasticBumpMap: THREE.CanvasTexture | null = null;
  private studLogoBumpMap: THREE.CanvasTexture | null = null;
  
  // Real player eye height: 1.6m above floor.
  // 1x1 brick (3005) is 0.5m x 0.5m x 0.6m. Stacking 3 bricks = 1.8m (just above eye level)
  public readonly EYE_HEIGHT = 1.6;
  public playerHeight = 1.6;
  public minPlayerHeight = 0.6;
  public maxPlayerHeight = 16.0;

  private MOVE_SPEED = 0.08;
  private LOOK_SPEED = 0.003;
  
  public mode: 'BUILD' | 'ERASE' = 'BUILD';
  public colorIdx: number = 1;
  public rotation: number = 0; // 0, 1, 2, 3
  public brickTypeId: string = 'bb3005';
  public soundEnabled: boolean = true;
  
  private input = {
    forward: 0,
    side: 0,
    pitch: 0,
    yaw: 0,
    lastX: 0 as number | null,
    lastY: 0 as number | null,
  };
  
  private keysDown = new Set<string>();
  private isPointerLocked = false;
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;
  private animationFrameId: number | null = null;
  private callbacks: EngineCallbacks;
  private isDestroyed = false;

  // Placement sparkling particle bursts
  private particles: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number; maxLife: number }[] = [];

  constructor(container: HTMLElement, callbacks: EngineCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    
    // Scene setup with atmospheric studio gradient fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1e222b);
    this.scene.fog = new THREE.FogExp2(0x1e222b, 0.025);

    // Camera: Real human eye height (1.6m), standing 3m back
    const aspect = container.clientWidth / container.clientHeight || window.innerWidth / window.innerHeight;
    this.camera = new THREE.PerspectiveCamera(70, aspect, 0.05, 500);
    this.camera.position.set(0, this.EYE_HEIGHT, 3.5);

    // Renderer: Photorealistic Tone Mapping & High Precision Shadows
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    container.appendChild(this.renderer.domElement);

    // Initialize realistic procedural textures
    const plasticTextures = createPlasticTextureMaps();
    this.plasticRoughnessMap = plasticTextures.roughnessMap;
    this.plasticBumpMap = plasticTextures.bumpMap;
    this.studLogoBumpMap = createStudLogoBumpMap();

    // Studio IBL Environment reflections (PMREM Generator with RoomEnvironment)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();
    const roomEnv = new RoomEnvironment();
    this.scene.environment = pmremGenerator.fromScene(roomEnv, 0.04).texture;
    pmremGenerator.dispose();

    this.raycaster = new THREE.Raycaster();

    // Studio Lighting setup
    const hemiLight = new THREE.HemisphereLight(0xeef2ff, 0x181a20, 0.65);
    this.scene.add(hemiLight);

    // Key Sun Light (Warm studio spotlight casting sharp soft-edged contact shadows)
    const keyLight = new THREE.DirectionalLight(0xfff8ee, 1.25);
    keyLight.position.set(10, 18, 10);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0001;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 45;
    const d = 12;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    this.scene.add(keyLight);

    // Cool Rim / Fill light for crisp plastic bevel highlights
    const rimLight = new THREE.DirectionalLight(0x7ea9e6, 0.5);
    rimLight.position.set(-10, 12, -8);
    this.scene.add(rimLight);

    // Subtle overhead soft light
    const topLight = new THREE.DirectionalLight(0xffffff, 0.35);
    topLight.position.set(0, 15, 0);
    this.scene.add(topLight);

    // Realistic Textured Studio Floor
    const floorTextures = createFloorTextures();
    const floorGeo = new THREE.PlaneGeometry(160, 160);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTextures.map,
      roughnessMap: floorTextures.roughnessMap,
      roughness: 0.65,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    floor.name = 'FLOOR';
    this.scene.add(floor);

    // Primary 0.5m grid (matching 1x1 brick width = 50cm)
    // 80m size / 0.5m step = 160 divisions
    const grid05 = new THREE.GridHelper(80, 160, 0x4a5568, 0x2d3748);
    grid05.position.y = 0.005;
    this.scene.add(grid05);

    // Major 1.0m grid (every 2 studs)
    const grid10 = new THREE.GridHelper(80, 80, 0x007aff, 0x3b4252);
    grid10.position.y = 0.007;
    (grid10.material as THREE.Material).opacity = 0.25;
    (grid10.material as THREE.Material).transparent = true;
    this.scene.add(grid10);

    // Setup input listeners
    this.setupWindowEvents();
    this.loadModelAndStart();
  }

  private loadModelAndStart() {
    this.callbacks.onStatusChange('loading', 'NAČÍTÁNÍ MODELU bb3005.glb...');
    const loader = new GLTFLoader();

    loader.load(
      './bb3005.glb',
      (gltf) => {
        if (this.isDestroyed) return;
        this.defaultBrickModel = gltf.scene;
        this.brickModelCache.set('bb3005', gltf.scene);
        this.callbacks.onStatusChange('ready');
        this.updateGhost();
        this.animate();
      },
      undefined,
      (err) => {
        console.warn('Could not load ./bb3005.glb, falling back to procedural 3005 model:', err);
        if (this.isDestroyed) return;
        // Fallback procedural brick model (3005 Brick 1x1)
        const procedural = this.generateProceduralBrickMesh(BRICK_TYPES[0]);
        this.defaultBrickModel = procedural;
        this.brickModelCache.set('bb3005', procedural);
        this.callbacks.onStatusChange('ready');
        this.updateGhost();
        this.animate();
      }
    );
  }

  public getBrickType(id: string): BrickType {
    const found = BRICK_TYPES.find((b) => b.id === id);
    return found || BRICK_TYPES[0];
  }

  // Generates procedural LEGO brick with body, bevels and realistic studs
  private generateProceduralBrickMesh(type: BrickType): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.18,
      metalness: 0.02,
      roughnessMap: this.plasticRoughnessMap,
      bumpMap: this.plasticBumpMap,
      bumpScale: 0.0006,
    });

    // Main box body (e.g. 0.5 x 0.6 x 0.5 for 1x1)
    const bodyGeo = new THREE.BoxGeometry(type.w, type.h, type.l);
    const bodyMesh = new THREE.Mesh(bodyGeo, mat);
    bodyMesh.position.y = type.h / 2;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    group.add(bodyMesh);

    // Realistic studs: 0.15m radius (30cm diameter), 0.10m height
    const studRadius = 0.15;
    const studHeight = 0.10;
    const studGeo = new THREE.CylinderGeometry(studRadius, studRadius, studHeight, 28);
    const studRimGeo = new THREE.TorusGeometry(0.12, 0.012, 8, 20);
    studRimGeo.rotateX(Math.PI / 2);

    const startX = -(type.w / 2) + BRICK_GRID_UNIT / 2;
    const startZ = -(type.l / 2) + BRICK_GRID_UNIT / 2;

    for (let x = 0; x < type.studsX; x++) {
      for (let z = 0; z < type.studsZ; z++) {
        const posX = startX + x * BRICK_GRID_UNIT;
        const posZ = startZ + z * BRICK_GRID_UNIT;
        const posY = type.h + studHeight / 2;

        const studMesh = new THREE.Mesh(studGeo, mat);
        studMesh.position.set(posX, posY, posZ);
        studMesh.castShadow = true;
        studMesh.receiveShadow = true;
        group.add(studMesh);

        // Stud cap with embossed BYLDR logo
        const capGeo = new THREE.CircleGeometry(studRadius * 0.94, 24);
        capGeo.rotateX(-Math.PI / 2);
        const capMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          roughness: 0.18,
          metalness: 0.02,
          roughnessMap: this.plasticRoughnessMap,
          bumpMap: this.studLogoBumpMap,
          bumpScale: 0.0035,
        });
        const capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.name = 'STUD_CAP';
        capMesh.position.set(posX, type.h + studHeight + 0.001, posZ);
        capMesh.castShadow = true;
        group.add(capMesh);

        const rimMesh = new THREE.Mesh(studRimGeo, mat);
        rimMesh.position.set(posX, type.h + studHeight, posZ);
        rimMesh.castShadow = true;
        group.add(rimMesh);
      }
    }

    return group;
  }

  private getModelForType(typeId: string): THREE.Group {
    if (this.brickModelCache.has(typeId)) {
      return this.brickModelCache.get(typeId)!;
    }
    const type = this.getBrickType(typeId);
    const procedural = this.generateProceduralBrickMesh(type);
    this.brickModelCache.set(typeId, procedural);
    return procedural;
  }

  public createBrick(colorHex: number, isGhost = false, rotation = 0, typeId = this.brickTypeId): THREE.Group {
    const group = new THREE.Group();
    const type = this.getBrickType(typeId);
    const baseModel = this.getModelForType(typeId);
    const model = baseModel.clone(true);

    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        const mesh = o as THREE.Mesh;
        if (isGhost) {
          mesh.material = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.5,
            wireframe: true,
          });
        } else {
          // Realistic high-grade ABS injection-molded plastic
          const isStudCap = mesh.name === 'STUD_CAP';
          mesh.material = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.18,
            metalness: 0.02,
            roughnessMap: this.plasticRoughnessMap,
            bumpMap: isStudCap ? this.studLogoBumpMap : this.plasticBumpMap,
            bumpScale: isStudCap ? 0.0035 : 0.0006,
          });
        }
        mesh.castShadow = !isGhost;
        mesh.receiveShadow = !isGhost;
      }
    });

    // Centering & base alignment
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.position.sub(center);
    model.position.y += type.h / 2;

    group.add(model);
    group.rotation.y = rotation * (Math.PI / 2);

    const isRotated = rotation % 2 !== 0;
    group.userData = {
      typeId: type.id,
      w: isRotated ? type.l : type.w,
      l: isRotated ? type.w : type.l,
      h: type.h,
    };

    return group;
  }

  private checkCollision(pos: THREE.Vector3, w: number, l: number, h: number, exclude: THREE.Group | null = null): boolean {
    const margin = 0.04;
    const b1 = new THREE.Box3().setFromCenterAndSize(
      pos,
      new THREE.Vector3(Math.max(0.08, w - margin), Math.max(0.08, h - margin), Math.max(0.08, l - margin))
    );

    for (const b of this.bricks) {
      if (b === exclude) continue;
      const bw = b.userData.w;
      const bl = b.userData.l;
      const bh = b.userData.h;
      const b2 = new THREE.Box3().setFromCenterAndSize(
        b.position,
        new THREE.Vector3(Math.max(0.08, bw - margin), Math.max(0.08, bh - margin), Math.max(0.08, bl - margin))
      );
      if (b1.intersectsBox(b2)) return true;
    }
    return false;
  }

  // Calculate snapped coordinate for a given coordinate & dimension along grid step (0.5m)
  private snapToGrid(coord: number, dim: number): number {
    const studs = Math.round(dim / BRICK_GRID_UNIT);
    if (studs % 2 === 1) {
      // Odd number of studs (e.g. 1 stud = 0.5m): center sits at half-grid points (..., -0.75, -0.25, 0.25, 0.75, ...)
      return (Math.round((coord - 0.25) / BRICK_GRID_UNIT) * BRICK_GRID_UNIT) + 0.25;
    } else {
      // Even number of studs (e.g. 2 studs = 1.0m): center sits at whole grid steps (..., -1.0, -0.5, 0.0, 0.5, 1.0, ...)
      return Math.round(coord / BRICK_GRID_UNIT) * BRICK_GRID_UNIT;
    }
  }

  public performAction() {
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = this.raycaster.intersectObjects([this.scene.getObjectByName('FLOOR')!, ...this.bricks], true);

    if (intersects.length > 0) {
      const hit = intersects[0];
      let target: THREE.Object3D | null = hit.object;
      while (target && target.parent && target.parent !== this.scene && target.name !== 'FLOOR') {
        target = target.parent;
      }

      if (!target) return;

      if (this.mode === 'BUILD') {
        const activeColor = COLORS[this.colorIdx]?.hex ?? 0x007aff;
        const b = this.createBrick(activeColor, false, this.rotation, this.brickTypeId);
        
        const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
        const p = hit.point.clone().add(normal.clone().multiplyScalar(0.08));

        // Snap coordinates according to brick dimensions and 0.5m grid
        const snapX = this.snapToGrid(p.x, b.userData.w);
        const snapZ = this.snapToGrid(p.z, b.userData.l);
        let snapY: number;

        if (target.name === 'FLOOR') {
          snapY = b.userData.h / 2;
        } else {
          if (Math.abs(normal.y) > 0.5) {
            if (normal.y > 0) {
              snapY = target.position.y + target.userData.h / 2 + b.userData.h / 2;
            } else {
              snapY = target.position.y - target.userData.h / 2 - b.userData.h / 2;
            }
          } else {
            snapY = target.position.y;
          }
        }

        const finalPos = new THREE.Vector3(snapX, snapY, snapZ);
        if (!this.checkCollision(finalPos, b.userData.w, b.userData.l, b.userData.h)) {
          b.position.copy(finalPos);
          this.scene.add(b);
          this.bricks.push(b);
          this.undoStack.push(b);
          playSnapSound(this.soundEnabled);
          this.spawnPlacementParticles(finalPos, activeColor);
          this.callbacks.onBrickCountChange(this.bricks.length);
          this.callbacks.onCanUndoChange(this.undoStack.length > 0);
        }
      } else if (this.mode === 'ERASE' && target.name !== 'FLOOR') {
        const brickGroup = target as THREE.Group;
        this.scene.remove(brickGroup);
        this.bricks = this.bricks.filter((x) => x !== brickGroup);
        this.undoStack = this.undoStack.filter((x) => x !== brickGroup);
        playRemoveSound(this.soundEnabled);
        this.callbacks.onBrickCountChange(this.bricks.length);
        this.callbacks.onCanUndoChange(this.undoStack.length > 0);
      }
    }
  }

  // Sparkling placement particle burst
  private spawnPlacementParticles(pos: THREE.Vector3, colorHex: number) {
    const count = 10;
    const pGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
    const pMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.95 });

    for (let i = 0; i < count; i++) {
      const pMesh = new THREE.Mesh(pGeo, pMat.clone());
      pMesh.position.copy(pos).add(new THREE.Vector3(
        (Math.random() - 0.5) * 0.4,
        (Math.random() - 0.1) * 0.25,
        (Math.random() - 0.5) * 0.4
      ));
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        Math.random() * 1.6 + 0.6,
        (Math.random() - 0.5) * 1.5
      );
      this.scene.add(pMesh);
      this.particles.push({ mesh: pMesh, vel, life: 0, maxLife: 0.4 });
    }
  }

  public undo() {
    const last = this.undoStack.pop();
    if (last) {
      this.scene.remove(last);
      this.bricks = this.bricks.filter((b) => b !== last);
      playRemoveSound(this.soundEnabled);
      this.callbacks.onBrickCountChange(this.bricks.length);
      this.callbacks.onCanUndoChange(this.undoStack.length > 0);
      this.updateGhost();
    }
  }

  public clearAll() {
    for (const b of this.bricks) {
      this.scene.remove(b);
    }
    this.bricks = [];
    this.undoStack = [];
    playRemoveSound(this.soundEnabled);
    this.callbacks.onBrickCountChange(0);
    this.callbacks.onCanUndoChange(false);
    this.updateGhost();
  }

  public rotate() {
    this.rotation = (this.rotation + 1) % 4;
    playRotateSound(this.soundEnabled);
    this.updateGhost();
  }

  public setMode(m: 'BUILD' | 'ERASE') {
    this.mode = m;
    this.updateGhost();
  }

  public setColorIdx(idx: number) {
    this.colorIdx = idx;
    this.updateGhost();
  }

  public setBrickType(typeId: string) {
    this.brickTypeId = typeId;
    this.updateGhost();
  }

  public elevate(delta: number) {
    this.playerHeight = Math.max(this.minPlayerHeight, Math.min(this.maxPlayerHeight, this.playerHeight + delta));
    if (this.callbacks.onHeightChange) {
      this.callbacks.onHeightChange(this.playerHeight);
    }
  }

  public resetCamera() {
    this.playerHeight = this.EYE_HEIGHT;
    if (this.callbacks.onHeightChange) {
      this.callbacks.onHeightChange(this.playerHeight);
    }
    this.camera.position.set(0, this.EYE_HEIGHT, 4.0);
    this.input.pitch = 0;
    this.input.yaw = 0;
    this.camera.quaternion.setFromEuler(new THREE.Euler(0, 0, 0, 'YXZ'));
  }

  public addBrickAt(pos: THREE.Vector3, typeId: string, colorIdx: number, rot = 0): THREE.Group {
    const color = COLORS[colorIdx] || COLORS[1];
    const b = this.createBrick(color.hex, false, rot, typeId);
    b.position.copy(pos);
    this.scene.add(b);
    this.bricks.push(b);
    return b;
  }

  public loadPreset(name: 'tower' | 'pyramid' | 'house') {
    this.clearAll();
    const H = 0.6; // Brick height

    if (name === 'tower') {
      // 4-level fortress tower matching human height (2.4m tall)
      for (let lvl = 0; lvl < 4; lvl++) {
        const y = lvl * H + H / 2;
        const color = lvl % 2 === 0 ? 1 : 4; // Blue & White
        this.addBrickAt(new THREE.Vector3(0, y, -0.5), 'bb3004', color, 0);
        this.addBrickAt(new THREE.Vector3(0, y, 0.5), 'bb3004', color, 0);
        this.addBrickAt(new THREE.Vector3(-0.75, y, 0), 'bb3005', color, 0);
        this.addBrickAt(new THREE.Vector3(0.75, y, 0), 'bb3005', color, 0);
      }
      // Crenellations / Battlements
      const topY = 4 * H + H / 2;
      this.addBrickAt(new THREE.Vector3(-0.75, topY, -0.5), 'bb3005', 0, 0);
      this.addBrickAt(new THREE.Vector3(0.75, topY, -0.5), 'bb3005', 0, 0);
      this.addBrickAt(new THREE.Vector3(-0.75, topY, 0.5), 'bb3005', 0, 0);
      this.addBrickAt(new THREE.Vector3(0.75, topY, 0.5), 'bb3005', 0, 0);
    } else if (name === 'pyramid') {
      // Tier 0 base: 4x 2x2 bricks
      this.addBrickAt(new THREE.Vector3(-0.5, H / 2, -0.5), 'bb3003', 2, 0);
      this.addBrickAt(new THREE.Vector3(0.5, H / 2, -0.5), 'bb3003', 2, 0);
      this.addBrickAt(new THREE.Vector3(-0.5, H / 2, 0.5), 'bb3003', 2, 0);
      this.addBrickAt(new THREE.Vector3(0.5, H / 2, 0.5), 'bb3003', 2, 0);

      // Tier 1: 2x2 brick centered
      this.addBrickAt(new THREE.Vector3(0, H + H / 2, 0), 'bb3003', 0, 0);

      // Tier 2: 1x1 brick pinnacle
      this.addBrickAt(new THREE.Vector3(0.25, 2 * H + H / 2, 0.25), 'bb3005', 4, 0);
    } else if (name === 'house') {
      // Cabin structure
      this.addBrickAt(new THREE.Vector3(0, H / 2, -1.0), 'bb3001', 3, 0);
      this.addBrickAt(new THREE.Vector3(0, H + H / 2, -1.0), 'bb3001', 3, 0);
      
      this.addBrickAt(new THREE.Vector3(-1.0, H / 2, 0), 'bb3004', 3, 1);
      this.addBrickAt(new THREE.Vector3(-1.0, H + H / 2, 0), 'bb3004', 3, 1);
      this.addBrickAt(new THREE.Vector3(1.0, H / 2, 0), 'bb3004', 3, 1);
      this.addBrickAt(new THREE.Vector3(1.0, H + H / 2, 0), 'bb3004', 3, 1);

      this.addBrickAt(new THREE.Vector3(-0.75, H / 2, 0.75), 'bb3005', 0, 0);
      this.addBrickAt(new THREE.Vector3(-0.75, H + H / 2, 0.75), 'bb3005', 0, 0);
      this.addBrickAt(new THREE.Vector3(0.75, H / 2, 0.75), 'bb3005', 0, 0);
      this.addBrickAt(new THREE.Vector3(0.75, H + H / 2, 0.75), 'bb3005', 0, 0);

      // Lintel & roof plate
      this.addBrickAt(new THREE.Vector3(0, 2 * H + H / 2, 0.75), 'bb3004', 2, 0);
      this.addBrickAt(new THREE.Vector3(0, 2 * H + 0.1, -0.25), 'bb3001', 0, 0);
    }

    this.undoStack = [];
    playSnapSound(this.soundEnabled);
    this.callbacks.onBrickCountChange(this.bricks.length);
    this.callbacks.onCanUndoChange(false);
    this.updateGhost();
  }

  public updateGhost() {
    if (this.ghost) {
      this.scene.remove(this.ghost);
      this.ghost = null;
    }
    if (this.mode !== 'BUILD') return;
    const colorHex = COLORS[this.colorIdx]?.hex ?? 0x007aff;
    this.ghost = this.createBrick(colorHex, true, this.rotation, this.brickTypeId);
    this.ghost.visible = false;
    this.scene.add(this.ghost);
  }

  // Set joystick move input from touch
  public setJoystickInput(forward: number, side: number) {
    this.input.forward = forward;
    this.input.side = side;
  }

  // Touch look delta
  public addTouchLook(dx: number, dy: number) {
    this.input.yaw -= dx * this.LOOK_SPEED;
    this.input.pitch -= dy * this.LOOK_SPEED;
    this.input.pitch = Math.max(-1.5, Math.min(1.5, this.input.pitch));
  }

  private setupWindowEvents() {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (['input', 'textarea', 'select'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) return;
      this.keysDown.add(e.code);

      if (e.code === 'KeyR') {
        this.rotate();
      } else if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey || !e.shiftKey)) {
        this.undo();
      } else if (e.code === 'KeyB') {
        this.setMode('BUILD');
      } else if (e.code === 'KeyE' || e.code === 'KeyX') {
        this.setMode('ERASE');
      } else if (e.code === 'PageUp') {
        this.elevate(0.5);
      } else if (e.code === 'PageDown') {
        this.elevate(-0.5);
      } else if (e.code === 'KeyQ') {
        this.elevate(-0.3);
      } else if (e.code === 'Space') {
        e.preventDefault();
        this.performAction();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      this.keysDown.delete(e.code);
    };

    // Desktop mouse look on drag
    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && e.target === this.renderer.domElement) {
        this.isMouseDown = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (this.isMouseDown) {
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.addTouchLook(dx, dy);
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    };

    const onMouseUp = () => {
      this.isMouseDown = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  public onResize() {
    if (!this.container || !this.camera || !this.renderer) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  private animate = () => {
    if (this.isDestroyed) return;
    this.animationFrameId = requestAnimationFrame(this.animate);

    // Process keyboard movement
    let kbForward = 0;
    let kbSide = 0;
    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp')) kbForward += 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown')) kbForward -= 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft')) kbSide -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) kbSide += 1;

    const totalForward = this.input.forward !== 0 ? this.input.forward : kbForward;
    const totalSide = this.input.side !== 0 ? this.input.side : kbSide;

    const df = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);
    df.y = 0;
    df.normalize();
    const ds = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    ds.y = 0;
    ds.normalize();

    this.camera.position.add(df.multiplyScalar(totalForward * this.MOVE_SPEED));
    this.camera.position.add(ds.multiplyScalar(totalSide * this.MOVE_SPEED));
    this.camera.position.y = this.playerHeight;
    this.camera.quaternion.setFromEuler(new THREE.Euler(this.input.pitch, this.input.yaw, 0, 'YXZ'));

    // Update particle sparkles
    const delta = 0.016;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;
      if (p.life >= p.maxLife) {
        this.scene.remove(p.mesh);
        p.mesh.geometry.dispose();
        this.particles.splice(i, 1);
      } else {
        p.vel.y -= 4.0 * delta; // gravity
        p.mesh.position.addScaledVector(p.vel, delta);
        (p.mesh.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - p.life / p.maxLife);
      }
    }

    // Update Ghost brick preview
    if (this.ghost && this.mode === 'BUILD') {
      this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
      const hits = this.raycaster.intersectObjects([this.scene.getObjectByName('FLOOR')!, ...this.bricks], true);
      if (hits.length > 0) {
        const hit = hits[0];
        let target: THREE.Object3D | null = hit.object;
        while (target && target.parent && target.parent !== this.scene && target.name !== 'FLOOR') {
          target = target.parent;
        }

        if (target) {
          const normal = hit.face ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld) : new THREE.Vector3(0, 1, 0);
          const p = hit.point.clone().add(normal.clone().multiplyScalar(0.08));

          const gx = this.snapToGrid(p.x, this.ghost.userData.w);
          const gz = this.snapToGrid(p.z, this.ghost.userData.l);
          let gy: number;

          if (target.name === 'FLOOR') {
            gy = this.ghost.userData.h / 2;
          } else {
            if (Math.abs(normal.y) > 0.5) {
              gy = normal.y > 0
                ? target.position.y + target.userData.h / 2 + this.ghost.userData.h / 2
                : target.position.y - target.userData.h / 2 - this.ghost.userData.h / 2;
            } else {
              gy = target.position.y;
            }
          }

          this.ghost.position.set(gx, gy, gz);
          this.ghost.visible = true;
        } else {
          this.ghost.visible = false;
        }
      } else {
        this.ghost.visible = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  };

  public destroy() {
    this.isDestroyed = true;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
