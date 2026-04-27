console.log("[DBG] background loaded");

const listEagleItemsByKeyword = async (keyword) => {
  const params = new URLSearchParams({
    keyword,
    limit: "1"
  });

  const res = await fetch(`http://localhost:41595/api/item/list?${params}`);
  return res.json();
};

const hasDownloadedJob = async (jobId) => {
  const result = await listEagleItemsByKeyword(jobId);
  return Array.isArray(result?.data) && result.data.length > 0;
};

const addToEagle = async (msg) => {
  await chrome.action.setBadgeText({ text: "R" });
  await chrome.action.setBadgeBackgroundColor({ color: "#8888ff" });

  const headRes = await fetch(msg.imageUrl, { method: "HEAD" });
  if (!headRes.ok) {
    await chrome.action.setBadgeText({ text: "404" });
    await chrome.action.setBadgeBackgroundColor({ color: "#ff0000" });
    return;
  }

  try {
    await chrome.action.setBadgeText({ text: "P" });

    await fetch("http://localhost:41595/api/item/addFromURL", {
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
};

// Midjourney → Eagle 連携
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg.type === "CHECK_EAGLE_ITEM") {
      const downloaded = await hasDownloadedJob(msg.jobId);
      sendResponse({ downloaded });
      return;
    }

    if (msg.type === "ADD_TO_EAGLE") {
      await addToEagle(msg);
    }
  })().catch((e) => {
    console.error("[MJ-CLIP] message handler error", e);
    sendResponse({ downloaded: false, error: String(e) });
  });
  return true;
});
