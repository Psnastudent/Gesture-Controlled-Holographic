import * as THREE from 'three';

export class Atom extends THREE.Group {
    constructor(element, position = new THREE.Vector3()) {
        super();
        this.element = element;
        this.position.copy(position);

        // Element Configuration
        const config = this.getElementConfig(element);

        // Visual Mesh
        const geometry = new THREE.SphereGeometry(config.size, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.userData = {
            type: 'ATOM',
            element: element,
            originalEmissive: material.emissive.getHex()
        };

        this.add(this.mesh);

        // Electron Shells / Glow (Optional aesthetic)
        const glowGeo = new THREE.SphereGeometry(config.size * 1.5, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: config.color,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        this.add(glowMesh);
    }

    getElementConfig(element) {
        switch (element) {
            case 'H': return { color: 0xffffff, size: 0.15 }; // White
            case 'O': return { color: 0xff0000, size: 0.25 }; // Red
            case 'C': return { color: 0x333333, size: 0.3 };  // Dark Grey
            case 'N': return { color: 0x0000ff, size: 0.25 }; // Blue
            default: return { color: 0xff00ff, size: 0.2 };   // Magenta (Unknown)
        }
    }
}
