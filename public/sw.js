// sw v6
self.addEventListener("push", (event) => {
  const d = event.data?.json() || {};
  event.waitUntil(
    self.registration.showNotification(d.title || "Virtus Mentor", {
      body: d.body || "",
      data: d.data || { url: d.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});