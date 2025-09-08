window.addEventListener('load', () => {
  console.log('Kaiten Translations Addon loading...');
  
  if (window.Addon) {
    console.log('SDK Kaiten loaded successfully');
    
    Addon.initialize({
      card_buttons: async (context) => {
        const permissions = context.getPermissions();
        
        if (!permissions.card.update) {
          return [];
        }

        return [{
          text: '🌐 Переводы',
          callback: async (callbackContext) => {
            try {
              // Альтернативный способ открытия iframe
              const iframeUrl = window.location.origin + '/translations';
              
              // Используем метод SDK если доступен
              if (callbackContext.openIframe) {
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
      }
    });
  } else {
    console.error("SDK Kaiten не загружен");
  }
});
