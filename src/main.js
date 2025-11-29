import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

import { SceneManager } from "./sceneManager.js"
import { AirplaneController } from './airplaneController.js';

let scene, renderer, container, sceneManager;
let vcam = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000)
let cameras = []
for (let i = 0; i < 10; i++) { cameras.push(vcam.clone()) }
let current_camera = 1

let controls
let controls2
let controls3
let cannonControl

function setupThreeJs() {
    container = document.getElementById("container3D");

    renderer = new THREE.WebGLRenderer();
    renderer.shadowMap.enabled = true
    scene = new THREE.Scene();

    container.appendChild(renderer.domElement);

    cameras[1].position.set(15, 25, 35);
    cameras[1].lookAt(0, 0, 0);

    controls = new OrbitControls(cameras[1], renderer.domElement);
    vcam.position.set(10, 0, 0)
    controls2 = new OrbitControls(vcam, renderer.domElement);
    controls2.target.set(0, 0, 0);
    controls2.enablePan = false;
    cannonControl = new PointerLockControls(cameras[6], renderer.domElement)
    cannonControl.pointerSpeed = 2
    controls3 = new OrbitControls(cameras[7], renderer.domElement);
    controls3.enablePan = false
    controls3.target.set(7, 3.25, -1) // magic number sacado de loggear desde sceneManager

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", changeCamera);
    window.addEventListener("keydown", shootCannon);
}

function shootCannon(event) {
    const key = event.key
    if (key === ' ') {
        sceneManager.shootShipCannon()
    }
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
    } else if (isFinite(key) && key != ' ') {
        if (key == 6) {
            cannonControl.lock()
            controls.enabled = false
            controls2.enabled = false
            controls3.enabled = false
        } else {
            cannonControl.unlock()
            controls.enabled = true
            controls2.enabled = true
            controls3.enabled = true
        }
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
    controls2.update()
    renderer.render(scene, sceneManager.cameras[current_camera]);
}

setupThreeJs()
sceneManager = new SceneManager(scene, cameras, vcam)
onResize()
animate();
