import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { InteractionManager } from '../interaction/InteractionManager.js';
import { ResearchAI } from '../simulation/ResearchAI.js';

export class SceneManager {
    constructor() {
        this.canvas = document.getElementById('experience-canvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.canvas,
            antialias: false // Lower spec
        });
        this.renderer.setClearColor(0x0000ff, 1); // BLUE start

        this.objects = [];
        this.atoms = [];
        this.bonds = [];
        this.composer = null;
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        // FORCE LOWEST SETTINGS
        this.renderer.setPixelRatio(1);
        this.renderer.shadowMap.enabled = false;

        // TEST BACKGROUND COLOR (Dark Blue) to prove renderer works
        this.renderer.setClearColor(0x000033, 1);

        console.log(`Renderer Info: ${this.renderer.capabilities.isWebGL2 ? 'WebGL 2' : 'WebGL 1'}`);

        // Research AI
        this.ai = new ResearchAI();

        // Camera Position
        this.camera.position.set(0, 1.6, 3);
        this.camera.lookAt(0, 1, 0); // Look at the molecules

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8); // Brighter
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 7.5);
        this.scene.add(directionalLight);

        // Grid
        const gridHelper = new THREE.GridHelper(20, 20, 0x00ffff, 0x222222);
        this.scene.add(gridHelper);

        // DEBUG CUBE (To verify 3D works)
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        this.debugCube = new THREE.Mesh(geometry, material);
        this.debugCube.position.set(0, 2, 0); // High up
        this.scene.add(this.debugCube);

        // Make cube interactable
        this.objects.push(this.debugCube);

        // TEMPORARILY DISABLED - Testing basic rendering first
        // const oxygen = new Atom('O', new THREE.Vector3(0, 1.5, 0));
        // const hydrogen1 = new Atom('H', new THREE.Vector3(-0.5, 1.2, 0));
        // const hydrogen2 = new Atom('H', new THREE.Vector3(0.5, 1.2, 0));
        // this.scene.add(oxygen);
        // this.scene.add(hydrogen1);
        // this.scene.add(hydrogen2);
        // this.atoms = [oxygen, hydrogen1, hydrogen2];
        // this.objects.push(oxygen.mesh);
        // this.objects.push(hydrogen1.mesh);
        // this.objects.push(hydrogen2.mesh);
        // const bond1 = new Bond(oxygen, hydrogen1);
        // const bond2 = new Bond(oxygen, hydrogen2);
        // this.scene.add(bond1);
        // this.scene.add(bond2);
        // this.bonds = [bond1, bond2];

        // Resize Handler
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Interaction Manager
        this.interactionManager = new InteractionManager(this.scene, this.camera);

        console.log(`Scene Initialized. Objects in scene: ${this.scene.children.length}`);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleGesture(gestureData) {
        if (this.interactionManager) {
            this.interactionManager.update(
                gestureData.position,
                gestureData.type,
                this.objects
            );
        }
    }

    checkBonding() {
        // Simple O(N^2) check for demo purposes
        const threshold = 0.6; // Distance to bond
        let bondsChanged = false;

        for (let i = 0; i < this.atoms.length; i++) {
            for (let j = i + 1; j < this.atoms.length; j++) {
                const atom1 = this.atoms[i];
                const atom2 = this.atoms[j];

                // Check if already bonded
                const alreadyBonded = this.bonds.some(b =>
                    (b.atom1 === atom1 && b.atom2 === atom2) ||
                    (b.atom1 === atom2 && b.atom2 === atom1)
                );

                if (alreadyBonded) continue;

                const dist = atom1.position.distanceTo(atom2.position);

                if (dist < threshold) {
                    // Create new Bond
                    const newBond = new Bond(atom1, atom2);
                    this.scene.add(newBond);
                    this.bonds.push(newBond);
                    bondsChanged = true;
                    console.log(`Bond created between ${atom1.element} and ${atom2.element}`);
                }
            }
        }

        if (bondsChanged) {
            const analysis = this.ai.analyze(this.atoms, this.bonds);
            const event = new CustomEvent('research-update', { detail: analysis });
            window.dispatchEvent(event);
        }
    }

    update(deltaTime) {
        // Animation
        if (this.debugCube) {
            this.debugCube.rotation.x += 0.01;
            this.debugCube.rotation.y += 0.01;
        }

        this.checkBonding();

        // Update Bonds
        if (this.bonds) {
            this.bonds.forEach(bond => bond.updatePosition());
        }

        // Force Basic Render
        this.renderer.render(this.scene, this.camera);

        if (!this.frameCount) this.frameCount = 0;
        this.frameCount++;
        if (this.frameCount % 60 === 0) {
            console.log("Rendering Frame " + this.frameCount);
        }
    }
}
