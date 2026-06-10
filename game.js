// Clash of Runs 3D - Hand Cricket Game Engine

// --- STATE MANAGEMENT ---
let gameState = 'START'; // START, TOSS, PLAYING, BREAK, GAMEOVER
let oversMax = 1;
let wicketsMax = 1;
let difficulty = 'medium';

let currentInnings = 1;
let battingSide = 'player'; // 'player' or 'computer'
let soundEnabled = true;

// Match Stats
let score = { player: 0, computer: 0 };
let wickets = { player: 0, computer: 0 };
let balls = { player: 0, computer: 0 };
let target = 0; // Target to chase in Innings 2

// Current Ball Play state
let isBallInFlight = false;
let currentBallResult = null; // 'runs', 'out'
let runsScoredThisBall = 0;
let playerSelectedNum = 0;
let computerSelectedNum = 0;

// Commentary Phrases
const commentaryDb = {
  six: [
    "WHAT A SHOT! Cleared the ropes for a massive SIX!",
    "Out of the park! Majestic hitting!",
    "Into the stands! The crowd is electric!",
    "Smashed high and handsome for a SIX!"
  ],
  four: [
    "Splendid drive, races away to the boundary for four!",
    "Beautiful timing, boundary scored!",
    "Cracked away through the covers for four!",
    "Boundary! The fielder had absolutely no chance!"
  ],
  runs: [
    "Gently pushed into the gap for a single.",
    "Good running, they collect two runs.",
    "Driven down the ground for three runs.",
    "Sneaks through for a run."
  ],
  dot: [
    "Defended solid, no run scored.",
    "Beaten by the pace! Dot ball.",
    "Played back to the bowler.",
    "Swing and a miss!"
  ],
  out: [
    "BOWLED 'EM! Stumps shattered!",
    "OUT! Wickets flying everywhere!",
    "Clean bowled! A magnificent delivery!",
    "Shattered! What a breakthrough!"
  ]
};

// Player choice history for smart computer AI
let playerHistory = [];

// --- SOUND MANAGER (Web Audio Synthesizer) ---
class SoundManager {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }
  playToss() {
    if (!soundEnabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.35);
    
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }
  playBat() {
    if (!soundEnabled) return;
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1000, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(120, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.08);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }
  playWicket() {
    if (!soundEnabled) return;
    this.init();
    
    // Low rumble wood crash
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(30, this.ctx.currentTime + 0.45);
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    
    // High frequency clatter noise
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 550;
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.45);
    
    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
    noise.start();
    noise.stop(this.ctx.currentTime + 0.45);
  }
  playCheer() {
    if (!soundEnabled) return;
    this.init();
    const duration = 3.0;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.2;
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(750, this.ctx.currentTime + 0.6);
    filter.frequency.linearRampToValueAtTime(400, this.ctx.currentTime + duration);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.15, this.ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noise.start();
    noise.stop(this.ctx.currentTime + duration);
  }
}
const sound = new SoundManager();

// --- THREE.JS GRAPHICS ENGINE ---
let scene, camera, renderer, controls;
let stadiumGroup, pitch, creaseFront, creaseBack, boundaryLine;
let wicketsFront = [], wicketsBack = []; // references to stumps & bails
let ballMesh;
let playerHand, computerHand; // Hand structures
let coinMesh3D;

// Ball Trajectory animation variables
let ballAnimTimer = 0;
let ballTrajectoryType = 'idle'; // bowled, hit_six, hit_four, hit_runs, hit_defense, bowled_out, idle
let ballStartPos = new THREE.Vector3();
let ballMidPos = new THREE.Vector3();
let ballEndPos = new THREE.Vector3();
let ballExplosionTriggered = false;

// Physics tracking for wickets on OUT
let wicketPhysicsActive = false;
let flyingStumps = [];

function initGraphics() {
  const canvas = document.getElementById('gameCanvas');
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x03060f);
  scene.fog = new THREE.FogExp2(0x03060f, 0.015);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, -12); // Standard view behind batting wickets looking forward

  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // don't go below ground
  controls.minDistance = 5;
  controls.maxDistance = 60;
  controls.target.set(0, 1.2, 0);

  // Lights
  const ambient = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(ambient);

  // Directional Light acting as Stadium lights
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.85);
  dirLight.position.set(15, 30, 15);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;
  dirLight.shadow.bias = -0.0005;
  scene.add(dirLight);

  // Floodlights around the field
  const lightsCoords = [
    { x: -28, z: -28 }, { x: 28, z: -28 },
    { x: -28, z: 28 }, { x: 28, z: 28 }
  ];
  lightsCoords.forEach((coord, idx) => {
    const pointLight = new THREE.PointLight(0x00f0ff, 0.8, 40);
    pointLight.position.set(coord.x, 20, coord.z);
    scene.add(pointLight);

    // Visual model of floodlight tower
    const towerGeom = new THREE.CylinderGeometry(0.15, 0.4, 20, 8);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x111625, metalness: 0.8, roughness: 0.2 });
    const tower = new THREE.Mesh(towerGeom, towerMat);
    tower.position.set(coord.x, 10, coord.z);
    scene.add(tower);

    const headGeom = new THREE.BoxGeometry(2, 1, 2);
    const headMat = new THREE.MeshStandardMaterial({ color: 0x222a3d });
    const head = new THREE.Mesh(headGeom, headMat);
    head.position.set(coord.x, 20, coord.z);
    scene.add(head);
  });

  // Build the Stadium
  buildStadium();

  // Create Hands
  playerHand = createProceduralHand(0x00f0ff);
  computerHand = createProceduralHand(0xff007f);
  
  // Position hands side by side over the pitch for reveals
  playerHand.mesh.position.set(-1.8, 1.4, -3);
  playerHand.mesh.rotation.y = Math.PI / 6;
  scene.add(playerHand.mesh);

  computerHand.mesh.position.set(1.8, 1.4, -3);
  computerHand.mesh.rotation.y = -Math.PI / 6;
  scene.add(computerHand.mesh);

  // Create Ball
  const ballGeom = new THREE.SphereGeometry(0.11, 16, 16);
  const ballMat = new THREE.MeshStandardMaterial({ color: 0xcc1111, roughness: 0.3 });
  ballMesh = new THREE.Mesh(ballGeom, ballMat);
  ballMesh.castShadow = true;
  ballMesh.position.set(0, 0.12, 5); // start at bowling end
  scene.add(ballMesh);

  // Create Coin
  const coinGeom = new THREE.CylinderGeometry(0.5, 0.5, 0.06, 24);
  const coinMat = new THREE.MeshStandardMaterial({ color: 0xffd700, metalness: 0.9, roughness: 0.1 });
  coinMesh3D = new THREE.Mesh(coinGeom, coinMat);
  coinMesh3D.position.set(0, 0.05, -2);
  coinMesh3D.rotation.x = Math.PI / 2;
  coinMesh3D.visible = false;
  scene.add(coinMesh3D);

  // Set rest gestures
  setHandGesture(playerHand, 0);
  setHandGesture(computerHand, 0);

  // Trigger resize handler
  window.addEventListener('resize', onWindowResize);
}

