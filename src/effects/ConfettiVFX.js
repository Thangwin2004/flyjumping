import * as THREE from 'three';

/**
 * Confetti burst VFX for milestone celebrations.
 * Creates colorful rectangles that rain down in a festive explosion.
 */
export class ConfettiVFX extends THREE.Group {
    constructor() {
        super();
        this.particles = [];
        this.isPlaying = false;
        this.lifetime = 0;
        this.maxLifetime = 2.5; // seconds - longer than landing VFX for celebration feel
    }

    /**
     * Trigger a confetti burst at the given screen-space position.
     */
    play(position, intensity = 1) {
        this.clear();
        this.position.copy(position);
        this.isPlaying = true;
        this.lifetime = 0;
        this.maxLifetime = 3.5; // Longer celebration for more epic feel

        const confettiColors = [
            0xFF4081, // Pink
            0xFFEB3B, // Yellow
            0x4CAF50, // Green
            0x2196F3, // Blue
            0xFF9800, // Orange
            0x9C27B0, // Purple
            0x00BCD4, // Cyan
            0xF44336, // Red
            0xFFFFFF, // White
            0xE91E63, // Deep pink
        ];

        // 1. Confetti (Rectangles)
        const particleCount = Math.floor(150 * intensity); // Huge increase
        for (let i = 0; i < particleCount; i++) {
            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            const w = 3 + Math.random() * 5;
            const h = 6 + Math.random() * 10;
            const geom = new THREE.BoxGeometry(w, h, 0.5);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(geom, mat);
            
            mesh.position.set((Math.random() - 0.5) * 100, Math.random() * 40, (Math.random() - 0.5) * 50);
            mesh.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, Math.random() * Math.PI * 2);

            const angle = Math.random() * Math.PI * 2;
            const upAngle = Math.random() * Math.PI * 0.7;
            const speed = 100 + Math.random() * 200; // Faster burst

            mesh.userData.vx = Math.cos(angle) * speed * 0.8;
            mesh.userData.vy = Math.sin(upAngle) * speed + 100; 
            mesh.userData.vz = Math.sin(angle) * speed * 0.4;
            mesh.userData.rotSpeedX = (Math.random() - 0.5) * 15;
            mesh.userData.rotSpeedY = (Math.random() - 0.5) * 10;
            mesh.userData.rotSpeedZ = (Math.random() - 0.5) * 12;
            mesh.userData.flutter = 0.4 + Math.random() * 0.6;
            mesh.userData.flutterPhase = Math.random() * Math.PI * 2;
            mesh.userData.isSparkle = false;

            this.add(mesh);
            this.particles.push(mesh);
        }

        // 2. Fireworks/Sparks (Glowing Spheres)
        const sparkCount = Math.floor(100 * intensity);
        for (let i = 0; i < sparkCount; i++) {
            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
            const geom = new THREE.SphereGeometry(2 + Math.random() * 2, 6, 6);
            const mat = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 1 });
            const mesh = new THREE.Mesh(geom, mat);
            
            mesh.position.set((Math.random() - 0.5) * 40, Math.random() * 20, (Math.random() - 0.5) * 20);

            const angle = Math.random() * Math.PI * 2;
            const upAngle = Math.random() * Math.PI * 2; // Spherical burst
            const speed = 150 + Math.random() * 300; // Very fast burst

            mesh.userData.vx = Math.cos(angle) * Math.cos(upAngle) * speed;
            mesh.userData.vy = Math.sin(upAngle) * speed + 120; 
            mesh.userData.vz = Math.sin(angle) * Math.cos(upAngle) * speed;
            
            mesh.userData.isSparkle = true;
            mesh.userData.sparkleLife = 0.6 + Math.random() * 1.0; // Sparks die much faster
            mesh.userData.sparkleAge = 0;

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
            if (p.userData.isSparkle) {
                // Sparkle behavior (fireworks)
                p.userData.sparkleAge += dtSec;
                p.userData.vy -= 200 * dtSec; // Heavier gravity for sparks
                
                // Air resistance is higher
                p.userData.vx *= 0.96;
                p.userData.vz *= 0.96;
                
                // Fade out quickly
                const lifeT = p.userData.sparkleAge / p.userData.sparkleLife;
                if (lifeT >= 1) {
                    p.material.opacity = 0;
                } else {
                    p.material.opacity = 1 - (lifeT * lifeT); // Non-linear fade
                }
                
                // Shrink
                const scale = Math.max(0, 1 - lifeT);
                p.scale.set(scale, scale, scale);

            } else {
                // Normal confetti behavior
                p.userData.vy -= 120 * dtSec;

                // Flutter effect
                p.userData.flutterPhase += dtSec * 6;
                const flutterForce = Math.sin(p.userData.flutterPhase) * p.userData.flutter * 30;
                p.userData.vx += flutterForce * dtSec;

                // Air resistance
                p.userData.vx *= 0.995;
                p.userData.vz *= 0.995;
                
                // Tumble rotation
                p.rotation.x += p.userData.rotSpeedX * dtSec;
                p.rotation.y += p.userData.rotSpeedY * dtSec;
                p.rotation.z += p.userData.rotSpeedZ * dtSec;

                // Fade out in the last 30%
                if (t > 0.7) {
                    p.material.opacity = 1 - ((t - 0.7) / 0.3);
                }

                // Gentle shrink near end
                if (t > 0.8) {
                    const scale = 1 - ((t - 0.8) / 0.2) * 0.5;
                    p.scale.set(scale, scale, scale);
                }
            }

            // Move both types
            p.position.x += p.userData.vx * dtSec;
            p.position.y += p.userData.vy * dtSec;
            p.position.z += p.userData.vz * dtSec;
        }
    }
}
