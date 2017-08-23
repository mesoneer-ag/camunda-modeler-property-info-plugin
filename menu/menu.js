'use strict';

module.exports = function(electronApp, menuState) {
  return [
      {
          label: 'Toggle Overlay',
          accelerator: 'Alt+Y',
          enabled: function() {
              return menuState.bpmn;
          },
          action: function() {
              electronApp.emit('menu:action', 'togglePropertyOverlays');
          }
      },
      {
          label: 'Toggle Overlay',
          accelerator: 'Alt+X',
          enabled: function() {
              return menuState.bpmn;
          },
          action: function() {
              electronApp.emit('menu:action', 'togglePropertyIdOverlays');
          }
      }
  ];
};
