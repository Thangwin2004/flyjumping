import * as THREE from 'three';
import { Player } from '../entities/Player';
import { PlatformManager } from '../entities/PlatformManager';
import { gameApp } from '../core/Application';
import { UIBuilder } from '../ui/UIBuilder';
import { MainMenu } from '../ui/MainMenu';
import { AdManager } from '../managers/AdManager';
import { SettingsModal } from '../ui/SettingsModal';
import { LandingVFX } from '../effects/LandingVFX';
import { ConfettiVFX } from '../effects/ConfettiVFX';
import { AudioManager } from '../managers/AudioManager';
import { winkGame } from '../integrations/wink/wink-adapter.js';
import gsap from 'gsap';

export class GameScene extends THREE.Group {
    constructor() {
        super();
        
        this.platformManager = new PlatformManager();
        this.add(this.platformManager);
        
        this.player = new Player();
        this.add(this.player);
        
        // Landing VFX
        this.landingVFX = new LandingVFX();
        this.add(this.landingVFX);
        
        // Confetti VFX
        this.confettiVFX = new ConfettiVFX();
        this.add(this.confettiVFX);
        
        // UI layer (HTML instead of Pixi)
        this.scoreElement = document.createElement('div');
        this.scoreElement.style.cssText = "position:absolute;top:20px;left:30px;font-family:'Lilita One', cursive;font-size:58px;color:#ffffff;-webkit-text-stroke:2px #F50057;text-shadow:0 6px 0 #F50057, 0 8px 15px rgba(0,0,0,0.4);z-index:100;pointer-events:none; letter-spacing: 2px;";
        this.scoreElement.innerText = "0";
        document.getElementById('game-container').appendChild(this.scoreElement);
        
        // Milestone Message Container
        this.milestoneContainer = document.createElement('div');
        this.milestoneContainer.style.cssText = "position:absolute;top:40%;left:50%;transform:translate(-50%, -50%) scale(0);display:flex;flex-direction:column;align-items:center;pointer-events:none;z-index:101;opacity:0;";
        
        this.milestoneEmoji = document.createElement('div');
        this.milestoneEmoji.style.cssText = "font-size:72px;line-height:1;margin-bottom:10px;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3));";
        
        this.milestoneText = document.createElement('div');
        this.milestoneText.style.cssText = "font-family:'Lilita One', cursive;font-size:42px;color:#FFF176;-webkit-text-stroke:1.5px #F57F17;text-shadow:0 4px 0 #F57F17, 0 4px 10px rgba(0,0,0,0.4);letter-spacing:1px;text-align:center;white-space:nowrap;";
        
        this.milestoneContainer.appendChild(this.milestoneEmoji);
        this.milestoneContainer.appendChild(this.milestoneText);
        document.getElementById('game-container').appendChild(this.milestoneContainer);
        
        // Settings Button (In-game) - Style matched with MainMenu
        const settingsSvg = '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="#ffffff" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
        this.settingsBtn = document.createElement('button');
        this.settingsBtn.style.cssText = "position:absolute;top:20px;right:20px;width:50px;height:50px;border-radius:50%;border:3px solid #fff;background:linear-gradient(to bottom, #4FC3F7, #039BE5);box-shadow:0 4px 0 #0277BD, 0 4px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:100;transition:transform 0.1s;padding:0;";
        this.settingsBtn.innerHTML = settingsSvg;
        this.settingsBtn.onmousedown = () => this.settingsBtn.style.transform = "scale(0.9) translateY(4px)";
        this.settingsBtn.onmouseup = () => this.settingsBtn.style.transform = "scale(1) translateY(0)";
        this.settingsBtn.onmouseleave = () => this.settingsBtn.style.transform = "scale(1) translateY(0)";
        
        // Touch events
        this.settingsBtn.addEventListener('touchstart', () => this.settingsBtn.style.transform = "scale(0.9) translateY(4px)", {passive: true});
        this.settingsBtn.addEventListener('touchend', () => this.settingsBtn.style.transform = "scale(1) translateY(0)", {passive: true});

        this.settingsBtn.onclick = () => {
            AudioManager.playClickSFX();
            this.openSettings();
        };
        document.getElementById('game-container').appendChild(this.settingsBtn);
        
        this.score = 0;
        this.state = 'playing'; // playing, gameover
        this.graceTimer = 0; // Grace period timer
        this.milestoneReached = 0;
        
        this.bindInput();
        this.tickerFunc = this.update.bind(this);
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.highestScore = 0;
        this.highestPlatformIndex = 0;
        this.hasRevived = false;
        this.graceTimer = 1.5; // 1.5 seconds of grace period where player cannot die
        this.milestoneReached = 0;

        // ── Wink: start a new round ──
        this._winkRound = winkGame.startRound();

        this.updateScore();
        this.scoreElement.style.display = 'block';
        this.settingsBtn.style.display = 'flex';
        
        this.platformManager.reset();
        this.player.reset();
        
        // Fix the drop issue: align player perfectly with start pedestal (index 1)
        if (this.platformManager.platforms.length > 1) {
            const startPad = this.platformManager.platforms[1];
            this.player.position.x = startPad.position.x;
            this.player.position.y = startPad.position.y + 35; // just above
            this.player.jump(); // automatically jump to start moving
        }
        
        // Reset camera
        gameApp.camera.position.y = gameApp.GAME_HEIGHT / 2;
        
        if (gameApp.dirLight) {
            gameApp.dirLight.position.y = gameApp.camera.position.y + 500;
            gameApp.dirLight.target.position.y = gameApp.camera.position.y;
            gameApp.dirLight.target.updateMatrixWorld();
        }
        
        gameApp.ticker.add(this.tickerFunc);
    }

