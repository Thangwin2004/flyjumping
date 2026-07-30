import * as THREE from 'three';
import { Platform } from './Platform';
import { Enemy } from './Enemy';
import { gameApp } from '../core/Application';

export class PlatformManager extends THREE.Group {
    constructor() {
        super();
        this.platforms = [];
        this.highestY = gameApp.screenBounds ? gameApp.screenBounds.height : 960;
        this.platformGap = 100;
        this.difficulty = 1;
    }

    reset() {
        // Destroy all existing platforms
        for (const p of this.platforms) {
            this.remove(p);
            if (p.mesh) {
                p.mesh.geometry.dispose();
                if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(m => m.dispose());
                else p.mesh.material.dispose();
            }
        }
        this.platforms = [];
        this.highestY = 180; // Start first platforms extremely low so it is impossible to miss the first jump
        this.difficulty = 1;
        this.platformGap = 120; // Slightly larger gap since the player can jump much higher now
        this.totalPlatformsSpawned = 0; // Track for scoring
        this.enemies = []; // Track enemies

        // Guarantee first platform is a massive ground floor
        const ground = new Platform('ground');
        ground.platformWidth = 2000;
        ground.platformHeight = 100;
        if (ground.mesh) {
            ground.mesh.geometry.dispose();
            ground.mesh.geometry = new THREE.BoxGeometry(2000, 100, 400);
            
            // Use ShadowMaterial to make it invisible but still receive shadows on the 2D background!
            ground.mesh.material = new THREE.ShadowMaterial({ opacity: 0.3 });
            ground.mesh.visible = true; 
            ground.mesh.castShadow = false;
            ground.mesh.receiveShadow = true;
        }
        ground.position.x = (gameApp.screenBounds.left + gameApp.screenBounds.right) / 2;
        ground.position.y = 180; 
        ground.hasBeenLandedOn = true; 
        ground.platformIndex = this.totalPlatformsSpawned++;
        this.add(ground);
        this.platforms.push(ground);

        // Add a visible starting pedestal sitting on the ground (Magical lilypad)
        const startPedestal = new Platform('start');
        startPedestal.platformWidth = 120; // Smaller width
        
        // Make the default box mesh invisible but keep it for structure
        startPedestal.mesh.material.transparent = true;
        startPedestal.mesh.material.opacity = 0;
        startPedestal.mesh.castShadow = false;
        
        // Remove spring if randomly generated
        if (startPedestal.hasSpring && startPedestal.springMesh) {
            startPedestal.mesh.remove(startPedestal.springMesh);
            startPedestal.hasSpring = false;
        }
        
        // Create the giant trampoline visually - Magical Pastel Style
        const trampGroup = new THREE.Group();
        
        // Base rim (Soft white/pink, fluffy/rounded look)
        const rimGeom = new THREE.TorusGeometry(55, 10, 16, 64);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1.0, metalness: 0.0 });
        const rimMesh = new THREE.Mesh(rimGeom, rimMat);
        rimMesh.rotation.x = Math.PI / 2;
        rimMesh.position.y = 2;
        rimMesh.castShadow = true;
        rimMesh.receiveShadow = true;
        trampGroup.add(rimMesh);

        // Bouncing pad surface (Solid glowing mint/cyan disc INSIDE the ring)
        const padGeom = new THREE.CylinderGeometry(48, 48, 3, 64);
        const padMat = new THREE.MeshStandardMaterial({ 
            color: 0x81D4FA, 
            roughness: 0.3, 
            emissive: 0x81D4FA, 
            emissiveIntensity: 0.5,
            side: THREE.DoubleSide
        });
        const padSurface = new THREE.Mesh(padGeom, padMat);
        padSurface.position.y = 2; 
        padSurface.receiveShadow = true;
        trampGroup.add(padSurface);
        
        // Cross-hatch net lines on the surface (4 lines across)
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.5 });
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI;
            const lineGeom = new THREE.BoxGeometry(90, 1.5, 2);
            const line = new THREE.Mesh(lineGeom, lineMat);
            line.rotation.y = angle;
            line.position.y = 4;
            trampGroup.add(line);
        }
        
        // Inner glowing core circle
        const coreGeom = new THREE.CylinderGeometry(15, 15, 4, 32);
        const coreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.6 });
        const coreMesh = new THREE.Mesh(coreGeom, coreMat);
        coreMesh.position.y = 3;
        trampGroup.add(coreMesh);
        
        // Tilt slightly to match 2D background perspective
        trampGroup.rotation.x = THREE.MathUtils.degToRad(12);
        
        // Add trampoline to the mesh so it inherits position
        startPedestal.mesh.add(trampGroup);

        startPedestal.position.x = ground.position.x;
        startPedestal.position.y = 220; // Embed it slightly into the 230 ground so it looks like it's lying flat
        startPedestal.hasBeenLandedOn = true; // Exclude from scoring
        startPedestal.platformIndex = this.totalPlatformsSpawned++;
        this.add(startPedestal);
        this.platforms.push(startPedestal);

        this.highestY = 320; // Start the rest of the generation higher up so there are no platforms near the ground

        // Generate the rest of the batch
        for (let i = 0; i < 14; i++) {
            this.spawnPlatform();
        }
    }

    revivePlatforms(startY) {
        // Destroy all existing platforms
        for (const p of this.platforms) {
            this.remove(p);
            if (p.mesh) {
                p.mesh.geometry.dispose();
                if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(m => m.dispose());
                else p.mesh.material.dispose();
            }
        }
        this.platforms = [];
        
        if (this.enemies) {
            for (const e of this.enemies) {
                this.remove(e);
            }
            this.enemies = [];
        }
        
        // Start from startY
        this.highestY = startY;

        // Generate initial batch from the revive point
        for (let i = 0; i < 15; i++) {
            this.spawnPlatform();
        }
        
        // Guarantee first platform is directly under player's revive position
        this.platforms[0].position.x = (gameApp.screenBounds.left + gameApp.screenBounds.right) / 2;
        this.platforms[0].position.y = startY + 50;
        this.platforms[0].type = 'normal';
        this.platforms[0].hasBeenLandedOn = true; // Exclude revive platform from scoring
    }

    spawnPlatform() {
        let type = 'normal';
        const rand = Math.random();
        if (this.difficulty > 2 && rand < 0.2) type = 'moving';
        else if (this.difficulty > 3 && rand < 0.4) type = 'fragile';

        const platform = new Platform(type);
        platform.hasBeenLandedOn = false;
        platform.platformIndex = this.totalPlatformsSpawned++;
        
        const bounds = gameApp.screenBounds;
        const minX = bounds.left + platform.platformWidth / 2;
        const maxX = bounds.right - platform.platformWidth / 2;
        
        // Horizontal placement: constrained to a reachable distance from the previous platform
        if (this.platforms.length === 0) {
            platform.position.x = minX + Math.random() * (maxX - minX);
        } else {
            const lastX = this.platforms[this.platforms.length - 1].position.x;
            const maxReach = 220; // Safe horizontal swiping reach for casual play
            
            const possibleMinX = Math.max(minX, lastX - maxReach);
            const possibleMaxX = Math.min(maxX, lastX + maxReach);
            
            platform.position.x = possibleMinX + Math.random() * (possibleMaxX - possibleMinX);
        }
        
        // Position Y goes UP in Three.js
        const gap = this.platformGap + (Math.random() * 20 - 10);
        this.highestY += gap;
        platform.position.y = this.highestY;
        
        this.platforms.push(platform);
        this.add(platform);
        
        // 5% chance to spawn an enemy hovering above this platform
        if (this.totalPlatformsSpawned > 5 && !platform.hasSpring && Math.random() < 0.05) {
            const enemy = new Enemy();
            enemy.position.x = platform.position.x;
            enemy.position.y = platform.position.y + 120 + Math.random() * 80; // Hovering in the air
            this.add(enemy);
            this.enemies.push(enemy);
        }
    }

    update(dt, cameraY) {
        // Update platforms
        for (const p of this.platforms) {
            p.update(dt);
        }
        
        // Apply parallax offset so the physical ground sticks to the slowly scrolling 2D background
        const parallaxOffset = (cameraY - 480) * 0.04;
        for (const p of this.platforms) {
            if (p.platformIndex === 0) p.position.y = 180 - parallaxOffset;
            if (p.platformIndex === 1) p.position.y = 220 - parallaxOffset;
        }

        // Update enemies
        if (this.enemies) {
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.update(dt);
                if (enemy.isDead && enemy.position.y < -1000) {
                    this.remove(enemy);
                    this.enemies.splice(i, 1);
                }
            }
        }

        // Clean up platforms that have fallen far below the screen view
        const screenBottom = gameApp.camera.position.y - gameApp.screenBounds.height / 2 - 200;
        
        for (let i = this.platforms.length - 1; i >= 0; i--) {
            const p = this.platforms[i];
            // If the platform is below the screen bottom
            if (p.position.y < screenBottom) {
                this.remove(p);
                if (p.mesh) {
                    p.mesh.geometry.dispose();
                    if (Array.isArray(p.mesh.material)) p.mesh.material.forEach(m => m.dispose());
                    else p.mesh.material.dispose();
                }
                this.platforms.splice(i, 1);
            }
        }
        
        // Spawn new platforms if we are approaching highestY
        const screenTop = gameApp.camera.position.y + gameApp.screenBounds.height / 2 + 200;
        while (this.highestY < screenTop) {
            this.spawnPlatform();
        }
    }

    increaseDifficulty() {
        this.difficulty += 0.5;
        // Max gap capped safely below max jump height (200) so it's always reachable
        this.platformGap = Math.min(160, 100 + (this.difficulty * 8));
    }
}
