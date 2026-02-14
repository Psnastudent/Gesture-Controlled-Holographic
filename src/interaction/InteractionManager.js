import * as THREE from 'three';

export class InteractionManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.raycaster = new THREE.Raycaster();
        this.selectedObject = null;
        this.hoveredObject = null;
        this.dragPlane = new THREE.Plane(); // Plane to drag objects along
        this.dragOffset = new THREE.Vector3();
    }

    update(cursorNDS, gestureType, interactableObjects) {
        this.raycaster.setFromCamera(cursorNDS, this.camera);

        if (this.selectedObject) {
            // Dragging Logic
            if (gestureType === 'PINCH') {
                const intersection = new THREE.Vector3();
                this.raycaster.ray.intersectPlane(this.dragPlane, intersection);

                if (intersection) {
                    this.selectedObject.position.copy(intersection.sub(this.dragOffset));
                }
            } else {
                // Release
                // If selectedObject is Atom Group, find the mesh child
                let mesh = this.selectedObject;
                if (!mesh.isMesh && mesh.children && mesh.children.length > 0) {
                    mesh = mesh.children.find(c => c.userData.type === 'ATOM');
                }

                if (mesh && mesh.userData.originalEmissive !== undefined) {
                    mesh.material.emissive.setHex(mesh.userData.originalEmissive);
                }

                this.selectedObject = null;
            }
        } else {
            // Hover/Pick Logic
            const intersects = this.raycaster.intersectObjects(interactableObjects);

            if (intersects.length > 0) {
                const object = intersects[0].object;

                // Handle Hover
                // Toggle glow on the mesh, but later selection might change
                if (this.hoveredObject !== object) {
                    if (this.hoveredObject) this.clearHover(this.hoveredObject);
                    this.hoveredObject = object;
                    this.applyHover(this.hoveredObject);
                }

                // Handle Grab
                if (gestureType === 'PINCH') {
                    // Check if object is part of an Atom Group
                    if (object.userData.type === 'ATOM' && object.parent) {
                        this.selectedObject = object.parent; // Select the Atom Group
                    } else {
                        this.selectedObject = object;
                    }

                    // Prepare Drag Plane
                    this.dragPlane.setFromNormalAndCoplanarPoint(
                        this.camera.getWorldDirection(new THREE.Vector3()),
                        this.selectedObject.position
                    );

                    const intersection = new THREE.Vector3();
                    this.raycaster.ray.intersectPlane(this.dragPlane, intersection);
                    this.dragOffset.copy(intersection).sub(this.selectedObject.position);

                    // Visual Feedback on the MESH (child)
                    if (this.selectedObject.userData.originalEmissive !== undefined) {
                        // It's a mesh
                        this.selectedObject.userData.originalEmissive = this.selectedObject.material.emissive.getHex();
                        this.selectedObject.material.emissive.setHex(0xff00ff); // Highlight color
                    } else if (object.userData.type === 'ATOM') {
                        // It's an atom group, interact with the child mesh for visual
                        // Store original emissive on the child mesh
                        object.userData.originalEmissive = object.material.emissive.getHex();
                        object.material.emissive.setHex(0xff00ff);
                    }
                }
            } else {
                if (this.hoveredObject) {
                    this.clearHover(this.hoveredObject);
                    this.hoveredObject = null;
                }
            }
        }
    }

    applyHover(object) {
        // e.g., scale up slightly or change color
        object.scale.setScalar(1.1);
        document.body.style.cursor = 'pointer';
    }

    clearHover(object) {
        object.scale.setScalar(1.0);
        document.body.style.cursor = 'default';
    }
}
