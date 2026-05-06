let items = [];
let currentIndex = 0;
let isTransitioning = false;

let favorites = JSON.parse(localStorage.getItem("driftFavorites")) || [];

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
  "still-world": ["vintage objects", "analog desk", "nostalgic room", "old camera still life", "retro interior"]
};

const VIDEO_QUERIES = {
  all: ["cinematic landscape", "ambient nature", "dreamy fog", "misty forest", "analog motion"],
  "vhs-summer": ["summer beach waves", "sunny road trip", "warm sunset ocean", "retro summer", "coastal drive"],
  "empty-roads": ["empty highway driving", "foggy road", "lonely road night", "misty mountain road", "abandoned road"],
  "late-night": ["night city rain", "neon lights city", "rainy street night", "dark urban", "city fog night"],
  "winter-static": ["snow falling forest", "winter fog landscape", "frozen lake", "snowy road", "grey winter sky"],
  "analog-dreams": ["film grain texture", "vintage super8", "old film footage", "analog home video", "retro footage"],
  "still-world": ["cozy room ambient", "candle light interior", "vintage objects table", "slow morning coffee", "quiet interior"]
};

async function loadItems(filter = "all") {
  try {
    currentFilter = filter;
    if (currentMode === "video") { await loadPexelsVideos(filter); return; }

    const filterQueries = FILTERS[filter];
    const randomQuery = filterQueries[Math.floor(Math.random() * filterQueries.length)];

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(randomQuery)}&per_page=18&orientation=landscape`,
      { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
    );

    const data = await response.json();

    items = data.results.map((photo) => ({
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
      tags: photo.tags?.slice(0, 5).map((tag) => tag.title) || [],
      details: [`◌ Curated via ${randomQuery}`, "▣ External source linked", "⌖ Creator credited"]
    }));

    currentIndex = 0;
    renderItem(false);
    renderMoreLikeThis();
  } catch (error) { console.error("Failed loading Drift stream:", error); }
}

async function loadPexelsVideos(filter = "all") {
  try {
    const queries = VIDEO_QUERIES[filter] || VIDEO_QUERIES.all;
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];

    const response = await fetch(
      `https://api.pexels.com/videos/search?query=${encodeURIComponent(randomQuery)}&per_page=18&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    const data = await response.json();

    items = data.videos.map((video) => {
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

function saveFavorites() {
  localStorage.setItem("driftFavorites", JSON.stringify(favorites));
}

function isFavorite(itemId) { return favorites.includes(itemId); }

function toggleFavorite() {
  const item = getCurrentItem();
  if (!item) return;
  if (isFavorite(item.id)) {
    favorites = favorites.filter((id) => id !== item.id);
  } else {
    favorites.push(item.id);
  }
  saveFavorites();
  renderFavoriteButton(item);
  updateFsFavoriteBtn();
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

function renderItem(animate = true) {
  const item = getCurrentItem();
  if (!item) return;

  if (animate) {
    const mainImage = document.getElementById("mainImage");
    mainImage.classList.add("is-fading");
    setTimeout(() => {
      updateContent(item);
      mainImage.classList.remove("is-fading");
    }, 220);
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

  if (document.getElementById("fullscreenOverlay").classList.contains("is-open")) {
    updateFullscreen(item);
  }

  renderTags(item);
  renderDetails(item);
  renderFavoriteButton(item);
}

function updateFullscreen(item) {
  const fsImage = document.getElementById("fsImage");
  const fsVideo = document.getElementById("fsVideo");
  const fsSourceLink = document.getElementById("fsSourceLink");

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

  fsSourceLink.href = item.originalUrl;
  updateFsFavoriteBtn();
}

function openFullscreen() {
  const item = getCurrentItem();
  if (!item) return;
  const overlay = document.getElementById("fullscreenOverlay");
  overlay.classList.add("is-open");
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
  item.tags.forEach((tag) => {
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
  item.details.forEach((detail) => {
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
    thumb.addEventListener("click", () => {
      currentIndex = index;
      renderItem(true);
      resetAutoplayTimer();
    });
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

function shuffleItem() {
  if (items.length <= 1) return;
  let randomIndex = currentIndex;
  while (randomIndex === currentIndex) {
    randomIndex = Math.floor(Math.random() * items.length);
  }
  currentIndex = randomIndex;
  renderItem(true);
}

function startAutoplay() {
  stopAutoplay();
  autoplayTimer = setInterval(() => { nextItem(); }, AUTOPLAY_DELAY);
}

function stopAutoplay() {
  if (autoplayTimer) { clearInterval(autoplayTimer); autoplayTimer = null; }
}

function resetAutoplayTimer() {
  if (autoplayEnabled) startAutoplay();
}

function toggleAutoplay() {
  autoplayEnabled = !autoplayEnabled;
  const btn = document.getElementById("autoplayToggle");
  const fsBtn = document.getElementById("fsAmbientBtn");
  const mobileBtn = document.getElementById("autoplayToggleMobile");

  [btn, fsBtn, mobileBtn].forEach(b => {
    if (b) b.classList.toggle("is-active", autoplayEnabled);
  });

  if (autoplayEnabled) { startAutoplay(); } else { stopAutoplay(); }
}

document.getElementById("nextBtn").addEventListener("click", () => { nextItem(); resetAutoplayTimer(); });
document.getElementById("prevBtn").addEventListener("click", () => { previousItem(); resetAutoplayTimer(); });
document.getElementById("shuffleBtn").addEventListener("click", () => { shuffleItem(); resetAutoplayTimer(); });
document.getElementById("favoriteBtn").addEventListener("click", toggleFavorite);
document.getElementById("autoplayToggle").addEventListener("click", toggleAutoplay);

document.getElementById("mediaLink").addEventListener("click", openFullscreen);

document.getElementById("fsClose").addEventListener("click", closeFullscreen);
document.getElementById("fsNextBtn").addEventListener("click", () => { nextItem(); resetAutoplayTimer(); });
document.getElementById("fsPrevBtn").addEventListener("click", () => { previousItem(); resetAutoplayTimer(); });
document.getElementById("fsFavoriteBtn").addEventListener("click", toggleFavorite);
document.getElementById("fsAmbientBtn").addEventListener("click", toggleAutoplay);

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeFullscreen();
  if (event.key.toLowerCase() === "n" || event.key === "ArrowRight") { nextItem(); resetAutoplayTimer(); }
  if (event.key === "ArrowLeft") { previousItem(); resetAutoplayTimer(); }
  if (event.key.toLowerCase() === "f") toggleFavorite();
  if (event.key.toLowerCase() === "a") toggleAutoplay();
});

document.querySelectorAll(".filter").forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((f) => f.classList.remove("active"));
    filterButton.classList.add("active");
    loadItems(filterButton.dataset.filter);
    resetAutoplayTimer();
  });
});

document.querySelectorAll(".media-toggle-btn").forEach((btn) => {
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

function openDrawer() {
  mobileDrawer.classList.add("is-open");
  drawerOverlay.classList.add("is-open");
}

function closeDrawer() {
  mobileDrawer.classList.remove("is-open");
  drawerOverlay.classList.remove("is-open");
}

if (hamburgerBtn) hamburgerBtn.addEventListener("click", openDrawer);
if (drawerClose) drawerClose.addEventListener("click", closeDrawer);
if (drawerOverlay) drawerOverlay.addEventListener("click", closeDrawer);

document.querySelectorAll(".mobile-drawer .filter").forEach((filterButton) => {
  filterButton.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((f) => f.classList.remove("active"));
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
if (autoplayToggleMobile) {
  autoplayToggleMobile.addEventListener("click", toggleAutoplay);
}

loadItems();