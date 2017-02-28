/**
 * Dialoguea
 * utils.js
 *
 * copyright 2015-2017 Forum Des Débats and the following authors
 * authors : Philippe Estival, Jean Sallantin, Claire Ollagnon, Véronique Pinet
 * Released under the AGPL license
 *
 */

function selectMenu(s)
{ selected=s;
	$('#adminmenunav').children('li').removeClass('active');
	if(s) $('#'+s).addClass('active');
}
var selected='opendebat';

function getParameterByName(name,loc) {
    var locat = loc || location.search
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(locat);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function verticalOffset(el) {
    var _y = 0;
    while( el && !isNaN( el.offsetTop ) ) {
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return _y;
}

function getOffset( el ) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft - el.scrollLeft;
        _y += el.offsetTop - el.scrollTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}

function getOffsetFromParent( el ) {
    var _x = 0;
    var _y = 0;
    _x += el.offsetLeft - el.scrollLeft;
    _y += el.offsetTop - el.scrollTop;

    return { top: _y, left: _x };
}

function elbyId(id) { return document.getElementById(id)}
var $_=elbyId

var ClearSelections = function() {
    if (window.getSelection) {
        if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
        }
    } else if (document.selection) {  // IE?
        document.selection.empty();
    }
}

function drag(elementToDrag, event){

	var deltaX = event.clientX - parseInt(elementToDrag.style.left);
	var deltaY = event.clientY - parseInt(elementToDrag.style.top);
	if (document.addEventListener){
		document.addEventListener("mousemove", moveHandler, true);
		document.addEventListener("mouseup", upHandler, true);
	}
	else if (document.attachEvent){
		document.attachEvent("onmousemove", moveHandler);
		document.attachEvent("onmouseup", upHandler);
	}
	else {
		var oldmovehandler = document.onmousemove;
		var olduphandler = document.onmouseup;
		document.onmousemove = moveHandler;
		document.onmouseup = upHandler;
	}
	if (event.stopPropagation) event.stopPropagation();
	else event.cancelBubble = true;
	if (event.preventDefault) event.preventDefault();
	else event.returnValue = false;
	function moveHandler(e){
		if (!e) e = window.event;
		var width = window.innerWidth
			|| document.documentElement.clientWidth
			|| document.body.clientWidth;

		var height = window.innerHeight
			|| document.documentElement.clientHeight
			|| document.body.clientHeight;
		if(e.clientX>0 && e.clientY>0 && e.clientX < width && e.clientY < height) {
			elementToDrag.style.left = (e.clientX - deltaX) + "px";
			elementToDrag.style.top = (e.clientY - deltaY) + "px";
		}
		if (e.stopPropagation) e.stopPropagation();
		else e.cancelBubble = true;

	}
	function upHandler(e){
		if (!e) e = window.event;
		if (document.removeEventListener){
			document.removeEventListener("mouseup", upHandler, true);
			document.removeEventListener("mousemove", moveHandler, true);
		}
		else if (document.detachEvent){
			document.detachEvent("onmouseup", upHandler);
			document.detachEvent("onmousemove", moveHandler);
		}
		else {
			document.onmouseup = olduphandler;
			document.onmousemove = oldmovehandler;
		}
		if (e.stopPropagation) e.stopPropagation();
		else e.cancelBubble = true;
	}
}


var NAVIGATOR = navigator.sayswho = (function(){
	var ua= navigator.userAgent, tem,
		M= ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
	if(/trident/i.test(M[1])){
		tem=  /\brv[ :]+(\d+)/g.exec(ua) || [];
		return 'IE '+(tem[1] || '');
	}
	if(M[1]=== 'Chrome'){
		tem= ua.match(/\b(OPR|Edge)\/(\d+)/);
		if(tem!= null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
	}
	M= M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
	if((tem= ua.match(/version\/(\d+)/i))!= null) M.splice(1, 1, tem[1]);
	return M;
})();