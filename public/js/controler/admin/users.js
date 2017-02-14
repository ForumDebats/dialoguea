/**
 * Dialoguea
 * opendebats.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * Admin : Gestion des utilisateurs
 * à partir de la section Groupes
 */


UserFactory = ['$resource', function ($resource) {
	return $resource('apiadm/users/:id',
		{id: '@_id'},
		{
			update: {method: 'PUT'},
			query: {method: 'GET', params: {gid: '@groupId'}, isArray: true}
		});
}];

angular.module('users', ['ngResource'])

	.factory('User',UserFactory)
	.factory('Group', GroupFactory)
	.factory('Broadcast', BroadcastFactory)

	.directive('clickOnce', ClickOnce)

	.directive('userList',function() {
		return{
			restrict:'E',
			templateUrl: 'section/admin/user-list.html',
			controller: 'UsersCtrl',
			controllerAs:'U'
		}
	})

	// keyboard
	.directive('ngEnter', ngEnter )
	.directive('ngEscape', ngEscape )

	.filter('search', function (row) {
		return !!((row.nom.indexOf($scope.query || '') !== -1
			 || row.prenom.indexOf($scope.query || '') !== -1));
	})

	.controller('UsersCtrl',['User','Group','$resource','$stateParams','$scope','$http','$timeout','Broadcast',
		function(User,Group,$resource,$stateParams,$scope,$http,$timeout,Broadcast) {

			$scope['search'] = function (row) {
				return !!((row.nom.indexOf($scope.query || '') !== -1
				     || row.prenom.indexOf($scope.query || '') !== -1));
			};

			$scope.field = null; //selected field in user list
			$scope.processing = false //import list
			var newUserBtn=$_('newUserBtn');

			var gid = $stateParams.groupId

			var U=this
			U.newUser= { nom:'', prenom:'',login:'', email:'' }
			U.editedUser=null
			U.users=[]
			U.group=null
			U.errmsg=""
			U.uploadErrmsg=""
			U.newUsersList=null;

			U.setLogin = function() {
				U.newUser.login = (U.newUser.nom + (U.newUser.prenom ? '.'+U.newUser.prenom[0]:'')).toLowerCase()
			}

			// retrieve group
			// Group.get({groupId:gid}, function(group) { U.group = group; });
			Group.get({id:gid}, function(group) {
				U.group = group;
			});

			this.getList = function (gId) {
				User.query( {gid:gId}, function(users) {
					U.users = users
					$('.loading').hide()
				})
			}

			U.getList(gid) // DO call it on initialization

			this.addUser = function() {
				U.errOnUpdate=""
				newUserBtn.disabled=true;
				this.errmsg=''
				if(! nom && prenom) { return; }
				var nom = this.newUser.nom.trim();
				var prenom = this.newUser.prenom.trim();
				var login = this.newUser.login.trim();
				var email = this.newUser.email.trim();

				if (!( nom.length && prenom.length )) {
					return;
				}

				var newUser = new User({
					nom:nom,
					prenom:prenom,
					login:login,
					email:email,
					gid:gid
				});

				newUser.$save()
					.then(function()  {
						U.users.unshift(newUser);
						U.newUser=''
						$scope.addpersonshow=1;
					})
					.then(function() {
						U.group.membres.push(newUser._id)
						U.group.$update()
					})
					.catch(function(res) {
						if(res.data && res.data.code &&
							res.data.code == 11000 ) {
							U.errmsg = "Cet identifiant existe déjà"
						}
						else
							U.errmsg = "Erreur à l'enregistrement"
					})
					.finally( function() {
						newUserBtn.disabled=false
					})
			}

			this.removeUser = function (user) {
				U.errOnUpdate=""
				var id=this.users.indexOf(user)
				var index = U.group.membres.indexOf(user._id)
				U.group.membres.splice(index,1)
				U.group.$update()
				this.users[id].$remove();
				this.users.splice(id,1);
			};

			this.editUser = function (user,field) {
				U.errOnUpdate =""
				var id = this.users.indexOf(user)
				U.editedUser = this.users[id];
				U.editingField = field;
				U.editingFieldValue = U.editedUser[field]

				$timeout( function () {
					$_(field+user._id).focus()
				}, 100)
			};

			this.doneEditing = function (user,field,form) {
				this.editedUser = null;
				if (field.$dirty) {
					form.$setPristine();
					var id = this.users.indexOf(user)
					var thisUser = this.users[id]
					var nom = thisUser.nom.trim();
					var prenom = thisUser.prenom.trim();
					var login = thisUser.login.trim();

					if (nom.length && prenom.length && login.length) {
						this.users[id].$update()
							.catch(function(res){
								console_dbg(res);
								if(res.data && res.data.err && res.data.err.code ==11001) {
									U.errOnUpdate = "Cet identifiant existe déjà"
									thisUser[U.editingField] = U.editingFieldValue

								}
								else {
									U.errOnUpdate = "Erreur à l'enregistrement"
									thisUser[this.editingField] = this.editingFieldValue
								}
							});
					} else {
						U.errmsg = "le nom ne doit pas être vide ! "
						// todo ngmessage
					}
				}
			};


			this.revertEditing = function (user) {
				var id = this.users.indexOf(user)
				this.users[id][this.editingField] = this.editingFieldValue
				this.editedUser = null;
			};

			this.importList = function() {
				U.importing=true
				if(U.newUserList.length < 1 ) { U.errmsg="liste invalide"; return; }

				$http
					.post('api/newuserlist', {userlist:U.newUserList, gid:gid} )
					.success(function(data) {
						U.getList(gid);
					})
					.error(function(data){
						console_dbg(data)
						U.listErrMsg = data
					})
					.finally(function() {
						U.importing = false
						U.newListPopup = false
					})
			}

			$scope.$on('uploadComplete', function() {
				console_dbg(JSON.parse(Broadcast.message))

				angular.element($_('importResult')).scope().$apply(function () {
					U.newUserList = JSON.parse(Broadcast.message);
					U.newListPopup = true
					$scope.processing = false
				});
			});

			$scope.cancelList = function() {
				U.newListPopup = false;
				U.newUserList = null;
				$scope.processing = false
			}
		}]);


