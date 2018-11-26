import * as THREE from 'three';
import * as posenet from '@tensorflow-models/posenet';
import Sea from './classes/Sea.js';
import Bird from './classes/Bird.js';
import 'babel-polyfill';

import {drawBoundingBox, drawKeypoints, drawSkeleton} from './demo_util';

{

  let scene,
    WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, renderer, container;

  let sea, bird;
  const pose = 1;
  let playerPose;
  let hemisphereLight, shadowLight, ambientLight;

  let didFlex = false;
  let tooClose = false;

  let video, net;

  const videoWidth = 400;
  const videoHeight = 300;

    //load audio, best wel nog aparte klasse voor maken
  const audioListener = new THREE.AudioListener();
  const themeSound = new THREE.Audio(audioListener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load(`./assets/flex.mp3`, function(buffer) {
    themeSound.setBuffer(buffer);
    themeSound.setLoop(true);
    themeSound.setVolume(0.2);
    //themeSound.play();
  });


  const init = () => {

    navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;


    createScene();
    createLights();
    createSea();
    createBird();

    checkKeys();

    bindPage();


    //start de render loop
    loop();
  };

  const menuPage = () => {
    const menuPage = document.getElementsByClassName(`menu_page`);
    const menuPlay = document.getElementsByClassName(`menu_play`);
    
    menuPlay[0].addEventListener(`click`, () => { menuPage[0].className = `hide`;});

    if (!tooClose) {
      menuPlay[0].innerHTML = `Flex up to start`;

      if (didFlex) {
        menuPage[0].className = `hide`;
      }
    } else {
      menuPlay[0].innerHTML = `je staat te dicht`;
    }
    
  };

  const tooClosePage = () => {
    const tooCloseSection = document.getElementById(`too_close`);

    console.log(`je staat te dicht`);
    tooClose = true;

    tooCloseSection.className = `too_close display_page`;
    
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
    camera = new THREE.PerspectiveCamera(
          fieldOfView,
          aspectRatio
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

    window.addEventListener(`resize`, onWindowResize, false);

    renderer.setSize(WIDTH, HEIGHT);
    renderer.shadowMap.eneabled = true;

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
    bird = new Bird(pose, scene);

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

  const createSea = () => {
    sea = new Sea();

    console.log(sea);

    sea.mesh.position.y = - 600;

        // add the mesh of the sea to the scene
    scene.add(sea.mesh);
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

          if ((leftElbow.position.y < leftShoulder.position.y && leftWrist.position.y < leftElbow.position.y) || 
          (rightElbow.position.y < rightShoulder.position.y && rightWrist.position.y < rightElbow.position.y)) {
            console.log(`flex up`);
          
            didFlex = true;
            bird.changePose(0, scene);

            setTimeout(() => {
              didFlex = false;
            }, 2000);
            
          } else if ((leftElbow.position.y > leftShoulder.position.y && leftWrist.position.x < leftElbow.position.x - 30) || 
          (rightElbow.position.y >= rightShoulder.position.y && rightWrist.position.x > rightElbow.position.x + 30)) {
            console.log(`flex down`);

            didFlex = true;
            bird.changePose(2, scene);

            setTimeout(() => {
              didFlex = false;
            }, 2000);
          } else {
            console.log(`neutral`);
          }
        }

      }
      
    } else {
      tooClosePage();
    }
  };

  const loop = () => {
    requestAnimationFrame(loop);

    renderer.render(scene, camera);
    //mixer.update(0.01);
    sea.moveWaves();
    bird.animate();

    menuPage();

  };

  init();
}
