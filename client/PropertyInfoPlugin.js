'use strict';

var _ = require('lodash');

var elementOverlays = [];
var overlaysVisible = true;
var overlaysIdVisible = true;

function PropertyInfoPlugin(eventBus, overlays, elementRegistry, editorActions) {

    eventBus.on('shape.changed', function (event) {
        _.defer(function () {
            changeShape(event);
        });
    });

    eventBus.on('shape.removed', function (event) {
        var element = event.element;

        _.defer(function () {
            removeShape(element);
        });
    });

    eventBus.on('shape.added', function (event) {
        _.defer(function () {
            changeShape(event);
        });
    });


    editorActions.register({
        togglePropertyOverlays: function () {
            toggleOverlays();
        },
        togglePropertyIdOverlays: function () {
            toggleIdOverlays();
        }
    });

    function changeShape(event) {
        var element = event.element;
        if (!(element.businessObject.$instanceOf('bpmn:FlowNode') || element.businessObject.$instanceOf('bpmn:Participant'))) {
            return;
        }
        _.defer(function () {
            addStyle(element);
        });
    }

    function removeShape(element) {
        var elementObject = elementOverlays[element.id];
        for (var overlay in elementObject) {
            overlays.remove(elementObject[overlay]);
        }
        delete elementOverlays[element.id];
    }

    function toggleOverlays() {
        if (overlaysVisible) {
            overlaysVisible = false;
            if (elementOverlays !== undefined) {
                for (var elementCount in elementOverlays) {
                    var elementObject = elementOverlays[elementCount];
                    for (var overlay in elementObject) {
                        overlays.remove(elementObject[overlay]);
                    }
                }
            }
        } else {
            overlaysVisible = true;
            var elements = elementRegistry.getAll();
            for (var elementCount in elements) {
                var elementObject = elements[elementCount];
                if (elementObject.businessObject.$instanceOf('bpmn:FlowNode') || elementObject.businessObject.$instanceOf('bpmn:Participant')) {
                    addStyle(elementObject);
                    overlaysIdVisible = true;
                }
            }
        }
    }

    function toggleIdOverlays() {
        if (overlaysIdVisible) {
            overlaysIdVisible = false;
            var elements = elementRegistry.getAll();
            for (var elementCount in elements) {
                var elementObject = elements[elementCount];
                if (elementObject.businessObject.$instanceOf('bpmn:FlowNode') || elementObject.businessObject.$instanceOf('bpmn:Participant')) {
                    addElementIdStyle(elementObject);
                }
            }
        } else {
            overlaysIdVisible = true;
            if (elementOverlays !== undefined) {
                for (var elementCount in elementOverlays) {
                    var elementObject = elementOverlays[elementCount];
                    for (var overlay in elementObject) {
                        overlays.remove(elementObject[overlay]);
                        overlaysVisible = false;
                    }
                }
            }
        }
    }

    function addElementIdStyle(element) {

        if (element.businessObject.id !== undefined &&
            element.businessObject.id.length > 0 &&
            element.type !== "label" ) {

            var text = element.businessObject.id;
            text = text.replace(/(?:\r\n|\r|\n)/g, '<br />');

            elementOverlays[element.id].push(
                overlays.add(element, 'badge', {
                    position: {
                        top: 4,
                        left: 4
                    },
                    html: '<div class="show-el-id" data-badge="D">' + text + '</div>'
                })
            );

        }
    }

    function addStyle(element) {

        if (elementOverlays[element.id] !== undefined && elementOverlays[element.id].length !== 0) {
            for (var overlay in elementOverlays[element.id]) {
                overlays.remove(elementOverlays[element.id][overlay]);
            }
        }

        elementOverlays[element.id] = [];

        if (element.businessObject.documentation !== undefined &&
            element.businessObject.documentation.length > 0 &&
            element.businessObject.documentation[0].text.trim() !== "" &&
            element.type !== "label") {

            var text = element.businessObject.documentation[0].text;
            text = text.replace(/(?:\r\n|\r|\n)/g, '<br />');


            elementOverlays[element.id].push(
                overlays.add(element, 'badge', {
                    position: {
                        top: 4,
                        right: 4
                    },
                    html: '<div class="doc-val-true" data-badge="D"></div><div class="doc-val-hover" data-badge="D">' + text + '</div>'
                })
            );
        }

        if (element.businessObject.extensionElements === undefined && element.businessObject.$instanceOf('bpmn:FlowNode')) {
            return;
        }

        //Do not process the label of an element
        if (element.type === "label") {
            return;
        }

        if (!overlaysVisible) {
            return;
        }

        var badges = [];

        if (element.businessObject.$instanceOf('bpmn:Participant')) {
            var extensionElements = element.businessObject.processRef.extensionElements;
            var extensions = (extensionElements === undefined ? [] : extensionElements.values);

            var type = '&#9654;';
            var background = 'badge-green';
            if (element.businessObject.processRef.isExecutable === false) {
                type = '&#10074;&#10074;';
                background = 'badge-red';
            }
            badges.push({
                badgeKey: 'isExecutable',
                badgeSort: 0,
                badgeType: type,
                badgeBackground: background,
                badgeLocation: 'left'
            });
        }
        else {
            var extensions = element.businessObject.extensionElements.values;
        }


        for (var extension in extensions) {
            var type = '';
            var background = '';
            var location = 'right';
            var sort = 0;
            var key = '';

            switch (extensions[extension].$type) {
                case 'camunda:ExecutionListener':
                    if (extensions[extension].event === 'start') {
                        location = 'left';
                        key = 'camunda:ExecutionListener-start';
                        sort = 20;
                    } else {
                        location = 'right';
                        key = 'camunda:ExecutionListener-end';
                        sort = 70;
                    }
                    type = 'L';
                    background = 'badge-green';
                    break;
                case 'camunda:Properties':
                    key = 'camunda:Properties';
                    sort = 80;
                    type = 'E';
                    background = 'badge-violet';
                    break;
                case 'camunda:TaskListener':
                    if (extensions[extension].event === 'create' || extensions[extension].event === 'assignment') {
                        location = 'left';
                        key = 'camunda:TaskListener-start';
                        sort = 21;
                    } else {
                        location = 'right';
                        key = 'camunda:TaskListener-end';
                        sort = 71;
                    }
                    type = 'T';
                    background = 'badge-green';
                    break;
                case 'camunda:InputOutput':
                    background = 'badge-blue';
                    break;
                case 'camunda:In':
                    type = 'V';
                    key = 'camunda:In';
                    location = 'left';
                    sort = 10;
                    background = 'badge-blue';
                    break;
                case 'camunda:Out':
                    type = 'V';
                    key = 'camunda:Out';
                    location = 'right';
                    sort = 60;
                    background = 'badge-blue';
                    break;
                case 'camunda:Field':
                    key = 'camunda:Field';
                    sort = 90;
                    type = 'F';
                    background = 'badge-red';
                    break;
            }

            if (extensions[extension].$type === 'camunda:InputOutput') {
                if (extensions[extension].hasOwnProperty('inputParameters') &&
                    extensions[extension].inputParameters.length > 0) {
                    location = 'left';
                    type = 'I';
                    key = 'camunda:InputOutput-input';
                    sort = 10;

                    badges.push({
                        badgeKey: key,
                        badgeSort: sort,
                        badgeType: type,
                        badgeBackground: background,
                        badgeLocation: location
                    });
                }

                if (extensions[extension].hasOwnProperty('outputParameters') &&
                    extensions[extension].outputParameters.length > 0) {
                    location = 'right';
                    type = 'O';
                    key = 'camunda:InputOutput-output';
                    sort = 60;

                    badges.push({
                        badgeKey: key,
                        badgeSort: sort,
                        badgeType: type,
                        badgeBackground: background,
                        badgeLocation: location
                    });
                }
            } else {
                if (key !== '') {
                    badges.push({
                        badgeKey: key,
                        badgeSort: sort,
                        badgeType: type,
                        badgeBackground: background,
                        badgeLocation: location
                    });
                }
            }


        }

        addOverlays(badges, element);
    }

    function addOverlays(badgeList, element) {
        var badges = [];

        var leftCounter = 0;
        var rightCounter = 0;


        var sortedBadgeList = uniqBy(badgeList, function (item) {
            return item.badgeKey
        });

        sortedBadgeList.sort(function (a, b) {
            return a.badgeSort - b.badgeSort;
        });

        for (var overlayCounter in sortedBadgeList) {
            var overlayObject = sortedBadgeList[overlayCounter];

            if (overlayObject.badgeLocation === 'left') {
                badges.push(overlays.add(element, 'badge', {
                    position: {
                        bottom: 0,
                        left: leftCounter
                    },
                    html: '<div class="badge ' + overlayObject.badgeBackground + '" data-badge="' + overlayObject.badgeType + '"></div>'
                }));
                leftCounter = leftCounter + 16;
            } else {
                badges.push(overlays.add(element, 'badge', {
                    position: {
                        bottom: 0,
                        right: rightCounter
                    },
                    html: '<div class="badge ' + overlayObject.badgeBackground + '" data-badge="' + overlayObject.badgeType + '"></div>'
                }));
                rightCounter = rightCounter + 16;
            }

        }

        pushArray(elementOverlays[element.id], badges);
    }

    function uniqBy(a, key) {
        var seen = {};
        return a.filter(function (item) {
            var k = key(item);
            return seen.hasOwnProperty(k) ? false : (seen[k] = true);
        })
    }

    function pushArray(list, other) {
        var len = other.length;
        var start = list.length;
        list.length = start + len;
        for (var i = 0; i < len; i++ , start++) {
            list[start] = other[i];
        }
    }

}

PropertyInfoPlugin.$inject = ['eventBus', 'overlays', 'elementRegistry', 'editorActions'];

module.exports = {
    __init__: ['clientPlugin'],
    clientPlugin: ['type', PropertyInfoPlugin]
};