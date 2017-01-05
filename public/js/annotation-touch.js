/*  Annotator Touch Plugin - v1.1.1
 *  Copyright 2012-2015, Compendio <www.compendio.ch>
 *  Released under the MIT license
 *  More Information: https://github.com/aron/annotator.touch.js
 */


(function () {
	var __bind = function (fn, me) {
		return function () {
			return fn.apply(me, arguments)
		}
	}, __hasProp = {}.hasOwnProperty, __extends = function (child, parent) {
		for (var key in parent) {
			if (__hasProp.call(parent, key))child[key] = parent[key]
		}
		function ctor() {
			this.constructor = child
		}

		ctor.prototype = parent.prototype;
		child.prototype = new ctor;
		child.__super__ = parent.prototype;
		return child
	};


	Annotator.Plugin.Touch = function (_super) {
		var jQuery, _t;
		__extends(Touch, _super);
		_t = Annotator._t;
		jQuery = Annotator.$;
		Touch.states = {ON: "on", OFF: "off"};

		Touch.prototype.template =
			//"<div id='newCmtBtn'><div class='button-content'>Argumenter</div><div class='arrow'></div></div> "
			'<div class="annotator-touch-widget annotator-touch-controls annotator-touch-hide">'
			+ '<div class="arrow"></div><div class="annotator-button annotator-add annotator-focus">'
			+ "Argumenter"
			+ "</div></div>";

		Touch.prototype.classes = {hide: "annotator-touch-hide"};
		Touch.prototype.options = {force: false, useHighlighter: false};

		function Touch(element, options) {
			this._onDocumentTap = __bind(this._onDocumentTap, this);
			this._onHighlightTap = __bind(this._onHighlightTap, this);
			this._onAdderTap = __bind(this._onAdderTap, this);
			this._onToggleTap = __bind(this._onToggleTap, this);
			this._onSelection = __bind(this._onSelection, this);
			this._watchForSelection = __bind(this._watchForSelection, this);

			Touch.__super__.constructor.apply(this, arguments);
			this.utils = Annotator.Plugin.Touch.utils;
			this.selection = null;
			this.document = jQuery(document)
		}

		Touch.prototype.pluginInit = function () {
			if (!(Annotator.supported() && (this.options.force || Touch.isTouchDevice()))) {
				return
			}
			this._setupControls();
			if (this.options.useHighlighter) {
				this.showControls();
				this.highlighter = new Highlighter({
					root: this.element[0],
					prefix: "annotator-selection",
					enable: false,
					highlightStyles: true
				})
			}
			this.document.delegate(".annotator-hl", "tap", {preventDefault: false}, this._onHighlightTap);
			this.subscribe("selection", this._onSelection);
			this._unbindAnnotatorEvents();
			//this._setupAnnotatorEvents();
			return this._watchForSelection()
		};
		Touch.prototype.pluginDestroy = function () {
			if (this.controls) {
				this.controls.remove()
			}
			if (this.highlighter) {
				this.highlighter.disable()
			}
			if (this.annotator) {
				return this.annotator.editor.unsubscribe("hide", this._watchForSelection)
			}
		};
		Touch.prototype.startAnnotating = function () {
			if (this.highlighter) {
				this.highlighter.enable()
			}
			this.toggle.attr("data-state", Touch.states.ON);
			this.toggle.html("Stop Annotating");
			return this
		};
		Touch.prototype.stopAnnotating = function () {
			if (this.highlighter) {
				this.highlighter.disable()
			}
			this.toggle.attr("data-state", Touch.states.OFF);
			this.toggle.html("Start Annotating");
			return this
		};
		Touch.prototype.isAnnotating = function () {
			var usingHighlighter;
			usingHighlighter = this.options.useHighlighter;
			return !usingHighlighter || this.toggle.attr("data-state") === Touch.states.ON
		};
		Touch.prototype.showEditor = function (annotation) {
			console_dbg('show editor')
			this.annotator.showEditor(annotation, {});
			this.hideControls();
			return this
		};
		Touch.prototype.showControls = function () {
			this.controls.removeClass(this.classes.hide);
			return this
		};
		Touch.prototype.hideControls = function () {
			if (!this.options.useHighlighter) {
				this.controls.addClass(this.classes.hide)
			}
			return this
		};
		Touch.prototype._setupControls = function () {
			//this.annotator.adder.remove();
			this.controls = jQuery(this.template).appendTo("body");
			this.adder = this.controls.find(".annotator-button");
			this.adder.bind("tap", {
				onTapDown: function (event) {
					return event.stopPropagation()
				}
			}, this._onAdderTap);
			this.toggle = this.controls.find(".annotator-touch-toggle");
			this.toggle.bind({tap: this._onToggleTap});
			if (!this.options.useHighlighter) {
				return this.toggle.hide()
			}
		};

		Touch.prototype._unbindAnnotatorEvents = function () {
			this.document.unbind({
				mouseup: this.annotator.checkForEndSelection,
				mousedown: this.annotator.checkForStartSelection
			});

			this.document.bind({
				touchend: this.touchEnd
			});
			//document.addEventListener("touchend", this.setPointerPosition, true);

			return this.element.unbind("click mousedown mouseover mouseout")
		};

		Touch.prototype.touchEnd = function () {
			console_dbg('END')
		}


		Touch.prototype._watchForSelection = function () {
			var interval, start, step;
			if (this.timer) {
				return
			}
			interval = Touch.isAndroid() ? 300 : 1e3 / 60;
			start = (new Date).getTime();
			step = function (_this) {
				return function () {
					var progress;
					progress = (new Date).getTime() - start;
					if (progress > interval) {
						start = (new Date).getTime();
						_this._checkSelection()
					}
					return _this.timer = _this.utils.requestAnimationFrame.call(window, step)
				}
			}(this);
			return step()
		};
		Touch.prototype._clearWatchForSelection = function () {
			this.utils.cancelAnimationFrame.call(window, this.timer);
			return this.timer = null
		};
		Touch.prototype._checkSelection = function () { // this is a process
			var previous, selection, string;
			selection = window.getSelection();
			previous = this.selectionString;
			string = jQuery.trim(selection + "");
			if (selection.rangeCount && string !== this.selectionString) {
				this.range = selection.getRangeAt(0);
				this.selectionString = string
			}
			if (selection.rangeCount === 0 || this.range && this.range.collapsed) {
				this.range = null;
				this.selectionString = ""
			}
			//console_dbg(selection)
			if (this.selectionString !== previous) {
				//console_dbg(selection)
				return this.publish("selection", [this.range, this])
			}
		};
		Touch.prototype._onSelection = function (range) {
			if (this.isAnnotating() && this.range && this._isValidSelection(this.range)) {
				//this.adder.css({'pointer-events':'none'});

				//console_dbg(this.range)
				this.adder.removeAttr("disabled");

				// insert a span around selection to find its position
				var markerEl, markerId = "sel_" + new Date().getTime() + "_" + Math.random().toString().substr(2);
				markerEl = document.createElement("span");
				markerEl.id = markerId;
				range.insertNode(markerEl);

				var left = 0, top = 0;
				p = getOffset(markerEl);


				var selHeight = 0
				var top = range.getClientRects()[0].top
				var bottom = range.getClientRects()[0].bottom

				/*if (!range.collapsed && range.getClientRects) {
					var startRange = range.cloneRange();
					startRange.collapse(true);
					var selTop = startRange.getClientRects()[0].top;
					startRange.detach();
					var endRange = range.cloneRange();
					endRange.collapse(false);
					selHeight = endRange.getClientRects()[0].bottom - selTop;
					endRange.detach();
					//alert(selHeight, range)
				}*/
				$('.annotator-touch-widget').css({top: top-50,left: p.left-45})
				markerEl.parentNode.removeChild(markerEl);

				return this.showControls()
			} else {
				this.adder.attr("disabled", "");
				return this.hideControls()
			}
		};
		Touch.prototype._isValidSelection = function (range) {
			var inElement, isStartOffsetValid, isValidEnd, isValidStart;
			inElement = function (node) {
				return jQuery(node).parents(".annotator-wrapper").length
			};
			isStartOffsetValid = range.startOffset < range.startContainer.length;
			isValidStart = isStartOffsetValid && inElement(range.startContainer);
			isValidEnd = range.endOffset > 0 && inElement(range.endContainer);
			return isValidStart || isValidEnd
		};
		Touch.prototype._onToggleTap = function (event) {
			console_dbg(event)
			event.preventDefault();
			if (this.isAnnotating()) {
				return this.stopAnnotating()
			} else {
				return this.startAnnotating()
			}
		};
		Touch.prototype._onAdderTap = function (event) {
			console_dbg(event)
			var browserRange, onAnnotationCreated, range;
			event.preventDefault();
			if (this.range) {
				browserRange = new Annotator.Range.BrowserRange(this.range);
				range = browserRange.normalize().limit(this.element[0]);
				if (range && !this.annotator.isAnnotator(range.commonAncestor)) {
					onAnnotationCreated = function (_this) {
						return function (annotation) {
							_this.annotator.unsubscribe("beforeAnnotationCreated", onAnnotationCreated);
							annotation.quote = range.toString();
							return annotation.ranges = [range]
						}
					}(this);
					this.annotator.subscribe("beforeAnnotationCreated", onAnnotationCreated);
					return this.annotator.onAdderClick(event)
				}
			}
		};
		Touch.prototype._onHighlightTap = function (event) {
			console_dbg(event)
			var clickable, original;
			clickable = jQuery(event.currentTarget).parents().filter(function () {
				return jQuery(this).is("a, [data-annotator-clickable]")
			});
			if (clickable.length) {
				return
			}
			if (jQuery.contains(this.element[0], event.currentTarget)) {
				original = event.originalEvent;
				if (original && original.touches) {
					event.pageX = original.touches[0].pageX;
					event.pageY = original.touches[0].pageY
				}
				/*if (this.annotator.viewer.isShown()) {
					this.annotator.viewer.hide()
				}*/
				//this.annotator.onHighlightMouseover(event);
				this.document.unbind("tap", this._onDocumentTap);
				return this.document.bind("tap", {preventDefault: false}, this._onDocumentTap)
			}
		};
		Touch.prototype._onDocumentTap = function (event) {
			if (!this.annotator.isAnnotator(event.target)) {
				this.annotator.viewer.hide()
			}
			if (!this.annotator.viewer.isShown()) {
				return this.document.unbind("tap", this._onDocumentTap)
			}
		};
		Touch.isTouchDevice = function () {
			return "ontouchstart"in window || window.DocumentTouch && document instanceof DocumentTouch
		};
		Touch.isAndroid = function () {
			return /Android/i.test(window.navigator.userAgent)
		};
		return Touch
	}(Annotator.Plugin);


	jQuery.event.special.tap = {
		add: function (eventHandler) {
			var context, data, onTapEnd, onTapStart;
			data = eventHandler.data = eventHandler.data || {};
			context = this;
			onTapStart = function (event) {
				if (data.preventDefault !== false) {
					event.preventDefault()
				}
				if (data.onTapDown) {
					data.onTapDown.apply(this, arguments)
				}
				data.event = event;
				data.touched = setTimeout(function () {
					return data.touched = null
				}, data.timeout || 300);
				return jQuery(document).bind({touchend: onTapEnd, mouseup: onTapEnd})
			};
			onTapEnd = function (event) {
				var handler;
				if (data.touched != null) {
					clearTimeout(data.touched);
					if (event.target === context || jQuery.contains(context, event.target)) {
						handler = eventHandler.origHandler || eventHandler.handler;
						handler.call(this, data.event)
					}
					data.touched = null
				}
				if (data.onTapUp) {
					data.onTapUp.apply(this, arguments)
				}
				return jQuery(document).unbind({touchstart: onTapEnd, mousedown: onTapEnd})
			};
			data.tapHandlers = {touchstart: onTapStart, mousedown: onTapStart};
			if (eventHandler.selector) {
				return jQuery(context).delegate(eventHandler.selector, data.tapHandlers)
			} else {
				return jQuery(context).bind(data.tapHandlers)
			}
		}, remove: function (eventHandler) {
			return jQuery(this).unbind(eventHandler.data.tapHandlers)
		}
	};
	Annotator.Delegator.natives.push("touchstart", "touchmove", "touchend", "tap");
	Annotator.Plugin.Touch.utils = function () {
		var cancelAnimationFrame, lastTime, prefix, requestAnimationFrame, vendors, _i, _len;
		vendors = ["ms", "moz", "webkit", "o"];
		requestAnimationFrame = window.requestAnimationFrame;
		cancelAnimationFrame = window.cancelAnimationFrame;
		for (_i = 0, _len = vendors.length; _i < _len; _i++) {
			prefix = vendors[_i];
			if (!!requestAnimationFrame) {
				continue
			}
			requestAnimationFrame = window["" + prefix + "RequestAnimationFrame"];
			cancelAnimationFrame = window["" + prefix + "CancelAnimationFrame"] || window["" + prefix + "CancelRequestAnimationFrame"]
		}
		if (!requestAnimationFrame) {
			lastTime = 0;
			requestAnimationFrame = function (callback, element) {
				var currTime, timeToCall;
				currTime = (new Date).getTime();
				timeToCall = Math.max(0, 16 - (currTime - lastTime));
				lastTime = currTime + timeToCall;
				return window.setTimeout(function () {
					return callback(currTime + timeToCall)
				}, timeToCall)
			}
		}
		if (!cancelAnimationFrame) {
			cancelAnimationFrame = function (id) {
				return clearTimeout(id)
			}
		}
		return {
			requestAnimationFrame: requestAnimationFrame,
			cancelAnimationFrame: cancelAnimationFrame,
			nextTick: function (fn) {
				return setTimeout(fn, 0)
			}
		}
	}();
	Annotator.Plugin.Touch.Viewer = function (_super) {
		var jQuery;
		__extends(Viewer, _super);
		jQuery = Annotator.$;
		Viewer.prototype.events = {
			".annotator-item tap": "_onTap",
			".annotator-edit tap": "_onEdit",
			".annotator-delete tap": "_onDelete"
		};
		function Viewer(viewer, options) {
			this.viewer = viewer;
			this._onLoad = __bind(this._onLoad, this);
			Viewer.__super__.constructor.call(this, this.viewer.element[0], options);
			this.element.unbind("click");
			this.element.addClass("annotator-touch-widget annotator-touch-viewer");
			this.on("load", this._onLoad)
		}

		Viewer.prototype.hideAllControls = function () {
			this.element.find(".annotator-item").removeClass(this.viewer.classes.showControls);
			return this
		};
		Viewer.prototype._onLoad = function () {
			var controls;
			controls = this.element.find(".annotator-controls");
			controls.toggleClass("annotator-controls annotator-touch-controls");
			return controls.find("button").addClass("annotator-button")
		};
		Viewer.prototype._onTap = function (event) {
			var isVisible, target;
			target = jQuery(event.currentTarget);
			isVisible = target.hasClass(this.viewer.classes.showControls);
			this.hideAllControls();
			if (!isVisible) {
				return target.addClass(this.viewer.classes.showControls)
			}
		};
		Viewer.prototype._onEdit = function (event) {
			event.preventDefault();
			return this.viewer.onEditClick(event)
		};
		Viewer.prototype._onDelete = function (event) {
			event.preventDefault();
			return this.viewer.onDeleteClick(event)
		};
		return Viewer
	}(Annotator.Delegator)
}).call(this);
