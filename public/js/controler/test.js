/**
 * Dialoguea
 * test.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * ckeditor
 */


const TestCtrl =
	['Docu', 'Cat', '$scope', '$location', '$rootScope', '$stateParams', '$state',
		function (Docu, Cat, $scope, $location, $rootScope, $stateParams, $state) {
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
			//$scope.selector = $state.$current.data.selector;
			//$scope.statePrefix = $state.$current.data.section; // when nesting this view

			console_dbg($state)


			// Editor options.
			$scope.options = {
				language: 'fr',
				allowedContent: true,
				entities: false,
				extraPlugins : 'markdown',

				toolbarGroups : [
					{ name: 'basicstyles', groups: [ 'basicstyles', 'cleanup' ] },
					{ name: 'forms' },
					// { name: 'clipboard',   groups: [ 'clipboard', 'undo' ] },
					// { name: 'editing',     groups: [ 'find', 'selection', 'spellchecker' ] },
					{ name: 'links' },
					{ name: 'insert' },
					{ name: 'paragraph',   groups: [ 'list', 'indent', 'blocks', 'align', 'bidi' ] },

					{ name: 'tools' },
					//{ name: 'document',     groups: [ 'mode', 'document', 'doctools' ] },
					// '/',
					{ name: 'styles' },
					{ name: 'others' },
					{ name: 'colors' },
					// { name: 'about' }
				]
			};

			// Called when the editor is completely ready.
			$scope.onReady = function () {
				console_dbg("editor ready")
				// ...
			};

			$scope.CONFIRM = undefined;

			$scope.tabs = [
				{id: "doclist", url: 'doclist.tpl.html'},
				{id: "newdoc", url: 'newdoc.tpl.html'},
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

			if (D.cat._id) D.getList();

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
					console_dbg('missing value');
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
						D.errmsg = "Erreur 50 : échec à la sauvegarde du document"
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
				//D.status = D.EDITION;
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
				console_dbg("revert editing")
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
				console_dbg("groupselected:", $rootScope.selection[gid])
				return $rootScope.selection[gid]
			}

			this.getDoc = function () {
				Docu.get({id: $stateParams.docId}, function (doc) {
					D.editedDoc = doc;
				});
			};



		}
];
