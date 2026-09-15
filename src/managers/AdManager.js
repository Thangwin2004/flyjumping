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
            adOverlay.style.fontFamily = 'Be Vietnam Pro, sans-serif';
            
            adOverlay.innerHTML = `
                <h2>📺 ${t("ad.loading")}</h2>
                <p>${t("ad.prompt")}</p>
                <div id="ad-timer" style="font-size: 30px; font-weight: bold; margin-top: 20px;">2</div>
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
                        <h2>🎉 ${t("ad.thanks")}</h2>
                        <p>${t("ad.unlocked")}</p>
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
            adOverlay.style.fontFamily = 'Be Vietnam Pro, sans-serif';
            
            adOverlay.innerHTML = `<h2>📺 ${t("ad.interstitial")}</h2>`;
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
