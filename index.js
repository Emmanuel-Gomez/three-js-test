import * as THREE from "three";
import TWEEN from "three/addons/libs/tween.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let scene, renderer, camera, animationGroup;
let model, mixer, clock;
let currentAvatar;
let idleAction;

const bigSpotlight = new THREE.SpotLight(0xf6f6f6, 1);
bigSpotlight.position.set(1, 3, 2);
bigSpotlight.castShadow = true;
bigSpotlight.shadow.bias = -0.001;
bigSpotlight.penumbra = 0.1;
bigSpotlight.decay = 1;
bigSpotlight.distance = 0;
bigSpotlight.angle = 0.5;

const spotLight1 = createSpotlight(0xff7f00);
const spotLight2 = createSpotlight(0x00ff7f);
const spotLight3 = createSpotlight(0x7f00ff);

let lightHelper1, lightHelper2, lightHelper3;

async function init() {
  const container = document.getElementById("container");
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // Init camera and controls
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  const controls = new OrbitControls(camera, renderer.domElement);
  camera.position.set(0.5, 2, 2);
  controls.target.set(0, 1, 0);
  controls.update();

  clock = new THREE.Clock();
  animationGroup = new THREE.AnimationObjectGroup();
  mixer = new THREE.AnimationMixer(animationGroup);

  scene = new THREE.Scene();

  spotLight1.position.set(1.5, 5, 4.5);
  spotLight2.position.set(0, 5, 3.5);
  spotLight3.position.set(-1.5, 5, 4.5);

  scene.add(bigSpotlight, spotLight1, spotLight2, spotLight3);

  const mesh = new THREE.Mesh(
    new THREE.CircleGeometry(4, 60),
    new THREE.MeshPhongMaterial()
  );
  mesh.rotation.x = -Math.PI / 2;

  mesh.receiveShadow = true;
  scene.add(mesh);

  // Load default avatar
  currentAvatar = await loadAvatar("./textures/model.glb");

  // Load default animation
  const loader = new GLTFLoader();
  loader.load("./textures/model-dance.glb", function (gltf) {
    const clip = filterAnimation(gltf.animations[0]);
    const action = mixer.clipAction(clip);
    idleAction = action;
    idleAction.play();
  });
  window.addEventListener("resize", onWindowResize);
  animate();
}

async function loadAvatar(url) {
  const loader = new GLTFLoader();
  const gltf = await loader.loadAsync(url);
  model = gltf.scene;
  scene.add(model);

  model.traverse(function (object) {
    if (object.isMesh) {
      object.castShadow = true;
      object.receiveShadow = true;
      object.material.envMapIntensity = 0.3;
      // Turn off mipmaps to make textures look crispier (only use if texture resolution is 1k)
      if (object.material.map && !object.material.name.includes("hair")) {
        object.material.map.generateMipmaps = false;
      }
    }
  });

  animationGroup.add(model);

  return model;
}

function filterAnimation(animation) {
  animation.tracks = animation.tracks.filter((track) => {
    const name = track.name;
    return name.endsWith("Hips.position") || name.endsWith(".quaternion");
  });
  return animation;
}

function createSpotlight(color) {
  const newObj = new THREE.SpotLight(color, 10);

  newObj.castShadow = true;
  newObj.angle = 0.3;
  newObj.penumbra = 0.2;
  newObj.decay = 2;
  newObj.distance = 50;

  return newObj;
}

function tween(light) {
  new TWEEN.Tween(light)
    .to(
      {
        angle: Math.random() * 0.7 + 0.1,
        penumbra: Math.random() + 1,
      },
      Math.random() * 3000 + 2000
    )
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();

  new TWEEN.Tween(light.position)
    .to(
      {
        x: Math.random() * 3 - 1.5,
        y: Math.random() * 1 + 1.5,
        z: Math.random() * 3 - 1.5,
      },
      Math.random() * 3000 + 2000
    )
    .easing(TWEEN.Easing.Quadratic.Out)
    .start();
}

function updateTweens() {
  tween(spotLight1);
  tween(spotLight2);
  tween(spotLight3);

  setTimeout(updateTweens, 500);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(t = 0) {
  // Render loop
  requestAnimationFrame(animate);

  TWEEN.update();

  if (lightHelper1) lightHelper1.update();
  if (lightHelper2) lightHelper2.update();
  if (lightHelper3) lightHelper3.update();

  // Get the time elapsed since the last frame, used for mixer update (if not in single step mode)
  let mixerUpdateDelta = clock.getDelta();
  // Update the animation mixer, the stats panel, and render this frame
  mixer.update(mixerUpdateDelta);
  //stats.update();
  renderer.render(scene, camera);
}

await init();
updateTweens();
