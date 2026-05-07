let items = [];
let currentIndex = 0;
let isTransitioning = false;

let favorites = JSON.parse(localStorage.getItem("driftFavorites")) || [];
let boards = JSON.parse(localStorage.getItem("driftBoards")) || [];

let currentFilter = "all";
let currentMode = "images";

let autoplayEnabled = false;
let autoplayTimer = null;

const AUTOPLAY_DELAY = 15000;

const FILTERS = {
  all: ["analog landscape", "cinematic nostalgia", "faded road", "dreamy coast", "vintage ocean"],
  "vhs-summer": ["vhs summer", "analog beach", "kodak summer", "faded pool", "retro vacation"],
  "empty-roads": ["empty highway", "lonely road fog", "misty road cinematic", "abandoned street", "road at dawn"],
  "late-night": ["night city rain", "neon reflection", "late night diner", "dark urban cinematic", "city lights fog"],
  "winter-static": ["winter fog", "snow silence", "frozen landscape", "grey winter road", "cold analog"],
  "analog-dreams": ["kodak film grain", "analog photography", "vhs aesthetic", "expired film", "lomography"],
  "still-world": ["vintage objects", "analog desk", "nostalgic room", "old camera still life", "retro interior"],
  "flowers-nature": ["wildflowers analog", "botanical film", "dreamy flowers", "nature close up film", "vintage garden"]
};

const VIDEO_QUERIES = {
  all: ["cinematic landscape", "ambient nature", "dreamy fog", "misty forest", "analog motion"],
  "vhs-summer": ["summer beach waves", "sunny road trip", "warm sunset ocean", "retro summer", "coastal drive"],
  "empty-roads": ["empty highway driving", "foggy road", "lonely road night", "misty mountain road", "abandoned road"],
  "late-night": ["night city rain", "neon lights city", "rainy street night", "dark urban", "city fog night"],
  "winter-static": ["snow falling forest", "winter fog landscape", "frozen lake", "snowy road", "grey winter sky"],
  "analog-dreams": ["film grain texture", "vintage super8", "old film footage", "analog home video", "retro footage"],
  "still-world": ["cozy room ambient", "candle light interior", "vintage objects table", "slow morning coffee", "quiet interior"],
  "flowers-nature": ["flowers slow motion", "nature macro video", "blooming flowers", "forest ambient", "botanical garden"]
};

// FAVORITES

function saveFavorites() {
  localStorage.setItem("driftFavorites", JSON.stringify(favorites));
}

function isFavorite(itemId) { return favorites.includes(itemId); }

function toggleFavorite() {
  const item = getCurrentItem();
  if (!item) return;
  if (isFavorite(item.id)) {
    favorites = favorites.filter(id => id !== item.id);
  } else {
    favorites.push(item.id);
  }
  saveFavorites();
  renderFavoriteButton(item);
  updateFsFavoriteBtn();
  renderFavoritesList();
}

function renderFavoriteButton(item) {
  const btn = document.getElementById("favoriteBtn");
  if (isFavorite(item.id)) {
    btn.textContent = "♥";
    btn.classList.add("is-active");
    btn.setAttribute("data-tip", "Remove favorite");
  } else {
    btn.textContent = "♡";
    btn.classList.remove("is-active");
    btn.setAttribute("data-tip", "Favorite");
  }
}

function updateFsFavoriteBtn() {
  const item = getCurrentItem();
  const btn = document.getElementById("fsFavoriteBtn");
  if (!btn || !item) return;
  btn.textContent = isFavorite(item.id) ? "♥ Favorited" : "♡ Favorite";
  btn.classList.toggle("is-active", isFavorite(item.id));
}

