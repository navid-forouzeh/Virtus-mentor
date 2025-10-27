self.addEventListener("push",(event)=>{const d=event.data?.json()||{};
  event.waitUntil(self.registration.showNotification(d.title||"Virtus",{body:d.body||"",data:d.data||{}}));
});
self.addEventListener("notificationclick",(event)=>{event.notification.close();
  const url=event.notification.data?.url||"/";event.waitUntil(clients.openWindow(url));
});