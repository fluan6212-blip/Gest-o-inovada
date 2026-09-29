// ============================================================
// SERVICE WORKER — GESTÃO REBANHO PRO
// ============================================================

// IMPORTANTE:
// Sempre que publicar uma nova versão importante do aplicativo,
// altere o número da versão abaixo.
// Exemplo: v1 -> v2 -> v3
const CACHE_NAME = 'rebanho-pro-v8-7';

const ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icone-192.png',
    './icone-512.png'
];


// ============================================================
// INSTALAÇÃO
// ============================================================

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
            .then(() => self.skipWaiting())
    );
});


// ============================================================
// ATIVAÇÃO
// Remove versões antigas do cache
// ============================================================

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys
                        .filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});


// ============================================================
// BUSCA DE ARQUIVOS
// ============================================================

self.addEventListener('fetch', event => {

    const request = event.request;

    // Só trabalha com requisições GET
    if (request.method !== 'GET') {
        return;
    }

    // Para páginas HTML:
    // tenta buscar a versão mais recente na internet.
    // Se estiver sem internet, usa a versão salva no cache.
    if (request.mode === 'navigate') {

        event.respondWith(
            fetch(request)
                .then(response => {

                    if (response && response.ok) {
                        const responseClone = response.clone();

                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(request, responseClone);
                        });
                    }

                    return response;
                })
                .catch(() => {
                    return caches.match('./index.html');
                })
        );

        return;
    }


    // Para os demais arquivos:
    // tenta primeiro o cache.
    // Se não existir, busca na internet e salva no cache.

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {

                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(request)
                    .then(response => {

                        if (
                            response &&
                            response.status === 200 &&
                            response.type === 'basic'
                        ) {

                            const responseClone = response.clone();

                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(request, responseClone);
                            });
                        }

                        return response;
                    });
            })
    );
});