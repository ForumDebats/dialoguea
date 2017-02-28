

var getImg = ['$http', function($http) {
    return {
        restrict:'A',
        require: 'ngModel',
        link : function(scope, element, attrs, ngModel) {
            ngModel.$parsers.push(function(value) {
                if(!value || !urlValid(value)) return;

                if(!value.startsWith('http://')) {
                    value ='http://' + value;
                }
                $http.get(value).
                    success(function (c,s) {
                        scope.message = "ok"+s
                    }).
                    error(function (d,e) {
                        scope.message = "err"+d
                    })
                return value;
            });
        }
    }
}]


function errSrc() {
    return {
        link: function(scope, element, attrs, ngModel) {

            element.bind('error', function() {
                if (attrs.src != attrs.errSrc) {
                    attrs.$set('src', attrs.errSrc);
                    scope.noImgUrl=true
                }
            });
        }
    }
}