function buildStadium() {
  stadiumGroup = new THREE.Group();

  // 1. Outfield (Grass Field)
  const outfieldGeom = new THREE.CylinderGeometry(30, 30, 0.4, 64);
  const grassMat = new THREE.MeshStandardMaterial({ color: 0x0a3014, roughness: 0.8 });
  const outfield = new THREE.Mesh(outfieldGeom, grassMat);
  outfield.position.y = -0.2;
  outfield.receiveShadow = true;
  stadiumGroup.add(outfield);

  // 2. Pitch
  const pitchGeom = new THREE.BoxGeometry(3.6, 0.42, 13);
  const clayMat = new THREE.MeshStandardMaterial({ color: 0xc4a482, roughness: 0.9 });
  pitch = new THREE.Mesh(pitchGeom, clayMat);
  pitch.position.y = -0.19;
  pitch.receiveShadow = true;
  stadiumGroup.add(pitch);

  // Creases (Thin overlays)
  const creaseGeom = new THREE.PlaneGeometry(3.6, 0.1);
  const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
  
  creaseFront = new THREE.Mesh(creaseGeom, whiteMat);
  creaseFront.rotation.x = -Math.PI / 2;
  creaseFront.position.set(0, 0.025, 4.5);
  stadiumGroup.add(creaseFront);

  creaseBack = new THREE.Mesh(creaseGeom, whiteMat);
  creaseBack.rotation.x = -Math.PI / 2;
  creaseBack.position.set(0, 0.025, -4.5);
  stadiumGroup.add(creaseBack);

  // 3. Boundary Rope / Ring
  const ropeGeom = new THREE.TorusGeometry(28, 0.25, 8, 48);
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x112244, roughness: 0.5 });
  boundaryLine = new THREE.Mesh(ropeGeom, ropeMat);
  boundaryLine.rotation.x = Math.PI / 2;
  boundaryLine.position.y = 0.05;
  stadiumGroup.add(boundaryLine);

  // 4. Stadium Stands (Glowing ring)
  const standsGeom = new THREE.CylinderGeometry(32, 36, 6, 48, 1, true);
  const standsMat = new THREE.MeshStandardMaterial({ 
    color: 0x050e1e, 
    side: THREE.DoubleSide,
    roughness: 0.7 
  });
  const stands = new THREE.Mesh(standsGeom, standsMat);
  stands.position.y = 2.5;
  stadiumGroup.add(stands);

  // Glowing neon rings on stands
  const ringGeom = new THREE.TorusGeometry(32.1, 0.15, 6, 48);
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x00ffb2 });
  const standRing = new THREE.Mesh(ringGeom, neonMat);
  standRing.rotation.x = Math.PI / 2;
  standRing.position.y = 5.4;
  stadiumGroup.add(standRing);

  // Create Wickets (Front / Z = 5.5 and Back / Z = -5.5)
  wicketsFront = createWicketSet(5.5);
  wicketsBack = createWicketSet(-5.5);

  scene.add(stadiumGroup);
}

