import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { SceneManager } from "./sceneManager.js"
import { AirplaneController } from './airplaneController.js';

let scene, renderer, container, sceneManager;
let cameras = []
cameras.push(new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000))
for (let i = 0; i < 7; i++) { cameras.push(cameras[0].clone()) }
let current_camera = 0

function setupThreeJs() {
    container = document.getElementById("container3D");

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true
    scene = new THREE.Scene();

    container.appendChild(renderer.domElement);

    cameras[0].position.set(15, 25, 35);
    cameras[0].lookAt(0, 0, 0);

    const controls = new OrbitControls(cameras[0], renderer.domElement);

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", changeCamera);
}

function changeCamera(event) {
    const key = event.key
    if (key === 'c') {
        current_camera++
        if (current_camera == sceneManager.cameras.length) current_camera = 0
        onResize()

    } else if (key === 'r') {
        sceneManager.resetAirplane()
    } else if (isFinite(key)) {
        current_camera = key
    }
    console.log("Cambio de camara a " + current_camera)
}

function onResize() {
    sceneManager.cameras[current_camera].aspect = container.offsetWidth / container.offsetHeight;
    sceneManager.cameras[current_camera].updateProjectionMatrix()

    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
    requestAnimationFrame(animate);
    sceneManager.animate()
    renderer.render(scene, sceneManager.cameras[current_camera]);
}

setupThreeJs()
sceneManager = new SceneManager(scene, cameras)
onResize()
animate();
