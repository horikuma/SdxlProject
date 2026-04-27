(() => {
  console.log("[MJ-CLIP] content script loaded");

  // click handler (delegation)
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".mj-clip-btn");
    if (!btn) return;

    console.log("[MJ-CLIP] click detected");

    const card = btn.closest("div");
    if (!card) return;

    const a = card.querySelector('a[href^="/jobs/"]');
    const jobId = a?.href?.split('/jobs/')[1]?.split('?')[0];

    const img = card.querySelector("img");
    const style = img?.getAttribute("style") || "";
    const m = style.match(/\/(\d+_\d+)_\d+_N\.webp/);
    let idx = m ? m[1] : "0_0";

    const bg = img ? getComputedStyle(img).backgroundImage : "";
    const bgUrlMatch = bg.match(/url\(["']?(.*?)["']?\)/);
    const imageUrl = bgUrlMatch?.[1] || img?.currentSrc || img?.src || null;

    console.log("[MJ-CLIP] parsed", { jobId, idx, imageUrl });

    if (!jobId) return;

    chrome.runtime.sendMessage({
      type: "ADD_TO_EAGLE",
      jobId,
      idx,
      imageUrl,
      jobUrl: `https://www.midjourney.com/jobs/${jobId}`
    });
  });

  // inject buttons
  const inject = () => {
    document.querySelectorAll('[draggable="true"]').forEach((card) => {
      if (card.querySelector(".mj-clip-btn")) return;

      const a = card.querySelector('a[href^="/jobs/"]');
      if (!a) return;

      const jobId = a?.href?.split('/jobs/')[1]?.split('?')[0];

      const img = card.querySelector("img");
      const style = img?.getAttribute("style") || "";
      const m = style.match(/\/(\d+_\d+)_\d+_N\.webp/);
      let idx = m ? m[1] : "0_0";


      const btn = document.createElement("button");
      btn.textContent = "E";
      btn.className = "mj-clip-btn";
      btn.style.background = "#0066ff";
      btn.style.color = "#ffffff";
      btn.style.border = "none";
      btn.style.borderRadius = "2px";
      btn.style.width = "20px";
      btn.style.height = "20px";
      btn.style.lineHeight = "20px";
      btn.style.textAlign = "center";
      btn.style.padding = "0";
      btn.style.fontWeight = "bold";

      btn.style.background = "#0066ff";

      btn.style.position = "absolute";
      btn.style.zIndex = 9999;
      btn.style.top = "6px";
      btn.style.right = "6px";
      btn.style.pointerEvents = "auto";
      btn.style.display = "block";

      const cs = window.getComputedStyle(card);
      if (cs.position === "static") {
        card.style.position = "relative";
      }
      card.appendChild(btn);
    });
  };

  const observer = new MutationObserver(() => inject());
  observer.observe(document.body, { childList: true, subtree: true });

  inject();
})();