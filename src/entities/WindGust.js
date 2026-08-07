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
        this.windForce = 6 + Math.random() * 4; // Stronger force for more tension
        this.windWidth = 220; // Much wider, harder to dodge
        this.windHeight = 200; // Taller, covers the jump gap
        this.isDead = false;
        this.time = Math.random() * Math.PI * 2;

        // Build visual
        const group = new THREE.Group();

        // Wind zone area (transparent box just for collision logic reference, invisible)
        const zoneGeom = new THREE.BoxGeometry(this.windWidth, this.windHeight, 20);
        const zoneMat = new THREE.MeshBasicMaterial({
            color: direction > 0 ? 0x81D4FA : 0xB3E5FC,
            transparent: true,
            opacity: 0.0, // Invisible! User doesn't want a rigid box
            side: THREE.DoubleSide
        });
        const zone = new THREE.Mesh(zoneGeom, zoneMat);
        group.add(zone);

        // Arrow indicators (3 arrows pointing in wind direction)
        const arrowMat = new THREE.MeshBasicMaterial({
            color: 0x0288D1, // Darker blue for contrast
            transparent: true,
            opacity: 0.9 // Very clear
        });

        this.arrows = [];
        for (let i = 0; i < 3; i++) {
            const arrowGroup = new THREE.Group();

            // Arrow shaft (thicker)
            const shaftGeom = new THREE.BoxGeometry(24, 6, 2);
            const shaft = new THREE.Mesh(shaftGeom, arrowMat);
            arrowGroup.add(shaft);

            // Arrow head (larger)
            const headGeom = new THREE.ConeGeometry(8, 14, 4);
            const head = new THREE.Mesh(headGeom, arrowMat);
            head.rotation.z = direction > 0 ? -Math.PI / 2 : Math.PI / 2;
            head.position.x = direction * 16;
            arrowGroup.add(head);

            arrowGroup.position.y = (i - 1) * 60; // Spread out more vertically
            arrowGroup.position.x = (i - 1) * direction * 15;

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

        for (let i = 0; i < 35; i++) { // Increase lines to make wind visible without box
            const lineGeom = new THREE.BoxGeometry(15 + Math.random() * 40, 2, 2);
            const line = new THREE.Mesh(lineGeom, lineMat.clone());
            line.position.set(
                (Math.random() - 0.5) * this.windWidth * 0.9,
                (Math.random() - 0.5) * this.windHeight * 0.9,
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

        // Wind cycle parameters (Blow for 1.8s, Rest/Pause for 1.5s)
        this.cycleTimer = Math.random() * 3.3; 
        this.blowDuration = 1.8;
        this.restDuration = 1.5;
        this.totalCycle = this.blowDuration + this.restDuration;
        this.isBlowing = true;
    }

    /**
     * Check if player is inside the wind zone
     */
    isPlayerInside(playerX, playerY) {
        if (!this.isBlowing) return false; // Wind is currently resting/paused
        const dx = Math.abs(playerX - this.position.x);
        const dy = Math.abs(playerY - this.position.y);
        return dx < this.windWidth / 2 && dy < this.windHeight / 2;
    }

    /**
     * Get the wind push force to apply to player
     */
    getWindPush() {
        if (!this.isBlowing) return 0;
        return this.windDirection * this.windForce;
    }

    update(dt) {
        if (this.isDead) return;

        const dtSec = dt * 0.01666;
        this.cycleTimer += dtSec;
        const currentCycleTime = this.cycleTimer % this.totalCycle;
        this.isBlowing = currentCycleTime < this.blowDuration;

        this.time += dt * 0.04;

        // Animate arrows (pulse opacity when blowing, fade out when resting)
        for (let i = 0; i < this.arrows.length; i++) {
            const arrow = this.arrows[i];
            const phase = this.time + i * 0.8;
            const targetAlpha = this.isBlowing ? (0.4 + Math.sin(phase * 3) * 0.35) : 0.08;
            arrow.traverse(child => {
                if (child.material) {
                    child.material.opacity = targetAlpha;
                }
            });
        }

        // Animate wind lines (move in wind direction when blowing, stop/fade when resting)
        for (const line of this.windLines) {
            if (this.isBlowing) {
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
            } else {
                // Fade out when wind rests
                line.material.opacity = Math.max(0, line.material.opacity - dtSec * 2);
            }
        }
    }
}
