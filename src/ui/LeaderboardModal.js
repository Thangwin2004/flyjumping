import { UIBuilder } from './UIBuilder';
import { gameApp } from '../core/Application';
import { AudioManager } from '../managers/AudioManager';
import { winkGame } from '../integrations/wink/wink-adapter.js';

function getEffectiveUser() {
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
        const state = winkGame.state;
        const userName = state?.user?.name || state?.identity?.displayName || "Thành viên";
        const avatar = state?.user?.avatar || state?.identity?.avatarUrl || "/assets/image/imagebldp/001_avatar_laclac.png";
        return { name: userName, avatar: avatar };
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

        // Title Ribbon (Cyan) - Responsive 3D text styling
        const ribbon = document.createElement("div");
        ribbon.style.cssText = "position:absolute; top:-25px; background:linear-gradient(to bottom, #84FFFF, #40C4FF); border:4px solid #fff; border-radius:30px; padding:10px 0; width:70%; max-width:300px; text-align:center; box-shadow:0 6px 0 #00B0FF; color:white; font-family:'Be Vietnam Pro', 'Nunito', 'Inter', sans-serif; font-size:clamp(16px, 4.5vw, 22px); font-weight:900; letter-spacing:1px; text-shadow:0 2px 4px rgba(0,0,0,0.3); z-index:2; white-space:nowrap;";
        ribbon.innerText = "BẢNG XẾP HẠNG";
        card.appendChild(ribbon);

        // Header Labels
        const header = document.createElement("div");
        header.style.cssText = "display:flex; width:100%; justify-content:space-between; margin-top:45px; color:#00B0FF; font-family:'Be Vietnam Pro', 'Nunito', sans-serif; font-weight:900; font-size:clamp(12px, 3.5vw, 15px); padding:0 24px; box-sizing:border-box;";
        header.innerHTML = `
            <span style="flex:1; text-align:left;">HẠNG</span>
            <span style="flex:2; text-align:left; padding-left:10px;">THÀNH VIÊN</span>
            <span style="flex:1; text-align:right;">ĐIỂM</span>
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
            { name: "Khách_912", score: 4200, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
            { name: "Khách_123", score: 3100, avatar: "/assets/image/imagebldp/001_avatar_laclac.png" },
        ];

        const renderList = (dataList) => {
            listContainer.innerHTML = '';
            dataList.forEach((p, index) => {
                const row = document.createElement("div");
                const isEven = index % 2 === 0;
                const bg = isEven ? "#fffcf0" : "#f2eedb";
                
                row.style.cssText = `display:flex; align-items:center; background:${bg}; border:1px solid #dcd6bf; border-radius:10px; padding:8px 15px; color:#241d4f; font-family:'Be Vietnam Pro', 'Nunito', sans-serif; font-weight:bold; font-size:clamp(14px, 4vw, 17px); box-sizing:border-box;`;
                
                let rankStr = `${index + 1}`;
                if (index === 0) rankStr = "🥇";
                if (index === 1) rankStr = "🥈";
                if (index === 2) rankStr = "🥉";

                const avatarUrl = p.avatar || "/assets/image/imagebldp/001_avatar_laclac.png";

                row.innerHTML = `
                    <span style="flex:1; text-align:left; font-size:clamp(18px, 5vw, 22px);">${rankStr}</span>
                    <div style="flex:2; display:flex; align-items:center; gap:8px; padding-left:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                        <div style="width:26px; height:26px; border-radius:50%; background:#fff; border:2px solid #ddd; overflow:hidden; flex-shrink:0;">
                            <img src="${avatarUrl}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/image/imagebldp/001_avatar_laclac.png'">
                        </div>
                        <span style="overflow:hidden; text-overflow:ellipsis; font-weight:900;">${p.name}</span>
                    </div>
                    <span style="flex:1; text-align:right; font-weight:900; color:#E65100;">${p.score}</span>
                `;
                listContainer.appendChild(row);
            });
        };

        // Render initial data
        renderList(defaultPlayers);

        // Fetch real API data asynchronously from Wink API if available
        if (winkGame) {
            winkGame.refreshLeaderboard({ limit: 10 }).then(res => {
                if (res && Array.isArray(res.entries) && res.entries.length > 0) {
                    const apiPlayers = res.entries.map((item, idx) => ({
                        name: item.name || item.username || item.displayName || `Thành viên #${idx + 1}`,
                        score: item.score || 0,
                        avatar: item.avatarUrl || item.avatar || "/assets/image/imagebldp/001_avatar_laclac.png"
                    }));
                    renderList(apiPlayers);
                }
            }).catch(() => {
                // Keep default list on offline/mock mode
            });
        }

        // Pinned Footer (Personal Best)
        const effUser = getEffectiveUser();
        const playerName = effUser ? effUser.name : "Bạn (Khách)";
        const playerAvatar = effUser ? effUser.avatar : "/assets/image/imagebldp/001_avatar_laclac.png";
        const myHighScore = parseInt(localStorage.getItem('peanutJumpHighScore') || '0', 10);

        const footer = document.createElement("div");
        footer.style.cssText = "width:calc(100% - 40px); background:#FFF8E1; border:2.5px solid #FFD54F; border-radius:12px; padding:10px 15px; display:flex; align-items:center; color:#241d4f; font-family:'Be Vietnam Pro', 'Nunito', sans-serif; font-weight:900; font-size:clamp(14px, 4vw, 17px); margin-bottom:20px; box-sizing:border-box; box-shadow:0 4px 10px rgba(0,0,0,0.1);";
        footer.innerHTML = `
            <span style="flex:1; text-align:left; font-size:clamp(16px, 4.5vw, 20px); color:#FF8F00;">🎖️</span>
            <div style="flex:2; display:flex; align-items:center; gap:8px; padding-left:10px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
                <div style="width:28px; height:28px; border-radius:50%; background:#fff; border:2px solid #FFC107; overflow:hidden; flex-shrink:0;">
                    <img src="${playerAvatar}" style="width:100%; height:100%; object-fit:cover;" onerror="this.src='/assets/image/imagebldp/001_avatar_laclac.png'">
                </div>
                <span style="overflow:hidden; text-overflow:ellipsis; color:#D84315;">${playerName}</span>
            </div>
            <span style="flex:1; text-align:right; color:#D84315; font-size:18px;">${myHighScore}</span>
        `;
        card.appendChild(footer);

        // Close Button (top right)
        const closeBtn = document.createElement("button");
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
