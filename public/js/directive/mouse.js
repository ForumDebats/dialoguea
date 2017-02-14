/**
 * Dialoguea
 * mouse.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
	bypass angular event management (the ~200ms mouse delay)
 */


var eventMouse = function ($parse, eventName) {
	return function (scope, element, attr) {
		var fn = $parse(attr['on'+eventName]);
		element.on(eventName, function (event) {
			scope.$apply(function () {
				fn(scope, {$event: event});
				event.stopPropagation()
			});
		});
	}
}

var onmousedown = ['$parse', function ($parse) {
	return {
		restrict: 'A',
		link: eventMouse($parse,'mousedown')
	};
}]

var onmouseup =	['$parse', function ($parse) {
	return {
		restrict: 'A',
		link: eventMouse($parse,'mouseup')
	};
}]

var onmouseout = ['$parse', function ($parse) {
	return {
		restrict: 'A',
		link: eventMouse($parse,'mouseout')
	};
}]


// full exemple
/*
onmouseup = ['$parse', function ($parse) {
	return {
		restrict: 'A',
		link: function (scope, element, attr) {
			var fn = $parse(attr['onmouseup']);
			element.on('mouseup', function (event) {
				scope.$apply(function () {
					fn(scope, {$event: event});
					event.stopPropagation()
				});
			});
		}
	};
}]
*/
