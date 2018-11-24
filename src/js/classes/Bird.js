import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

let mixer, gltfGlobal, animation, idle;
let currentAnimation = 1;
//let playing = false;

class Bird {

  constructor(pose, scene) {

    const loader = new GLTFLoader();

    loader.load(`./assets/birb.glb`, gltf => {

      gltf.scene.scale.set(4, 4, 4);
      gltf.scene.rotation.copy(new THREE.Euler(0, - 3 * Math.PI / 6, 0));
      gltf.scene.position.set(200, 100, 0);


      //scene.add(gltf.scene);

      gltfGlobal = gltf;
      this.poses(pose, scene, gltf);
      //console.log(pose);

    });

    
  }

  poses(pose, scene, gltf) {
    //console.log(pose);
    scene.add(gltf.scene);
    
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
    
    //console.log(currentAnimation);

  }

  animate() {
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
