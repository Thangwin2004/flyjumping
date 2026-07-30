import * as THREE from 'three';

class GameApplication {
    constructor() {
        // Logical game size for vertical screen (reference for physics)
        this.GAME_WIDTH = 540;
        this.GAME_HEIGHT = 960;
        
        this.scene = new THREE.Scene();
        this.scene.background = null;

        // Create a CSS background container with space fallback color
        this.bgContainer = document.createElement('div');
        // The container itself gets the beautiful continuous gradient
        this.bgContainer.style.cssText = `
            position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;overflow:hidden;
            background: linear-gradient(to top, 
                #A7FFEB 0%,     /* Mint green ground */
                #81D4FA 15%,    /* Light cyan low sky */
                #F48FB1 35%,    /* Pink mid sky */
                #CE93D8 55%,    /* Purple high sky */
                #311B92 75%,    /* Deep purple twilight */
                #0A002A 100%    /* Deep space */
            );
        `;

        this.bgContent = document.createElement('div');
        // Container is massive to hold all stacked layers for a very long game
        this.bgContent.style.cssText = "position:absolute;bottom:0;left:0;width:100%;height:1000%;";

        // To make it look like ONE continuous space, we apply mix-blend-mode: overlay or hard-light 
        // to the background images so they inherit the unified gradient colors underneath!
        
        // Layer 0: Village Ground
        const bg0 = document.createElement('div');
        bg0.style.cssText = "position:absolute;bottom:0;left:0;width:100%;height:12%;background:url('/assets/image/ground_bg.png') center bottom / cover no-repeat; -webkit-mask-image: linear-gradient(to top, black 80%, transparent 100%);";

        // Layer 1: Lower Sky 
        const bg1 = document.createElement('div');
        bg1.style.cssText = "position:absolute;bottom:0%;left:0;width:100%;height:25%;background:url('/assets/image/sky_bg.png') center bottom / cover no-repeat; mix-blend-mode: hard-light; opacity: 0.8; -webkit-mask-image: linear-gradient(to top, black 0%, black 70%, transparent 100%);";

        // Layer 2: Mid Sky
        const bg2 = document.createElement('div');
        bg2.style.cssText = "position:absolute;bottom:18%;left:0;width:100%;height:35%;background:url('/assets/image/sky_bg_mid.png') center bottom / cover no-repeat; mix-blend-mode: overlay; opacity: 0.9; -webkit-mask-image: linear-gradient(to top, transparent 0%, black 20%, black 80%, transparent 100%);";

        // Layer 3: Space (High Sky)
        const bg3 = document.createElement('div');
        bg3.style.cssText = "position:absolute;bottom:48%;left:0;width:100%;height:60%;background:url('/assets/image/sky_bg_high.png') center bottom / cover no-repeat; mix-blend-mode: screen; opacity: 0.7; -webkit-mask-image: linear-gradient(to top, transparent 0%, black 20%, transparent 100%);";

        // Extra Layer: CSS Stars in the top 50% for extra magic!
        const stars = document.createElement('div');
        stars.style.cssText = `
            position:absolute;top:0;left:0;width:100%;height:60%;
            background-image: 
                radial-gradient(2px 2px at 20px 30px, #ffffff, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 40px 70px, #ffffff, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 90px 10px, #ffffff, rgba(0,0,0,0)),
                radial-gradient(3px 3px at 150px 150px, #FFF59D, rgba(0,0,0,0)),
                radial-gradient(2px 2px at 250px 80px, #ffffff, rgba(0,0,0,0));
            background-repeat: repeat;
            background-size: 300px 300px;
            opacity: 0.8;
            -webkit-mask-image: linear-gradient(to bottom, black 50%, transparent 100%);
        `;

        this.bgContent.appendChild(stars);
        this.bgContent.appendChild(bg3);
        this.bgContent.appendChild(bg2);
        this.bgContent.appendChild(bg1);
        this.bgContent.appendChild(bg0);
        
        this.bgContainer.appendChild(this.bgContent);
        
        // Wait for DOM to be ready
        setTimeout(() => {
            const container = document.getElementById('game-container') || document.body;
            container.insertBefore(this.bgContainer, container.firstChild);
            
            // Ensure canvas sits above the background
            if (this.renderer && this.renderer.domElement) {
                this.renderer.domElement.style.position = 'relative';
                this.renderer.domElement.style.zIndex = '1';
            }
        }, 0);
        
        // Use PerspectiveCamera for 3D depth, perfectly centered to align with 2D bounds
        this.camera = new THREE.PerspectiveCamera(60, this.GAME_WIDTH / this.GAME_HEIGHT, 0.1, 1000);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        this.scene.add(ambientLight);
        
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
        this.scene.add(hemiLight);
        
        this.dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.dirLight.position.set(200, 500, 300);
        this.dirLight.castShadow = true;
        this.dirLight.shadow.camera.left = -300;
        this.dirLight.shadow.camera.right = 300;
        this.dirLight.shadow.camera.top = 300;
        this.dirLight.shadow.camera.bottom = -300;
        this.scene.add(this.dirLight);
        this.scene.add(this.dirLight.target);
        
        // Ticker replacement (using requestAnimationFrame)
        this.ticker = {
            callbacks: [],
            add: (fn) => this.ticker.callbacks.push(fn),
            remove: (fn) => {
                this.ticker.callbacks = this.ticker.callbacks.filter(c => c !== fn);
            },
            deltaTime: 1, // Will be updated in loop
            deltaMS: 16.6
        };
        
        this.clock = new THREE.Clock();
        this.isRunning = false;
    }

