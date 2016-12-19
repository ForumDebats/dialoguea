/**
 * Date: <2014-12-01 16:29:44>
 * DialogueA
 * Philippe.Estival@enov-formation.com
 *
 * panel.js
 * header section display
 * deprecated
 *
 **/

angular.module('panel')

    .directive('panel', ['$location', function ($location) {
        return {
            restrict: 'E', //element
            templateUrl: 'section/admin/panel.html',
            controller: function () {
                this.tab = 'groups';
                this.isSelected = function (tab) {
                    return this.tab === tab
                }
                this.setTab = function (tab) {
                    this.tab = tab;
                };
                this.selectTab = function (tab) {
	                console_dbg(this.tab)
                    this.tab = tab;
                };
            },
            controllerAs: 'panel'
        }
    }]);
