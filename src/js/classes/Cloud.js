import Colors from '../Colors.js';
import { TetrahedronGeometry } from '../three.js';

class Cloud {
    constructor() {
        this.mesh = new TetrahedronGeometry.object3D();

        var geom = new THREE.BoxGeometry(20,20,20);

        var mat = new THREE.MeshPhongMaterial({
            color: Colors.white
        });

        let nBlocs = 3+Math.floor(Math.random()*3);
        nBlocs.forEach((index) => {
            var m = new THREE.Mesh(geom, mat); 

            // set the position and the rotation of each cube randomly
            m.position.x = i*15;
            m.position.y = Math.random()*10;
            m.position.z = Math.random()*10;
            m.rotation.z = Math.random()*Math.PI*2;
            m.rotation.y = Math.random()*Math.PI*2;
            
            // set the size of the cube randomly
            var s = .1 + Math.random()*.9;
            m.scale.set(s,s,s);
            });

            // allow each cube to cast and to receive shadows
            m.castShadow = true;
            m.receiveShadow = true;
            
            // add the cube to the container we first created
            this.mesh.add(m);
    }
}

export default Cloud