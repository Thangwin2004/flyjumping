import { UIBuilder } from './UIBuilder';
import { AudioManager } from '../managers/AudioManager';
import { GameScene } from '../scenes/GameScene';
import { gameApp } from '../core/Application';
import { LeaderboardModal } from './LeaderboardModal';
import { SettingsModal } from './SettingsModal';

export class MainMenu {
    constructor() {
        this.container = document.createElement('div');
        this.container.className = "ui-layer ui-button"; // to catch events if needed
        this.container.style.display = "flex";
        this.container.style.flexDirection = "column";
        this.container.style.alignItems = "center";
        this.container.style.justifyContent = "center";
        this.container.style.background = "transparent";
        this.container.style.position = "absolute";
        this.container.style.width = "100%";
        this.container.style.height = "100%";
    }

    show() {
        UIBuilder.clearUI();
        this.container.innerHTML = ''; // clear

        // Title
        const title = document.createElement('h1');
        title.innerHTML = "RỒNG BÉO<br>TẬP BAY";
        title.style.cssText = `
            font-family: 'Lilita One', 'Inter', sans-serif;
            font-size: 60px;
            font-weight: 900;
            color: #FF4081; 
            text-align: center;
            -webkit-text-stroke: 2.5px #FFFFFF;
            filter: drop-shadow(0px 6px 0px #C2185B) drop-shadow(0px 8px 12px rgba(0,0,0,0.35));
            margin-top: -40px;
            margin-bottom: 50px;
            line-height: 1.15;
            letter-spacing: 2px;
        `;
        this.container.appendChild(title);

        const createNavBtn = (iconSvg, size, onClick, colorTop, colorBot, colorShadow) => {
            const btn = document.createElement("button");
            btn.className = "ui-button";
            btn.style.cssText = `
                width: ${size}px; height: ${size}px; 
                border-radius: 50%; 
                border: 4px solid #ffffff; 
                background: linear-gradient(to bottom, ${colorTop}, ${colorBot}); 
                box-shadow: 0 5px 0 ${colorShadow}, 0 8px 15px rgba(0,0,0,0.3); 
                cursor: pointer; transition: transform 0.1s; 
                display: flex; justify-content: center; align-items: center; padding: 0;
                outline: none; -webkit-tap-highlight-color: transparent;
                background-clip: padding-box; box-sizing: border-box;
                overflow: hidden; flex-shrink: 0;
            `;
            btn.innerHTML = iconSvg;
            btn.onclick = () => {
                AudioManager.playClickSFX();
                onClick();
            };
            btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(4px)";
            btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
            btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
            return btn;
        };

        // Big Play Button (Orange Palette)
        const playSvg = '<svg viewBox="0 0 24 24" width="46" height="46"><path fill="#ffffff" d="M8 5v14l11-7z"/></svg>';
        const playBtn = createNavBtn(playSvg, 96, () => {
            AudioManager.playBGM();
            this.startGame();
        }, "#FF7043", "#F4511E", "#D84315");
        playBtn.style.marginBottom = "30px";
        
        // Secondary Buttons Container
        const subContainer = document.createElement('div');
        subContainer.style.cssText = "display:flex; gap:25px;";

        // Leaderboard Button (Yellow Palette)
        const lbSvg = '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="#ffffff" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/></svg>';
        const lbBtn = createNavBtn(lbSvg, 64, () => {
            this.showLeaderboard();
        }, "#FFF176", "#FBC02D", "#F57F17");
        
        // Settings Button (Blue Palette)
        const settingsSvg = '<svg viewBox="0 0 24 24" width="34" height="34"><path fill="#ffffff" d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.06-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.06.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.49-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>';
        const settingsBtn = createNavBtn(settingsSvg, 64, () => {
            const modal = new SettingsModal();
            modal.show();
        }, "#4FC3F7", "#039BE5", "#0277BD");

        subContainer.appendChild(lbBtn);
        subContainer.appendChild(settingsBtn);

        this.container.appendChild(playBtn);
        this.container.appendChild(subContainer);

        UIBuilder.getUILayer().appendChild(this.container);
    }

    startGame() {
        UIBuilder.clearUI();
        
        // Start Game Scene
        const scene = new GameScene();
        gameApp.stage.add(scene);
        scene.start();
    }

    showLeaderboard() {
        const lb = new LeaderboardModal();
        lb.show();
    }
}
