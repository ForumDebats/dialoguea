/**
 * Dialoguea
 * upload.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 * upload
 */


angular.module('upload', [], function(){})
.factory('Broadcast',BroadcastFactory)
.controller('FileUploadCtrl',
            ['$rootScope','$scope','Broadcast','$translate','$filter',
            function($rootScope,$scope,Broadcast,$translate, $filter)
{

	// drag and drop location
	/*
	var dropbox = document.getElementById("dropbox")
	$scope.dropText = $translate.instant('DROP_FILES_HERE');

	// init event handlers
	function dragEnterLeave(evt) {
		evt.stopPropagation()
		evt.preventDefault()
		$scope.$apply(function(){
			$scope.dropText = $translate.instant('DROP_FILES_HERE');
			$scope.dropClass = ''
		})
	}

	if(dropbox) {
		dropbox.addEventListener("dragenter", dragEnterLeave, false)
		dropbox.addEventListener("dragleave", dragEnterLeave, false)
		dropbox.addEventListener("dragover", function (evt) {
			evt.stopPropagation()
			evt.preventDefault()
			var clazz = 'not-available'
			var ok = evt.dataTransfer && evt.dataTransfer.types && evt.dataTransfer.types.indexOf('Files') >= 0
			$scope.$apply(function () {
				$scope.dropText = ok ? 'Drop files here...' : 'Only files are allowed!'
				$scope.dropClass = ok ? 'over' : 'not-available'
			})
		}, false)
		dropbox.addEventListener("drop", function (evt) {
			console_dbg('drop evt:', JSON.parse(JSON.stringify(evt.dataTransfer)))
			evt.stopPropagation()
			evt.preventDefault()
			$scope.$apply(function () {
				$scope.dropText = 'Drop files here...'
				$scope.dropClass = ''
			})
			var files = evt.dataTransfer.files
			if (files.length > 0) {
				$scope.$apply(function () {
					$scope.files = []
					for (var i = 0; i < files.length; i++) {
						$scope.files.push(files[i])
					}
				})
			}
		}, false)
	}//============== DRAG & DROP =============
	*/


	$scope.setFiles = function(element,field) {
		$scope.$apply(function($scope) {
			// Turn the FileList object into an Array
			$scope.files = []
			for (var i = 0; i < element.files.length; i++) {
				$scope.files.push(element.files[i])
			}
			$scope.progressVisible = false

			$scope.fileSelected = true
			$scope.processing = false
			document.getElementById(field).value =
				$scope.files[0].name + ' (' +  $filter('number')($scope.files[0].size / 1024, 2) +' kB.)';
		});
	};

	$scope.uploadFile = function(postpath) {
		var fd = new FormData()
		for (var i in $scope.files) {
			fd.append("uploadedFile", $scope.files[i])
		}
		var xhr = new XMLHttpRequest()
		xhr.upload.addEventListener("progress", uploadProgress, false)
		xhr.addEventListener("load", uploadComplete, false)
		xhr.addEventListener("error", uploadFailed, false)
		xhr.addEventListener("abort", uploadCanceled, false)
		xhr.open("POST", postpath)
		console_dbg("uploading to",postpath)
		$scope.progressVisible = true
		xhr.send(fd)
	}

	function uploadProgress(evt) {
		console_dbg(evt)
		$scope.$apply(function(){
			if (evt.lengthComputable) {
				$scope.progress = Math.round(evt.loaded * 100 / evt.total)
			} else {
				$scope.progress = '---'
			}
		})
	}

	function uploadComplete(evt) {
		/* event raised when the server send back a response */
		if(evt.target.status==400) alert("Le format du fichier n'est pas supporté")
		else
			Broadcast.prepForBroadcast(evt.target.responseText,'uploadComplete')
	}

	function uploadFailed(evt) {
		alert("Une erreur est survenue à l'envoi du fichier")
	}

	function uploadCanceled(evt) {
		$scope.$apply(function(){
			$scope.progressVisible = false
		})
		alert("L'envoi a été annulé par l'utilisateur ou le navigateur a été déconnecté.")
	}
}]);


