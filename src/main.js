import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { SceneManager } from "./sceneManager.js"

let scene, camera, renderer, container, sceneManager;

function setupThreeJs() {
    container = document.getElementById("container3D");

    renderer = new THREE.WebGLRenderer();
    scene = new THREE.Scene();

    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 30, 30);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener("resize", onResize);
    onResize();
}

function onResize() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix()

    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
    requestAnimationFrame(animate);
    sceneManager.animate()
    renderer.render(scene, camera);
}

setupThreeJs()
sceneManager = new SceneManager(scene)
animate();
