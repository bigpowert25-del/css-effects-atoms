import * as THREE from "../vendor/three.module.js";

const COLOR = {
  black: 0x050607,
  wall: 0x101213,
  floor: 0x0a0b0b,
  cyan: 0x66d4d8,
  red: 0x9b3026,
  beige: 0xb7a985,
  darkBeige: 0x4e493c,
  metal: 0x232627,
};

function seededRandom(seed = 47) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function drawScreenTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 768;
  const context = canvas.getContext("2d");

  const gradient = context.createRadialGradient(512, 360, 20, 512, 360, 620);
  gradient.addColorStop(0, "#276d70");
  gradient.addColorStop(0.52, "#0d3032");
  gradient.addColorStop(1, "#041112");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.strokeStyle = "rgba(105, 225, 230, 0.12)";
  context.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 64) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 64) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(canvas.width, y);
    context.stroke();
  }

  context.fillStyle = "rgba(2, 7, 7, 0.34)";
  for (let y = 0; y < canvas.height; y += 6) {
    context.fillRect(0, y, canvas.width, 2);
  }

  context.strokeStyle = "rgba(130, 227, 229, 0.28)";
  context.beginPath();
  context.moveTo(72, 126);
  context.lineTo(952, 126);
  context.stroke();

  context.font = "18px monospace";
  context.letterSpacing = "3px";
  context.fillStyle = "rgba(130, 227, 229, 0.46)";
  context.fillText("CRT / ONLINE", 72, 92);
  context.fillText("FRAME 001", 782, 92);

  context.strokeStyle = "rgba(130, 227, 229, 0.22)";
  context.lineWidth = 2;
  context.strokeRect(112, 175, 800, 420);
  context.beginPath();
  context.moveTo(512, 175);
  context.lineTo(512, 595);
  context.moveTo(112, 385);
  context.lineTo(912, 385);
  context.stroke();

  context.fillStyle = "rgba(130, 227, 229, 0.34)";
  context.fillRect(108, 171, 36, 3);
  context.fillRect(108, 171, 3, 36);
  context.fillRect(880, 596, 36, 3);
  context.fillRect(913, 563, 3, 36);

  context.fillStyle = "#a4372a";
  context.fillRect(72, 663, 74, 6);
  context.fillStyle = "rgba(231, 225, 207, 0.34)";
  context.fillText("SIGNAL LOCKED", 166, 671);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createBox(parent, {
  name,
  size,
  position,
  color,
  roughness = 0.8,
  metalness = 0,
  rotation = [0, 0, 0],
}) {
  const geometry = new THREE.BoxGeometry(...size);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function createDust(reducedMotion) {
  const random = seededRandom(138);
  const count = reducedMotion ? 70 : 180;
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (random() - 0.5) * 17;
    positions[index * 3 + 1] = random() * 8.5 - 0.6;
    positions[index * 3 + 2] = (random() - 0.5) * 13;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const material = new THREE.PointsMaterial({
    color: COLOR.beige,
    size: 0.018,
    transparent: true,
    opacity: 0.34,
    depthWrite: false,
  });
  const points = new THREE.Points(geometry, material);
  points.name = "floating dust";
  return points;
}

export function createScene(canvas, { reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(COLOR.black, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.86;
  renderer.shadowMap.enabled = !reducedMotion;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR.black);
  scene.fog = new THREE.FogExp2(COLOR.black, 0.045);

  const camera = new THREE.PerspectiveCamera(41, 1, 0.1, 80);
  const room = new THREE.Group();
  room.name = "CSS.FX dark studio";
  scene.add(room);

  createBox(room, {
    name: "floor",
    size: [19, 0.18, 17],
    position: [0, -1.05, 0],
    color: COLOR.floor,
    roughness: 0.96,
  });
  createBox(room, {
    name: "rear wall",
    size: [19, 10, 0.22],
    position: [0, 3.8, -6.2],
    color: COLOR.wall,
    roughness: 1,
  });
  createBox(room, {
    name: "left wall",
    size: [0.22, 10, 17],
    position: [-9.2, 3.8, 0],
    color: 0x090b0b,
    roughness: 1,
  });

  const desk = createBox(room, {
    name: "wide black desk",
    size: [10.5, 0.28, 4],
    position: [-0.6, 0, 0.8],
    color: 0x111313,
    roughness: 0.7,
    metalness: 0.24,
  });
  desk.castShadow = true;
  createBox(room, {
    name: "desk left leg",
    size: [0.28, 2.2, 3.4],
    position: [-5.3, -0.6, 0.8],
    color: 0x090a0a,
    metalness: 0.25,
  });
  createBox(room, {
    name: "desk right leg",
    size: [0.28, 2.2, 3.4],
    position: [4.1, -0.6, 0.8],
    color: 0x090a0a,
    metalness: 0.25,
  });

  // CRT: an original procedural terminal, built from local geometry and a canvas texture.
  const crt = new THREE.Group();
  crt.name = "beige CRT terminal";
  crt.position.set(-1.2, 0.12, -0.35);
  crt.rotation.y = -0.055;
  room.add(crt);

  createBox(crt, {
    name: "CRT housing",
    size: [4.5, 3.7, 2.65],
    position: [0, 2.08, 0],
    color: COLOR.beige,
    roughness: 0.83,
  });
  createBox(crt, {
    name: "CRT dark bezel",
    size: [3.84, 2.88, 0.17],
    position: [0, 2.17, 1.38],
    color: 0x111718,
    roughness: 0.48,
  });

  const screenTexture = drawScreenTexture();
  const screenMaterial = new THREE.MeshStandardMaterial({
    map: screenTexture,
    emissive: COLOR.cyan,
    emissiveMap: screenTexture,
    emissiveIntensity: 0.56,
    roughness: 0.22,
    metalness: 0.08,
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.48, 2.45), screenMaterial);
  screen.name = "curved CRT screen";
  screen.position.set(0, 2.19, 1.49);
  crt.add(screen);

  const screenGlass = new THREE.Mesh(
    new THREE.SphereGeometry(2.48, 32, 18, 0.83, 1.48, 0.85, 1.42),
    new THREE.MeshPhysicalMaterial({
      color: 0x4fb2b5,
      transparent: true,
      opacity: 0.05,
      roughness: 0.1,
      metalness: 0,
      clearcoat: 1,
      side: THREE.FrontSide,
    }),
  );
  screenGlass.name = "CRT curved glass";
  screenGlass.scale.set(1.08, 0.78, 0.35);
  screenGlass.position.set(0, 2.18, 1.72);
  screenGlass.rotation.x = Math.PI * 0.5;
  crt.add(screenGlass);

  createBox(crt, {
    name: "CRT neck",
    size: [1.15, 0.34, 1],
    position: [0, 0.11, 0.15],
    color: COLOR.darkBeige,
    roughness: 0.82,
  });
  createBox(crt, {
    name: "CRT stand",
    size: [2.2, 0.18, 1.65],
    position: [0, -0.09, 0.3],
    color: COLOR.beige,
    roughness: 0.86,
  });

  const keyboard = new THREE.Group();
  keyboard.name = "mechanical keyboard";
  keyboard.position.set(-1.2, 0.3, 2.65);
  keyboard.rotation.x = -0.06;
  keyboard.rotation.y = -0.055;
  room.add(keyboard);
  createBox(keyboard, {
    name: "keyboard base",
    size: [4.7, 0.25, 1.8],
    position: [0, 0, 0],
    color: COLOR.darkBeige,
    roughness: 0.9,
  });

  const keyGeometry = new THREE.BoxGeometry(0.28, 0.12, 0.27);
  const keyMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.beige,
    roughness: 0.78,
  });
  const keys = new THREE.InstancedMesh(keyGeometry, keyMaterial, 52);
  const keyMatrix = new THREE.Matrix4();
  let keyIndex = 0;
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 13; column += 1) {
      keyMatrix.makeTranslation(
        -1.9 + column * 0.32 + (row % 2) * 0.07,
        0.19,
        -0.58 + row * 0.36,
      );
      keys.setMatrixAt(keyIndex, keyMatrix);
      keyIndex += 1;
    }
  }
  keys.castShadow = true;
  keyboard.add(keys);

  // Venetian blinds: thin procedural slats carry the secondary red light.
  const blinds = new THREE.Group();
  blinds.name = "red Venetian blinds";
  blinds.position.set(4.65, 2.7, -5.88);
  blinds.rotation.z = -0.035;
  room.add(blinds);
  for (let index = 0; index < 20; index += 1) {
    createBox(blinds, {
      name: `Venetian blinds slat ${index + 1}`,
      size: [5.1, 0.085, 0.08],
      position: [0, 3.15 - index * 0.32, 0],
      color: index % 2 ? COLOR.red : 0x4e1915,
      roughness: 0.55,
      metalness: 0.25,
      rotation: [0.06, 0, 0],
    });
  }
  createBox(blinds, {
    name: "blind vertical edge",
    size: [0.08, 6.4, 0.1],
    position: [-2.61, 0.12, 0],
    color: 0x5b1c17,
    roughness: 0.6,
  });

  const shelf = createBox(room, {
    name: "floating equipment shelf",
    size: [4.5, 0.18, 1.35],
    position: [-5.7, 4.45, -5.5],
    color: COLOR.metal,
    roughness: 0.75,
    metalness: 0.3,
  });
  shelf.castShadow = true;
  createBox(room, {
    name: "archive box one",
    size: [1.1, 0.9, 0.85],
    position: [-6.5, 5.0, -5.45],
    color: 0x34312a,
  });
  createBox(room, {
    name: "archive box two",
    size: [1.45, 0.6, 0.9],
    position: [-4.9, 4.83, -5.45],
    color: 0x171b1b,
  });

  const cyanLight = new THREE.PointLight(COLOR.cyan, 27, 12, 2);
  cyanLight.name = "CRT cyan light";
  cyanLight.position.set(-1.1, 2.3, 2.25);
  cyanLight.castShadow = !reducedMotion;
  cyanLight.shadow.mapSize.set(512, 512);
  room.add(cyanLight);

  const redLight = new THREE.SpotLight(COLOR.red, 34, 18, 0.7, 0.78, 1.5);
  redLight.name = "blind red light";
  redLight.position.set(6.4, 5.8, -3.8);
  redLight.target.position.set(1.8, 0.5, 1.3);
  room.add(redLight, redLight.target);

  const topLight = new THREE.SpotLight(0xd9ccb1, 13, 17, 0.68, 0.88, 1.8);
  topLight.name = "warm ceiling pool";
  topLight.position.set(-4.8, 8.6, 0.3);
  topLight.target.position.set(-1.7, 0, 0.4);
  room.add(topLight, topLight.target);

  scene.add(new THREE.HemisphereLight(0x1b3435, 0x040404, 1.35));

  const dust = createDust(reducedMotion);
  room.add(dust);

  const cameraStart = new THREE.Vector3(8.5, 4.8, 13.8);
  const cameraEnd = new THREE.Vector3(-1.18, 2.27, 5.18);
  const lookStart = new THREE.Vector3(-0.7, 1.65, -0.7);
  const lookEnd = new THREE.Vector3(-1.18, 2.18, 0.55);
  const lookTarget = new THREE.Vector3();
  let active = true;
  let progress = 0;

  function setProgress(nextProgress) {
    progress = THREE.MathUtils.clamp(nextProgress, 0, 1);
    camera.position.lerpVectors(cameraStart, cameraEnd, progress);
    lookTarget.lerpVectors(lookStart, lookEnd, progress);
    camera.lookAt(lookTarget);
    camera.fov = THREE.MathUtils.lerp(41, 36, progress);
    camera.updateProjectionMatrix();

    crt.rotation.y = -0.055 + Math.sin(progress * Math.PI) * 0.012;
    room.rotation.y = THREE.MathUtils.lerp(0.014, 0, progress);
    renderer.toneMappingExposure = THREE.MathUtils.lerp(0.72, 0.95, progress);
  }

  function render(time = 0) {
    if (!active) return;
    if (!reducedMotion) {
      dust.rotation.y = time * 0.000012;
      dust.position.y = Math.sin(time * 0.0002) * 0.06;
      screenMaterial.emissiveIntensity =
        0.54 + Math.sin(time * 0.021) * 0.018 + Math.sin(time * 0.007) * 0.012;
    }
    renderer.render(scene, camera);
  }

  function resize(width = window.innerWidth, height = window.innerHeight) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, reducedMotion ? 1.5 : 2));
    renderer.setSize(safeWidth, safeHeight, false);
    camera.aspect = safeWidth / safeHeight;
    camera.updateProjectionMatrix();
  }

  function setActive(nextActive) {
    active = Boolean(nextActive);
  }

  function dispose() {
    active = false;
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];
      for (const material of materials) {
        if (!material) continue;
        for (const value of Object.values(material)) {
          if (value?.isTexture) value.dispose();
        }
        material.dispose();
      }
    });
    renderer.renderLists.dispose();
    renderer.dispose();
  }

  resize();
  setProgress(0);
  render(0);

  return {
    setProgress,
    setActive,
    resize,
    render,
    dispose,
    getProgress: () => progress,
    getRendererInfo: () => ({
      calls: renderer.info.render.calls,
      geometries: renderer.info.memory.geometries,
      textures: renderer.info.memory.textures,
    }),
  };
}
