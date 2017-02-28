/*
 ** Annotator v1.2.9.1 redux
 ** https://github.com/okfn/annotator/
 **
 ** Copyright 2013, the Annotator project contributors.
 ** Released under the AGPL license
 ** https://github.com/okfn/annotator/blob/master/LICENSE
 **
 ** Built at: 2013-12-02 17:58:01Z
 *
 * 2015-01-07 dialoguea mod :
 * reduced to be called by an external editor and provide two buttons
 */

(function () {
    //'use strict';
    var $, Delegator, Annotator, Range, Util, findChild, fn, functions, g,
        getNodeName, getNodePosition, gettext, simpleXPathJQuery, simpleXPathPure,
        _Annotator, _gettext, _i, _j, _len, _len1, _ref, _ref1, _t,
        __slice = [].slice,
        __hasProp = {}.hasOwnProperty,
        __extends = function (child, parent) {
            for (var key in parent) {
                if (__hasProp.call(parent, key)) child[key] = parent[key];
            }
            function ctor() {
                this.constructor = child;
            }

            ctor.prototype = parent.prototype;
            child.prototype = new ctor();
            child.__super__ = parent.prototype;
            return child;
        },
        __bind = function (fn, me) {

            return function () {
                return fn.apply(me, arguments);
            };
        };


    simpleXPathJQuery = function (relativeRoot) {
        var jq;
        jq = this.map(function () {
            var elem, idx, path, tagName;
            path = "";
            elem = this;
            while ((elem != null ? elem.nodeType : void 0) === Node.ELEMENT_NODE && elem !== relativeRoot) {
                tagName = elem.tagName.replace(":", "\\:");
                idx = $(elem.parentNode).children(tagName).index(elem) + 1;
                idx = "[" + idx + "]";
                path = "/" + elem.tagName.toLowerCase() + idx + path;
                elem = elem.parentNode
            }
            return path
        });
        return jq.get()
    };

    simpleXPathPure = function (relativeRoot) {
        var getPathSegment, getPathTo, jq, rootNode;
        getPathSegment = function (node) {
            var name, pos;
            name = getNodeName(node);
            pos = getNodePosition(node);
            return "" + name + "[" + pos + "]"
        };
        rootNode = relativeRoot;
        getPathTo = function (node) {
            var xpath;
            xpath = '';
            while (node !== rootNode) {
                if (node == null) {
                    throw new Error("Called getPathTo on a node which was not a descendant of @rootNode. " + rootNode);
                }
                xpath = (getPathSegment(node)) + '/' + xpath;
                node = node.parentNode;
            }
            xpath = '/' + xpath;
            xpath = xpath.replace(/\/$/, '');
            return xpath;
        };
        jq = this.map(function () {
            var path;
            path = getPathTo(this);
            return path;
        });
        return jq.get();
    };

    findChild = function (node, type, index) {
        var child, children, found, name, _i, _len;
        if (!node.hasChildNodes()) {
            throw new Error("XPath error: node has no children!");
        }
        children = node.childNodes;
        found = 0;
        for (_i = 0, _len = children.length; _i < _len; _i++) {
            child = children[_i];
            name = getNodeName(child);
            if (name === type) {
                found += 1;
                if (found === index) {
                    return child;
                }
            }
        }
        throw new Error("XPath error: wanted child not found.");
    };

    getNodeName = function (node) {
        var nodeName;
        nodeName = node.nodeName.toLowerCase();
        switch (nodeName) {
            case "#text":
                return "text()";
            case "#comment":
                return "comment()";
            case "#cdata-section":
                return "cdata-section()";
            default:
                return nodeName;
        }
    };

    getNodePosition = function (node) {
        var pos, tmp;
        pos = 0;
        tmp = node;
        while (tmp) {
            if (tmp.nodeName === node.nodeName) {
                pos++;
            }
            tmp = tmp.previousSibling;
        }
        return pos;
    };

    gettext = null;

    if (typeof Gettext !== "undefined" && Gettext !== null) {
        _gettext = new Gettext({
            domain: "annotator"
        });
        gettext = function (msgid) {
            return _gettext.gettext(msgid);
        };
    } else {
        gettext = function (msgid) {
            return msgid;
        };
    }

    _t = function (msgid) {
        return gettext(msgid);
    };

    if (!(typeof jQuery !== "undefined" && jQuery !== null ? (_ref = jQuery.fn) != null ? _ref.jquery : void 0 : void 0)) {
        console.error(_t("Annotator requires jQuery: have you included jquery.js?"));
    }

    if (!(JSON && JSON.parse && JSON.stringify)) {
        console.error(_t("Annotator requires a JSON implementation: have you included json2.js?"));
    }

    $ = jQuery;

    Util = {};

    Util.flatten = function (array) {
        var flatten;
        flatten = function (ary) {
            var el, flat, _i, _len;
            flat = [];
            for (_i = 0, _len = ary.length; _i < _len; _i++) {
                el = ary[_i];
                flat = flat.concat(el && $.isArray(el) ? flatten(el) : el);
            }
            return flat;
        };
        return flatten(array);
    };

    Util.contains = function (parent, child) {
        var node;
        node = child;
        while (node != null) {
            if (node === parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    };

    Util.getTextNodes = function (jq) {
        var getTextNodes;
        getTextNodes = function (node) {
            var nodes;
            if (node && node.nodeType !== Node.TEXT_NODE) {
                nodes = [];
                if (node.nodeType !== Node.COMMENT_NODE) {
                    node = node.lastChild;
                    while (node) {
                        nodes.push(getTextNodes(node));
                        node = node.previousSibling;
                    }
                }
                return nodes.reverse();
            } else {
                return node;
            }
        };
        return jq.map(function () {
            return Util.flatten(getTextNodes(this));
        });
    };

    Util.getLastTextNodeUpTo = function (n) {
        var result;
        switch (n.nodeType) {
            case Node.TEXT_NODE:
                return n;
            case Node.ELEMENT_NODE:
                if (n.lastChild != null) {
                    result = Util.getLastTextNodeUpTo(n.lastChild);
                    if (result != null) {
                        return result;
                    }
                }
                break;
        }
        n = n.previousSibling;
        if (n != null) {
            return Util.getLastTextNodeUpTo(n);
        } else {
            return null;
        }
    };

    Util.getFirstTextNodeNotBefore = function (n) {
        var result;
        switch (n.nodeType) {
            case Node.TEXT_NODE:
                return n;
            case Node.ELEMENT_NODE:
                if (n.firstChild != null) {
                    result = Util.getFirstTextNodeNotBefore(n.firstChild);
                    if (result != null) {
                        return result;
                    }
                }
                break;
        }
        n = n.nextSibling;
        if (n != null) {
            return Util.getFirstTextNodeNotBefore(n);
        } else {
            return null;
        }
    };

    Util.readRangeViaSelection = function (range) {
        var sel;
        sel = Util.getGlobal().getSelection();
        sel.removeAllRanges();
        sel.addRange(range.toRange());
        return sel.toString();
    };

    Util.xpathFromNode = function (el, relativeRoot) {
        var exception, result;
        try {
            result = simpleXPathJQuery.call(el, relativeRoot);
        } catch (_error) {
            exception = _error;
            console_dbg(exception,"jQuery-based XPath construction failed! Falling back to manual.");
            result = simpleXPathPure.call(el, relativeRoot);
        }
        return result;
    };

    Util.nodeFromXPath = function (xp, root) {
        var idx, name, node, step, steps, _i, _len, _ref1;
        steps = xp.substring(1).split("/");
        node = root;
        for (_i = 0, _len = steps.length; _i < _len; _i++) {
            step = steps[_i];
            _ref1 = step.split("[");
            name = _ref1[0];
            idx = _ref1[1];
            idx = idx != null ? parseInt((idx != null ? idx.split("]") : void 0)[0]) : 1;
            node = findChild(node, name.toLowerCase(), idx);
        }
        return node;
    };

    Util.escape = function (html) {
        return html.replace(/&(?!\w+;)/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    };

    Util.uuid = (function () {
        var counter;
        counter = 0;
        return function () {
            return counter++;
        };
    })();

    Util.getGlobal = function () {
        return (function () {
            return this;
        })();
    };


    Util.maxZIndex = function ($elements) {
        var all, el;
        all = (function () {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = $elements.length; _i < _len; _i++) {
                el = $elements[_i];
                if ($(el).css('position') === 'static') {
                    _results.push(-1);
                } else {
                    _results.push(parseInt($(el).css('z-index'), 10) || -1);
                }
            }
            return _results;
        })();
        return Math.max.apply(Math, all);
    };

    Util.mousePosition = function (e, offsetEl) {
        var offset, _ref1;
        if ((_ref1 = $(offsetEl).css('position')) !== 'absolute' && _ref1 !== 'fixed' && _ref1 !== 'relative') {
            offsetEl = $(offsetEl).offsetParent()[0];
        }
        offsetEl = $(offsetEl).offsetParent()[0]
        offset = $(offsetEl).offset()
        return {
            top: e.pageY - offset.top,
            left: e.pageX - offset.left
        };
    };

    Util.preventEventDefault = function (event) {
        return event != null ? typeof event.preventDefault === "function" ? event.preventDefault() : void 0 : void 0;
    };

    functions = ["log", "debug", "info", "warn", "exception", "assert", "dir", "dirxml", "trace", "group", "groupEnd", "groupCollapsed", "time", "timeEnd", "profile", "profileEnd", "count", "clear", "table", "error", "notifyFirebug", "firebug", "userObjects"];

    if (typeof console !== "undefined" && console !== null) {
        if (console.group == null) {
            console.group = function (name) {
                return console_dbg("GROUP: ", name);
            };
        }
        if (console.groupCollapsed == null) {
            console.groupCollapsed = console.group;
        }
        for (_i = 0, _len = functions.length; _i < _len; _i++) {
            fn = functions[_i];
            if (console[fn] == null) {
                console[fn] = function () {
                    return console_dbg(_t("Not implemented:") + (" console." + name));
                };
            }
        }
    } else {
        this.console = {};
        for (_j = 0, _len1 = functions.length; _j < _len1; _j++) {
            fn = functions[_j];
            this.console[fn] = function () {
            };
        }
        this.console['error'] = function () {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            return alert("ERROR: " + (args.join(', ')));
        };
        this.console['warn'] = function () {
            var args;
            args = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
            return alert("WARNING: " + (args.join(', ')));
        };
    }

    Delegator = (function () {
        Delegator.prototype.events = {};

        Delegator.prototype.options = {};

        Delegator.prototype.element = null;

        function Delegator(element, options) {
            this.options = $.extend(true, {}, this.options, options);
            this.element = $(element);
            this._closures = {};
            this.on = this.subscribe;
            this.addEvents();
        }

        Delegator.prototype.addEvents = function () {
            var event, _k, _len2, _ref1, _results;
            _ref1 = Delegator._parseEvents(this.events);
            _results = [];
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                event = _ref1[_k];
                _results.push(this._addEvent(event.selector, event.event, event.functionName));
            }
            return _results;
        };

        Delegator.prototype.removeEvents = function () {
            var event, _k, _len2, _ref1, _results;
            _ref1 = Delegator._parseEvents(this.events);
            _results = [];
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                event = _ref1[_k];
                _results.push(this._removeEvent(event.selector, event.event, event.functionName));
            }
            return _results;
        };

        Delegator.prototype._addEvent = function (selector, event, functionName) {
            var closure;
            closure = (function (_this) {
                return function () {
                    return _this[functionName].apply(_this, arguments);
                };
            })(this);
            if (selector === '' && Delegator._isCustomEvent(event)) {
                this.subscribe(event, closure);
            } else {
                this.element.delegate(selector, event, closure);
            }
            this._closures["" + selector + "/" + event + "/" + functionName] = closure;
            return this;
        };

        Delegator.prototype._removeEvent = function (selector, event, functionName) {
            var closure;
            closure = this._closures["" + selector + "/" + event + "/" + functionName];
            if (selector === '' && Delegator._isCustomEvent(event)) {
                this.unsubscribe(event, closure);
            } else {
                this.element.undelegate(selector, event, closure);
            }
            delete this._closures["" + selector + "/" + event + "/" + functionName];
            return this;
        };

        Delegator.prototype.publish = function () {
            this.element.triggerHandler.apply(this.element, arguments);
            return this;
        };

        Delegator.prototype.subscribe = function (event, callback) {
            var closure;
            closure = function () {
                return callback.apply(this, [].slice.call(arguments, 1));
            };
            closure.guid = callback.guid = ($.guid += 1);
            this.element.bind(event, closure);
            return this;
        };

        Delegator.prototype.unsubscribe = function () {
            this.element.unbind.apply(this.element, arguments);
            return this;
        };

        return Delegator;

    })();

    Delegator._parseEvents = function (eventsObj) {
        var event, events, functionName, sel, selector, _k, _ref1;
        events = [];
        for (sel in eventsObj) {
            functionName = eventsObj[sel];
            _ref1 = sel.split(' ');
            selector = 2 <= _ref1.length ? __slice.call(_ref1, 0, _k = _ref1.length - 1) : (_k = 0, []), event = _ref1[_k++];
            events.push({
                selector: selector.join(' '),
                event: event,
                functionName: functionName
            });
        }
        return events;
    };

    Delegator.natives = (function () {
        var key, specials, val;
        specials = (function () {
            var _ref1, _results;
            _ref1 = jQuery.event.special;
            _results = [];
            for (key in _ref1) {
                if (!__hasProp.call(_ref1, key)) continue;
                val = _ref1[key];
                _results.push(key);
            }
            return _results;
        })();
        return "blur focus focusin focusout load resize scroll unload click dblclick\nmousedown mouseup mousemove mouseover mouseout mouseenter mouseleave\nchange select submit keydown keypress keyup error".split(/[^a-z]+/).concat(specials);
    })();

    Delegator._isCustomEvent = function (event) {
        event = event.split('.')[0];
        return $.inArray(event, Delegator.natives) === -1;
    };

    Range = {};

    Range.sniff = function (r) {
        if (r.commonAncestorContainer != null) {
            return new Range.BrowserRange(r);
        } else if (typeof r.start === "string") {
            return new Range.SerializedRange(r);
        } else if (r.start && typeof r.start === "object") {
            return new Range.NormalizedRange(r);
        } else {
            console.error(_t("Could not sniff range type"));
            return false;
        }
    };

    Range.nodeFromXPath = function (xpath, root) {
        var customResolver, evaluateXPath, namespace, node, segment;
        if (root == null) {
            root = document;
        }
        evaluateXPath = function (xp, nsResolver) {
            var exception;
            if (nsResolver == null) {
                nsResolver = null;
            }
            try {
                return document.evaluate('.' + xp, root, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            } catch (_error) {
                exception = _error;
                console_dbg("XPath evaluation failed.");
                console_dbg("Trying fallback...");
                return Util.nodeFromXPath(xp, root);
            }
        };
        if (!$.isXMLDoc(document.documentElement)) {
            return evaluateXPath(xpath);
        } else {
            customResolver = document.createNSResolver(document.ownerDocument === null ? document.documentElement : document.ownerDocument.documentElement);
            node = evaluateXPath(xpath, customResolver);
            if (!node) {
                xpath = ((function () {
                    var _k, _len2, _ref1, _results;
                    _ref1 = xpath.split('/');
                    _results = [];
                    for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                        segment = _ref1[_k];
                        if (segment && segment.indexOf(':') === -1) {
                            _results.push(segment.replace(/^([a-z]+)/, 'xhtml:$1'));
                        } else {
                            _results.push(segment);
                        }
                    }
                    return _results;
                })()).join('/');
                namespace = document.lookupNamespaceURI(null);
                customResolver = function (ns) {
                    if (ns === 'xhtml') {
                        return namespace;
                    } else {
                        return document.documentElement.getAttribute('xmlns:' + ns);
                    }
                };
                node = evaluateXPath(xpath, customResolver);
            }
            return node;
        }
    };

    Range.RangeError = (function (_super) {
        __extends(RangeError, _super);

        function RangeError(type, message, parent) {
            this.type = type;
            this.message = message;
            this.parent = parent != null ? parent : null;
            RangeError.__super__.constructor.call(this, this.message);
        }

        return RangeError;

    })(Error);

    Range.BrowserRange = (function () {
        function BrowserRange(obj) {
            this.commonAncestorContainer = obj.commonAncestorContainer;
            this.startContainer = obj.startContainer;
            this.startOffset = obj.startOffset;
            this.endContainer = obj.endContainer;
            this.endOffset = obj.endOffset;
        }

        BrowserRange.prototype.normalize = function (root) {
            var n, node, nr, r;
            if (this.tainted) {
                console.error(_t("You may only call normalize() once on a BrowserRange!"));
                return false;
            } else {
                this.tainted = true;
            }
            r = {};
            if (this.startContainer.nodeType === Node.ELEMENT_NODE) {
                r.start = Util.getFirstTextNodeNotBefore(this.startContainer.childNodes[this.startOffset]);
                r.startOffset = 0;
            } else {
                r.start = this.startContainer;
                r.startOffset = this.startOffset;
            }
            if (this.endContainer.nodeType === Node.ELEMENT_NODE) {
                node = this.endContainer.childNodes[this.endOffset];
                if (node != null) {
                    n = node;
                    while ((n != null) && (n.nodeType !== Node.TEXT_NODE)) {
                        n = n.firstChild;
                    }
                    if (n != null) {
                        r.end = n;
                        r.endOffset = 0;
                    }
                }
                if (r.end == null) {
                    node = this.endContainer.childNodes[this.endOffset - 1];
                    r.end = Util.getLastTextNodeUpTo(node);
                    r.endOffset = r.end.nodeValue.length;
                }
            } else {
                r.end = this.endContainer;
                r.endOffset = this.endOffset;
            }
            nr = {};
            if (r.startOffset > 0) {
                if (r.start.nodeValue.length > r.startOffset) {
                    nr.start = r.start.splitText(r.startOffset);
                } else {
                    nr.start = r.start.nextSibling;
                }
            } else {
                nr.start = r.start;
            }
            if (r.start === r.end) {
                if (nr.start.nodeValue.length > (r.endOffset - r.startOffset)) {
                    nr.start.splitText(r.endOffset - r.startOffset);
                }
                nr.end = nr.start;
            } else {
                if (r.end.nodeValue.length > r.endOffset) {
                    r.end.splitText(r.endOffset);
                }
                nr.end = r.end;
            }
            nr.commonAncestor = this.commonAncestorContainer;
            while (nr.commonAncestor.nodeType !== Node.ELEMENT_NODE) {
                nr.commonAncestor = nr.commonAncestor.parentNode;
            }
            return new Range.NormalizedRange(nr);
        };

        BrowserRange.prototype.serialize = function (root, ignoreSelector) {
            return this.normalize(root).serialize(root, ignoreSelector);
        };

        return BrowserRange;

    })();

    Range.NormalizedRange = (function () {
        function NormalizedRange(obj) {
            this.commonAncestor = obj.commonAncestor;
            this.start = obj.start;
            this.end = obj.end;
        }

        NormalizedRange.prototype.normalize = function (root) {
            return this;
        };

        NormalizedRange.prototype.limit = function (bounds) {
            var nodes, parent, startParents, _k, _len2, _ref1;
            nodes = $.grep(this.textNodes(), function (node) {
                return node.parentNode === bounds || $.contains(bounds, node.parentNode);
            });
            if (!nodes.length) {
                return null;
            }
            this.start = nodes[0];
            this.end = nodes[nodes.length - 1];
            startParents = $(this.start).parents();
            _ref1 = $(this.end).parents();
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                parent = _ref1[_k];
                if (startParents.index(parent) !== -1) {
                    this.commonAncestor = parent;
                    break;
                }
            }
            return this;
        };

        NormalizedRange.prototype.serialize = function (root, ignoreSelector) {
            var end, serialization, start;
            serialization = function (node, isEnd) {
                var n, nodes, offset, origParent, textNodes, xpath, _k, _len2;
                if (ignoreSelector) {
                    origParent = $(node).parents(":not(" + ignoreSelector + ")").eq(0);
                } else {
                    origParent = $(node).parent();
                }
                xpath = Util.xpathFromNode(origParent, root)[0];
                textNodes = Util.getTextNodes(origParent);
                nodes = textNodes.slice(0, textNodes.index(node));
                offset = 0;
                for (_k = 0, _len2 = nodes.length; _k < _len2; _k++) {
                    n = nodes[_k];
                    offset += n.nodeValue.length;
                }
                if (isEnd) {
                    return [xpath, offset + node.nodeValue.length];
                } else {
                    return [xpath, offset];
                }
            };
            start = serialization(this.start);
            end = serialization(this.end, true);
            return new Range.SerializedRange({
                start: start[0],
                end: end[0],
                startOffset: start[1],
                endOffset: end[1]
            });
        };

        NormalizedRange.prototype.text = function () {
            var node;
            return ((function () {
                var _k, _len2, _ref1, _results;
                _ref1 = this.textNodes();
                _results = [];
                for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                    node = _ref1[_k];
                    _results.push(node.nodeValue);
                }
                return _results;
            }).call(this)).join('');
        };

        NormalizedRange.prototype.textNodes = function () {
            var end, start, textNodes, _ref1;
            textNodes = Util.getTextNodes($(this.commonAncestor));
            _ref1 = [textNodes.index(this.start), textNodes.index(this.end)], start = _ref1[0], end = _ref1[1];
            return $.makeArray(textNodes.slice(start, +end + 1 || 9e9));
        };

        NormalizedRange.prototype.toRange = function () {
            var range;
            range = document.createRange();
            range.setStartBefore(this.start);
            range.setEndAfter(this.end);
            return range;
        };

        return NormalizedRange;

    })();

    Range.SerializedRange = (function () {
        function SerializedRange(obj) {
            this.start = obj.start;
            this.startOffset = obj.startOffset;
            this.end = obj.end;
            this.endOffset = obj.endOffset;
        }

        SerializedRange.prototype.normalize = function (root) {
            var contains, e, length, node, p, range, targetOffset, tn, _k, _l, _len2, _len3, _ref1, _ref2;
            range = {};
            _ref1 = ['start', 'end'];
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                p = _ref1[_k];
                try {
                    node = Range.nodeFromXPath(this[p], root);
                } catch (_error) {
                    e = _error;
                    throw new Range.RangeError(p, ("Error while finding " + p + " node: " + this[p] + ": ") + e, e);
                }
                if (!node) {
                    throw new Range.RangeError(p, "Couldn't find " + p + " node: " + this[p]);
                }
                length = 0;
                targetOffset = this[p + 'Offset'];
                if (p === 'end') {
                    targetOffset--;
                }
                _ref2 = Util.getTextNodes($(node));
                for (_l = 0, _len3 = _ref2.length; _l < _len3; _l++) {
                    tn = _ref2[_l];
                    if (length + tn.nodeValue.length > targetOffset) {
                        range[p + 'Container'] = tn;
                        range[p + 'Offset'] = this[p + 'Offset'] - length;
                        break;
                    } else {
                        length += tn.nodeValue.length;
                    }
                }
                if (range[p + 'Offset'] == null) {
                    throw new Range.RangeError("" + p + "offset", "Couldn't find offset " + this[p + 'Offset'] + " in element " + this[p]);
                }
            }
            contains = document.compareDocumentPosition == null ? function (a, b) {
                return a.contains(b);
            } : function (a, b) {
                return a.compareDocumentPosition(b) & 16;
            };
            $(range.startContainer).parents().each(function () {
                if (contains(this, range.endContainer)) {
                    range.commonAncestorContainer = this;
                    return false;
                }
            });
            return new Range.BrowserRange(range).normalize(root);
        };

        SerializedRange.prototype.serialize = function (root, ignoreSelector) {
            return this.normalize(root).serialize(root, ignoreSelector);
        };

        SerializedRange.prototype.toObject = function () {
            return {
                start: this.start,
                startOffset: this.startOffset,
                end: this.end,
                endOffset: this.endOffset
            };
        };

        return SerializedRange;

    })();


    _Annotator = this.Annotator;

    Annotator = (function (_super) {
        __extends(Annotator, _super);

        Annotator.prototype.events = {
            "#newCmtBtn div click": "onAdderClick",
            "#newCmtBtn div mousedown": "onAdderMousedown",
            "#hypostaseBtn click": "onHypostaseClick",
            "#hypostaseBtn mousedown": "onAdderMousedown"
            //".annotator-hl mouseover": "onHighlightMouseover",
            //".annotator-hl mouseout": "startViewerHideTimer"
        };

        Annotator.prototype.html = {
            //adder: '<div class="annotator-adder"><button>' + _t('Annotate') + '</button></div>',
            adder: "<div id='newCmtBtn'><div class='button-content'>Argumenter</div><div class='arrow'></div></div> ",
            wrapper: '<div class="annotator-wrapper"></div>'
        };

        Annotator.prototype.options = {
            readOnly: false
        };

        Annotator.prototype.editor = null;

        Annotator.prototype.viewer = null;

        Annotator.prototype.selectedRanges = null;

        Annotator.prototype.mouseIsDown = false;

        Annotator.prototype.ignoreMouseup = false;

        Annotator.prototype.viewerHideTimer = null;

        function Annotator(element, options) {

            this.onDeleteAnnotation = __bind(this.onDeleteAnnotation, this);
            this.onEditAnnotation = __bind(this.onEditAnnotation, this);
            this.onAdderClick = __bind(this.onAdderClick, this);
            this.onHypostaseClick = __bind(this.onAdder2Click, this);
            this.onAdderMousedown = __bind(this.onAdderMousedown, this);
            //this.onHighlightMouseover = __bind(this.onHighlightMouseover, this);
            this.checkForEndSelection = __bind(this.checkForEndSelection, this);
            this.checkForStartSelection = __bind(this.checkForStartSelection, this);
            //this.clearViewerHideTimer = __bind(this.clearViewerHideTimer, this);
            //this.startViewerHideTimer = __bind(this.startViewerHideTimer, this);
            //this.showViewer = __bind(this.showViewer, this);
            //this.onEditorSubmit = __bind(this.onEditorSubmit, this);
            //this.onEditorHide = __bind(this.onEditorHide, this);
            this.showEditor = __bind(this.showEditor, this);
            Annotator.__super__.constructor.apply(this, arguments);
            this.plugins = {};
            if (!Annotator.supported()) {
                return this;
            }
            if (!this.options.readOnly) {
                this._setupDocumentEvents();
            }
            if (this.options.editor) {
                this.callEditor = __bind(this.options.editor, this);
            }
            if(this.options.hypostase) {
                console.log("hypostasis option")
                this.callEditor2 = __bind(this.options.hypostase, this);
            }
            this._setupWrapper()
            this.adder = $(this.html.adder).appendTo(this.wrapper).hide();

            Annotator._instances.push(this);
        }


        Annotator.prototype._setupWrapper = function () {
            this.wrapper = $(this.html.wrapper);
            this.element.find('script').remove();
            this.element.wrapInner(this.wrapper);
            this.wrapper = this.element.find('.annotator-wrapper');
            return this;
        };

        Annotator.prototype._setupDocumentEvents = function () {
            $(document).bind({
                "mouseup": this.checkForEndSelection,
                "mousedown": this.checkForStartSelection
            });
            return this;
        };

        Annotator.prototype.destroy = function () {
            var idx, name, plugin, _ref1;
            $(document).unbind({
                "mouseup": this.checkForEndSelection,
                "mousedown": this.checkForStartSelection
            });
            $('#annotator-dynamic-style').remove();
            this.adder.remove();
            //this.viewer.destroy();
            //this.editor.destroy();
            this.wrapper.find('.annotator-hl').each(function () {
                $(this).contents().insertBefore(this);
                return $(this).remove();
            });
            this.wrapper.contents().insertBefore(this.wrapper);
            this.wrapper.remove();
            this.element.data('annotator', null);
            _ref1 = this.plugins;
            for (name in _ref1) {
                plugin = _ref1[name];
                this.plugins[name].destroy();
            }
            this.removeEvents();
            idx = Annotator._instances.indexOf(this);
            if (idx !== -1) {
                return Annotator._instances.splice(idx, 1);
            }
        };

        Annotator.prototype.getSelectedRanges = function () {
            var browserRange, i, normedRange, r, ranges, rangesToIgnore, selection, _k, _len2;
            selection = Util.getGlobal().getSelection();
            ranges = [];
            rangesToIgnore = [];
            if (!selection.isCollapsed) {
                ranges = (function () {
                    var _k, _ref1, _results;
                    _results = [];
                    for (i = _k = 0, _ref1 = selection.rangeCount; 0 <= _ref1 ? _k < _ref1 : _k > _ref1; i = 0 <= _ref1 ? ++_k : --_k) {
                        r = selection.getRangeAt(i);
                        browserRange = new Range.BrowserRange(r);
                        normedRange = browserRange.normalize().limit(this.wrapper[0]);
                        if (normedRange === null) {
                            rangesToIgnore.push(r);
                        }
                        _results.push(normedRange);
                    }
                    return _results;
                }).call(this);
                selection.removeAllRanges();
            }
            for (_k = 0, _len2 = rangesToIgnore.length; _k < _len2; _k++) {
                r = rangesToIgnore[_k];
                selection.addRange(r);
            }
            return $.grep(ranges, function (range) {
                if (range) {
                    selection.addRange(range.toRange());
                }
                return range;
            });
        };

        Annotator.prototype.createAnnotation = function () {
            var annotation;
            annotation = {};
            this.publish('beforeAnnotationCreated', [annotation]);
            return annotation;
        };

        Annotator.prototype.highlightAnnotation = function (annotation, root) {
            var e, normed, normedRanges, r, _k, _l, _len2, _len3, _ref1;
            normedRanges = [];
            _ref1 = annotation.ranges;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                r = _ref1[_k];
                try {
                    normedRanges.push(Range.sniff(r).normalize(root));
                } catch (_error) {
                    e = _error;
                    if (e instanceof Range.RangeError) {
                        this.publish('rangeNormalizeFail', [annotation, r, e]);
                    } else {
                        throw e;
                    }
                }
            }
            annotation.highlights = [];
            for (_l = 0, _len3 = normedRanges.length; _l < _len3; _l++) {
                normed = normedRanges[_l];
                annotation.ranges.push(normed.serialize(this.wrapper[0], '.annotator-hl'));
                $.merge(annotation.highlights, this.highlightRange(normed));
            }
            $(annotation.highlights).data('annotation', annotation);

            return annotation;
        };

        Annotator.prototype.selectElement = function (el) {
            this.selectedElement = el
        }

        Annotator.prototype.setupAnnotation = function (annotation) {
            var e, normed, normedRanges, r, root, _k, _l, _len2, _len3, _ref1;

            //root = this.wrapper[0];
            root = this.selectedElement[0];

            annotation.ranges || (annotation.ranges = this.selectedRanges);
            normedRanges = [];
            _ref1 = annotation.ranges;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                r = _ref1[_k];
                try {
                    normedRanges.push(Range.sniff(r).normalize(root));
                } catch (_error) {
                    e = _error;
                    if (e instanceof Range.RangeError) {
                        this.publish('rangeNormalizeFail', [annotation, r, e]);
                    } else {
                        throw e;
                    }
                }
            }
            annotation.quote = [];
            annotation.ranges = [];
            annotation.highlights = [];
            for (_l = 0, _len3 = normedRanges.length; _l < _len3; _l++) {
                normed = normedRanges[_l];
                annotation.quote.push($.trim(normed.text()));
                annotation.ranges.push(normed.serialize(root, '.annotator-hl'));
                $.merge(annotation.highlights, this.highlightRange(normed));
            }
            annotation.quote = annotation.quote.join(' / ');
            $(annotation.highlights).data('annotation', annotation);

            return annotation;
        };

        Annotator.prototype.deleteAnnotation = function (annotation) {
            var child, h, _k, _len2, _ref1;
            if (annotation.highlights != null) {
                _ref1 = annotation.highlights;
                for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                    h = _ref1[_k];
                    if (!(h.parentNode != null)) {
                        continue;
                    }
                    child = h.childNodes[0];
                    $(h).replaceWith(h.childNodes);
                }
            }
            this.publish('annotationDeleted', [annotation]);
            return annotation;
        };


        Annotator.prototype.dumpAnnotations = function () {
            if (this.plugins['Store']) {
                return this.plugins['Store'].dumpAnnotations();
            } else {
                console.warn(_t("Can't dump annotations without Store plugin."));
                return false;
            }
        };

        Annotator.prototype.highlightRange = function (normedRange, cssClass) {
            var hl, node, white, _k, _len2, _ref1, _results;
            if (cssClass == null) {
                cssClass = 'annotator-hl';
            }
            white = /^\s*$/;
            hl = $("<span class='" + cssClass + "'></span>");
            _ref1 = normedRange.textNodes();
            _results = [];
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                node = _ref1[_k];
                if (!white.test(node.nodeValue)) {
                    _results.push($(node).wrapAll(hl).parent().show()[0]);
                }
            }
            return _results;
        };

        Annotator.prototype.highlightRanges = function (normedRanges, cssClass) {
            var highlights, r, _k, _len2;
            if (cssClass == null) {
                cssClass = 'annotator-hl';
            }
            highlights = [];
            for (_k = 0, _len2 = normedRanges.length; _k < _len2; _k++) {
                r = normedRanges[_k];
                $.merge(highlights, this.highlightRange(r, cssClass));
            }
            return highlights;
        };

        Annotator.prototype.addPlugin = function (name, options) {
            var klass, _base;
            if (this.plugins[name]) {
                console.error(_t("You cannot have more than one instance of any plugin."));
            } else {
                klass = Annotator.Plugin[name];
                if (typeof klass === 'function') {
                    this.plugins[name] = new klass(this.element[0], options);
                    this.plugins[name].annotator = this;
                    if (typeof (_base = this.plugins[name]).pluginInit === "function") {
                        _base.pluginInit();
                    }
                } else {
                    console.error(_t("Could not load ") + name + _t(" plugin. Have you included the appropriate <script> tag?"));
                }
            }
            return this;
        };

        Annotator.prototype.checkForStartSelection = function (event) {
            return this.mouseIsDown = true;
        };

        Annotator.prototype.checkForEndSelection = function (event) {

            this.mouseIsDown = false;
            if (this.ignoreMouseup) {
                return;
            }

            var container, range, _k, _len2, _ref1;

            this.selectedRanges = this.getSelectedRanges();
            _ref1 = this.selectedRanges;
            for (_k = 0, _len2 = _ref1.length; _k < _len2; _k++) {
                range = _ref1[_k];
                container = range.commonAncestor;
                if ($(container).hasClass('annotator-hl')) {
                    container = $(container).parents('[class!=annotator-hl]')[0];
                }
                if (this.isAnnotator(container)) {
                    return;
                }
            }

            if (event && this.selectedRanges.length) {
                var p = {
                    top: event.pageY,
                    left: event.pageX
                }
                return this.adder.css(p).show();
            } else {
                return this.adder.hide();
            }
        };

        Annotator.prototype.isAnnotator = function (element) {
            return !!$(element).parents().addBack().filter('[class^=annotator-]').not(this.wrapper).length;
        };

        Annotator.prototype.onAdderMousedown = function (event) {
            if (event != null) {
                event.preventDefault();
            }
            return this.ignoreMouseup = true;
        };

        Annotator.prototype.onAdderClick = function (event) {

            //console_dbg("adderclick")
            this.ignoreMouseup = true
            var annotation, cancel, cleanup, position, save;
            if (event != null) {
                event.preventDefault();
            }

            annotation = this.setupAnnotation(this.createAnnotation());
            $(annotation.highlights).addClass('annotator-hl-temporary');
            this.callEditor(annotation)
            this.adder.hide();
        };


        Annotator.prototype.onAdder2Click = function (event) {

            this.ignoreMouseup = true
            var annotation;
            if (event != null) {
                event.preventDefault();
            }

            annotation = this.setupAnnotation(this.createAnnotation());
            console_dbg(annotation)
            $(annotation.highlights).addClass('annotator-hl-temporary');
            this.callEditor2(annotation)
            this.adder.hide();
        };

        return Annotator;

    })(Delegator);

    Annotator.Plugin = function (_super) {
        __extends(Plugin, _super);
        function Plugin(element, options) {
            Plugin.__super__.constructor.apply(this, arguments)
        }

        Plugin.prototype.pluginInit = function () {
        };
        Plugin.prototype.destroy = function () {
            return this.removeEvents()
        };
        return Plugin
    }(Delegator);

    var G = Util.getGlobal();

    if (((_ref1 = G.document) != null ? _ref1.evaluate : void 0) == null) {
        $.getScript('js/dist/xpath.min.js');
    }

    /* no ie support for now
    if (g.getSelection == null) {
        $.getScript('js/dist/ierange.min.js');
    } */

    if (G.JSON == null) {
        $.getScript('js/dist/json2.min.js');
    }

    if (G.Node == null) {
        G.Node = {
            ELEMENT_NODE: 1,
            ATTRIBUTE_NODE: 2,
            TEXT_NODE: 3,
            CDATA_SECTION_NODE: 4,
            ENTITY_REFERENCE_NODE: 5,
            ENTITY_NODE: 6,
            PROCESSING_INSTRUCTION_NODE: 7,
            COMMENT_NODE: 8,
            DOCUMENT_NODE: 9,
            DOCUMENT_TYPE_NODE: 10,
            DOCUMENT_FRAGMENT_NODE: 11,
            NOTATION_NODE: 12
        };
    }

    Annotator.$ = $;

    Annotator.Delegator = Delegator;

    Annotator.Range = Range;

    Annotator.Util = Util;

    Annotator._instances = [];

    Annotator._t = _t;

    Annotator.supported = function () {
        return (function () {
            return !!this.getSelection;
        })();
    };

    Annotator.noConflict = function () {
        Util.getGlobal().Annotator = _Annotator;
        return this;
    };

    $.fn.annotator = function (options) {
        var args;
        args = Array.prototype.slice.call(arguments, 1);
        return this.each(function () {
            var instance;
            instance = $.data(this, 'annotator');
            if (instance) {
                return options && instance[options].apply(instance, args);
            } else {
                instance = new Annotator(this, options);
                return $.data(this, 'annotator', instance);
            }
        });
    };

    this.Annotator = Annotator;

    Annotator = Annotator || {};


}).call(this);
