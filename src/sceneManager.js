import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ElevationGeometry } from './elevationGeometry'

const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 })

export class SceneManager {
    constructor(scene) {
        this.scene = scene
        this.setupEnv()
        this.setupCampBase()
        this.loadTerrain()
        this.loadShip()
        this.setupAirplane()
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

    loadShip() {
        new GLTFLoader().load('/sg_tp/models/destructor.glb',
            (model) => {
                console.log("Cargado")
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
        console.log(shipModel)
        this.ship = shipModel.scene
        this.ship.position.set(0, -2.8, -40)
        this.ship.scale.set(.15, .15, .15)
        this.scene.add(this.ship)
    }



    setupAirplane() {
        this.airplane = new THREE.Group()

        const airplaneMaterial = new THREE.MeshPhongMaterial({ color: 0x536379 })
        const referencia = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2), greenMaterial)
        referencia.position.set(-6.5, 1.5, 8)
        // this.scene.add(referencia)


        const fuselageCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 4, 2),
            new THREE.Vector3(55.6, 10, 10),
            new THREE.Vector3(110, 15.6, 15.6),
            new THREE.Vector3(174.5, 15.6, 15.6),
            new THREE.Vector3(190, 15, 8.5),
            new THREE.Vector3(195, 15, 3),
        ])
        function buildFuselageGeometry(u, v, target) {
            const theta = 2 * Math.PI * v;

            const curvepoint = fuselageCurve.getPointAt(u)
            const radius = curvepoint.z

            const x = curvepoint.x
            const y = Math.sin(theta) * radius - curvepoint.y
            const z = Math.cos(theta) * radius
            target.set(x, y, z)
        }
        const fuselageGeometry = new ParametricGeometry(buildFuselageGeometry, 20, 20)
        const fuselage = new THREE.Mesh(fuselageGeometry, airplaneMaterial)

        const wireframe = new THREE.EdgesGeometry(fuselageGeometry)
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0 });
        const fuselageWireframe = new THREE.LineSegments(wireframe, lineMaterial);

        this.airplane.add(fuselage)
        this.airplane.add(fuselageWireframe);

        const engineCurve = new THREE.CubicBezierCurve(
            new THREE.Vector2(1, 130),
            new THREE.Vector2(7, 135),
            new THREE.Vector2(10, 158),
            new THREE.Vector2(0, 158)
        );
        const enginePoints = engineCurve.getPoints(50);
        const engineGeometry = new THREE.LatheGeometry(enginePoints)
        const engine = new THREE.Mesh(engineGeometry, greenMaterial)

        engine.translateX(-130)
        engine.rotateZ(Math.PI / 2)
        engine.rotateX(Math.PI)
        engine.add(new THREE.AxesHelper(10))
        this.airplane.add(engine)
        engine.position.set(0, -12, -15.6 * 3)
        const helixes = new THREE.Group()
        const helixGeometry = new THREE.CylinderGeometry(2,1,4,4)
        // const helixBufferGeometry = new THREE.mes
        const helixMaterial = new THREE.MeshPhongMaterial({color:0xF0F0F0})
        const helix = new THREE.Mesh(helixGeometry, greenMaterial)
        helixes.add(helix)
        this.scene.add(helixes)
        this.scene.add(engine)



        const wheels = new THREE.Group()
        const wheelGeometry = new THREE.CylinderGeometry(2, 2, 1)
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x0 })
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
        wheel.position.set(-5,.75,0)
        const wheelClone = wheel.clone()
        wheelClone.translateY(-1.5)

        for (let i = 0; i < 2; i++) {
            wheels.add(wheelClone.clone())
            wheels.add(wheel.clone())
            wheel.translateX(5)
            wheelClone.translateX(5)
        }
        wheels.add(wheel)
        wheels.add(wheelClone)

        const barsMaterial = new THREE.MeshPhongMaterial({color:0xAAAAAA})
        const horizontalBar = new THREE.Mesh(new THREE.BoxGeometry(11,.5,1.5), barsMaterial)
        wheels.add(horizontalBar)

        const verticalBar = horizontalBar.clone()
        verticalBar.rotateY(Math.PI/2).translateX(11/2)
        wheels.add(verticalBar)

        wheels.position.set(143,-38,-7)
        wheels.rotateX(Math.PI/2)
        const wheelsClone = wheels.clone()
        wheelsClone.translateY(14)
        this.airplane.add(wheels)
        this.airplane.add(wheelsClone)

        this.scene.add(this.airplane)

        this.airplane.position.set(0,40,0)
    }

    animate() {
    }
}
