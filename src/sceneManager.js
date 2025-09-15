import * as THREE from 'three';

const greenMaterial = new THREE.MeshPhongMaterial({ color: 0x00FF00 })

export class SceneManager {
    constructor(scene) {
        this.scene = scene
        this.setupEnv()
        this.setupCampBase()
        this.setupTerrain()
    }

    setupEnv() {
        this.scene.background = new THREE.Color(0xa8bbe6)

        const hemisphereLight = new THREE.HemisphereLight(0xF0F0FF,0xFFFFFF, 1);
        this.scene.add(hemisphereLight);
        this.scene.add(new THREE.HemisphereLightHelper(hemisphereLight))

        const intensity = 1;
        const light = new THREE.DirectionalLight(0xFFFFFF, intensity);
        light.position.set(-25, 15, -10);
        light.target.position.set(6, 0, 2);
        light.castShadow = true
        this.scene.add(light);
        this.scene.add(light.target);
        this.scene.add(new THREE.DirectionalLightHelper(light))
    }

    setupTerrain() {
        const radius = 70;
        const widthSegments = 12;
        const heightSegments = 8;
        const phiStart = 0;
        const phiLength = Math.PI * 2;
        const thetaStart = 0;
        const thetaLength = Math.PI * .1;
        const islandGeometry = new THREE.SphereGeometry(
            radius,
            widthSegments, heightSegments,
            phiStart, phiLength,
            thetaStart, thetaLength);

        const island = new THREE.Mesh(islandGeometry, greenMaterial)
        island.receiveShadow = true
        island.position.set(2,1- radius, 4)
        this.scene.add(island)
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

        const seaSize = 100
        const seaGeometry = new THREE.PlaneGeometry(seaSize,seaSize)
        const seaMaterial = new THREE.MeshPhongMaterial({color: 0x5689FF})
        const sea = new THREE.Mesh(seaGeometry, seaMaterial)
        campBase.add(sea)
        sea.rotateX(-Math.PI/2)
        sea.translateZ(-2)

        campBase.traverse((obj) => {
            obj.castShadow = true
            obj.receiveShadow = true
        })
        this.scene.add(campBase)
    }

    setupCastle() {
        const geometry = new THREE.BoxGeometry(6, 2, 6);
        const brickColor = new THREE.MeshPhongMaterial({ color: 0x9c8b71 });
        const cube = new THREE.Mesh(geometry, brickColor);
        cube.translateY(.5)
        this.scene.add(cube);

        const positions = [
            [3, 1, 3],
            [-3, 1, 3],
            [-3, 1, -3],
            [3, 1, -3],
        ]


        let cylinder = new THREE.CylinderGeometry(1, 1, 2.5)
        const roofColor = new THREE.MeshPhongMaterial({ color: 0x1e4562 });
        let cone = new THREE.ConeGeometry(1.2, 2.5)

        for (let pos of positions) {
            const tower = new THREE.Mesh(cylinder, brickColor)
            tower.position.set(...pos)
            this.scene.add(tower)

            const roof = new THREE.Mesh(cone, roofColor)
            roof.position.set(...pos)
            roof.translateY(2.5)
            this.scene.add(roof)
        }

        const doorGeometry = new THREE.BoxGeometry(1, 1, .1)
        const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x6d3409 })
        const door = new THREE.Mesh(doorGeometry, doorMaterial)
        door.position.set(0, .5, -3)
        this.scene.add(door)
    }

    setupGround() {
        const plane = new THREE.PlaneGeometry(30, 30);
        const grass = new THREE.MeshPhongMaterial({ color: 0x18581c })
        const surface = new THREE.Mesh(plane, grass)
        surface.rotateX(-Math.PI / 2)
        this.scene.add(surface)
        surface.translateZ(-0.005)

        const circle = new THREE.CircleGeometry(2)
        const water = new THREE.MeshPhongMaterial({ color: 0x88e1ff })
        const puddle1 = new THREE.Mesh(circle, water);
        const puddle2 = new THREE.Mesh(circle, water);
        puddle1.rotateX(-Math.PI / 2)
        puddle1.translateY(7.5)
        puddle2.rotateX(-Math.PI / 2)
        puddle2.translateY(10.5)
        // puddle2.translateX(1)
        this.scene.add(puddle1)
        puddle2.translateZ(0.005)
        this.scene.add(puddle2)
    }

    setupTree() {
        const logGeometry = new THREE.CylinderGeometry(.1, .25, 2.5)
        const wood = new THREE.MeshPhongMaterial({ color: 0x392600 })
        const log = new THREE.Mesh(logGeometry, wood)
        log.position.set(3, .2, -7)
        this.scene.add(log)

        const leafBody = new THREE.SphereGeometry(.75)
        const leafMaterial = new THREE.MeshPhongMaterial({ color: 0x468611 })
        const leafPositions = [
            [3.3, 1.9, -6.7],
            [2.7, 2.5, -6.7],
        ]

        for (let pos of leafPositions) {
            const leafs = new THREE.Mesh(leafBody, leafMaterial)
            leafs.position.set(...pos)
            this.scene.add(leafs)
        }

        const smallLeafBody = new THREE.SphereGeometry(.5)
        const smallLeaf = new THREE.Mesh(smallLeafBody, leafMaterial)
        smallLeaf.position.set(3, 2, -7.3)
        this.scene.add(smallLeaf)
    }


    animate() {
    }
}
