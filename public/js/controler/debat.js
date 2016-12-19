/**
 * Dialoguea
 * debat.js
 *
 * copyright 2014-2017 Intactile design, Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the GPLv2 license
 *
 * Module central
 * Double page : text à gauche, débat à droite
 *
 * TODO :: handle multiple selections (shift)
 */

angular.module('debat', ['ngResource', 'ngTouch', 'pascalprecht.translate', 'ngMessages'])

	//.factory('Socket', SocketFactory) // affichage RT des messages
	.factory('Cmt', CmtFactory)
	.factory('Debat', DebatFactory)
	.filter('orderObjectBy', orderObjectBy)
	.filter('cut', cutFilter) // coupe à N lettres max en conservant les mots entiers
	.filter('links', linkFilter)
	.directive('onmousedown', onmousedown)
	.directive('onmouseup', onmouseup)
	.directive('onmouseout', onmouseout)

	/*
	 maintient la barre de défilement au même niveau
	 même si une nouvelle entrée est ajoutée  */
	.directive('keepScroll', ['$timeout', function ($timeout) {
		return {
			controller: function () {
				var element;
				this.setElement = function (el) {
					element = el;
				};
				this.addItem = function (item) {
					if (item.offsetTop <= element.scrollTop) {
						// timeout to end $digest cycle before computing item height
						$timeout(function () {
							element.scrollTop = (element.scrollTop + item.clientHeight + 20); //for margin top
						}, 0)
					} //else{}//don't scroll
				};
			},
			link: function (scope, el, attr, ctrl) {
				ctrl.setElement(el[0]);
			}
		};
	}])

	.directive('scrollItem', function () {
		return {
			require: '^keepScroll',
			link: function (scope, el, att, scrCtrl) {
				scrCtrl.addItem(el[0]);
			}
		};
	})


	.controller('DebatCtrl',
	['Debat', 'Cmt', '$resource', '$stateParams', '$scope', '$rootScope', '$sce', '$http', '$timeout', '$window', '$translate','$sce',
		function (Debat, Cmt, $resource, $stateParams, $scope, $rootScope, $sce, $http, $timeout, $window, $translate) {

			$('.view-header').hide()

			var annote
			var A = this;
			// get server time
			$http.get('api/date').success( function(date) {A.date = parseInt(date) ; console_dbg(date)} )

			A.debatId = $stateParams.debatId
			A.cmtId = $stateParams.cmtId

			A.windowWidth = "innerHeight" in window
				? window.innerWidth
				: document.documentElement.offsetWidth;

			A.article = null
			A.debat = null
			A.doc = null

			// controller status
			A.NOTCREATED = -1
			A.INIT = 1
			A.TEXTSELECTED = 1<<2
			A.ADDINGCMT = 1<<3
			A.PREPOST = 1<<4
			A.POSTED = 1<<5
			A.HYPOSTASE = 1<<6
			A.EDITCMT = 1<<7
			A.EDITHYPOSTASE = 1<<8

			A.status= A.EDITHYPOSTASE

			A.status = undefined

			var avisclass = ['green', 'red', 'blue', 'grey']
			var avisclassframe = ['daccord', 'pasdaccord', 'pasdavis']
			A.inviteMessage = null
			A.inviteEmail = null


			A.cmtBtn = {
				pos: {top: -10, left: -10},
				state: ""
			}

			A.selection = null
			A.selectedCmtId = null; // when selecing a comment
			A.selectedNode = null; // node of hySelected comment
			A.htmld = null;
			A.rootCmt = null; // the root comment = the debate
			A.cmts = [] // complete tree : root node + comments
			A.annotation = null;
			A.selectedAnnotation = null
			A.isScrolling = false; // prevent over/leave cmt while scrolling
			A.docviewScroll = 0;
			A.docView = null; // left side element
			A._docview = null // same for jquery

			/* argumentation-form */
			$scope.loading = true
			$scope.submitted = false
			$scope.invitationVisible = false
			$scope.interacted = function (field) {
				return $scope.submitted && field.$dirty;
			};
			$scope.tabs = [
				{ title: "Télécharger d'une URL" , url: 'byURL.tpl.html' },
				{ title: "Envoyer depuis le disque dur", url: 'upFILE.tpl.html' }
			];
			$scope.currentTab = 'byURL.tpl.html';
			$scope.onClickTab = function (tab) {
				$scope.currentTab = tab.url;
			}

			$scope.isActiveTab = function(tabUrl) {
				return tabUrl == $scope.currentTab;
			}
			/* ********************* */

			A.nanobar = new Nanobar({bg: "#FFF"});
			A.nanobar['progress'] = 0;
			A.countCmt = 0
			A.processing = false
			$scope.processing = false
			A.submitted = false

			A.curEditingCmt = undefined

			var hySelected = new Array(6)
			for (var i = 0; i < 6; i++) hySelected[i] = new Array(6)

			A.availColHypostases = [true, true, true, true, true, true]
			A.availRowHypostases = [true, true, true, true, true, true]
			A.choosenHypostases = [] // 8 max
			A.selectedHypostase = new Array(new Array(6))
			// todo : translate
			A.Hypostases = [
				['', 'classification', 'paradoxes', 'formalisme', 'aporie', 'approximation'],
				['variance', '', 'indices', 'données', 'variable', 'phénomène'],
				['mode', 'variation', '', 'croyances', 'dimension', 'évènement'],
				['axiome', 'valeur', 'conjecture', '', 'structure', 'invariant'],
				['hypothèse', 'définition', 'problème', 'théorie', '', 'méthode'],
				['principe', 'paradigme', 'domaine', 'loi', 'objet', '']
			]
			A.HypostasesHelp = [
				["",
					"Les classifications sont le fait de distribuer en classes, en catégories.",
					"Les paradoxes sont des propositions à la fois vraies et fausses.",
					"Un formalisme est la considération de la forme d’un raisonnement.",
					"Les apories sont des difficultés d’ordre rationnel apparemment sans issues.",
					"Une approximatioest un calcul approché d’une grandeur réelle."
				], [
					"Une variance caractérise une dispersion d'une distribution ou d'un échantillon.", "",
					"Un indice est un indicateur numérique ou littéral qui sert à distinguer ou classer.",
					"Une donnée est ce qui est admis, donné, qui sert à découvrir ou raisonner.",
					"Une variable est ce qui prend différentes valeurs et ce dont dépend l’état d’un système.",
					"Les phénomènes se manifestent à la connaissance via les sens."
				], [
					"Les modes sont les manières d’être d’un système.",
					"Les variations sont des changements d’un état dans un autre.", "",
					"Les croyances sont des certitudes ou des convictions qui font croire une chose vraie, vraisemblable ou possible.",
					"Les dimensions sont des grandeurs mesurables qui déterminent des positions.",
					"Les événements sont ce qui arrive."
				], [
					"Les axiomes sont des propositions admises au départ d’une théorie.",
					"Une valeur est une mesure d’une grandeur variable.",
					"Les conjectures sont des opinions ou propositions non vérifiées", "",
					"Les structures sont l’organisation des parties d’un système.",
					"Les invariants sont des grandeurs, relations ou propriétés conservées lors d’une transformation"
				], [
					"Une hypothèse est une conjecture concernant l’explication ou la possibilité d’un événement.",
					"Une définition est la détermination, la caractérisation du contenu d’un concept.",
					"Un problème est une difficulté à résoudre",
					"Une théorie est une construction intellectuelle explicative, hypothétique et synthétique.", "",
					"Une méthode est une procédure qui indique ce que l’on doit faire ou comment le faire."
				], [
					"Les principes sont les causes ou les éléments constituants des définitions, axiomes et hypothèses.",
					"Un paradigme est un modèle ou un exemple.",
					"Un domaine est un champ discerné par des limites, bornes, confins, frontières, démarcation.",
					"Les lois exprimentw des corrélations",
					"Un objet est ce sur quoi porte le discours, la pensée, la connaissance.", ""
				]]

			$scope.hypostaseColEnabled = function (i) {
				return A.availColHypostases[i]
			}
			$scope.hypostaseRowEnabled = function (i) {
				return A.availRowHypostases[i]
			}

			$scope.isHypostaseSelected = function (i, j) {
				return (hySelected[i][j])
			}

			$scope.toggleSelected = function (i, j) {
				var x, y, found = false;
				if (!hySelected[i][j]) {//select
					hySelected[i][j] = true;
					A.availColHypostases[i] = false
					A.availRowHypostases[j] = false

					for (x = 0; x < 6; x++) {
						if (hySelected[x][i]) {
							found = false
						}
					}
				}
				else {//deselect
					hySelected[i][j] = false
					for (x = 0; x < 6; x++) {
						if (hySelected[i][x]) {
							found = true;
							break
						}
					}
					if (!found) A.availColHypostases[i] = true
					found = false;
					for (x = 0; x < 6; x++) {
						if (hySelected[x][j]) {
							found = true;
							break
						}
					}
					if (!found) A.availRowHypostases[j] = true
				}
				A.choosenHypostases = []
				for (x = 0; x < 6; x++) {
					for (y = 0; y < 6; y++) {
						if (hySelected[x][y]) A.choosenHypostases.push(A.Hypostases[x][y])
					}
				}
			}

			/** translation specifics */

			var translateSpecific = function (words) {
				var i, _len;
				for (i = 0, _len = words.length; i < _len; i++) {
					$scope[words[i]] = $translate.instant(words[i])
				}
			}
			// specific translate overwrite
			var translateArguBtn = function () {
				var argument_btn = $translate.instant('BUTTON_ARGUMENT');
				var extra = $rootScope.user ? $rootScope.user.extra ? $rootScope.user.extra.hypostase : '' :''
				console_dbg($rootScope.user)

				Annotator.prototype.html.adder =
					"<div id='newCmtBtn'><div id='argumentBtn' class='button-content'>"
					+ argument_btn
					+ "</div><div class='arrow'></div></div>"
					+ extra
					+ $("#argumentBtn").text(argument_btn)
			}

			translateSpecific(['COMMENT']);
			translateArguBtn();

			$rootScope.$on('$translateChangeSuccess', function () {
				/* the variable comment is inclused in a ng-when instruction */
				translateSpecific(['COMMENT'])
				translateArguBtn()
			});

			/** --- translation specifics */

			$scope.$on('loggedin', function () { // et debat chargé

				$timeout( function() {
				angular.element($_('Dialoguea')).scope().$apply(function () {
					translateArguBtn();
					annote.destroy(); // requis pour lier le bouton hyposatsis
					if(A.debat.status == -1)
						A.setupClosedDebate();
					else A.setupAnnotation();
				})
				},0)
			})

			A.setupAnnotation = function() {
				var options = {
					editor: A.callEditor,
					hypostase: A.callEditor2
				}
				A.article.annotator(options);
				annote = A.article.data().annotator;
				annote.addPlugin('Touch', {force: false, useHighlighter:false})

				// reference la selection parent
				// déclaré après que annotator soit prêt
				A.onOverCmt = function (item) {
					if (A.isScrolling) return
					var node = $_(item.parentId);
					var annotation = {ranges: [item.selection]};
					A.selectedAnnotation = annote.highlightAnnotation(annotation, node)
				}
			}

			A.setupClosedDebate = function() {
				var options = {
					editor: function(){console_dbg("debat clos");
						A.clearSelections()
						A.annotation = null
						A.status = A.INIT;
						A.processing = false;
						annote.ignoreMouseup = false} // rien
				}
				Annotator.prototype.html.adder =
					"<div id='newCmtBtn'><div id='' class='button-content'>"
					+ "Le débat est clos </div></div>"
					//todo : traduction
				A.article.annotator(options);
				annote = A.article.data().annotator;
				annote.addPlugin('Touch', {force: false, useHighlighter:false})
			}

			$scope.$on('dataloaded', function () {
				$timeout(function () {

					$('.view-header').show()

					A.docView = $_('document-view-text')

					A.countCmt = A.countNbCmt(A.rootCmt);

					angular.element(document).ready(function () {

						A.article = $('#Dialoguea')

						A._docview = $('#document-view-text')
						A.docviewScroll = A._docview.scrollTop();

						$timeout(function () {

							A._docview.scrollTop(0)
							A.setupMarginMark(A.rootCmt)

							$('.annotator-hl').each(function () {
								$(this).contents().insertBefore(this);
								return $(this).remove();
							});
							$scope.loading = false
							$('.loading').hide()

							// jump straight to a comment
							if (A.cmtId) {
								A.scrollToComment(A.cmtId)
								$('#' + A.cmtId).closest('.argumentation-card').addClass("highlightcard")
							}
							else {
								$('#debat').scrollTop(0)
							}

						}, 200)

						if(A.debat.status == -1)
							A.setupClosedDebate();
						else A.setupAnnotation();
					})
				}, 0 );
			})


			Debat.get({id: $stateParams.debatId}).$promise
				.then(function (D) {
					console_dbg($stateParams.debatId, D)
					A.debat = D
					Cmt.get({id: D.rootCmt}).$promise
						.then(function (c) {
							A.htmld = $sce.trustAsHtml(c.argumentation) // todo v2:should be citation
						})

					$http.get('api/cmt/' + D.rootCmt)
						.success(function (tree /*, status, headers, config*/) {
							A.rootCmt = A.cmts = tree

							$scope.$broadcast('dataloaded');
						})
						.error(function () {
							A.errmsg = "Aucun débat à cette adresse"
							$scope.loading = false;
						})
				})
				.catch(function (err) {
					console_dbg("??", err)
				})
			;

			/*Socket.on("entered", function (buddy) {
				console_dbg(buddy + " has joined")
			});

			Socket.on("newcmt", function (data) {
				console_dbg("new outer cmt", data)
				var path, item, parentCmt, parentItemEl, annotation, p = {x: 0, y: 0}, _len, _i;

				path = data.parentPath.split("#")
				item = data.cmt;

				parentCmt =
					(path.length == 1 && path[0] == A.rootCmt._id) ? A.rootCmt : A.findCmt(A.rootCmt, path, 1)
				parentCmt.children.push(item)

				parentItemEl = $_(parentCmt._id)
				node = $('#' + parentCmt._id)
				annotation = {ranges: [item.selection]};

				annote.highlightAnnotation(annotation, parentItemEl)
				console_dbg(annotation)
				scroll = parentCmt._id == A.rootCmt._id ? A.docView.scrollTop : 0;
				pY = (1 + Math.round($(annotation.highlights[0]).position().top - node.position().top - scroll))
				pX = 4;

				annote.deleteAnnotation(annotation);

				parentCmt.notes = parentCmt.notes || []
				for (_i = 0, _len = parentCmt.notes.length; _i < _len; _i++) {
					if (parentCmt.notes[_i].pos.top == pY) pX += 2
				}

				parentCmt.notes.push({
					avis: item.avis,
					selection: item.selection,
					pos: {top: pY, left: pX},
					id: item._id
				});
			});*/

			/*if ($rootScope.user)
			 Socket.emit("enter", {room: A.debatId, uid: $rootScope.user.uid})
			 */

			/** calculate margin mark positions */
			function calcMarginMarKPos(item, posX, posY) {
				// dots next to each others
				var _i, _len2;
				var marks = item.notes
				//marks=marks.concat(item.hypos,item.notes)
				for (_i = 0, _len2 = marks.length; _i < _len2; _i++) {
					if (marks[_i].pos.top == posY) posX += 6
					if (posX > 30) {
						posY += 9;
						posX = 4
					} // next line
				}
				/*for (_i = 0, _len2 = item.notes.length; _i < _len2; _i++) {
				 if (item.notes[_i].pos.top == posY) posX += 7
				 if (posX > 30) {
				 posY += 9;
				 posX = 4
				 } // next line
				 }*/
				return {x: posX, y: posY}
			}

			/** compute the dots and triangles position
			 *  todo : need optimization (see when dots > 100)
			 *  try with bfs instead of dfs
			 * */
			this.setupMarginMark = function (item) {

				var _l, _i, _len, _len2, nodeEl = $_(item._id), it,
					node = $('#' + item._id), annotation = {ranges: []},
					scroll = item._id == A.rootCmt._id ? A._docview.scrollTop(): 0;
				item.notes = [];
				item.hypos = [];

				var posX, posY;

				for (_l = 0, _len = item.children.length; _l < _len; _l++) {
					it = item.children[_l]
					annotation.ranges = [it.selection]
					annote.highlightAnnotation(annotation, nodeEl)

					if (!annotation.highlights[0] || !node.position()) {
						/** something went missing during the comment post
						 * can happen with phantom and/or multiples selections
						 * todo : findout when in the test case
						 */
						console_dbg("NO annotation highlight!", it.selection, annotation.highlights[0], node.position())
						A.clearSelections()
						return
					}
					else {
						// todo : manage the margin display with section foldings here
						posY = -1 + Math.round($(annotation.highlights[0]).position().top - node.position().top - scroll)
						posX = 4;
						// dots next to each others
						for (_i = 0, _len2 = item.notes.length; _i < _len2; _i++) {
							if (item.notes[_i].pos.top == posY) posX += 6
							if (posX > 30) {
								posY += 9;
								posX = 4
							} // next line
						}
						//item.avisclass =*/
						item.notes.push({
							avis: it.avis,
							avisclass: avisclass[it.avis],// 0:green, 1:red, 2:blue,
							selection: it.selection,
							pos: {top: posY, left: posX},
							id: it._id
						});
						it.avisclass = avisclassframe[it.avis]
					}
					A.setupMarginMark(it) // recurse
				}

				A.clearSelections()

				node.find('.annotator-hl').each(function () {
					$(this).contents().insertBefore(this);
					$(this).remove();
				});
			}

			A.updateTmpMsg = function(cmt,atTime)  {
				console_dbg('update triggered in ', atTime)
				$timeout( function() {

					cmt.temp = false // either store client date in cmt or return server date
					cmt.timeout = true
					// maybe we should narrow to the item itself, but this is angular cuisine
					if($_('debat')) // timeout will trigger even if the user left the page
						angular.element($_('debat')).scope().$apply()
				}, atTime)
			}

			// used for nanobar progress
			this.countNbCmt = function (item) {
				var _l, _len, it, count = item.children.length;
				for (_l = 0, _len = item.children.length; _l < _len; _l++) {
					it = item.children[_l]
					count += A.countNbCmt(it)
				}
				return count
			}

			// follow the path to find an item
			this.findCmt = function (cmt, path, j) {
				var id = path[j]
				for (var i in cmt.children) {
					if (cmt.children[i]._id == id)
						if (j == path.length - 1)
							return cmt.children[i]
						else
							return A.findCmt(cmt.children[i], path, j + 1)
				}
				return null;
			}


			// efface les selections. Appelé au mouse down avant toute selection
			this.clearSelections = function () {
				ClearSelections();
				if (A.selectedElement)
					A.selectedElement.find('.annotator-hl').each(function () {
						$(this).contents().insertBefore(this);
						return $(this).remove();
					});
			}

			this.rmSelection = function () {
				annote.ignoreMouseup = false
				if (A.annotation) {
					$(A.annotation.highlights).removeClass('annotator-hl-temporary');
					annote.deleteAnnotation(A.annotation);
					A.annotation = null
				}
				A.clearSelections()
			}

			/*
				mouse up sur un item
			 */
			this.selectItem = function (event, item) {
				A.selectedItem = item
				A.selectedElement = $('#' + item._id)
				annote.selectElement(A.selectedElement)
			}

			this.callEditor = function (annotation) {

				console_dbg("call editor", A.addmedia)
				$scope.processing = false

				if (!$rootScope.loggedIn) { // logged in? otherwise show login window
					angular.element($_('Dialoguea')).scope().$apply(function () { //post digest
						$rootScope.showLoginWindow = true;
						$rootScope.message = "Vous devez être connecté pour participer"
						A.rmSelection()
					})
				} else {
					A.annotation = annotation
					$(annotation.highlights).removeClass('annotator-hl-temporary');
					//$(annotation.highlights).removeClass('annotator-hl');
					A.newcmt = {
						uid: $rootScope.user.uid,
						prenom: $rootScope.user.prenom, // todo fixme - quickhack
						citation: annotation.quote,
						reformulation: '',
						argumentation: '',
						selection: annotation.ranges[0],
						avis: null,
						parentId: A.selectedItem._id,
						debat: A.debat._id
					}

					A.status = A.ADDINGCMT
					A.addmedia=false
					// v this function is called from outside the mvc by annotation
					angular.element($_('argumentForm')).scope().$apply(function () {
						$timeout( function() {
							$_('reformulation').focus()
						},200)
					});
				}
				/*annote.deleteAnnotation(A.annotation);
				A.clearSelections()
				A.annotation = null*/
			}

			this.editComment = function (item) {
				if($scope.processing) return
				A.status = item.avis==3 ? A.EDITHYPOSTASE : A.EDITCMT
				_.extend( A.newcmt,item)
				A.curEditItem = item
			}

			this.postcomment = function (form) {
				//console_dbg(form)
				annote.ignoreMouseup = false

				if (!(
					A.newcmt.reformulation != '' && A.newcmt.reformulation.trim() != '' &&
					A.newcmt.argumentation != '' && A.newcmt.argumentation.trim() != '' &&
					A.newcmt.avis != -1 )) {
					return;
				}
				A.newcmt.reformulation = $sce.trustAsHtml(A.newcmt.reformulation).toString()
				A.newcmt.argumentation = $sce.trustAsHtml(A.newcmt.argumentation).toString()


				if(A.status == A.EDITCMT || A.status == A.EDITHYPOSTASE )  {
					console_dbg("EDIT",A.newcmt)
					Cmt.update({id: A.newcmt._id}, {
						reformulation: A.newcmt.reformulation,
						argumentation: A.newcmt.argumentation,
						avis: A.newcmt.avis
					}).$promise
						.then(function(cmt) {
							console_dbg(cmt)
							A.curEditItem.mark.avis = cmt.avis
							_.extend(A.curEditItem, { avis: cmt.avis, reformulation: cmt.reformulation, argumentation:cmt.argumentation})
						})
						.catch(function (data) {
							console_dbg(data)
							A.curEditItem.temp=false // a clock pb between server and client
						})
						.finally(function () {
							A.curEditItem = null
							A.closeNewCommentModal(form)
						})
				}
				else {
					var newcmt = new Cmt(A.newcmt)
					newcmt.$save()
						.then(function () {
							Cmt.get({id: newcmt._id}).$promise
								.then(function (cmt) {

									var scroll = A.selectedItem._id == A.rootCmt._id ? A.docView.scrollTop : 0;
									var posY = Math.round(-1 + $(A.annotation.highlights[0]).position().top - A.selectedElement.position().top - scroll)
									var pos = calcMarginMarKPos(A.selectedItem, 4, posY)
									var newmark = {
										avis: cmt.avis,
										selection: cmt.selection,
										pos: {top: pos.y, left: pos.x},
										id: cmt._id
									}
									A.selectedItem.notes = A.selectedItem.notes || []
									A.selectedItem.notes.push(newmark);
									A.selectedItem.children = A.selectedItem.children || []
									cmt.mark = newmark
									cmt.children = []
									A.selectedItem.children.push(cmt)

									//console_dbg($rootScope.user.uid)
									/*Socket.emit("newcmt", {
									 cmt: cmt,
									 parentPath: A.selectedItem.path,
									 room: A.debatId,
									 uid: $rootScope.user.uid
									 })*/
									A.closeNewCommentModal(form)

									// remove temp field dans 30 secondes

									A.updateTmpMsg(cmt, Settings.postTimeout)

									$timeout(function () {
										A.scrollDebateTo(cmt._id)
									}, 200);
								});
						})
						.catch(function (res) {
							A.errmsg = res.data.message
							console_dbg("error saving obj", res.data);
							A.closeNewCommentModal(form)
						})
						.finally(function () {
						})
				}
			}

			$scope.closeNewCommentModal = A.closeNewCommentModal = function (form) {
				form.$setPristine();
				form.$setUntouched();
				A.clearSelections()
				A.annotation = null
				A.status = A.INIT;
				A.processing = false;
				annote.ignoreMouseup = false
			}


			this.callEditor2 = function (annotation) {
				A.processing = false
				console_dbg("calling hypostase")
				A.annotation = annotation
				$(annotation.highlights).removeClass('annotator-hl-temporary');

				A.newhypostase = {
					uid: $rootScope.user.uid,
					prenom: $rootScope.user.prenom, // todo fixme - quickhack
					citation: annotation.quote,
					reformulation: '',
					argumentation: '',
					selection: annotation.ranges[0],
					avis: 3,
					parentId: A.selectedItem._id,
					debat: A.debat._id // not implemented yet TODO
				}

				angular.element($_('hypostaseForm')).scope().$apply(function () {
					A.status = A.HYPOSTASE
				});
			}

			this.closeHypostaseModal = function (form) {
				A.processing = false
				console_dbg("closing")
				A.status = A.INIT;
				annote.ignoreMouseup = false
				annote.deleteAnnotation(A.annotation);
				A.clearSelections()
				A.annotation = null
				console_dbg(A.selectedHypostase)
				A.availColHypostases = [true, true, true, true, true, true]
				A.availRowHypostases = [true, true, true, true, true, true]
				for(var i= 0;i<6;i++)
					for(var j=0;j<6;j++)
					    hySelected[i][j] = false
			}

			this.postHypostase = function (form) {

				annote.ignoreMouseup = false
				form.$setPristine();
				form.$setUntouched();

				A.newhypostase.reformulation=""
				var i,_l
				for (i= 0,_l=A.choosenHypostases.length-1; i<_l; i++) {
					A.newhypostase.reformulation += A.choosenHypostases[i] +", "
				}
				A.newhypostase.reformulation += A.choosenHypostases[_l]

				console_dbg(A.newhypostase)
				// DUP CODE // TODO REFACTOR
				var newhyp = new Cmt(A.newhypostase)
				newhyp.$save()
					.then(function () {
						var posX, posY, _i, _len
						A.status = A.INIT
						console_dbg(newhyp)
						$http.get('api/1cmt/' + newhyp._id)
							.success(function (hyp) {
								console_dbg(hyp)
								A.selectedItem.notes = A.selectedItem.notes || []
								A.selectedItem.children = A.selectedItem.children || []
								A.selectedItem.children.push(hyp)
								var scroll = A.selectedItem._id == A.rootCmt._id ? A.docviewScroll : 0;
								//if(A.selectedItem.notes==null) A.selectedItem.notes=[]
								posY = Math.round(-1 + $(A.annotation.highlights[0]).position().top - A.selectedElement.position().top) - scroll
								/*var sameline=0;
								 for (_i = 0, _len = A.selectedItem.notes.length; _i < _len; _i++) {
								 if (A.selectedItem.notes[_i].pos.top == posY) sameline++
								 }*/
								var pos = calcMarginMarKPos(A.selectedItem, 4, posY)
								//posX = 4+sameline*6
								A.selectedItem.notes.push({
									avis: 3,
									selection: hyp.selection,
									pos: {top: pos.y, left: pos.x},
									id: hyp._id
								});

								//console_dbg($rootScope.user.uid)
								/*Socket.emit("newcmt", {
								 cmt: cmt,
								 parentPath: A.selectedItem.path,
								 room: A.debatId,
								 uid: $rootScope.user.uid
								 })*/

								A.annotation = null
								A.processing = false;
								A.clearSelections();

								$timeout(function () {
									A.scrollDebateTo(hyp._id)
								}, 200);
							})
					})
					.catch(function (res) {
						A.errmsg = res.data.message
						console_dbg("erreur à la sauvegarde de l'hypostase", res.data);
					})
					.finally(function () {
						form.$setPristine()
						form.$setUntouched()
					})
			}

			// reference le commentaire enfant // déclenché aussi au click pour les tablettes
			this.onOverNote = function (note, item) {

				if (A.isScrolling) return
				var node = $_(item._id);
				var annotation = {ranges: [note.selection]};
				annote.highlightAnnotation(annotation, node)
				$('#' + note.id).closest('.argumentation-card').addClass("highlightcard")
				//css("background-color","#F1F3F3")
			}

			this.onLeaveNote = function (note, item) {
				if (A.isScrolling) return
				A.selectedAnnotation = null
				var n = $('#' + note.id).closest('.argumentation-card')
				//n.css("background-color","white")
				n.removeClass("highlightcard")
				var it = $('#' + item._id)
				it.find('.annotator-hl').each(function () {
					$(this).contents().insertBefore(this);
					$(this).remove();
				});
			}


			this.onLeaveCmt = function (item) {
				if (A.isScrolling) return
				A.selectedAnnotation = null
				var it = $('#' + item.parentId)
				it.find('.annotator-hl').each(function () {
					$(this).contents().insertBefore(this);
					$(this).remove();
				});
			}

			this.onLeaveArg = function (item) {
				if (annote.mouseIsDown) {
					A.clearSelections()
				}
			}

			this.scrollDebateTo = function (itemId, next) {

				if (itemId != A.rootCmt._id) A.scrollToComment(itemId);
				else {
					var scroll = A._docview
					var y = $('#' + itemId).find('.annotator-hl').position().top
					scroll.animate({
						'scrollTop': y
					}, 500, function () {
						if (next) next()
					});
				}
			}

			this.scrollToComment = function (itemId, next) {

				var scroll = $('#debat')
				var node = $('#' + itemId).closest('.treenode')
				scroll.animate({
					'scrollTop': node.position().top + scroll.scrollTop()
				}, 500, function () {
					if (next) next()
				});
			}

			this.back = function () {
				window.history.back();
			}

			this.openInvite = function () {
				$scope.sent = false;
				$scope.invitationVisible = true
			}
			this.submitInvitation = function () {

				$scope.submitted = true // TODO rename this to invitationsubmited
				if (emailValid(A.inviteEmail)) {
					$scope.inviteMessage = ''
					$http.post('api/invite', {
						inviteEmail: A.inviteEmail,
						debat: A.debat._id,
						auteur: A.rootCmt.citation,
						titre: A.rootCmt.reformulation
					})
						.success(function (data /*, status, headers, config*/) {
							$scope.sentConfirmMessage = "Une invitation a été envoyée à " + A.inviteEmail;
							$scope.sent = true;
							A.inviteEmail = ''
						})
						.error(function (data) {
							$scope.message = data;
						})
					/*.finally( function() {
					 })*/
				} else {
					//A.inviteMessage ="Veuillez saisir une adresse mail valide"
					//console_dbg("register form isn't valid")
				}
			}


			$window.onresize = function (event) {// recompute margin marks when the window get resized
				$scope.loading = true
				A.docviewScroll = A.docView.scrollTop;
				A.setupMarginMark(A.rootCmt)
				//A.nanobar.go(100)
				$scope.loading = false
				A.windowWidth = "innerHeight" in window
					? window.innerWidth
					: document.documentElement.offsetWidth;
			};

			$scope.interacted = function (field) {
				return $scope.submitted && field.$dirty;
			};

			$scope.cancel = function () {
				$scope.invitationVisible = false
				A.inviteMessage = ''
				A.inviteEmail = ''
				$scope.submitted = false
				$scope.sent = false;
			}

			$("body").bind("mousedown", function (evt) {
				//if( e.target !== this )
				//    return;
				//A.clearSelections()
				if (A.selectedElement)
					ClearSelections();
			})
		}])