function renderFavoritesList() {
  const favItems = JSON.parse(localStorage.getItem("driftFavoritesData")) || [];
  const ids = JSON.parse(localStorage.getItem("driftFavorites")) || [];
  const validItems = favItems.filter(i => ids.includes(i.id));

  const panelList = document.getElementById("favoritesPanelList");
  if (panelList) {
    panelList.innerHTML = "";
    if (validItems.length === 0) {
      panelList.innerHTML = `<div class="favorites-empty">No favorites yet.<br>Press ♡ on any image.</div>`;
    } else {
      validItems.forEach(item => {
        const div = document.createElement("div");
        div.className = "fav-panel-item";
        div.innerHTML = `
          <div class="fav-panel-thumb"><img src="${item.thumbUrl}" alt="${item.title}"></div>
          <div class="fav-panel-info"><div class="fav-panel-title">${item.title || "Untitled"}</div></div>
          <button class="fav-panel-remove" data-id="${item.id}">✕</button>
        `;
        div.querySelector(".fav-panel-thumb").addEventListener("click", () => {
          const idx = items.findIndex(i => i.id === item.id);
          if (idx !== -1) { currentIndex = idx; renderItem(true); }
        });
        div.querySelector(".fav-panel-remove").addEventListener("click", e => {
          e.stopPropagation();
          favorites = favorites.filter(id => id !== item.id);
          saveFavorites();
          let data = JSON.parse(localStorage.getItem("driftFavoritesData")) || [];
          data = data.filter(i => i.id !== item.id);
          localStorage.setItem("driftFavoritesData", JSON.stringify(data));
          renderFavoritesList();
          const cur = getCurrentItem();
          if (cur) renderFavoriteButton(cur);
        });
        panelList.appendChild(div);
      });
    }
  }
}

function saveFavoriteData(item) {
  let data = JSON.parse(localStorage.getItem("driftFavoritesData")) || [];
  if (!data.find(i => i.id === item.id)) {
    data.unshift({ id: item.id, thumbUrl: item.thumbUrl || item.mediaUrl, title: item.title });
    if (data.length > 50) data = data.slice(0, 50);
    localStorage.setItem("driftFavoritesData", JSON.stringify(data));
  }
}

// BOARDS

function saveBoards() {
  localStorage.setItem("driftBoards", JSON.stringify(boards));
}

function createBoard(name) {
  const board = { id: Date.now().toString(), name: name.trim(), items: [] };
  boards.push(board);
  saveBoards();
  renderBoardsList();
  return board;
}

function renameBoard(boardId, newName) {
  const board = boards.find(b => b.id === boardId);
  if (board && newName.trim()) {
    board.name = newName.trim();
    saveBoards();
    renderBoardsList();
  }
}

function deleteBoard(boardId) {
  boards = boards.filter(b => b.id !== boardId);
  saveBoards();
  renderBoardsList();
}

function saveItemToBoard(boardId) {
  const item = getCurrentItem();
  if (!item) return;
  const board = boards.find(b => b.id === boardId);
  if (!board) return;
  const exists = board.items.find(i => i.id === item.id);
  if (exists) {
    board.items = board.items.filter(i => i.id !== item.id);
  } else {
    board.items.unshift({ id: item.id, thumbUrl: item.thumbUrl || item.mediaUrl, title: item.title, originalUrl: item.originalUrl, type: item.type });
  }
  saveBoards();
  renderBoardsList();
  renderBoardPopupList();
  renderBottomSheetList();
}

function isItemOnBoard(boardId) {
  const item = getCurrentItem();
  if (!item) return false;
  const board = boards.find(b => b.id === boardId);
  return board ? board.items.some(i => i.id === item.id) : false;
}

