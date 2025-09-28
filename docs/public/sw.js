// Service Worker to add COOP/COEP headers for SharedArrayBuffer support
// This is a workaround for GitHub Pages which doesn't support custom headers

self.addEventListener('fetch', (event) => {
  // Only handle requests for this origin
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request).then((response) => {
      // Clone the response to modify headers
      const newResponse = new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: {
          ...Object.fromEntries(response.headers.entries()),
          'Cross-Origin-Embedder-Policy': 'require-corp',
          'Cross-Origin-Opener-Policy': 'same-origin'
        }
      });

      return newResponse;
    }).catch((error) => {
      console.error('Service Worker fetch failed:', error);
      return fetch(event.request);
    })
  );
});

self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing for SharedArrayBuffer support');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated for SharedArrayBuffer support');
  event.waitUntil(self.clients.claim());
});