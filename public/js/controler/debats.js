/**
 * Dialoguea
 * debats.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * debats disponibes pour un groupe
 */

var DebatsCtrl = ['$http', '$stateParams', function ($http, $stateParams) {
	selectMenu(null); // quick fix for menu highlight
	var D = this;
	D.message = ""
	D.debats = []
	D.catId = $stateParams.catId

	$http.get('api/grpcatdbts/' + D.catId)
		.success(function (d) {
			if (d.length) {
				D.message = ""
				D.debats = d
				console.log(d)
			}
			else {
				D.message = "Aucun débat ouvert"
			}
		}).
		error(function () {
			D.message = "Tous les débats sont fermés"
		})
}]
