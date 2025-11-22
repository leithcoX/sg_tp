import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

import { SceneManager } from "./sceneManager.js"
import { AirplaneController } from './airplaneController.js';

let scene, renderer, container, sceneManager;
let cameras = []
cameras.push(new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000))
for (let i = 0; i < 8; i++) { cameras.push(cameras[0].clone()) }
let current_camera = 1

let controls2 = null
let controls3 = null

function setupThreeJs() {
    container = document.getElementById("container3D");

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true
    scene = new THREE.Scene();

    container.appendChild(renderer.domElement);

    cameras[1].position.set(15, 25, 35);
    cameras[1].lookAt(0, 0, 0);

    const controls = new OrbitControls(cameras[1], renderer.domElement);
    controls2 = new OrbitControls(cameras[4], renderer.domElement);
    controls2.enablePan = false;
    controls3 = new OrbitControls(cameras[7], renderer.domElement);
    controls3.enablePan = false
    controls3.target.set(7,3.25,-1) // magic number sacado de loggear desde sceneManager

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", changeCamera);
}

function changeCamera(event) {
    const key = event.key
    if (key === 'c') {
        current_camera++
        if (current_camera == sceneManager.cameras.length) current_camera = 0
        console.log("Cambio de camara a " + current_camera)
        onResize()

    } else if (key === 'r') {
        sceneManager.resetAirplane()
    } else if (isFinite(key)) {
        current_camera = key
        onResize()
        console.log("Cambio de camara a " + current_camera)
    }
}

function onResize() {
    sceneManager.cameras[current_camera].aspect = container.offsetWidth / container.offsetHeight;
    sceneManager.cameras[current_camera].updateProjectionMatrix()

    renderer.setSize(container.offsetWidth, container.offsetHeight);
}

function animate() {
    requestAnimationFrame(animate);
    sceneManager.animate()
    if (sceneManager.ship) {
        controls2.target.copy(sceneManager.ship.position)
        controls2.update()
    }
    renderer.render(scene, sceneManager.cameras[current_camera]);
}

setupThreeJs()
sceneManager = new SceneManager(scene, cameras)
onResize()
animate();