    bindInput() {
        this.pointerDownHandler = (e) => {
            if (this.state !== 'playing') return;
            // Ignore if clicking settings button
            if (e.target === this.settingsBtn || this.settingsBtn.contains(e.target)) return;
            
            this.player.isDragging = true;
            this.player.dragStartX = e.clientX;
        };
        
        this.pointerMoveHandler = (e) => {
            if (this.state !== 'playing' || !this.player.isDragging) return;
            const dx = e.clientX - this.player.dragStartX;
            this.player.setDragVelocity(dx);
            this.player.dragStartX = e.clientX; 
        };
        
        this.pointerUpHandler = () => {
            this.player.isDragging = false;
        };

        window.addEventListener('pointerdown', this.pointerDownHandler);
        window.addEventListener('pointermove', this.pointerMoveHandler);
        window.addEventListener('pointerup', this.pointerUpHandler);
    }

    update(ticker) {
        if (this.state !== 'playing' && this.state !== 'exploding') return;
        
        const dt = ticker.deltaTime;
        const dtSec = dt / 60;
        
        if (this.graceTimer > 0) {
            this.graceTimer -= dtSec;
        }

        if (this.state === 'exploding') {
            // Only update camera shake and explosion particles during explosion
            this.updateCamera();
            this.updateExplosionParticles(dtSec);
            return;
        }
        
        this.player.update(dt);
        this.platformManager.update(dt, gameApp.camera.position.y);
        
        // Magnet effect: slowly pull player toward nearest platform horizontally if falling
        if (this.player.hasMagnet && this.player.velocity.y < 0 && !this.player.isRocketing) {
            let closestPlat = null;
            let closestDist = 9999;
            for (const p of this.platformManager.platforms) {
                if (p.isBroken || p.type === 'spike') continue;
                if (p.position.y < this.player.position.y) {
                    const dist = Math.abs(this.player.position.x - p.position.x);
                    if (dist < closestDist) {
                        closestDist = dist;
                        closestPlat = p;
                    }
                }
            }
            if (closestPlat && closestDist < 200) {
                // Pull horizontally
                const pullDir = Math.sign(closestPlat.position.x - this.player.position.x);
                this.player.velocity.x += pullDir * 80 * dtSec;
            }
        }

        // Apply wind gust effects
        if (this.platformManager.windGusts) {
            for (const wind of this.platformManager.windGusts) {
                if (wind.isPlayerInside(this.player.position.x, this.player.position.y)) {
                    this.player.position.x += wind.getWindPush() * dtSec * 60; // scale force by frame
                }
            }
        }

        // Update landing VFX and Confetti
        this.landingVFX.update(dtSec);
        this.confettiVFX.update(dtSec);
        
        this.checkCollisions();
        this.updateCamera();
        
        // Calculate dynamic score based on vertical position
        let maxIndexBelow = 1; // 1 is the starting pedestal
        for (const p of this.platformManager.platforms) {
            if (p.position.y <= this.player.position.y) {
                if (p.platformIndex > maxIndexBelow) {
                    maxIndexBelow = p.platformIndex;
                }
            }
        }
        
        // Score is the index minus 1 (so pedestal = 0, first jump = 1)
        const newScore = Math.max(0, maxIndexBelow - 1);
        
        if (newScore > this.score) {
            this.score = newScore;
            this.updateScore();
            
            // Check Milestones
            this.checkMilestones(this.score);

            // Increase difficulty if we reached a new multiple of 10 going UP
            if (this.score > this.highestScore) {
                if (Math.floor(this.score / 10) > Math.floor(this.highestScore / 10)) {
                    this.platformManager.increaseDifficulty();
                }
                this.highestScore = this.score;
            }
        }
        
        // Check game over (falling below screen)
        const screenBottom = gameApp.camera.position.y - gameApp.screenBounds.height / 2;
        if (this.graceTimer <= 0 && this.player.position.y < screenBottom - 50) {
            this.handleGameOver();
        }
    }

