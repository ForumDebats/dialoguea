/**
 * Dialoguea
 * categies.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
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
			C.cat = orderBy(cats, 'name', false)
		}
		$('.loading').hide()
	});
}]