/**
 * Dialoguea
 * opendebats.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * ouverture d'un débat
 */

angular.module('openDebat', ['ngResource',  'ngTouch'])

		.factory('Group', GroupFactory)
		.factory('Docu', DocuFactory)
		.factory('Cmt', CmtFactory)
		.factory('Debat', DebatFactory)

		.controller('OpenDebatCtrl',
		['Group', 'Docu', 'Cmt', 'Debat',
			'$resource', '$scope', '$rootScope', '$sce', '$http', '$location', '$window','$state',
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
					console_dbg($scope.groups)
				});

				$scope.$on('DocSelectionForDebate', function () {
					$scope.selectedDoc = $rootScope.selectedDoc;
				});

				O.select = function (menu) {
					O.section = menu;
				}

				O.isSection=function(sect) {
					return O.section == sect
				}

				O.switchToDocs = function () {
					O.section = 'docs';
				}

				this.openDebat = function () {
					if(!$rootScope.selectedDoc || !_.keys($rootScope.GrpSelection).length ) {
						// missing document or group. pass
						return;
					}

					var doc = $rootScope.selectedDoc;

					var rootCmt = new Cmt({
						citation:      $sce.trustAsHtml(doc.titre1).toString(),
						reformulation: $sce.trustAsHtml(doc.titre2).toString(),
						argumentation: $sce.trustAsHtml(doc.texte).toString(),
						avis: 4,
						selection: {},
						uid:$rootScope.user.uid
					})

					/** todo : recheck sce+sanitize
					 * save the document as a root comment
					 */
					rootCmt.$save()
							.then(function (r) {
								console_dbg(r)
								var debat = new Debat({
									titre : doc.titre1+", "+doc.titre2,
									categorie: [doc.categorie],
									gids: _.keys($rootScope.GrpSelection),
									rootCmt : r._id
								})

								debat.$save()
										.then(function (d) {
											$window.location.href = "#/debat/" + d._id
										})
										.catch(function (req) {
											O.errmsg = req.data
										})
							})
							.catch(function (req) {
								O.errmsg = req.data
							})
				}

				this.back = function () {
					window.history.back();
				}
			}]);

