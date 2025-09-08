window.addEventListener('load', () => {
  console.log('Kaiten Translations Addon loading...');
  
  if (window.Addon) {
    console.log('SDK Kaiten loaded successfully');
    
    Addon.initialize({
      card_buttons: async (context) => {
        console.log('Initializing card buttons...');
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
              window.parent.postMessage({
                type: 'kaiten-plugin-iframe-open',
                url: window.location.origin + '/translations'
              }, '*');
              console.log('Message sent to parent');
            } catch (error) {
              console.error('Error sending message:', error);
            }
          }
        }];
      }
    });
  } else {
    console.error("SDK Kaiten не загружен");
    document.getElementById('status').innerHTML = `
      <div class="error">
        SDK Kaiten не загружен. Возможные причины:<br>
        - Блокировка CORS<br>
        - Проблемы с сетью<br>
        - Неверный URL SDK
      </div>
    `;
  }
});
