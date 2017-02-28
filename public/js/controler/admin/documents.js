/**
 * Dialoguea
 * documents.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * documents management
 */


var DocListCtrl =
['Docu','Cat','$scope','$location','$rootScope','$stateParams','$state',
function(Docu, Cat, $scope, $location, $rootScope, $stateParams, $state)
{
	var D = this;
	D.newDoc = null;
	D.docs = [];
	D.selectedDoc = null;// crntly edited
	D.errmsg = "";
	D.editing = false;

	D.LISTING = 0;
	D.NEWDOC = 1;
	D.EDITION = 2;
	D.status = D.LISTING
	D.cat = {_id: $stateParams.catId}

	// display the selector
	$scope.selector = $state.$current.data.selector;
	$scope.statePrefix = $state.$current.data.section; // when nesting this view

	console_dbg($state)
	$scope.CONFIRM = undefined;

	$scope.tabs = [
		{id: "doclist", url: 'doclist.tpl.html'},
		{id: "newdoc",  url: 'newdoc.tpl.html'},
		{id: "editdoc", url: 'editdoc.tpl.html'}
	];

	$scope.currentTab = $scope.tabs[0];

	$scope.onClickTab = function (num) {
		$scope.currentTab = $scope.tabs[num];
	}

	$scope.isActiveTab = function (tabId) {
		return $scope.tabs[tabId] == $scope.currentTab;
	}

	D.getList = function () {
		Cat.get({id: D.cat._id}, function (cat) {
			D.cat = cat;
			Docu.query({categorie: D.cat._id}, function (docs) {
				D.docs = docs
				_.each(D.docs, function (d) {
					var dbts = _.countBy(d.debats, function (dbt) {
						return dbt.status
					})
					d.openDebats = dbts[0] || 0;
					d.closedDebats = dbts[1] || 0;
				})
			});
		})
	}

	if(D.cat._id) D.getList();

	$scope.openDoc = function (docId) {
		$location.path('document/' + docId)
	}


	this.addDoc = function () {
		D.errmsg = ''
		var titre1 = D.newDoc.titre1.trim()
		var titre2 = D.newDoc.titre2.trim()
		var texte = D.newDoc.texte.trim()

		if (!( titre1.length && titre2.length && texte.length )) {
			// TODO ngMessage
			return;
		}

		var newDoc = new Docu(
				{
					titre1: titre1,
					titre2: titre2,
					texte: texte,
					categorie: D.cat._id
				}
		);

		newDoc.$save()
				.then(function () {
					D.docs.unshift(newDoc);
					newDoc.openDebats = 0;
					newDoc.closedDebats = 0;
					D.newDoc = '';
					$scope.onClickTab(D.LISTING);
				})
				.catch(function (req) {
					D.errmsg = "Erreur : échec à la sauvegarde du document"
					console_dbg("Error", req);
				});
	}

	this.removeDoc = function (doc) {
		var id = this.docs.indexOf(doc)
		D.docs[id].$remove();
		D.docs.splice(id, 1);
	};

	// keep a backup copy of document
	this.editDoc = function (doc) {
		D.originalDoc = angular.extend({}, doc);
		D.originalDoc.$update = doc.$update
		D.editingId = D.docs.indexOf(doc)
		D.editedDoc = doc;
		console_dbg(D.editedDoc)
		$scope.onClickTab(D.EDITION);
	};

	// todo : factorize with addDoc()
	this.doneEditing = function () {

		var titre1 = D.editedDoc.titre1.trim(),
				titre2 = D.editedDoc.titre2.trim(),
				texte = D.editedDoc.texte;

		if (titre1.length && titre2.length && texte.length) {
			D.editedDoc.$update().then(function () {
				D.editedDoc = null;
				$scope.onClickTab(D.LISTING);
			});
		} else {
			console_dbg('missing value')
			// todo : ngmessage
			D.errmsg = "erreur"
		}
	};

	this.revertEditing = function () {
		D.editedDoc = D.originalDoc;
		D.docs[D.editingId] = D.originalDoc;
		$scope.onClickTab(D.LISTING);
	};

	this.selectDoc = function (doc) {
		$rootScope.selectedDoc = doc
		$rootScope.$broadcast('DocSelectedForDebate');
	}

	/* called for an external selection */
	this.groupSelected = function (gid) {
		return $rootScope.selection[gid]
	}

	this.getDoc = function () {
		Docu.get({id: $stateParams.docId}, function (doc) {
			D.editedDoc = doc;
		});
	};


	$scope.tinymceAdminOption = {
		encoding: "UTF-8",
		language: 'fr_FR',
		menubar: false,
		statusbar: false,
		autoresize: false,
		entity_encoding: "raw",
		language_url: 'lang/fr_FR.js',
		skin: 'tinycystom',
		skin_url: '/css',
		resize: true,
		height: 500,
		plugins: ["image upimage table link anchor code"],
		toolbar: "undo redo | styleselect | fontsizeselect bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link anchor upimage table code",
		file_browser_callback: function (field_name, url, type, win) {
			$('#upload').click();

		},
		image_dimensions: false,
		init_instance_callback: function (ed) {
			console_dbg("Editor: " + ed.id + " initialized.");
			D.editor = ed
		}
	};
}]


