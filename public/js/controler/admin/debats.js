/**
 * Dialoguea
 * debas.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * liste complète de tout les débats
 *
 * todo : pagination, tri par responsable
 */

angular.module('admDebats', ['ngResource'])
		.factory('Debat', DebatFactory)
		.filter('search', function (row) {
			return 0 //((row.dateFermeture < Date.now())) ;
		})
		.controller('AdmDebatsCtrl', ['Debat','$http', function (Debat,$http) {
			var D = this;
			D.message = ""
			D.debats = []

			$http.get('apiadm/debats')
				.success(function (d) {
					console.log(d)
					if(d.length) {
						D.message = ""
						D.debats = d
						// todo : filtrer par groupe
						/*_.each(d,function(dbt) {
							console_dbg(dbt)
							for(var i in dbt.gids) {
								console_dbg(dbt.gids[i])
								dbt.group += dbt.gids[i].name
							}
						})*/
					}
					else {
						D.message = "Aucun débat ouvert"
					}
				})
				.error(function (e) {
					D.message = "Tous les débats sont fermés"
					console_dbg(e)
				})
				.finally(function() {
					$('.loading').hide()
				})

			D.showConfirmClose = function (d) {
				D.debats.forEach(function (deb) {
					deb.closing = false
					deb.reopening = false
				})
				if (!d.dateFermeture) {
					d.closing = true;
				}
				else {
					d.reopening = true;
				}
			}

			D.closeDebat = function(d,close) {
				$http.post('apiadm/openclosedebate', {id: d._id, close:close}).
					then(function(deb) {
						var id = D.debats.indexOf(d)
						var thisDeb = D.debats[id]
						thisDeb.dateFermeture = deb.data.dateFermeture
						d.reopening = d.closing = false;
					}, function(err) {
						D.message = err
					});
			}

			D.delete = function(index) {
				$http.post('apiadm/deldebate', {id: D.debats[index]._id})
				D.debats.splice(index,1)
			}
		}])
;