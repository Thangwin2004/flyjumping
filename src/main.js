import './styles/style.css';
import { gameApp } from './core/Application';
import { AssetManager } from './managers/AssetManager';
import { AudioManager } from './managers/AudioManager';
import { MainMenu } from './ui/MainMenu';
import { winkGame } from './integrations/wink/wink-adapter.js';
import { waitForGameFonts } from './utils/fontLoader.js';

async function bootstrap() {
    console.log("Initializing Game...");

    await waitForGameFonts([
        "400 1em 'Be Vietnam Pro'",
        "500 1em 'Be Vietnam Pro'",
        "600 1em 'Be Vietnam Pro'",
        "700 1em 'Be Vietnam Pro'",
        "800 1em 'Be Vietnam Pro'",
        "900 1em 'Be Vietnam Pro'",
        "700 1em 'Baloo 2'",
        "800 1em 'Baloo 2'",
    ]);
    
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
