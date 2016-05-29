/**
 * Date: 07/12/14
 * DialogueA
 * philippe.estival@enov-formation.com
 *
 * debats.js
 *
 **/

var DebatsCtrl = ['$http', '$stateParams', function ($http, $stateParams) {
	selectMenu(null); // quick fix for menu highlight
	var D = this;
	D.message = ""
	D.debats = []
	D.catId = $stateParams.catId
	console_dbg("debatsctrls", D.cat)

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
