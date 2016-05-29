
// coupe à N lettres max en conservant les mots entiers
function cutFilter () {
	return function (value, wordwise, max, tail) {
		if (!value) return '';
		max = parseInt(max, 10);
		if (!max) return value;
		if (value.length <= max) return value;
		value = value.substr(0, max);
		if (wordwise) {
			var lastspace = value.lastIndexOf(' ');
			if (lastspace != -1) {
				value = value.substr(0, lastspace);
			}
		}
		return value + (tail || ' …');
	};
}

// filtre de tri par propriété d'objet
function orderObjectBy (){
	return function(input, attribute) {
		if (!angular.isObject(input)) return input;

		var array = [];
		for(var objectKey in input) {
			array.push(input[objectKey]);
		}

		array.sort(function(a, b){
			a = parseInt(a[attribute]);
			b = parseInt(b[attribute]);
			return a - b;
		});
		return array;
	}
}


var autolinker = new Autolinker({truncate:35} );
// insère les balises de liens sur les commentaires
function linkFilter(){
	return function(input) {
		return autolinker.link(input);
		//var re=/^^http(s)?:\/\/([a-zA-Z0-9-]+.)?([a-zA-Z0-9-]+.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}(:[0-9]+)?\/([a-zA-Z0-9_\-#?/]*|\/[a-zA-Z0-9\-?_]+\.[a-zA-Z]{1,4})?$/
		//return re.test(url)
	}
}


