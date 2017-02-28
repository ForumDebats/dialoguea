/**
 * Dialoguea
 * clickonce.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
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
