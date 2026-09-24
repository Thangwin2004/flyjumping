import './styles/style.css';
import { gameApp } from './core/Application';
import { AssetManager } from './managers/AssetManager';
import { AudioManager } from './managers/AudioManager';
import { MainMenu } from './ui/MainMenu';
import { winkGame } from './integrations/wink/wink-adapter.js';
import { waitForGameFonts } from './utils/fontLoader.js';
import { installFocusPause } from './utils/focusPause.js';
import { installInteractionGuard } from './utils/interactionGuard.js';

import { i18n } from './managers/I18nManager';

installInteractionGuard();

async function bootstrap() {
    console.log("Initializing Game...");

    await waitForGameFonts([
        "400 1em 'Be Vietnam Pro'",
        "500 1em 'Be Vietnam Pro'",
        "600 1em 'Be Vietnam Pro'",
        "700 1em 'Be Vietnam Pro'",
        "800 1em 'Be Vietnam Pro'",
        "900 1em 'Be Vietnam Pro'",
        "italic 700 1em 'Be Vietnam Pro'",
        "italic 800 1em 'Be Vietnam Pro'",
        "italic 900 1em 'Be Vietnam Pro'",
        "700 1em 'Baloo 2'",
        "800 1em 'Baloo 2'",
        "400 1em 'Lilita One'",
    ]);
    
    // 1. Initialize Pixi Application
    await gameApp.init();
    
    // 2. Initialize Audio
    AudioManager.init();
    
    // 3. Load Assets
    await AssetManager.init();
    
    console.log("All systems go! Ready to start Main Menu.");

    const focusPause = installFocusPause({
        isRunning: () => gameApp.isRunning,
        pause: () => gameApp.stop(),
        resume: () => gameApp.start(),
        pauseAudio: () => AudioManager.pauseForFocus(),
        resumeAudio: () => AudioManager.resumeFromFocus(),
    });
    
    // ── Wink SDK lifecycle binding ──
    winkGame.bindLifecycle({
        onPause: focusPause.pauseFromHost,
        onResume: focusPause.resumeFromHost,
        onMute: () => AudioManager.setMuted(true),
        onUnmute: () => AudioManager.setMuted(false),
        onLocale: (locale) => i18n.setLanguage(locale),
    });

    winkGame.observe((state) => {
        if (state?.locale) {
            i18n.setLanguage(state.locale);
        }
        document.documentElement.lang = i18n.language;
    });
    
    // Launch MainMenu
    const mainMenu = new MainMenu();
    mainMenu.show();
}

bootstrap();
