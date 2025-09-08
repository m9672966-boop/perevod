// Ждем полной загрузки страницы и SDK
function initializeAddon() {
  if (typeof window.Addon === 'undefined') {
    console.error('SDK Kaiten не загружен');
    return;
  }

  console.log('SDK Kaiten loaded, initializing...');

  try {
    window.Addon.initialize({
      card_buttons: async (context) => {
        console.log('Card buttons context received');
        
        try {
          const permissions = context.getPermissions();
          if (!permissions.card.update) {
            console.log('No card update permissions');
            return [];
          }

          return [{
            text: '🌐 Переводы',
            callback: async (callbackContext) => {
              console.log('Translation button clicked');
              try {
                const iframeUrl = window.location.origin + '/translations';
                
                // Используем метод из контекста если доступен
                if (typeof callbackContext.openIframe === 'function') {
                  callbackContext.openIframe(iframeUrl);
                } else {
                  // Fallback на postMessage
                  window.parent.postMessage({
                    type: 'kaiten-plugin-iframe-open',
                    url: iframeUrl
                  }, '*');
                }
              } catch (error) {
                console.error('Error opening iframe:', error);
              }
            }
          }];
        } catch (error) {
          console.error('Error in card_buttons handler:', error);
          return [];
        }
      }
    });
    
    console.log('Addon initialized successfully');
  } catch (error) {
    console.error('Error initializing addon:', error);
  }
}

// Запускаем инициализацию когда SDK готов
if (typeof window.Addon !== 'undefined') {
  initializeAddon();
} else {
  // Ждем загрузки SDK
  document.addEventListener('DOMContentLoaded', function() {
    if (typeof window.Addon !== 'undefined') {
      initializeAddon();
    } else {
      // Пробуем еще раз через секунду
      setTimeout(initializeAddon, 1000);
    }
  });
}
