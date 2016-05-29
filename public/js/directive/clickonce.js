
/*
click an element only once util its state is restored back to enabled
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
