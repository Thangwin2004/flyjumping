import * as THREE from 'three';
import { gameApp } from '../core/Application';

/**
 * Saw Blade obstacle that moves vertically between two Y positions.
 * Contact with player = game over.
 */
export class SawBlade extends THREE.Group {
    constructor(minY, maxY) {
        super();
        this.radius = 22;
        this.isDead = false;
        this.minY = minY;
        this.maxY = maxY;
        this.speed = 2 + Math.random() * 1.5;
        this.direction = 1;

        // Build the saw blade visual
        const group = new THREE.Group();

        // Main circular blade
        const bladeGeom = new THREE.CylinderGeometry(this.radius, this.radius, 3, 24);
        const bladeMat = new THREE.MeshStandardMaterial({
            color: 0x9E9E9E,
            roughness: 0.1,
            metalness: 0.9,
            emissive: 0x616161,
            emissiveIntensity: 0.1
        });
        const blade = new THREE.Mesh(bladeGeom, bladeMat);
        blade.rotation.x = Math.PI / 2;
        blade.castShadow = true;
        group.add(blade);

        // Teeth around the edge
        const toothMat = new THREE.MeshStandardMaterial({
            color: 0x757575,
            roughness: 0.2,
            metalness: 0.95
        });
        const toothCount = 12;
        for (let i = 0; i < toothCount; i++) {
            const angle = (i / toothCount) * Math.PI * 2;
            const toothGeom = new THREE.ConeGeometry(4, 8, 4);
            const tooth = new THREE.Mesh(toothGeom, toothMat);
            tooth.position.set(
                Math.cos(angle) * (this.radius + 2),
                0,
                Math.sin(angle) * (this.radius + 2)
            );
            // Point outward
            tooth.rotation.x = Math.PI / 2;
            tooth.rotation.z = -angle + Math.PI / 2;
            tooth.castShadow = true;
            group.add(tooth);
        }

        // Center axle
        const axleGeom = new THREE.CylinderGeometry(4, 4, 6, 8);
        const axleMat = new THREE.MeshStandardMaterial({
            color: 0x424242,
            roughness: 0.3,
            metalness: 0.8
        });
        const axle = new THREE.Mesh(axleGeom, axleMat);
        axle.rotation.x = Math.PI / 2;
        group.add(axle);

        // Danger glow ring
        const glowGeom = new THREE.TorusGeometry(this.radius - 2, 1.5, 8, 24);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0xFF5252,
            transparent: true,
            opacity: 0.4
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        glow.rotation.x = Math.PI / 2;
        group.add(glow);
        this.glowMesh = glow;

        this.add(group);
        this.bladeGroup = group;

        this.time = Math.random() * Math.PI * 2;
    }

    update(dt) {
        if (this.isDead) return;

        // Vertical movement between minY and maxY
        this.position.y += this.speed * this.direction * dt;
        if (this.position.y >= this.maxY) {
            this.position.y = this.maxY;
            this.direction = -1;
        } else if (this.position.y <= this.minY) {
            this.position.y = this.minY;
            this.direction = 1;
        }

        // Spin the blade
        if (this.bladeGroup) {
            this.bladeGroup.rotation.z += dt * 0.15;
        }

        // Pulse the danger glow
        this.time += dt * 0.08;
        if (this.glowMesh) {
            this.glowMesh.material.opacity = 0.3 + Math.sin(this.time) * 0.2;
        }
    }
}
