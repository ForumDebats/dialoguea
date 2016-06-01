/**
 *  translation module controler
 */

angular.module('translation', ['pascalprecht.translate', 'ngSanitize'])
	.directive('languageSelector',function() {
		return{
			restrict:'E',
			templateUrl:'section/lang.html',
			controller:'LangCtrl'
		};
	})
	.controller('LangCtrl', ['$translate','$rootScope','$scope','$window',
		function ($translate,$rootScope,$scope,$window) {

			$scope.langs = [
				'ENGLISH',
				'FRENCH',
				'BRASIL']

			$scope.choosecountry=false;
			$scope.selectedLang = $window.localStorage.lang || 'FRENCH'; // todo : retrieve from provider
			$translate.use($scope.selectedLang)
			$scope.close = function() { $scope.choosecountry=false }
			$scope.switchLang = function(key){
				$translate.use(key)
				$window.localStorage.lang = key;
				$rootScope.selectedLang=$scope.selectedLang=key;
				$scope.choosecountry=false
			}
		}])

	.config(['$translateProvider', function ($translateProvider) {
		$translateProvider
			.translations('FRENCH', {
				MADE_BY: 'réalisé par',
				AND:'et',
				BUTTON_ARGUMENT: 'argumenter',
				ENGLISH : "anglais",
				FRENCH : "français",
				SELECT_TO_ARGUMENT : "(sélectionner dans le texte pour argumenter)",
				LOGIN:"se connecter",
				LOGOUT:"se déconnecter",
				CONNECT_TO_DIALOGUEA:"Se connecter à DIALOGUEA",
				USER_NAME:"Nom d'utilisateur",
				PASSWORD:"Mot de passe",
				YOUR_EMAIL:"votre email",
				NEW_DEBATE:"Ouvrir un nouveau débat",
				SELECT_A_TO_ARGUMENT:"(sélectionner dans “A” — Argumentaire — pour débattre)",
				RESTITUTION:"restitution",
				SEND_INVITE:"Envoyer une invitation",
				COMMENT:"commentaire",
				CREATE_ACCOUNT:"Créer un compte",
				FORGOT_YOUR_PASSWORD:"Mot de passe oublié ?",
				MUST_BE_CONNECTED:"Vous devez être connecté pour participer",
				ACTIVATE_FIRST:"Vous devez d'abord activer votre compte. Un email vous a été envoyé.",
				SELECT_FILE_TO_UPLOAD:"Sélectionner le fichier à envoyer",
				DROP_FILES_HERE:"Déposer le fichier ici",
				MULTILANG:'Texte multilangue'
			})
			.translations('ENGLISH', {
				MADE_BY: 'by',
				AND:'and',
				BUTTON_ARGUMENT: 'argue',
				ENGLISH : "english",
				FRENCH : "french",
				SELECT_TO_ARGUMENT : "(select inside the text to argument)",
				LOGIN:"log in",
				LOGOUT:"log out",
				CONNECT_TO_DIALOGUEA:"Log in to DIALOGUEA",
				USER_NAME:"Username",
				PASSWORD:"Password",
				YOUR_EMAIL:"your email",
				NEW_DEBATE:"Open a new debate",
				SELECT_A_TO_ARGUMENT:"(select text in “A” — Arguments — to debate)",
				RESTITUTION:"restitution",
				SEND_INVITE:"Send an invitation",
				COMMENT:"comment",
				CREATE_ACCOUNT:"Create an account",
				FORGOT_YOUR_PASSWORD:"Forgot your password ?",
				MUST_BE_CONNECTED:"Please login first to participate",
				SELECT_FILE_TO_UPLOAD:"Select file to upload",
				DROP_FILES_HERE:"Drop file here",
				MULTILANG:'Multi-lingual text'

			})
			.translations('BRASIL', {
				MADE_BY: 'por',
				AND:'et',
				BUTTON_ARGUMENT: 'argumentar',
				ENGLISH : "Inglês",
				FRENCH : "Francês",
				SELECT_TO_ARGUMENT : "(select inside the text to argument)",
				LOGIN:"log in",
				LOGOUT:"log out",
				CONNECT_TO_DIALOGUEA:"Log in to DIALOGUEA",
				USER_NAME:"Username",
				PASSWORD:"Password",
				YOUR_EMAIL:"your email",
				NEW_DEBATE:"Open a new debate",
				SELECT_A_TO_ARGUMENT:"(select text in “A” — Arguments — to debate)",
				RESTITUTION:"restitution",
				SEND_INVITE:"Send an invitation",
				COMMENT:"comente",
				CREATE_ACCOUNT:"Create an account",
				FORGOT_YOUR_PASSWORD:"Forgot your password ?"
				//MUST_BE_CONNECTED:'?'
			});
		$translateProvider
			.preferredLanguage('FRENCH')
			.fallbackLanguage('ENGLISH')
			.useSanitizeValueStrategy('sanitize');
		//$translateProvider.useCookieStorage();
	}])
;
