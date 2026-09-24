import { AudioManager } from '../managers/AudioManager';
import { UIBuilder } from './UIBuilder';
import { i18n, t } from '../managers/I18nManager';
import { winkGame } from '../integrations/wink/wink-adapter.js';

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
        card.style.cssText = "background:#fbfaf5;border:8px solid #40C4FF;border-radius:24px;width:280px;max-width:92%;padding:35px 20px 25px 20px;display:flex;flex-direction:column;align-items:center;box-shadow:0 15px 30px rgba(0,0,0,0.5); text-align: center; position:relative;";
        
        const isEn = i18n.language === 'en';
        const ribbon = document.createElement("div");
        ribbon.style.cssText = `position:absolute; top:-30px; background:linear-gradient(to bottom, #84FFFF, #40C4FF); border:4px solid #fff; border-radius:30px; padding:8px 32px; box-shadow:0 6px 0 #00B0FF; color:white; font-family:${isEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif"}; font-size:${isEn ? '24px' : '20px'}; font-weight:${isEn ? 'normal' : '900'}; letter-spacing:${isEn ? '2px' : '1px'}; -webkit-text-stroke: 1px #0288D1; text-shadow:0 3px 0 #0277BD, 0 4px 8px rgba(0,0,0,0.3); z-index:2; white-space:nowrap;`;
        ribbon.innerText = t("settings.title");
        card.appendChild(ribbon);

        let unsubscribeLocale = null;

        const handleResize = () => {
            const container = UIBuilder.getUILayer();
            if (!container) return;
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            const scale = Math.min(1.0, (cw - 20) / 320, (ch - 20) / 520);
            card.style.transform = `scale(${scale})`;
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        
        const originalRemove = overlay.remove.bind(overlay);
        overlay.remove = () => {
            window.removeEventListener("resize", handleResize);
            if (unsubscribeLocale) unsubscribeLocale();
            originalRemove();
        };
        
        const closeIconBtn = document.createElement("button");
        closeIconBtn.className = "ui-button";
        closeIconBtn.style.cssText = "position:absolute; top:-15px; right:-15px; width:44px; height:44px; border-radius:50%; border:3px solid #fff; background:linear-gradient(to bottom, #FF80AB, #FF4081); color:white; font-size:20px; font-weight:bold; cursor:pointer; box-shadow:0 4px 0 #F50057; display:flex; align-items:center; justify-content:center; padding:0; outline:none; -webkit-tap-highlight-color:transparent;";
        closeIconBtn.innerHTML = "✕";
        closeIconBtn.onclick = () => {
            AudioManager.playClickSFX();
            overlay.remove();
            if (this.onQuit && this.onResume) {
               this.onResume();
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
            btn.className = "ui-button";
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
                outline: none; -webkit-tap-highlight-color: transparent;
            `;
            btn.innerHTML = `<span style="filter: drop-shadow(0 2px 2px rgba(0,0,0,0.3)); display:flex;">${iconSvg}</span>`;
            
            btn.onclick = () => {
                AudioManager.playClickSFX();
                onClick(btn);
            };
            btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(4px)";
            btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
            btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
            return btn;
        };

        // --- AUDIO TOGGLES ---
        const toggleContainer = document.createElement('div');
        toggleContainer.style.cssText = "display: flex; gap: 20px; justify-content: center; width: 100%; margin-bottom: 20px;";

        const musicSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>`;
        const sfxSvg = `<svg viewBox="0 0 24 24" fill="white" width="36" height="36"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>`;

        const bgmBtn = createRoundBtn(musicSvg, !AudioManager.isBgmMuted, () => {
            const isMuted = AudioManager.toggleBgm();
            bgmBtn.style.background = isMuted ? "linear-gradient(to bottom, #e0e0e0, #9e9e9e)" : "linear-gradient(to bottom, #84FFFF, #40C4FF)";
            bgmBtn.style.boxShadow = isMuted ? "0 5px 0 #757575, 0 8px 15px rgba(0,0,0,0.3)" : "0 5px 0 #00B0FF, 0 8px 15px rgba(0,0,0,0.3)";
        }, "#84FFFF", "#40C4FF", "#00B0FF");

        const sfxBtn = createRoundBtn(sfxSvg, !AudioManager.isSfxMuted, () => {
            const isMuted = AudioManager.toggleSfx();
            sfxBtn.style.background = isMuted ? "linear-gradient(to bottom, #e0e0e0, #9e9e9e)" : "linear-gradient(to bottom, #B2FF59, #76FF03)";
            sfxBtn.style.boxShadow = isMuted ? "0 5px 0 #757575, 0 8px 15px rgba(0,0,0,0.3)" : "0 5px 0 #64DD17, 0 8px 15px rgba(0,0,0,0.3)";
        }, "#B2FF59", "#76FF03", "#64DD17");

        toggleContainer.appendChild(bgmBtn);
        toggleContainer.appendChild(sfxBtn);
        card.appendChild(toggleContainer);

        // --- LANGUAGE SELECTION SECTION ---
        const langDivider = document.createElement('div');
        langDivider.style.cssText = "width:100%; height:2px; background:#e0e0e0; border-radius: 2px; margin-bottom:12px;";
        card.appendChild(langDivider);

        const langLabel = document.createElement('div');
        langLabel.style.cssText = "font-family:'Be Vietnam Pro', sans-serif; font-size:13px; font-weight:900; color:#0288D1; letter-spacing:1.5px; margin-bottom:10px; text-transform:uppercase;";
        langLabel.innerText = t("settings.language");
        card.appendChild(langLabel);

        const langBtnContainer = document.createElement('div');
        langBtnContainer.style.cssText = "display: flex; gap: 10px; justify-content: center; width: 100%; margin-bottom: 15px;";

        const applyLangStyle = (btn, isActive) => {
            if (isActive) {
                btn.style.background = "linear-gradient(to bottom, #84FFFF, #40C4FF)";
                btn.style.border = "3px solid #fff";
                btn.style.boxShadow = "0 4px 0 #00B0FF, 0 6px 12px rgba(0,0,0,0.15)";
                btn.style.color = "#ffffff";
                btn.style.textShadow = "0 1px 3px rgba(0,0,0,0.3)";
                btn.style.fontWeight = "900";
            } else {
                btn.style.background = "#ECEFF1";
                btn.style.border = "2px solid #CFD8DC";
                btn.style.boxShadow = "0 3px 0 #B0BEC5";
                btn.style.color = "#546E7A";
                btn.style.textShadow = "none";
                btn.style.fontWeight = "700";
            }
        };

        const createLangBtn = (langCode, labelText) => {
            const btn = document.createElement('button');
            btn.className = "ui-button";
            btn.style.cssText = `
                flex: 1;
                max-width: 120px;
                height: 40px;
                border-radius: 20px;
                cursor: pointer;
                font-family: 'Be Vietnam Pro', sans-serif;
                font-size: 13px;
                outline: none;
                transition: transform 0.1s;
                -webkit-tap-highlight-color: transparent;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 0 8px;
            `;
            btn.innerText = labelText;
            applyLangStyle(btn, i18n.language === langCode);

            btn.onclick = () => {
                if (i18n.language === langCode) return;
                AudioManager.playClickSFX();
                if (winkGame && typeof winkGame.setLocale === 'function') {
                    winkGame.setLocale(langCode);
                } else {
                    i18n.setLanguage(langCode);
                }
            };
            btn.onmousedown = () => btn.style.transform = "scale(0.95) translateY(2px)";
            btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
            btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
            return btn;
        };

        const viBtn = createLangBtn('vi', "Tiếng Việt");
        const enBtn = createLangBtn('en', "English");

        langBtnContainer.appendChild(viBtn);
        langBtnContainer.appendChild(enBtn);
        card.appendChild(langBtnContainer);

        const updateLocaleUI = () => {
            const currentIsEn = i18n.language === 'en';
            ribbon.innerText = t("settings.title");
            ribbon.style.fontFamily = currentIsEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif";
            ribbon.style.fontSize = currentIsEn ? "24px" : "20px";
            ribbon.style.fontWeight = currentIsEn ? "normal" : "900";
            ribbon.style.letterSpacing = currentIsEn ? "2px" : "1px";
            langLabel.innerText = t("settings.language");
            langLabel.style.fontFamily = currentIsEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif";
            applyLangStyle(viBtn, i18n.language === 'vi');
            applyLangStyle(enBtn, i18n.language === 'en');
        };

        unsubscribeLocale = i18n.subscribe(() => {
            updateLocaleUI();
        });

        if (this.onQuit) {
            // Divider
            const divider = document.createElement('div');
            divider.style.cssText = "width:100%; height:2px; background:#e0e0e0; border-radius: 2px; margin-bottom:15px;";
            card.appendChild(divider);

            const iconBtnContainer = document.createElement('div');
            iconBtnContainer.style.cssText = "display: flex; gap: 30px; justify-content: center; width: 100%;";

            // Replay Button (Icon)
            const replaySvg = `<svg viewBox="0 0 24 24" fill="white" width="40" height="40"><path d="M17.65 6.35A7.95 7.95 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>`;
            const replayBtn = createRoundBtn(replaySvg, true, () => {
                overlay.remove();
                if (this.onReplay) this.onReplay();
            }, "#FF80AB", "#FF4081", "#F50057");
            
            // Home Button (Icon)
            const homeSvg = `<svg viewBox="0 0 24 24" fill="white" width="40" height="40"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`;
            const quitBtn = createRoundBtn(homeSvg, true, () => {
                overlay.remove();
                this.onQuit();
            }, "#4FC3F7", "#039BE5", "#0277BD");

            iconBtnContainer.appendChild(replayBtn);
            iconBtnContainer.appendChild(quitBtn);
            card.appendChild(iconBtnContainer);
        }

        overlay.appendChild(card);
        UIBuilder.getUILayer().appendChild(overlay);
    }
}
