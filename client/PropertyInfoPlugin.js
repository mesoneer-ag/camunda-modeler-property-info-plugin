'use strict';

var _ = require('lodash');

const docBadgeCoordsInfo = [
    {type: 'BoundaryEvent', top: 3, right: 3},
    {type: 'StartEvent', top: 2, right: 2},
    {type: 'EndEvent', top: 1, right: 1},
    {type: 'Gateway', top: 2, right: 4},
    {type: 'Task', top: 4, right: 4},
    {type: 'Activity', top: 5, right: 5},
    {type: 'Participant', top: 3.5, right: 4},
    {type: 'SequenceFlow'},
];

function PropertyInfoPlugin(eventBus, overlays, elementRegistry, editorActions) {

    var mainElementOverlays = [];
    var elementIdOverlays = [];
    var elementTransactionOverlays = [];
    var mainOverlaysVisible = true;
    var transactionsVisible = false;
    var overlaysIdVisible = false;

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

    eventBus.on('connection.changed', function (event) {
        _.defer(function () {
            changeShape(event);
        });
    });
  
    eventBus.on('connection.added', function (event) {
        _.defer(function () {
            changeShape(event);
        });
    });

    editorActions.register({
        togglePropertyOverlays: function () {
            toggleMainOverlay();
        },
        toggleTransactionOverlays: function () {
            toggleTransactionOverlay();
        },
        toggleIdOverlays: function () {
            toggleIdOverlay();
        }
    });

    function isOverlayRequired(element) {
        return element.businessObject.$instanceOf('bpmn:FlowNode') 
                || element.businessObject.$instanceOf('bpmn:Participant')
                || element.businessObject.$instanceOf('bpmn:SequenceFlow');
    }

    function changeShape(event) {
        var element = event.element;
        if (!isOverlayRequired(element)) {
            return;
        }
        _.defer(function () {
            addMainElementsStyle(element);
            addTransactionsStyle(element);
            addIdsStyle(element);
        });
    }

    function removeShape(element) {
        var elementObject = mainElementOverlays[element.id];
        var transactionObject = elementTransactionOverlays[element.id];
        var idsObject = elementIdOverlays[element.id];

        for (
                let t = 0, e = 0, i = 0; 
                t < transactionObject.length || e < elementObject.length || i < idsObject.length; 
                t++, e++, i++
        ) {
            if (transactionObject[t] !== undefined) {
                overlays.remove(transactionObject[t]);
            }
            if (elementObject[e] !== undefined) {
                overlays.remove(elementObject[e]);
            }
            if (idsObject[i] !== undefined) {
                overlays.remove(idsObject[i]);
            }
        }

        delete mainElementOverlays[element.id];
        delete elementTransactionOverlays[element.id];
        delete elementIdOverlays[element.id];
    }

    function toggleMainOverlay() {
        if (mainOverlaysVisible) {
            mainOverlaysVisible = false;
            if (mainElementOverlays !== undefined) {
                for (var elementCount in mainElementOverlays) {
                    var elementObject = mainElementOverlays[elementCount];
                    for (var overlay in elementObject) {
                        overlays.remove(elementObject[overlay]);
                    }
                }
            }
        } else {
            mainOverlaysVisible = true;
            var elements = elementRegistry.getAll();
            for (var elementCount in elements) {
                var elementObject = elements[elementCount];
                if (isOverlayRequired(elementObject)) {
                    addMainElementsStyle(elementObject);
                }
            }
        }
    }

    function calculateSequenceFlowBadgeCoords(element) {
        const elementCount = mainElementOverlays[element.id].length + 1;
        const x0 = element.waypoints[0].x, y0 = element.waypoints[0].y, x1 = element.waypoints[1].x, y1 = element.waypoints[1].y;
        const ratio = 16 * elementCount / Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        const x = (1 - ratio) * x0 + ratio * x1, y = (1 - ratio) * y0 + ratio * y1;

        const xCoords = element.waypoints.map((coord) => coord.x);
        const yCoords = element.waypoints.map((coord) => coord.y);

        const maxCoordValue = {
          x: Math.max.apply(null, xCoords),
          y: Math.max.apply(null, yCoords),
        };

        return {
          right: maxCoordValue.x - x,
          bottom: maxCoordValue.y - y,
        };
    }

    function toggleTransactionOverlay() {
        if (transactionsVisible) {
            transactionsVisible = false;
            if (elementTransactionOverlays !== undefined) {
                for (var elementCount in elementTransactionOverlays) {
                    var overlaysArray = elementTransactionOverlays[elementCount];
                    for (var elementObject in overlaysArray) {
                        overlays.remove(overlaysArray[elementObject]);
                    }
                }
            }
        } else {
            transactionsVisible = true;
            var elements = elementRegistry.getAll();
            for (var elementCount in elements) {
                var element = elements[elementCount];
                if (isOverlayRequired(element)) {
                    addTransactionsStyle(element);
                }
            }
        }
    }

    function toggleIdOverlay() {
        if (overlaysIdVisible) {
            overlaysIdVisible = false;
            if (elementIdOverlays !== undefined) {
                for (var elementCount in elementIdOverlays) {
                    var overlaysArray = elementIdOverlays[elementCount];
                    for (var elementObject in overlaysArray) {
                        overlays.remove(overlaysArray[elementObject]);
                    }
                }
            }
        } else {
            overlaysIdVisible = true;
            var elements = elementRegistry.getAll();
            for (var elementCount in elements) {
                var element = elements[elementCount];
                if (isOverlayRequired(element)) {
                    addIdsStyle(element);
                }
            }
        }
    }

    function addTransactionsStyle(element) {
        if (elementTransactionOverlays[element.id] !== undefined && elementTransactionOverlays[element.id].length !== 0) {
            for (var overlay in elementTransactionOverlays[element.id]) {
                overlays.remove(elementTransactionOverlays[element.id][overlay]);
            }
        }

        elementTransactionOverlays[element.id] = [];

        if (!transactionsVisible) {
            return;
        }

        if (element.type !== "label") {
            if (element.businessObject.$instanceOf('bpmn:Participant') 
                && element.businessObject.processRef 
                && element.businessObject.processRef.jobPriority !== undefined
            ) {
                const participantJobPriority = element.businessObject.processRef.jobPriority;
                elementTransactionOverlays[element.id].push(
                    overlays.add(element, 'badge', {
                        position: {
                            top: element.height / 2,
                            left: 0
                            },
                        html: `<div class="show-tr">${participantJobPriority}</div>`
                    })
                );
            }

            const jobPriority = element.businessObject.jobPriority;
            if (element.businessObject.asyncBefore) {
                elementTransactionOverlays[element.id].push(
                    overlays.add(element, 'badge', {
                        position: {
                            top: element.height / 2,
                            left: 0
                            },
                        html: `<div class="show-tr">${jobPriority !== undefined ? jobPriority : ""}</div>`
                    })
                );
            }
    
            if (element.businessObject.asyncAfter) {
                elementTransactionOverlays[element.id].push(
                    overlays.add(element, 'badge', {
                        position: {
                            top: element.height / 2,
                            right: 0
                        },
                        html: `<div class="show-tr">${jobPriority !== undefined ? jobPriority : ""}</div>`
                    })
                );
            }
    
        }
    }

    function addIdsStyle(element) {
        if (elementIdOverlays[element.id] !== undefined && elementIdOverlays[element.id].length !== 0) {
            for (var overlay in elementIdOverlays[element.id]) {
                overlays.remove(elementIdOverlays[element.id][overlay]);
            }
        }

        elementIdOverlays[element.id] = [];

        if (!overlaysIdVisible) {
            return;
        }

        if (element.businessObject.$instanceOf('bpmn:SequenceFlow')) {
            return;
        }

        if (element.businessObject.id !== undefined &&
            element.businessObject.id.length > 0 &&
            element.type !== "label" ) {

            var text = element.businessObject.id;

            elementIdOverlays[element.id].push(
                overlays.add(element, 'badge', {
                    position: {
                        top: 4,
                        left: 4
                    },
                    html: '<div class="show-el-id">' + text + '</div>'
                })
            );

        }
    }

    function addMainElementsStyle(element) {

        if (mainElementOverlays[element.id] !== undefined && mainElementOverlays[element.id].length !== 0) {
            for (var overlay in mainElementOverlays[element.id]) {
                overlays.remove(mainElementOverlays[element.id][overlay]);
            }
        }

        mainElementOverlays[element.id] = [];

        if (!mainOverlaysVisible) {
            return;
        }
        
        if (element.businessObject.documentation !== undefined &&
            element.businessObject.documentation.length > 0 &&
            element.businessObject.documentation[0].text.trim() !== "" &&
            element.type !== "label") {

            const isSequenceFlow = element.type === 'bpmn:SequenceFlow';
            let sequenceFlowDocBadgeCoords;
            if (isSequenceFlow) {
                sequenceFlowDocBadgeCoords = calculateSequenceFlowBadgeCoords(element);
            }

            var text = element.businessObject.documentation[0].text;
            text = text.replace(/(?:\r\n|\r|\n)/g, '<br />');

            docBadgeCoordsInfo.filter(info => element.type.includes(info.type)).forEach(info => {
                mainElementOverlays[element.id].push(
                    overlays.add(element, 'badge', {
                        position: sequenceFlowDocBadgeCoords !== undefined
                            ? { bottom: sequenceFlowDocBadgeCoords.bottom, right: sequenceFlowDocBadgeCoords.right } 
                            : { top: info.top, right: info.right},
                        html: `<div class="doc-val-true${isSequenceFlow ? '-rounded' : ''}"></div><div class="doc-val-hover">${text}</div>`
                    }));
            });
        }

        if (element.businessObject.extensionElements === undefined 
                && (element.businessObject.$instanceOf('bpmn:FlowNode') || element.businessObject.$instanceOf('bpmn:SequenceFlow'))
            ) {
            return;
        }

        if (element.type === "label") {
            return;
        }

        var badges = [];

        if (element.businessObject.$instanceOf('bpmn:Participant') && element.businessObject.processRef) {
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
        } else {
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
                    } else if (extensions[extension].event === 'take') {
                        key = 'camunda:ExecutionListener-take';
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
            } else if (overlayObject.badgeKey === 'camunda:ExecutionListener-take') {
                const badgeCoords = calculateSequenceFlowBadgeCoords(element);
                badges.push(overlays.add(element, 'badge', {
                    position: {
                        bottom: badgeCoords.bottom,
                        right: badgeCoords.right
                    },
                    html: '<div class="badge ' + overlayObject.badgeBackground + '" data-badge="' + overlayObject.badgeType + '"></div>'
                }));
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

        pushArray(mainElementOverlays[element.id], badges);
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
        for (var i = 0; i < len; i++, start++) {
            list[start] = other[i];
        }
    }

}

PropertyInfoPlugin.$inject = ['eventBus', 'overlays', 'elementRegistry', 'editorActions'];

module.exports = {
    __init__: ['clientPlugin'],
    clientPlugin: ['type', PropertyInfoPlugin]
};
