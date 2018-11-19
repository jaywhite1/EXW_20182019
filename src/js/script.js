import * as THREE from 'three';
import * as posenet from '@tensorflow-models/posenet';
import Sea from './classes/Sea.js';
import Bird from './classes/Bird.js';
import 'babel-polyfill';

{

  let scene,
    WIDTH, HEIGHT,
    camera, fieldOfView, aspectRatio, renderer, container;

  let sea, bird;
  const pose = 1;
  let hemisphereLight, shadowLight, ambientLight;

  let poseScene, poseCamera, poseLight, poseRenderer, poseGroup, poseContainer, video, net;
  const trackers = [];

  // const imageScaleFactor = 0.5;
  // const outputStride = 16;
  // const flipHorizontal = false;

  const videoWidth = 600;
  const videoHeight = 500;

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


  const init = () => {

    navigator.getUserMedia = navigator.getUserMedia ||
    navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

    createPoseScene();

    createScene();
    createLights();
    createSea();
    createBird();

    createTrackers();
    checkKeys();

    bindPage();

    //start de render loop
    loop();
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

  class Tracker {
    constructor() {
      this.position = new THREE.Vector3();

      const geometry = new THREE.SphereGeometry(10, 7, 7);
      const material = new THREE.MeshToonMaterial({color: 0xEFF6EE, 
        opacity: 0.5, 
        transparent: true, 
        wireframe: true, 
        emissive: 0xEFF6EE,
        emissiveIntensity: 1});

      const sphere = new THREE.Mesh(geometry, material);
      poseGroup.add(sphere);

      this.initialise = function() {
        this.position.x = - 10;
        this.position.y = - 10;
        this.position.z = 0;
      };

      this.update = function(x, y, z) {
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
      };

      this.display = function() {
        sphere.position.x = this.position.x;
        sphere.position.y = this.position.y;
        sphere.position.z = this.position.z;

      // console.log(sphere.position);
      };
    }
  }

  const createPoseScene = () => {
    const width = 250;
    const height = 250;

    // Setup scene
    poseScene = new THREE.Scene();

    //  We use an orthographic camera here instead of persepctive one for easy mapping
    //  Bounded from 0 to width and 0 to height
    // Near clipping plane of 0.1; far clipping plane of 1000
    poseCamera = new THREE.OrthographicCamera(0, width, 0, height, 0.1, 1000);
    poseCamera.position.z = 500;

    // Setting up the renderer
    poseRenderer = new THREE.WebGLRenderer({antialias: true});
    poseRenderer.setPixelRatio(window.devicePixelRatio);
    poseRenderer.setSize(width, height);
    poseRenderer.setClearColor(0xDE3C4B, 1);

    // Attach the threejs animation to the div with id of threeContainer

    poseContainer = document.getElementsByClassName(`posetest`);
    poseContainer[0].appendChild(poseRenderer.domElement);

    // Scene lighting
    poseLight = new THREE.HemisphereLight(`#EFF6EE`, `#EFF6EE`, 0);
    poseLight.position.set(0, 0, 0);
    poseScene.add(poseLight);

    poseGroup = new THREE.Group();

    poseScene.add(poseGroup);
  };

  const renderPose = (video, net) => {
    const width = 250;
    const height = 250;

    const canvas = document.getElementById(`output`);
    const ctx = canvas.getContext(`2d`);

  // Flip the webcam image to get it right
    const flipHorizontal = true;

    canvas.width = width;
    canvas.height = height;

    const detect = async () => {

    // Load posenet
      net = await posenet.load(0.5);

    // Scale the image. The smaller the faster
      const imageScaleFactor = 0.75;

    // Stride, the larger, the smaller the output, the faster
      const outputStride = 32;

    // Store all the poses
      const poses = [];

      const pose = await net.estimateSinglePose(video, 
                                              imageScaleFactor, 
                                              flipHorizontal, 
                                              outputStride);
      poses.push(pose);

    // Show a pose (i.e. a person) only if probability more than 0.1
      const minPoseConfidence = 0.1;
    // Show a body part only if probability more than 0.3
      const minPartConfidence = 0.3;

      ctx.clearRect(0, 0, width, height);

      const showVideo = true;

      if (showVideo) {
        ctx.save();
        ctx.scale(- 1, 1);
        ctx.translate(- width, 0);
      // ctx.filter = 'blur(5px)';
        ctx.filter = `opacity(50%) blur(3px) grayscale(100%)`;
        ctx.drawImage(video, 0, 0, width, height);
        ctx.restore();
      }

      poses.forEach(({score, keypoints}) => {
        if (score >= minPoseConfidence) {
          keypoints.forEach((d, i) => {
            if (d.score > minPartConfidence) {
          // console.log(d.part);
          // Positions need some scaling
              trackers[i].update(d.position.x * 0.5, d.position.y * 0.5 - height / 4, 0);
              trackers[i].display();
            }
          // Move out of screen if body part not detected
            else if (d.score < minPartConfidence) {
              trackers[i].update(- 10, - 10, 0);
              trackers[i].display();
            }
          });
        }
      });

      
      poseRenderer.render(poseScene, poseCamera);
      requestAnimationFrame(detect);
      
    };

    detect();
  };

  const createTrackers = () => {
    for (let i = 0;i < 17;i ++) {
      const tracker = new Tracker();
      tracker.initialise();
      tracker.display();
    
      trackers.push(tracker);
    }
  };

  const setupCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
          `Browser API navigator.mediaDevices.getUserMedia not available`);
    }
  
    const video = document.getElementById(`video`);
    video.width = videoWidth;
    video.height = videoHeight;
    console.log(video.width, video.height);
  
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        width: videoWidth,
        height: videoHeight,
      },
    });
    console.log(stream);
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
      console.log(video);
    } catch (e) {
      const info = document.getElementById(`info`);
      info.textContent = `this browser does not support video capture,` +
          `or this device does not have a camera`;
      info.style.display = `block`;
      throw e;
    }

    renderPose(video, net);
    
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

  const loop = () => {
    requestAnimationFrame(loop);

    renderer.render(scene, camera);
    //mixer.update(0.01);
    sea.moveWaves();
    bird.animate();

    // poseRenderer.renderPose(scene, camera);


    //renderPose(video, net);

  };

  init();
}
