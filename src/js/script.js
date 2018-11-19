import * as THREE from 'three';
import Sea from './classes/Sea.js';
//import GLTFLoader from 'three-gltf-loader';
import Bird from './classes/Bird.js';
//const loader = new GLTFLoader();

{
  let scene,
    WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane, renderer, container;
  const spd = 10;
  const input = {left: 0, right: 0, up: 0, down: 0};
    //load audio, best wel nog aparte klasse voor maken
  const audioListener = new THREE.AudioListener();
  const themeSound = new THREE.Audio(audioListener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(`./assets/flex.mp3`, function(buffer) {
    themeSound.setBuffer(buffer);
    themeSound.setLoop(true);
    themeSound.setVolume(0.2);
    themeSound.play();
  });

  let sea, bird;
  const pose = 1;
  let hemisphereLight, shadowLight, ambientLight;

  const init = () => {
    console.log(`hello world`);
    createScene();
    createLights();
    createSea();
    createBird();

    //start de render loop
    loop();
  };
  window.addEventListener(`keyup`, function(e) {
    switch (e.keyCode) {
    case 68:
      input.right = 0;
      break;
    case 65:
      input.left = 0;
      break;
    case 87:
      input.up = 0;
      break;
    case 83:
      input.down = 0;
      break;

    }

  });

  window.addEventListener(`keydown`, function(e) {
    switch (e.keyCode) {
    case 68:
      input.right = 1;
      break;
    case 65:
      input.left = 1;
      break;
    case 87:
      input.up = 1;
      break;
    case 83:
      input.down = 1;
      break;
    case 37:
      console.log(`left`);
      bird.changePose(0, camera);
      break;
    case 38:
      console.log(`up`);
      bird.changePose(1, camera);
      break;
    case 39:
      console.log(`right`);
      bird.changePose(2, camera);
      break;
    case 40:
      console.log(`down`);
      break;
    }
  });

  const createLights = () => {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);
    ambientLight = new THREE.AmbientLight(0xdc8874, .4);

        // Set the direction of the light
    shadowLight.position.set(150, 350, 350);

        // Allow shadow casting
    shadowLight.castShadow = true;

        // define the visible area of the projected shadow
    shadowLight.shadow.camera.left = - 400;
    shadowLight.shadow.camera.right = 400;
    shadowLight.shadow.camera.top = 400;
    shadowLight.shadow.camera.bottom = - 400;
    shadowLight.shadow.camera.near = 1;
    shadowLight.shadow.camera.far = 1000;

        // define the resolution of the shadow; the higher the better,
        // but also the more expensive and less performant
    shadowLight.shadow.mapSize.width = 2048;
    shadowLight.shadow.mapSize.height = 2048;

    scene.add(hemisphereLight);
    scene.add(shadowLight);
    scene.add(ambientLight);
  };
  const createBird = () => {
    bird = new Bird(pose, camera);

    // bird.poses(1, scene);
    //console.log(bird);
    //bird.changePose(2, scene);
  };

  const createSea = () => {
    sea = new Sea();

    console.log(sea);

    sea.mesh.position.y = - 600;

        // add the mesh of the sea to the scene
    scene.add(sea.mesh);
  };

  const createScene = () => {
        // Get the width and the height of the screen,
        // use them to set up the aspect ratio of the camera
        // and the size of the renderer.
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    scene = new THREE.Scene();

    scene.fog = new THREE.Fog(0xf7d9aa, 100, 950);

        //create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 10000;
    camera = new THREE.PerspectiveCamera(
            fieldOfView,
            aspectRatio,
            nearPlane,
            farPlane
        );

    camera.position.x = 700; //verte?
    camera.position.z = 0; // l,r
    camera.position.y = 300; //hoogte
    camera.rotation.y = 90 * Math.PI / 180;
    scene.add(camera);
        //create renderer
    renderer = new THREE.WebGLRenderer({
      alpha: true,

      antialias: true
    });

    window.addEventListener(`resize`, onWindowResize, false);

    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.eneabled = true;

    container = document.getElementsByClassName(`world`);
    container[0].appendChild(renderer.domElement);
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  const movePlayer = () => {

    if (input.up === 1) {
      if (camera.position.z === - 570) {
        camera.position.z = - 570;
      } else {
        camera.position.z -= Math.cos(camera.rotation.y) * spd;
        camera.position.z -= Math.sin(camera.rotation.y) * spd;
      }

    }
    if (input.down === 1) {
      if (camera.position.z === 570) {
        camera.position.z = 570;
      } else {
        camera.position.z += Math.cos(camera.rotation.y) * spd;
        camera.position.z += Math.sin(camera.rotation.y) * spd;
      }


    }
  };

  const loop = () => {
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
    movePlayer();
    //mixer.update(0.01);
    sea.moveWaves();
    bird.animate();

  };

  init();
}
