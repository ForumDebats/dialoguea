/**
 * Dialoguea
 * cdebats.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * débats oar categories
 */


var CatDocListCtrl = ['Cat', '$scope', '$location', '$rootScope', '$stateParams', '$state', '$http',
		function (Cat, $scope, $location, $rootScope, $stateParams, $state, $http) {
			var D = this;
			D.dbts = [];
			D.selectedDoc = null;// crntly edited
			D.message = ''
			D.LISTING = 0;
			D.status = D.LISTING
			D.cat = {_id: $stateParams.catId}
			//$state.transitionTo('categorie.debats');
			$state.go('cdebats.debats')
			Cat.get({id: D.cat._id}, function (cat) {
				D.cat = cat;
				console_dbg(cat)
			})
			$scope.openDebat = function (docId) {
				$location.path('debat/' + docId)
			}
		}]