function createWicketSet(zCoord) {
  const wicketGroup = new THREE.Group();
  wicketGroup.position.set(0, 0.02, zCoord);

  const stumpGeom = new THREE.CylinderGeometry(0.03, 0.03, 1.15, 8);
  const stumpMat = new THREE.MeshStandardMaterial({ color: 0xdd9c12, metalness: 0.3, roughness: 0.6 });
  const stumps = [];

  // Spacing: index 0 (left), 1 (middle), 2 (right)
  const stumpOffsets = [-0.14, 0, 0.14];
  stumpOffsets.forEach((xOffset, idx) => {
    const stump = new THREE.Mesh(stumpGeom, stumpMat);
    stump.position.set(xOffset, 1.15 / 2, 0);
    stump.castShadow = true;
    stump.receiveShadow = true;
    
    // Store original offsets for resets
    stump.userData = {
      origX: xOffset,
      origY: 1.15 / 2,
      origZ: 0,
      origRotX: 0,
      origRotY: 0,
      origRotZ: 0,
      name: `stump_${idx}`
    };
    
    wicketGroup.add(stump);
    stumps.push(stump);
  });

  // Bails
  const bailGeom = new THREE.CylinderGeometry(0.015, 0.015, 0.17, 8);
  const bails = [];
  const bailOffsets = [-0.07, 0.07];
  bailOffsets.forEach((xOffset, idx) => {
    const bail = new THREE.Mesh(bailGeom, stumpMat);
    bail.position.set(xOffset, 1.16, 0);
    bail.rotation.z = Math.PI / 2;
    bail.castShadow = true;
    
    bail.userData = {
      origX: xOffset,
      origY: 1.16,
      origZ: 0,
      origRotX: 0,
      origRotY: 0,
      origRotZ: Math.PI / 2,
      name: `bail_${idx}`
    };
    
    wicketGroup.add(bail);
    bails.push(bail);
  });

  stadiumGroup.add(wicketGroup);
  return { group: wicketGroup, stumps, bails };
}

function resetWickets() {
  wicketPhysicsActive = false;
  flyingStumps = [];

  // Reset Front
  wicketsFront.stumps.forEach(stump => resetWicketItem(stump));
  wicketsFront.bails.forEach(bail => resetWicketItem(bail));
  wicketsFront.group.position.set(0, 0.02, 5.5);
  wicketsFront.group.rotation.set(0,0,0);

  // Reset Back
  wicketsBack.stumps.forEach(stump => resetWicketItem(stump));
  wicketsBack.bails.forEach(bail => resetWicketItem(bail));
  wicketsBack.group.position.set(0, 0.02, -5.5);
  wicketsBack.group.rotation.set(0,0,0);
}

function resetWicketItem(item) {
  item.position.set(item.userData.origX, item.userData.origY, item.userData.origZ);
  item.rotation.set(item.userData.origRotX, item.userData.origRotY, item.userData.origRotZ);
}

// Procedural 3D Robot/Glowing Hand
function createProceduralHand(color) {
  const hand = new THREE.Group();
  const skinMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.3,
    metalness: 0.6,
    emissive: color,
    emissiveIntensity: 0.25
  });

  // Palm base
  const palmGeom = new THREE.BoxGeometry(1.2, 0.16, 1.0);
  const palm = new THREE.Mesh(palmGeom, skinMat);
  palm.position.y = 0.08;
  palm.castShadow = true;
  hand.add(palm);

  // Fingers configs
  const fingers = [];
  const fingerConfigs = [
    { name: 'thumb', x: -0.65, z: -0.15, len: 0.35, rotY: Math.PI / 4, isThumb: true },
    { name: 'index', x: -0.36, z: 0.45, len: 0.50, rotY: 0 },
    { name: 'middle', x: -0.06, z: 0.45, len: 0.54, rotY: 0 },
    { name: 'ring', x: 0.24, z: 0.45, len: 0.50, rotY: 0 },
    { name: 'pinky', x: 0.52, z: 0.45, len: 0.40, rotY: -Math.PI / 18 }
  ];

  fingerConfigs.forEach(cfg => {
    // Joint pivot attached at palm edge
    const pivot = new THREE.Group();
    pivot.position.set(cfg.x, 0.08, cfg.z);
    if (cfg.rotY) pivot.rotation.y = cfg.rotY;

    // Bone 1
    const b1Geom = new THREE.CylinderGeometry(0.06, 0.065, cfg.len, 8);
    b1Geom.translate(0, cfg.len / 2, 0); // shift pivot to base
    const bone1 = new THREE.Mesh(b1Geom, skinMat);
    bone1.rotation.x = Math.PI / 2; // Lie flat along Z index axis
    bone1.castShadow = true;
    pivot.add(bone1);

    // Bone 2 (nested)
    const b2Len = cfg.len * 0.8;
    const b2Geom = new THREE.CylinderGeometry(0.05, 0.055, b2Len, 8);
    b2Geom.translate(0, b2Len / 2, 0);
    const bone2 = new THREE.Mesh(b2Geom, skinMat);
    bone2.position.set(0, cfg.len, 0); // extend to end of bone 1
    bone2.castShadow = true;
    bone1.add(bone2);

    hand.add(pivot);
    fingers.push({
      name: cfg.name,
      pivot,
      bone1,
      bone2,
      targetRot1: Math.PI / 2,
      targetRot2: 0,
      isThumb: !!cfg.isThumb
    });
  });

  return { mesh: hand, fingers };
}

function setHandGesture(handData, number) {
  // Finger bent config: true = straight/unbent, false = bent/folded
  // Index of array: [thumb, index, middle, ring, pinky]
  let activeFingers = [false, false, false, false, false];

  switch (number) {
    case 1:
      activeFingers = [false, true, false, false, false];
      break;
    case 2:
      activeFingers = [false, true, true, false, false];
      break;
    case 3:
      activeFingers = [false, true, true, true, false];
      break;
    case 4:
      activeFingers = [false, true, true, true, true];
      break;
    case 5:
      activeFingers = [true, true, true, true, true];
      break;
    case 6:
      activeFingers = [true, false, false, false, false]; // thumb only
      break;
    case 0:
    default:
      // Fist/Closed state
      activeFingers = [false, false, false, false, false];
      break;
  }

  handData.fingers.forEach((finger, idx) => {
    const isStraight = activeFingers[idx];
    if (finger.isThumb) {
      // Custom folding angles for thumb
      finger.targetRot1 = isStraight ? Math.PI / 2.2 : Math.PI / 2 + 0.9;
      finger.targetRot2 = isStraight ? 0 : 0.8;
    } else {
      finger.targetRot1 = isStraight ? Math.PI / 2 : Math.PI / 2 + 1.4;
      finger.targetRot2 = isStraight ? 0 : 1.4;
    }
  });
}

