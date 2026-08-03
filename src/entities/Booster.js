import * as THREE from 'three';

/**
 * Booster power-up that floats above a platform.
 * Types: rocket, shield, magnet, slowmo
 */
export class Booster extends THREE.Group {
    constructor(type = 'rocket') {
        super();
        this.boosterType = type;
        this.radius = 18;
        this.isCollected = false;
        this.time = Math.random() * Math.PI * 2;

        this.buildVisual();
    }

    buildVisual() {
        switch (this.boosterType) {
            case 'rocket':
                this.buildRocket();
                break;
            case 'shield':
                this.buildShield();
                break;
            case 'magnet':
                this.buildMagnet();
                break;
            case 'slowmo':
                this.buildSlowMo();
                break;
        }
    }

    buildRocket() {
        const group = new THREE.Group();

        // Body - Orange-red cylinder
        const bodyGeom = new THREE.CylinderGeometry(8, 10, 28, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xFF5722,
            roughness: 0.3,
            metalness: 0.4,
            emissive: 0xFF5722,
            emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.castShadow = true;
        group.add(body);

        // Nose cone
        const noseGeom = new THREE.ConeGeometry(8, 14, 8);
        const noseMat = new THREE.MeshStandardMaterial({
            color: 0xFFEB3B,
            roughness: 0.2,
            emissive: 0xFFEB3B,
            emissiveIntensity: 0.4
        });
        const nose = new THREE.Mesh(noseGeom, noseMat);
        nose.position.y = 21;
        nose.castShadow = true;
        group.add(nose);

        // Fins (3 fins around the base)
        const finMat = new THREE.MeshStandardMaterial({
            color: 0xF44336,
            roughness: 0.3,
            metalness: 0.5
        });
        for (let i = 0; i < 3; i++) {
            const finGeom = new THREE.BoxGeometry(2, 12, 8);
            const fin = new THREE.Mesh(finGeom, finMat);
            const angle = (i / 3) * Math.PI * 2;
            fin.position.set(Math.cos(angle) * 10, -10, Math.sin(angle) * 10);
            fin.rotation.y = -angle;
            fin.castShadow = true;
            group.add(fin);
        }

        // Exhaust glow
        const exhaustGeom = new THREE.CylinderGeometry(6, 3, 8, 8);
        const exhaustMat = new THREE.MeshBasicMaterial({
            color: 0xFF9800,
            transparent: true,
            opacity: 0.7
        });
        const exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
        exhaust.position.y = -18;
        group.add(exhaust);
        this.exhaustMesh = exhaust;

        group.scale.set(0.7, 0.7, 0.7);
        this.add(group);
        this.visual = group;
    }

    buildShield() {
        const group = new THREE.Group();

        // Outer bubble
        const bubbleGeom = new THREE.SphereGeometry(16, 16, 16);
        const bubbleMat = new THREE.MeshStandardMaterial({
            color: 0x4FC3F7,
            roughness: 0.1,
            metalness: 0.3,
            transparent: true,
            opacity: 0.5,
            emissive: 0x4FC3F7,
            emissiveIntensity: 0.3,
            side: THREE.DoubleSide
        });
        const bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
        bubble.castShadow = true;
        group.add(bubble);

        // Inner star core
        const coreGeom = new THREE.OctahedronGeometry(7, 0);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xE1F5FE,
            transparent: true,
            opacity: 0.8
        });
        const core = new THREE.Mesh(coreGeom, coreMat);
        group.add(core);
        this.coreMesh = core;

