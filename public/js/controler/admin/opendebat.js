/**
 * Dialoguea
 * opendebats.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * ouverture d'un débat
 */

var OpenDebatCtrl =
['Group', 'Docu', 'Cmt', 'Debat',
'$resource', '$scope', '$rootScope',
'$sce', '$http', '$location', '$window','$state',
function (Group, Docu, Cmt, Debat,
          $resource,  $scope, $rootScope, $sce, $http, $location, $window,$state) {


	$state.go('opendebat.groupList')

	var O = this;
	O.docs = []
	O.grps = []
	O.section = 'groups';

	$scope.hasSelection = false;
	$rootScope.selectedDoc = null
	$rootScope.GrpSelection = {}

	$scope.$on('groupSelectionForDebate', function () {
		$scope.hasSelection = _.keys($rootScope.GrpSelection).length;
		$scope.selectedGroups = _.values($rootScope.GrpSelection);
	});

	$scope.$on('DocSelectionForDebate', function () {
		$scope.selectedDoc = $rootScope.selectedDoc;
	});

	O.back = function () { window.history.back(); }
	O.select = function (menu) { O.section = menu; }
	O.isSection = function(sect) { return O.section == sect }
	O.switchToDocs = function () { O.section = 'docs'; }

	$scope.openDebat = function () {

		if(!$rootScope.selectedDoc || !_.keys($rootScope.GrpSelection).length ) {
			// missing document or group. pass
			return;
		}

		var doc = $rootScope.selectedDoc;
		$state.go('predebat',{docId:doc._id})
	}

}]

