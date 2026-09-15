const STORAGE_KEY = "winkgames:peanut-jump:language";

export const messages = {
  en: {
    "document.title": "Chubby Dragon - Flight Run",
    "menu.title.line1": "CHUBBY DRAGON",
    "menu.title.line2": "FLIGHT RUN",
    "menu.play": "Play",
    "menu.leaderboard": "Leaderboard",
    "menu.settings": "Settings",

    "settings.title": "SETTINGS",
    "settings.language": "LANGUAGE",
    "settings.music": "Music",
    "settings.sfx": "Sound FX",
    "settings.lang.vi": "Tiếng Việt",
    "settings.lang.en": "English",

    "leaderboard.title": "LEADERBOARD",
    "leaderboard.rank": "RANK",
    "leaderboard.player": "PLAYER",
    "leaderboard.score": "SCORE",
    "leaderboard.member": "Member",
    "leaderboard.you": "You (Guest)",
    "leaderboard.empty": "No records yet. Play to set your first score!",

    "revive.title": "NOT OVER YET!",
    "revive.yes": "REVIVE",
    "revive.no": "No, thanks",

    "gameover.title": "GAME OVER",
    "actions.replay": "Replay",
    "actions.home": "Home",
    "actions.double": "Double score",
    "actions.close": "Close",

    "milestone.50": "Great start!",
    "milestone.100": "Nice jumping!",
    "milestone.150": "Halfway there!",
    "milestone.200": "Incredible!",
    "milestone.250": "Legendary!",
    "milestone.300": "Unstoppable!",

    "ad.loading": "Loading advertisement...",
    "ad.prompt": "Please watch until the end to claim your reward!",
    "ad.thanks": "Thank you for watching!",
    "ad.unlocked": "Reward has been unlocked.",
    "ad.interstitial": "Displaying advertisement...",
  },
  vi: {
    "document.title": "Rồng Béo Tập Bay",
    "menu.title.line1": "RỒNG BÉO",
    "menu.title.line2": "TẬP BAY",
    "menu.play": "Chơi ngay",
    "menu.leaderboard": "Bảng xếp hạng",
    "menu.settings": "Cài đặt",

    "settings.title": "CÀI ĐẶT",
    "settings.language": "NGÔN NGỮ",
    "settings.music": "Âm nhạc",
    "settings.sfx": "Hiệu ứng",
    "settings.lang.vi": "Tiếng Việt",
    "settings.lang.en": "English",

    "leaderboard.title": "BẢNG XẾP HẠNG",
    "leaderboard.rank": "HẠNG",
    "leaderboard.player": "THÀNH VIÊN",
    "leaderboard.score": "ĐIỂM",
    "leaderboard.member": "Thành viên",
    "leaderboard.you": "Bạn (Khách)",
    "leaderboard.empty": "Chưa có thành tích. Hãy chơi để thiết lập kỷ lục!",

    "revive.title": "CHƯA KẾT THÚC ĐÂU!",
    "revive.yes": "CÓ",
    "revive.no": "Không, cảm ơn",

    "gameover.title": "KẾT THÚC",
    "actions.replay": "Chơi lại",
    "actions.home": "Trang chủ",
    "actions.double": "Nhân đôi điểm",
    "actions.close": "Đóng",

    "milestone.50": "Khởi đầu tốt!",
    "milestone.100": "Nhảy giỏi đấy!",
    "milestone.150": "Nửa đường rồi!",
    "milestone.200": "Incredible!",
    "milestone.250": "Legendary!",
    "milestone.300": "Unstoppable!",

    "ad.loading": "Đang tải quảng cáo...",
    "ad.prompt": "Vui lòng xem hết để nhận phần thưởng!",
    "ad.thanks": "Cảm ơn bạn đã xem!",
    "ad.unlocked": "Phần thưởng đã được mở khóa.",
    "ad.interstitial": "Đang hiển thị quảng cáo giữa màn hình...",
  },
};

export class I18nManager {
  constructor() {
    this.language = "en";
    this.listeners = new Set();
    try {
      const saved = globalThis.localStorage?.getItem(STORAGE_KEY);
      if (saved === "en" || saved === "vi") {
        this.language = saved;
      }
    } catch {
      /* Storage can be unavailable in embedded games. */
    }
    this.applyDocumentLanguage();
  }

  applyDocumentLanguage() {
    if (!globalThis.document) return;
    document.documentElement.lang = this.language;
    document.title = this.t("document.title");
  }

  setLanguage(language) {
    if (language !== "en" && language !== "vi") return false;
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, language);
    } catch {
      /* Keep the session choice. */
    }
    if (this.language === language) return false;
    this.language = language;
    this.applyDocumentLanguage();
    for (const listener of this.listeners) {
      try {
        listener(language);
      } catch (err) {
        console.error(err);
      }
    }
    return true;
  }

  t(key, variables = {}) {
    const langObj = messages[this.language] || messages.en;
    const template = langObj[key] ?? messages.en?.[key] ?? key;
    return template.replace(
      /\{(\w+)\}/g,
      (match, name) => variables[name] ?? match,
    );
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}

export const i18n = new I18nManager();
export const t = (key, variables) => i18n.t(key, variables);