        // Shield cross pattern
        const crossMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.4
        });
        const h = new THREE.Mesh(new THREE.BoxGeometry(20, 2, 2), crossMat);
        const v = new THREE.Mesh(new THREE.BoxGeometry(2, 20, 2), crossMat);
        group.add(h);
        group.add(v);

        this.add(group);
        this.visual = group;
    }

    buildMagnet() {
        const group = new THREE.Group();

        // Horseshoe body
        const bodyGeom = new THREE.TorusGeometry(12, 4, 8, 16, Math.PI);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xF44336,
            roughness: 0.3,
            metalness: 0.6,
            emissive: 0xF44336,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.rotation.z = Math.PI; // Flip so opening is down
        body.castShadow = true;
        group.add(body);

        // Silver tips
        const tipMat = new THREE.MeshStandardMaterial({
            color: 0xBDBDBD,
            roughness: 0.2,
            metalness: 0.8
        });
        const tipGeom = new THREE.CylinderGeometry(4, 4, 6, 8);

        const leftTip = new THREE.Mesh(tipGeom, tipMat);
        leftTip.position.set(-12, -3, 0);
        leftTip.castShadow = true;
        group.add(leftTip);

        const rightTip = new THREE.Mesh(tipGeom, tipMat);
        rightTip.position.set(12, -3, 0);
        rightTip.castShadow = true;
        group.add(rightTip);

        // Magnetic field glow
        const fieldGeom = new THREE.RingGeometry(6, 14, 16);
        const fieldMat = new THREE.MeshBasicMaterial({
            color: 0x2196F3,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const field = new THREE.Mesh(fieldGeom, fieldMat);
        field.position.y = -8;
        field.rotation.x = Math.PI / 2;
        group.add(field);
        this.fieldMesh = field;

        this.add(group);
        this.visual = group;
    }

    buildSlowMo() {
        const group = new THREE.Group();

        // Hourglass outer frame
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x9C27B0,
            roughness: 0.2,
            metalness: 0.5,
            emissive: 0x9C27B0,
            emissiveIntensity: 0.3
        });

        // Top and bottom caps
        const capGeom = new THREE.CylinderGeometry(10, 10, 3, 8);
        const topCap = new THREE.Mesh(capGeom, frameMat);
        topCap.position.y = 14;
        topCap.castShadow = true;
        group.add(topCap);

        const bottomCap = new THREE.Mesh(capGeom, frameMat);
        bottomCap.position.y = -14;
        bottomCap.castShadow = true;
        group.add(bottomCap);

        // Glass body (two cones meeting in middle)
        const glassMat = new THREE.MeshStandardMaterial({
            color: 0xE1BEE7,
            roughness: 0.1,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });

        const topGlass = new THREE.Mesh(new THREE.ConeGeometry(8, 14, 8), glassMat);
        topGlass.position.y = 5.5;
        topGlass.rotation.x = Math.PI; // Flip
        group.add(topGlass);

        const botGlass = new THREE.Mesh(new THREE.ConeGeometry(8, 14, 8), glassMat);
        botGlass.position.y = -5.5;
        group.add(botGlass);

        // Sand particles (small spheres)
        const sandMat = new THREE.MeshBasicMaterial({ color: 0xFFD54F });
        for (let i = 0; i < 5; i++) {
            const sand = new THREE.Mesh(new THREE.SphereGeometry(1.5, 4, 4), sandMat);
            sand.position.set(
                (Math.random() - 0.5) * 6,
                -6 + Math.random() * 4,
                (Math.random() - 0.5) * 6
            );
            group.add(sand);
        }

        group.scale.set(0.7, 0.7, 0.7);
        this.add(group);
        this.visual = group;
    }

    collect() {
        if (this.isCollected) return false;
        this.isCollected = true;
        this.visible = false;
        return true;
    }

    update(dt) {
        if (this.isCollected) return;

        // Bobbing animation
        this.time += dt * 0.06;
        if (this.visual) {
            this.visual.position.y = Math.sin(this.time) * 6;
            this.visual.rotation.y += dt * 0.03;
        }

        // Type-specific animations
        if (this.boosterType === 'rocket' && this.exhaustMesh) {
            this.exhaustMesh.scale.y = 0.8 + Math.sin(this.time * 5) * 0.3;
            this.exhaustMesh.material.opacity = 0.5 + Math.sin(this.time * 8) * 0.3;
        }

        if (this.boosterType === 'shield' && this.coreMesh) {
            this.coreMesh.rotation.x += dt * 0.05;
            this.coreMesh.rotation.z += dt * 0.03;
        }

        if (this.boosterType === 'magnet' && this.fieldMesh) {
            this.fieldMesh.scale.set(
                1 + Math.sin(this.time * 3) * 0.2,
                1 + Math.sin(this.time * 3) * 0.2,
                1
            );
            this.fieldMesh.material.opacity = 0.2 + Math.sin(this.time * 4) * 0.15;
        }
    }
}
