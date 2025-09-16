import * as THREE from 'three';
import { ElevationGeometry } from './elevationGeometry'

const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 })

export class SceneManager {
    constructor(scene) {
        this.scene = scene
        this.setupEnv()
        this.setupCampBase()
        this.loadTerrain()
    }

    setupEnv() {
        this.scene.background = new THREE.Color(0xa8bbe6)

        const hemisphereLight = new THREE.HemisphereLight(0xF0F0FF, 0xFFFFFF, 1);
        this.scene.add(hemisphereLight);
        // this.scene.add(new THREE.HemisphereLightHelper(hemisphereLight))

        const intensity = 1;
        const light = new THREE.DirectionalLight(0xFFFFFF, intensity);
        light.position.set(-25, 15, -10);
        light.target.position.set(6, 0, 2);
        light.castShadow = true
        this.scene.add(light);
        this.scene.add(light.target);
        // this.scene.add(new THREE.DirectionalLightHelper(light))
    }

    loadTerrain() {
        this.texture = new THREE.TextureLoader().load('/sg_tp/maps/isle.png',
            (_) => {
                this.setupTerrain();
                console.log("Cargado")
            },
            function(xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            function(error) {
                console.log('An error happened');
                console.log(error);
            }
        )
    }

    setupTerrain() {
        const map = new THREE.Group()
        const seaSize = 150
        const seaGeometry = new THREE.CircleGeometry(seaSize)
        const seaMaterial = new THREE.MeshPhongMaterial({ color: 0x5689FF })
        const sea = new THREE.Mesh(seaGeometry, seaMaterial)
        sea.rotateX(-Math.PI / 2)
        sea.receiveShadow = true
        map.add(sea)

        const width = 120;
        const height = 120;
        const amplitude = 10;
        const widthSegments = 100;
        const heightSegments = 100;

        const terrainGeometry = new ElevationGeometry(width, height, amplitude, widthSegments, heightSegments, this.texture);
        const island = new THREE.Mesh(terrainGeometry, greenMaterial)
        island.translateY(-1)
        island.rotateY(Math.PI /2)
        island.receiveShadow = true
        map.add(island)
        map.translateY(-3)
        map.translateZ(-20)
        map.rotateY(Math.PI * -1.55)
        this.scene.add(map)
    }

    setupCampBase() {
        const campBase = new THREE.Group()

        const groundBase = new THREE.BoxGeometry(22, 2, 10)
        const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xC0C0C0 })
        const ground = new THREE.Mesh(groundBase, groundMaterial)
        campBase.add(ground)

        const airstripGeometry = new THREE.BoxGeometry(30, 2, 6)
        const airstrip = new THREE.Mesh(airstripGeometry, groundMaterial)
        campBase.add(airstrip)
        airstrip.translateZ(8)
        airstrip.translateX(2)

        const radiusTop = 1;
        const radiusBottom = 1;
        const height = 4;
        const radialSegments = 12;
        const heightSegments = 2;
        // const thetaStart = Math.PI * 0.25;
        const thetaLength = Math.PI;
        const campGeometry = new THREE.CylinderGeometry(
            radiusTop, radiusBottom, height,
            radialSegments, heightSegments,
            false,
            0, thetaLength);
        const campMaterial = new THREE.MeshPhongMaterial({ color: 0x656A4F })
        const camp = new THREE.Mesh(campGeometry, campMaterial)
        camp.position.set(3.75, .9, -2)
        camp.rotateZ(Math.PI / 2)
        camp.rotateX(Math.PI / 2)
        campBase.add(camp)

        const CAMPS_AMMOUNT = 7
        for (let i = 1; i < CAMPS_AMMOUNT; i++) {
            campBase.add(camp.clone().translateZ(-2.2 * i))
        }

        const towerMaterial = new THREE.MeshPhongMaterial({ color: 0xC1BF76 })
        const h = 2.5
        const towerBody = new THREE.BoxGeometry(1, h, 1)
        const tower = new THREE.Mesh(towerBody, towerMaterial)
        tower.position.set(7, 1 + h / 2, -1)
        campBase.add(tower)

        const towerHeadGeometry = new THREE.ConeGeometry(1.1, 1.1, 4)
        const towerHead = new THREE.Mesh(towerHeadGeometry, towerMaterial)
        towerHead.translateY(1)
        towerHead.rotateZ(Math.PI).rotateY(Math.PI / 4)
        tower.add(towerHead)

        // campBase.rotateY(Math.PI *1.55)
        // campBase.translateZ(25)


        campBase.traverse((obj) => {
            obj.castShadow = true
            obj.receiveShadow = true
        })

        this.scene.add(campBase)
    }

    animate() {
    }
}
