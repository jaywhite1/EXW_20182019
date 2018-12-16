import * as THREE from 'three';
import * as posenet from '@tensorflow-models/posenet';
import 'babel-polyfill';
import GLTFLoader from 'three-gltf-loader';

import {drawKeypoints, drawSkeleton} from './demo_util';
//const loader = new GLTFLoader();
import Colors from './Colors.js';
import Bird from './classes/Bird.js';

{
  const loadingManager = new THREE.LoadingManager(() => {
    const loadingScreen = document.querySelector(`.loading-screen`);
    loadingScreen.classList.add(`fade-out`);
    // optional: remove loader from DOM via event listener
    loadingScreen.addEventListener(`transitionend`, onTransitionEnd);
  });

  let scene,
    WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, renderer, container, ground1, ground2, particles1, particles2, speed, clock, delta, hemisphereLight, shadowLight, ambientLight, turnSpeed;
  let flexdistance = 0;
  let bird, video, net, playerPose;
  const pose = 1;
  const trees = new Set();
  const enemies = new Set();
  const shakes = new Set();
  const EnemiesSpikes = new Set();
  const collidableMeshes = [];
  const collidableMeshesSpikes = [];
  const collidableMeshesShakes = [];
  const enemyCubes = [];
  const enemySpikeCubes = [];
  const shakeCubes = [];
  const clouds = new Set();
  const maxHeight = 2500;
  let didFlex = false;
  let flexedUp = false;
  let up = true;
  let down = false;
  let tutPage = true;
  let left = true;
  let right = false;
  let gameOverSoundState = true;
  let particles;
  let particleGeometry;
  const particlecount = 10;
  let explosionPower = 1.06;
  let flexedDown = false;
  let tooClose = false;
  let gameStarted = false;
  let hitSomething = false;
  let hitSomething2 = false;
  let gameOver = false;
  const videoWidth = 301;
  const videoHeight = 225;
  const spd = 10;
  const input = {left: 0, right: 0, up: 0, down: 0};
  const fatigue = document.querySelector(`.fatigue`);
  let boxCube;
  let enemyCube;
  let enemySpikeCube;
  let shakeCube;
    //load audio, best wel nog aparte klasse voor maken
  const audioListener = new THREE.AudioListener();
  const themeSound = new THREE.Audio(audioListener);
  const audioLoader = new THREE.AudioLoader(loadingManager);
  audioLoader.load(`./assets/piggytribe.ogg`, function(buffer) {
    themeSound.setBuffer(buffer);
    themeSound.setLoop(true);
    themeSound.setVolume(0.6);
  });
  const spikeHit = new THREE.Audio(audioListener);
  audioLoader.load(`./assets/spikeHit.mp3`, function(buffer) {
    spikeHit.setBuffer(buffer);
    spikeHit.setVolume(0.4);
  });
  const gameoverSound = new THREE.Audio(audioListener);
  audioLoader.load(`./assets/gameover.mp3`, function(buffer) {
    gameoverSound.setBuffer(buffer);
    themeSound.setLoop(false);
    gameoverSound.setVolume(1);
  });
  const flexsound = new THREE.Audio(audioListener);
  audioLoader.load(`./assets/flex.mp3`, function(buffer) {
    flexsound.setBuffer(buffer);
    flexsound.setVolume(0.2);
  });
  const dashsound = new THREE.Audio(audioListener);
  audioLoader.load(`./assets/dash.mp3`, function(buffer) {
    dashsound.setBuffer(buffer);
    dashsound.setVolume(0.2);
  });
  const deadSound = new THREE.Audio(audioListener);
  audioLoader.load(`./assets/dead.mp3`, function(buffer) {
    deadSound.setBuffer(buffer);
    deadSound.setVolume(0.2);
  });
  const init = () => {

    navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    THREE.Cache.enabled = true;
    clock = new THREE.Clock();
    createScene();
    createLights();
    createBird();
    bindPage(); //posenet
    addGround();
    addParticles();
    addTrees();
    addclouds();
    addExplosion();

    tutorialScreen();
    addEnemies();
    addShakes();
    addEnemiesSpikes();
    //start de render loop
    loop();
  };
  function onTransitionEnd(event) {
    event.target.remove();

  }
  window.addEventListener(`keyup`, function(e) {
    switch (e.keyCode) {
    case 87:
      input.up = 0;
      break;
    case 83:
      input.down = 0;
      break;
    case 65:
      input.left = 0;
      break;
    case 68:
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
    case 65:
      input.left = 1;
      break;
    case 68:
      input.right = 1;
      break;
    case 37:
      if (fatigue.value > 1  && camera.position.y <= maxHeight) {
        bird.changePose(0, camera);
        flexedDown = true;
      }
      break;
    case 38:
      bird.changePose(1, camera);

      break;
    case 39:
      bird.changePose(2, camera);
      flexedUp = true;
      break;
    case 40:
      break;
    }
  });

  const showValue = () => {
    document.getElementsByClassName(`.val`).innerHTML = fatigue.value;
  };

  const tutorialScreen = () => {
    const tutorialScreen = document.querySelector(`.tutorial_screen`);
    const tutorialPlay = document.querySelector(`.tutorial_play`);

    tutorialPlay.addEventListener(`click`, () => {
      tutorialScreen.className = `hide tutorial-screen`;
      tutPage = false;
    });

  };

  const menuPage = () => {
    const menuPage = document.getElementsByClassName(`menu_page`);
    const menuPlay = document.getElementsByClassName(`menu_play`);

    menuPlay[0].addEventListener(`click`, () => { menuPage[0].className = `hide menu_page`;});

    if (!tooClose) {
      menuPlay[0].innerHTML = `Flex up to start`;
      menuPlay[0].className = `menu_play`;

      if (flexedUp) {
        menuPage[0].className = `hide menu_page`;
        startGame();
      }
    } else {
      menuPlay[0].innerHTML = `You're standing too close`;
      menuPlay[0].className = `menu_close menu_play`;
    }

  };

  const createScene = () => {
    // Get the width and the height of the screen,
    // use them to set up the aspect ratio of the camera
    // and the size of the renderer.
    WIDTH = window.innerWidth;
    HEIGHT = window.innerHeight;

    scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0xc08329, 1500, 2500);
      //create the camera
    aspectRatio = WIDTH / HEIGHT;
    fieldOfView = 70;
    camera = new THREE.PerspectiveCamera(
          fieldOfView,
          aspectRatio,
          1,
          3000

      );

    camera.position.x = 100; //verte?
    camera.position.z = 0; // l,r
    camera.position.y = 400; //hoogte
    scene.add(camera);
    const cubeGeometry = new THREE.CubeGeometry(20, 50, 10, 1, 1, 1);
    const wireMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
    boxCube = new THREE.Mesh(cubeGeometry, wireMaterial);
    boxCube.position.set(camera.position.x, camera.position.z, camera.position.y);
    scene.add(boxCube);

      //create renderer
    renderer = new THREE.WebGLRenderer({
      alpha: true,

      antialias: true
    });

    window.addEventListener(`resize`, onWindowResize, false);

    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.enabled = true;

    container = document.getElementsByClassName(`world`);
    container[0].appendChild(renderer.domElement);
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
    const canvas = document.querySelector(`.output`);
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
      const outputStride = 8;

      const poses = [];

      playerPose = await net.estimateSinglePose(video,
        imageScaleFactor,
        flipHorizontal,
        outputStride);
      poses.push(playerPose);

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
          //drawBoundingBox(keypoints, ctx);
        }
      });
      requestAnimationFrame(poseDetectionFrame);
    }
    poseDetectionFrame();
  };

  const addExplosion = () => {
    particleGeometry = new THREE.Geometry();
    for (let i = 0;i < particlecount;i ++) {
      const vertex = new THREE.Vector3();
      particleGeometry.vertices.push(vertex);
    }
    const pMaterial = new THREE.ParticleBasicMaterial({
      color: 0xfffafa,
      size: 10
    });
    particles = new THREE.Points(particleGeometry, pMaterial);
    scene.add(particles);
    particles.visible = false;
  };

  const explode = () => {
    particles.position.y = camera.position.y - 22;
    particles.position.z = camera.position.z - 110;
    particles.position.x = camera.position.x;
    for (let i = 0;i < particlecount;i ++) {
      const vertex = new THREE.Vector3();
      vertex.x = - 10 + Math.random() * 10.4;
      vertex.y = - 10 + Math.random() * 10.4;
      vertex.z = - 10 + Math.random() * 10.4;
      particleGeometry.vertices[i] = vertex;
    }
    explosionPower = 1.07;
    particles.visible = true;
  };

  const doExplosionLogic = () => {
    if (!particles.visible) return;
    for (let i = 0;i < particlecount;i ++) {
      particleGeometry.vertices[i].multiplyScalar(explosionPower);
    }
    if (explosionPower > 1.005) {
      explosionPower -= 0.001;
    } else {
      particles.visible = false;
    }
    particleGeometry.verticesNeedUpdate = true;
  };

  const createLights = () => {
    hemisphereLight = new THREE.HemisphereLight(0xaaaaaa, 0x000000, 1);
    shadowLight = new THREE.DirectionalLight(0xffffff, 1);
    ambientLight = new THREE.AmbientLight(0xdc8874, .7);

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

    camera.add(hemisphereLight);
    camera.add(shadowLight);
    camera.add(ambientLight);


  };

  const createBird = () => {
    bird = new Bird(pose, camera, loadingManager);
  };

  const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const addTrees = () => {
    const loader = new GLTFLoader(loadingManager);
    loader.load(`assets/tree.glb`, gltf => {
      const tree = gltf.scene.children[ 0 ];
      for (let i = 0;i < 150;i ++) {
        const scale = 2 + (Math.random() * 1.5);
        const mesh = tree.clone();

        mesh.scale.set(scale * 1.5, scale * 2, scale * 1.5);
        mesh.rotation.x = (Math.random() * 0.2) - 0.1;
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.z = (Math.random() * 0.2) - 0.1;

        mesh.position.x = (Math.random() * 4000) - 2000;
        mesh.position.y = - 400;
        mesh.position.z = (Math.random() * 3000) - 3000;


        if (mesh.position.x < 700 && mesh.position.x > 0) mesh.position.x += 700;
        if (mesh.position.x > - 700 && mesh.position.x < 0) mesh.position.x -= 700;

        scene.add(mesh);
        trees.add(mesh);
      }
    });
  };
  const addGround = () => {
    const plane = new THREE.PlaneBufferGeometry(3000, 20000, 9, 24);
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
    ground1.position.z = - 10000;

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
    ground2.position.z = - 30000;

    scene.add(ground2);

  };

  const addParticles = () => {
    const textureLoader = new THREE.TextureLoader(loadingManager).load(`../assets/firefly.png`);
    const material = new THREE.PointsMaterial({
      size: 6,
      map: textureLoader,
      blending: THREE.AdditiveBlending,
      opacity: 0.8,
      transparent: true
    });

    const geometry = new THREE.BufferGeometry();
    const points = [];

    for (let i = 0;i < 100;i ++) {

      points.push((Math.random() * 1500) - 750);
      points.push((Math.random() * 2000) + 100);
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
    //mixer.update(0.01);
    bird.animate(camera.position.y);
    checkPoses();
    movePlayer();
    doExplosionLogic();

    if (!gameStarted) {
      menuPage();
    } else {
      startGame();
      fly(delta);
    }
    if (!gameOver) {
      if (!hitSomething && !hitSomething2 && !tutPage) {
        checkCollisions();
      }
      checkFlexes();
      fly(delta);

      checkPoses();
      movePlayer();
    } else {
      gameOverFunc();
    }

  };

  const checkFlexes = () => {

    if (flexedDown) {
      camera.position.y += spd + 10;

      setTimeout(() => {
        flexedDown = false;
      }, 600);

    }

    if (flexedUp) {
      camera.position.z -= spd * 2;

      setTimeout(() => {
        flexedUp = false;
      }, 1500);

    }
  };

  const checkPoses = () => {

    const leftShoulder = playerPose.keypoints[6];
    const rightShoulder = playerPose.keypoints[5];
    const leftElbow = playerPose.keypoints[8];
    const rightElbow = playerPose.keypoints[7];
    const leftWrist = playerPose.keypoints[10];
    const rightWrist = playerPose.keypoints[9];

    // let leftShoulderOld;

    // setTimeout(() => {
    //   leftShoulderOld = leftShoulder;
    //   console.log(leftShoulderOld.position.x.toFixed(0), leftShoulder.position.x.toFixed(0));
    // }, 1000);


    //console.log(`diff: ${  rightShoulder.position.x.toFixed(0) - leftShoulder.position.x.toFixed(0)}`);
    //console.log(playerPose.keypoints);

    if (rightShoulder.position.x - leftShoulder.position.x <= 100) { //|| rightShoulder.x <= 40
      //console.log(`ok`);

      const tooCloseSection = document.getElementById(`too_close`);
      tooClose = false;
      themeSound.setVolume(1);

      tooCloseSection.className = `hide`;

      turnSpeed = leftShoulder.position.y - rightShoulder.position.y;
      console.log(Math.round(turnSpeed));

      if (turnSpeed > 10 && camera.position.x >= - 610) {
        camera.position.x -= (turnSpeed / 3);
        bird.tilt(1, 0, turnSpeed);
      } else if (turnSpeed < - 10 && camera.position.x <= 610) {
        camera.position.x -= (turnSpeed / 3);
        bird.tilt(0, 1, turnSpeed);
      } else {
        bird.tilt(0, 0, turnSpeed);
      }



      if (!didFlex) {
        if ((leftElbow.score && leftWrist.score || rightElbow.score && rightWrist.score) >= 0.6) {

          if ((leftElbow.position.y < leftShoulder.position.y && leftWrist.position.y < leftElbow.position.y && (leftWrist.position.x > leftElbow.position.x + 20)) &&
          (rightElbow.position.y < rightShoulder.position.y && rightWrist.position.y < rightElbow.position.y && (rightWrist.position.x < rightElbow.position.x - 20))) {

            if (fatigue.value > 1) {
              dashsound.play();
              fatigue.value -= 20;
              didFlex = true;
              flexedUp = true;
              bird.changePose(2, camera);

              setTimeout(() => {
                didFlex = false;
              }, 1500);
            } else {
              noStamina();
            }

          } else if ((leftElbow.position.y > leftShoulder.position.y && leftWrist.position.x > leftElbow.position.x + 20 && leftWrist.position.y > leftShoulder.position.y) &&
          (rightElbow.position.y >= rightShoulder.position.y && rightWrist.position.x < rightElbow.position.x - 20 && rightWrist.position.y > rightShoulder.position.y) && camera.position.y <= maxHeight) {

            if (fatigue.value > 1) {
              didFlex = true;
              flexedDown = true;
              bird.changePose(0, camera);
              flexsound.play();
  
              fatigue.value -= 5;
  
              setTimeout(() => {
                didFlex = false;
              }, 1000);
            } else {
              noStamina();
            }
            
          } else {
            flexedUp = false;
            flexedDown = false;
          }
        }
      }

    } else {
      tooClose = true;
      //console.log(`je staat te dicht`);

      if (gameStarted && !gameOver) {
        const tooCloseSection = document.getElementById(`too_close`);
        tooCloseSection.className = `too_close display_page`;

        themeSound.setVolume(.3);
        input.left = 0;
        input.right = 0;
      }

    }
  };

  const noStamina = () => {
    const tooCloseSection = document.getElementById(`too_close`);
    const infoTxt = document.querySelector(`.te_dicht`);
    tooCloseSection.className = `too_close display_page`;

    infoTxt.innerHTML = `Flexbird is fatigued`;
  };

  const fly = () => {
    if (!gameStarted || tooClose) {
      speed = delta * 50;
    } else {

      if (fatigue.value >= 1) {
        speed = delta * 300;
        camera.position.y -= Math.cos(camera.rotation.y) * spd / 7;
        camera.position.y -= Math.sin(camera.rotation.y) * spd / 7;
      } else {
        speed = delta * 300;
        camera.position.y -= Math.cos(camera.rotation.y) * spd;
        camera.position.y -= Math.sin(camera.rotation.y) * spd;
      }

    }

    //particles1.position.x = 80 * Math.cos(r * 2);
    //particles1.position.y = Math.sin(r * 2) + 100;
    particles1.position.x = 0;
    particles1.position.y = 100;
    particles2.position.x = 0;
    particles2.position.y = 500;
    // respawn particles if necessary

    particles1.position.z += speed;
    particles2.position.z += speed;
    if (particles1.position.z - 100 > camera.position.z) particles1.position.z -= 3000;
    if (particles2.position.z - 100 > camera.position.z) particles2.position.z -= 3000;
    // respawn ground if necessary

    ground1.position.z += speed;
    ground2.position.z += speed;

    if (ground1.position.z - 10000 > camera.position.z) ground1.position.z -= 40000;
    if (ground2.position.z - 10000 > camera.position.z) ground2.position.z -= 40000;
    for (const tree of trees) {
      tree.position.z += speed;
      if (tree.position.z > camera.position.z) tree.position.z -= 3000;
    }
    for (const cloud of clouds) {
      cloud.position.z += speed;
      if (cloud.position.z > camera.position.z) cloud.position.z -= 3000;
    }
    for (const shake of shakes) {
      shake.rotation.y -= 0.01;
      shake.position.z += speed;
      if (shake.position.z > camera.position.z) shake.position.z -= 3000;
    }
    for (const shakebox of shakeCubes) {
      shakebox.rotation.y -= 0.01;
      shakebox.position.z += speed;
      if (shakebox.position.z > camera.position.z) shakebox.position.z -= 3000;
    }
    for (const enemy of enemies) {
      if (up) {
        enemy.position.y += 1.05;
        enemy.rotation.x -= 0.003;
        setTimeout(() => {
          up = false;
          down = true;
        }, 600);
      } else if (down) {
        enemy.position.y -= 1.05;
        enemy.rotation.x += 0.003;
        setTimeout(() => {
          down = false;
          up = true;
        }, 600);
      }
      enemy.position.z += speed;
      if (enemy.position.z > camera.position.z) enemy.position.z -= 3000;
    }
    for (const enemySpike of EnemiesSpikes) {
      if (left) {
        enemySpike.position.x += 3.05;
        setTimeout(() => {
          left = false;
          right = true;
        }, 1500);
      } else if (right) {
        enemySpike.position.x -= 3.05;
        setTimeout(() => {
          right = false;
          left = true;
        }, 1500);
      }
      enemySpike.position.z += speed;
      if (enemySpike.position.z > camera.position.z) enemySpike.position.z -= 3000;

    }
    for (const cubebox of enemyCubes) {
      if (up) {
        cubebox.position.y += 1.05;
        cubebox.rotation.x -= 0.003;
        setTimeout(() => {
          up = false;
          down = true;
        }, 600);
      } else if (down) {
        cubebox.position.y -= 1.05;
        cubebox.rotation.x += 0.003;
        setTimeout(() => {
          down = false;
          up = true;
        }, 600);
      }
      cubebox.position.z += speed;
      if (cubebox.position.z > camera.position.z) cubebox.position.z -= 3000;
    }
    for (const cubebox of enemySpikeCubes) {
      if (left) {
        cubebox.position.x += 3.05;
        setTimeout(() => {
          left = false;
          right = true;
        }, 1500);
      } else if (right) {
        cubebox.position.x -= 3.05;
        setTimeout(() => {
          right = false;
          left = true;
        }, 1500);
      }
      cubebox.position.z += speed;
      if (cubebox.position.z > camera.position.z) cubebox.position.z -= 3000;
    }
  };

  const checkCollisions = () => {
    boxCube.position.set(camera.position.x, camera.position.y - 22, camera.position.z - 110);
    const originPoint = boxCube.position.clone();

    for (let vertexIndex = 0;vertexIndex < boxCube.geometry.vertices.length;vertexIndex ++)
    {
      const localVertex = boxCube.geometry.vertices[vertexIndex].clone();
      const globalVertex = localVertex.applyMatrix4(boxCube.matrix);
      const directionVector = globalVertex.sub(boxCube.position);
      const ray = new THREE.Raycaster(originPoint, directionVector.clone().normalize());
      const collisionResults = ray.intersectObjects(collidableMeshes);
      const collisionResults2 = ray.intersectObjects(collidableMeshesSpikes);

      if (collisionResults.length > 0 && collisionResults[0].distance < directionVector.length()) {
        hitSomething = true;

        if (flexedUp) {
          fatigue.value = 100;
        } else {

          const damageSection = document.getElementById(`damage`);
          damageSection.className = `too_close display_page_damage`;
          fatigue.value -= 2;

          setTimeout(() => {
            damageSection.className = `display_page_damage_hidden`;
            hitSomething = false;
          }, 1000);
        }

      }

      if (hitSomething) {
        fatigue.value -= 1;
        deadSound.play();
        explode();
      }

      if (collisionResults2.length > 0 && collisionResults2[0].distance < directionVector.length()) {
        hitSomething2 = true;

        if (flexedUp) {
          fatigue.value = 100;
        } else {

          const damageSection = document.getElementById(`damage`);
          damageSection.className = `too_close display_page_damage`;
          fatigue.value -= 2;

          setTimeout(() => {
            damageSection.className = `display_page_damage_hidden`;
            hitSomething2 = false;
          }, 1500);
        }

      }

      if (hitSomething2) {
        fatigue.value -= 1;
        spikeHit.play();
        explode();
      }
    }

  };

  const addclouds = () => {
    const loader = new GLTFLoader(loadingManager);
    loader.load(`../assets/cloud.glb`, gltf => {
      const cloud = gltf.scene.children[ 0 ];
      for (let i = 0;i < 10;i ++) {
        const scale = 80 + Math.random();

        const mesh = cloud.clone();
        mesh.scale.set(scale, scale, scale);
        mesh.rotation.x = 0;
        mesh.rotation.y = Math.random() * Math.PI;
        mesh.rotation.z = 0;

        mesh.position.x = (Math.random() * 1500) - 750;
        mesh.position.y = (Math.random() * 1000) + 2500;
        mesh.position.z = (Math.random() * 3000) - 1500;
        mesh.name = `enemy`;
        scene.add(mesh);
        clouds.add(mesh);
      }
    });
  };

  const addEnemies = () => {
    const loader = new GLTFLoader(loadingManager);
    loader.load(`../assets/enemy.glb`, gltf => {
      const enemy = gltf.scene.children[ 0 ];
      const scale = 80;

      const mesh = enemy.clone();
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.x = 1.5;
      mesh.rotation.y = 0;
      mesh.rotation.z = 0;

      mesh.position.x = (Math.random() * 1500) - 750;
      mesh.position.y = (Math.random() * 2000) + 100;
      mesh.position.z = (Math.random() * 3000) - 1500;

      const cubeGeometry = new THREE.CubeGeometry(140, 400, 100, 1, 1, 1);
      const wireMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
      enemyCube = new THREE.Mesh(cubeGeometry, wireMaterial);
      enemyCube.position.set(mesh.position.x, mesh.position.y + 200, mesh.position.z);
      scene.add(enemyCube);
      collidableMeshes.push(enemyCube);
      enemyCubes.push(enemyCube);
      scene.add(mesh);
      enemies.add(mesh);

    });
  };
  const addShakes = () => {
    const loader = new GLTFLoader(loadingManager);
    loader.load(`../assets/shake.glb`, gltf => {
      const shake = gltf.scene.children[ 0 ];
      const scale = 50;

      const mesh = shake.clone();
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.x = 0;
      mesh.rotation.y = 0;
      mesh.rotation.z = 0;

      mesh.position.x = (Math.random() * 1500) - 750;
      mesh.position.y = (Math.random() * 2000) + 100;
      mesh.position.z = (Math.random() * 3000) - 1500;

      const cubeGeometry = new THREE.CubeGeometry(120, 200, 100, 1, 1, 1);
      const wireMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
      shakeCube = new THREE.Mesh(cubeGeometry, wireMaterial);
      shakeCube.position.set(mesh.position.x, mesh.position.y + 10, mesh.position.z);
      scene.add(shakeCube);
      collidableMeshesShakes.push(shakeCube);
      shakeCubes.push(shakeCube);
      scene.add(mesh);
      shakes.add(mesh);
    });
  };
  const addEnemiesSpikes = () => {
    const loader = new GLTFLoader(loadingManager);
    loader.load(`../assets/platform.glb`, gltf => {
      const enemy = gltf.scene.children[ 0 ];
      const scale = 80;

      const mesh = enemy.clone();
      mesh.scale.set(scale, scale, scale);
      mesh.rotation.x = 1.5;
      mesh.rotation.y = 0;
      mesh.rotation.z = 0;

      mesh.position.x = (Math.random() * 1500) - 750;
      mesh.position.y = (Math.random() * 2000) + 100;
      mesh.position.z = (Math.random() * 3000) - 1500;

      const cubeGeometry = new THREE.CubeGeometry(390, 250, 100, 1, 1, 1);
      const wireMaterial = new THREE.MeshBasicMaterial({color: 0xff0000, wireframe: true});
      enemySpikeCube = new THREE.Mesh(cubeGeometry, wireMaterial);
      enemySpikeCube.position.set(mesh.position.x, mesh.position.y + 100, mesh.position.z);
      scene.add(enemySpikeCube);
      collidableMeshesSpikes.push(enemySpikeCube);
      enemySpikeCubes.push(enemySpikeCube);
      scene.add(mesh);
      EnemiesSpikes.add(mesh);

    });

  };
  const checkCamPosition = () => {
    if (camera.position.y <= - 250) {
      gameOverFunc();
    }
  };

  const gameOverFunc = () => {
    gameStarted = false;
    gameOver = true;
    fatigue.value = 0;
    themeSound.setVolume(.1);
    if (!gameoverSound.isPlaying) {
      if (gameOverSoundState) {
        gameoverSound.play();
        gameOverSoundState = false;
      }
    }
    const gameOverSection = document.getElementById(`gameover`);
    const gameOverScore = document.querySelector(`.gameover_score`);
    const playAgain = document.querySelector(`.play_again`);
    gameOverSection.className = `too_close display_page_dead`;
    gameOverScore.innerHTML = `${Math.round(flexdistance).toString()  } meter`;
    playAgain.addEventListener(`click`, restartGame);

    if (flexedDown) {
      restartGame();
    }

  };

  const startGame = () => {
    gameStarted = true;
    if (!themeSound.isPlaying) {
      themeSound.play();
    }

    // movePlayer();
    updateDistance();
    showValue();
  };

  const restartGame = () => {
    gameOverSoundState = true;
    gameOver = false;
    gameStarted = true;
    flexdistance = 0;
    themeSound.setVolume(1);

    camera.position.y = 400;
    fatigue.value = 100;

    const gameOverSection = document.getElementById(`gameover`);
    gameOverSection.className = `hide`;

    if (!gameStarted) {
      menuPage();
    } else {
      startGame();
    }
  };

  const updateDistance = () => {
    if (!gameOver && !tooClose) {
      flexdistance += 1;
    } else if (!gameOver && tooClose) {
      flexdistance += 0.1;

    }

    const flexdistancelabel = document.querySelector(`.score-value`);
    flexdistancelabel.innerHTML = Math.round(flexdistance);
  };


  const movePlayer = () => {
    if (input.left === 1 && camera.position.x >= - 610) {
      camera.position.x -= spd;

    }
    if (input.right === 1 && camera.position.x <= 610) {
      camera.position.x += spd;
    }

    if (input.up === 1) {
      camera.position.y += spd;
      camera.position.y += spd;
    }

    if (input.down === 1) {
      camera.position.y -= Math.cos(camera.rotation.y) * spd;
      camera.position.y -= Math.sin(camera.rotation.y) * spd;
    }
  };


  init();

}