function triggerStumpExplosion(isFront) {
  const wickets = isFront ? wicketsFront : wicketsBack;
  wicketPhysicsActive = true;
  flyingStumps = [];

  // Apply explosion physics vectors to stumps
  wickets.stumps.forEach((stump, idx) => {
    // Generate vectors in the coordinate system of the parent group
    const forceX = (Math.random() - 0.5) * 5;
    const forceY = 6 + Math.random() * 4;
    const forceZ = (isFront ? 1 : -1) * (4 + Math.random() * 5); // Fly outward
    
    flyingStumps.push({
      mesh: stump,
      velocity: new THREE.Vector3(forceX, forceY, forceZ),
      angVelocity: new THREE.Vector3((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10, 8 + Math.random() * 8),
      parentGroup: wickets.group
    });
  });

  // Apply vectors to bails
  wickets.bails.forEach((bail) => {
    const forceX = (Math.random() - 0.5) * 7;
    const forceY = 9 + Math.random() * 5;
    const forceZ = (isFront ? 1 : -1) * (5 + Math.random() * 6);
    
    flyingStumps.push({
      mesh: bail,
      velocity: new THREE.Vector3(forceX, forceY, forceZ),
      angVelocity: new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15),
      parentGroup: wickets.group
    });
  });
}

// Window resizing
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// --- GAME LOGIC MATCH ENGINE ---

// Generate Computer Choice based on game state & difficulty
function getComputerChoice() {
  if (difficulty === 'easy') {
    // Pure random 1-6
    return Math.floor(Math.random() * 6) + 1;
  }
  
  if (difficulty === 'medium') {
    // Slightly favor 4 and 6 when batting, try to block player's last choice when bowling
    if (battingSide === 'computer') {
      if (Math.random() < 0.3) return 4;
      if (Math.random() < 0.25) return 6;
      return Math.floor(Math.random() * 6) + 1;
    } else {
      // Bowling
      if (playerHistory.length > 0 && Math.random() < 0.2) {
        // Guess user plays their last choice again
        return playerHistory[playerHistory.length - 1];
      }
      return Math.floor(Math.random() * 6) + 1;
    }
  }

  // LEGEND Difficulty (hard)
  // Computer learns user preferences and counters them
  if (playerHistory.length > 3) {
    // Calculate most frequent player inputs
    const freq = {1:0, 2:0, 3:0, 4:0, 5:0, 6:0};
    playerHistory.forEach(num => freq[num]++);
    let mostFreq = 6;
    let maxCount = 0;
    for(let k=1; k<=6; k++) {
      if (freq[k] > maxCount) {
        maxCount = freq[k];
        mostFreq = k;
      }
    }

    if (battingSide === 'player') {
      // Computer is bowling - high chance of picking user's favorite number
      if (Math.random() < 0.35) {
        return mostFreq;
      }
      // Counter player's last choice
      if (Math.random() < 0.25) {
        return playerHistory[playerHistory.length - 1];
      }
    } else {
      // Computer is batting - pick numbers user is NOT bowling
      if (Math.random() < 0.35) {
        // Pick numbers that are NOT the user's most frequent
        let nonFavs = [1,2,3,4,5,6].filter(n => n !== mostFreq);
        return nonFavs[Math.floor(Math.random() * nonFavs.length)];
      }
    }
  }

  // Fallback
  return Math.floor(Math.random() * 6) + 1;
}

// Delivery click action
function handleInputSelection(num) {
  if (isBallInFlight || gameState !== 'PLAYING') return;
  isBallInFlight = true;

  playerSelectedNum = num;
  playerHistory.push(num);
  if (playerHistory.length > 15) playerHistory.shift();

  computerSelectedNum = getComputerChoice();

  // Determine Outcomes
  let runs = 0;
  let isOut = false;

  if (battingSide === 'player') {
    if (playerSelectedNum === computerSelectedNum) {
      isOut = true;
    } else {
      runs = playerSelectedNum;
    }
  } else {
    // Computer batting
    if (playerSelectedNum === computerSelectedNum) {
      isOut = true;
    } else {
      runs = computerSelectedNum;
    }
  }

  currentBallResult = isOut ? 'out' : 'runs';
  runsScoredThisBall = runs;

  // Visual Update: Display choices on GUI cards
  document.getElementById('playerHandVal').innerText = playerSelectedNum;
  document.getElementById('computerHandVal').innerText = computerSelectedNum;

  // Setup Ball Trajectory & Trigger Animation
  setupBallAnimation(isOut, runs);
}

function setupBallAnimation(isOut, runs) {
  ballAnimTimer = 0;
  ballExplosionTriggered = false;

  // Start position: Z = 5.5 (bowling wickets)
  ballStartPos.set(0, 0.12, 5.5);
  
  // Mid point for bounce bounce: Z = 0
  ballMidPos.set(0, 0.12, 0);

  // End position: Z = -5.5 (batting crease)
  ballEndPos.set(0, 0.12, -5.5);

  if (isOut) {
    ballTrajectoryType = 'bowled_out';
  } else {
    if (runs === 6) ballTrajectoryType = 'hit_six';
    else if (runs === 4) ballTrajectoryType = 'hit_four';
    else if (runs === 0) ballTrajectoryType = 'hit_defense';
    else ballTrajectoryType = 'hit_runs';
  }

  // Animate hands to return to fist, then during flight they will show gestures
  setHandGesture(playerHand, 0);
  setHandGesture(computerHand, 0);
}

