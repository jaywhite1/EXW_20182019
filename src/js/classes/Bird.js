import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

let mixer, gltfGlobal, animation, idle;
let currentAnimation = 1;
//let playing = false;
let up = true;
let down = false;

class Bird {

  constructor(pose, scene, loadingManager) {

    const loader = new GLTFLoader(loadingManager);

    loader.load(`./assets/birb.glb`, gltf => {

      gltf.scene.scale.set(0.5, 0.5, 0.5);


      //scene.add(gltf.scene);

      gltfGlobal = gltf;
      this.poses(pose, scene, gltf);

    });


  }

  poses(pose, scene, gltf) {
    console.log(pose);

    scene.add(gltf.scene);
    gltf.scene.position.set(0, - 18, - 50);
    gltf.scene.rotation.y = Math.PI;
    mixer = new THREE.AnimationMixer(gltf.scene);

    animation = mixer.clipAction(gltf.animations[pose]);
    animation.play();


  }

  changePose(pose, scene) {
    //console.log(pose, scene, gltfGlobal);
    currentAnimation = pose;
    this.poses(pose, scene, gltfGlobal);
    animation.setLoop(THREE.LoopOnce);
    //console.log(currentAnimation);

    idle = mixer.clipAction(gltfGlobal.animations[1]);
    animation.crossFadeTo(idle.play(), 5);


    setTimeout(() => {
      currentAnimation = 1;
    }, 400);

    console.log(currentAnimation);

  }

  tilt(left, right) {
    if (left === 0 && right === 0) {
      console.log(gltfGlobal.scene.rotation.z);
      if (gltfGlobal.scene.rotation.z < 0) {
        if (gltfGlobal.scene.rotation.z === 0) {
          gltfGlobal.scene.rotation.z === 0;
        } else {
          gltfGlobal.scene.rotation.z += 0.03;
        }

      }
      if (gltfGlobal.scene.rotation.z >  0) {
        if (gltfGlobal.scene.rotation.z === 0) {
          gltfGlobal.scene.rotation.z === 0;
        } else {
          gltfGlobal.scene.rotation.z -= 0.03;
        }
      }
    }
    if (left === 1) {
      if (gltfGlobal.scene.rotation.z <= - 0.6) {
        gltfGlobal.scene.rotation.z = - 0.6;
      } else {
        gltfGlobal.scene.rotation.z -= 0.03;
      }
    } else if (right === 1) {
      if (gltfGlobal.scene.rotation.z >=  0.6) {
        gltfGlobal.scene.rotation.z =  0.6;
      } else {
        gltfGlobal.scene.rotation.z += 0.03;
      }
    }


  }
  animate(camera) {
    gltfGlobal.scene.rotation.x = camera / 5000 - 0.5;
    if (up) {
      gltfGlobal.scene.position.y += 0.05;
      gltfGlobal.scene.rotation.x += 0.003;
      setTimeout(() => {
        up = false;
        down = true;
      }, 400);
    } else if (down) {
      gltfGlobal.scene.position.y -= 0.05;
      gltfGlobal.scene.rotation.x -= 0.003;
      setTimeout(() => {
        down = false;
        up = true;
      }, 400);
    }
    if (currentAnimation === 1) {
      mixer.update(0.02);
    } else if (currentAnimation === 0) {
      mixer.update(0.05);
    } else if (currentAnimation === 2) {
      mixer.update(0.05);
    }
  }


}

export default Bird;
