/**
 * Dialoguea
 * synthese.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
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

