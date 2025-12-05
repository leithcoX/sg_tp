import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ElevationGeometry } from './elevationGeometry'
import { AirplaneController } from './airplaneController';
import { Airplane } from './airplane'

const SHOOT_COOLDOWN = 100
const GRAVITY = -10

function addAxes(obj, size = 50) {
    obj.add(new THREE.AxesHelper(size))
}

const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 })


const EXPLOTION_MAX_TIME = 4
const EXPLOTION_INITIAL_SIZE = 1
const EXPLOTION_FINAL_SIZE = 10

class Explotion {
    age = 0
    alive = true
    constructor(position, lifetime, mesh) {
        this.lifetime = lifetime
        this.mesh = mesh
        this.mesh.position.copy(position)
    }

    update(dt) {
        if (!this.alive) return

        this.age += dt
        const t = this.age / this.lifetime;

        if (t >= 1) {
            this.alive = false;
            return;
        }

        const size = EXPLOTION_INITIAL_SIZE + (EXPLOTION_FINAL_SIZE - EXPLOTION_INITIAL_SIZE) * t;
        this.mesh.scale.set(size, size, size);
        this.mesh.material.opacity = 1 - t;
    }
}

class ExplotionManager {
    explotions = []
    modelGeometry = new THREE.SphereGeometry(1)
    modelMaterial = new THREE.MeshPhongMaterial({ color: 0xe8cfb8 })

    constructor(scene) {
        this.scene = scene
        this.modelMaterial.transparent = true;
        this.modelMaterial.depthWrite = false;
        this.modelMaterial.opacity = 1;
    }

    addExplotion(position, time = EXPLOTION_MAX_TIME) {
        const e = new Explotion(position, time, new THREE.Mesh(this.modelGeometry, this.modelMaterial.clone()))
        this.scene.add(e.mesh)
        this.explotions.push(e)
    }

    updateExplotions(dt) {
        for (let i = this.explotions.length - 1; i >= 0; i--) {
            const e = this.explotions[i]
            e.update(dt)
            if (!e.alive) {
                this.explotions.splice(i, 1)
                this.scene.remove(e.mesh)
                console.log("Explotion ended")
            }
        }
    }
}


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

    hasImpacted() {
        return this.mesh.position.y < -3
    }

}

class BulletManager {
    bullets = []
    bulletModel = new THREE.Mesh(new THREE.SphereGeometry(.15), new THREE.MeshPhongMaterial({ color: 0x505050 }))
    constructor(scene, explotionManager) {
        this.scene = scene
        this.explotionManager = explotionManager
    }

    addBullet(position, speed) {
        const b = new Bullet(position, speed, this.bulletModel.clone())
        this.bullets.push(b)
        this.scene.add(b.mesh)
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i]
            b.update(dt)
            if (b.hasImpacted()) {
                this.destroyBullet(b)
                this.bullets.splice(i, 1)
                console.log("Bullet cleaned")
            }
        }
    }

    destroyBullet(b) {
        this.explotionManager.addExplotion(b.mesh.position)
        b.mesh.parent.remove(b.mesh)

    }

}