function renderBoardsList() {
  const list = document.getElementById("boardsList");
  if (!list) return;
  list.innerHTML = "";

  if (boards.length === 0) {
    list.innerHTML = `<p style="font-size:12px;color:var(--faint);text-align:center;padding:24px 0;">No boards yet. Create one to start saving.</p>`;
    return;
  }

  boards.forEach(board => {
    const el = document.createElement("div");
    el.className = "board-item";
    const thumb = board.items[0]?.thumbUrl || "";
    el.innerHTML = `
      <div class="board-item-header">
        <div class="board-item-thumb">${thumb ? `<img src="${thumb}" alt="">` : ""}</div>
        <span class="board-item-name">${board.name}</span>
        <span class="board-item-count">${board.items.length}</span>
      </div>
      <div class="board-items-grid" id="grid-${board.id}"></div>
      <div class="board-item-actions">
        <button class="board-action-btn" data-rename="${board.id}">Rename</button>
        <button class="board-action-btn" data-delete="${board.id}">Delete</button>
      </div>
    `;

    const grid = el.querySelector(`#grid-${board.id}`);
    board.items.slice(0, 6).forEach(item => {
      const t = document.createElement("div");
      t.className = "board-grid-thumb";
      t.innerHTML = `<img src="${item.thumbUrl}" alt="${item.title}">`;
      grid.appendChild(t);
    });

    el.querySelector(`[data-rename="${board.id}"]`).addEventListener("click", e => {
      e.stopPropagation();
      const n = prompt("New board name:", board.name);
      if (n) renameBoard(board.id, n);
    });

    el.querySelector(`[data-delete="${board.id}"]`).addEventListener("click", e => {
      e.stopPropagation();
      if (confirm(`Delete "${board.name}"?`)) deleteBoard(board.id);
    });

    list.appendChild(el);
  });
}

function renderBoardPopupList() {
  const list = document.getElementById("boardPopupList");
  if (!list) return;
  list.innerHTML = "";
  if (boards.length === 0) {
    list.innerHTML = `<p style="font-size:12px;color:var(--faint);text-align:center;padding:16px 0;">No boards yet.</p>`;
    return;
  }
  boards.forEach(board => {
    const saved = isItemOnBoard(board.id);
    const thumb = board.items[0]?.thumbUrl || "";
    const el = document.createElement("div");
    el.className = `board-popup-item${saved ? " is-saved" : ""}`;
    el.innerHTML = `
      <div class="board-popup-item-thumb">${thumb ? `<img src="${thumb}" alt="">` : ""}</div>
      <span class="board-popup-item-name">${board.name}</span>
      <span class="board-popup-item-count">${board.items.length}</span>
      ${saved ? "<span style='font-size:11px;color:var(--warm)'>✓</span>" : ""}
    `;
    el.addEventListener("click", () => saveItemToBoard(board.id));
    list.appendChild(el);
  });
}

function renderBottomSheetList() {
  const list = document.getElementById("bottomSheetList");
  if (!list) return;
  list.innerHTML = "";
  if (boards.length === 0) {
    list.innerHTML = `<p style="font-size:12px;color:var(--faint);text-align:center;padding:16px 0;">No boards yet.</p>`;
    return;
  }
  boards.forEach(board => {
    const saved = isItemOnBoard(board.id);
    const thumb = board.items[0]?.thumbUrl || "";
    const el = document.createElement("div");
    el.className = `board-popup-item${saved ? " is-saved" : ""}`;
    el.innerHTML = `
      <div class="board-popup-item-thumb">${thumb ? `<img src="${thumb}" alt="">` : ""}</div>
      <span class="board-popup-item-name">${board.name}</span>
      <span class="board-popup-item-count">${board.items.length}</span>
      ${saved ? "<span style='font-size:11px;color:var(--warm)'>✓</span>" : ""}
    `;
    el.addEventListener("click", () => saveItemToBoard(board.id));
    list.appendChild(el);
  });
}

function openBoardPopup() { renderBoardPopupList(); document.getElementById("boardPopupOverlay").classList.add("is-open"); document.getElementById("boardPopup").classList.add("is-open"); }
function closeBoardPopup() { document.getElementById("boardPopupOverlay").classList.remove("is-open"); document.getElementById("boardPopup").classList.remove("is-open"); }
function openBottomSheet() { renderBottomSheetList(); document.getElementById("bottomSheetOverlay").classList.add("is-open"); document.getElementById("bottomSheet").classList.add("is-open"); }
function closeBottomSheet() { document.getElementById("bottomSheetOverlay").classList.remove("is-open"); document.getElementById("bottomSheet").classList.remove("is-open"); }

