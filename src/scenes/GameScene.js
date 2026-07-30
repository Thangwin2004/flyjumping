import * as THREE from 'three';
import { Player } from '../entities/Player';
import { PlatformManager } from '../entities/PlatformManager';
import { gameApp } from '../core/Application';
import { UIBuilder } from '../ui/UIBuilder';
import { MainMenu } from '../ui/MainMenu';
import { AdManager } from '../managers/AdManager';
import { SettingsModal } from '../ui/SettingsModal';
import { LandingVFX } from '../effects/LandingVFX';

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
        
        // UI layer (HTML instead of Pixi)
        this.scoreElement = document.createElement('div');
        this.scoreElement.style.cssText = "position:absolute;top:20px;left:30px;font-family:'Lilita One', cursive;font-size:58px;color:#ffffff;-webkit-text-stroke:2px #F50057;text-shadow:0 6px 0 #F50057, 0 8px 15px rgba(0,0,0,0.4);z-index:100;pointer-events:none; letter-spacing: 2px;";
        this.scoreElement.innerText = "0";
        document.getElementById('game-container').appendChild(this.scoreElement);
        
        // Settings Button (In-game)
        this.settingsBtn = document.createElement('div');
        this.settingsBtn.style.cssText = "position:absolute;top:20px;right:20px;width:44px;height:44px;background:#00ACC1;border:3px solid #fff;border-radius:50%;box-shadow:0 4px 0 #00838F, 0 4px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;cursor:pointer;z-index:100;font-size:24px;transition:transform 0.1s;";
        this.settingsBtn.innerHTML = "⚙️";
        this.settingsBtn.onmousedown = () => this.settingsBtn.style.transform = "translateY(4px)";
        this.settingsBtn.onmouseup = () => this.settingsBtn.style.transform = "translateY(0)";
        this.settingsBtn.onclick = () => this.openSettings();
        document.getElementById('game-container').appendChild(this.settingsBtn);
        
        this.score = 0;
        this.state = 'playing'; // playing, gameover
        
        this.bindInput();
        this.tickerFunc = this.update.bind(this);
    }

    start() {
        this.state = 'playing';
        this.score = 0;
        this.highestScore = 0;
        this.highestPlatformIndex = 0;
        this.hasRevived = false;
        this.updateScore();
        this.scoreElement.style.display = 'block';
        this.settingsBtn.style.display = 'flex';
        
        this.platformManager.reset();
        this.player.reset();
        
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
            if (e.target === this.settingsBtn) return;
            
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
        
        if (this.state === 'exploding') {
            // Only update camera shake and explosion particles during explosion
            this.updateCamera();
            this.updateExplosionParticles(dt / 60);
            return;
        }
        
        this.player.update(dt);
        this.platformManager.update(dt, gameApp.camera.position.y);
        
        // Update landing VFX
        this.landingVFX.update(dt / 60); // convert deltaTime to seconds
        
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
        
        if (newScore !== this.score) {
            const oldScore = this.score;
            this.score = newScore;
            this.updateScore();
            
            // Increase difficulty if we reached a new multiple of 10 going UP
            if (this.score > this.highestScore) {
                if (Math.floor(this.score / 10) > Math.floor(this.highestScore / 10)) {
                    this.platformManager.increaseDifficulty();
                }
                this.highestScore = this.score;
            }
        }
        
        // Check game over
        const screenBottom = gameApp.camera.position.y - gameApp.screenBounds.height / 2;
        if (this.player.position.y < screenBottom - 50) {
            this.handleGameOver();
        }
    }

    checkCollisions() {
        const px = this.player.position.x;
        const pyBottom = this.player.position.y - this.player.radius; // bottom of player
        const pyTop = this.player.position.y + this.player.radius; // top of player
        
        const screenBottom = gameApp.camera.position.y - gameApp.screenBounds.height / 2;
        
        for (const p of this.platformManager.platforms) {
            if (p.isBroken) continue;
            
            const pTop = p.position.y + p.platformHeight / 2;
            const pBottom = p.position.y - p.platformHeight / 2;
            
            // Ignore platforms that have fallen off screen
            if (pTop < screenBottom) continue;
            
            // Check horizontal range
            if (Math.abs(px - p.position.x) < p.platformWidth / 2 + this.player.radius * 0.5) {
                
                // Falling down -> land on top
                if (this.player.velocity.y <= 0 && Math.abs(pyBottom - pTop) < 15) {
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
                    import('gsap').then(({ default: gsap }) => {
                        gsap.killTweensOf(p.scale);
                        p.scale.set(1, 0.5, 1); // Squish down
                        gsap.to(p.scale, { y: 1, duration: 0.3, ease: "elastic.out(1, 0.4)" });
                    });
                    
                    // 3D Effect: Camera micro-shake
                    this.triggerCameraShake(hitSpring ? 4 : 2);
                    
                    if (hitSpring) {
                        this.player.superJump();
                        import('gsap').then(gsap => {
                            gsap.default.to(p.springMesh.scale, {y: 0.2, duration: 0.1, yoyo: true, repeat: 1});
                        });
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
        
        // Check enemies
        if (this.platformManager.enemies) {
            for (const enemy of this.platformManager.enemies) {
                if (enemy.isDead) continue;
                
                const dist = Math.hypot(px - enemy.position.x, pyBottom - enemy.position.y);
                // Reduce hitbox slightly to be fair
                if (dist < this.player.radius + enemy.radius * 0.8) {
                    // Hit enemy -> Explosion + fly toward camera!
                    this.state = 'exploding'; // Prevent further updates
                    
                    // Strong camera shake
                    this.triggerCameraShake(12);
                    
                    // Spawn explosion particles at enemy position
                    this.spawnExplosion(enemy.position.clone());
                    
                    // Hide the enemy
                    enemy.isDead = true;
                    enemy.visible = false;
                    
                    // Play hit animation (Female Dance Pose)
                    this.player.playHitAnim();
                    
                    // Animate player flying toward camera then slamming into screen
                    const camY = gameApp.camera.position.y;
                    const camX = gameApp.camera.position.x;
                    
                    import('gsap').then(({ default: gsap }) => {
                        const tl = gsap.timeline();
                        
                        // Phase 1: Knocked back by explosion (0.2s) - tilt backward like being kicked
                        tl.to(this.player.position, {
                            y: this.player.position.y + 60, // Pop up from impact
                            z: this.player.position.z - 30, // Knocked backward slightly
                            duration: 0.2,
                            ease: "power2.out"
                        }, 0);
                        tl.to(this.player.rotation, {
                            x: -0.3, // Lean backward as if kicked
                            duration: 0.2,
                            ease: "power2.out"
                        }, 0);
                        
                        // Phase 2: Fly straight toward camera with pose (0.5s)
                        tl.to(this.player.position, {
                            x: camX,
                            y: camY,
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
                            x: 0.15, // Slight forward lean like flying face-first
                            duration: 0.5,
                            ease: "power2.inOut"
                        }, "<");
                        
                        // Phase 3: SLAM into screen (0.1s)
                        tl.to(this.player.scale, {
                            x: 7, y: 7, z: 0.2, // Squished flat against screen
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
                            x: 0, // Flatten rotation on impact
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
                    });
                    return;
                }
            }
        }
    }

    updateCamera() {
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
                import('../ui/MainMenu').then(({ MainMenu }) => {
                    const menu = new MainMenu();
                    menu.show();
                });
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
        
        // Get current screen bounds for camera
        const cx = gameApp.camera.position.x;
        const cy = gameApp.camera.position.y;
        const sh = gameApp.screenBounds.height;
        
        // Start regenerating platforms slightly below the camera
        const startY = cy - sh * 0.4;
        this.platformManager.revivePlatforms(startY);
        
        this.player.velocity.set(0, 0, 0);
        this.player.position.x = this.platformManager.platforms[0].position.x;
        this.player.position.y = this.platformManager.platforms[0].position.y + 50;
        
        // Sync the index so they don't get free points for the gap
        this.highestPlatformIndex = this.platformManager.platforms[0].platformIndex;
        
        gameApp.ticker.add(this.tickerFunc);
        this.player.jump();
    }

    showFinalGameOver() {
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;flex-direction:column;align-items:center;justify-content:center;z-index:9999;pointer-events:auto;";
        
        const card = document.createElement('div');
        card.style.cssText = "background:#fbfaf5;border:6px solid #4FC3F7;border-radius:24px;padding:30px;text-align:center;width:300px;box-shadow:0 15px 30px rgba(0,0,0,0.5);";
        
        // Animated trophy
        const trophy = document.createElement('div');
        trophy.innerText = "🏆";
        trophy.style.cssText = "font-size:80px;margin-bottom:10px;text-shadow:0 10px 20px rgba(0,0,0,0.3); filter: drop-shadow(0 0 20px rgba(255, 215, 0, 0.8));";
        trophy.animate([
            { transform: "scale(1)" }, { transform: "scale(1.1) rotate(5deg)" }, { transform: "scale(1)" }, { transform: "scale(1.1) rotate(-5deg)" }, { transform: "scale(1)" }
        ], { duration: 2000, iterations: Infinity, easing: "ease-in-out" });

        const title = document.createElement('h2');
        title.innerText = "KẾT THÚC";
        title.style.cssText = "color:#ffffff; font-family:'Inter', sans-serif; margin-top:0; margin-bottom:5px; font-size: 32px; -webkit-text-stroke: 1.5px #0277BD; text-shadow: 0 4px 0 #0277BD, 0 6px 10px rgba(0,0,0,0.2); letter-spacing: 2px;";

        const scoreText = document.createElement('p');
        scoreText.innerText = `${this.score}`;
        scoreText.style.cssText = "font-size:64px; font-weight:900; color:#ffffff; font-family:'Inter', sans-serif; margin: 10px 0 25px 0; -webkit-text-stroke: 2px #F50057; text-shadow: 0 6px 0 #F50057, 0 8px 15px rgba(0,0,0,0.4); letter-spacing: 2px;";

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
            btn.onclick = onClick;
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
            'ad': '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="#ffffff" d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zM10 15l5-4-5-4v8z"/></svg>'
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
        
        card.appendChild(trophy);
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
        
        gameApp.stage.remove(this);
        
        // Clean up memory
        this.platformManager.reset();
        this.player.reset();
    }
}
