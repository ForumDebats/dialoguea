/**
 * Dialoguea
 * clickonce.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the GPLv2 license
 *
 * pprevet doule clicks
 */

function ClickOnce($timeout) {
	return {
		restrict: 'A',
		link: function(scope, element, attrs) {
			var replacementText = attrs['clickOnce'];

			element.bind('onmousedown', function() {
				//$timeout(function() {
				if (replacementText) {
					console_dbg(replacementText)
					element.html(replacementText);
					console_dbg(element)
				}
				$timeout(function() {
					element.attr('disabled', true);
				}, 500);
			});
		}
	};
};
