(function() {

  'use strict';

  function fcNode(flowchartConstants) {
    return {
      restrict: 'E',
      templateUrl: 'flowchart/node.html',
      replace: true,
      scope: {
        callbacks: '=',
        node: '=',
        selected: '=',
        underMouse: '=',
        mouseOverConnector: '=',
        modelservice: '=',
        draggedNode: '='
      },
      link: function(scope, element) {
        scope.flowchartConstants = flowchartConstants;
        element.attr('draggable', 'true');

        element.on('dragstart', scope.callbacks.nodeDragstart(scope.node));
        element.on('dragend', scope.callbacks.nodeDragend);
        element.on('click', scope.callbacks.nodeClicked(scope.node));
        element.on('mouseenter', scope.callbacks.nodeMouseEnter(scope.node));
        element.on('mouseleave', scope.callbacks.nodeMouseLeave(scope.node));

        element.addClass(flowchartConstants.nodeClass);

        function myToggleClass(clazz, set) {
          if (set) {
            element.addClass(clazz);
          } else {
            element.removeClass(clazz);
          }
        }

        scope.$watch('selected', function(value) {
          myToggleClass(flowchartConstants.selectedClass, value);
        });
        scope.$watch('underMouse', function(value) {
          myToggleClass(flowchartConstants.hoverClass, value);
        });
        scope.$watch('draggedNode', function(value) {
          myToggleClass(flowchartConstants.draggingClass, value);
        });
      }
    };
  }

  angular.module('flowchart').directive('fcNode', fcNode);
}());
