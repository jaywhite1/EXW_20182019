import * as THREE from 'three';
import GLTFLoader from 'three-gltf-loader';


class Bird {
  constructor(scene) {

    const loader = new GLTFLoader();

    loader.load(`./assets/birb.glb`, gltf => {

      gltf.scene.scale.set(4, 4, 4);
      gltf.scene.rotation.copy(new THREE.Euler(0, - 3 * Math.PI / 6, 0));
      gltf.scene.position.set(200, 100, 0);
      
      scene.add(gltf.scene);
    });

    
  }
  

}

export default Bird;
