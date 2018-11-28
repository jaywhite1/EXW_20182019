import * as THREE from 'three';
import * as posenet from '@tensorflow-models/posenet';
import Bird from './classes/Bird.js';
import 'babel-polyfill';

import {drawBoundingBox, drawKeypoints, drawSkeleton} from './demo_util';
//const loader = new GLTFLoader();
import Colors from './Colors.js';

{
  const flexdistancelabel = document.querySelector(`.score-value`);
  const loadingManager = new THREE.LoadingManager(() => {
    const loadingScreen = document.querySelector(`.loading-screen`);
    console.log(loadingScreen);
    loadingScreen.classList.add(`fade-out`);
    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener(`transitionend`, onTransitionEnd);
  });
  let scene,
    WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, renderer, container, ground1, ground2, particles1, particles2, speed, clock, delta, hemisphereLight, shadowLight, ambientLight;
  let flexdistance = 0;
  let bird, video, net, playerPose;
  const pose = 1;

  let didFlex = false;
  let flexedUp = false;
  let tooClose = false;
  let gameStarted = false;

  const videoWidth = 400;
  const videoHeight = 300;
  const spd = 10;
  const input = {left: 0, right: 0, up: 0, down: 0};
  const fatigue = document.querySelector(`.fatigue`);

    //load audio, best wel nog aparte klasse voor maken
  const audioListener = new THREE.AudioListener();
  const themeSound = new THREE.Audio(audioListener);
  const audioLoader = new THREE.AudioLoader(loadingManager);
  audioLoader.load(`./assets/flex.mp3`, function(buffer) {
    themeSound.setBuffer(buffer);
    themeSound.setLoop(true);
    themeSound.setVolume(0.2);
    //themeSound.play();
  });

  const init = () => {

    navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    THREE.Cache.enabled = true;
    clock = new THREE.Clock();
    createScene();
    createLights();
    createBird();
    checkKeys();
    bindPage(); //posenet
    addGround();
    addParticles();
    //start de render loop
    loop();
  };
  function onTransitionEnd(event) {
    event.target.remove();

  }
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
    document.getElementsByClassName(`.val`).innerHTML = fatigue.value;
  };

  const menuPage = () => {
    const menuPage = document.getElementsByClassName(`menu_page`);
    const menuPlay = document.getElementsByClassName(`menu_play`);

    menuPlay[0].addEventListener(`click`, () => { menuPage[0].className = `hide`;});

    if (!tooClose) {
      menuPlay[0].innerHTML = `Flex up to start`;

      if (flexedUp) {
        menuPage[0].className = `hide`;
        gameStarted = true;
      }
    } else {
      menuPlay[0].innerHTML = `je staat te dicht`;
    }

  };
  const updateDistance = () => {
    flexdistance += 1;
    flexdistancelabel.innerHTML = flexdistance;
  };
  const createScene = () => {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer.
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x00ffff, 0.0005);
      //create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 60;
    camera = new THREE.PerspectiveCamera(
          fieldOfView,
          aspectRatio
      );

    camera.position.x = 100; //verte?
    camera.position.z = 0; // l,r
    camera.position.y = 300; //hoogte
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
    renderer.setClearColor(0x00ffff, 1.0);
  };

  const setupCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
          `Browser API navigator.mediaDevices.getUserMedia not available`);
    }

    const video = document.getElementById(`video`);
    video.width = videoWidth;
    video.height = videoHeight;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: videoWidth,
        height: videoHeight,
      },
    });

    video.srcObject = stream;

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        resolve(video);
      };
    });
  };

  const loadVideo = async () => {
    const video = await setupCamera();
    video.play();

    return video;
  };

  const bindPage = async () => {

    // // Load posenet
    net = await posenet.load(0.75);

    document.getElementsByClassName(`posetest`)[0].style.display = `block`;

    try {
      video = await loadVideo();
      //console.log(video);
    } catch (e) {
      const info = document.getElementById(`info`);
      info.textContent = `this browser does not support video capture,` +
          `or this device does not have a camera`;
      info.style.display = `block`;
      throw e;
    }

    detectPoseInRealTime(video, net);
  };

  const detectPoseInRealTime = (video, net) => {
    const canvas = document.getElementById(`output`);
    const ctx = canvas.getContext(`2d`);
    // since images are being fed from a webcam
    const flipHorizontal = true;

    canvas.width = videoWidth;
    canvas.height = videoHeight;

    async function poseDetectionFrame() {

      // Load posenet
      //net = await posenet.load(0.5);

      // Scale the image. The smaller the faster
      const imageScaleFactor = 0.55;

      // Stride, the larger, the smaller the output, the faster
      const outputStride = 16;

      const poses = [];

      playerPose = await net.estimateSinglePose(video,
        imageScaleFactor,
        flipHorizontal,
        outputStride);
      poses.push(playerPose);

      //console.log(playerPose);

      // Show a pose (i.e. a person) only if probability more than
      const minPoseConfidence = 0.4;
      // Show a body part only if probability more than
      const minPartConfidence = 0.6;

      ctx.clearRect(0, 0, videoWidth, videoHeight);

      const showVideo = true;

      if (showVideo) {
        ctx.save();
        ctx.scale(- 1, 1);
        ctx.translate(- videoWidth, 0);
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
        ctx.restore();
      }

      // For each pose (i.e. person) detected in an image, loop through the poses
      // and draw the resulting skeleton and keypoints if over certain confidence
      // scores
      poses.forEach(({score, keypoints}) => {
        if (score >= minPoseConfidence) {
          drawKeypoints(keypoints, minPartConfidence, ctx);
          drawSkeleton(keypoints, minPartConfidence, ctx);
          drawBoundingBox(keypoints, ctx);
        }
      });

      checkPoses();
      requestAnimationFrame(poseDetectionFrame);
    }

    poseDetectionFrame();


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


  };loadingManager;

  const createBird = () => {
    bird = new Bird(pose, camera, loadingManager);

    // bird.poses(1, scene);
    //console.log(bird);
    //bird.changePose(2, scene);
  };

  const checkKeys = () => {
    document.onkeydown = e => {
      switch (e.keyCode) {
      case 37:
        console.log(`left`);
        bird.changePose(0, scene);
        break;
      case 38:
        console.log(`up`);
        bird.changePose(1, scene);
        break;
      case 39:
        console.log(`right`);
        bird.changePose(2, scene);
        break;
      case 40:
        console.log(`down`);
        break;
      case 65:
        console.log(`a`);
        bird.moveLeft();
        break;
      case 68:
        console.log(`d`);
        bird.moveRight();
        break;
      }
    };
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  };


  const checkPoses = () => {

    const leftShoulder = playerPose.keypoints[5];
    const rightShoulder = playerPose.keypoints[6];
    const leftElbow = playerPose.keypoints[7];
    const rightElbow = playerPose.keypoints[8];
    const leftWrist = playerPose.keypoints[9];
    const rightWrist = playerPose.keypoints[10];

    //console.log(`nose: ${  playerPose.keypoints[1].position.y.toFixed(0)}`, `right shoulder x: ${  playerPose.keypoints[6].position.x.toFixed(0)}`);
    //console.log(playerPose.keypoints);

    // if (leftShoulder.x <= 300) { //|| rightShoulder.x <= 40
    //   console.log(`left`);
    // }

    // if (rightShoulder.x >= 170) { //|| rightShoulder.x >= 170
    //   console.log(`right`);
    // }

    //console.log((leftShoulder.x - rightShoulder.x).toFixed(0));

    if (leftShoulder.position.x - rightShoulder.position.x <= 150) { //|| rightShoulder.x <= 40
      //console.log(`ok`);

      const tooCloseSection = document.getElementById(`too_close`);
      tooClose = false;



      tooCloseSection.className = `hide`;

      if (!didFlex) {
        if ((leftElbow.score && leftWrist.score || rightElbow.score && rightWrist.score) >= 0.7) {

          if ((leftElbow.position.y < leftShoulder.position.y && leftWrist.position.y < leftElbow.position.y) &&
          (rightElbow.position.y < rightShoulder.position.y && rightWrist.position.y < rightElbow.position.y)) {
            
            if (fatigue.value > 1) {
              console.log(`flex up`);
              camera.position.z -= 100;
              fatigue.value -= 10;
              didFlex = true;
              flexedUp = true;
              bird.changePose(0, camera);
              showValue();

              setTimeout(() => {
                didFlex = false;
              }, 1000);
            }

          } else if ((leftElbow.position.y > leftShoulder.position.y && leftWrist.position.x < leftElbow.position.x - 30) &&
          (rightElbow.position.y >= rightShoulder.position.y && rightWrist.position.x > rightElbow.position.x + 30)) {
            console.log(`flex down`);
            camera.position.y += Math.cos(camera.rotation.y) * 200;
            camera.position.y += Math.sin(camera.rotation.y) * 200;
            didFlex = true;
            bird.changePose(2, camera);

            setTimeout(() => {
              didFlex = false;
            }, 1000);
          } else {
            console.log(`neutral`);
          }
        }

      }

    } else {
      tooClose = true;
      console.log(`je staat te dicht`);

      if (gameStarted) {
        const tooCloseSection = document.getElementById(`too_close`);
        tooCloseSection.className = `too_close display_page`;
      }

    }
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
      color: Colors.brown,
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
    const textureLoader = new THREE.TextureLoader(loadingManager).load(`../assets/firefly.png`);
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

  const loop = () => {
    requestAnimationFrame(loop);
    renderer.render(scene, camera);
    delta = clock.getDelta();
    checkCamPosition();
    fly(delta);
    //mixer.update(0.01);
    bird.animate();

    if (!gameStarted) {
      menuPage();
    } else {
      startGame();
      updateDistance();
    }

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

    if (ground1.position.z - 3000 > camera.position.z) ground1.position.z -= 9600;
    if (ground2.position.z - 3000 > camera.position.z) ground2.position.z -= 9400;
  };

  const checkCamPosition = () => {
    if (camera.position.y <= - 250) {
      camera.position.y = 300;
    }
  };

  const startGame = () => {
    movePlayer();
  };

  const movePlayer = () => {
    // camera.position.y -= Math.cos(camera.rotation.y) * spd / 2;
    // camera.position.y -= Math.sin(camera.rotation.y) * spd / 2;
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
      }
    }
  };


  init();

}
