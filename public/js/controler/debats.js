/**
 * Dialoguea
 * debats.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
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
			}
			else {
				D.message = "Aucun débat ouvert"
			}
		}).
		error(function () {
			D.message = "Tous les débats sont fermés"
		})
}]
