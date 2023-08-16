'use strict';

module.exports = function(electronApp, menuState) {
    return [
        {
            label: 'Toggle Main Overlay',
            accelerator: 'Alt+Y',
            enabled: function() {
                return menuState.bpmn;
            },
            action: function() {
                electronApp.emit('menu:action', 'togglePropertyOverlays');
            }
        },
        {
            label: 'Toggle Transactions',
            accelerator: 'Alt+T',
            enabled: function() {
                return menuState.bpmn;
            },
            action: function() {
                electronApp.emit('menu:action', 'toggleTransactionOverlays');
            }
        },
        {
            label: 'Toggle Ids',
            accelerator: 'Alt+X',
            enabled: function() {
                return menuState.bpmn;
            },
            action: function() {
                electronApp.emit('menu:action', 'toggleIdOverlays');
            }
        }
    ];
};
