import { convertBase64ToUint8Array } from './index';
import { VAPID_PUBLIC_KEY } from '../config';
import { subscribePushNotification, unsubscribePushNotification } from '../data/api';

let pushSubscription = null;

const successSubscribeMessage = 'Berhasil melakukan subscribe notifikasi!';
const failureSubscribeMessage = 'Gagal melakukan subscribe notifikasi!';
const successUnsubscribeMessage = 'Berhasil melakukan unsubscribe notifikasi!';
const failureUnsubscribeMessage = 'Gagal melakukan unsubscribe notifikasi!';

function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
}

export async function subscribe() {
  if (!('Notification' in window)) {
    console.error('Browser tidak mendukung notifikasi.');
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.error('Browser tidak mendukung Service Worker.');
    return;
  }

  const result = await Notification.requestPermission();
  if (result === 'denied') {
    console.error('Notifikasi tidak diizinkan.');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    pushSubscription = await registration.pushManager.subscribe(generateSubscribeOptions());

    const { endpoint, keys } = pushSubscription.toJSON();
    const response = await subscribePushNotification({ endpoint, keys });
    
    if (!response.ok) {
      console.error('subscribe: response:', response);
      alert(failureSubscribeMessage);
      await pushSubscription.unsubscribe();
      return;
    }

    alert(successSubscribeMessage);
  } catch (error) {
    console.error('subscribe: error:', error);
    alert(failureSubscribeMessage);
  }
}

export async function unsubscribe() {
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      const response = await unsubscribePushNotification(subscription.endpoint);
      
      if (!response.ok) {
        console.error('unsubscribe: response:', response);
        alert(failureUnsubscribeMessage);
        return;
      }

      await subscription.unsubscribe();
      alert(successUnsubscribeMessage);
    }
  } catch (error) {
    console.error('unsubscribe: error:', error);
    alert(failureUnsubscribeMessage);
  }
}