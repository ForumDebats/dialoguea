/**
 * Dialoguea
 * categies.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * affichage des categories
 */

var CategoriesCtrl = ['Cat','$http','$scope','$timeout','$filter', '$state',
function(Cat,$http,$scope,$timeout,$filter,$state) {

	var C = this;
	C.message = ""
	C.cat = []
	$scope.opencat = function(cid) {
		$state.go('catDocList',{catId:cid})
	}

	$http.get('api/cdebats').success(function(cats) {

		if (!cats.length) {
			C.message = "Aucune catégorie"
		} else {
			var orderBy = $filter('orderBy');
			C.cat = orderBy(cats, 'order', false)
		}
		$('.loading').hide()
	});

}]
