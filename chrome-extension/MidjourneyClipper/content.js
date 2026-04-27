(() => {
  console.log("[MJ-CLIP] content script loaded");

  const parseMidjourneyImage = (backgroundImage) => {
    const urlMatch = backgroundImage.match(
      /https:\/\/cdn\.midjourney\.com\/[^/]+\/\d+_\d+_\d+_N\.webp/
    );

    if (!urlMatch) return null;

    const sourceUrl = urlMatch[0];
    const idxMatch = sourceUrl.match(/\/(\d+_\d+)_\d+_N\.webp$/);

    if (!idxMatch) return null;

    const [, idx] = idxMatch;

    return {
      idx,
      imageUrl: sourceUrl.replace(/_\d+_N\.webp$/, ".png")
    };
  };

  const checkDownloaded = (jobId) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(
        {
          type: "CHECK_EAGLE_ITEM",
          jobId
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.warn("[MJ-CLIP] failed to check Eagle item", chrome.runtime.lastError);
            resolve(false);
            return;
          }

          resolve(Boolean(response?.downloaded));
        }
      );
    });
  };

  // click handler (delegation)
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest(".mj-clip-btn");
    if (!btn) return;

    console.log("[MJ-CLIP] click detected");

    const card = btn.closest("div");
    if (!card) return;

    const a = card.querySelector('a[href^="/jobs/"]');
    const jobId = a?.href?.split('/jobs/')[1]?.split('?')[0];

    const img = getComputedStyle(a).backgroundImage;
    const parsed = parseMidjourneyImage(img);
    const idx = parsed?.idx || "0_0";
    const imageUrl = parsed?.imageUrl || null;

    console.log("[MJ-CLIP] parsed", { card, jobId, idx, imageUrl });

    if (!jobId) return;

    chrome.runtime.sendMessage({
      type: "ADD_TO_EAGLE",
      jobId,
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
      if (!jobId) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = "E";
      btn.className = "mj-clip-btn";

      const cs = window.getComputedStyle(card);
      if (cs.position === "static") {
        card.classList.add("mj-clip-card");
      }
      card.appendChild(btn);

      checkDownloaded(jobId).then((downloaded) => {
        if (downloaded) {
          btn.classList.add("mj-clip-btn--downloaded");
        }
      });
    });
  };

  const observer = new MutationObserver(() => inject());
  observer.observe(document.body, { childList: true, subtree: true });

  inject();
})();
