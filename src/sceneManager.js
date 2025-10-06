import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';
import { ElevationGeometry } from './elevationGeometry'
import { AirplaneController } from './airplaneController';

function addAxes(obj, size = 50) {
    obj.add(new THREE.AxesHelper(size))
}

const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 })

export class SceneManager {
    currentShipT = 0;
    showWireFrames = false;
    isShipLoaded = false
    constructor(scene, cameras) {
        this.scene = scene
        this.cameras = cameras
        this.setupEnv()
        this.setupCampBase()
        this.loadTerrain()
        this.loadShip()
        this.setupAirplane()
        this.airPlaneController = new AirplaneController(this.airplaneCoordSystem,
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



    setupAirplane() {
        this.airplane = new THREE.Group()

        const airplaneMaterial = new THREE.MeshPhongMaterial({ color: 0x536379 })
        const referencia = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2), greenMaterial)
        referencia.position.set(-6.5, 1.5, 8)
        // this.scene.add(referencia)

        /* FUSELAGE */

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



        const fuselageCapGeometry = new THREE.CircleGeometry(2)
        const fuselageCap = new THREE.Mesh(fuselageCapGeometry, airplaneMaterial)
        fuselageCap.rotateY(-Math.PI / 2).translateY(-4)
        this.airplane.add(fuselageCap)

        const fuselageNoseCapGeometry = new THREE.CircleGeometry(3)
        const fuselageNoseCap = new THREE.Mesh(fuselageNoseCapGeometry, airplaneMaterial)
        fuselageNoseCap.rotateY(Math.PI / 2).translateY(-15).translateZ(195)
        this.airplane.add(fuselageNoseCap)

        this.airplane.add(fuselage)

        /* HELIXES */

        const helixes = new THREE.Group()
        const helixGeometry = new THREE.CylinderGeometry(2, 1, 4, 4)
        const helixBufferGeometry = new THREE.BufferGeometry();
        const ip = { b: .3, t: 4.3 }
        const helixVertices = [
            // front
            { pos: [-.05, ip.b, .5], norm: [0, 0, 1], uv: [0, 0], },
            { pos: [.05, ip.b, .5], norm: [0, 0, 1], uv: [1, 0], },
            { pos: [-.05, ip.t, .3], norm: [0, 0, 1], uv: [0, 1], },
            { pos: [.05, ip.t, .3], norm: [0, 0, 1], uv: [1, 1], },
            // right
            { pos: [.05, ip.b, .5], norm: [1, 0, 0], uv: [0, 0], },
            { pos: [.05, ip.b, -.5], norm: [1, 0, 0], uv: [1, 0], },
            { pos: [.05, ip.t, .3], norm: [1, 0, 0], uv: [0, 1], },
            { pos: [.05, ip.t, -.3], norm: [1, 0, 0], uv: [1, 1], },
            // back
            { pos: [.05, ip.b, -.5], norm: [0, 0, -1], uv: [0, 0], },
            { pos: [-.05, ip.b, -.5], norm: [0, 0, -1], uv: [1, 0], },
            { pos: [.05, ip.t, -.3], norm: [0, 0, -1], uv: [0, 1], },
            { pos: [-.05, ip.t, -.3], norm: [0, 0, -1], uv: [1, 1], },
            // left
            { pos: [-.05, ip.b, -.5], norm: [-1, 0, 0], uv: [0, 0], },
            { pos: [-.05, ip.b, .5], norm: [-1, 0, 0], uv: [1, 0], },
            { pos: [-.05, ip.t, -.3], norm: [-1, 0, 0], uv: [0, 1], },
            { pos: [-.05, ip.t, .3], norm: [-1, 0, 0], uv: [1, 1], },
            // top
            { pos: [.05, ip.t, -.3], norm: [0, 1, 0], uv: [0, 0], },
            { pos: [-.05, ip.t, -.3], norm: [0, 1, 0], uv: [1, 0], },
            { pos: [.05, ip.t, .3], norm: [0, 1, 0], uv: [0, 1], },
            { pos: [-.05, ip.t, .3], norm: [0, 1, 0], uv: [1, 1], },
            // bottom.05
            { pos: [.05, ip.b, .5], norm: [0, -1, 0], uv: [0, 0], },
            { pos: [-.05, ip.b, .5], norm: [0, -1, 0], uv: [1, 0], },
            { pos: [.05, ip.b, -.5], norm: [0, -1, 0], uv: [0, 1], },
            { pos: [-.05, ip.b, -.5], norm: [0, -1, 0], uv: [1, 1], },
        ];

        const positions = [];
        const normals = [];
        const uvs = [];
        for (const vertex of helixVertices) {
            positions.push(...vertex.pos);
            normals.push(...vertex.norm);
            uvs.push(...vertex.uv);
        }
        helixBufferGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        helixBufferGeometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(normals), 3));
        helixBufferGeometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
        helixBufferGeometry.setIndex([
            0, 1, 2, 2, 1, 3,  // front
            4, 5, 6, 6, 5, 7,  // right
            8, 9, 10, 10, 9, 11,  // back
            12, 13, 14, 14, 13, 15,  // left
            16, 17, 18, 18, 17, 19,  // top
            20, 21, 22, 22, 21, 23,  // bottom
        ]);

        const blackMaterial = new THREE.MeshPhongMaterial({ color: 0x0 })
        const helixMaterial = new THREE.MeshPhongMaterial({ color: 0xF0F0F0 })
        const helix = new THREE.Mesh(helixBufferGeometry, blackMaterial)
        for (let i = 0; i < 3; i++) {
            const helixClone = helix.clone()
            helixClone.rotateY(.2)
            helixes.add(helixClone)
            helix.rotateX(Math.PI / 2)
        }
        helix.rotateY(.2)
        helixes.add(helix)

        const gearGeometry = new THREE.CylinderGeometry(.25, .25, .2)
        const gear = new THREE.Mesh(gearGeometry, blackMaterial)
        gear.rotateZ(Math.PI / 2)
        helixes.add(gear)

        helixes.rotateZ(Math.PI / 2)
        helixes.translateX(-14.3)
        helixes.scale.multiplyScalar(2)

        /* ENGINE */

        const engineCurve = new THREE.CubicBezierCurve(
            new THREE.Vector2(1, -14),
            new THREE.Vector2(7, -9),
            new THREE.Vector2(10, 14),
            new THREE.Vector2(0, 14)
        );
        const enginePoints = engineCurve.getPoints(50);
        const engineGeometry = new THREE.LatheGeometry(enginePoints)
        const engine = new THREE.Mesh(engineGeometry, airplaneMaterial)

        engine.rotateZ(Math.PI / 2)
        engine.position.set(0, -6, -36)
        engine.add(helixes)

        /*  WINGS */

        const wingTopCurve = new THREE.CubicBezierCurve(
            new THREE.Vector2(-10, 0),
            new THREE.Vector2(-10, 1),
            new THREE.Vector2(8, 5),
            new THREE.Vector2(10, .5),
        )
        const wingBottomCurve = new THREE.CubicBezierCurve(
            new THREE.Vector2(10, .5),
            new THREE.Vector2(8, -2),
            new THREE.Vector2(-10, -1),
            new THREE.Vector2(-10, 0),
        )

        const wingAnglePoints = 20
        const wingPoints = wingTopCurve.getPoints(wingAnglePoints).concat(wingBottomCurve.getPoints(wingAnglePoints))

        const wingShape = new THREE.Shape(wingPoints)
        const wingCapGeometry = new THREE.ShapeGeometry(wingShape)
        const wingCap = new THREE.Mesh(wingCapGeometry, airplaneMaterial)
        wingCap.scale.set(1, 1, -1).multiplyScalar(.8)
        wingCap.position.set(-5, 0, -70)
        this.scene.add(wingCap)


        function buildFirstHalfWingGeometry(u, v, target) {
            u *= 2
            const curvePoint = u <= 1 ? wingTopCurve.getPointAt(u) : wingBottomCurve.getPointAt(u - 1)
            const factor = .8 + (1 - v) * .5
            target.set(curvePoint.x * (factor) - v * 5, curvePoint.y * (factor), -v * 67 - 3)
        }
        function buildSecondHalfWingGeometry(u, v, target) {
            u *= 2
            const curvePoint = u <= 1 ? wingTopCurve.getPointAt(u) : wingBottomCurve.getPointAt(u - 1)
            const factor = 1.3
            target.set(curvePoint.x * (factor), curvePoint.y * (factor), 3 - v * 6)
        }


        const wingFirstHalfGeometry = new ParametricGeometry(buildFirstHalfWingGeometry, wingAnglePoints * 2, 2)
        const wingSecondHalfGeometry = new ParametricGeometry(buildSecondHalfWingGeometry, wingAnglePoints * 2, 2)

        const wing = new THREE.Mesh(wingFirstHalfGeometry, airplaneMaterial)
        const wingBody = new THREE.Mesh(wingSecondHalfGeometry, airplaneMaterial)

        wing.add(wingBody)
        wing.add(wingCap)

        /* BACK_WINGS */
        {
            const backWings = new THREE.Group()

            const backWing = wing.clone()
            backWing.scale.set(1.5, 1, 1).multiplyScalar(.3)
            backWing.position.set(0, 0, 0)
            const backWingClone = backWing.clone()
            backWingClone.scale.set(1.5, 1, -1).multiplyScalar(.3)

            const verticalBackWing = wing.clone()
            verticalBackWing.rotateX(Math.PI / 2)
            verticalBackWing.scale.set(.5, .5, .2)
            backWings.add(verticalBackWing)
            backWings.add(backWing)
            backWings.add(backWingClone)
            this.airplane.add(backWings)
            backWings.position.set(6.5, -1.8, 0)
        }

        wing.add(engine)

        this.airplane.add(wing)
        wing.position.set(130, -6, -12.25)

        const wingClone = wing.clone()
        wingClone.scale.set(1, 1, -1)
        wingClone.translateZ(12.25 * 2)
        this.airplane.add(wingClone)
        // wingWireframe.position.set(130,-6,-15.25)


        // const wingData = new THREE.LineCurve3(
        //     new THREE.Vector3(0, 0, 3),
        //     new THREE.Vector3(0, 0, 70)
        // )
        // const helperCurve1 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wingTopCurve.getPoints(100)), lineMaterial)
        // const helperCurve2 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wingBottomCurve.getPoints(100)), lineMaterial)
        // const helperCurve3 = new THREE.Line(new THREE.BufferGeometry().setFromPoints(wingData.getPoints(100)), lineMaterial)
        // this.scene.add(helperCurve1)
        // this.scene.add(helperCurve2)
        // this.scene.add(helperCurve3)



        /* WHEELS */

        const wheels = new THREE.Group()
        const wheelGeometry = new THREE.CylinderGeometry(2, 2, 1)
        const wheelMaterial = new THREE.MeshPhongMaterial({ color: 0x0 })
        const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
        wheel.position.set(-5, .75, 0)
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

        const barsMaterial = new THREE.MeshPhongMaterial({ color: 0xAAAAAA })
        const horizontalBar = new THREE.Mesh(new THREE.BoxGeometry(11, .5, 1.5), barsMaterial)
        wheels.add(horizontalBar)

        const verticalBar = horizontalBar.clone()
        verticalBar.rotateY(Math.PI / 2).translateX(11 / 2)
        wheels.add(verticalBar)

        wheels.position.set(143, -38, -7)
        wheels.rotateX(Math.PI / 2)
        const wheelsClone = wheels.clone()
        wheelsClone.translateY(14)
        this.airplane.add(wheels)
        this.airplane.add(wheelsClone)


        if (this.showWireFrames) {

            const wireframe = new THREE.EdgesGeometry(fuselageGeometry)
            const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0 });
            const fuselageWireframe = new THREE.LineSegments(wireframe, lineMaterial);
            this.airplane.add(fuselageWireframe);

        }

        this.airplaneCoordSystem = new THREE.Group()
        this.airplaneCoordSystem.add(this.airplane)
        this.airplane.position.set(0, 0, 0)
        this.airplane.rotateY(Math.PI / 2).translateX(-95 * .015)
        this.airplane.scale.multiplyScalar(.015)

        this.airplaneCoordSystem.rotateY(-Math.PI / 2)
        this.scene.add(this.airplaneCoordSystem)
        this.airplaneCoordSystem.position.set(-11, 0, 8)
        const firstPersonCamera = this.cameras[2]
        firstPersonCamera.position.set(0, 0, -.25)
        firstPersonCamera.lookAt(0, 0, -3)
        this.cameras.push(firstPersonCamera)
        this.airplaneCoordSystem.add(firstPersonCamera)
    }

    resetAirplane() {
        this.airPlaneController.setTransform({ position: new THREE.Vector3(-11, 0, 8), euler: new THREE.Euler(0, -Math.PI / 2, 0) })
        console.log("Reseteo")
    }

    animate() {
        this.airPlaneController.update(.01)


        // cámara de persecución
        const persecutionCamera = this.cameras[1];
        if (persecutionCamera) {
            const offset = new THREE.Vector3(0, 2, 15); // detrás y arriba del avión
            offset.applyQuaternion(this.airplaneCoordSystem.quaternion);

            persecutionCamera.position.copy(this.airplaneCoordSystem.position).add(offset);

            // mirar siempre hacia adelante del avión
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.airplaneCoordSystem.quaternion);
            persecutionCamera.lookAt(this.airplaneCoordSystem.position.clone().add(forward.multiplyScalar(50)));
        }


        this.currentShipT = (this.currentShipT + .001) % 1;
        if (this.isShipLoaded) {
            const position = this.shipPathCurve.getPointAt(this.currentShipT);
            const tangent = this.shipPathCurve.getTangentAt(this.currentShipT)
            this.ship.position.copy(position)
            this.ship.lookAt(tangent.add(position));
        }
    }
}
