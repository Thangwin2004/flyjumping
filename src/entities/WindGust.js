import * as THREE from 'three';
import { gameApp } from '../core/Application';

/**
 * Wind Gust obstacle zone that pushes the player horizontally.
 * Visual: transparent wind zone with directional arrows and particles.
 */
export class WindGust extends THREE.Group {
    constructor(direction = 1) {
        super();
        this.windDirection = direction; // 1 = push right, -1 = push left
        this.windForce = 4 + Math.random() * 3;
        this.windWidth = 80;
        this.windHeight = 120;
        this.isDead = false;
        this.time = Math.random() * Math.PI * 2;

        // Build visual
        const group = new THREE.Group();

        // Wind zone area (semi-transparent box)
        const zoneGeom = new THREE.BoxGeometry(this.windWidth, this.windHeight, 20);
        const zoneMat = new THREE.MeshBasicMaterial({
            color: direction > 0 ? 0x81D4FA : 0xB3E5FC,
            transparent: true,
            opacity: 0.12,
            side: THREE.DoubleSide
        });
        const zone = new THREE.Mesh(zoneGeom, zoneMat);
        group.add(zone);

        // Arrow indicators (3 arrows pointing in wind direction)
        const arrowMat = new THREE.MeshBasicMaterial({
            color: 0x29B6F6,
            transparent: true,
            opacity: 0.5
        });

        this.arrows = [];
        for (let i = 0; i < 3; i++) {
            const arrowGroup = new THREE.Group();

            // Arrow shaft
            const shaftGeom = new THREE.BoxGeometry(16, 3, 2);
            const shaft = new THREE.Mesh(shaftGeom, arrowMat);
            arrowGroup.add(shaft);

            // Arrow head
            const headGeom = new THREE.ConeGeometry(5, 10, 4);
            const head = new THREE.Mesh(headGeom, arrowMat);
            head.rotation.z = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
            head.position.x = direction * 12;
            arrowGroup.add(head);

            arrowGroup.position.y = (i - 1) * 35;
            arrowGroup.position.x = (i - 1) * direction * 8;

            group.add(arrowGroup);
            this.arrows.push(arrowGroup);
        }

        // Wind particle lines (horizontal streaks)
        this.windLines = [];
        const lineMat = new THREE.MeshBasicMaterial({
            color: 0xE1F5FE,
            transparent: true,
            opacity: 0.6
        });

        for (let i = 0; i < 8; i++) {
            const lineGeom = new THREE.BoxGeometry(8 + Math.random() * 15, 1, 1);
            const line = new THREE.Mesh(lineGeom, lineMat.clone());
            line.position.set(
                (Math.random() - 0.5) * this.windWidth * 0.8,
                (Math.random() - 0.5) * this.windHeight * 0.8,
                (Math.random() - 0.5) * 10
            );
            line.userData.baseX = line.position.x;
            line.userData.speed = 30 + Math.random() * 40;
            line.userData.offset = Math.random() * Math.PI * 2;
            group.add(line);
            this.windLines.push(line);
        }

        this.add(group);
        this.visual = group;
    }

    /**
     * Check if player is inside the wind zone
     */
    isPlayerInside(playerX, playerY) {
        const dx = Math.abs(playerX - this.position.x);
        const dy = Math.abs(playerY - this.position.y);
        return dx < this.windWidth / 2 && dy < this.windHeight / 2;
    }

    /**
     * Get the wind push force to apply to player
     */
    getWindPush() {
        return this.windDirection * this.windForce;
    }

    update(dt) {
        if (this.isDead) return;

        this.time += dt * 0.04;

        // Animate arrows (pulse opacity)
        for (let i = 0; i < this.arrows.length; i++) {
            const arrow = this.arrows[i];
            const phase = this.time + i * 0.8;
            const alpha = 0.3 + Math.sin(phase * 2) * 0.25;
            arrow.traverse(child => {
                if (child.material) {
                    child.material.opacity = alpha;
                }
            });
        }

        // Animate wind lines (move in wind direction)
        for (const line of this.windLines) {
            line.position.x += this.windDirection * line.userData.speed * dt * 0.016;

            // Wrap around
            const halfW = this.windWidth / 2;
            if (this.windDirection > 0 && line.position.x > halfW) {
                line.position.x = -halfW;
            } else if (this.windDirection < 0 && line.position.x < -halfW) {
                line.position.x = halfW;
            }

            // Fade based on position
            const t = (line.position.x + halfW) / (halfW * 2);
            line.material.opacity = 0.3 + Math.sin(t * Math.PI) * 0.4;
        }
    }
}
