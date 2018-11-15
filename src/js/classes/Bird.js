
import GLTFLoader from 'three-gltf-loader';

const loader = new GLTFLoader();

class Bird {
  constructor() {
    const bird = loader.loadGLTFModel(`assets/untitled.glb`);

  }

}

export default Bird;
