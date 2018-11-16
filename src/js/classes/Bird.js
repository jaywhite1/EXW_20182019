import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

let mixer, gltfGlobal, animation, idle;
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
      console.log(pose);

    });

    
  }

  poses(pose, scene, gltf) {
    console.log(pose);
    scene.add(gltf.scene);
    
    mixer = new THREE.AnimationMixer(gltf.scene);

    animation = mixer.clipAction(gltf.animations[pose]);
    animation.play();


  }

  changePose(pose, scene) {
    //console.log(pose, scene, gltfGlobal);
    this.poses(pose, scene, gltfGlobal);
    animation.setLoop(THREE.LoopOnce);

    idle = mixer.clipAction(gltfGlobal.animations[1]);
    animation.crossFadeTo(idle.play(), 3);


  }

  animate() {
    mixer.update(0.01);
  }
  

}

export default Bird;
