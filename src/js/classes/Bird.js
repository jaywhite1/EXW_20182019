import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';

let mixer, gltfGlobal;

class Bird {

  constructor(pose, scene) {

    const loader = new GLTFLoader();

    loader.load(`./assets/birb.glb`, gltf => {

      gltf.scene.scale.set(4, 4, 4);
      gltf.scene.rotation.copy(new THREE.Euler(0, - 3 * Math.PI / 6, 0));
      gltf.scene.position.set(200, 100, 0);


      //scene.add(gltf.scene);

      gltfGlobal = gltf;
      console.log(test);

      this.poses(pose, scene, gltf);

    });

    
  }

  poses(pose, scene, gltf) {
    console.log(gltf);
    scene.add(gltf.scene);
    
    mixer = new THREE.AnimationMixer(gltf.scene);
    mixer.clipAction(gltf.animations[pose]).play();

  }

  changePose(pose, scene) {
    console.log(pose, scene, gltfGlobal);
    this.poses(pose, scene, gltfGlobal);
  }

  animate() {
    mixer.update(0.01);
  }
  

}

export default Bird;
