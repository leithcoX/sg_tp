import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ElevationGeometry } from './elevationGeometry'
import { AirplaneController } from './airplaneController';
import { Airplane } from './airplane'

const SHOOT_COOLDOWN = 100
const GRAVITY = -10

function addAxes(obj, size = 50) {
    obj.add(new THREE.AxesHelper(size))
}

const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 })

class Bullet {

    constructor(position, speed, mesh) {
        this.mesh = mesh
        this.mesh.position.copy(position)
        this.speed = speed
    }

    update(dt) {
        const speed = this.speed.clone()
        this.mesh.position.add(speed.multiplyScalar(dt))
        this.speed.y += GRAVITY * dt
    }
}

export class SceneManager {
    currentShipT = 0;
    showWireFrames = false;
    isShipLoaded = false
    shootCooldown = 0
    bullet = new THREE.Mesh(new THREE.SphereGeometry(.15), new THREE.MeshPhongMaterial({color: "0xf0f0f0"}))
    bullets = []
    constructor(scene, cameras, vcam) {
        this.scene = scene
        this.cameras = cameras
        this.vcam = vcam
        addAxes(this.bullet)
        // this.vcam = cameras[6].clone()
        this.setupEnv()
        this.setupCampBase()
        this.loadTerrain()
        this.loadShip()
        this.airplane = new Airplane(scene, cameras[2], cameras[3])
        // addAxes(this.airplane)
        this.airPlaneController = new AirplaneController(this.airplane.airplaneCoordSystem,
            {
                maxSpeed: 40,
                accelResponse: .2, // rapidez hacia targetSpeed
                drag: 0.01,

                // límites (radianes)
                pitchLimit: THREE.MathUtils.degToRad(45),
                bankLimit: THREE.MathUtils.degToRad(60),

                // tasas a las que las teclas cambian los objetivos (deg/s)
                pitchCmdRateDeg: 60,
                bankCmdRateDeg: 90,

                // respuesta (1/seg) para filtrar hacia los objetivos
                pitchResponse: 4.0,
                bankResponse: 5.0,

                // auto-centrado cuando no hay input (1/seg)
                pitchCentering: 0.8,
                bankCentering: 1.2,

                // yaw
                turnRateGain: 1.2,         // ganancia viraje coordinado
                yawTaxiRate: Math.PI * 1.2, // yaw directo en taxi

                // transición taxi → vuelo
                stallSpeed: 12,
                ctrlVRange: 25,

                // *** NUEVO: altura mínima (nivel de suelo) ***
                minY: 1.6,

                // *** NUEVO: gravedad simplificada (u/s^2) ***
                gravity: 9.81,

                // amortiguación vertical cuando hay potencia (reduce drift)
                verticalDampingWhenPowered: 2.5
            })

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
                console.log("Isla cargada")
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
        const island = new THREE.Mesh(terrainGeometry, new THREE.MeshPhongMaterial({ color: 0x73FF77 }))
        island.translateY(-1)
        island.rotateY(Math.PI / 2)
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

        this.cameras[8].position.set(5,1.3,8)
        this.cameras[8].lookAt(-7,2,8)
        // this.scene.add(new THREE.CameraHelper(this.cameras[8]))

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

        const towerHeadPosition = towerHead.getWorldPosition(new THREE.Vector3())
        this.cameras[7].position.copy(towerHeadPosition.clone().add(new THREE.Vector3(10,0,10)) );
        this.cameras[7].lookAt(towerHeadPosition)
        // console.log(towerHeadPosition)

        // const chel = new THREE.CameraHelper(this.cameras[7])
        // this.scene.add(chel)

        // campBase.rotateY(Math.PI *1.55)
        // campBase.translateZ(25)


        campBase.traverse((obj) => {
            obj.castShadow = true
            obj.receiveShadow = true
        })

        this.scene.add(campBase)
    }

    loadShip() {
        new GLTFLoader().load('/sg_tp/models/destructor.glb',
            (model) => {
                console.log("Barco Cargado")
                this.isShipLoaded = true
                this.setupShip(model)
            },
            function(xhr) {
                console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
            },
            function(error) {
                console.log('An error happened');
                console.log(error);
            })
    }

    setupShip(shipModel) {
        const shipScene = shipModel.scene
        const scalar = 0.1
        shipScene.position.set(450, 0, 55).multiplyScalar(scalar)
        shipScene.scale.multiplyScalar(scalar)
        shipScene.rotation.set(0, -Math.PI / 2, 0)

        this.ship = new THREE.Group
        this.ship.add(shipScene)

        const persecutionCamera = this.cameras[5]
        persecutionCamera.position.set(0,8,-25)
        persecutionCamera.lookAt(0,0,15)

        this.ship.add(persecutionCamera)

        this.scene.add(this.ship)

        this.shipPathCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-35, -3, 0),
            new THREE.Vector3(-35, -3, -45),
            new THREE.Vector3(-15, -3, -60),
            new THREE.Vector3(5, -3, -55),
            new THREE.Vector3(45, -3, -5),
            new THREE.Vector3(25, -3, 35),
            new THREE.Vector3(-5, -3, 35),
        ], true)


        // HELPERS

        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        const shipPathHelperCurve = new THREE.Line(new THREE.BufferGeometry().setFromPoints(this.shipPathCurve.getPoints(200)), lineMaterial)
        this.scene.add(shipPathHelperCurve)

        addAxes(this.ship, 8)
    }
    shootShipCannon() {
        console.log("Presionaste espacio")
        this.shootCooldown = SHOOT_COOLDOWN
        console.log("ahora el cooldown es", this.shootCooldown)
        const auxBullet = new Bullet(new THREE.Vector3(0,10,0), new THREE.Vector3(0,0,0), this.bullet.clone())
        this.bullets.push(auxBullet)
        this.ship.add(auxBullet.mesh)
    }

    resetAirplane() {
        this.airPlaneController.setTransform({ position: new THREE.Vector3(-11, 0, 8), euler: new THREE.Euler(0, -Math.PI / 2, 0) })
        console.log("Reseteo")
    }

    animate() {
        this.airPlaneController.update(.01)
        this.airplane.updatePersecutionCamera()

        this.currentShipT = (this.currentShipT + .0005) % 1;

        this.shootCooldown = Math.max(0, this.shootCooldown-1)
        if (this.shootCooldown >= 0)
            console.log(this.shootCooldown)

        for (let b of this.bullets) {
            // console.log(b)
            b.update(.01)
        }
        if (this.isShipLoaded) {
            const position = this.shipPathCurve.getPointAt(this.currentShipT);
            const tangent = this.shipPathCurve.getTangentAt(this.currentShipT)
            this.ship.position.copy(position)
            this.ship.lookAt(tangent.add(position));


            // Manejo de camara orbital del barco
            // Es un objeto en movimiento por lo que se simula una camara virtual
            const tmpOffset = new THREE.Vector3();
            const objWorldQuat = new THREE.Quaternion();
            tmpOffset.copy(this.vcam.position); // ya que controls.target=0,0,0
            this.ship.getWorldQuaternion(objWorldQuat);
            tmpOffset.applyQuaternion(objWorldQuat);

            this.cameras[4].position.copy(position).add(tmpOffset);
            // Alineamos el “up” de la cámara REAL con el “up” mundial del objeto
            // const upWorld = new THREE.Vector3(0,1,0);
            // upWorld.applyQuaternion(objWorldQuat);
            // this.cameras[4].up.copy(upWorld);
            this.cameras[4].lookAt(position);
        }
    }
}
