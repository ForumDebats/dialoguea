/**
 * Dialoguea
 * opendebats.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * Admin : Gestion des utilisateurs
 * à partir de la section Groupes
 */

function retrieve(Model,id,sink, next) {
	Model.get({id:id}, function(d) {sink = d})
	if (next) {next(d)}
}


var UsersCtrl = ['User','Group','$resource','$stateParams','$scope','$http','$timeout','Broadcast',
function(User,Group,$resource,$stateParams,$scope,$http,$timeout,Broadcast) {


	$scope.field = null; //selected field in user list
	$scope.processing = false //import list
	var newUserBtn=$_('newUserBtn');

	var gid = $stateParams.groupId

	var U=this
	U.newUser={ nom:'', prenom:'',login:'', email:'' }
	U.editedUser=null
	U.users=[]
	U.group=null
	U.errmsg=""
	U.uploadErrmsg=""
	U.newUsersList=null;

	U.setLogin = function() {
		U.newUser.login = (U.newUser.nom + (U.newUser.prenom ? '.'+U.newUser.prenom[0]:'')).toLowerCase()
	}

	Group.get({id:gid}, function(group) { U.group = group; });
	//retrieve(Group,id,U.group)

	U.getList = function (gId) {
		User.query( {gid:gId}, function(users) {
			U.users = users
			$('.loading').hide()
		})
	}

	U.getList(gid) // DO call it on initialization

	U.addUser = function() {
		U.errOnUpdate=""
		newUserBtn.disabled=true;
		U.errmsg=''
		if(! nom && prenom) { return; }
		var nom = U.newUser.nom.trim();
		var prenom = U.newUser.prenom.trim();
		var login = U.newUser.login.trim();
		var email = U.newUser.email && U.newUser.email.trim();

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
					U.newusererrmsg = "Cet identifiant existe déjà"
				}
				else
					U.newusererrmsg = "Erreur à l'enregistrement"
			})
			.finally( function() {
				newUserBtn.disabled=false
			})
	}

	U.removeUser = function (user) {
		U.errOnUpdate=""
		var id=U.users.indexOf(user)
		var index = U.group.membres.indexOf(user._id)
		U.group.membres.splice(index,1)
		U.group.$update()
		U.users[id].$remove();
		U.users.splice(id,1);
	};

	U.editUser = function (user,field) {
		U.errOnUpdate =""
		var id = U.users.indexOf(user)
		U.editedUser = U.users[id];
		U.editingField = field;
		U.editingFieldValue = U.editedUser[field]

		$timeout( function () {
			$_(field+user._id).focus()
		}, 100)
	};

	U.doneEditing = function (uidx,field,form) {
		U.errmsg=''
		U.editedUser = null;
		if (field.$dirty) {
			form.$setPristine();
			var id = U.users.indexOf(uidx)
			var thisUser = U.users[id]
			var nom = thisUser.nom.trim();
			var prenom = thisUser.prenom.trim();
			var login = thisUser.login.trim();
			var password = thisUser.password;
			if (nom.length && prenom.length && login.length) {
				//User.update({id:thisUser._id},{nom:nom,prenom:prenom,login:login,password:password}).$promise
				thisUser.$update()
					.then(function() {
					})
					.catch(function(res){
						if(res.data && res.data.err && res.data.err.code ==11001) {
							U.errmsg = "Cet identifiant existe déjà"
							thisUser[U.editingField] = U.editingFieldValue
						}
						else {
							U.errOnUpdate = "Erreur à l'enregistrement"
							thisUser[U.editingField] = U.editingFieldValue
						}
					});
			} else {
				U.errmsg = "le nom, le prénom et le login doivent être indiqués ! "
				U.revertEditing(uidx)
				// todo ngmessage
			}
		}
	};


	U.revertEditing = function (uidx) {
		var id = U.users.indexOf(uidx)
		U.users[id][U.editingField] = U.editingFieldValue
		U.editedUser = null;
	};

	U.importList = function() {
		U.importing=true
		if(U.newUserList.length < 1 ) { U.errmsg="liste invalide"; return; }

		$http
			.post('api/newuserlist', {userlist:U.newUserList, gid:gid} )
			.success(function(data) {
				U.getList(gid);
			})
			.error(function(msg){
				console.log(msg)
				U.listErrMsg = msg
			})
			.finally(function() {
				U.importing = false
				U.newListPopup = false
			})
	}

	$scope.$on('uploadComplete', function() {
		//console.log(JSON.parse(Broadcast.message))

		angular.element($_('importResult')).scope().$apply(function () {
			U.newUserList = JSON.parse(Broadcast.message);
			U.newListPopup = true
			$scope.processing = false
		});
	});

	$scope.cancelList = function() {
		U.newListPopup = false;
		U.newUserList = null;
		angular.element($_('addList')).scope().$apply(function () {
			$scope.processing = false
		})
	}
}]


