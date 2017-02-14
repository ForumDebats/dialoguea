/**
 * Dialoguea
 * checkstrength.js
 *
 * copyright 2014-2017 Forum des débats
 * author : Philippe Estival -- phil.estival @ free.fr
 * Released under the AGPL license
 *
 * password strenght level
 */

var basicStrenghtTest = function (p) {

    console_dbg(p)
    var _force = 0;
    var _regex = /[$-/:-?{-~!"^_`\[\]]/g;

    var _lowerLetters = /[a-z]+/.test(p);
    var _upperLetters = /[A-Z]+/.test(p);
    var _numbers = /[0-9]+/.test(p);
    var _symbols = _regex.test(p);

    var _flags = [_lowerLetters, _upperLetters, _numbers, _symbols];
    var _passedMatches = $.grep(_flags, function (el) { return el === true; }).length;

    _force += 2 * p.length + ((p.length >= 10) ? 1 : 0);
    _force += _passedMatches * 10;

    // penality (short password)
    _force = (p.length <= 6) ? Math.min(_force, 10) : _force;

    // penality (poor variety of characters)
    _force = (_passedMatches == 1) ? Math.min(_force, 10) : _force;
    _force = (_passedMatches == 2) ? Math.min(_force, 20) : _force;
    _force = (_passedMatches == 3) ? Math.min(_force, 40) : _force;

    console_dbg(_force)
    return _force;
}

function checkstrength() {

    return {
        replace: false,
        restrict: 'EACM',
        link: function (scope, iElement, iAttrs) {

            var strength = {
                colors: ['#F00', '#F90', '#FF0', '#9F0', '#0F0'],
                mesureStrength: basicStrenghtTest,
                getColor: function (s) {
                    var idx = 0;
                    if (s <= 10) {
                        idx = 0;
                    }
                    else if (s <= 20) {
                        idx = 1;
                    }
                    else if (s <= 30) {
                        idx = 2;
                    }
                    else if (s <= 40) {
                        idx = 3;
                    }
                    else {
                        idx = 4;
                    }
                    return {idx: idx + 1, col: this.colors[idx]};
                }
            };

            scope.$watch(iAttrs.checkStrength, function () {
                if (!scope.user.password) {
                    $(iElement).children('li')
                        .css({"background": "#DDD"})
                    return;
                }
                //console_dbg(scope.user, scope)
                var elements = []
                var children = $(iElement).children("li");
                var _l = children.length
                for (var i = 0; i < _l; i++) {
                    elements.push(children[i])
                }
                //console_dbg(elements)
                if (scope.user.password === '') {
                    iElement.css({"display": "none"});
                } else {
                    var c = strength.getColor(strength.mesureStrength(scope.user.password));
                    iElement.css({"display": "inline"});
                    /*console_dbg($(iElement).children("li"))
                    console_dbg($(iElement).children('li').slice(0, 1))*/
                    $(iElement).children('li')
                        .css({"background": "#DDD"})
                        .slice(0, c.idx)
                        .css({"background": c.col});
                }
            });

        },
        template: '<li class="point"></li>' +
                  '<li class="point"></li>' +
                  '<li class="point"></li>' +
                  '<li class="point"></li>' +
                  '<li class="point"></li>'
    }
}