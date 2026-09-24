import { UIBuilder } from './UIBuilder';
import { gameApp } from '../core/Application';
import { AudioManager } from '../managers/AudioManager';
import { winkGame } from '../integrations/wink/wink-adapter.js';
import { i18n, t } from '../managers/I18nManager';

function getEffectiveUser() {
    if (winkGame && winkGame.personalBest?.displayName) {
        return {
            name: winkGame.personalBest.displayName,
            avatar: "/assets/image/imagebldp/001_avatar_laclac.png"
        };
    }

    try {
        const savedUser = localStorage.getItem("google_user") || localStorage.getItem("user_info");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed && (parsed.name || parsed.displayName)) {
                return {
                    name: parsed.name || parsed.displayName,
                    avatar: parsed.picture || parsed.avatar || "/assets/image/imagebldp/001_avatar_laclac.png"
                };
            }
        }
    } catch (e) {}

    if (winkGame && winkGame.isAuthenticated) {
        return { name: t("leaderboard.member"), avatar: "/assets/image/imagebldp/001_avatar_laclac.png" };
    }

    return null;
}

export class LeaderboardModal {
    show(onClose) {
        const overlay = document.createElement("div");
        overlay.className = "ui-button"; 
        overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:9999;";
        
        const card = document.createElement("div");
        card.style.cssText = "background:#fbfaf5;border:8px solid #40C4FF;border-radius:24px;width:500px;max-width:calc(100vw - 30px);height:580px;max-height:85vh;position:relative;box-shadow:0 15px 30px rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center; box-sizing:border-box;";
        
        const handleResize = () => {
            const container = gameApp.renderer.domElement.parentElement;
            if (!container) return;
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            const scale = Math.min(1.0, (cw - 20) / 480, (ch - 20) / 640);
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

        // Title Ribbon (Cyan) - Responsive 3D text styling
        const ribbon = document.createElement("div");
        ribbon.style.cssText = `position:absolute; top:-25px; background:linear-gradient(to bottom, #84FFFF, #40C4FF); border:4px solid #fff; border-radius:30px; padding:8px 0; width:70%; max-width:300px; text-align:center; box-shadow:0 6px 0 #00B0FF; color:white; font-family:${isEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif"}; font-size:${isEn ? 'clamp(18px, 5vw, 24px)' : 'clamp(16px, 4.5vw, 22px)'}; font-weight:${isEn ? 'normal' : '900'}; letter-spacing:${isEn ? '2px' : '1px'}; -webkit-text-stroke: 1px #0288D1; text-shadow:0 3px 0 #0277BD, 0 4px 8px rgba(0,0,0,0.3); z-index:2; white-space:nowrap;`;
        ribbon.innerText = t("leaderboard.title");
        card.appendChild(ribbon);

        // Header Labels - Aligned perfectly with row padding (35px = 20px container + 15px row)
        const header = document.createElement("div");
        header.style.cssText = `display:flex; width:100%; justify-content:space-between; align-items:center; margin-top:45px; color:#00B0FF; font-family:${isEn ? "'Lilita One', cursive, sans-serif" : "'Be Vietnam Pro', sans-serif"}; font-weight:${isEn ? 'normal' : '900'}; font-size:clamp(13px, 3.8vw, 16px); letter-spacing:1px; padding:0 35px; box-sizing:border-box;`;
        header.innerHTML = `
            <span style="width:64px; text-align:center; flex-shrink:0;">${t("leaderboard.rank")}</span>
            <span style="flex:1; text-align:left; padding-left:8px;">${t("leaderboard.player")}</span>
            <span style="width:90px; text-align:right; flex-shrink:0;">${t("leaderboard.score")}</span>
        `;
        card.appendChild(header);

        // List Container
        const listContainer = document.createElement("div");
        listContainer.style.cssText = "width:100%; flex:1; overflow-y:auto; margin-top:8px; margin-bottom:10px; display:flex; flex-direction:column; gap:8px; padding:0 20px; box-sizing:border-box;";
        card.appendChild(listContainer);

        // Initial default / fallback data
        const defaultPlayers = [
            { name: "Thanh Tùng", score: 9999, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
            { name: "Marth3", score: 8540, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
            { name: "Đậu Phộng", score: 7200, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
            { name: "Bơ Lạc", score: 6500, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
            { name: isEn ? "Guest_912" : "Khách_912", score: 4200, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
            { name: isEn ? "Guest_123" : "Khách_123", score: 3100, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
        ];

        const renderList = (dataList) => {
            listContainer.innerHTML = '';
            dataList.forEach((p, index) => {
                const row = document.createElement("div");
                const isEven = index % 2 === 0;
                const bg = isEven ? "#fffcf0" : "#f2eedb";
                
                row.style.cssText = `display:flex; align-items:center; background:${bg}; border:1px solid #dcd6bf; border-radius:10px; padding:8px 15px; color:#241d4f; font-family:'Be Vietnam Pro', sans-serif; font-weight:bold; font-size:clamp(14px, 4vw, 17px); box-sizing:border-box;`;
                
                const rankNum = p.rank || (index + 1);
                let rankContent = `<span style="font-family:'Lilita One', cursive, sans-serif; font-size:22px; color:#241d4f;">${rankNum}</span>`;
                if (rankNum === 1) rankContent = `<span style="font-size:34px; line-height:1; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.25)); display:inline-block; transform:scale(1.2);">🥇</span>`;
                if (rankNum === 2) rankContent = `<span style="font-size:32px; line-height:1; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.25)); display:inline-block; transform:scale(1.15);">🥈</span>`;
                if (rankNum === 3) rankContent = `<span style="font-size:32px; line-height:1; filter:drop-shadow(0 3px 5px rgba(0,0,0,0.25)); display:inline-block; transform:scale(1.15);">🥉</span>`;

                const avatarUrl = p.avatar || "/assets/image/imagebldp/001_avatar_laclac.png";

                row.innerHTML = `
                    <div style="width:64px; min-width:64px; text-align:center; display:flex; justify-content:center; align-items:center; flex-shrink:0;">
                        ${rankContent}
                    </div>
                    <div style="flex:1; display:flex; align-items:center; gap:8px; padding-left:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        <div style="width:30px; height:30px; border-radius:50%; background:#fff; border:2px solid #ddd; overflow:hidden; flex-shrink:0;">
                            <img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/image/imagebldp/001_avatar_laclac.png'">
                        </div>
                        <span style="overflow:hidden; text-overflow:ellipsis; font-weight:900;">${p.name}</span>
                    </div>
                    <div style="width:90px; min-width:90px; text-align:right; font-family:'Lilita One', cursive, sans-serif; font-size:20px; color:#E65100; flex-shrink:0; letter-spacing:0.5px;">
                        ${p.score}
                    </div>
                `;
                listContainer.appendChild(row);
            });
        };

        // Pinned Footer (Personal Best) elements
        const footer = document.createElement("div");
        footer.style.cssText = "width:calc(100% - 40px); background:#FFF8E1; border:2.5px solid #FFD54F; border-radius:12px; padding:10px 15px; display:flex; align-items:center; color:#241d4f; font-family:'Be Vietnam Pro', sans-serif; font-weight:900; font-size:clamp(14px, 4vw, 17px); margin-bottom:20px; box-sizing:border-box; box-shadow:0 4px 10px rgba(0,0,0,0.1);";

        const updateFooter = (pb) => {
            const effUser = getEffectiveUser();
            const playerName = pb?.displayName || (effUser ? effUser.name : (winkGame?.isAuthenticated ? t("leaderboard.member") : t("leaderboard.you")));
            const playerAvatar = effUser ? effUser.avatar : "/assets/image/imagebldp/001_avatar_laclac.png";
            const localHighScore = parseInt(localStorage.getItem('peanutJumpHighScore') || '0', 10);
            const myScore = pb?.score !== undefined && pb?.score !== null ? pb.score : localHighScore;
            const rankStr = pb?.rank ? `#${pb.rank}` : (myScore > 0 ? "🎖️" : "—");

            footer.innerHTML = `
                <div style="width:64px; min-width:64px; text-align:center; display:flex; justify-content:center; align-items:center; flex-shrink:0;">
                    <span style="font-family:'Lilita One', cursive, sans-serif; font-size:20px; color:#D84315;">${rankStr}</span>
                </div>
                <div style="flex:1; display:flex; align-items:center; gap:8px; padding-left:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                    <div style="width:30px; height:30px; border-radius:50%; background:#fff; border:2px solid #FFC107; overflow:hidden; flex-shrink:0;">
                        <img src="${playerAvatar}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/image/imagebldp/001_avatar_laclac.png'">
                    </div>
                    <span style="overflow:hidden; text-overflow:ellipsis; color:#D84315;">${playerName}</span>
                </div>
                <div style="width:90px; min-width:90px; text-align:right; color:#D84315; font-family:'Lilita One', cursive, sans-serif; font-size:22px; flex-shrink:0; letter-spacing:0.5px;">
                    ${myScore}
                </div>
            `;
        };

        // Render initial state
        renderList(defaultPlayers);
        updateFooter(winkGame?.personalBest);

        // Fetch real API data asynchronously from Wink API
        if (winkGame) {
            Promise.all([
                winkGame.refreshLeaderboard({ limit: 10 }),
                winkGame.getPersonalBest()
            ]).then(([lbRes, pbRes]) => {
                if (lbRes && Array.isArray(lbRes.entries) && lbRes.entries.length > 0) {
                    const fallbackMember = i18n.language === 'en' ? "Member" : "Thành viên";
                    const apiPlayers = lbRes.entries.map((item, idx) => ({
                        rank: item.rank || (idx + 1),
                        name: item.displayName || item.name || item.username || `${fallbackMember} #${item.rank || (idx + 1)}`,
                        score: item.score || 0,
                        avatar: item.avatarUrl || item.avatar || "/assets/image/imagebldp/001_avatar_laclac.png"
                    }));
                    renderList(apiPlayers);
                }
                const activePb = pbRes?.me || lbRes?.me || winkGame.personalBest;
                updateFooter(activePb);
            }).catch(() => {
                // Keep default list on offline/mock mode
            });
        }

        card.appendChild(footer);

        // Close Button (top right)
        const closeBtn = document.createElement("button");
        closeBtn.className = "ui-button";
        closeBtn.setAttribute("aria-label", t("actions.close"));
        closeBtn.style.cssText = "position:absolute; top:-15px; right:-15px; width:44px; height:44px; border-radius:50%; border:3px solid #fff; background:linear-gradient(to bottom, #FF80AB, #FF4081); color:white; font-size:20px; font-weight:bold; cursor:pointer; box-shadow:0 4px 0 #F50057; display:flex; align-items:center; justify-content:center; padding:0;";
        closeBtn.innerHTML = "✕";
        closeBtn.onclick = () => {
            AudioManager.playClickSFX();
            overlay.remove();
            if (onClose) onClose();
        };
        closeBtn.onmousedown = () => closeBtn.style.transform = "scale(0.9) translateY(4px)";
        closeBtn.onmouseup = () => closeBtn.style.transform = "scale(1) translateY(0)";
        
        card.appendChild(closeBtn);
        overlay.appendChild(card);
        UIBuilder.getUILayer().appendChild(overlay);
    }
}
