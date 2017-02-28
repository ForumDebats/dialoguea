/**
 * Dialoguea
 * category.js
 *
 * copyright 2014-2017 Forum des débats
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * category management
 */

/*
function urlValid(url) {
	var re=/^^http(s)?:\/\/([a-zA-Z0-9-]+\.)?([a-zA-Z0-9-]+\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,4})?(:[0-9]+)?(\/[\w]*)*(\/[\w-]+\.[a-zA-Z]{1,4})?$/
           // https://   subsubdom.        subdom.         dialoguea     .fr            :3000  / w / w / file.png
	return re.test(url)
}

function validUrlImg(url) {
	return (urlValid(url)
	&&(url.endsWith('.png')
	|| url.endsWith('.jpg')
	|| url.endsWith('.gif')
	|| url.endsWith('.svg')))
}*/

var AdmCategoriesCtrl = ['Cat','Broadcast','$http','$scope','$timeout','$filter', '$state',
function(Cat,Broadcast,$http,$scope,$timeout,$filter,$state) {

	var C = this;
	C.LISTING = 0;
	C.NEW = 1;
	C.EDITIMG = 2;
	C.status = C.LISTING;
	C.message = ""
	C.cat = []
	C.editingField = null;
	C.originalCat = null;
	C.newcat = {name: null, img: null, upload: false, byUrlImg: null, debats:[]}
	$scope.message = ""
	$scope.imgUrl = null
	$scope.statePrefix = $state.$current.data.section; // when nesting this view
	$scope.processing=false

	$scope.opencat = function(cid) {
		$state.go($scope.statePrefix+'docList',{catId:cid})
		//equivalent to ui-sref=" {{statePrefix+'docList({catId:c._id })' }}"
	}

	$scope.editCat = function(c) {
		$scope.processing=false
		C.status = C.EDITIMG;
		C.newcat = {name: c.name, img: c.img, upload:false, byUrlImg:null, debats: c.debats}
		C.originalCat = c;
	}

	this.saveCat = function() {
		$scope.processing=false
		var id = C.cat.indexOf(C.originalCat)
		var thisCat = C.cat[id]
		thisCat.name = C.newcat.name;
		thisCat.img = C.newcat.img;
		C.save(thisCat)
	}

	$scope.cancelEdit = function() {
		$scope.proccesing = false;
		C.status = C.LISTING;
		C.newcat = { name: null, img: null, upload: false, byUrlImg: null, debats:[]}
	}

	$scope.setImg = function (src) {
		C.newcat.img  = validUrlImg(src) ? src : "//:0"
	};


	Cat.query({}, function(cats) {

		if (!cats.length) {
			C.message = "Aucune catégorie"
		} else {
			C.cat = cats;
			/*_.each(C.cat, function (c) {
				Docu.query({categorie: c._id}, function(d) {

				})
				d.openDebats = dbts[0] || 0;
				d.closedDebats = dbts[1] || 0;
			})*/

			var orderBy = $filter('orderBy');
			C.cat = orderBy(C.cat, 'order', false)
		}
		$('.loading').hide()
	});

	$scope.confirmDeleteCat=function(c) {
		$scope.deletingCat = c;
		C.status = C.DELETE;
	}

	this.deleteCat = function(c) {
		$scope.processing=false
		var id = C.cat.indexOf(c)
		C.cat[id].$remove()
		C.cat.splice(id,1)
		C.status= C.LISTING
	}

	this.addCat = function() {
		$scope.processing=false
		var newcat;
		if($scope.noImgUrl) C.newcat.imgurl=null;

		console_dbg(C.newcat)
		newcat = new Cat(C.newcat);

		newcat.$save()
			.then(function(data){
				//C.message=data;
				C.cat.push(data);
				C.message= null
				C.status=C.LISTING;
			})
			.catch(function(req) {
				C.message= "Erreur 50 : échec à la sauvegarde du document"
				console_dbg("Error",req);
			});
	}


	this.editCatName = function (c) {

		C.errOnUpdate =""
		var id = C.cat.indexOf(c)

		if(C.editedCat!=null) {
			$timeout(function(){
				C.editedCat = C.cat[id]
				C.editingField = c.name;
				C.originalCat = angular.extend({}, C.editedCat);
			}, 100)
		}else {
			C.editedCat = C.cat[id]
			C.editingField = c.name;
		}

		$timeout( function () {
			$_(c._id).focus()
		}, 100)
	};

	this.revertEditing = function (c, field) {

		if (field.$dirty) {
			var id = C.cat.indexOf(c)
			//C.cat[id] = angular.extend({}, C.originalCat);//this.originalUser;
			C.cat[id].name = C.editingField;
		}
		$timeout( function () {C.editedCat = null},100 )
		$_(c._id).blur()
	};

	this.doneEditing = function (c,field) {
		console_dbg("done editing")
		$timeout(function(){C.editedCat = null}, 100)

		if (field.$dirty) {
			field.$setPristine();
			$_(c._id).blur();
			var id = C.cat.indexOf(c)
			var thisCat = C.cat[id]
			C.save(thisCat)
		}
		// delayed to postpone after ng-blur and still click to edit image
	};

	this.save = function(thisCat) {
		$scope.processing=false
		var name = thisCat.name.trim();
		if (name.length) {
			//console_dbg(thisUser)
			thisCat.$update()
					.then(function() {
						C.status=C.LISTING
					})
					.catch(function(res){
						console_dbg(res);
						if(res.data && res.data.err && res.data.err.code ==11001) {
							C.errOnUpdate = "Cet identifiant existe déjà"

						}
						else {
							C.errOnUpdate = "Erreur à l'enregistrement"
						}
					});
		} else {
			console_dbg('missing value')
			C.errmsg = "le nom ne doit pas être vide ! "
			// todo ngmessage
		}
	}

	$scope.$on('uploadComplete', function() {
		console_dbg(Broadcast.message)
		C.newcat.upload=true
		angular.element($_('catImg')).scope().$apply(function () { //post digest
			C.newcat.img = Broadcast.message;
		})
	});

	$scope.tabs = [
		{ title: "Envoyer une image", url: 'upFILE.tpl.html' },
		{ title: "Télécharger d'une URL" , url: 'byURL.tpl.html' }
	];

	$scope.currentTab = 'upFILE.tpl.html';

	$scope.onClickTab = function (tab) {
		$scope.currentTab = tab.url;
	}

	$scope.isActiveTab = function(tabUrl) {
		return tabUrl == $scope.currentTab;
	}


	$scope.dragControlListeners = {
	    //accept: function (sourceItemHandleScope, destSortableScope) {return boolean},//override to determine drag is allowed or not. default is true.
	    //itemMoved: function (event) { console.log(event, event.dest)},
	    orderChanged: function(event) {
		    C.cat.forEach(function(item,i){
		    	item.order = i
		    	item.$update()
	        })
	    },
	    containerPositioning: 'relative',
	    //containment: '#catslist',//optional param.
	    //placeholder: 'catsedit',//optional param.
	    //clone: false, //optional param for clone feature.
	    //allowDuplicates: false //optional param allows duplicates to be dropped.
	};

}]
