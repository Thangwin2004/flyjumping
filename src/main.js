import './styles/style.css';
import { gameApp } from './core/Application';
import { AssetManager } from './managers/AssetManager';
import { AudioManager } from './managers/AudioManager';
import { MainMenu } from './ui/MainMenu';

async function bootstrap() {
    console.log("Initializing Game...");
    
    // 1. Initialize Pixi Application
    await gameApp.init();
    
    // 2. Initialize Audio
    AudioManager.init();
    
    // 3. Load Assets
    await AssetManager.init();
    
    console.log("All systems go! Ready to start Main Menu.");
    
    // Launch MainMenu
    const mainMenu = new MainMenu();
    mainMenu.show();
}

bootstrap();
