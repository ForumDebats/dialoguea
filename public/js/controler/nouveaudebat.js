/**
 * Dialoguea
 * noueaudebat.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 */

NouveauDebatCtrl = ['Docu', 'Group', 'Cmt', 'Debat', '$http', '$resource', '$scope', '$sce', '$window','$stateParams',
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
	}

	this.preview = function () {
		//if($scope.htmltext.length<3) return
		//console_dbg(N.titre,N.htmltext)
		N.doc.titre = $sce.trustAsHtml(N.titre).toString()
		N.doc.texte = $sce.trustAsHtml(N.texte).toString()
		N.doc.auteur = $sce.trustAsHtml(N.auteur).toString()
		if (N.doc.titre && N.doc.texte && N.doc.auteur) {
			N.status = 1;
		}
	}

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

		rootCmt.$save()
				.then(function () {
					N.rootCmt = rootCmt;
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
							})
				})
				.catch(function (req) {
					N.errmsg = req.data
					console.log("error saving obj", req.data);
				})
	}
}]
