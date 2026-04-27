const VERSION = "DEBUG v0.2";
console.log(`[DBG] version ${VERSION}`);
console.log("[DBG] background loaded");

// Midjourney → Eagle 連携
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type !== "ADD_TO_EAGLE") return;

    // 受信
    await chrome.action.setBadgeText({ text: "R" });
    await chrome.action.setBadgeBackgroundColor({ color: "#8888ff" });
    // バージョン表示（短縮）
    await chrome.action.setBadgeText({ text: "v2" });

    const { jobId, idx } = msg;

    // URL候補生成
    await chrome.action.setBadgeText({ text: "U" });

    const baseIdx = idx.split("_")[0];
    const candidates = [
      idx,
      `${baseIdx}_0`
    ];

    let imageUrl = null;

    for (const c of candidates) {
      const url = `https://cdn.midjourney.com/${jobId}/${c}.png`;
      try {
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          imageUrl = url;
          break;
        }
      } catch {}
    }

    if (!imageUrl) {
      await chrome.action.setBadgeText({ text: "404" });
      await chrome.action.setBadgeBackgroundColor({ color: "#ff0000" });
      return;
    }

    try {
      // POST開始
      await chrome.action.setBadgeText({ text: "P" });

      const res = await fetch("http://localhost:41595/api/item/addFromURL", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({
          url: msg.imageUrl || imageUrl,
          name: `${jobId}_${idx}`,
          tags: ["midjourney"],
          website: msg.jobUrl
        })
      });

      // 応答受信
      await chrome.action.setBadgeText({ text: "OK" });
      await chrome.action.setBadgeBackgroundColor({ color: "#00aa00" });

    } catch (e) {
      await chrome.action.setBadgeText({ text: "ERR" });
      await chrome.action.setBadgeBackgroundColor({ color: "#ff0000" });
      console.error("Eagle API error", e);
    }
  })();
  return true;
});

// 右クリックメニュー登録
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "mj-to-eagle",
    title: "Send to Eagle",
    contexts: ["all"]
  });
});

// 右クリックメニュー処理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("[DBG] context menu handler registered");
  if (info.menuItemId !== "mj-to-eagle") return;
  if (!tab?.id || !tab.url || !tab.url.startsWith("http")) return;

  console.log("[DBG] context menu clicked", info, tab?.url);
  try {
    await chrome.tabs.sendMessage(tab.id, {
      type: "CONTEXT_TRIGGER"
    });
    await chrome.action.setBadgeText({ text: "CTX" });
    await chrome.action.setBadgeBackgroundColor({ color: "#00aa00" });
  } catch (e) {
    console.log("[DBG] tabs.sendMessage failed", e);
    await chrome.action.setBadgeText({ text: "ERR" });
    await chrome.action.setBadgeBackgroundColor({ color: "#ff0000" });
  }
});