import * as THREE from 'three';
//import GLTFLoader from 'three-gltf-loader';
import Bird from './classes/Bird.js';
//const loader = new GLTFLoader();
import Colors from './Colors.js';
{
  let scene,
    WIDTH, HEIGHT,
    camera, fieldOfView, ground1, ground2, particles1, particles2, speed, clock, delta, aspectRatio, nearPlane, farPlane, renderer, container;
  const spd = 10;
  const input = {left: 0, right: 0, up: 0, down: 0};
    //load audio, best wel nog aparte klasse voor maken
  //const audioListener = new THREE.AudioListener();
  //const themeSound = new THREE.Audio(audioListener);
  // const audioLoader = new THREE.AudioLoader();
  // audioLoader.load(`./assets/flex.mp3`, function(buffer) {
  //   themeSound.setBuffer(buffer);
  //   themeSound.setLoop(true);
  //   themeSound.setVolume(0.2);
  //   themeSound.play();
  // });

  let bird;
  const pose = 1;
  let hemisphereLight, shadowLight, ambientLight;
  const fatigue = document.querySelector(`.fatigue`);

  const init = () => {
    THREE.Cache.enabled = true;
    clock = new THREE.Clock();
    createScene();
    createLights();
    createBird();
    // setup scene
    addGround();
    addParticles();
    //start de render loop
    loop();
  };
  window.addEventListener(`keyup`, function(e) {
    switch (e.keyCode) {
    case 37:
      input.left = 0;
      break;
    case 87:
      input.up = 0;
      break;
    case 83:
      input.down = 0;
      break;
    case 39:
      input.right = 0;
      break;
    }
  });

  window.addEventListener(`keydown`, function(e) {
    switch (e.keyCode) {
    case 87:
      input.up = 1;
      break;
    case 83:
      input.down = 1;
      break;
    case 37:
      if (fatigue.value > 1) {
        console.log(`left`);
        input.left = 1;
        bird.changePose(0, camera);
      }
      break;
    case 38:
      console.log(`up`);
      bird.changePose(1, camera);
      break;
    case 39:
      console.log(`right`);
      bird.changePose(2, camera);
      input.right = 1;
      break;
    case 40:
      console.log(`down`);
      break;
    }
  });

  const showValue = () => {
    console.log(fatigue.value);
    if (fatigue.value < 1) {
      console.log(`dash bar is leeg`);
    }
    document.querySelector(`.val`).innerHTML = fatigue.value;
  };

  const createLights = () => {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, .9);
    shadowLight = new THREE.DirectionalLight(0xffffff, .9);
    ambientLight = new THREE.AmbientLight(0xdc8874, .4);

        // Set the direction of the light
    shadowLight.position.set(150, 150, 450);

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
    shadowLight.shadow.mapSize.width = 100;
    shadowLight.shadow.mapSize.height = 100;

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

  const createScene = () => {
        // Get the width and the height of the screen,
        // use them to set up the aspect ratio of the camera
        // and the size of the renderer.
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    scene = new THREE.Scene();

        //create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    nearPlane = 1;
    farPlane = 3000;
    camera = new THREE.PerspectiveCamera(
            fieldOfView,
            aspectRatio,
            nearPlane,
            farPlane
        );

    camera.position.x = 100; //verte?
    camera.position.z = 0; // l,r
    camera.position.y =  300; //hoogte
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
  const fly = () => {
    speed = delta * 700;
    //particles1.position.x = 80 * Math.cos(r * 2);
    //particles1.position.y = Math.sin(r * 2) + 100;
    particles1.position.x = 0;
    particles1.position.y = 200;
    particles2.position.x = 0;
    particles2.position.y = 200;
    // respawn particles if necessary

    particles1.position.z += speed;
    particles2.position.z += speed;
    if (particles1.position.z - 100 > camera.position.z) particles1.position.z -= 3000;
    if (particles2.position.z - 100 > camera.position.z) particles2.position.z -= 3000;
    // respawn ground if necessary

    ground1.position.z += speed;
    ground2.position.z += speed;

    if (ground1.position.z - 3000 > camera.position.z) ground1.position.z -= 10000;
    if (ground2.position.z - 3000 > camera.position.z) ground2.position.z -= 10000;

  };

  const addGround = () => {
    const plane = new THREE.PlaneBufferGeometry(1600, 5000, 5, 5);
    const position = plane.attributes.position;

    for (let i = 0;i < position.count;i ++) {

      const y = Math.floor(i / 10);
      const x = i - (y * 10);

      if (x === 4 || x === 5) {

        position.setZ(i, - 60 + ((Math.random() * 80) - 40));

      } else {

        position.setZ(i, (Math.random() * 240) - 120);

      }

      if (y === 0 || y === 24) {

        position.setZ(i, - 60);

      }

    }
    // ground 1

    //this.mesh = new THREE.Mesh(geom, mat);

    ground1 = new THREE.Mesh(plane, new THREE.MeshPhongMaterial({
      color: Colors.brownDark,
            // transparent: true,
            // opacity:.6,
      shading: THREE.FlatShading,
    }));

    ground1.rotation.x = - Math.PI / 2;
    ground1.position.y = - 300;
    ground1.position.z = 0;

    scene.add(ground1);

    // ground 2

    ground2 = new THREE.Mesh(plane, new THREE.MeshPhongMaterial({
      color: Colors.brown,
            // transparent: true,
            // opacity:.6,
      shading: THREE.FlatShading,
    }));
    ground2.rotation.x = - Math.PI / 2;
    ground2.position.y = - 300;
    ground2.position.z = - 5000;

    scene.add(ground2);

  };

  const addParticles = () => {
    //const texture = new THREE.TextureLoader.load(`https://yume.human-interactive.org/examples/forest/particle.png`);
    const textureLoader = new THREE.TextureLoader().load(`../assets/firefly.png`);
    const material = new THREE.PointsMaterial({
      size: 5,
      map: textureLoader,
      blending: THREE.AdditiveBlending,
      opacity: 0.8,
      transparent: true
    });

    const geometry = new THREE.BufferGeometry();
    const points = [];

    for (let i = 0;i < 50;i ++) {

      points.push((Math.random() * 1500) - 750);
      points.push((Math.random() * 1000) - 400);
      points.push((Math.random() * 3000) - 1500);

    }

    geometry.addAttribute(`position`, new THREE.Float32BufferAttribute(points, 3));

    particles1 = new THREE.Points(geometry, material);
    particles2 = new THREE.Points(geometry, material);
    //particles1.position.z = - 100;
    particles2.position.z = - 4500;
    scene.add(particles1);
    scene.add(particles2);
  };
  const checkCamPosition = () => {
    if (camera.position.y <= - 250) {
      camera.position.y = 300;

    }

  };

  const movePlayer = () => {
    camera.position.y -= Math.cos(camera.rotation.y) * spd / 2;
    camera.position.y -= Math.sin(camera.rotation.y) * spd / 2;
    if (input.up === 1) {
      if (camera.position.x === - 570) {
        camera.position.x = - 570;
      } else {
        camera.rotation.z = 6.5;
        camera.position.x -= Math.cos(camera.rotation.y) * spd;
        camera.position.x -= Math.sin(camera.rotation.y) * spd;
      }

    }
    if (input.down === 1) {
      if (camera.position.x === 570) {
        camera.position.x = 570;
      } else {
        camera.rotation.z = 25;
        camera.position.x += Math.cos(camera.rotation.y) * spd;
        camera.position.x += Math.sin(camera.rotation.y) * spd;
      }
    }
    if (input.right === 1) {
      camera.position.y += Math.cos(camera.rotation.y) * spd / 2;
      camera.position.y += Math.sin(camera.rotation.y) * spd / 2;
    }
    if (input.left === 1) {
      if (fatigue.value > 1) {
        camera.position.z -= 30;
        fatigue.value -= 10;
        showValue();
      }
    }
  };

  const loop = () => {
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
    delta = clock.getDelta();
    checkCamPosition();
    fly(delta);
    movePlayer();
    //mixer.update(0.01);
    bird.animate();

  };

  init();
}
