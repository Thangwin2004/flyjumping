import * as THREE from 'three';
import { Platform } from './Platform';
import { Enemy } from './Enemy';
import { Booster } from './Booster';
import { SawBlade } from './SawBlade';
import { WindGust } from './WindGust';
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
        
        // Destroy arrays for enemies and other entities
        if (this.enemies) this.enemies.forEach(e => this.remove(e));
        if (this.boosters) this.boosters.forEach(b => this.remove(b));
        if (this.sawBlades) this.sawBlades.forEach(s => this.remove(s));
        if (this.windGusts) this.windGusts.forEach(w => this.remove(w));

        this.enemies = [];
        this.boosters = [];
        this.sawBlades = [];
        this.windGusts = [];

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
        
        if (this.enemies) this.enemies.forEach(e => this.remove(e));
        if (this.boosters) this.boosters.forEach(b => this.remove(b));
        if (this.sawBlades) this.sawBlades.forEach(s => this.remove(s));
        if (this.windGusts) this.windGusts.forEach(w => this.remove(w));
        
        this.enemies = [];
        this.boosters = [];
        this.sawBlades = [];
        this.windGusts = [];
        
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
        
        // Adjust platform spawning probabilities
        if (this.difficulty > 2 && rand < 0.15) type = 'moving';
        else if (this.difficulty > 3 && rand > 0.15 && rand < 0.25) type = 'fragile';
        else if (this.difficulty > 2 && rand >= 0.25 && rand < 0.32) type = 'spike'; // lowered from 0.35 to 0.32 (7% chance)

        // GUARD: Never allow consecutive spike/fragile platforms.
        // After a spike the player MUST have a safe platform to land on,
        // otherwise the game becomes unwinnable (softlock).
        if ((type === 'spike' || type === 'fragile') && this.lastSpawnedType === 'spike') {
            type = 'normal';
        }
        // Also prevent spike right after fragile (fragile breaks, next is spike = dead)
        if (type === 'spike' && this.lastSpawnedType === 'fragile') {
            type = 'normal';
        }
        this.lastSpawnedType = type;

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

        // --- SAFE ALTERNATIVE FOR SPIKE PLATFORMS ---
        // To ensure the player can always progress, the SPIKE platform should be placed far away,
        // and the SAFE platform should be placed exactly where the spike was originally planned (reachable).
        if (type === 'spike') {
            const safePlatform = new Platform('normal');
            safePlatform.hasBeenLandedOn = false;
            safePlatform.platformIndex = this.totalPlatformsSpawned++;
            
            // Swap positions: safePlatform takes the reachable position
            safePlatform.position.x = platform.position.x;
            safePlatform.position.y = this.highestY;
            
            // Move the spike platform to the opposite side of the screen
            if (safePlatform.position.x < (minX + maxX) / 2) {
                // Safe is on the left, put spike on the right
                platform.position.x = Math.min(maxX, safePlatform.position.x + 160);
            } else {
                // Safe is on the right, put spike on the left
                platform.position.x = Math.max(minX, safePlatform.position.x - 160);
            }
            
            this.platforms.push(safePlatform);
            this.add(safePlatform);
        }

        // --- SPATIAL ENTITY SPAWNING ---
        
        // Cannot spawn multiple special items on the same platform easily to avoid clutter
        let spawnedSpecial = false;

        // 1. Spiky Enemy (5% chance)
        if (this.totalPlatformsSpawned > 5 && type !== 'spike' && !platform.hasSpring && Math.random() < 0.05 && !spawnedSpecial) {
            const enemy = new Enemy();
            enemy.position.x = platform.position.x;
            enemy.position.y = platform.position.y + 120 + Math.random() * 80; // Hovering in the air
            this.add(enemy);
            this.enemies.push(enemy);
            spawnedSpecial = true;
        }

        // 2. Booster (8% chance)
        if (this.totalPlatformsSpawned > 3 && type !== 'spike' && type !== 'fragile' && !platform.hasSpring && Math.random() < 0.08 && !spawnedSpecial) {
            const types = ['rocket', 'shield', 'magnet', 'slowmo'];
            const bType = types[Math.floor(Math.random() * types.length)];
            const booster = new Booster(bType);
            booster.position.x = platform.position.x;
            booster.position.y = platform.position.y + 45; // Hover above platform
            this.add(booster);
            this.boosters.push(booster);
            spawnedSpecial = true;
        }

        // 3. Saw Blade (8% chance, between current and next platform area)
        if (this.difficulty > 3 && this.totalPlatformsSpawned > 10 && Math.random() < 0.08 && !spawnedSpecial) {
            const sawBlade = new SawBlade(platform.position.y + 40, platform.position.y + gap - 40);
            // Place it horizontally random but reachable
            sawBlade.position.x = minX + 50 + Math.random() * (maxX - minX - 100);
            sawBlade.position.y = platform.position.y + 40;
            this.add(sawBlade);
            this.sawBlades.push(sawBlade);
            spawnedSpecial = true;
        }

        // 4. Wind Gust (6% chance, difficulty > 4)
        if (this.difficulty > 4 && this.totalPlatformsSpawned > 20 && Math.random() < 0.06 && !spawnedSpecial) {
            const direction = Math.random() > 0.5 ? 1 : -1;
            const wind = new WindGust(direction);
            // Place it exactly over the newly spawned platform's x position to force the player to fight it to land!
            wind.position.x = platform.position.x; 
            wind.position.y = platform.position.y - gap / 2; // Below the next platform (in the jump gap)
            this.add(wind);
            this.windGusts.push(wind);
            spawnedSpecial = true;
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

        // Update entities
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

        if (this.boosters) {
            for (const b of this.boosters) {
                b.update(dt);
            }
        }

        if (this.sawBlades) {
            for (const s of this.sawBlades) {
                s.update(dt);
            }
        }

        if (this.windGusts) {
            for (const w of this.windGusts) {
                w.update(dt);
            }
        }

        // Clean up entities that have fallen far below the screen view
        const screenBottom = gameApp.camera.position.y - gameApp.screenBounds.height / 2 - 200;
        
        // Generic cleanup function
        const cleanupArray = (arr) => {
            if (!arr) return;
            for (let i = arr.length - 1; i >= 0; i--) {
                const item = arr[i];
                if (item.position.y < screenBottom) {
                    this.remove(item);
                    if (item.mesh || item.visual) {
                        item.traverse(child => {
                            if (child.isMesh) {
                                child.geometry.dispose();
                                if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
                                else child.material.dispose();
                            }
                        });
                    }
                    arr.splice(i, 1);
                }
            }
        };

        cleanupArray(this.platforms);
        cleanupArray(this.enemies);
        cleanupArray(this.boosters);
        cleanupArray(this.sawBlades);
        cleanupArray(this.windGusts);
        
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
