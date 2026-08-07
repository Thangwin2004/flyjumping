import * as THREE from 'three';
import { gameApp } from '../core/Application';
import { AudioManager } from '../managers/AudioManager';
import { AssetManager } from '../managers/AssetManager';
import gsap from 'gsap';

export class Player extends THREE.Group {
    constructor() {
        super();
        
        this.model = AssetManager.getModel('player');
        if (this.model) {
            // FBX SkinnedMesh bounding boxes can be unreliable.
            // Using a fixed scale based on standard Mixamo FBX sizes (~180 units tall)
            this.baseScale = 0.35; 
            this.model.scale.set(this.baseScale, this.baseScale, this.baseScale);
            
            // Adjust center (assume center is roughly at origin for ground)
            this.model.position.y = -20; 
            
            // Rotate to face camera (often FBX from Mixamo faces +Z)
            this.model.rotation.y = 0;
            
            this.model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.frustumCulled = false; // Disable culling for SkinnedMesh to prevent disappearing
                    
                    // Force a simple material to ensure visibility, but keep the texture map if present
                    const oldMat = child.material;
                    let map = null;
                    if (oldMat) {
                        if (Array.isArray(oldMat)) {
                            map = oldMat[0].map;
                        } else {
                            map = oldMat.map;
                        }
                    }
                    
                    child.material = new THREE.MeshStandardMaterial({ 
                        color: 0xffffff,
                        map: map,
                        roughness: 0.7,
                        metalness: 0.0,
                        emissive: 0xffffff,
                        emissiveMap: map, // This makes it glow using its own texture colors!
                        emissiveIntensity: 0.5 // High intensity, but since it uses the texture, it won't turn white
                    });
                }
            });
            this.add(this.model);
            
            // Set up AnimationMixer
            this.mixer = new THREE.AnimationMixer(this.model);
            this.animations = {};
            
            const jumpModel = AssetManager.getModel('jumpAnim');
            if (jumpModel && jumpModel.animations.length > 0) {
                this.animations.jump = this.mixer.clipAction(jumpModel.animations[0]);
                this.animations.jump.play();
                this.currentAnim = 'jump';
            }
            
            const hitModel = AssetManager.getModel('hitAnim'); // hitAnim is Female Dance Pose.fbx
            if (hitModel && hitModel.animations.length > 0) {
                this.animations.hit = this.mixer.clipAction(hitModel.animations[0]);
                this.animations.hit.setLoop(THREE.LoopOnce);
                this.animations.hit.clampWhenFinished = true;
                
                // Reuse the dance pose for rocket flight
                this.animations.rocket = this.mixer.clipAction(hitModel.animations[0]);
                this.animations.rocket.setLoop(THREE.LoopRepeat);
            }
        }

        // Move player forward in 3D space so they visually pass in front of platforms
        this.position.z = 30;

        // Physics
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.gravity = 0.45; // slightly faster gravity for a snappy feel
        this.jumpForce = 15; // Balanced jump force (not too low, not too high)
        
        // Size for collisions
        this.radius = 25; 
        
        // Input tracking
        this.isDragging = false;
        this.dragStartX = 0;
        
        this.bounds = gameApp.screenBounds;

        // ========== BOOSTER STATES ==========
        this.hasShield = false;
        this.shieldTimer = 0;
        this.shieldDuration = 8; // seconds

        this.hasSlowMo = false;
        this.slowMoTimer = 0;
        this.slowMoDuration = 6; // seconds

        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.magnetDuration = 8; // seconds

        this.isRocketing = false;
        this.rocketTimer = 0;
        this.rocketDuration = 2.0; // seconds of rocket flight (increased for awesome effect)

        // Shield visual (bubble aura)
        this.shieldMesh = null;
        this.buildShieldAura();
        
        // Speed lines visual
        this.speedLines = null;
        this.buildSpeedLines();
    }

    buildSpeedLines() {
        this.speedLines = new THREE.Group();
        this.speedLines.visible = false;
        
        const lineGeom = new THREE.CylinderGeometry(0.3, 0.3, 60, 4);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
        
        this.lines = [];
        for (let i = 0; i < 20; i++) {
            const line = new THREE.Mesh(lineGeom, lineMat);
            line.position.x = (Math.random() - 0.5) * 100;
            line.position.z = (Math.random() - 0.5) * 100;
            line.position.y = (Math.random() - 0.5) * 150;
            line.userData = { speed: 120 + Math.random() * 60 };
            
            this.lines.push(line);
            this.speedLines.add(line);
        }
        this.add(this.speedLines);
    }

    buildShieldAura() {
        const geom = new THREE.SphereGeometry(35, 16, 16);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x4FC3F7,
            transparent: true,
            opacity: 0.25,
            emissive: 0x4FC3F7,
            emissiveIntensity: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.1
        });
        this.shieldMesh = new THREE.Mesh(geom, mat);
        this.shieldMesh.visible = false;
        this.add(this.shieldMesh);
    }

    reset() {
        this.velocity.set(0, 0, 0);
        this.bounds = gameApp.screenBounds;
        this.position.x = gameApp.GAME_WIDTH / 2;
        // Spawn the player high enough so they drop down onto the raised ground platform
        this.position.y = 400;
        this.position.z = 30; // Keep Z at 30 to prevent visual clipping
        
        // Reset scale
        if (this.model && this.baseScale) {
            gsap.killTweensOf(this.model.scale);
            this.model.scale.set(this.baseScale, this.baseScale, this.baseScale);
        }

        // Always reset to jump animation (stop hit anim if it was playing)
        if (this.mixer && this.animations.jump) {
            if (this.animations.hit) {
                this.animations.hit.stop();
                this.animations.hit.reset();
            }
            this.animations.jump.reset();
            this.animations.jump.play();
            this.currentAnim = 'jump';
        }

        // Reset booster states
        this.clearAllBoosters();
        
        // Reset visibility
        this.visible = true;
        this.rotation.set(0, 0, 0);
        this.scale.set(1, 1, 1);
    }

    clearAllBoosters() {
        this.hasShield = false;
        this.shieldTimer = 0;
        this.hasSlowMo = false;
        this.slowMoTimer = 0;
        this.hasMagnet = false;
        this.magnetTimer = 0;
        this.isRocketing = false;
        this.rocketTimer = 0;

        if (this.shieldMesh) this.shieldMesh.visible = false;
        if (this.speedLines) this.speedLines.visible = false;
    }

    // ========== BOOSTER ACTIVATIONS ==========

    activateRocket() {
        this.isRocketing = true;
        this.rocketTimer = 0;
        this.velocity.y = 65; // Strong upward force (super speed)
        if (this.speedLines) this.speedLines.visible = true;
        
        // Add a squash effect to emphasize launch
        if (this.model && this.baseScale) {
            gsap.killTweensOf(this.model.scale);
            this.model.scale.set(this.baseScale * 0.5, this.baseScale * 1.8, this.baseScale * 0.5);
            gsap.to(this.model.scale, { x: this.baseScale, y: this.baseScale, z: this.baseScale, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        }
        
        // Play dance animation
        if (this.mixer && this.animations.rocket) {
            if (this.animations.jump) this.animations.jump.stop();
            if (this.animations.hit) this.animations.hit.stop();
            this.animations.rocket.reset();
            this.animations.rocket.play();
            this.currentAnim = 'rocket';
        }
        
        AudioManager.playBoosterSFX();
    }

    activateShield() {
        this.hasShield = true;
        this.shieldTimer = 0;
        if (this.shieldMesh) {
            this.shieldMesh.visible = true;
            gsap.fromTo(this.shieldMesh.scale,
                { x: 0.1, y: 0.1, z: 0.1 },
                { x: 1, y: 1, z: 1, duration: 0.3, ease: "back.out(2)" }
            );
        }
        AudioManager.playBoosterSFX();
    }

    activateMagnet() {
        this.hasMagnet = true;
        this.magnetTimer = 0;
        AudioManager.playBoosterSFX();
    }

    activateSlowMo() {
        this.hasSlowMo = true;
        this.slowMoTimer = 0;
        AudioManager.playBoosterSFX();
    }

    jump() {
        this.velocity.y = this.jumpForce;
        AudioManager.playJumpSFX();
        
        // Squash and stretch effect
        if (this.model && this.baseScale) {
            gsap.killTweensOf(this.model.scale);
            this.model.scale.set(this.baseScale * 0.8, this.baseScale * 1.3, this.baseScale * 0.8);
            gsap.to(this.model.scale, { x: this.baseScale, y: this.baseScale, z: this.baseScale, duration: 0.3, ease: "elastic.out(1, 0.5)" });
        }
        
        // Let the jump animation loop naturally, don't reset it
    }

    superJump() {
        this.velocity.y = this.jumpForce * 1.6; // 60% higher jump
        AudioManager.playJumpSFX(); // We can use the same sound or pitch it up if AudioManager supports it
        
        // More exaggerated squash and stretch
        if (this.model && this.baseScale) {
            gsap.killTweensOf(this.model.scale);
            this.model.scale.set(this.baseScale * 0.6, this.baseScale * 1.6, this.baseScale * 0.6);
            gsap.to(this.model.scale, { x: this.baseScale, y: this.baseScale, z: this.baseScale, duration: 0.4, ease: "elastic.out(1, 0.5)" });
        }
    }

    playHitAnim() {
        if (this.mixer && this.animations.hit) {
            // Stop jump animation
            if (this.animations.jump) {
                this.animations.jump.stop();
            }
            // Play hit pose
            this.animations.hit.reset();
            this.animations.hit.play();
            this.currentAnim = 'hit';
        }
    }

    update(dt) {
        if (this.mixer) {
            this.mixer.update(dt / 60); // dt is in 60fps frames
        }

        const dtSec = dt / 60;
        
        // ========== BOOSTER UPDATES ==========
        
        // Rocket mode: override gravity, fly upward
        if (this.isRocketing) {
            this.rocketTimer += dtSec;
            
            // Adjust rocket thrust dynamically if slow-motion is active
            const currentSlowMo = (this.parent && this.parent.timeScale) ? this.parent.timeScale : 1.0;
            const thrust = currentSlowMo < 0.2 ? 22 : (currentSlowMo < 0.6 ? 40 : 65);
            this.velocity.y = thrust;
            this.velocity.x *= 0.5; // Reduce horizontal control during rocket
            
            // Animate speed lines moving down to simulate high speed upward
            if (this.speedLines && this.speedLines.visible) {
                this.lines.forEach(line => {
                    line.position.y -= line.userData.speed * dtSec * 60;
                    if (line.position.y < -150) {
                        line.position.y = 150 + Math.random() * 50;
                    }
                });
            }

            if (this.rocketTimer >= this.rocketDuration) {
                this.isRocketing = false;
                this.velocity.y = this.jumpForce; // End with a normal jump boost
                if (this.speedLines) this.speedLines.visible = false;
                
                // Return to jump animation
                if (this.mixer && this.animations.jump) {
                    if (this.animations.rocket) this.animations.rocket.stop();
                    this.animations.jump.reset();
                    this.animations.jump.play();
                    this.currentAnim = 'jump';
                }
            }
        }

        // Shield timer
        if (this.hasShield) {
            this.shieldTimer += dtSec;
            // Pulse shield visual
            if (this.shieldMesh) {
                this.shieldMesh.material.opacity = 0.2 + Math.sin(this.shieldTimer * 4) * 0.1;
                this.shieldMesh.rotation.y += dt * 0.02;
            }
            if (this.shieldTimer >= this.shieldDuration) {
                this.hasShield = false;
                if (this.shieldMesh) {
                    gsap.to(this.shieldMesh.scale, {
                        x: 0.1, y: 0.1, z: 0.1, duration: 0.3,
                        onComplete: () => { this.shieldMesh.visible = false; this.shieldMesh.scale.set(1, 1, 1); }
                    });
                }
            }
        }

        // Slow-Mo timer
        if (this.hasSlowMo) {
            this.slowMoTimer += dtSec;
            if (this.slowMoTimer >= this.slowMoDuration) {
                this.hasSlowMo = false;
            }
        }

        // Magnet timer
        if (this.hasMagnet) {
            this.magnetTimer += dtSec;
            if (this.magnetTimer >= this.magnetDuration) {
                this.hasMagnet = false;
            }
        }

        // ========== PHYSICS ==========
        
        // Apply gravity (modified by slow-mo)
        const gravityMod = this.hasSlowMo ? 0.5 : 1.0;
        if (!this.isRocketing) {
            this.velocity.y -= this.gravity * dt * gravityMod;
        }
        
        // Drag logic is handled by GameScene.js via setDragVelocity

        // Apply velocity
        this.position.x += this.velocity.x * dt;
        this.position.y += this.velocity.y * dt;

        // Block at screen edges instead of wrapping
        if (this.position.x > this.bounds.right - this.radius) {
            this.position.x = this.bounds.right - this.radius;
            this.velocity.x = 0;
        } else if (this.position.x < this.bounds.left + this.radius) {
            this.position.x = this.bounds.left + this.radius;
            this.velocity.x = 0;
        }
        // No need to switch to falling animation anymore, just loop jump
        
        // In Three.js sprites can't rotate on Z easily through standard rotation if it's a Sprite.
        // If we want rotation, we can modify material rotation
        if (this.model) {
            this.model.rotation.z = -(this.velocity.x * 0.05);
        }
        
        // Friction
        this.velocity.x *= 0.85;
    }

    setDragVelocity(dx) {
        // Tăng độ nhạy trên điện thoại
        this.velocity.x = dx * 0.8; 
        
        // Tăng max speed để dễ với tới các bệ ở xa
        const MAX_SPEED = 35;
        if (this.velocity.x > MAX_SPEED) this.velocity.x = MAX_SPEED;
        if (this.velocity.x < -MAX_SPEED) this.velocity.x = -MAX_SPEED;
    }
}
