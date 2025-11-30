import * as THREE from 'three';
import { ParametricGeometry } from 'three/addons/geometries/ParametricGeometry.js';

const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 })

export class Airplane {
    constructor(scene, persecutionCamera, firstPersonCamera) {
        this.persecutionCamera = persecutionCamera
        this.firstPersonCamera = firstPersonCamera
        this.setupAirplane(scene)

    }

    setupAirplane(scene, cameras) {
        this.airplane = new THREE.Group()

        const airplaneMaterial = new THREE.MeshPhongMaterial({ color: 0x536379 })
        const referencia = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 2), greenMaterial)
        referencia.position.set(-6.5, 1.5, 8)
        // scene.add(referencia)

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
        helixes.name = "helixes"
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
        // scene.add(helperCurve1)
        // scene.add(helperCurve2)
        // scene.add(helperCurve3)


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

        this.airplane.position.set(0, 0, 0)
        this.airplane.rotateY(Math.PI / 2).translateX(-95 * .015)
        this.airplane.scale.multiplyScalar(.015)

        this.airplaneCoordSystem = new THREE.Group()
        this.airplaneCoordSystem.add(this.airplane)
        this.airplaneCoordSystem.rotateY(-Math.PI / 2)
        scene.add(this.airplaneCoordSystem)
        this.airplaneCoordSystem.position.set(-11, 0, 8)

        this.firstPersonCamera.position.set(0, 0, 0)
        this.firstPersonCamera.lookAt(0, 0, -1)
        this.airplaneCoordSystem.add(this.firstPersonCamera)
    }


    updatePersecutionCamera() {
        const offset = new THREE.Vector3(0, 2, 15); // detrás y arriba del avión
        offset.applyQuaternion(this.airplaneCoordSystem.quaternion);
        this.persecutionCamera.position.copy(this.airplaneCoordSystem.position).add(offset);
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.airplaneCoordSystem.quaternion);
        this.persecutionCamera.lookAt(this.airplaneCoordSystem.position.clone().add(forward.multiplyScalar(50)));
    }

    animateHelixes(v) {
        const tmp = this.airplane.getObjectsByProperty("name", "helixes")
        const l = tmp[0]
        const r = tmp[1]
        v *= 0.1
        l.rotateX(v)
        r.rotateX(v)
        // console.log("logeo velocidad", v)
    }
}