export class SceneManager {
    currentShipT = 0;
    showWireFrames = false;
    isShipLoaded = false
    shootCooldown = 0
    constructor(scene, cameras, vcam) {
        this.scene = scene
        this.explotionManager = new ExplotionManager(scene)
        this.bulletManager = new BulletManager(scene, this.explotionManager)
        this.cameras = cameras
        this.vcam = vcam
        // this.vcam = cameras[6].clone()
        this.setupEnv()
        this.loadSkyBox()
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

    loadSkyBox() {
        const loader = new THREE.TextureLoader();
        const texture = loader.load('/sg_tp/maps/partly_cloudy_puresky.jpg', () => {
            texture.mapping = THREE.EquirectangularReflectionMapping;
            this.scene.background = texture;
        });
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
        const seaSize = 1500
        const REPEAT = 70
        const seaTexture = new THREE.TextureLoader().load("/sg_tp/public/maps/sea/Water_001_COLOR.jpg")
        seaTexture.wrapS = THREE.RepeatWrapping;
        seaTexture.wrapT = THREE.RepeatWrapping;
        seaTexture.repeat.set(REPEAT, REPEAT)
        const seaNormalMap = new THREE.TextureLoader().load("/sg_tp/public/maps/sea/Water_001_NORM.jpg")
        seaNormalMap.wrapS = THREE.RepeatWrapping;
        seaNormalMap.wrapT = THREE.RepeatWrapping;
        seaNormalMap.normalScale = new THREE.Vector2(0, 4)
        seaNormalMap.repeat.set(REPEAT, REPEAT)
        const seaGeometry = new THREE.CircleGeometry(seaSize)
        // const seaMaterial = new THREE.MeshPhongMaterial({ color: 0x5689FF })
        const seaMaterial = new THREE.MeshPhongMaterial({ map: seaTexture, normalMap: seaNormalMap })
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

        this.cameras[8].position.set(5, 1.3, 8)
        this.cameras[8].lookAt(-7, 2, 8)
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

        const loader = new THREE.TextureLoader();
        const texture = loader.load('/sg_tp/public/maps/green_metal_rust_diff_4k.jpg')

        const campMaterial = new THREE.MeshPhongMaterial({ color: 0x777f70, map: texture })
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
        this.cameras[7].position.copy(towerHeadPosition.clone().add(new THREE.Vector3(10, 0, 10)));
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
        this.ship = shipModel.scene.getObjectByName("destructor")

        this.turret = this.ship.getObjectByName("torreta")
        const turret = this.turret

        this.cannon = this.ship.getObjectByName("canon")
        const cannon = this.cannon

        const loader = new THREE.TextureLoader();
        const material = new THREE.MeshPhongMaterial(
            {
                map: loader.load("/sg_tp/public/maps/destructor/metal_plate_02_diff_4k.jpg"),
                normalMap: loader.load("/sg_tp/public/maps/destructor/metal_plate_02_nor_4k.exr"),
                shininess: 100,
            }
        )
        material.specular.set(0x888888);
        this.ship.parent.traverse((descendant) => {
            descendant.receiveShadow = true;
            descendant.castShadow = true;
            descendant.material = material;
            console.log(descendant)
        })

        this.turretCamera = this.cameras[6]
        cannon.add(this.turretCamera)

        const tmp = new THREE.Vector3()
        cannon.getWorldPosition(tmp)
        this.turretCamera.lookAt(tmp.add(new THREE.Vector3(1, 0, 0)))
        this.turretCamera.position.set(-1, 4, 0)
        // this.scene.add(new THREE.CameraHelper(this.turretCamera))

        const scalar = 0.1
        this.ship.position.set(450, 0, 55).multiplyScalar(scalar)
        this.ship.scale.multiplyScalar(scalar)

        const persecutionCamera = this.cameras[5]
        persecutionCamera.position.set(0, 8, -25)
        persecutionCamera.lookAt(0, 0, 15)

        this.ship.add(persecutionCamera)

        this.scene.add(this.ship)

        this.shipPathCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-35, -2.3, 0),
            new THREE.Vector3(-35, -2.3, -45),
            new THREE.Vector3(-15, -2.3, -60),
            new THREE.Vector3(5, -2.3, -55),
            new THREE.Vector3(45, -2.3, -5),
            new THREE.Vector3(25, -2.3, 35),
            new THREE.Vector3(-5, -2.3, 35),
        ], true)


        // HELPERS

        // const lineMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
        // const shipPathHelperCurve = new THREE.Line(new THREE.BufferGeometry().setFromPoints(this.shipPathCurve.getPoints(200)), lineMaterial)
        // this.scene.add(shipPathHelperCurve)

        // addAxes(this.ship, 8)
    }

    shootShipCannon() {
        if (this.shootCooldown > 0) {
            console.log("Aun hay cooldown")
            return
        }

        this.shootCooldown = SHOOT_COOLDOWN
        console.log("ahora el cooldown es", this.shootCooldown)

        const dir = new THREE.Vector3();
        const pos = new THREE.Vector3();
        this.turretCamera.getWorldDirection(dir)
        this.cannon.getWorldPosition(pos)

        this.bulletManager.addBullet(pos.add(dir), dir.multiplyScalar(30))
    }

    rotateCannonUp() {
        this.cannon.rotation.z = Math.min(this.cannon.rotation.z + 0.01 * Math.PI, -Math.PI / 4)
    }

    rotateCannonDown() {
        this.cannon.rotation.z = Math.max(this.cannon.rotation.z - 0.01 * Math.PI, -1.75) // magic number sacado de logear rotation.z
    }

    rotateCannonLeft() {
        this.turret.rotateY(0.01 * Math.PI)
    }
    rotateCannonRight() {
        this.turret.rotateY(-0.01 * Math.PI)
    }


    resetAirplane() {
        this.airPlaneController.setTransform({ position: new THREE.Vector3(-11, 0, 8), euler: new THREE.Euler(0, -Math.PI / 2, 0) })
        console.log("Reseteo")
    }

    animate() {
        this.airPlaneController.update(.01)
        this.airplane.updatePersecutionCamera()
        this.airplane.animateHelixes(this.airPlaneController.getStatus().speed)

        this.currentShipT = (this.currentShipT + .0005) % 1;

        this.shootCooldown = Math.max(0, this.shootCooldown - 1)
        // if (this.shootCooldown > 0)
        //     console.log(this.shootCooldown)

        this.bulletManager.updateBullets(.015)
        this.explotionManager.updateExplotions(.015)
        if (this.isShipLoaded) {
            const position = this.shipPathCurve.getPointAt(this.currentShipT);
            const tangent = this.shipPathCurve.getTangentAt(this.currentShipT)
            this.ship.position.copy(position)
            this.ship.lookAt(tangent.add(position));
            this.ship.rotateY(-Math.PI / 2)


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

    test() {
        this.explotionManager.addExplotion(new THREE.Vector3(0, 10, 0))
    }
    test2() {
        this.explotionManager.addExplotion(new THREE.Vector3(10, 10, 0))
    }

}
