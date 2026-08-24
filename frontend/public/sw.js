self.addEventListener('push', function(event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body || 'Ada pengingat penting untuk Anda.',
        icon: data.icon || '/pwa/icon-192.png',
        badge: data.badge || '/pwa/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
          url: data.url || '/employee/dashboard'
        },
        actions: [
          {
            action: 'open',
            title: 'Buka Aplikasi'
          }
        ]
      };

      event.waitUntil(
        self.registration.showNotification(data.title || 'Absensi Karyawan', options)
      );
    } catch (e) {
      console.error('Error parsing push data:', e);
      // Fallback jika payload bukan JSON
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('Absensi Karyawan', {
          body: text,
          vibrate: [100, 50, 100],
          data: {
            url: '/employee/dashboard'
          }
        })
      );
    }
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  const targetUrl = event.notification.data && event.notification.data.url 
    ? event.notification.data.url 
    : '/employee/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Cari apakah tab aplikasi sudah terbuka
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        // Jika cocok dengan URL kita, fokuskan
        if (client.url.includes(targetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      // Jika belum terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
