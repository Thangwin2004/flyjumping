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
            
            const hitModel = AssetManager.getModel('hitAnim');
            if (hitModel && hitModel.animations.length > 0) {
                this.animations.hit = this.mixer.clipAction(hitModel.animations[0]);
                this.animations.hit.setLoop(THREE.LoopOnce);
                this.animations.hit.clampWhenFinished = true;
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

        // Always play jump animation
        if (this.mixer && this.animations.jump) {
            this.animations.jump.play();
            this.currentAnim = 'jump';
        }
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
        
        // Apply gravity
        this.velocity.y -= this.gravity * dt;
        
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
