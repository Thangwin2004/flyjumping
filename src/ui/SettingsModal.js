import { AudioManager } from '../managers/AudioManager';
import { UIBuilder } from './UIBuilder';

export class SettingsModal {
    constructor(onResume, onQuit, onReplay) {
        this.onResume = onResume;
        this.onQuit = onQuit;
        this.onReplay = onReplay;
    }

    show() {
        const overlay = document.createElement('div');
        overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;";
        
        const card = document.createElement('div');
        card.style.cssText = "background:#fbfaf5;border:8px solid #40C4FF;border-radius:24px;width:260px;max-width:90%;padding:35px 20px 30px 20px;display:flex;flex-direction:column;align-items:center;box-shadow:0 15px 30px rgba(0,0,0,0.5); text-align: center; position:relative;";
        
        const ribbon = document.createElement("div");
        ribbon.style.cssText = "position:absolute; top:-30px; background:linear-gradient(to bottom, #84FFFF, #40C4FF); border:4px solid #fff; border-radius:30px; padding:10px 30px; box-shadow:0 6px 0 #00B0FF; color:white; font-family:'Inter', sans-serif; font-size:22px; font-weight:900; letter-spacing:2px; text-shadow:0 2px 4px rgba(0,0,0,0.3); z-index:2;";
        ribbon.innerText = "CÀI ĐẶT";
        card.appendChild(ribbon);
        
        const closeIconBtn = document.createElement("button");
        closeIconBtn.style.cssText = "position:absolute; top:-15px; right:-15px; width:44px; height:44px; border-radius:50%; border:3px solid #fff; background:linear-gradient(to bottom, #FF80AB, #FF4081); color:white; font-size:20px; font-weight:bold; cursor:pointer; box-shadow:0 4px 0 #F50057; display:flex; align-items:center; justify-content:center; padding:0;";
        closeIconBtn.innerHTML = "✕";
        closeIconBtn.onclick = () => {
            if (this.onQuit) { // If in game, close just closes settings
               document.body.removeChild(overlay);
               this.onResume();
            } else {
               document.body.removeChild(overlay);
            }
        };
        closeIconBtn.onmousedown = () => closeIconBtn.style.transform = "scale(0.9) translateY(4px)";
        closeIconBtn.onmouseup = () => closeIconBtn.style.transform = "scale(1) translateY(0)";
        card.appendChild(closeIconBtn);
        
        // Add spacing for ribbon
        const spacer = document.createElement('div');
        spacer.style.height = "10px";
        card.appendChild(spacer);

        const createRoundBtn = (iconSvg, isActive, onClick, activeTop, activeBot, activeShadow) => {
            const btn = document.createElement("button");
            const colorTop = isActive ? activeTop : "#e0e0e0";
            const colorBot = isActive ? activeBot : "#9e9e9e";
            const colorShadow = isActive ? activeShadow : "#757575";

            btn.style.cssText = `
                width: 72px; height: 72px; 
                border-radius: 50%; 
                border: 4px solid #fff; 
                background: linear-gradient(to bottom, ${colorTop}, ${colorBot}); 
                box-shadow: 0 5px 0 ${colorShadow}, 0 8px 15px rgba(0,0,0,0.3); 
                cursor: pointer; transition: transform 0.1s; 
                display: flex; justify-content: center; align-items: center; padding: 0;
            `;
            btn.innerHTML = `<span style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); display:flex;">${iconSvg}</span>`;
            
            btn.onclick = onClick;
            btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(4px)";
            btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
            btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
            
            btn.updateState = (active) => {
                const t = active ? activeTop : "#e0e0e0";
                const b = active ? activeBot : "#9e9e9e";
                const s = active ? activeShadow : "#757575";
                btn.style.background = `linear-gradient(to bottom, ${t}, ${b})`;
                btn.style.boxShadow = `0 5px 0 ${s}, 0 8px 15px rgba(0,0,0,0.3)`;
            };
            return btn;
        };

        // --- AUDIO TOGGLES ---
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = "display:flex; justify-content:center; gap:30px;";
        if (this.onQuit) {
            toggleContainer.style.marginBottom = "25px";
        }

        const musicSvg = '<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>';
        const bgmBtn = createRoundBtn(musicSvg, !AudioManager.isBgmMuted, () => {
            const isMuted = AudioManager.toggleBgm();
            bgmBtn.updateState(!isMuted);
        }, "#B2FF59", "#76FF03", "#64DD17");

        const sfxSvg = '<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
        const sfxBtn = createRoundBtn(sfxSvg, !AudioManager.isSfxMuted, () => {
            const isMuted = AudioManager.toggleSfx();
            sfxBtn.updateState(!isMuted);
        }, "#FFFF8D", "#FFEA00", "#FFD600");

        toggleContainer.appendChild(bgmBtn);
        toggleContainer.appendChild(sfxBtn);
        card.appendChild(toggleContainer);

        if (this.onQuit) {
            // Divider
            const divider = document.createElement('div');
            divider.style.cssText = "width:100%; height:3px; background:#e0e0e0; border-radius: 2px; margin-bottom:20px;";
            card.appendChild(divider);

            const iconBtnContainer = document.createElement('div');
            iconBtnContainer.style.cssText = "display: flex; gap: 30px; justify-content: center; width: 100%;";

            // Replay Button (Icon)
            const replaySvg = `<svg viewBox="0 0 24 24" fill="white" width="40" height="40"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
            const replayBtn = createRoundBtn(replaySvg, true, () => {
                document.body.removeChild(overlay);
                if (this.onReplay) this.onReplay();
            }, "#FF80AB", "#FF4081", "#F50057");
            
            // Home Button (Icon)
            const homeSvg = `<svg viewBox="0 0 24 24" fill="white" width="40" height="40"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
            const quitBtn = createRoundBtn(homeSvg, true, () => {
                document.body.removeChild(overlay);
                this.onQuit();
            }, "#4FC3F7", "#039BE5", "#0277BD");

            iconBtnContainer.appendChild(replayBtn);
            iconBtnContainer.appendChild(quitBtn);
            card.appendChild(iconBtnContainer);
        }

        overlay.appendChild(card);
        document.body.appendChild(overlay);
    }
}
