import * as THREE from 'three';
import { gameApp } from '../core/Application';
import { AudioManager } from '../managers/AudioManager';

export class Platform extends THREE.Group {
    constructor(type = 'normal') {
        super();
        this.type = type;
        this.platformWidth = 100;
        this.platformHeight = 16;
        this.platformDepth = 40;
        this.isBroken = false;
        
        let baseColor = 0x69F0AE; // vibrant mint green
        if (this.type === 'moving') baseColor = 0x40C4FF; // vibrant sky blue
        if (this.type === 'fragile') baseColor = 0xFF80AB; // vibrant pastel pink
        if (this.type === 'spike') baseColor = 0x9E9E9E; // dark grey for spike platforms
        
        // 1. The main Pad (Glossy pastel look)
        const padGeom = new THREE.BoxGeometry(this.platformWidth, 12, this.platformDepth);
        const padMat = new THREE.MeshStandardMaterial({ 
            color: baseColor,
            roughness: 0.2,
            metalness: 0.1,
            emissive: baseColor,
            emissiveIntensity: this.type === 'spike' ? 0.1 : 0.4
        });
        this.padMesh = new THREE.Mesh(padGeom, padMat);
        this.padMesh.castShadow = true;
        this.padMesh.receiveShadow = true;
        this.padMesh.position.y = 8;
        
        // Add a glossy top highlight for a "candy/jelly" look
        if (this.type !== 'spike') {
            const highlightGeom = new THREE.BoxGeometry(this.platformWidth - 6, 2, this.platformDepth - 6);
            const highlightMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 });
            const highlightMesh = new THREE.Mesh(highlightGeom, highlightMat);
            highlightMesh.position.y = 6.1; // just above the pad
            this.padMesh.add(highlightMesh);
        }

        this.add(this.padMesh);
        
        // 2. The Springs underneath (Cute stacked rings for all platforms)
        if (this.type !== 'ground' && this.type !== 'start' && this.type !== 'spike') {
            const springMat = new THREE.MeshStandardMaterial({ color: 0xFFE082, roughness: 0.3, metalness: 0.8 }); // Gold/Yellowish
            
            const createCoil = (xOffset) => {
                const coilGroup = new THREE.Group();
                for (let i = 0; i < 3; i++) {
                    const ringGeom = new THREE.TorusGeometry(6, 2, 8, 16);
                    const ring = new THREE.Mesh(ringGeom, springMat);
                    ring.rotation.x = Math.PI / 2;
                    ring.position.y = i * 4 - 4;
                    ring.castShadow = true;
                    coilGroup.add(ring);
                }
                coilGroup.position.set(xOffset, -2, 0);
                return coilGroup;
            };

            this.add(createCoil(-this.platformWidth / 3));
            this.add(createCoil(this.platformWidth / 3));
        }

        // Spike platform: add spikes on top
        if (this.type === 'spike') {
            this.buildSpikes();
        }

        // Tilt the whole platform slightly forward
        this.rotation.x = THREE.MathUtils.degToRad(12);

        this.mesh = this.padMesh;
        this.hasSpring = false;
        
        // 3. Super Spring (The 15% chance one)
        if (this.type !== 'fragile' && this.type !== 'ground' && this.type !== 'start' && this.type !== 'spike' && Math.random() < 0.15) {
            this.hasSpring = true;
            this.springMesh = new THREE.Group();
            
            // Giant glowing coil
            const superCoilMat = new THREE.MeshStandardMaterial({ color: 0xFFCA28, metalness: 1.0, roughness: 0.1, emissive: 0xFFCA28, emissiveIntensity: 0.3 });
            for (let i = 0; i < 4; i++) {
                const ring = new THREE.Mesh(new THREE.TorusGeometry(10, 3, 12, 24), superCoilMat);
                ring.rotation.x = Math.PI / 2;
                ring.position.y = i * 5;
                ring.castShadow = true;
                this.springMesh.add(ring);
            }
            
            // Magical Star Pad on top
            const starPadGeom = new THREE.CylinderGeometry(18, 18, 6, 16);
            const starPadMat = new THREE.MeshStandardMaterial({ color: 0xFF5252, roughness: 0.2, emissive: 0xFF5252, emissiveIntensity: 0.6 });
            const starPad = new THREE.Mesh(starPadGeom, starPadMat);
            starPad.position.y = 20; 
            starPad.castShadow = true;
            this.springMesh.add(starPad);
            
            // Center glowing core inside star pad
            const coreGeom = new THREE.CylinderGeometry(10, 10, 7, 16);
            const coreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
            const coreMesh = new THREE.Mesh(coreGeom, coreMat);
            coreMesh.position.y = 20;
            this.springMesh.add(coreMesh);
            
            this.springMesh.position.y = 12 + 2; // on top of the main pad
            
            const offset = (Math.random() * (this.platformWidth - 40)) - (this.platformWidth / 2 - 20); 
            this.springMesh.position.x = offset;
            
            this.padMesh.add(this.springMesh); 
        }
        
        this.velocity = new THREE.Vector3(0, 0, 0);
        
        if (type === 'moving') {
            this.velocity.x = (Math.random() > 0.5 ? 1 : -1) * (2 + Math.random() * 2);
        }
    }

    buildSpikes() {
        const spikeMat = new THREE.MeshStandardMaterial({
            color: 0xD32F2F,
            roughness: 0.4,
            metalness: 0.6,
            emissive: 0xD32F2F,
            emissiveIntensity: 0.2
        });

        const spikeCount = 7;
        for (let i = 0; i < spikeCount; i++) {
            const spikeGeom = new THREE.ConeGeometry(4, 14, 5);
            const spike = new THREE.Mesh(spikeGeom, spikeMat);

            const xPos = ((i / (spikeCount - 1)) - 0.5) * (this.platformWidth - 16);
            spike.position.set(xPos, 15, 0);
            spike.castShadow = true;

            this.padMesh.add(spike);
        }

        // Warning stripes on the platform
        const stripeMat = new THREE.MeshBasicMaterial({
            color: 0xFF5252,
            transparent: true,
            opacity: 0.5
        });
        for (let i = 0; i < 4; i++) {
            const stripeGeom = new THREE.BoxGeometry(8, 1.5, this.platformDepth + 2);
            const stripe = new THREE.Mesh(stripeGeom, stripeMat);
            stripe.position.set(
                ((i / 3) - 0.5) * (this.platformWidth - 20),
                7,
                0
            );
            stripe.rotation.y = Math.PI / 6;
            this.padMesh.add(stripe);
        }
    }

    draw() {
        // Not needed for Three.js as geometry/material handles it
    }

    break() {
        if (this.type !== 'fragile' || this.isBroken) return;
        this.isBroken = true;
        AudioManager.playBreakSFX();
        
        // Hide the original pad
        this.padMesh.visible = false;
        
        // Create two broken halves
        const halfWidth = this.platformWidth / 2;
        const color = 0xFF80AB;
        const halfMat = new THREE.MeshStandardMaterial({ 
            color: color, 
            roughness: 0.2, 
            emissive: color, 
            emissiveIntensity: 0.4 
        });
        
        // Left half
        const leftGeom = new THREE.BoxGeometry(halfWidth - 2, 12, this.platformDepth);
        this.leftHalf = new THREE.Mesh(leftGeom, halfMat.clone());
        this.leftHalf.position.set(-halfWidth / 2, this.padMesh.position.y, 0);
        this.leftHalf.userData.vx = -(30 + Math.random() * 20);
        this.leftHalf.userData.vy = 40 + Math.random() * 30;
        this.leftHalf.userData.rotSpeed = -(3 + Math.random() * 4);
        this.add(this.leftHalf);
        
        // Right half
        const rightGeom = new THREE.BoxGeometry(halfWidth - 2, 12, this.platformDepth);
        this.rightHalf = new THREE.Mesh(rightGeom, halfMat.clone());
        this.rightHalf.position.set(halfWidth / 2, this.padMesh.position.y, 0);
        this.rightHalf.userData.vx = 30 + Math.random() * 20;
        this.rightHalf.userData.vy = 40 + Math.random() * 30;
        this.rightHalf.userData.rotSpeed = 3 + Math.random() * 4;
        this.add(this.rightHalf);
        
        // Add some small debris particles
        this.debris = [];
        for (let i = 0; i < 8; i++) {
            const size = 2 + Math.random() * 4;
            const debrisGeom = new THREE.BoxGeometry(size, size, size);
            const debrisMat = new THREE.MeshBasicMaterial({ 
                color: Math.random() > 0.5 ? 0xFF80AB : 0xFFCDD2,
                transparent: true, opacity: 1
            });
            const d = new THREE.Mesh(debrisGeom, debrisMat);
            d.position.set(
                (Math.random() - 0.5) * this.platformWidth,
                this.padMesh.position.y,
                (Math.random() - 0.5) * 10
            );
            d.userData.vx = (Math.random() - 0.5) * 80;
            d.userData.vy = 50 + Math.random() * 60;
            d.userData.rotSpeed = (Math.random() - 0.5) * 10;
            this.add(d);
            this.debris.push(d);
        }
        
        this.breakTimer = 0;
    }

    update(dt) {
        if (this.type === 'moving') {
            this.position.x += this.velocity.x * dt;
            const bounds = gameApp.screenBounds;
            
            // Bounce off screen edges
            if (this.position.x - this.platformWidth / 2 < bounds.left) {
                this.position.x = bounds.left + this.platformWidth / 2;
                this.velocity.x *= -1;
            } else if (this.position.x + this.platformWidth / 2 > bounds.right) {
                this.position.x = bounds.right - this.platformWidth / 2;
                this.velocity.x *= -1;
            }
        }
        
        // Animate break effect
        if (this.isBroken && this.leftHalf && this.rightHalf) {
            this.breakTimer += dt / 60; // convert to seconds
            const gravity = 200;
            const dtSec = dt / 60;
            
            // Left half flies left and falls
            this.leftHalf.userData.vy -= gravity * dtSec;
            this.leftHalf.position.x += this.leftHalf.userData.vx * dtSec;
            this.leftHalf.position.y += this.leftHalf.userData.vy * dtSec;
            this.leftHalf.rotation.z += this.leftHalf.userData.rotSpeed * dtSec;
            
            // Right half flies right and falls
            this.rightHalf.userData.vy -= gravity * dtSec;
            this.rightHalf.position.x += this.rightHalf.userData.vx * dtSec;
            this.rightHalf.position.y += this.rightHalf.userData.vy * dtSec;
            this.rightHalf.rotation.z += this.rightHalf.userData.rotSpeed * dtSec;
            
            // Fade both halves
            if (this.breakTimer > 0.4) {
                const fade = 1 - (this.breakTimer - 0.4) / 0.4;
                this.leftHalf.material.transparent = true;
                this.leftHalf.material.opacity = Math.max(0, fade);
                this.rightHalf.material.transparent = true;
                this.rightHalf.material.opacity = Math.max(0, fade);
            }
            
            // Animate debris
            if (this.debris) {
                for (const d of this.debris) {
                    d.userData.vy -= gravity * dtSec;
                    d.position.x += d.userData.vx * dtSec;
                    d.position.y += d.userData.vy * dtSec;
                    d.rotation.x += d.userData.rotSpeed * dtSec;
                    d.rotation.z += d.userData.rotSpeed * dtSec * 0.7;
                    d.material.opacity = Math.max(0, 1 - this.breakTimer / 0.6);
                }
            }
            
            // Clean up after animation
            if (this.breakTimer > 0.8) {
                this.remove(this.leftHalf);
                this.remove(this.rightHalf);
                this.leftHalf.geometry.dispose();
                this.leftHalf.material.dispose();
                this.rightHalf.geometry.dispose();
                this.rightHalf.material.dispose();
                this.leftHalf = null;
                this.rightHalf = null;
                
                if (this.debris) {
                    for (const d of this.debris) {
                        this.remove(d);
                        d.geometry.dispose();
                        d.material.dispose();
                    }
                    this.debris = null;
                }
                
                this.visible = false;
            }
        }
    }
}
