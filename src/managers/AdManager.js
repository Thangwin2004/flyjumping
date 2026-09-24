import { t } from './I18nManager';

export const AdManager = {
    showRewardedVideo: () => {
        return new Promise((resolve) => {
            console.log("[AdManager] Requesting Rewarded Video Ad...");
            
            // Create a fake DOM overlay to mock ad watching
            const adOverlay = document.createElement('div');
            adOverlay.style.position = 'fixed';
            adOverlay.style.top = '0';
            adOverlay.style.left = '0';
            adOverlay.style.width = '100vw';
            adOverlay.style.height = '100vh';
            adOverlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
            adOverlay.style.color = 'white';
            adOverlay.style.display = 'flex';
            adOverlay.style.flexDirection = 'column';
            adOverlay.style.justifyContent = 'center';
            adOverlay.style.alignItems = 'center';
            adOverlay.style.zIndex = '9999';
            adOverlay.style.fontFamily = "'Lilita One', 'Be Vietnam Pro', cursive, sans-serif";
            
            adOverlay.innerHTML = `
                <h2 style="font-size: 26px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">📺 ${t("ad.loading")}</h2>
                <p style="font-family:'Be Vietnam Pro', sans-serif; font-size: 15px; opacity: 0.9; margin: 8px 20px; text-align: center;">${t("ad.prompt")}</p>
                <div id="ad-timer" style="font-size: 44px; font-weight: 900; color: #FFF176; text-shadow: 0 4px 0 #F57F17, 0 6px 10px rgba(0,0,0,0.4); margin-top: 15px;">2</div>
            `;
            
            document.body.appendChild(adOverlay);
            
            let time = 2;
            const interval = setInterval(() => {
                time--;
                if (time > 0) {
                    const timerEl = document.getElementById('ad-timer');
                    if (timerEl) timerEl.innerText = time;
                } else {
                    clearInterval(interval);
                    adOverlay.innerHTML = `
                        <h2 style="font-size: 26px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">🎉 ${t("ad.thanks")}</h2>
                        <p style="font-family:'Be Vietnam Pro', sans-serif; font-size: 15px; opacity: 0.9; margin: 8px 20px; text-align: center;">${t("ad.unlocked")}</p>
                    `;
                    setTimeout(() => {
                        if (adOverlay.parentNode) {
                            document.body.removeChild(adOverlay);
                        }
                        resolve(true);
                    }, 1000);
                }
            }, 1000);
        });
    },

    showInterstitial: () => {
        return new Promise((resolve) => {
            console.log("[AdManager] Showing Interstitial Ad...");
            
            const adOverlay = document.createElement('div');
            adOverlay.style.position = 'fixed';
            adOverlay.style.top = '0';
            adOverlay.style.left = '0';
            adOverlay.style.width = '100vw';
            adOverlay.style.height = '100vh';
            adOverlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
            adOverlay.style.color = 'white';
            adOverlay.style.display = 'flex';
            adOverlay.style.justifyContent = 'center';
            adOverlay.style.alignItems = 'center';
            adOverlay.style.zIndex = '9999';
            adOverlay.style.fontFamily = "'Lilita One', 'Be Vietnam Pro', cursive, sans-serif";
            
            adOverlay.innerHTML = `<h2 style="font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">📺 ${t("ad.interstitial")}</h2>`;
            document.body.appendChild(adOverlay);
            
            setTimeout(() => {
                if (adOverlay.parentNode) {
                    document.body.removeChild(adOverlay);
                }
                resolve(true);
            }, 1500);
        });
    }
};