function openSaveUI() {
  if (window.innerWidth <= 700) { openBottomSheet(); } else { openBoardPopup(); }
}

function openInfoSheet() {
  const item = getCurrentItem();
  if (!item) return;
  document.getElementById("infoSourceIcon").textContent = item.sourceName.charAt(0);
  document.getElementById("infoSourceName").textContent = item.sourceName;
  document.getElementById("infoSourceAuthor").textContent = `By ${item.authorName}`;
  document.getElementById("infoAuthorLink").href = item.authorUrl;
  document.getElementById("infoLicenseName").textContent = item.licenseName;
  document.getElementById("infoLicenseLink").href = item.licenseUrl;

  const infoDetails = document.getElementById("infoDetails");
  infoDetails.innerHTML = "";
  item.details.forEach(detail => {
    const el = document.createElement("div");
    el.className = "detail";
    el.textContent = detail;
    infoDetails.appendChild(el);
  });

  document.getElementById("infoSheetOverlay").classList.add("is-open");
  document.getElementById("infoSheet").classList.add("is-open");
}

function closeInfoSheet() {
  document.getElementById("infoSheetOverlay").classList.remove("is-open");
  document.getElementById("infoSheet").classList.remove("is-open");
}

// LOAD

async function loadItems(filter = "all") {
  try {
    currentFilter = filter;
    if (currentMode === "video") { await loadPexelsVideos(filter); return; }

    const filterQueries = FILTERS[filter];
    const randomQuery = filterQueries[Math.floor(Math.random() * filterQueries.length)];
    const randomPage = Math.floor(Math.random() * 8) + 1;
    const useUnsplash = Math.random() > 0.4;

    if (useUnsplash) {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(randomQuery)}&per_page=18&page=${randomPage}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
      );
      const data = await response.json();
      items = data.results.map(photo => ({
        id: photo.id,
        title: photo.alt_description || photo.description || "Untitled Drift",
        type: "image",
        mediaUrl: photo.urls.regular,
        thumbUrl: photo.urls.small,
        originalUrl: photo.links.html,
        authorName: photo.user.name,
        authorUrl: photo.user.links.html,
        sourceName: "Unsplash",
        licenseName: "Unsplash License",
        licenseUrl: "https://unsplash.com/license",
        year: photo.created_at ? new Date(photo.created_at).getFullYear() : "—",
        tags: photo.tags?.slice(0, 5).map(tag => tag.title) || [],
        details: [`◌ Curated via ${randomQuery}`, "▣ External source linked", "⌖ Creator credited"]
      }));
    } else {
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(randomQuery)}&per_page=18&page=${randomPage}&orientation=landscape`,
        { headers: { Authorization: PEXELS_API_KEY } }
      );
      const data = await response.json();
      items = data.photos.map(photo => ({
        id: String(photo.id),
        title: photo.alt || "Untitled Drift",
        type: "image",
        mediaUrl: photo.src.large,
        thumbUrl: photo.src.medium,
        originalUrl: photo.url,
        authorName: photo.photographer,
        authorUrl: photo.photographer_url,
        sourceName: "Pexels",
        licenseName: "Pexels License",
        licenseUrl: "https://www.pexels.com/license/",
        year: "—",
        tags: [],
        details: [`◌ Curated via ${randomQuery}`, "▣ External source linked", "⌖ Creator credited"]
      }));
    }

    currentIndex = 0;
    renderItem(false);
    renderMoreLikeThis();
  } catch (error) { console.error("Failed loading Drift stream:", error); }
}

async function loadPexelsVideos(filter = "all") {
  try {
    const queries = VIDEO_QUERIES[filter] || VIDEO_QUERIES.all;
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    const randomPage = Math.floor(Math.random() * 5) + 1;

    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(randomQuery)}&per_page=18&page=${randomPage}&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await response.json();

    items = data.videos.map(video => {
      const file = video.video_files.find(f => f.quality === "hd") || video.video_files[0];
      const thumb = video.video_pictures?.[0]?.picture || "";
      return {
        id: String(video.id),
        title: randomQuery,
        type: "video",
        mediaUrl: file.link,
        thumbUrl: thumb,
        originalUrl: video.url,
        authorName: video.user.name,
        authorUrl: video.user.url,
        sourceName: "Pexels",
        licenseName: "Pexels License",
        licenseUrl: "https://www.pexels.com/license/",
        year: new Date(video.created_at || Date.now()).getFullYear(),
        tags: [],
        details: [`◌ Curated via ${randomQuery}`, "▣ External source linked", "⌖ Creator credited"]
      };
    });

    currentIndex = 0;
    renderItem(false);
    renderMoreLikeThis();
  } catch (error) { console.error("Failed loading Pexels videos:", error); }
}

function getCurrentItem() { return items[currentIndex]; }

function renderItem(animate = true) {
  const item = getCurrentItem();
  if (!item) return;
  if (animate) {
    const mainImage = document.getElementById("mainImage");
    mainImage.classList.add("is-fading");
    setTimeout(() => { updateContent(item); mainImage.classList.remove("is-fading"); }, 220);
  } else {
    updateContent(item);
  }
}

function updateContent(item) {
  const mainImage = document.getElementById("mainImage");
  const mainVideo = document.getElementById("mainVideo");

  if (item.type === "video") {
    mainImage.style.display = "none";
    mainVideo.style.display = "block";
    mainVideo.src = item.mediaUrl;
    mainVideo.play();
  } else {
    mainVideo.style.display = "none";
    mainVideo.src = "";
    mainImage.style.display = "block";
    mainImage.src = item.mediaUrl;
    mainImage.alt = item.title;
  }

  document.getElementById("sourceLink").href = item.originalUrl;
  document.getElementById("mediaType").textContent = item.type === "video" ? "Video" : "Image";
  document.getElementById("itemTitle").textContent = item.title;
  document.getElementById("itemYear").textContent = item.year || "—";
  document.getElementById("sourceIcon").textContent = item.sourceName.charAt(0);
  document.getElementById("sourceName").textContent = item.sourceName;
  document.getElementById("sourceAuthor").textContent = `By ${item.authorName}`;
  document.getElementById("authorLink").href = item.authorUrl;
  document.getElementById("licenseName").textContent = item.licenseName;
  document.getElementById("licenseLink").href = item.licenseUrl;

  if (document.getElementById("fullscreenOverlay").classList.contains("is-open")) updateFullscreen(item);

  renderTags(item);
  renderDetails(item);
  renderFavoriteButton(item);
}

function updateFullscreen(item) {
  const fsImage = document.getElementById("fsImage");
  const fsVideo = document.getElementById("fsVideo");

  if (item.type === "video") {
    fsImage.style.display = "none";
    fsVideo.style.display = "block";
    fsVideo.src = item.mediaUrl;
    fsVideo.play();
  } else {
    fsVideo.style.display = "none";
    fsVideo.src = "";
    fsImage.style.display = "block";
    fsImage.src = item.mediaUrl;
    fsImage.alt = item.title;
  }

  document.getElementById("fsSourceLink").href = item.originalUrl;
  updateFsFavoriteBtn();
}

function openFullscreen() {
  const item = getCurrentItem();
  if (!item) return;
  document.getElementById("fullscreenOverlay").classList.add("is-open");
  updateFullscreen(item);
  document.body.style.overflow = "hidden";
}

function closeFullscreen() {
  document.getElementById("fullscreenOverlay").classList.remove("is-open");
  document.body.style.overflow = "";
  const fsVideo = document.getElementById("fsVideo");
  fsVideo.pause();
  fsVideo.src = "";
}

function renderTags(item) {
  const tags = document.getElementById("tags");
  tags.innerHTML = "";
  item.tags.forEach(tag => {
    const el = document.createElement("div");
    el.className = "tag";
    el.textContent = tag;
    tags.appendChild(el);
  });
  const addTag = document.createElement("div");
  addTag.className = "tag";
  addTag.textContent = "+";
  tags.appendChild(addTag);
}

function renderDetails(item) {
  const details = document.getElementById("details");
  details.innerHTML = "";
  item.details.forEach(detail => {
    const el = document.createElement("div");
    el.className = "detail";
    el.textContent = detail;
    details.appendChild(el);
  });
}

function renderMoreLikeThis() {
  const moreRow = document.getElementById("moreRow");
  moreRow.innerHTML = "";
  items.slice(0, 10).forEach((item, index) => {
    const thumb = document.createElement("div");
    thumb.className = "thumb";
    thumb.innerHTML = `<img src="${item.thumbUrl || item.mediaUrl}" alt="${item.title}">`;
    thumb.addEventListener("click", () => { currentIndex = index; renderItem(true); resetAutoplayTimer(); });
    moreRow.appendChild(thumb);
  });
}

function nextItem() {
  if (isTransitioning) return;
  isTransitioning = true;
  currentIndex++;
  if (currentIndex >= items.length) currentIndex = 0;
  renderItem(true);
  setTimeout(() => { isTransitioning = false; }, 450);
}

function previousItem() {
  if (isTransitioning) return;
  isTransitioning = true;
  currentIndex--;
  if (currentIndex < 0) currentIndex = items.length - 1;
  renderItem(true);
  setTimeout(() => { isTransitioning = false; }, 450);
}

function startAutoplay() { stopAutoplay(); autoplayTimer = setInterval(() => { nextItem(); }, AUTOPLAY_DELAY); }
function stopAutoplay() { if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; } }
function resetAutoplayTimer() { if (autoplayEnabled) startAutoplay(); }

function toggleAutoplay() {
  autoplayEnabled = !autoplayEnabled;
  [document.getElementById("autoplayToggle"), document.getElementById("fsAmbientBtn"), document.getElementById("autoplayToggleMobile")]
    .forEach(b => { if (b) b.classList.toggle("is-active", autoplayEnabled); });
  if (autoplayEnabled) { startAutoplay(); } else { stopAutoplay(); }
}

// EVENT LISTENERS

document.getElementById("nextBtn").addEventListener("click", () => { nextItem(); resetAutoplayTimer(); });
document.getElementById("prevBtn").addEventListener("click", () => { previousItem(); resetAutoplayTimer(); });
document.getElementById("infoBtn").addEventListener("click", () => { if (window.innerWidth <= 700) openInfoSheet(); });
document.getElementById("favoriteBtn").addEventListener("click", () => {
  const item = getCurrentItem();
  if (item) saveFavoriteData(item);
  toggleFavorite();
});
document.getElementById("autoplayToggle").addEventListener("click", toggleAutoplay);
document.getElementById("mediaLink").addEventListener("click", openFullscreen);
document.getElementById("saveBtn").addEventListener("click", openSaveUI);
document.getElementById("fsClose").addEventListener("click", closeFullscreen);
document.getElementById("fsNextBtn").addEventListener("click", () => { nextItem(); resetAutoplayTimer(); });
document.getElementById("fsPrevBtn").addEventListener("click", () => { previousItem(); resetAutoplayTimer(); });
document.getElementById("fsFavoriteBtn").addEventListener("click", () => {
  const item = getCurrentItem();
  if (item) saveFavoriteData(item);
  toggleFavorite();
});
document.getElementById("fsSaveBtn").addEventListener("click", openSaveUI);
document.getElementById("fsAmbientBtn").addEventListener("click", toggleAutoplay);

document.getElementById("boardPopupOverlay").addEventListener("click", closeBoardPopup);
document.getElementById("boardPopupClose").addEventListener("click", closeBoardPopup);
document.getElementById("boardPopupCreate").addEventListener("click", () => {
  const input = document.getElementById("boardPopupInput");
  if (input.value.trim()) { createBoard(input.value); input.value = ""; renderBoardPopupList(); }
});

document.getElementById("bottomSheetOverlay").addEventListener("click", closeBottomSheet);
document.getElementById("bottomSheetClose").addEventListener("click", closeBottomSheet);
document.getElementById("bottomSheetCreate").addEventListener("click", () => {
  const input = document.getElementById("bottomSheetInput");
  if (input.value.trim()) { createBoard(input.value); input.value = ""; renderBottomSheetList(); }
});

document.getElementById("infoSheetOverlay").addEventListener("click", closeInfoSheet);
document.getElementById("infoSheetClose").addEventListener("click", closeInfoSheet);

document.getElementById("newBoardBtn").addEventListener("click", () => {
  const name = prompt("Board name:");
  if (name) createBoard(name);
});

document.querySelectorAll(".inspector-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".inspector-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    const target = tab.dataset.tab;
    document.getElementById("panelInfo").classList.toggle("is-hidden", target !== "info");
    document.getElementById("panelBoards").classList.toggle("is-hidden", target !== "boards");
    document.getElementById("panelFavorites").classList.toggle("is-hidden", target !== "favorites");
    if (target === "favorites") renderFavoritesList();
  });
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape") { closeFullscreen(); closeBoardPopup(); closeBottomSheet(); closeInfoSheet(); }
  if (event.key.toLowerCase() === "n" || event.key === "ArrowRight") { nextItem(); resetAutoplayTimer(); }
  if (event.key === "ArrowLeft") { previousItem(); resetAutoplayTimer(); }
  if (event.key.toLowerCase() === "f") {
    const item = getCurrentItem();
    if (item) saveFavoriteData(item);
    toggleFavorite();
  }
  if (event.key.toLowerCase() === "a") toggleAutoplay();
  if (event.key.toLowerCase() === "s") openSaveUI();
});

document.querySelectorAll(".filter").forEach(filterButton => {
  filterButton.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(f => f.classList.remove("active"));
    filterButton.classList.add("active");
    loadItems(filterButton.dataset.filter);
    resetAutoplayTimer();
  });
});

document.querySelectorAll(".media-toggle-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".media-toggle-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    currentMode = btn.dataset.mode;
    loadItems(currentFilter);
  });
});

const hamburgerBtn = document.getElementById("hamburgerBtn");
const mobileDrawer = document.getElementById("mobileDrawer");
const drawerOverlay = document.getElementById("drawerOverlay");
const drawerClose = document.getElementById("drawerClose");

function openDrawer() { mobileDrawer.classList.add("is-open"); drawerOverlay.classList.add("is-open"); }
function closeDrawer() { mobileDrawer.classList.remove("is-open"); drawerOverlay.classList.remove("is-open"); }

if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

document.querySelectorAll(".mobile-drawer .filter").forEach(filterButton => {
  filterButton.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach(f => f.classList.remove("active"));
    filterButton.classList.add("active");
    const label = filterButton.textContent.trim();
    const mobileLabel = document.getElementById("mobileCurrentFilter");
    if (mobileLabel) mobileLabel.textContent = label;
    loadItems(filterButton.dataset.filter);
    resetAutoplayTimer();
    closeDrawer();
  });
});

const autoplayToggleMobile = document.getElementById("autoplayToggleMobile");
if (autoplayToggleMobile) autoplayToggleMobile.addEventListener("click", toggleAutoplay);

renderBoardsList();
renderFavoritesList();
loadItems();