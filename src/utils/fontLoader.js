const VIETNAMESE_FONT_SAMPLE =
  "Ă Â Đ Ê Ô Ơ Ư Ắ Ắ Ằ Ẳ Ẵ Ặ Ế Ề Ể Ễ Ệ Ố Ồ Ổ Ỗ Ộ Ớ Ờ Ở Ỡ Ợ Ứ Ừ Ử Ữ Ự Rồng Béo Tập Bay 0123456789";
const LATIN_FONT_SAMPLE = "Chubby Dragon Flight Run 0123456789";

function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error("Font loading timed out")),
      timeoutMs,
    );
  });
  return Promise.race([promise, timeout]).finally(() =>
    window.clearTimeout(timeoutId),
  );
}

function waitForStylesheet(link, timeoutMs = 1500) {
  try {
    if (link.sheet) return Promise.resolve();
    for (let i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i].href === link.href) return Promise.resolve();
    }
  } catch {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    let timeoutId;
    const finish = () => {
      window.clearTimeout(timeoutId);
      link.removeEventListener("load", finish);
      link.removeEventListener("error", finish);
      resolve();
    };
    link.addEventListener("load", finish, { once: true });
    link.addEventListener("error", finish, { once: true });
    timeoutId = window.setTimeout(finish, Math.min(timeoutMs, 1500));
  });
}

export async function waitForGameFonts(fontRequests, timeoutMs = 4500) {
  if (!document.fonts?.load) return false;

  try {
    const stylesheets = Array.from(
      document.querySelectorAll(
        'link[rel="stylesheet"][href*="fonts.googleapis.com"]',
      ),
    );
    await Promise.all(
      stylesheets.map((link) => waitForStylesheet(link, timeoutMs)),
    );

    const loadPromises = fontRequests.map(async (font) => {
      const isBaloo = font.includes("Baloo");
      const sample = isBaloo ? LATIN_FONT_SAMPLE : VIETNAMESE_FONT_SAMPLE;
      try {
        const faces = await document.fonts.load(font, sample);
        return faces.length > 0;
      } catch {
        return false;
      }
    });

    const loadResults = await withTimeout(
      Promise.all(loadPromises),
      timeoutMs,
    );

    await withTimeout(document.fonts.ready, Math.min(timeoutMs, 3000)).catch(() => {});

    const beVietnamLoaded =
      document.fonts.check("1em 'Be Vietnam Pro'") ||
      document.fonts.check("700 1em 'Be Vietnam Pro'");

    const ready = beVietnamLoaded || loadResults.some((res) => res === true);
    document.documentElement.dataset.gameFonts = ready ? "ready" : "fallback";
    if (!ready) console.warn("Game fonts unavailable; using system fallback.");
    return ready;
  } catch (error) {
    const fallbackReady =
      document.fonts.check("1em 'Be Vietnam Pro'") ||
      document.fonts.check("700 1em 'Be Vietnam Pro'");
    document.documentElement.dataset.gameFonts = fallbackReady ? "ready" : "fallback";
    if (!fallbackReady) {
      console.warn("Game fonts unavailable; using system fallback.", error);
    }
    return fallbackReady;
  }
}