function processScoresAndStats() {
  const isOut = currentBallResult === 'out';
  const runs = runsScoredThisBall;

  if (battingSide === 'player') {
    balls.player++;
    if (isOut) {
      wickets.player++;
      sound.playWicket();
      addCommentary(`OUT! Player clean bowled. Smashed for ${playerSelectedNum}!`, 'alert-out');
      shakeScreen();
    } else {
      score.player += runs;
      sound.playBat();
      if (runs === 6) {
        sound.playCheer();
        addCommentary(`SIX! Fantastic hook shot by Player for 6!`, 'alert-six');
      } else if (runs === 4) {
        sound.playCheer();
        addCommentary(`FOUR! Exquisite placement for boundary.`, 'highlight');
      } else {
        addCommentary(`Player scores ${runs} run(s).`);
      }
    }
  } else {
    // Computer Batting
    balls.computer++;
    if (isOut) {
      wickets.computer++;
      sound.playWicket();
      addCommentary(`OUT! Computer dismissed! Player matches with ${playerSelectedNum}!`, 'alert-out');
      shakeScreen();
    } else {
      score.computer += runs;
      sound.playBat();
      if (runs === 6) {
        sound.playCheer();
        addCommentary(`SIX! Computer launches it over long-on!`, 'alert-six');
      } else if (runs === 4) {
        sound.playCheer();
        addCommentary(`FOUR! Boundary slapped through the off-side.`, 'highlight');
      } else {
        addCommentary(`Computer scores ${runs} run(s).`);
      }
    }
  }

  updateHUD();
  checkInningsOverConditions();
}

function updateHUD() {
  const battingTeam = battingSide === 'player' ? 'PLAYER' : 'COMPUTER';
  const roleText = battingSide === 'player' ? 'BATTING' : 'BOWLING';
  
  document.getElementById('battingTeamName').innerText = battingTeam;
  document.getElementById('currentRoleBadge').innerText = roleText;
  document.getElementById('currentRoleBadge').className = `badge-role ${roleText.toLowerCase()}`;

  const currentScore = battingSide === 'player' ? score.player : score.computer;
  const currentWickets = battingSide === 'player' ? wickets.player : wickets.computer;
  const currentBalls = battingSide === 'player' ? balls.player : balls.computer;

  document.getElementById('hudScore').innerText = currentScore;
  document.getElementById('hudWickets').innerText = currentWickets;

  // Format overs (balls -> overs)
  const completedOvers = Math.floor(currentBalls / 6);
  const remainingBalls = currentBalls % 6;
  document.getElementById('hudOvers').innerText = `${completedOvers}.${remainingBalls} / ${oversMax}`;

  // Innings 2 specific targets
  if (currentInnings === 2) {
    document.getElementById('targetBox').style.visibility = 'visible';
    document.getElementById('hudTarget').innerText = target;

    document.getElementById('chaseInfoBox').style.display = 'block';
    
    const targetToWin = target;
    const runsNeeded = targetToWin - currentScore;
    const maxInningsBalls = oversMax * 6;
    const ballsRemaining = maxInningsBalls - currentBalls;

    if (runsNeeded > 0) {
      const teamChasing = battingSide === 'player' ? 'Player' : 'Computer';
      document.getElementById('hudChaseMessage').innerText = `${teamChasing} needs ${runsNeeded} runs in ${ballsRemaining} ball(s)`;
    } else {
      document.getElementById('hudChaseMessage').innerText = `Target Chased!`;
    }
  } else {
    document.getElementById('targetBox').style.visibility = 'hidden';
    document.getElementById('chaseInfoBox').style.display = 'none';
  }
}

function checkInningsOverConditions() {
  const currentBalls = battingSide === 'player' ? balls.player : balls.computer;
  const currentWickets = battingSide === 'player' ? wickets.player : wickets.computer;
  const maxBalls = oversMax * 6;

  let inningsEnded = false;

  // Innings 1 check
  if (currentInnings === 1) {
    if (currentWickets >= wicketsMax || currentBalls >= maxBalls) {
      inningsEnded = true;
    }
  } else {
    // Innings 2 check
    const currentScore = battingSide === 'player' ? score.player : score.computer;
    if (currentScore >= target) {
      // Chased target!
      inningsEnded = true;
    } else if (currentWickets >= wicketsMax || currentBalls >= maxBalls) {
      // All wickets down or overs completed but target not reached
      inningsEnded = true;
    }
  }

  if (inningsEnded) {
    setTimeout(() => {
      endInningsTransition();
    }, 1200);
  }
}

