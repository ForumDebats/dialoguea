/**
 * Dialoguea
 * noueaudebat.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the GPLv2 license
 *
 */

angular.module('nouveaudebat', ['ngResource', 'ui.tinymce'])

		.factory('Docu', DocuFactory)
		.factory('Cmt', CmtFactory)
		.factory('Group', GroupFactory)
		.factory('Debat', DebatFactory)
		.directive('nouveaudebat', function () {
			return {
				restrict: 'E',
				templateUrl: 'section/nouveaudebat.html',
				controller: 'DocsCtrl',
				controllerAs: "D"
			};
		})

		.controller('NouveauDebatCtrl', ['Docu', 'Group', 'Cmt', 'Debat', '$http', '$resource', '$scope', '$sce', '$window','$stateParams',
			function (Docu, Group, Cmt, Debat, $http, $resource, $scope, $sce, $window,$stateParams) {

				var N = this;
				N.status = 0;
				N.doc = {auteur: null, titre: null, sous_titre: null, texte: null}
				N.gid = 0
				N.message = "";
				N.auteur = ''
				N.titre = ''
				N.texte = ''
				N.categories = [
					{label: "SEM", value: "SEM"},
					{label: "philo", value: "philo"}]
				//N.catselected= N.categories[0];
				var catId = $stateParams.catId;
				N.cat = {name: '', desc: '', img: ''};

				$http.get('api/cat/' + catId).
						success(function (c) {
							N.cat = c;
						}).
						error(function () {
							N.message = "erreur"
						})


				// this goes in PUBLIC DEBATE today
				/*Group.query({name: 'Public'}, function (g) {
				 if (g[0]) { N.gid = g[0]._id; console_dbg(N.gid) }
				 else { console_dbg("groume.logpe introuvabe "); }
				 })*/

				N.tinymceAdminOption = {
					encoding: "UTF-8",
					language: 'fr_FR',
					menubar: false,
					/*menu : { // this is the complete default configuration
					 file   : {title : 'File'  , items : 'newdocument'},
					 edit   : {title : 'Edit'  , items : 'undo redo | cut copy paste pastetext | selectall'},
					 insert : {title : 'Insert', items : 'link media | template hr'},
					 view   : {title : 'View'  , items : 'visualaid'},
					 format : {title : 'Format', items : 'bold italic underline strikethrough superscript subscript | formats | removeformat'},
					 table  : {title : 'Table' , items : 'inserttable tableprops deletetable | cell row column'},
					 tools  : {title : 'Tools' , items : 'spellchecker code'}
					 },*/

					statusbar: false,
					resize: true,
					height: 450,
					plugins: ["image upimage table"],
					toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | table | upimage | fontsizeselect",

					file_browser_callback: function (field_name, url, type, win) {
						console_dbg("hep")
						//if(type=='image')
						$('#upload').click();

					},
					image_dimensions: false,
					entity_encoding: "raw",
					language_url: 'js/fr_FR.js',
					skin: 'tinycystom',
					skin_url: '/css',
					init_instance_callback: function (ed) {
						//console_dbg("Editor: " + ed.id + " initialized.");
						N.editor = ed
					}
				};

				this.validate = function () {
					/*
					 * ouvrir le débat après le preview
					 */
					N.errmsg = ''
					if (!(N.titre.length && N.texte.length )) {
						// TODO ngMessage
						console_dbg('missing value', N.titre, N.texte);
						return;
					}

					N.openDebat()

					/*
					 no document anymore

					 N.newdoc = new Docu(
					 {   titre: N.titre,
					 texte: N.texte,
					 auteur: N.auteur
					 }
					 );

					 N.newdoc.$save()
					 .then(function(d){
					 N.openDebat()
					 })
					 .catch(function(req) {
					 N.errmsg = "Erreur 50 : échec à la sauvegarde du document"
					 console_dbg("Error",req);
					 });
					 */
				}

				this.preview = function () {
					//if($scope.htmltext.length<3) return
					//console_dbg(N.titre,N.htmltext)
					N.doc.titre = $sce.trustAsHtml(N.titre).toString()
					N.doc.texte = $sce.trustAsHtml(N.texte).toString()
					N.doc.auteur = $sce.trustAsHtml(N.auteur).toString()
					if (N.doc.titre && N.doc.texte && N.doc.auteur) {
						N.status = 1;
						console_dbg(N.doc)
					}
				}

				/*
				 this.removeDoc = function (doc) {
				 var id=this.docs.indexOf(doc)
				 N.docs[id].$remove();
				 N.docs.splice(id,1);
				 };

				 // keep a backup copy of document
				 this.editDoc = function (doc) {
				 N.originalDoc = angular.extend({}, doc);
				 N.originalDoc.$update = doc.$update
				 N.editingId = N.docs.indexOf(doc)
				 N.editedDoc = doc;
				 };

				 // todo : factorize with addDoc()
				 this.doneEditing = function () {

				 var titre = N.editedDoc.titre.trim();
				 var sous_titre = N.editedDoc.sous_titre ? N.editedDoc.sous_titre.trim() :'';
				 var auteur = N.editedDoc.auteur;
				 var texte = N.editedDoc.texte;

				 if (auteur.length && titre.length && texte.length) {
				 N.editedDoc.$update().then( function () {
				 N.editedDoc = null;
				 });
				 } else {
				 console_dbg('missing value')
				 // todo : ngmessage
				 $scope.message = "erreur"
				 }
				 };

				 this.revertEditing = function () {
				 console_dbg("revert editing")
				 N.editedDoc = N.originalDoc;
				 N.docs[N.editingId] = N.originalDoc;
				 }; */


				this.openDebat = function () {

					N.errmsg = ''
					if (!(N.titre.length && N.texte.length )) {
						// TODO ngMessage
						console_dbg('missing value', N.titre, N.texte);
						return;
					}

					var rootCmt = new Cmt({
						citation:      $sce.trustAsHtml(N.titre).toString(),
						reformulation: $sce.trustAsHtml(N.texte).toString(),
						argumentation: $sce.trustAsHtml(N.auteur).toString(),
						avis: 4,
						selection: {}
					})

					console_dbg("saving root cmt", rootCmt)

					rootCmt.$save()
							.then(function () {
								N.rootCmt = rootCmt;

								console_dbg(N.rootCmt._id);
								var debat = new Debat({
									rootCmt: N.rootCmt._id,
									categorie: [catId]
								})
								debat.$save()
										.then(function (a) {
											$window.location.href = "#/" + rootCmt._id
										})
										.catch(function (req) {
											N.errmsg = req.data
											console_dbg("error saving obj", req.data);
										})
								/*var arg = {
								 groupId: N.gid,
								 docId: N.newdoc._id,
								 rootCmtId: rootCmt._id
								 }
								 console_dbg(arg)
								 var a = new Argu(arg)
								 a.$save()
								 .then(function (a) {
								 $window.location.href = "/#/"+rootCmt._id
								 })
								 .catch(function(req) {
								 N.errmsg = req.data
								 console_dbg("error saving obj",req.data);
								 })*/

							})
							.catch(function (req) {
								N.errmsg = req.data
								console_dbg("error saving obj", req.data);
							})
				}
			}])
