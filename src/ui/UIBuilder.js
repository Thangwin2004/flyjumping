import { AdManager } from '../managers/AdManager';
import { gameApp } from '../core/Application';
import { AudioManager } from '../managers/AudioManager';
import { i18n, t } from '../managers/I18nManager';

export const UIBuilder = {
    getUILayer() {
        return document.getElementById('ui-layer');
    },

    clearUI() {
        const layer = this.getUILayer();
        if (layer) {
            layer.innerHTML = '';
        }
    },

    createNavBtn(iconSvgString, onClick, colorTop, colorBot, colorShadow) {
        const btn = document.createElement("button");
        btn.className = "ui-button";
        btn.style.cssText = `
            width: 64px; height: 64px; 
            border-radius: 50%; 
            border: 3px solid #fff; 
            background: linear-gradient(to bottom, ${colorTop}, ${colorBot}); 
            box-shadow: 0 4px 0 ${colorShadow}, 0 6px 10px rgba(0,0,0,0.2); 
            cursor: pointer; transition: transform 0.1s; 
            display: flex; justify-content: center; align-items: center; padding: 0;
            outline: none;
        `;
        
        btn.innerHTML = iconSvgString;
        btn.onclick = () => {
            AudioManager.playClickSFX();
            onClick();
        };
        btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(4px)";
        btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
        btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
        return btn;
    },

    createSquareIconBtn(iconSvgString, onClick, colorTop, colorBot, colorShadow) {
        const btn = document.createElement("button");
        btn.className = "ui-button";
        btn.style.cssText = `
            width: 70px; height: 70px; 
            border-radius: 20px; 
            border: 3px solid #fff; 
            background: linear-gradient(to bottom, ${colorTop}, ${colorBot}); 
            box-shadow: 0 6px 0 ${colorShadow}, 0 8px 10px rgba(0,0,0,0.2); 
            cursor: pointer; transition: transform 0.1s; 
            display: flex; justify-content: center; align-items: center; padding: 0;
            outline: none;
        `;
        
        btn.innerHTML = iconSvgString;
        btn.onclick = () => {
            AudioManager.playClickSFX();
            onClick();
        };
        btn.onmousedown = () => btn.style.transform = "scale(0.9) translateY(4px)";
        btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
        btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
        return btn;
    },

    createTextBtn(text, onClick, colorTop, colorBot, colorShadow) {
        const isEn = i18n.language === 'en';
        const btn = document.createElement("button");
        btn.className = "ui-button";
        btn.style.cssText = `
            border-radius: 24px; 
            border: 3px solid #fff; 
            background: linear-gradient(to bottom, ${colorTop}, ${colorBot}); 
            box-shadow: 0 6px 0 ${colorShadow}, 0 8px 10px rgba(0,0,0,0.2); 
            cursor: pointer; transition: transform 0.1s; 
            display: flex; justify-content: center; align-items: center; 
            padding: 15px 40px; outline: none;
            color: white; font-size: 24px; font-weight: ${isEn ? '400' : '900'};
            font-family: ${isEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif"}; 
            letter-spacing: 1.5px;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        `;
        
        btn.innerHTML = text;
        btn.onclick = () => {
            AudioManager.playClickSFX();
            onClick();
        };
        btn.onmousedown = () => btn.style.transform = "scale(0.95) translateY(4px)";
        btn.onmouseup = () => btn.style.transform = "scale(1) translateY(0)";
        btn.onmouseleave = () => btn.style.transform = "scale(1) translateY(0)";
        return btn;
    },

    showReviveOffer(onRevive, onSkip) {
        const overlay = document.createElement("div");
        overlay.className = "ui-button"; // to catch events
        overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;";
        
        const card = document.createElement("div");
        card.style.cssText = "background:#fbfaf5;border:6px solid #40C4FF;border-radius:24px;width:350px;max-width:90%;padding:30px;display:flex;flex-direction:column;align-items:center;box-shadow:0 15px 30px rgba(0,0,0,0.5); text-align: center;";
        
        const handleResize = () => {
            const container = gameApp.renderer.domElement.parentElement;
            if (!container) return;
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            const scale = Math.min(1.0, cw / 400, ch / 600);
            card.style.transform = `scale(${scale})`; 
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        
        const originalRemove = overlay.remove.bind(overlay);
        overlay.remove = () => {
            window.removeEventListener("resize", handleResize);
            originalRemove();
        };

        const isEn = i18n.language === 'en';
        const titleText = t("revive.title");
        const revFont = isEn ? "'Lilita One', 'Be Vietnam Pro', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif";
        const revWeight = isEn ? "400" : "900";
        const revSize = isEn ? "32" : "28";

        const title = document.createElement("div");
        title.style.cssText = "width: 100%; display: flex; justify-content: center; margin-bottom: 12px;";
        title.innerHTML = `
            <svg viewBox="0 0 360 65" style="width: 100%; max-width: 320px; filter: drop-shadow(0px 6px 10px rgba(0,0,0,0.3)); overflow: visible;">
                <defs>
                    <linearGradient id="reviveTitleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stop-color="#E0F7FA" />
                        <stop offset="30%" stop-color="#29B6F6" />
                        <stop offset="70%" stop-color="#0288D1" />
                        <stop offset="100%" stop-color="#01579B" />
                    </linearGradient>
                </defs>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Be+Vietnam+Pro:ital,wght@0,900;1,900&display=swap');
                    .rev-title-text {
                        font-family: ${revFont};
                        font-weight: ${revWeight};
                        text-anchor: middle;
                        letter-spacing: 1.5px;
                    }
                </style>
                <!-- 1. Deep 3D Shadow -->
                <g transform="translate(0, 5)">
                    <text x="180" y="44" font-size="${revSize}" fill="#003366" stroke="#003366" stroke-width="7" stroke-linejoin="round" class="rev-title-text">${titleText}</text>
                </g>
                <!-- 2. Mid 3D Bevel -->
                <g transform="translate(0, 2.5)">
                    <text x="180" y="44" font-size="${revSize}" fill="#01579B" stroke="#01579B" stroke-width="6" stroke-linejoin="round" class="rev-title-text">${titleText}</text>
                </g>
                <!-- 3. Thick White Sticker Outline -->
                <g>
                    <text x="180" y="44" font-size="${revSize}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" class="rev-title-text">${titleText}</text>
                </g>
                <!-- 4. Pure Cyan Gradient Face -->
                <g>
                    <text x="180" y="44" font-size="${revSize}" fill="url(#reviveTitleGrad)" stroke="none" class="rev-title-text">${titleText}</text>
                </g>
            </svg>
        `;
        
        const heartIcon = document.createElement("div");
        heartIcon.innerText = "💖";
        heartIcon.style.cssText = "font-size:90px;line-height:1;margin-bottom:20px;text-shadow:0 10px 20px rgba(0,0,0,0.2), 0 0 30px rgba(255,100,150,0.6);";
        heartIcon.animate([
            { transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }, { transform: "scale(1.2)" }, { transform: "scale(1)" }
        ], { duration: 1200, iterations: Infinity, easing: "ease-in-out" });
        
        const yesBtn = document.createElement("button");
        yesBtn.style.cssText = `background:linear-gradient(to bottom, #B2FF59, #76FF03);border:none;border-radius:12px;padding:12px 30px;color:white;font-size:22px;font-weight:${isEn ? '400' : '900'};font-family:${isEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif"};cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 6px 0 #64DD17, 0 8px 10px rgba(0,0,0,0.3);transition:transform 0.1s;width:100%;margin-bottom:15px;letter-spacing:1px;`;
        
        yesBtn.innerHTML = `
            <img src="/assets/iconbtn/images.png" style="height:30px;margin-right:10px;">
            <span style="text-shadow: 0 2px 4px rgba(0,0,0,0.3);">${t("revive.yes")}</span>
        `;
        
        yesBtn.onclick = async () => {
            AudioManager.playClickSFX();
            yesBtn.disabled = true;
            const success = await AdManager.showRewardedVideo();
            overlay.remove();
            if (success) {
                onRevive();
            } else {
                onSkip();
            }
        };
        yesBtn.onmousedown = () => yesBtn.style.transform = "scale(0.95) translateY(4px)";
        yesBtn.onmouseup = () => yesBtn.style.transform = "scale(1) translateY(0)";
        yesBtn.onmouseleave = () => yesBtn.style.transform = "scale(1) translateY(0)";
        
        const skipText = document.createElement("div");
        skipText.innerText = t("revive.no");
        skipText.style.cssText = `font-family:${isEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif"};font-size:17px;color:#FF80AB;text-decoration:underline;cursor:pointer;font-weight:${isEn ? 'normal' : 'bold'};letter-spacing:1px;`;
        skipText.onclick = () => {
            AudioManager.playClickSFX();
            overlay.remove();
            onSkip();
        };
        
        card.appendChild(title);
        card.appendChild(heartIcon);
        card.appendChild(yesBtn);
        card.appendChild(skipText);
        overlay.appendChild(card);
        this.getUILayer().appendChild(overlay);
    }
};