function endInningsTransition() {
  if (currentInnings === 1) {
    // 1st innings complete
    const firstInningsScore = battingSide === 'player' ? score.player : score.computer;
    const firstInningsWickets = battingSide === 'player' ? wickets.player : wickets.computer;
    const firstInningsBalls = battingSide === 'player' ? balls.player : balls.computer;
    const oCompleted = `${Math.floor(firstInningsBalls / 6)}.${firstInningsBalls % 6}`;

    target = firstInningsScore + 1;
    
    // Switch state
    gameState = 'BREAK';
    switchScreen('inningsBreakScreen');

    // Fill Summary
    const teamName = battingSide === 'player' ? 'Player' : 'Computer';
    document.getElementById('breakInningsTitle').innerText = `${teamName} Innings`;
    document.getElementById('breakInningsScore').innerText = `${firstInningsScore}/${firstInningsWickets}`;
    document.getElementById('breakInningsSummary').innerText = `Overs: ${oCompleted} of ${oversMax}`;
    document.getElementById('breakTargetValue').innerText = target;

    const chasingTeam = battingSide === 'player' ? 'Computer' : 'Player';
    document.getElementById('breakChaseRequirements').innerText = `${chasingTeam} needs ${target} runs in ${oversMax * 6} balls to win`;

    // Flip roles
    battingSide = battingSide === 'player' ? 'computer' : 'player';
  } else {
    // Match fully over
    gameState = 'GAMEOVER';
    switchScreen('gameOverScreen');

    // Determine Winner
    const scoreP = score.player;
    const scoreC = score.computer;
    
    let header = "MATCH TIED!";
    if (scoreP > scoreC) {
      header = "VICTORY! PLAYER WINS!";
    } else if (scoreC > scoreP) {
      header = "DEFEAT! COMPUTER WINS!";
    }
    
    document.getElementById('gameOverResultHeader').innerText = header;

    // Fill summary details
    const oP = `${Math.floor(balls.player / 6)}.${balls.player % 6}`;
    const oC = `${Math.floor(balls.computer / 6)}.${balls.computer % 6}`;
    
    document.getElementById('summaryPlayerScore').innerText = `${scoreP}/${wickets.player}`;
    document.getElementById('summaryPlayerDetails').innerText = `Overs: ${oP}`;
    document.getElementById('summaryComputerScore').innerText = `${scoreC}/${wickets.computer}`;
    document.getElementById('summaryComputerDetails').innerText = `Overs: ${oC}`;
  }
}

function startSecondInnings() {
  currentInnings = 2;
  gameState = 'PLAYING';
  switchScreen('gameplayHud');
  
  // Clear choices
  document.getElementById('playerHandVal').innerText = '-';
  document.getElementById('computerHandVal').innerText = '-';

  resetWickets();
  updateHUD();
  addCommentary(`Second Innings starts! Target is ${target} runs.`, 'highlight');
  
  // Pivot camera to center back for chase
  camera.position.set(0, 5, -12);
  controls.target.set(0, 1.2, 0);
}

function resetGame() {
  currentInnings = 1;
  gameState = 'START';
  score = { player: 0, computer: 0 };
  wickets = { player: 0, computer: 0 };
  balls = { player: 0, computer: 0 };
  target = 0;
  playerHistory = [];

  resetWickets();
  switchScreen('startScreen');
  
  // Clear commentary
  const commentaryList = document.getElementById('commentaryList');
  commentaryList.innerHTML = `<div class="commentary-item highlight">Welcome to the Clash of Runs Stadium!</div>`;
  
  // Orbit view
  camera.position.set(0, 10, -25);
  controls.target.set(0, 1.2, 0);
}

// GUI Commentary helper
function addCommentary(msg, styleClass = '') {
  const commList = document.getElementById('commentaryList');
  const item = document.createElement('div');
  item.className = `commentary-item ${styleClass}`;
  item.innerText = msg;
  commList.prepend(item);

  // Keep max 20 items
  while (commList.children.length > 20) {
    commList.removeChild(commList.lastChild);
  }
}

// Helpers for screen visibility switches
function switchScreen(screenId) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(s => s.classList.remove('active'));
  document.getElementById(screenId).classList.add('active');
}

function shakeScreen() {
  const overlay = document.getElementById('uiOverlay');
  overlay.classList.add('shake-anim');
  setTimeout(() => {
    overlay.classList.remove('shake-anim');
  }, 500);
}

// --- COIN TOSS ANIMATION LOGIC ---
let coinFlipTimer = 0;
let isCoinFlipping = false;
let userTossChoice = 'heads';

function startCoinTossFlow() {
  gameState = 'TOSS';
  switchScreen('tossScreen');
  
  // Show 3D coin, position camera closer
  coinMesh3D.visible = true;
  coinMesh3D.position.set(0, 0.5, -2);
  
  camera.position.set(0, 3, -6);
  controls.target.copy(coinMesh3D.position);
}

function handleFlipCoin() {
  if (isCoinFlipping) return;
  isCoinFlipping = true;
  sound.playToss();

  document.getElementById('flipCoinBtn').classList.add('hidden');
  document.getElementById('tossAnimationContainer').classList.remove('hidden');
  document.getElementById('tossResultContainer').classList.add('hidden');

  coinFlipTimer = 0;
  
  // Outcome
  const coinLanding = Math.random() < 0.5 ? 'heads' : 'tails';
  const playerWonToss = userTossChoice === coinLanding;

  setTimeout(() => {
    // End toss spin after 1.8 seconds
    isCoinFlipping = false;
    document.getElementById('tossAnimationContainer').classList.add('hidden');
    document.getElementById('tossResultContainer').classList.remove('hidden');

    // Land position
    coinMesh3D.position.y = 0.055;
    if (coinLanding === 'heads') {
      coinMesh3D.rotation.x = Math.PI / 2; // Flat show H
    } else {
      coinMesh3D.rotation.x = -Math.PI / 2; // Flat show T
    }

    const resultHeader = document.getElementById('tossResultHeader');
    const resultText = document.getElementById('tossResultText');
    const decisionBox = document.getElementById('tossDecisionContainer');

    resultHeader.innerText = `TOSS RESULT: ${coinLanding.toUpperCase()}`;

    if (playerWonToss) {
      resultText.innerText = "You have won the toss! Choose whether you wish to Bat or Bowl first.";
      decisionBox.classList.remove('hidden');
    } else {
      // Computer wins toss and decides
      const compDecidesBat = Math.random() < 0.5;
      decisionBox.classList.add('hidden');
      
      if (compDecidesBat) {
        resultText.innerText = "Computer won the toss and decided to BAT first.";
        battingSide = 'computer';
      } else {
        resultText.innerText = "Computer won the toss and decided to BOWL first.";
        battingSide = 'player';
      }

      // Add a Continue button instead of Decision buttons
      const continueBtn = document.createElement('button');
      continueBtn.id = 'tossContinueBtn';
      continueBtn.className = 'primary-btn';
      continueBtn.innerText = 'PROCEED TO MATCH';
      continueBtn.style.marginTop = '16px';
      continueBtn.onclick = () => {
        continueBtn.remove();
        startMatchPlay();
      };
      document.getElementById('tossResultContainer').appendChild(continueBtn);
    }
  }, 1800);
}

