import { UIBuilder } from './UIBuilder';
import { gameApp } from '../core/Application';

export class LeaderboardModal {
    show(onClose) {
        const overlay = document.createElement("div");
        overlay.className = "ui-button"; 
        overlay.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;";
        
        const card = document.createElement("div");
        // cardW = 500, cardH = 580
        card.style.cssText = "background:#fbfaf5;border:8px solid #40C4FF;border-radius:24px;width:500px;height:580px;max-width:95vw;max-height:85vh;position:relative;box-shadow:0 15px 30px rgba(0,0,0,0.5); display:flex; flex-direction:column; align-items:center;";
        
        const handleResize = () => {
            const container = gameApp.renderer.domElement.parentElement;
            if (!container) return;
            const cw = container.clientWidth;
            const ch = container.clientHeight;
            // scale down if screen is too small, max scale 1.0
            const scale = Math.min(1.0, cw / 420, ch / 700);
            card.style.transform = `scale(${scale})`;
        };
        window.addEventListener("resize", handleResize);
        handleResize();
        
        const originalRemove = overlay.remove.bind(overlay);
        overlay.remove = () => {
            window.removeEventListener("resize", handleResize);
            originalRemove();
        };

        // Title Ribbon (Cyan)
        const ribbon = document.createElement("div");
        ribbon.style.cssText = "position:absolute; top:-30px; background:linear-gradient(to bottom, #84FFFF, #40C4FF); border:4px solid #fff; border-radius:30px; padding:10px 30px; box-shadow:0 6px 0 #00B0FF; color:white; font-family:'Inter', sans-serif; font-size:22px; font-weight:900; letter-spacing:2px; text-shadow:0 2px 4px rgba(0,0,0,0.3); z-index:2;";
        ribbon.innerText = "BẢNG VÀNG THÀNH TÍCH";
        card.appendChild(ribbon);

        // Header Labels
        const header = document.createElement("div");
        header.style.cssText = "display:flex; width:450px; max-width:90%; justify-content:space-between; margin-top:50px; color:#00B0FF; font-family:'Inter', sans-serif; font-weight:bold; font-size:18px; padding:0 20px; box-sizing:border-box;";
        header.innerHTML = `
            <span style="flex:1; text-align:left;">HẠNG</span>
            <span style="flex:2; text-align:left; padding-left:30px;">THÀNH VIÊN</span>
            <span style="flex:1; text-align:right;">ĐIỂM SỐ</span>
        `;
        card.appendChild(header);

        // List Container
        const listContainer = document.createElement("div");
        listContainer.style.cssText = "width:450px; max-width:90%; flex:1; overflow-y:auto; margin-top:10px; margin-bottom:10px; display:flex; flex-direction:column; gap:8px;";
        
        // Mock Data
        const players = [
            { name: "Thanh Tùng", score: 9999 },
            { name: "Marth3", score: 8540 },
            { name: "Đậu Phộng", score: 7200 },
            { name: "Bơ Lạc", score: 6500 },
            { name: "Khách_912", score: 4200 },
            { name: "Khách_123", score: 3100 },
        ];

        players.forEach((p, index) => {
            const row = document.createElement("div");
            const isEven = index % 2 === 0;
            const bg = isEven ? "#fffcf0" : "#f2eedb";
            
            row.style.cssText = `display:flex; align-items:center; background:${bg}; border:1px solid #dcd6bf; border-radius:8px; padding:6px 20px; color:#241d4f; font-family:'Inter', sans-serif; font-weight:bold; font-size:18px;`;
            
            let rankStr = `${index + 1}`;
            if (index === 0) rankStr = "🥇";
            if (index === 1) rankStr = "🥈";
            if (index === 2) rankStr = "🥉";

            row.innerHTML = `
                <span style="flex:1; text-align:left; font-size:24px;">${rankStr}</span>
                <div style="flex:2; display:flex; align-items:center; gap:10px;">
                    <div style="width:28px; height:28px; border-radius:50%; background:#fff; border:2px solid #ddd; overflow:hidden;">
                        <img src="/assets/image/imagebldp/001_avatar_laclac.png" style="width:100%; height:100%; object-fit:cover;">
                    </div>
                    <span>${p.name}</span>
                </div>
                <span style="flex:1; text-align:right;">${p.score}</span>
            `;
            listContainer.appendChild(row);
        });
        card.appendChild(listContainer);

        // Pinned Footer (Personal Best)
        const footer = document.createElement("div");
        footer.style.cssText = "width:450px; max-width:90%; background:#fff3cd; border:2px solid #ffea00; border-radius:8px; padding:10px 20px; display:flex; align-items:center; color:#241d4f; font-family:'Inter', sans-serif; font-weight:bold; font-size:18px; margin-bottom:30px; box-sizing:border-box;";
        footer.innerHTML = `
            <span style="flex:1; text-align:left;">12</span>
            <div style="flex:2; display:flex; align-items:center; gap:10px;">
                <div style="width:28px; height:28px; border-radius:50%; background:#fff; border:2px solid #ddd; overflow:hidden;">
                    <img src="/assets/image/imagebldp/001_avatar_laclac.png" style="width:100%; height:100%; object-fit:cover;">
                </div>
                <span>Bạn (Khách)</span>
            </div>
            <span style="flex:1; text-align:right;">2450</span>
        `;
        card.appendChild(footer);

        // Close Button (top right)
        const closeBtn = document.createElement("button");
        closeBtn.style.cssText = "position:absolute; top:-15px; right:-15px; width:44px; height:44px; border-radius:50%; border:3px solid #fff; background:linear-gradient(to bottom, #FF80AB, #FF4081); color:white; font-size:20px; font-weight:bold; cursor:pointer; box-shadow:0 4px 0 #F50057; display:flex; align-items:center; justify-content:center; padding:0;";
        closeBtn.innerHTML = "✕";
        closeBtn.onclick = () => {
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
