/**
 * Created by phil on 20/01/15.
 */

angular.module('register', ['ngResource','ngMessages'])

.directive('checkStrength', checkstrength)
.controller('RegisterCtrl', ['$scope','$http',function($scope,$http) {
        $scope.user = { nom:'', prenom:'', email:'',password:''};
        $scope.submitted = false;
        $scope.validated = false;
        $scope.message=''
        $scope.interacted = function(field) { return $scope.submitted && field.$dirty; };

        $scope.submit = function() {
            $scope.submitted=true;
            console_dbg($scope.user)
            if($scope.registerForm.$valid) {
                $http
                    .post('/newaccount', $scope.user)
                    .success(function (data /*, status, headers, config*/) {
                        $scope.validated=true;
                    })
                    .error( function (data) {
                        $scope.message = data;
                    })
            }
        }
}])