function startMatchPlay() {
  gameState = 'PLAYING';
  coinMesh3D.visible = false;
  switchScreen('gameplayHud');

  // Reset stats
  score = { player: 0, computer: 0 };
  wickets = { player: 0, computer: 0 };
  balls = { player: 0, computer: 0 };
  currentInnings = 1;

  resetWickets();
  updateHUD();

  addCommentary(`Match starts! 1st Innings: ${battingSide.toUpperCase()} is batting.`, 'highlight');

  // Adjust Camera to face crease for match play
  camera.position.set(0, 5, -12);
  controls.target.set(0, 1.2, 0);
}

// --- RENDER LOOP & ANIMATIONS ---
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  // 1. Damping and orbit controls update
  controls.update();

  // 2. Slow rotate camera around stadium when in START mode
  if (gameState === 'START') {
    const time = clock.getElapsedTime() * 0.08;
    camera.position.x = Math.sin(time) * 25;
    camera.position.z = Math.cos(time) * 25;
    camera.position.y = 8 + Math.sin(time * 0.5) * 2;
    camera.lookAt(0, 1, 0);
  }

  // 3. 3D Coin Flipping animation
  if (isCoinFlipping) {
    coinFlipTimer += delta;
    // Rapid spin
    coinMesh3D.rotation.x += 15 * delta;
    coinMesh3D.rotation.y += 8 * delta;
    // Go up and down
    coinMesh3D.position.y = 0.5 + Math.sin((coinFlipTimer / 1.8) * Math.PI) * 3;
  }

  // 4. Ball Flight Path Physics
  if (isBallInFlight) {
    ballAnimTimer += delta * 0.85; // Speed multiplier for delivery animation

    if (ballAnimTimer < 0.5) {
      // PHASE 1: Bowling Release to Pitch Bounce
      const t = ballAnimTimer / 0.5; // normalized 0 to 1
      ballMesh.position.x = THREE.MathUtils.lerp(ballStartPos.x, ballMidPos.x, t);
      ballMesh.position.z = THREE.MathUtils.lerp(ballStartPos.z, ballMidPos.z, t);
      // Parabolic Y arc (bounce peak)
      ballMesh.position.y = 1.0 + Math.sin(t * Math.PI) * 1.5;
    } 
    else if (ballAnimTimer < 1.0) {
      // PHASE 2: Bounce to Batsman Crease
      const t = (ballAnimTimer - 0.5) / 0.5; // normalized 0 to 1
      ballMesh.position.x = THREE.MathUtils.lerp(ballMidPos.x, ballEndPos.x, t);
      ballMesh.position.z = THREE.MathUtils.lerp(ballMidPos.z, ballEndPos.z, t);
      // Low bounce arc
      ballMesh.position.y = 0.12 + Math.sin(t * Math.PI) * 0.8;

      // Reveal finger gestures halfway through delivery flight (around t = 0.4 in Phase 2)
      if (t > 0.4 && playerHand.fingers[0].targetRot1 === Math.PI / 2) {
        setHandGesture(playerHand, playerSelectedNum);
        setHandGesture(computerHand, computerSelectedNum);
      }
    } 
    else if (ballAnimTimer < 2.0) {
      // PHASE 3: Bat Impact and flight outcome
      const t = ballAnimTimer - 1.0; // normalized 0 to 1

      if (ballTrajectoryType === 'bowled_out') {
        // Hits stumps at Z = -5.5
        ballMesh.position.z = -5.5 - Math.sin(t * Math.PI * 0.5) * 0.5;
        ballMesh.position.y = 0.5 - t * 0.2;
        
        if (!ballExplosionTriggered) {
          ballExplosionTriggered = true;
          triggerStumpExplosion(false); // shatter wicketsBack
        }
      } 
      else if (ballTrajectoryType === 'hit_six') {
        // High arching six into the stands
        ballMesh.position.x = Math.sin(t * Math.PI * 0.3) * 15;
        ballMesh.position.z = -5.5 - t * 25;
        ballMesh.position.y = 0.8 + Math.sin(t * Math.PI) * 12; // massive arc Y
      } 
      else if (ballTrajectoryType === 'hit_four') {
        // Speeding along the ground to boundary
        ballMesh.position.x = (Math.random() - 0.5) * 10 * t;
        ballMesh.position.z = -5.5 - t * 23;
        ballMesh.position.y = 0.12 + Math.abs(Math.sin(t * Math.PI * 5) * 0.3) * (1 - t); // bounciness decay
      } 
      else if (ballTrajectoryType === 'hit_runs') {
        // Medium runs flight path
        const scaleDist = runsScoredThisBall * 4;
        ballMesh.position.x = Math.sin(t * Math.PI * 0.5) * scaleDist;
        ballMesh.position.z = -5.5 - t * scaleDist;
        ballMesh.position.y = 0.8 + Math.sin(t * Math.PI) * 3 - t * 3.5;
        if (ballMesh.position.y < 0.12) ballMesh.position.y = 0.12;
      } 
      else if (ballTrajectoryType === 'hit_defense') {
        // Defended ball drops dead in front
        ballMesh.position.z = -5.5 - Math.sin(t * Math.PI * 0.5) * 1.5;
        ballMesh.position.y = 0.12 + Math.abs(Math.sin(t * Math.PI * 2) * 0.4) * (1 - t);
      }
    } 
    else {
      // Delivery sequence completed
      isBallInFlight = false;
      ballTrajectoryType = 'idle';
      
      // Calculate scores
      processScoresAndStats();
      
      // Keep gestures visible for a moment then reset
      setTimeout(() => {
        if (!isBallInFlight) {
          setHandGesture(playerHand, 0);
          setHandGesture(computerHand, 0);
          resetWickets();
          ballMesh.position.set(0, 0.12, 5.5); // ball back to bowler
        }
      }, 1000);
    }
  }

  // 5. Update joints on hands (interpolate rotations for bending)
  updateHandInterpolations(playerHand, delta);
  updateHandInterpolations(computerHand, delta);

  // 6. Update Wickets flying physics
  if (wicketPhysicsActive) {
    updateWicketPhysics(delta);
  }

  renderer.render(scene, camera);
}

