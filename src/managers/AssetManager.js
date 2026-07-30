import * as THREE from 'three';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';

export const AssetManager = {
    textures: {},
    models: {},
    async init() {
        const textureLoader = new THREE.TextureLoader();
        const fbxLoader = new FBXLoader();
        
        // Define assets to load
        const textures = {
            imagesIcon: '/assets/iconbtn/images.png'
        };

        const texturePromises = Object.entries(textures).map(([key, url]) => {
            return new Promise((resolve, reject) => {
                textureLoader.load(url, 
                    (texture) => {
                        this.textures[key] = texture;
                        resolve(texture);
                    },
                    undefined,
                    (err) => reject(err)
                );
            });
        });
        
        const models = {
            player: '/models/character_long.fbx',
            jumpAnim: '/models/Jumping Up.fbx',
            hitAnim: '/models/Female Dance Pose.fbx'
        };
        
        const modelPromises = Object.entries(models).map(([key, url]) => {
            return new Promise((resolve, reject) => {
                fbxLoader.load(url,
                    (object) => {
                        this.models[key] = object;
                        resolve(object);
                    },
                    undefined,
                    (err) => reject(err)
                );
            });
        });
        
        await Promise.all([...texturePromises, ...modelPromises]);
    },
    
    getTexture(key) {
        return this.textures[key];
    },
    
    getModel(key) {
        return this.models[key] ? this.models[key] : null;
    }
};
