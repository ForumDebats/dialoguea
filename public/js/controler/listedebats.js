/**
 * Dialoguea
 * listedebats.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * listes de débats par categories
 */

var ListeDebatsCtrl =
	['Cat','$http','$scope','$timeout','$filter', '$state',
		function(Cat,$http,$scope,$timeout,$filter,$state) {
			var $S=$scope
			$S.message = ""
			$S.cats = []
			$S.defaultLimitList=20
			$S.showAllDebates = function(c) {
				c.limit= c.debats.length
			}

			$scope.opencat = function(cid) {
				$state.go('catDocList',{catId:cid})
			}

			$scope.range = function(lenght,limit){

				count = limit-Math.min(lenght,limit)

				var items = [];
				for (var i = 0; i < count; i++) {
					items.push(i)
				}
				return items;
			}

			$scope.repeat=function(n){
				return new Array(n);
			};

			$http.get('api/listedebats').success(function(cats) {
				//Cat.query({}, function(cats) { //todo : nombre de débat != nbre de docs

				if (!cats.length) {
					$S.message = "Aucune catégorie"
				} else {
					_.each(cats,function(c) {
						c.limit = $S.defaultLimitList
					})
					$S.cats = cats;
					var orderBy = $filter('orderBy');
					$S.cats = orderBy($S.cats, 'name', false)
					console_dbg(cats)
				}
				$('.loading').hide()
			});
		}]