function updateHandInterpolations(handData, delta) {
  handData.fingers.forEach(finger => {
    finger.bone1.rotation.x += (finger.targetRot1 - finger.bone1.rotation.x) * 12 * delta;
    finger.bone2.rotation.x += (finger.targetRot2 - finger.bone2.rotation.x) * 12 * delta;
  });
}

function updateWicketPhysics(delta) {
  flyingStumps.forEach(item => {
    // Apply gravity
    item.velocity.y -= 9.8 * delta;
    
    // Update translation
    item.mesh.position.x += item.velocity.x * delta;
    item.mesh.position.y += item.velocity.y * delta;
    item.mesh.position.z += item.velocity.z * delta;

    // Update rotation
    item.mesh.rotation.x += item.angVelocity.x * delta;
    item.mesh.rotation.y += item.angVelocity.y * delta;
    item.mesh.rotation.z += item.angVelocity.z * delta;

    // Collision with ground boundary
    if (item.mesh.position.y < 0.05) {
      item.mesh.position.y = 0.05;
      item.velocity.set(0, 0, 0);
      item.angVelocity.set(0, 0, 0);
    }
  });
}

// --- INITIALIZE INTERACTION BINDINGS ---
document.addEventListener('DOMContentLoaded', () => {
  initGraphics();
  animate();

  // 1. Sound Toggler
  const soundBtn = document.getElementById('soundToggle');
  const soundOn = document.getElementById('soundOnIcon');
  const soundOff = document.getElementById('soundOffIcon');
  
  soundBtn.addEventListener('click', () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
      soundOn.classList.remove('hidden');
      soundOff.classList.add('hidden');
      sound.init();
    } else {
      soundOn.classList.add('hidden');
      soundOff.classList.remove('hidden');
    }
  });

  // 2. Start screen configuration buttons
  setupToggleGroup('oversSelector', val => { oversMax = parseInt(val); });
  setupToggleGroup('wicketsSelector', val => { wicketsMax = parseInt(val); });
  setupToggleGroup('difficultySelector', val => { difficulty = val; });

  document.getElementById('startGameBtn').addEventListener('click', () => {
    sound.init();
    startCoinTossFlow();
  });

  // 3. Toss configuration Buttons
  const tHeads = document.getElementById('tossHeadsBtn');
  const tTails = document.getElementById('tossTailsBtn');

  tHeads.addEventListener('click', () => {
    userTossChoice = 'heads';
    tHeads.classList.add('active');
    tTails.classList.remove('active');
  });

  tTails.addEventListener('click', () => {
    userTossChoice = 'tails';
    tTails.classList.add('active');
    tHeads.classList.remove('active');
  });

  document.getElementById('flipCoinBtn').addEventListener('click', () => {
    handleFlipCoin();
  });

  document.getElementById('chooseBatBtn').addEventListener('click', () => {
    battingSide = 'player';
    startMatchPlay();
  });

  document.getElementById('chooseBowlBtn').addEventListener('click', () => {
    battingSide = 'computer';
    startMatchPlay();
  });

  // 4. Gameplay input number clicks
  const runButtons = document.querySelectorAll('.run-btn');
  runButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      const numVal = parseInt(e.target.getAttribute('data-value'));
      handleInputSelection(numVal);
    });
  });

  // 5. Innings Break Continue
  document.getElementById('startSecondInningsBtn').addEventListener('click', () => {
    startSecondInnings();
  });

  // 6. Game Over Restart
  document.getElementById('restartGameBtn').addEventListener('click', () => {
    resetGame();
  });
});

function setupToggleGroup(containerId, callback) {
  const container = document.getElementById(containerId);
  const buttons = container.querySelectorAll('.toggle-btn');
  
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      callback(btn.getAttribute('data-value'));
    });
  });
}
