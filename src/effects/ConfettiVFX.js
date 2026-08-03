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

        const particleCount = Math.floor(35 * intensity);

        for (let i = 0; i < particleCount; i++) {
            const color = confettiColors[Math.floor(Math.random() * confettiColors.length)];

            // Mix of rectangles and small squares for confetti feel
            const w = 2 + Math.random() * 4;
            const h = 4 + Math.random() * 8;
            const geom = new THREE.BoxGeometry(w, h, 0.5);

            const mat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1,
                side: THREE.DoubleSide
            });

            const mesh = new THREE.Mesh(geom, mat);
            mesh.position.set(
                (Math.random() - 0.5) * 60,
                Math.random() * 20,
                (Math.random() - 0.5) * 30
            );

            // Random initial rotation
            mesh.rotation.set(
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2,
                Math.random() * Math.PI * 2
            );

            // Explosion velocity - burst outward and upward
            const angle = Math.random() * Math.PI * 2;
            const upAngle = Math.random() * Math.PI * 0.6;
            const speed = 60 + Math.random() * 120;

            mesh.userData.vx = Math.cos(angle) * speed * 0.6;
            mesh.userData.vy = Math.sin(upAngle) * speed + 80; // Strong upward burst
            mesh.userData.vz = Math.sin(angle) * speed * 0.3;

            // Tumbling rotation speeds (confetti flutter)
            mesh.userData.rotSpeedX = (Math.random() - 0.5) * 12;
            mesh.userData.rotSpeedY = (Math.random() - 0.5) * 8;
            mesh.userData.rotSpeedZ = (Math.random() - 0.5) * 10;

            // Flutter factor (wind resistance on the flat side)
            mesh.userData.flutter = 0.3 + Math.random() * 0.5;
            mesh.userData.flutterPhase = Math.random() * Math.PI * 2;

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
            // Apply gravity (lighter than normal for floaty feel)
            p.userData.vy -= 120 * dtSec;

            // Flutter effect (confetti wobbles side to side as it falls)
            p.userData.flutterPhase += dtSec * 6;
            const flutterForce = Math.sin(p.userData.flutterPhase) * p.userData.flutter * 30;
            p.userData.vx += flutterForce * dtSec;

            // Air resistance
            p.userData.vx *= 0.995;
            p.userData.vz *= 0.995;

            // Move
            p.position.x += p.userData.vx * dtSec;
            p.position.y += p.userData.vy * dtSec;
            p.position.z += p.userData.vz * dtSec;

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
    }
}
