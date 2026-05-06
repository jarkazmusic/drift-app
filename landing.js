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