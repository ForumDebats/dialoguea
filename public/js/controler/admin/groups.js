/**
 * Dialoguea
 * groups.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the GPLv2 license
 *
 * Admin : gestion des groupes
 */


angular.module('groups', ['ngResource'])
.factory('Group',GroupFactory)
.directive('groupList',function() {
	return{
		restrict:'E',
		templateUrl: 'section/admin/group-list.html',
		controller: 'GroupsListCtrl',
		controllerAs:'G',
		scope: {
			validation: '@validation',
			selection: '='
		}
	}
})
.controller('GroupsListCtrl',
		['Group','$scope','$location','$rootScope','$state',
function(Group, $scope, $location,$rootScope,$state)
{
	var G = this;
	G.newGroup = null;
	G.groups = [];
	G.selectedGroup = null;// crntly edited
	G.errmsg = "";
	G.editing = false;
	$scope.selector = $state.$current.data.selector;
	$scope.statePrefix = $state.$current.data.section;

	this.getList = function () {

		Group.query(function (grps) {
			G.groups = grps
			$('.loading').hide()

			var selectedGroups4dbt = $rootScope.GrpSelection
			_.each(G.groups, function (g) {
				if (_.contains(_.keys(selectedGroups4dbt), g._id)) {
					g.selected = true;
				}

				/*var dbts = _.countBy(g.debats, function (dbt) {
					return dbt.status
				})
				g.openDebats = dbts[0] || 0;
				g.closedDebats = dbts[1] || 0;
				*/
			}) //.then(function() { $('.loading').hide() })
		});
	}

	G.getList();

	$scope.openGroup = function(gid) {
		$state.go($scope.statePrefix+'group',{groupId:gid})
	}


	this.addGrp = function() {
		G.errmsg = ''
		var groupName = G.newGroup.trim();
		if (groupName.length) {
			if (!groupName.length) {
				return;
			}
			var newG = new Group({name: groupName});
			newG.$save()
					.then(function (res) {
						newG.openDebats = 0;
						newG.closedDebats = 0;
						G.groups.unshift(newG);
					})
					.catch(function (req) {
						G.errmsg = "Erreur ! "
						console_dbg("error saving obj", req);
					})
		}
	}

	// add the group as selected at rootscope
	this.toggleGroup = function(g) {
		if(_.contains(_.keys($rootScope.GrpSelection), g._id)) {
			g.selected = false;
			delete $rootScope.GrpSelection[g._id]
		}
		else {
			g.selected = true;
			$rootScope.GrpSelection[g._id] = g.name
		}
		console_dbg($rootScope.GrpSelection)
		$rootScope.$broadcast('groupSelectionForDebate');
	}

	this.groupSelected = function(gid) {
		console_dbg($rootScope.GrpSelection[gid])
		return $rootScope.GrpSelection[gid]
	}
}])

	/*
	 * keys : une liste d'id
	 * list : une liste d'objet (._id)
	 * compare la liste avec les clés
	 * retire les éléments de la liste qui correspondent
	 * et les place dans la liste retournée
	 */
/*	.filter('getState', function () {
		return function (list, keys) {
			var res=[]
			for (var i = 0; i < keys.length; i++) {
				for(var j=0;j<list.length;j++) {
					if (keys[i] == list[j]._id) {
						res.push(list[j]);
						list.splice(j,1)
					}
				}
			}
			return res;
		};
	})*/

/** acces au groupe. todo : replacer le bouton de suppression */
.controller('GroupCtrl',['Group', '$state','$stateParams', '$filter', '$location',
function(Group, $state, $stateParams, $filter, $location) {

	var G = this;
	G.group = null;
	G.availDocs = [];
	G.docs = [];
	G.debats = [];
	G.openDebates = [];
	G.closeDebates = [];
	G.confirmdelete = false;
	G.statePrefix = $state.$current.data ? $state.$current.data.section : '';

	Group.get({id: $stateParams.groupId}, function (group) {
		G.group = group;
	})

	this.delete = function () {
		this.group.$delete();
		$location.path('/groupes')
	}
}]);
