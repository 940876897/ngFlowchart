(function() {

  'use strict';

  function Edgedraggingfactory(Modelvalidation, flowchartConstants, Edgedrawingservice) {
    function factory(modelservice, model, edgeDragging, isValidEdgeCallback, applyFunction, dragAnimation, edgeStyle) {
      if (isValidEdgeCallback === null) {
        isValidEdgeCallback = function() {
          return true;
        };
      }

      var edgedraggingService = {};

      var draggedEdgeSource = null;
      var dragOffset = {};

      edgeDragging.isDragging = false;
      edgeDragging.dragPoint1 = null;
      edgeDragging.dragPoint2 = null;

      var destinationHtmlElement = null;
      var oldDisplayStyle = "";

      edgedraggingService.dragstart = function(connector) {
        return function(event) {
          edgeDragging.isDragging = true;

          draggedEdgeSource = connector;
          edgeDragging.dragPoint1 = modelservice.connectors.getCenteredCoord(connector.id);

          var canvas = modelservice.getCanvasHtmlElement();
          if (!canvas) {
            throw new Error('No canvas while edgedraggingService found.');
          }
          dragOffset.x = -canvas.getBoundingClientRect().left;
          dragOffset.y = -canvas.getBoundingClientRect().top;

          edgeDragging.dragPoint2 = {
            x: event.clientX + dragOffset.x,
            y: event.clientY + dragOffset.y
          };

          event.dataTransfer.setData('Text', 'Just to support firefox');
          if (event.dataTransfer.setDragImage) {
            var invisibleDiv = angular.element('<div></div>')[0]; // This divs stays invisible, because it is not in the dom.
            event.dataTransfer.setDragImage(invisibleDiv, 0, 0);
          } else {
            destinationHtmlElement = event.target;
            oldDisplayStyle = destinationHtmlElement.style.display;
            event.target.style.display = 'none'; // Internetexplorer does not support setDragImage, but it takes an screenshot, from the draggedelement and uses it as dragimage.
            // Since angular redraws the element in the next dragover call, display: none never gets visible to the user.
          }

          if (dragAnimation == flowchartConstants.dragAnimationShadow) {

            var el = angular.element(modelservice.getSvgHtmlElement());
            angular.element(el[0].getElementsByClassName('shadow-svg-class')).css('display', 'block');
            angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('path').attr('d', Edgedrawingservice.getEdgeDAttribute(edgeDragging.dragPoint1, edgeDragging.dragPoint2, edgeStyle));
            angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('circle').attr('cx', edgeDragging.dragPoint2.x);
            angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('circle').attr('cy', edgeDragging.dragPoint2.y);
          }
          event.stopPropagation();
        };
      };

      edgedraggingService.dragover = function(event) {

        edgeDragging.endCounter -= 1;

        if (edgeDragging.isDragging) {

          if(!edgeDragging.magnetActive && dragAnimation == flowchartConstants.dragAnimationShadow) {

            edgeDragging.dragPoint2 = {
              x: event.clientX + dragOffset.x,
              y: event.clientY + dragOffset.y
            };

            var el = angular.element(modelservice.getSvgHtmlElement());
            angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('path').attr('d', Edgedrawingservice.getEdgeDAttribute(edgeDragging.dragPoint1, edgeDragging.dragPoint2, edgeStyle));
            angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('circle').attr('cx', edgeDragging.dragPoint2.x);
            angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('circle').attr('cy', edgeDragging.dragPoint2.y);

          } else if(dragAnimation == flowchartConstants.dragAnimationRepaint) {
            return applyFunction(function () {

              if (destinationHtmlElement !== null) {
                destinationHtmlElement.style.display = oldDisplayStyle;
              }

              edgeDragging.dragPoint2 = {
                x: event.clientX + dragOffset.x,
                y: event.clientY + dragOffset.y
              };
            });
          }
        }
      };

      edgedraggingService.dragoverConnector = function(connector) {
        return function(event) {

          if (edgeDragging.isDragging) {
            edgedraggingService.dragover(event);
            try {
              Modelvalidation.validateEdges(model.edges.concat([{
                source: draggedEdgeSource.id,
                destination: connector.id
              }]), model.nodes);
            } catch (error) {
              if (error instanceof Modelvalidation.ModelvalidationError) {
                return true;
              } else {
                throw error;
              }
            }
            if (isValidEdgeCallback(draggedEdgeSource, connector)) {
              event.preventDefault();
              event.stopPropagation();
              return false;
            }
          }
        };
      };

      edgedraggingService.dragleaveMagnet = function() {
        return function (event) {

          if(event.clientX === 0) {
            if(dragAnimation == flowchartConstants.dragAnimationShadow) {

              if(edgeDragging.connector !== undefined) {
                if (isValidEdgeCallback(draggedEdgeSource, edgeDragging.connector)) {
                  modelservice.edges._addEdge(draggedEdgeSource, edgeDragging.connector);
                  event.stopPropagation();
                  event.preventDefault();
                  return false;
                }
              }
            }
          }

          edgeDragging.magnetActive = false;
        }
      };


      edgedraggingService.dragoverMagnet = function(connector) {
        return function(event) {
          if (edgeDragging.isDragging) {
            edgedraggingService.dragover(event);
              try {
              Modelvalidation.validateEdges(model.edges.concat([{
                source: draggedEdgeSource.id,
                destination: connector.id
              }]), model.nodes);
            } catch (error) {
              if (error instanceof Modelvalidation.ModelvalidationError) {
                return true;
              } else {
                throw error;
              }
            }
            if (isValidEdgeCallback(draggedEdgeSource, connector)) {
              if(dragAnimation == flowchartConstants.dragAnimationShadow) {

                edgeDragging.connector = connector;
                edgeDragging.magnetActive = true;
                var el = angular.element(modelservice.getSvgHtmlElement());
                edgeDragging.dragPoint2 = modelservice.connectors.getCenteredCoord(connector.id);
                angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('path').attr('d', Edgedrawingservice.getEdgeDAttribute(edgeDragging.dragPoint1, edgeDragging.dragPoint2, edgeStyle));
                angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('circle').attr('cx', edgeDragging.dragPoint2.x);
                angular.element(el[0].getElementsByClassName('shadow-svg-class')).find('circle').attr('cy', edgeDragging.dragPoint2.y);

              } else {
                return applyFunction(function() {
                  edgeDragging.dragPoint2 = modelservice.connectors.getCenteredCoord(connector.id);
                  event.preventDefault();
                  event.stopPropagation();
                  return false;
                });
              }
            }
          }

        }
      };

      edgedraggingService.dragend = function() {
        return function(event) {

          if (edgeDragging.isDragging) {
            edgeDragging.isDragging = false;
            edgeDragging.dragPoint1 = null;
            edgeDragging.dragPoint2 = null;
            event.stopPropagation();

            if(dragAnimation == flowchartConstants.dragAnimationShadow) {
              var el = angular.element(modelservice.getSvgHtmlElement());
              angular.element(el[0].getElementsByClassName('shadow-svg-class')).css('display', 'none');
            }
          }
        }
      };

      edgedraggingService.drop = function(targetConnector) {
        return function(event) {
          if (edgeDragging.isDragging) {
            try {
              Modelvalidation.validateEdges(model.edges.concat([{
                source: draggedEdgeSource.id,
                destination: targetConnector.id
              }]), model.nodes);
            } catch (error) {
              if (error instanceof Modelvalidation.ModelvalidationError) {
                return true;
              } else {
                throw error;
              }
            }
            if (isValidEdgeCallback(draggedEdgeSource, targetConnector)) {
              modelservice.edges._addEdge(draggedEdgeSource, targetConnector);
              event.stopPropagation();
              event.preventDefault();
              return false;
            }
          }
        }
      };
      return edgedraggingService;
    }

    return factory;
  }

  angular.module('flowchart')
    .factory('Edgedraggingfactory', Edgedraggingfactory);

}());
