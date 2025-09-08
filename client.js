// client.js - Production version
console.log('Kaiten Translations Addon loading...');

function initializeKaitenAddon() {
    if (typeof window.Addon === 'undefined') {
        console.log('Waiting for Kaiten SDK...');
        setTimeout(initializeKaitenAddon, 100);
        return;
    }

    console.log('Kaiten SDK found, initializing...');
    
    try {
        window.Addon.initialize({
            card_buttons: function(context) {
                console.log('Card buttons context received');
                
                return [{
                    text: '🌐 Переводы',
                    callback: function(callbackContext) {
                        console.log('Translation button clicked');
                        
                        try {
                            const iframeUrl = window.location.origin + '/translations';
                            console.log('Opening iframe:', iframeUrl);
                            
                            // Основной способ через Kaiten API
                            if (callbackContext && typeof callbackContext.openIframe === 'function') {
                                callbackContext.openIframe(iframeUrl);
                            } 
                            // Fallback через postMessage
                            else if (window.parent && window.parent.postMessage) {
                                window.parent.postMessage({
                                    type: 'kaiten-plugin-iframe-open',
                                    url: iframeUrl
                                }, '*');
                            } else {
                                console.error('No method available to open iframe');
                            }
                        } catch (error) {
                            console.error('Error opening translations:', error);
                        }
                    }
                }];
            }
        });
        
        console.log('✅ Addon initialized successfully');
    } catch (error) {
        console.error('❌ Failed to initialize addon:', error);
    }
}

// Запускаем инициализацию
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeKaitenAddon);
} else {
    initializeKaitenAddon();
}
