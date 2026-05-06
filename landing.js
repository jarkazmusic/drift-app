const UNSPLASH_QUERIES = [
  "cinematic road",
  "dreamy landscape",
  "analog film",
  "misty forest",
  "vintage coast"
];

const randomQuery = UNSPLASH_QUERIES[Math.floor(Math.random() * UNSPLASH_QUERIES.length)];

fetch(
  `https://api.unsplash.com/search/photos?query=${encodeURIComponent(randomQuery)}&per_page=10&orientation=landscape`,
  { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
)
.then(r => r.json())
.then(data => {
  const photos = data.results;
  if (!photos.length) return;
  const photo = photos[Math.floor(Math.random() * photos.length)];
  document.getElementById("bg").style.backgroundImage = `url(${photo.urls.regular})`;
})
.catch(err => console.error(err));

// Intro Animation
setTimeout(() => {
  document.getElementById("line1").classList.add("visible");
}, 400);

setTimeout(() => {
  document.getElementById("line2").classList.add("visible");
}, 900);

setTimeout(() => {
  document.getElementById("line3").classList.add("visible");
}, 1400);

setTimeout(() => {
  document.getElementById("heroTitle").classList.add("visible");
}, 2000);

setTimeout(() => {
  document.getElementById("heroCta").classList.add("visible");
}, 2600);