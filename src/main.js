import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { SceneManager } from "./sceneManager.js"
import { AirplaneController } from './airplaneController.js';

let scene, camera, renderer, container, sceneManager;
let current_camera = 0

function setupThreeJs() {
    container = document.getElementById("container3D");

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true
    scene = new THREE.Scene();

    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(15, 25, 35);
    camera.lookAt(0, 0, 0);

    const controls = new OrbitControls(camera, renderer.domElement);

    window.addEventListener("resize", onResize);
    onResize();
    window.addEventListener('keydown', changeCamera)
}

function changeCamera(event) {
    if (event.key === 'c') {
        current_camera++
        console.log("Cambio de camara a " + current_camera)
    } else if (event.key === 'r') {
        sceneManager.resetAirplane()
    }
    if (current_camera == sceneManager.cameras.length) current_camera = 0
}

function onResize() {
    camera.aspect = container.offsetWidth / container.offsetHeight;
    camera.updateProjectionMatrix()

    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
    requestAnimationFrame(animate);
    sceneManager.animate()
    renderer.render(scene, sceneManager.cameras[current_camera]);
}

setupThreeJs()
sceneManager = new SceneManager(scene, camera)
animate();
