

angular.module('menu', [])

	.controller('MenuCtrl',
	function()
	{
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
	});