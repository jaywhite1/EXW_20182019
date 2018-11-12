{
  const canvas = document.getElementById('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(62, canvas.width / canvas.height, 0.1, 2000);
  camera.position.set(0, 0, 3);

  const material = new THREE.MeshBasicMaterial({color: 'red', wireframe: true});
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  const animate = () => {
    requestAnimationFrame( animate );
    cube.rotation.y += 0.01;
    renderer.render(scene, camera);
  };

  animate();

  window.addEventListener( 'resize', function()
{
  renderer.setSize( window.innerWidth, window.innerHeight );
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix( );
} );

}
