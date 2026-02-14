import * as THREE from 'three';

export class Bond extends THREE.Mesh {
    constructor(atom1, atom2) {
        // Initial cylinder with height 1
        const geometry = new THREE.CylinderGeometry(0.05, 0.05, 1, 8);
        geometry.translate(0, 0.5, 0); // Encode pivot at base? No, center is fine.
        // Actually, Three.js Cylinder center is at (0,0,0).
        // Let's create it normally.
        // Pivot modification for easy scaling from one point to another is tricky.
        // Standard approach: Midpoint position, LookAt, Scale Y.

        const material = new THREE.MeshStandardMaterial({
            color: 0x888888,
            roughness: 0.5,
            metalness: 1.0
        });

        super(geometry, material);

        this.atom1 = atom1;
        this.atom2 = atom2;

        this.updatePosition();
    }

    updatePosition() {
        const start = this.atom1.position;
        const end = this.atom2.position;

        const distance = start.distanceTo(end);

        // Position: Midpoint
        this.position.copy(start).lerp(end, 0.5);

        // Orientation
        this.lookAt(end);
        this.rotateX(Math.PI / 2); // Cylinder is Y-aligned, lookAt is Z-aligned.

        // Scale
        this.scale.set(1, distance, 1);
    }
}
