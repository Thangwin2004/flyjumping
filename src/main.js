import './styles/style.css';
import { gameApp } from './core/Application';
import { AssetManager } from './managers/AssetManager';
import { AudioManager } from './managers/AudioManager';
import { MainMenu } from './ui/MainMenu';
import { winkGame } from './integrations/wink/wink-adapter.js';

async function bootstrap() {
    console.log("Initializing Game...");
    
    // 1. Initialize Pixi Application
    await gameApp.init();
    
    // 2. Initialize Audio
    AudioManager.init();
    
    // 3. Load Assets
    await AssetManager.init();
    
    console.log("All systems go! Ready to start Main Menu.");
    
    // ── Wink Bridge lifecycle binding ──
    winkGame.bindLifecycle({
        onPause: () => { if (gameApp.ticker) gameApp.ticker.stop(); },
        onResume: () => { if (gameApp.ticker) gameApp.ticker.start(); },
        onMute: () => AudioManager.setMuted(true),
        onUnmute: () => AudioManager.setMuted(false),
    });

    winkGame.observe((state) => {
        console.log('[WinkBridge] phase:', state.phase);
    });
    
    // Launch MainMenu
    const mainMenu = new MainMenu();
    mainMenu.show();
}

bootstrap();
