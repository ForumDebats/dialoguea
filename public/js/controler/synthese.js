/**
 * Dialoguea
 * synthese.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * ajoute un nouveau document en synthèse
 */

var SyntheseCtrl = ['Docu', '$scope', '$location', '$rootScope', '$stateParams',
		function (Docu, $scope, $location, $rootScope, $stateParams) {
			var S = this;
			S.cat = {_id: $stateParams.docId}
			Docu.get({id: $stateParams.docId}, function (doc) {
				S.doc = doc;
			});
		}
	]

