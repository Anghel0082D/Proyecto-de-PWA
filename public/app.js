// app.js - registra service worker y controla prompt de instalación

// Mostrar splash y luego la app shell
document.addEventListener('DOMContentLoaded', () => {
  const splash = document.getElementById('splash');
  const app = document.getElementById('app');
  setTimeout(() => {
    if (splash) splash.style.display = 'none';
    if (app) app.hidden = false;
  }, 700);
});

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('/service-worker.js');
      console.log('Service Worker registrado: ', reg);
      // Register push subscription if permission granted
      if ('PushManager' in window && Notification.permission === 'granted') {
        try {
          const { publicKey } = await (await fetch('/api/push/public-key')).json();
          const sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(publicKey),
          });
          await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub) });
        } catch (e) {
          console.warn('No se pudo suscribir a push:', e);
        }
      }
    } catch (err) {
      console.error('Registro de Service Worker falló:', err);
    }
  });
}

// Variables globales (solo una vez)
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

// beforeinstallprompt handling (mostrar botón de instalar)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installBtn) {
    installBtn.hidden = false;
  }
});

installBtn?.addEventListener('click', async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  console.log('Resultado prompt de instalación:', choice.outcome);
  deferredPrompt = null;
  installBtn.hidden = true;
});

// mostrar estado online/offline
function updateOnlineStatus() {
  const status = document.getElementById('status');
  if (!status) return;
  status.textContent = navigator.onLine ? 'En línea' : 'Sin conexión (offline)';
}
window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);
updateOnlineStatus();

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}