    async init() {
        const container = document.getElementById('game-container') || document.body;
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(this.renderer.domElement);
        
        window.addEventListener('resize', this.resize.bind(this));
        this.resize();
        
        this.isRunning = true;
        this.loop();
    }
    
    loop() {
        if (!this.isRunning) return;
        requestAnimationFrame(this.loop.bind(this));
        
        const dt = this.clock.getDelta();
        // Emulate pixi ticker deltaTime (1.0 = 60fps = 16.6ms)
        this.ticker.deltaMS = dt * 1000;
        this.ticker.deltaTime = this.ticker.deltaMS / 16.666;
        
        for (const cb of this.ticker.callbacks) {
            cb(this.ticker);
        }
        
        if (this.bgContent) {
            // Parallax effect: scroll the massive CSS background container downwards 
            // as the camera moves upwards. This reveals the higher sky layers.
            // Using 0.04 means it scrolls very slowly, matching the epic scale of the 1000% tall container
            this.bgContent.style.transform = `translateY(${this.camera.position.y * 0.04}px)`;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    get stage() {
        return this.scene;
    }

    resize() {
        const container = this.renderer.domElement.parentElement;
        if (!container) return;
        
        const width = container.clientWidth;
        const height = container.clientHeight;
        
        this.renderer.setSize(width, height);
        
        // We want a fixed orthographic height of GAME_HEIGHT for physics mapping
        // To do this with PerspectiveCamera, we adjust camera Z to match the frustum height
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        
        // Calculate Z so that visible height at Z=0 is GAME_HEIGHT
        const fovRad = THREE.MathUtils.degToRad(this.camera.fov);
        this.cameraZ = (this.GAME_HEIGHT / 2) / Math.tan(fovRad / 2);
        this.camera.position.z = this.cameraZ;
        
        // Center the view at (GAME_WIDTH/2, GAME_HEIGHT/2)
        this.camera.position.x = this.GAME_WIDTH / 2;
        this.camera.position.y = this.GAME_HEIGHT / 2;
        this.camera.lookAt(this.GAME_WIDTH / 2, this.GAME_HEIGHT / 2, 0);
        
        const visibleWidth = this.GAME_HEIGHT * this.camera.aspect;
        
        this.screenBounds = {
            width: visibleWidth,
            height: this.GAME_HEIGHT,
            left: (this.GAME_WIDTH - visibleWidth) / 2,
            right: (this.GAME_WIDTH + visibleWidth) / 2,
            top: 0,
            bottom: this.GAME_HEIGHT
        };
    }
}

export const gameApp = new GameApplication();
