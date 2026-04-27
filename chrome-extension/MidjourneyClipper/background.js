console.log("[DBG] background loaded");

// Midjourney → Eagle 連携
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type !== "ADD_TO_EAGLE") return;

    await chrome.action.setBadgeText({ text: "R" });
    await chrome.action.setBadgeBackgroundColor({ color: "#8888ff" });

    const res = await fetch(msg.imageUrl, { method: "HEAD" });
    if (!res.ok) {
      await chrome.action.setBadgeText({ text: "404" });
      await chrome.action.setBadgeBackgroundColor({ color: "#ff0000" });
      return;
    }

    try {
      await chrome.action.setBadgeText({ text: "P" });

      const res = await fetch("http://localhost:41595/api/item/addFromURL", {
        method: "POST",
        headers: {
          "Content-Type": "text/plain"
        },
        body: JSON.stringify({
          url: msg.imageUrl,
          name: `${msg.jobId}`,
          tags: ["midjourney"],
          website: msg.jobUrl
        })
      });

      console.log("[MJ-CLIP] parsed", {msg});

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
