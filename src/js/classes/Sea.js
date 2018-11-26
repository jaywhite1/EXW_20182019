import * as THREE from 'three';
import Colors from '../Colors.js';

class Sea {
  constructor() {

    const geom = new THREE.CylinderGeometry(600, 600, 1500, 40, 10);

    geom.mergeVertices();

    this.waves = [];

    geom.vertices.forEach(vertex => {
      this.waves.push({
        x: vertex.x,
        y: vertex.y,
        z: vertex.z,
                //angle
        ang: Math.random() * Math.PI * 2,
                //distance
        amp: Math.random() * 15 + 5,
        speed: 0.016 + Math.random() * 0.032
      });
    });


    const mat = new THREE.MeshPhongMaterial({
      color: Colors.blue,
            // transparent: true,
            // opacity:.6,
      shading: THREE.FlatShading,
    });

    this.mesh = new THREE.Mesh(geom, mat);
  }

  moveWaves() {
    this.mesh.geometry.vertices.forEach((vertex, index) => {
      const wave = this.waves[index];

      vertex.x = wave.x + Math.cos(wave.ang) * wave.amp;
      vertex.y = wave.y + Math.sin(wave.ang) * wave.amp;

      wave.ang += wave.speed;
    });

    this.mesh.geometry.verticesNeedUpdate = true;

  }
}

export default Sea;
