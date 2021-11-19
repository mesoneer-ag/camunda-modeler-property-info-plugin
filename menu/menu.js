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
          label: 'Toggle Doc Notes',
          accelerator: 'Alt+N',
          enabled: function() {
              return menuState.bpmn;
          },
          action: function() {
              electronApp.emit('menu:action', 'togglePropertyDocNotes');
          }
      }
  ];
};
