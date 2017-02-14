/**
 * Dialoguea
 * message.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * stored client side
 *
   TODO :
   - traduction / bundle
   - server side
 */


var MessageCtrl = ['$scope','$stateParams',function ($scope,$stateParams) {
    $scope.fade=false;
    this.getMessage = function (message) {
        console_dbg(message)
        switch (message) {
					case "alreadyactivated":return "Ce compte a déjà été activé"
					case "invalid_token":return "Code d'activation invalide"
					case "activatefirst": return "Vous devez d\'abord activer votre compte." +
					     "Un email vous a été envoyé sur votre messagerie lors de votre inscription."
					case "mailererror":return "Désolé, un problème est survenu à l'envoi de l'email de confirmation."+
							 "Merci de Contactez forum-des-debats@dialoguea.fr"
					case "noaccount": return "Aucun compte Dialoguea n'est enregistré avec cet email"
					case "registered":return "Votre compte a été activé avec succès. <a href='#/'>Entrez dans les débats.</a>"
					case "activating":return "Les instructions pour réinitialiser le mot de passe vous ont été envoyées."
					case "pwupdated":return "Votre mot de passe a été mis à jour avec succès"
					default : return "Erreur " +message;
        }
    }
    $scope.message = this.getMessage($stateParams.message) // you can use routeparam as well
}]

