import * as THREE from 'three';

/**
 * Colorful dust puff VFX when landing on a platform.
 * Creates tiny sparkly particles that poof upward like magical fairy dust.
 */
export class LandingVFX extends THREE.Group {
    constructor() {
        super();
        this.particles = [];
        this.isPlaying = false;
        this.lifetime = 0;
        this.maxLifetime = 0.6; // seconds
    }

    /**
     * Trigger a dust poof at the given world position.
     */
    play(position, color = 0xFFFFFF) {
        this.clear();
        this.position.copy(position);
        this.isPlaying = true;
        this.lifetime = 0;

        // Pastel dust palette matching the game's cute style
        const dustColors = [
            0xFFB3D9, // soft pink
            0xB3E5FC, // soft cyan
            0xC5E1A5, // soft green
            0xFFF59D, // soft yellow
            0xE1BEE7, // soft lavender
            0xFFCCBC, // soft peach
            color,    // platform color
        ];

        const particleCount = 18;

        for (let i = 0; i < particleCount; i++) {
            const dustColor = dustColors[Math.floor(Math.random() * dustColors.length)];
            const size = 1.5 + Math.random() * 3;
            
            // Mix of tiny spheres and small boxes for variety
            const geom = Math.random() > 0.5 
                ? new THREE.SphereGeometry(size, 4, 4)
                : new THREE.BoxGeometry(size, size, size);
            
            const mat = new THREE.MeshBasicMaterial({
                color: dustColor,
                transparent: true,
                opacity: 0.9,
            });
            
            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 40, // spread horizontally
                Math.random() * 5,
                (Math.random() - 0.5) * 20
            );
            
            // Random tumble rotation
            mesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );

            // Velocity: mostly upward with gentle spread
            const angle = Math.random() * Math.PI * 2;
            const speed = 20 + Math.random() * 40;
            mesh.userData.vx = Math.cos(angle) * speed * 0.4;
            mesh.userData.vy = 40 + Math.random() * 60; // upward poof
            mesh.userData.vz = Math.sin(angle) * speed * 0.3;
            mesh.userData.rotSpeed = (Math.random() - 0.5) * 8; // tumble
            mesh.userData.delay = Math.random() * 0.05; // slight stagger

            this.add(mesh);
            this.particles.push(mesh);
        }
    }

    clear() {
        for (const p of this.particles) {
            p.geometry.dispose();
            p.material.dispose();
            this.remove(p);
        }
        this.particles = [];
        this.isPlaying = false;
    }

    update(dtSec) {
        if (!this.isPlaying) return;

        this.lifetime += dtSec;
        const t = this.lifetime / this.maxLifetime;

        if (t >= 1) {
            this.clear();
            return;
        }

        for (const p of this.particles) {
            // Skip if still in delay
            if (this.lifetime < p.userData.delay) continue;

            // Move
            p.position.x += p.userData.vx * dtSec;
            p.position.y += p.userData.vy * dtSec;
            p.position.z += p.userData.vz * dtSec;

            // Gravity + air resistance
            p.userData.vy -= 100 * dtSec;
            p.userData.vx *= 0.98;
            p.userData.vz *= 0.98;

            // Tumble rotation
            p.rotation.x += p.userData.rotSpeed * dtSec;
            p.rotation.z += p.userData.rotSpeed * dtSec * 0.7;

            // Fade out smoothly in the last 40%
            if (t > 0.6) {
                p.material.opacity = 0.9 * (1 - (t - 0.6) / 0.4);
            }

            // Gentle shrink
            const scale = 1.0 - t * 0.5;
            p.scale.set(scale, scale, scale);
        }
    }
}
