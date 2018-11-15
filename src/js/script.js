import * as THREE from 'three';
import Sea from './classes/Sea.js';
import GLTFLoader from 'three-gltf-loader';
const loader = new GLTFLoader();

{

  let scene,
    WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, nearPlane, farPlane, renderer, container;

  let sea;
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
    loader.load(`./assets/untitled.glb`, gltf => {


      gltf.scene.scale.set(4, 4, 4);
      gltf.scene.rotation.copy(new THREE.Euler(0, - 3 * Math.PI / 6, 0));
      gltf.scene.position.set(200, 100, 0);

      scene.add(gltf.scene);
    });
  };

  const createSea = () => {
    sea = new Sea();

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

        //create renderer
    renderer = new THREE.WebGLRenderer({
      alpha: true,

      antialias: true
    });

    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.eneabled = true;

    container = document.getElementById(`world`);
    container.appendChild(renderer.domElement);
  };

  const loop = () => {
    requestAnimationFrame(loop);

    renderer.render(scene, camera);

    sea.moveWaves();
  };

  init();
}
