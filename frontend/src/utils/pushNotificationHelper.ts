import axios from 'axios';
import { API_BASE_URL } from './api';

/**
 * Konversi string VAPID Public Key base64url ke Uint8Array.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Memeriksa apakah browser mendukung Web Push Notification dan Service Worker.
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

/**
 * Meminta izin dari user untuk menampilkan notifikasi.
 */
export async function askNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    throw new Error('Browser ini tidak mendukung notifikasi.');
  }
  return await Notification.requestPermission();
}

/**
 * Mendaftarkan Service Worker dan mengembalikan registrasinya.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!isPushNotificationSupported()) {
    throw new Error('Service Worker/Push tidak didukung.');
  }
  return await navigator.serviceWorker.register('/sw.js');
}

/**
 * Melakukan subscription perangkat ke Push Service browser dan mengirimkannya ke Backend.
 */
export async function subscribeUserToPush(token: string, vapidPublicKey: string): Promise<any> {
  const registration = await registerServiceWorker();
  
  // Pastikan service worker aktif
  await navigator.serviceWorker.ready;

  // Cek apakah sudah ada subscription aktif di browser
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey as any
    });
  }

  // Kirim data subscription ke backend Laravel
  const response = await axios.post(
    `${API_BASE_URL}/api/push-subscriptions`,
    subscription.toJSON(),
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
}

/**
 * Membatalkan subscription perangkat ini dan menghapusnya dari Backend.
 */
export async function unsubscribeUserFromPush(token: string): Promise<any> {
  if (!isPushNotificationSupported()) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const endpoint = subscription.endpoint;
    
    // Unsubscribe di sisi browser
    await subscription.unsubscribe();

    // Hapus di backend
    const response = await axios.post(
      `${API_BASE_URL}/api/push-subscriptions/unsubscribe`,
      { endpoint },
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    return response.data;
  }
}

/**
 * Mengambil status subscription saat ini di browser.
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) return null;
  const registration = await navigator.serviceWorker.ready;
  return await registration.pushManager.getSubscription();
}
