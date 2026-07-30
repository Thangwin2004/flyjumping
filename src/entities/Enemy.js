import * as THREE from 'three';
import { gameApp } from '../core/Application';

export class Enemy extends THREE.Group {
    constructor() {
        super();
        this.radius = 25;
        this.isDead = false;
        
        // Visuals - A dark metallic spiked ball
        const bodyGeom = new THREE.IcosahedronGeometry(this.radius * 0.7, 1);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x424242, 
            roughness: 0.6,
            metalness: 0.8
        });
        this.mesh = new THREE.Mesh(bodyGeom, bodyMat);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        this.add(this.mesh);
        
        // Add spikes all around the body
        const spikeGeom = new THREE.ConeGeometry(4, 18, 5);
        const spikeMat = new THREE.MeshStandardMaterial({ color: 0x212121, metalness: 0.9, roughness: 0.2 });
        
        // Fibbonacci sphere distribution for spikes
        const samples = 20;
        const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
        
        for (let i = 0; i < samples; i++) {
            const y = 1 - (i / (samples - 1)) * 2; // y goes from 1 to -1
            const radiusAtY = Math.sqrt(1 - y * y); // radius at y
            
            const theta = phi * i;
            
            const x = Math.cos(theta) * radiusAtY;
            const z = Math.sin(theta) * radiusAtY;
            
            const spike = new THREE.Mesh(spikeGeom, spikeMat);
            // Position on surface
            spike.position.set(x * this.radius * 0.7, y * this.radius * 0.7, z * this.radius * 0.7);
            
            // Orient spike to point outwards from center
            const lookTarget = new THREE.Vector3(x * 2, y * 2, z * 2); // point further out
            spike.lookAt(lookTarget);
            spike.rotateX(Math.PI / 2); // Adjust Cone geometry orientation
            
            spike.castShadow = true;
            this.mesh.add(spike);
        }

        // Movement
        this.speed = (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 1.5);
        
        // Bobbing animation
        this.time = Math.random() * Math.PI * 2;
    }
    
    update(dt) {
        if (this.isDead) return;
        
        // Horizontal movement
        this.position.x += this.speed * dt;
        
        const bounds = gameApp.screenBounds;
        if (this.position.x < bounds.left + this.radius || this.position.x > bounds.right - this.radius) {
            this.speed *= -1;
            // Keep in bounds
            this.position.x = Math.max(bounds.left + this.radius, Math.min(bounds.right - this.radius, this.position.x));
        }
        
        // Bobbing up and down slightly
        this.time += dt * 0.05;
        this.mesh.position.y = Math.sin(this.time) * 10;
        
        // Look in direction of movement
        this.mesh.rotation.y = this.speed > 0 ? Math.PI / 8 : -Math.PI / 8;
    }

    die() {
        this.isDead = true;
        // Animation handled by GSAP in GameScene
    }
}