    checkMilestones(score) {
        const milestones = [
            { score: 50, msg: "Khởi đầu tốt!", emoji: "🌟" },
            { score: 100, msg: "Nhảy giỏi đấy!", emoji: "🔥" },
            { score: 150, msg: "Nửa đường rồi!", emoji: "💪" },
            { score: 200, msg: "Incredible!", emoji: "🏆" },
            { score: 250, msg: "Legendary!", emoji: "👑" },
        ];

        let targetMilestone = null;

        // Check exact match in array
        for (const m of milestones) {
            if (score === m.score) {
                targetMilestone = m;
                break;
            }
        }
        // 300+ case (every 50 points)
        else if (score >= 300 && score % 50 === 0) {
            targetMilestone = { score: score, msg: "Unstoppable!", emoji: "⚡" };
        }

        if (targetMilestone && this.milestoneReached !== targetMilestone.score) {
            this.milestoneReached = targetMilestone.score;
            this.showMilestone(targetMilestone.msg, targetMilestone.emoji);
            if (window.winkGame) window.winkGame.triggerReward(); // Call generic reward function
            this.spawnFireworks();
        }
    }

    showMilestone(msg, emoji) {
        this.milestoneText.innerText = msg;
        this.milestoneEmoji.innerText = emoji;
        
        AudioManager.playMilestoneSFX();
        
        // Confetti at center of screen
        const centerPos = new THREE.Vector3(gameApp.GAME_WIDTH / 2, gameApp.camera.position.y, 0);
        this.confettiVFX.play(centerPos, 1.5);
        
        // Animate popup
        gsap.killTweensOf(this.milestoneContainer);
        gsap.fromTo(this.milestoneContainer, 
            { scale: 0, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.5, ease: "elastic.out(1, 0.5)" }
        );
        
        // Hide after 2 seconds
        gsap.to(this.milestoneContainer, {
            scale: 0, opacity: 0, duration: 0.3, delay: 2.5, ease: "back.in(2)"
        });
    }

