self.addEventListener('install', (event) => {
  const assets = [
    '/image/Box_Inhole.png',
    '/image/Box.png',
    '/image/Down.png',
    '/image/Floor.png',
    '/image/Hole.png',
    '/image/Left.png',
    '/image/Right.png',
    '/image/Up.png',
    '/image/Wall.png',
    '/js/image/image.js',
    '/js/level/gameLevels.js',
    '/js/main.js',
    '/style/style.css',
    '/index.html',
    'https://fonts.googleapis.com/css?family=Mina',
    'https://use.fontawesome.com/releases/v5.0.8/js/all.js',
    'https://code.jquery.com/jquery-3.3.1.min.js'
  ];

  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(caches.match(event.request));
});