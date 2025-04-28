import { Workbox } from 'workbox-window';
import { showSuccessMessage, showErrorMessage, showNotification } from './ui-utils';

const VAPID_PUBLIC_KEY = 'BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk';

const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.error('Service Worker not supported in the browser');
    return;
  }

  const wb = new Workbox('/sw.bundle.js');

  try {
    await wb.register();
    console.log('Service worker registered successfully');

    wb.active.then(async (worker) => {
        console.log('Service worker active.');
        setupPushNotification(worker);
    });

    wb.addEventListener('waiting', () => {
      console.log('New service worker waiting to activate.');
      showNotification('Update baru tersedia. Muat ulang halaman untuk mengaktifkan.', 'info', 10000);
    });

    wb.addEventListener('controlling', () => {
        console.log('Service worker has taken control.');
    });

  } catch (error) {
    console.error('Failed to register service worker:', error);
  }
};

const setupPushNotification = async (worker) => {
  if (!('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }
  if (!('Notification' in window)) {
    console.warn('Notification API is not supported');
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    console.warn('Notification permission was not granted.');
    return;
  }
  console.log('Notification permission granted.');

  const registration = await navigator.serviceWorker.ready;
  if (!registration.pushManager) {
     console.error("PushManager not available on registration");
     return;
  }

  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    console.log('No push subscription found, subscribing...');
    try {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('User is subscribed:', subscription);
      showSuccessMessage('Berhasil berlangganan notifikasi!');
    } catch (error) {
      console.error('Failed to subscribe the user: ', error);
      showErrorMessage(`Gagal berlangganan notifikasi: ${error.message}`);
    }
  } else {
    console.log('User IS already subscribed.');
  }
};

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

export default registerServiceWorker;