    spawnFireworks() {
        if (!this.explosionParticles) this.explosionParticles = [];
        const colors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xFF00FF, 0x00FFFF, 0xFFFFFF];
        
        // Spawn 3 bursts of fireworks
        for (let burst = 0; burst < 3; burst++) {
            const burstX = this.player.position.x + (Math.random() - 0.5) * 200;
            const burstY = this.player.position.y + 100 + Math.random() * 150;
            
            for (let i = 0; i < 40; i++) {
                const size = 2 + Math.random() * 6;
                const geom = new THREE.SphereGeometry(size, 4, 4);
                const mat = new THREE.MeshBasicMaterial({
                    color: colors[Math.floor(Math.random() * colors.length)],
                    transparent: true,
                    opacity: 1
                });
                
                const particle = new THREE.Mesh(geom, mat);
                particle.position.set(burstX, burstY, 30 + Math.random() * 50);
                
                const angle = Math.random() * Math.PI * 2;
                const speed = 100 + Math.random() * 200;
                particle.userData = {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    vz: (Math.random() - 0.5) * 100,
                    life: 1.0 + Math.random() * 0.5
                };
                
                this.add(particle);
                this.explosionParticles.push(particle);
            }
        }
    }

    checkCollisions() {
        const px = this.player.position.x;
        const pyBottom = this.player.position.y - this.player.radius; // bottom of player
        const pyTop = this.player.position.y + this.player.radius; // top of player
        
        const screenBottom = gameApp.camera.position.y - gameApp.screenBounds.height / 2;
        
        // BOOSTER COLLISIONS
        if (this.platformManager.boosters) {
            for (const booster of this.platformManager.boosters) {
                if (booster.isCollected) continue;
                
                const dist = Math.hypot(px - booster.position.x, this.player.position.y - booster.position.y);
                if (dist < this.player.radius + booster.radius) {
                    if (booster.collect()) {
                        switch (booster.boosterType) {
                            case 'rocket': this.player.activateRocket(); break;
                            case 'shield': this.player.activateShield(); break;
                            case 'magnet': this.player.activateMagnet(); break;
                            case 'slowmo': this.player.activateSlowMo(); break;
                        }
                    }
                }
            }
        }

        // Ignore platform/obstacle collisions while rocketing up
        if (this.player.isRocketing) return;

        // PLATFORM COLLISIONS
        for (const p of this.platformManager.platforms) {
            if (p.isBroken) continue;
            
            const pTop = p.position.y + p.platformHeight / 2;
            const pBottom = p.position.y - p.platformHeight / 2;
            
            // Ignore platforms that have fallen off screen
            if (pTop < screenBottom) continue;
            
            // Check horizontal range
            if (Math.abs(px - p.position.x) < p.platformWidth / 2 + this.player.radius * 0.5) {
                
                // Falling down -> land on top. Increased tolerance to 25px
                if (this.player.velocity.y <= 0 && Math.abs(pyBottom - pTop) < 25) {
                    
                    // Hit spike platform?
                    if (p.type === 'spike') {
                        if (!this.player.hasShield) {
                            this.triggerDeathSequence(p.position);
                            return; // Stop checking
                        } else {
                            // Break spike if we have shield, but still bounce slightly
                            p.type = 'fragile'; // temporarily change type to break it
                            p.break();
                            this.player.jump();
                        }
                    } else {
                        // Normal platform land
                        this.player.position.y = pTop + this.player.radius; // snap to top
                        
                        let hitSpring = false;
                        if (p.hasSpring && p.springMesh) {
                            const springWorldX = p.position.x + p.springMesh.position.x;
                            // The spring is narrow, require player to land somewhat on it
                            if (Math.abs(px - springWorldX) < 25) { 
                                hitSpring = true;
                            }
                        }
                        
                        // Trigger landing VFX
                        const vfxColor = hitSpring ? 0xFFCA28 : 
                            (p.type === 'moving' ? 0x40C4FF : 
                             p.type === 'fragile' ? 0xFF80AB : 0x69F0AE);
                        this.landingVFX.play(
                            new THREE.Vector3(this.player.position.x, p.position.y + p.platformHeight / 2, 0),
                            vfxColor
                        );
                        
                        // 3D Effect: Platform squish on landing
                        gsap.killTweensOf(p.scale);
                        p.scale.set(1, 0.5, 1); // Squish down
                        gsap.to(p.scale, { y: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
                        
                        // 3D Effect: Camera micro-shake
                        this.triggerCameraShake(hitSpring ? 4 : 2);
                        
                        if (hitSpring) {
                            this.player.superJump();
                            gsap.to(p.springMesh.scale, {y: 0.2, duration: 0.1, yoyo: true, repeat: 1});
                        } else {
                            this.player.jump();
                        }
                        
                        if (!p.hasBeenLandedOn) {
                            p.hasBeenLandedOn = true;
                        }

                        if (p.type === 'fragile') {
                            p.break();
                        }
                        break;
                    }
                }
            }
        }
        
        // ENEMY COLLISIONS
        if (this.platformManager.enemies) {
            for (const enemy of this.platformManager.enemies) {
                if (enemy.isDead) continue;
                
                const dist = Math.hypot(px - enemy.position.x, pyBottom - enemy.position.y);
                // Reduce hitbox slightly to be fair
                if (dist < this.player.radius + enemy.radius * 0.8) {
                    if (this.player.hasShield) {
                        // Kill enemy, keep playing
                        this.spawnExplosion(enemy.position.clone());
                        enemy.isDead = true;
                        enemy.visible = false;
                        AudioManager.playSawBladeSFX(); // Reusing saw sound for enemy kill
                        this.triggerCameraShake(5);
                    } else {
                        // Die
                        this.triggerDeathSequence(enemy.position);
                        enemy.isDead = true;
                        enemy.visible = false;
                        return;
                    }
                }
            }
        }

        // SAW BLADE COLLISIONS
        if (this.platformManager.sawBlades) {
            for (const saw of this.platformManager.sawBlades) {
                const dist = Math.hypot(px - saw.position.x, this.player.position.y - saw.position.y);
                if (dist < this.player.radius + saw.radius * 0.8) {
                    if (this.player.hasShield) {
                        // Can't kill saw blade, just ignore with shield
                    } else {
                        AudioManager.playSawBladeSFX();
                        this.triggerDeathSequence(saw.position);
                        return;
                    }
                }
            }
        }
    }

    triggerDeathSequence(impactPos) {
        if (this.graceTimer > 0) return; // Cannot die in grace period

        this.state = 'exploding'; // Prevent further updates
        
        // Strong camera shake
        this.triggerCameraShake(12);
        
        // Spawn explosion particles
        this.spawnExplosion(impactPos.clone());
        
        // Play hit animation
        this.player.playHitAnim();
        
        // Animate player flying toward camera then slamming into screen
        const camY = gameApp.camera.position.y;
        const camX = gameApp.camera.position.x;
        
        // Account for the model's pivot being at the feet. When scaled to 7x, 
        // the body is way above the center. Shift the target Y down so the body is centered.
        const targetY = camY - 150; 
        
        const tl = gsap.timeline();
        
        // Phase 1: Knocked back by explosion (0.2s)
        tl.to(this.player.position, {
            y: this.player.position.y + 60,
            z: this.player.position.z - 30,
            duration: 0.2,
            ease: "power2.out"
        }, 0);
        tl.to(this.player.rotation, {
            x: -0.3,
            duration: 0.2,
            ease: "power2.out"
        }, 0);
        
        // Phase 2: Fly straight toward camera with pose (0.5s)
        tl.to(this.player.position, {
            x: camX,
            y: targetY,
            z: 600,
            duration: 0.5,
            ease: "power3.in"
        });
        tl.to(this.player.scale, {
            x: 5, y: 5, z: 5,
            duration: 0.5,
            ease: "power3.in"
        }, "<");
        tl.to(this.player.rotation, {
            x: 0.15,
            duration: 0.5,
            ease: "power2.inOut"
        }, "<");
        
        // Phase 3: SLAM into screen (0.1s)
        tl.to(this.player.scale, {
            x: 7, y: 7, z: 0.2,
            duration: 0.1,
            ease: "power4.out"
        });
        tl.to(this.player.position, {
            z: 700,
            duration: 0.1,
            ease: "power4.out",
            onStart: () => {
                this.triggerCameraShake(20);
            }
        }, "<");
        tl.to(this.player.rotation, {
            x: 0,
            duration: 0.1,
            ease: "power4.out"
        }, "<");
        
        // Phase 4: Stick to screen (0.6s) then game over
        tl.to({}, {
            duration: 0.6,
            onComplete: () => {
                this.player.visible = false;
                this.player.scale.set(1, 1, 1);
                this.player.rotation.set(0, 0, 0);
                this.player.position.z = 30;
                this.handleGameOver();
            }
        });
    }

    updateCamera() {
        // Freeze camera movement during explosion so player can center perfectly
        if (this.state !== 'exploding') {
            // We want camera to move UP when player goes UP.
            const targetY = this.player.position.y + gameApp.screenBounds.height * 0.1; 
            
            if (targetY > gameApp.camera.position.y) {
                gameApp.camera.position.y = targetY;
                
                // Move light with camera
                if (gameApp.dirLight) {
                    gameApp.dirLight.position.y = targetY + 500;
                    gameApp.dirLight.target.position.y = targetY;
                    gameApp.dirLight.target.updateMatrixWorld();
                }
            }
        }
        
        // Apply camera shake offset
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= 0.85; // Decay
            if (this.shakeIntensity < 0.1) this.shakeIntensity = 0;
            gameApp.camera.position.x = gameApp.GAME_WIDTH / 2 + (Math.random() - 0.5) * this.shakeIntensity;
        } else {
            gameApp.camera.position.x = gameApp.GAME_WIDTH / 2;
        }
    }

    triggerCameraShake(intensity = 3) {
        this.shakeIntensity = intensity;
    }

    updateScore() {
        this.scoreElement.innerText = `${this.score}`;
    }

    openSettings() {
        if (this.state !== 'playing') return;
        this.state = 'paused';
        gameApp.ticker.remove(this.tickerFunc);
        this.player.isDragging = false; // Reset drag state
        
        const modal = new SettingsModal(
            () => { // onResume
                this.state = 'playing';
                gameApp.ticker.add(this.tickerFunc);
            },
            () => { // onQuit
                this.cleanup();
                const menu = new MainMenu();
                menu.show();
            },
            () => { // onReplay
                this.cleanup();
                const scene = new GameScene();
                gameApp.stage.add(scene);
                scene.start();
            }
        );
        modal.show();
    }

    spawnExplosion(position) {
        this.explosionParticles = [];
        const colors = [0xFF4444, 0xFF8800, 0xFFCC00, 0xFFFFFF, 0xFF6600];
        
        for (let i = 0; i < 20; i++) {
            const size = 3 + Math.random() * 6;
            const geom = new THREE.SphereGeometry(size, 4, 4);
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true,
                opacity: 1
            });
            const p = new THREE.Mesh(geom, mat);
            p.position.copy(position);
            
            const angle = Math.random() * Math.PI * 2;
            const upAngle = Math.random() * Math.PI * 0.5;
            const speed = 100 + Math.random() * 150;
            p.userData.vx = Math.cos(angle) * speed;
            p.userData.vy = Math.sin(upAngle) * speed + 50;
            p.userData.vz = Math.sin(angle) * speed * 0.5;
            p.userData.rotSpeed = (Math.random() - 0.5) * 10;
            
            this.add(p);
            this.explosionParticles.push(p);
        }
        this.explosionTimer = 0;
    }

    updateExplosionParticles(dtSec) {
        if (!this.explosionParticles || this.explosionParticles.length === 0) return;
        
        this.explosionTimer += dtSec;
        
        for (const p of this.explosionParticles) {
            p.userData.vy -= 200 * dtSec;
            p.position.x += p.userData.vx * dtSec;
            p.position.y += p.userData.vy * dtSec;
            p.position.z += p.userData.vz * dtSec;
            p.rotation.x += p.userData.rotSpeed * dtSec;
            
            const fade = Math.max(0, 1 - this.explosionTimer / 0.8);
            p.material.opacity = fade;
            const s = 1 - this.explosionTimer * 0.5;
            p.scale.set(Math.max(0.1, s), Math.max(0.1, s), Math.max(0.1, s));
        }
        
        if (this.explosionTimer > 1) {
            for (const p of this.explosionParticles) {
                this.remove(p);
                p.geometry.dispose();
                p.material.dispose();
            }
            this.explosionParticles = [];
        }
    }

    handleGameOver() {
        this.state = 'gameover';
        gameApp.ticker.remove(this.tickerFunc);
        this.scoreElement.style.display = 'none';
        this.settingsBtn.style.display = 'none';
        
        if (this.hasRevived) {
            this.showFinalGameOver();
            return;
        }
        
        UIBuilder.showReviveOffer(
            () => {
                this.hasRevived = true;
                this.revive();
            },
            () => {
                this.showFinalGameOver();
            }
        );
    }

    revive() {
        this.state = 'playing';
        this.scoreElement.style.display = 'block';
        this.settingsBtn.style.display = 'flex';
        this.graceTimer = 1.5; // New grace period
        
        // Get current screen bounds for camera
        const cy = gameApp.camera.position.y;
        const sh = gameApp.screenBounds.height;
        
        // Start regenerating platforms slightly below the camera
        const startY = cy - sh * 0.4;
        this.platformManager.revivePlatforms(startY);
        
        this.player.reset(); // Also resets boosters
        this.player.position.x = this.platformManager.platforms[0].position.x;
        this.player.position.y = this.platformManager.platforms[0].position.y + 50;
        
        // Sync the index so they don't get free points for the gap
        this.highestPlatformIndex = this.platformManager.platforms[0].platformIndex;
        
        gameApp.ticker.add(this.tickerFunc);
        this.player.jump();
    }

    showFinalGameOver() {
        // ── Wink: complete round + submit score ──
        if (this._winkRound) {
            winkGame.completeRound(this._winkRound, {
                metadata: { outcome: 'game_over', score: this.score },
            });
            if (winkGame.canSubmitScore) {
                winkGame.submitFinalScore({
                    score: this.score,
                    playTime: Math.round((Date.now() - this._winkRound.startedAtMs) / 1000),
                    gameMode: 'classic',
                }).catch(() => {});
            }
        }

        const overlay = document.createElement('div');
        overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;pointer-events:auto;";
        
        const card = document.createElement('div');
        card.style.cssText = "background:#fbfaf5;border:6px solid #4FC3F7;border-radius:24px;padding:30px;text-align:center;width:300px;box-shadow:0 15px 30px rgba(0,0,0,0.5);";
        
        const title = document.createElement('h2');
        title.innerText = "GAME OVER";
        title.style.cssText = "color:#ffffff; font-family:'Lilita One', cursive; margin-top:0; margin-bottom:5px; font-size: 36px; -webkit-text-stroke: 1.5px #0277BD; text-shadow: 0 4px 0 #0277BD, 0 6px 10px rgba(0,0,0,0.2); letter-spacing: 2px;";

        const scoreText = document.createElement('p');
        scoreText.innerText = `${this.score}`;
        scoreText.style.cssText = "font-size:64px; color:#ffffff; font-family:'Lilita One', cursive; margin: 10px 0 25px 0; -webkit-text-stroke: 2px #F50057; text-shadow: 0 6px 0 #F50057, 0 8px 15px rgba(0,0,0,0.4); letter-spacing: 2px;";

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = "display:flex; justify-content:center; gap:15px; margin-top:10px;";

        const createNavBtn = (iconSvg, onClick, colorTop, colorBot, colorShadow) => {
            const btn = document.createElement("button");
            btn.style.cssText = `
                width: 64px; height: 64px; 
                border-radius: 50%; 
                border: 3px solid #fff; 
                background: linear-gradient(to bottom, ${colorTop}, ${colorBot}); 
                box-shadow: 0 4px 0 ${colorShadow}, 0 6px 10px rgba(0,0,0,0.2); 
                cursor: pointer; transition: transform 0.1s; 
                display: flex; justify-content: center; align-items: center; padding: 0;
                pointer-events: auto;
            `;
            btn.innerHTML = iconSvg;
            btn.onclick = () => {
                AudioManager.playClickSFX();
                onClick();
            };
            btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(4px)";
            btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
            btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
            
            btn.addEventListener('touchstart', () => btn.style.transform = "scale(0.9) translateY(4px)", {passive: true});
            btn.addEventListener('touchend', () => btn.style.transform = "scale(1) translateY(0)", {passive: true});
            return btn;
        };

        const svgs = {
            'home': '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
            'replay': '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="#ffffff" d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>',
            'ad': '<div style="font-family:\'Lilita One\', cursive; font-size:28px; color:#ffffff; padding-top:2px;">x2</div>'
        };

        const homeBtn = createNavBtn(svgs['home'], () => {
            overlay.remove();
            this.cleanup();
            const menu = new MainMenu();
            menu.show();
        }, '#4FC3F7', '#039BE5', '#0277BD');

        const replayBtn = createNavBtn(svgs['replay'], () => {
            overlay.remove();
            this.cleanup();
            const scene = new GameScene();
            gameApp.stage.add(scene);
            scene.start();
        }, '#FFF176', '#FBC02D', '#F57F17');

        const doubleBtn = createNavBtn(svgs['ad'], async () => {
            doubleBtn.disabled = true;
            doubleBtn.style.opacity = '0.5';
            const success = await AdManager.showRewardedVideo();
            if (success) {
                this.score *= 2;
                scoreText.innerText = `${this.score}`;
                doubleBtn.style.display = 'none';
            } else {
                doubleBtn.disabled = false;
                doubleBtn.style.opacity = '1';
            }
        }, '#FF7043', '#F4511E', '#D84315');

        btnContainer.appendChild(homeBtn);
        btnContainer.appendChild(replayBtn);
        btnContainer.appendChild(doubleBtn);
        
        card.appendChild(title);
        card.appendChild(scoreText);
        card.appendChild(btnContainer);
        overlay.appendChild(card);
        
        UIBuilder.getUILayer().appendChild(overlay);
    }

    cleanup() {
        window.removeEventListener('pointerdown', this.pointerDownHandler);
        window.removeEventListener('pointermove', this.pointerMoveHandler);
        window.removeEventListener('pointerup', this.pointerUpHandler);
        gameApp.ticker.remove(this.tickerFunc);
        
        if (this.scoreElement && this.scoreElement.parentNode) {
            this.scoreElement.parentNode.removeChild(this.scoreElement);
        }
        if (this.settingsBtn && this.settingsBtn.parentNode) {
            this.settingsBtn.parentNode.removeChild(this.settingsBtn);
        }
        if (this.milestoneContainer && this.milestoneContainer.parentNode) {
            this.milestoneContainer.parentNode.removeChild(this.milestoneContainer);
        }
        
        gameApp.stage.remove(this);
        
        // Clean up memory
        this.platformManager.reset();
        this.player.reset();
    }
}
