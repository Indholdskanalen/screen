/**
 * @file
 * Contains the slide directive.
 */

"use strict";

/**
 * Directive to insert html for a slide.
 *
 * @param ik-id: the id of the slide.
 * @param ik-width: the width of the slide.
 */
ikApp.directive('ikSlide', ['cssInjector',
  function(cssInjector) {
    return {
      restrict: 'E',
      scope: {
        ikSlide: '=',
        ikArrayId: '=',
        ikIndex: '='
      },
      link: function(scope, element, attrs) {
        attrs.$observe('ikArrayId', function(val) {
          if (!val) {
            return;
          }

          scope.ikSlide.uniqueId = scope.ikArrayId + '-' + scope.ikIndex;
        });

        // Observe for changes to the ik-id attribute. Setup slide when ik-id is set.
        attrs.$observe('ikSlide', function(val) {
          if (!val) {
            return;
          }

          // Only show first image in array.
          if (scope.ikSlide.media_type === 'image' && scope.ikSlide.media.length >= 0) {
            scope.ikSlide.currentImage = scope.ikSlide.media[0];
          }
          else if (scope.ikSlide.media_type === 'video') {
            // Set current video variable to path to video files.
            scope.ikSlide.currentVideo = {
              "mp4": scope.ikSlide.media.mp4,
              "ogg": scope.ikSlide.media.ogv,
              "webm": scope.ikSlide.media.webm
            };
          }

          scope.ikSlide.currentLogo = scope.ikSlide.logo;

          // Setup the inline styling
          scope.theStyle = {
            width: "100%",
            height: "100%",
            fontsize: scope.ikSlide.options.fontsize + "px"
          };

          cssInjector.add(scope.ikSlide.css_path);
        });

        scope.$on('$destroy', function() {
          if (scope.ikSlide.videojs) {
            scope.ikSlide.videojs.dispose();
          }
        });
      },
      template: '<div data-ng-include="" src="ikSlide.template_path"></div>'
    };
  }
]);
