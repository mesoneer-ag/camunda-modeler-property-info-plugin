'use strict';

module.exports = function(electronApp, menuState) {
  return [
      {
          label: 'Toggle Overlay',
          accelerator: 'CommandOrControl+Y',
          enabled: function() {
              return menuState.bpmn;
          },
          action: function() {
              electronApp.emit('menu:action', 'togglePropertyOverlays');
          }
      }
  ];
};
