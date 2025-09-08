// ultra-simple-client.js
if (window.Addon) {
  window.Addon.initialize({
    card_buttons: function() {
      return [{
        text: '🌐 Переводы',
        callback: function(ctx) {
          window.parent.postMessage({
            type: 'kaiten-plugin-iframe-open',
            url: location.origin + '/translations'
          }, '*');
        }
      }];
    }
  });
}
