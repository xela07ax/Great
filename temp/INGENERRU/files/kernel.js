
; /* Start:/bitrix/js/main/core/core.js*/
/**********************************************************************/
/*********** Bitrix JS Core library ver 0.9.0 beta ********************/
/**********************************************************************/

;(function(window){

if (!!window.BX && !!window.BX.extend)
	return;

var _bxtmp;
if (!!window.BX)
{
	_bxtmp = window.BX;
}

window.BX = function(node, bCache)
{
	if (BX.type.isNotEmptyString(node))
	{
		var ob;

		if (!!bCache && null != NODECACHE[node])
			ob = NODECACHE[node];
		ob = ob || document.getElementById(node);
		if (!!bCache)
			NODECACHE[node] = ob;

		return ob;
	}
	else if (BX.type.isDomNode(node))
		return node;
	else if (BX.type.isFunction(node))
		return BX.ready(node);

	return null;
};

// language utility
BX.message = function(mess)
{
	if (BX.type.isString(mess))
	{
		if (typeof BX.message[mess] == 'undefined')
			BX.debug('message undefined: ' + mess);
		return BX.message[mess];
	}
	else
	{
		for (var i in mess)
		{
			BX.message[i]=mess[i];
		}
		return true;
	}
};

if(!!_bxtmp)
{
	for(var i in _bxtmp)
	{
		if(!BX[i])
		{
			BX[i]=_bxtmp[i];
		}
		else if(i=='message')
		{
			for(var j in _bxtmp[i])
			{
				BX.message[j]=_bxtmp[i][j];
			}
		}
		_bxtmp = null;
	}
}

var

/* ready */
__readyHandler = null,
readyBound = false,
readyList = [],

/* list of registered proxy functions */
proxySalt = Math.random(),
proxyId = 1,
proxyList = [],
deferList = [],

/* getElementById cache */
NODECACHE = {},

/* List of denied event handlers */
deniedEvents = [],

/* list of registered event handlers */
eventsList = [],

/* list of registered custom events */
customEvents = {},

/* list of external garbage collectors */
garbageCollectors = [],

/* list of loaded CSS files */
cssList = [],

/* list of loaded JS kernel files */
arKernelJS = [],

/* browser detection */
bSafari = navigator.userAgent.toLowerCase().indexOf('webkit') != -1,
bOpera = navigator.userAgent.toLowerCase().indexOf('opera') != -1,
bFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') != -1,
bChrome = navigator.userAgent.toLowerCase().indexOf('chrome') != -1,
bIE = document.attachEvent && !bOpera,

/* regexps */
r = {
	script: /<script([^>]*)>/i,
	script_src: /src=["\']([^"\']+)["\']/i,
	space: /\s+/,
	ltrim: /^[\s\r\n]+/g,
	rtrim: /[\s\r\n]+$/g,
	style: /<link.*?(rel="stylesheet"|type="text\/css")[^>]*>/i,
	style_href: /href=["\']([^"\']+)["\']/i
},

eventTypes = {
	click: 'MouseEvent',
	dblclick: 'MouseEvent',
	mousedown: 'MouseEvent',
	mousemove: 'MouseEvent',
	mouseout: 'MouseEvent',
	mouseover: 'MouseEvent',
	mouseup: 'MouseEvent',
	focus: 'MouseEvent',
	blur: 'MouseEvent'
},

lastWait = [],

CHECK_FORM_ELEMENTS = {tagName: /^INPUT|SELECT|TEXTAREA|BUTTON$/i};

BX.MSLEFT = 1;
BX.MSMIDDLE = 2;
BX.MSRIGHT = 4;

BX.ext = function(ob) {for (var i in ob) this[i] = ob[i];}

/* OO emulation utility */
BX.extend = function(child, parent)
{
	var f = function() {};
	f.prototype = parent.prototype;

	child.prototype = new f();
	child.prototype.constructor = child;

	child.superclass = parent.prototype;
	if(parent.prototype.constructor == Object.prototype.constructor)
	{
		parent.prototype.constructor = parent;
	}
}

BX.debug = function()
{
	if (window.BXDEBUG)
	{
		if (window.console && window.console.log)
			console.log('BX.debug: ', arguments.length > 0 ? arguments : arguments[0]);
	}
}

BX.is_subclass_of = function(ob, parent_class)
{
	if (ob instanceof parent_class)
		return true;

	if (parent_class.superclass)
		return BX.is_subclass_of(ob, parent_class.superclass);

	return false;
}

BX.bitrix_sessid = function() {return BX.message.bitrix_sessid;}

/* DOM manipulation */
BX.create = function(tag, data, context)
{
	context = context || document;

	if (null == data && typeof tag == 'object' && tag.constructor !== String)
	{
		data = tag; tag = tag.tag;
	}

	var elem;
	if (BX.browser.IsIE() && !BX.browser.IsIE9() && null != data && null != data.props && (data.props.name || data.props.id))
	{
		elem = context.createElement('<' + tag + (data.props.name ? ' name="' + data.props.name + '"' : '') + (data.props.id ? ' id="' + data.props.id + '"' : '') + '>');
	}
	else
	{
		elem = context.createElement(tag);
	}

	return data ? BX.adjust(elem, data) : elem;
}

BX.adjust = function(elem, data)
{
	var j,len;

	if (!elem.nodeType)
		return null;

	if (elem.nodeType == 9)
		elem = elem.body;

	if (data.attrs)
	{
		for (j in data.attrs)
		{
			if (j == 'class' || j == 'className')
				elem.className = data.attrs[j];
			else if (j == 'for')
				elem.htmlFor = data.attrs[j];
			else if(data.attrs[j] == "")
				elem.removeAttribute(j);
			else
				elem.setAttribute(j, data.attrs[j]);
		}
	}

	if (data.style)
	{
		for (j in data.style)
			elem.style[j] = data.style[j];
	}

	if (data.props)
	{
		for (j in data.props)
			elem[j] = data.props[j];
	}

	if (data.events)
	{
		for (j in data.events)
			BX.bind(elem, j, data.events[j]);
	}

	if (data.children && data.children.length > 0)
	{
		for (j=0,len=data.children.length; j<len; j++)
		{
			if (BX.type.isNotEmptyString(data.children[j]))
				elem.innerHTML += data.children[j];
			else if (BX.type.isElementNode(data.children[j]))
				elem.appendChild(data.children[j]);
		}
	}
	else if (data.text)
	{
		BX.cleanNode(elem);
		elem.appendChild((elem.ownerDocument || document).createTextNode(data.text));
	}
	else if (data.html)
	{
		elem.innerHTML = data.html;
	}

	return elem;
}

BX.remove = function(ob)
{
	if (ob && null != ob.parentNode)
		ob.parentNode.removeChild(ob);
	ob = null;
	return null;
}

BX.cleanNode = function(node, bSuicide)
{
	node = BX(node);
	bSuicide = !!bSuicide;

	if (node && node.childNodes)
	{
		while(node.childNodes.length > 0)
			node.removeChild(node.firstChild);
	}

	if (node && bSuicide)
	{
		node = BX.remove(node);
	}

	return node;
}

BX.addClass = function(ob, value)
{
	var classNames;
	ob = BX(ob)

	value = BX.util.trim(value);
	if (value == '')
		return ob;

	if (ob)
	{
		if (!ob.className)
		{
			ob.className = value
		}
		else if (!!ob.classList && value.indexOf(' ') < 0)
		{
			ob.classList.add(value);
		}
		else
		{
			classNames = (value || "").split(r.space);

			var className = " " + ob.className + " ";
			for (var j = 0, cl = classNames.length; j < cl; j++)
			{
				if (className.indexOf(" " + classNames[j] + " ") < 0)
				{
					ob.className += " " + classNames[j];
				}
			}
		}
	}

	return ob;
}

BX.removeClass = function(ob, value)
{
	ob = BX(ob);
	if (ob)
	{
		if (ob.className && !!value)
		{
			if (BX.type.isString(value))
			{
				if (!!ob.classList && value.indexOf(' ') < 0)
				{
					ob.classList.remove(value);
				}
				else
				{
					var classNames = value.split(r.space), className = " " + ob.className + " ";
					for (var j = 0, cl = classNames.length; j < cl; j++)
					{
						className = className.replace(" " + classNames[j] + " ", " ");
					}

					ob.className = BX.util.trim(className);
				}
			}
			else
			{
				ob.className = "";
			}
		}
	}

	return ob;
}

BX.toggleClass = function(ob, value)
{
	var className;
	if (BX.type.isArray(value))
	{
		className = ' ' + ob.className + ' ';
		for (var j = 0, len = value.length; j < len; j++)
		{
			if (BX.hasClass(ob, value[j]))
			{
				className = (' ' + className + ' ').replace(' ' + value[j] + ' ', ' ');
				className += ' ' + value[j >= len-1 ? 0 : j+1];

				j--;
				break;
			}
		}

		if (j == len)
			ob.className += ' ' + value[0];
		else
			ob.className = className;

		ob.className = BX.util.trim(ob.className);
	}
	else if (BX.type.isNotEmptyString(value))
	{
		if (!!ob.classList)
		{
			ob.classList.toggle(value);
		}
		else
		{
			className = ob.className;
			if (BX.hasClass(ob, value))
			{
				className = (' ' + className + ' ').replace(' ' + value + ' ', ' ');
			}
			else
			{
				className += ' ' + value;
			}

			ob.className = BX.util.trim(className);
		}
	}

	return ob;
}

BX.hasClass = function(el, className)
{
	if (!el || !BX.type.isDomNode(el))
	{
		BX.debug(el);
		return false;
	}

	if (!el.className || !className)
	{
		return false;
	}

	if (!!el.classList && !!className && className.indexOf(' ') < 0)
	{
		return el.classList.contains(BX.util.trim(className));
	}
	else
		return ((" " + el.className + " ").indexOf(" " + className + " ")) >= 0;
}

BX.hoverEvents = function(el)
{
	if (el)
		return BX.adjust(el, {events: BX.hoverEvents()});
	else
		return {mouseover: BX.hoverEventsHover, mouseout: BX.hoverEventsHout};
}

BX.hoverEventsHover = function(){BX.addClass(this,'bx-hover');this.BXHOVER=true;}
BX.hoverEventsHout = function(){BX.removeClass(this,'bx-hover');this.BXHOVER=false;}

BX.focusEvents = function(el)
{
	if (el)
		return BX.adjust(el, {events: BX.focusEvents()});
	else
		return {mouseover: BX.focusEventsFocus, mouseout: BX.focusEventsBlur};
}

BX.focusEventsFocus = function(){BX.addClass(this,'bx-focus');this.BXFOCUS=true;}
BX.focusEventsBlur = function(){BX.removeClass(this,'bx-focus');this.BXFOCUS=false;}

BX.setUnselectable = function(node)
{
	BX.addClass(node, 'bx-unselectable');
	node.setAttribute('unSelectable', 'on');
}

BX.setSelectable = function(node)
{
	BX.removeClass(node, 'bx-unselectable');
	node.removeAttribute('unSelectable');
}

BX.styleIEPropertyName = function(name)
{
	if (name == 'float')
		name = BX.browser.IsIE() ? 'styleFloat' : 'cssFloat';
	else
	{
		var res = BX.browser.isPropertySupported(name);
		if (res)
		{
			name = res;
		}
		else
		{
			var reg = /(\-([a-z]){1})/g;
			if (reg.test(name))
			{
				name = name.replace(reg, function () {return arguments[2].toUpperCase();});
			}
		}
	}
	return name;
}

/* CSS-notation should be used here */
BX.style = function(el, property, value)
{
	if (!BX.type.isElementNode(el))
		return null;

	if (value == null)
	{
		var res;

		if(el.currentStyle)
			res = el.currentStyle[BX.styleIEPropertyName(property)];
		else if(window.getComputedStyle)
		{
			var q = BX.browser.isPropertySupported(property, true);
			if (!!q)
				property = q;

			res = BX.GetContext(el).getComputedStyle(el, null).getPropertyValue(property);
		}

		if(!res)
			res = '';
		return res;
	}
	else
	{
		el.style[BX.styleIEPropertyName(property)] = value;
		return el;
	}
}

BX.focus = function(el)
{
	try
	{
		el.focus();
		return true;
	}
	catch (e)
	{
		return false;
	}
}

BX.firstChild = function(el)
{
	var e = el.firstChild;
	while (e && !BX.type.isElementNode(e))
	{
		e = e.nextSibling;
	}

	return e;
}

BX.lastChild = function(el)
{
	var e = el.lastChild;
	while (e && !BX.type.isElementNode(e))
	{
		e = e.previousSibling;
	}

	return e;
}

BX.previousSibling = function(el)
{
	var e = el.previousSibling;
	while (e && !BX.type.isElementNode(e))
	{
		var e = e.previousSibling;
	}

	return e;
}

BX.nextSibling = function(el)
{
	var e = el.nextSibling;
	while (e && !BX.type.isElementNode(e))
	{
		var e = e.nextSibling;
	}

	return e;
}

/*
	params: {
		tagName|tag : 'tagName',
		className|class : 'className',
		attribute : {attribute : value, attribute : value} | attribute | [attribute, attribute....],
		property : {prop: value, prop: value} | prop | [prop, prop]
	}

	all values can be RegExps or strings
*/
BX.findChildren = function(obj, params, recursive)
{
	return BX.findChild(obj, params, recursive, true);
}

BX.findChild = function(obj, params, recursive, get_all)
{
	if(!obj || !obj.childNodes) return null;

	recursive = !!recursive; get_all = !!get_all;

	var n = obj.childNodes.length, result = [];

	for (var j=0; j<n; j++)
	{
		var child = obj.childNodes[j];

		if (_checkNode(child, params))
		{
			if (get_all)
				result.push(child)
			else
				return child;
		}

		if(recursive == true)
		{
			var res = BX.findChild(child, params, recursive, get_all);
			if (res)
			{
				if (get_all)
					result = BX.util.array_merge(result, res);
				else
					return res;
			}
		}
	}

	if (get_all || result.length > 0)
		return result;
	else
		return null;
}

BX.findParent = function(obj, params, maxParent)
{
	if(!obj)
		return null;

	var o = obj;
	while(o.parentNode)
	{
		var parent = o.parentNode;

		if (_checkNode(parent, params))
			return parent;

		o = parent;

		if (!!maxParent &&
			(BX.type.isFunction(maxParent)
				|| typeof maxParent == 'object'))
		{
			if (BX.type.isElementNode(maxParent))
			{
				if (o == maxParent)
					break;
			}
			else
			{
				if (_checkNode(o, maxParent))
					break;
			}
		}
	}
	return null;
}

BX.findNextSibling = function(obj, params)
{
	if(!obj)
		return null;
	var o = obj;
	while(o.nextSibling)
	{
		var sibling = o.nextSibling;
		if (_checkNode(sibling, params))
			return sibling;
		o = sibling;
	}
	return null;
}

BX.findPreviousSibling = function(obj, params)
{
	if(!obj)
		return null;

	var o = obj;
	while(o.previousSibling)
	{
		var sibling = o.previousSibling;
		if(_checkNode(sibling, params))
			return sibling;
		o = sibling;
	}
	return null;
}

BX.findFormElements = function(form)
{
	if (BX.type.isString(form))
		form = document.forms[form]||BX(form);

	var res = [];

	if (BX.type.isElementNode(form))
	{
		if (form.tagName.toUpperCase() == 'FORM')
		{
			res = form.elements;
		}
		else
		{
			res = BX.findChildren(form, CHECK_FORM_ELEMENTS, true);
		}
	}

	return res;
}

BX.clone = function(obj, bCopyObj)
{
	var _obj, i, l;
	if (bCopyObj !== false)
		bCopyObj = true;

	if (obj === null)
		return null;

	if (BX.type.isDomNode(obj))
	{
		_obj = obj.cloneNode(bCopyObj);
	}
	else if (typeof obj == 'object')
	{
		if (BX.type.isArray(obj))
		{
			_obj = [];
			for (i=0,l=obj.length;i<l;i++)
			{
				if (typeof obj[i] == "object" && bCopyObj)
					_obj[i] = BX.clone(obj[i], bCopyObj);
				else
					_obj[i] = obj[i];
			}
		}
		else
		{
			_obj =  {};
			if (obj.constructor)
			{
				if (obj.constructor === Date)
					_obj = new Date(obj);
				else
					_obj = new obj.constructor();
			}

			for (i in obj)
			{
				if (typeof obj[i] == "object" && bCopyObj)
					_obj[i] = BX.clone(obj[i], bCopyObj);
				else
					_obj[i] = obj[i];
			}
		}

	}
	else
	{
		_obj = obj;
	}

	return _obj;
}

/* events */
BX.bind = function(el, evname, func)
{
	if (!el)
		return;

	if (evname === 'mousewheel')
		BX.bind(el, 'DOMMouseScroll', func);
	else if (evname === 'transitionend')
	{
		BX.bind(el, 'webkitTransitionEnd', func);
		BX.bind(el, 'msTransitionEnd', func);
		BX.bind(el, 'oTransitionEnd', func);
		// IE8-9 doesn't support this feature!
	}

	if (el.addEventListener)
		el.addEventListener(evname, func, false);
	else if(el.attachEvent) // IE
		el.attachEvent("on" + evname, BX.proxy(func, el));
	else
		el["on" + evname] = func;

	eventsList[eventsList.length] = {'element': el, 'event': evname, 'fn': func};
}

BX.unbind = function(el, evname, func)
{
	if (!el)
		return;

	if (evname === 'mousewheel')
		BX.unbind(el, 'DOMMouseScroll', func);

	if(el.removeEventListener) // Gecko / W3C
		el.removeEventListener(evname, func, false);
	else if(el.detachEvent) // IE
		el.detachEvent("on" + evname, BX.proxy(func, el));
	else
		el["on" + evname] = null;
}

BX.getEventButton = function(e)
{
	e = e || window.event;

	var flags = 0;

	if (typeof e.which != 'undefined')
	{
		switch (e.which)
		{
			case 1: flags = flags|BX.MSLEFT; break;
			case 2: flags = flags|BX.MSMIDDLE; break;
			case 3: flags = flags|BX.MSRIGHT; break;
		}
	}
	else if (typeof e.button != 'undefined')
	{
		flags = event.button;
	}

	return flags || BX.MSLEFT;
}

BX.unbindAll = function(el)
{
	if (!el)
		return;

	for (var i=0,len=eventsList.length; i<len; i++)
	{
		try
		{
			if (eventsList[i] && (null==el || el==eventsList[i].element))
			{
				BX.unbind(eventsList[i].element, eventsList[i].event, eventsList[i].fn);
				eventsList[i] = null;
			}
		}
		catch(e){}
	}

	if (null==el)
	{
		eventsList = [];
	}
}

var captured_events = null, _bind = null;
BX.CaptureEvents = function(el_c, evname_c)
{
	if (_bind)
		return false;

	_bind = BX.bind; captured_events = [];

	BX.bind = function(el, evname, func)
	{
		if (el === el_c && evname === evname_c)
			captured_events.push(func);

		_bind.apply(this, arguments);
	}
}

BX.CaptureEventsGet = function()
{
	if (_bind)
	{
		BX.bind = _bind;

		var captured = captured_events;

		_bind = null; captured_events = null;
		return captured;
	}
}

// Don't even try to use it for submit event!
BX.fireEvent = function(ob,ev)
{
	var result = false;
	if (BX.type.isDomNode(ob))
	{
		result = true;
		if (document.createEventObject)
		{
			// IE
			if (eventTypes[ev] != 'MouseEvent')
			{
				var e = document.createEventObject();
				e.type = ev;
				result = ob.fireEvent('on' + ev, e);
			}

			if (ob[ev])
			{
				ob[ev]();
			}
		}
		else
		{
			// non-IE
			var e = null;

			switch (eventTypes[ev])
			{
				case 'MouseEvent':
					e = document.createEvent('MouseEvent');
					e.initMouseEvent(ev, true, true, top, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, null);
				break;
				default:
					e = document.createEvent('Event');
					e.initEvent(ev, true, true);
			}

			result = ob.dispatchEvent(e);
		}
	}

	return result;
}

BX.getWheelData = function(e)
{
	e = e || window.event;
	return wheelData = e.detail ? e.detail * -1 : e.wheelDelta / 40;
}

BX.proxy_context = null;

BX.delegate = function (func, thisObject)
{
	if (!func || !thisObject)
		return func;

	return function() {
		var cur = BX.proxy_context;
		BX.proxy_context = this;
		var res = func.apply(thisObject, arguments);
		BX.proxy_context = cur;
		return res;
	}
}

BX.delegateLater = function (func_name, thisObject, contextObject)
{
	return function()
	{
		if (thisObject[func_name])
		{
			var cur = BX.proxy_context;
			BX.proxy_context = this;
			var res = thisObject[func_name].apply(contextObject||thisObject, arguments);
			BX.proxy_context = cur;
			return res;
		}
	}
}

BX._initObjectProxy = function(thisObject)
{
	if (typeof thisObject['__proxy_id_' + proxySalt] == 'undefined')
	{
		thisObject['__proxy_id_' + proxySalt] = proxyList.length;
		proxyList[thisObject['__proxy_id_' + proxySalt]] = {};
	}
}

BX.proxy = function(func, thisObject)
{
	if (!func || !thisObject)
		return func;

	BX._initObjectProxy(thisObject)

	if (typeof func['__proxy_id_' + proxySalt] == 'undefined')
		func['__proxy_id_' + proxySalt] = proxyId++;

	if (!proxyList[thisObject['__proxy_id_' + proxySalt]][func['__proxy_id_' + proxySalt]])
		proxyList[thisObject['__proxy_id_' + proxySalt]][func['__proxy_id_' + proxySalt]] = BX.delegate(func, thisObject);

	return proxyList[thisObject['__proxy_id_' + proxySalt]][func['__proxy_id_' + proxySalt]];
}

BX.defer = function(func, thisObject)
{
	if (!!thisObject)
		return BX.defer_proxy(func, thisObject);
	else
		return function() {
			var arg = arguments;
			setTimeout(function(){func.apply(this,arg)}, 10);
		};
}

BX.defer_proxy = function(func, thisObject)
{
	if (!func || !thisObject)
		return func;

	var f = BX.proxy(func, thisObject);

	this._initObjectProxy(thisObject);

	if (typeof func['__defer_id_' + proxySalt] == 'undefined')
		func['__defer_id_' + proxySalt] = proxyId++;

	if (!proxyList[thisObject['__proxy_id_' + proxySalt]][func['__defer_id_' + proxySalt]])
	{
		proxyList[thisObject['__proxy_id_' + proxySalt]][func['__defer_id_' + proxySalt]] = BX.defer(BX.delegate(func, thisObject));
	}

	return proxyList[thisObject['__proxy_id_' + proxySalt]][func['__defer_id_' + proxySalt]];
}

BX.bindDelegate = function (elem, eventName, isTarget, handler)
{
	var h = BX.delegateEvent(isTarget, handler);
	BX.bind(elem, eventName, h);
	return h;
}

BX.delegateEvent = function(isTarget, handler)
{
	return function(e)
	{
		e = e || window.event;
		var target = e.target || e.srcElement;

		while (target != this)
		{
			if (_checkNode(target, isTarget))
			{
				return handler.call(target, e);
			}
			if (target && target.parentNode)
				target = target.parentNode;
			else
				break;
		}
	}
}

BX.False = function() {return false;}
BX.DoNothing = function() {}

// TODO: also check event handlers set via BX.bind()
BX.denyEvent = function(el, ev)
{
	deniedEvents.push([el, ev, el['on' + ev]]);
	el['on' + ev] = BX.DoNothing;
}

BX.allowEvent = function(el, ev)
{
	for(var i=0, len=deniedEvents.length; i<len; i++)
	{
		if (deniedEvents[i][0] == el && deniedEvents[i][1] == ev)
		{
			el['on' + ev] = deniedEvents[i][2];
			BX.util.deleteFromArray(deniedEvents, i);
			return;
		}
	}
}

BX.fixEventPageXY = function(event)
{
	BX.fixEventPageX(event);
	BX.fixEventPageY(event);
	return event;
};

BX.fixEventPageX = function(event)
{
	if (event.pageX == null && event.clientX != null)
	{
		event.pageX =
			event.clientX +
			(document.documentElement && document.documentElement.scrollLeft || document.body && document.body.scrollLeft || 0) -
			(document.documentElement.clientLeft || 0);
	}

	return event;
};

BX.fixEventPageY = function(event)
{
	if (event.pageY == null && event.clientY != null)
	{
		event.pageY =
			event.clientY +
			(document.documentElement && document.documentElement.scrollTop || document.body && document.body.scrollTop || 0) -
			(document.documentElement.clientTop || 0);
	}

	return event;
};

BX.PreventDefault = function(e)
{
	if(!e) e = window.event;
	if(e.stopPropagation)
	{
		e.preventDefault();
		e.stopPropagation();
	}
	else
	{
		e.cancelBubble = true;
		e.returnValue = false;
	}
	return false;
}

BX.eventReturnFalse = function(e)
{
	e=e||window.event;
	if (e && e.preventDefault) e.preventDefault();
	else e.returnValue = false;
	return false;
}

BX.eventCancelBubble = function(e)
{
	e=e||window.event;
	if(e && e.stopPropagation)
		e.stopPropagation();
	else
		e.cancelBubble = true;
}

/* custom events */
/*
	BX.addCustomEvent(eventObject, eventName, eventHandler) - set custom event handler for particular object
	BX.addCustomEvent(eventName, eventHandler) - set custom event handler for all objects
*/
BX.addCustomEvent = function(eventObject, eventName, eventHandler)
{
	/* shift parameters for short version */
	if (BX.type.isString(eventObject))
	{
		eventHandler = eventName;
		eventName = eventObject;
		eventObject = window;
	}

	eventName = eventName.toUpperCase();

	if (!customEvents[eventName])
		customEvents[eventName] = [];

	customEvents[eventName].push(
		{
			handler: eventHandler,
			obj: eventObject
		}
	);
}

BX.removeCustomEvent = function(eventObject, eventName, eventHandler)
{
	/* shift parameters for short version */
	if (BX.type.isString(eventObject))
	{
		eventHandler = eventName;
		eventName = eventObject;
		eventObject = window;
	}

	eventName = eventName.toUpperCase();

	if (!customEvents[eventName])
		return;

	for (var i = 0, l = customEvents[eventName].length; i < l; i++)
	{
		if (!customEvents[eventName][i])
			continue;
		if (customEvents[eventName][i].handler == eventHandler && customEvents[eventName][i].obj == eventObject)
		{
			delete customEvents[eventName][i];
			return;
		}
	}
}

BX.onCustomEvent = function(eventObject, eventName, arEventParams)
{
	/* shift parameters for short version */
	if (BX.type.isString(eventObject))
	{
		arEventParams = eventName;
		eventName = eventObject;
		eventObject = window;
	}

	eventName = eventName.toUpperCase();

	if (!customEvents[eventName])
		return;

	if (!arEventParams)
		arEventParams = [];

	var h;
	for (var i = 0, l = customEvents[eventName].length; i < l; i++)
	{
		h = customEvents[eventName][i];
		if (!h || !h.handler)
			continue;

		if (h.obj == window || /*eventObject == window || */h.obj == eventObject) //- only global event handlers will be called
		{
			h.handler.apply(eventObject, arEventParams);
		}
	}
}

BX.parseJSON = function(data, context)
{
	var result = null;
	if (BX.type.isString(data))
	{
		try {
			if (data.indexOf("\n") >= 0)
				eval('result = ' + data);
			else
				result = (new Function("return " + data))();
		} catch(e) {
			BX.onCustomEvent(context, 'onParseJSONFailure', [data, context])
		}
	}

	return result;
}

/* ready */
BX.isReady = false;
BX.ready = function(handler)
{
	bindReady();

	if (!BX.type.isFunction(handler))
	{
		BX.debug('READY: not a function! ', handler);
	}
	else
	{
		if (BX.isReady)
			handler.call(document);
		else if (readyList)
			readyList.push(handler);
	}
}

BX.submit = function(obForm, action_name, action_value, onAfterSubmit)
{
	action_name = action_name || 'save';
	if (!obForm['BXFormSubmit_' + action_name])
	{
		obForm['BXFormSubmit_' + action_name] = obForm.appendChild(BX.create('INPUT', {
			'props': {
				'type': 'submit',
				'name': action_name,
				'value': action_value || 'Y'
			},
			'style': {
				'display': 'none'
			}
		}));
	}

	if (obForm.sessid)
		obForm.sessid.value = BX.bitrix_sessid();

	setTimeout(BX.delegate(function() {BX.fireEvent(this, 'click'); if (onAfterSubmit) onAfterSubmit();}, obForm['BXFormSubmit_' + action_name]), 10);
}


/* browser detection */
BX.browser = {

	IsIE: function()
	{
		return bIE;
	},

	IsIE6: function()
	{
		return (/MSIE 6/i.test(navigator.userAgent));
	},

	IsIE9: function()
	{
		return !!document.documentMode && document.documentMode >= 9;
	},

	IsIE10: function()
	{
		return !!document.documentMode && document.documentMode >= 10;
	},

	IsOpera: function()
	{
		return bOpera;
	},

	IsSafari: function()
	{
		return bSafari;
	},

	IsFirefox: function()
	{
		return bFirefox;
	},

	IsChrome: function()
	{
		return bChrome;
	},

	IsMac: function()
	{
		return (/Macintosh/i.test(navigator.userAgent));
	},

	IsAndroid: function()
	{
		return (/Android/i.test(navigator.userAgent));
	},

	IsIOS: function()
	{
		return (/(iPad;)|(iPhone;)/i.test(navigator.userAgent));
	},

	IsDoctype: function(pDoc)
	{
		pDoc = pDoc || document;

		if (pDoc.compatMode)
			return (pDoc.compatMode == "CSS1Compat");

		if (pDoc.documentElement && pDoc.documentElement.clientHeight)
			return true;

		return false;
	},

	SupportLocalStorage: function()
	{
		return !!BX.localStorage && !!BX.localStorage.checkBrowser()
	},

	addGlobalClass: function() {
		if (BX.browser.IsIOS())
		{
			BX.addClass(document.documentElement, 'bx-ios');
		}
		else if (BX.browser.IsMac())
		{
			BX.addClass(document.documentElement, 'bx-mac');
		}
		else if (BX.browser.IsAndroid())
		{
			BX.addClass(document.documentElement, 'bx-android');
		}

		if (BX.browser.IsIOS() || BX.browser.IsAndroid())
		{
			BX.addClass(document.documentElement, 'bx-touch');
		}
		else
		{
			BX.addClass(document.documentElement, 'bx-no-touch');
		}

		if (/AppleWebKit/.test(navigator.userAgent))
		{
			BX.addClass(document.documentElement, 'bx-chrome');
		}
		else if (/MSIE 8/.test(navigator.userAgent))
		{
			BX.addClass(document.documentElement, 'bx-ie bx-ie8'
				 + (!BX.browser.IsDoctype() ? ' bx-quirks' : ''));
		}
		else if (/MSIE 9/.test(navigator.userAgent))
		{
			BX.addClass(document.documentElement, 'bx-ie bx-ie9'
				 + (!BX.browser.IsDoctype() ? ' bx-quirks' : ''));
		}
		else if (/MSIE 10/.test(navigator.userAgent))
		{
			// it seems IE10 doesn't have any specific bugs like others event in quirks mode
			BX.addClass(document.documentElement, 'bx-ie bx-ie10');
		}
		else if (/Opera/.test(navigator.userAgent))
		{
			BX.addClass(document.documentElement, 'bx-opera');
		}
		else if (/Gecko/.test(navigator.userAgent))
		{
			BX.addClass(document.documentElement, 'bx-firefox');
		}

		BX.browser.addGlobalClass = BX.DoNothing;
	},

	isPropertySupported: function(jsProperty, bReturnCSSName)
	{
		if (!BX.type.isNotEmptyString(jsProperty))
			return false;

		var property = jsProperty.indexOf("-") > -1 ? getJsName(jsProperty) : jsProperty;
		bReturnCSSName = !!bReturnCSSName;

		var ucProperty = property.charAt(0).toUpperCase() + property.slice(1);
		var properties = (property + ' ' + ["Webkit", "Moz", "O", "ms"].join(ucProperty + " ") + ucProperty).split(" ");
		var obj = document.body || document.documentElement;

		for (var i = 0; i < properties.length; i++)
		{
			var prop = properties[i];
			if (obj.style[prop] !== undefined)
			{
				var prefix = prop == property
							? ""
							: "-" + prop.substr(0, prop.length - property.length).toLowerCase() + "-";
				return bReturnCSSName ? prefix + getCssName(property) : prop;
			}
		}

		function getCssName(propertyName)
		{
			return propertyName.replace(/([A-Z])/g, function() { return "-" + arguments[1].toLowerCase(); } )
		}

		function getJsName(cssName)
		{
			var reg = /(\-([a-z]){1})/g;
			if (reg.test(cssName))
				return cssName.replace(reg, function () {return arguments[2].toUpperCase();});
			else
				return cssName;
		}

		return false;
	},

	addGlobalFeatures : function(features, prefix)
	{
		if (!BX.type.isArray(features))
			return;

		var classNames = [];
		for (var i = 0; i < features.length; i++)
		{
			var support = !!BX.browser.isPropertySupported(features[i]);
			classNames.push( "bx-" + (support ? "" : "no-") + features[i].toLowerCase());
		}
		BX.addClass(document.documentElement, classNames.join(" "));
	}
}

/* low-level fx funcitons*/
BX.show = function(ob, displayType)
{
	if (ob.BXDISPLAY || !_checkDisplay(ob, displayType))
	{
		ob.style.display = ob.BXDISPLAY;
	}
}

BX.hide = function(ob, displayType)
{
	if (!ob.BXDISPLAY)
		_checkDisplay(ob, displayType);

	ob.style.display = 'none';
}

BX.toggle = function(ob, values)
{
	if (!values && BX.type.isElementNode(ob))
	{
		var bShow = true;
		if (ob.BXDISPLAY)
			bShow = !_checkDisplay(ob);
		else
			bShow = ob.style.display == 'none';

		if (bShow)
			BX.show(ob);
		else
			BX.hide(ob);
	}
	else if (BX.type.isArray(values))
	{
		for (var i=0,len=values.length; i<len; i++)
		{
			if (ob == values[i])
			{
				ob = values[i==len-1 ? 0 : i+1]
				break;
			}
		}
		if (i==len)
			ob = values[0];
	}

	return ob;
}

/* some useful util functions */

BX.util = {
	array_values: function(ar)
	{
		if (!BX.type.isArray(ar))
			return BX.util._array_values_ob(ar);
		var arv = [];
		for(var i=0,l=ar.length;i<l;i++)
			if (ar[i] !== null && typeof ar[i] != 'undefined')
				arv.push(ar[i]);
		return arv;
	},

	_array_values_ob: function(ar)
	{
		var arv = [];
		for(var i in ar)
			if (ar[i] !== null && typeof ar[i] != 'undefined')
				arv.push(ar[i]);
		return arv;
	},

	array_keys: function(ar)
	{
		if (!BX.type.isArray(ar))
			return BX.util._array_keys_ob(ar);
		var arv = [];
		for(var i=0,l=ar.length;i<l;i++)
			if (ar[i] !== null && typeof ar[i] != 'undefined')
				arv.push(i);
		return arv;
	},

	_array_keys_ob: function(ar)
	{
		var arv = [];
		for(var i in ar)
			if (ar[i] !== null && typeof ar[i] != 'undefined')
				arv.push(i);
		return arv;
	},

	array_merge: function(first, second)
	{
		if (!BX.type.isArray(first)) first = [];
		if (!BX.type.isArray(second)) second = [];

		var i = first.length, j = 0;

		if (typeof second.length === "number")
		{
			for (var l = second.length; j < l; j++)
			{
				first[i++] = second[j];
			}
		}
		else
		{
			while (second[j] !== undefined)
			{
				first[i++] = second[j++];
			}
		}

		first.length = i;

		return first;
	},

	array_unique: function(ar)
	{
		var i=0,j,len=ar.length;
		if(len<2) return ar;

		for (; i<len-1;i++)
		{
			for (j=i+1; j<len;j++)
			{
				if (ar[i]==ar[j])
				{
					ar.splice(j--,1); len--;
				}
			}
		}

		return ar;
	},

	in_array: function(needle, haystack)
	{
		for(var i=0; i<haystack.length; i++)
		{
			if(haystack[i] == needle)
				return true;
		}
		return false;
	},

	array_search: function(needle, haystack)
	{
		for(var i=0; i<haystack.length; i++)
		{
			if(haystack[i] == needle)
				return i;
		}
		return -1;
	},

	object_search_key: function(needle, haystack)
	{
		if (typeof haystack[needle] != 'undefined')
			return haystack[needle];

		for(var i in haystack)
		{
			if (typeof haystack[i] == "object")
			{
				var result = BX.util.object_search_key(needle, haystack[i]);
				if (result !== false)
					return result;
			}
		}
		return false;
	},

	trim: function(s)
	{
		if (BX.type.isString(s))
			return s.replace(r.ltrim, '').replace(r.rtrim, '');
		else
			return s;
	},

	urlencode: function(s){return encodeURIComponent(s);},

	// it may also be useful. via sVD.
	deleteFromArray: function(ar, ind) {return ar.slice(0, ind).concat(ar.slice(ind + 1));},
	insertIntoArray: function(ar, ind, el) {return ar.slice(0, ind).concat([el]).concat(ar.slice(ind));},

	htmlspecialchars: function(str)
	{
		if(!str.replace) return str;

		return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	},

	htmlspecialcharsback: function(str)
	{
		if(!str.replace) return str;

		return str.replace(/\&quot;/g, '"').replace(/&#39;/g, "'").replace(/\&lt;/g, '<').replace(/\&gt;/g, '>').replace(/\&amp;/g, '&');
	},

	// Quote regular expression characters plus an optional character
	preg_quote: function(str, delimiter)
	{
		if(!str.replace)
			return str;
		return str.replace(new RegExp('[.\\\\+*?\\[\\^\\]$(){}=!<>|:\\' + (delimiter || '') + '-]', 'g'), '\\$&');
	},

	jsencode: function(str)
	{
		if (!str || !str.replace)
			return str;

		var escapes =
		[
			{ c: "\\\\", r: "\\\\" }, // should be first
			{ c: "\\t", r: "\\t" },
			{ c: "\\n", r: "\\n" },
			{ c: "\\r", r: "\\r" },
			{ c: "\"", r: "\\\"" },
			{ c: "'", r: "\\'" },
			{ c: "<", r: "\\x3C" },
			{ c: ">", r: "\\x3E" },
			{ c: "\\u2028", r: "\\u2028" },
			{ c: "\\u2029", r: "\\u2029" }
		];
		for (var i = 0; i < escapes.length; i++)
			str = str.replace(new RegExp(escapes[i].c, 'g'), escapes[i].r);
		return str;
	},

	str_pad: function(input, pad_length, pad_string, pad_type)
	{
		pad_string = pad_string || ' ';
		pad_type = pad_type || 'right';
		input = input.toString();

		if (pad_type == 'left')
			return BX.util.str_pad_left(input, pad_length, pad_string);
		else
			return BX.util.str_pad_right(input, pad_length, pad_string);

	},

	str_pad_left: function(input, pad_length, pad_string)
	{
		var i = input.length, q=pad_string.length;
		if (i >= pad_length) return input;

		for(;i<pad_length;i+=q)
			input = pad_string + input;

		return input;
	},

	str_pad_right: function(input, pad_length, pad_string)
	{
		var i = input.length, q=pad_string.length;
		if (i >= pad_length) return input;

		for(;i<pad_length;i+=q)
			input += pad_string;

		return input;
	},

	strip_tags: function(str)
	{
		return str.split(/<[^>]+>/g).join('')
	},

	popup: function(url, width, height)
	{
		var w, h;
		if(BX.browser.IsOpera())
		{
			w = document.body.offsetWidth;
			h = document.body.offsetHeight;
		}
		else
		{
			w = screen.width;
			h = screen.height;
		}
		return window.open(url, '', 'status=no,scrollbars=yes,resizable=yes,width='+width+',height='+height+',top='+Math.floor((h - height)/2-14)+',left='+Math.floor((w - width)/2-5));
	},

	// BX.util.objectSort(object, sortBy, sortDir) - Sort object by property
	// function params: 1 - object for sort, 2 - sort by property, 3 - sort direction (asc/desc)
	// return: sort array [[objectElement], [objectElement]] in sortDir direction

	// example: BX.util.objectSortBy({'L1': {'name': 'Last'}, 'F1': {'name': 'First'}}, 'name', 'asc');
	// return: [{'name' : 'First'}, {'name' : 'Last'}]
	objectSort: function(object, sortBy, sortDir)
	{
		sortDir = sortDir == 'asc'? 'asc': 'desc';

		var arItems = Array();
		for (var i in object)
			if (object[i][sortBy])
				arItems.push([i, object[i][sortBy]]);

		if (sortDir == 'asc')
		{
			arItems.sort(function(i, ii) {
				if (!isNaN(i[1]) && !isNaN(ii[1]))
				{
					var s1 = parseInt(i[1]); var s2 = parseInt(ii[1]);
				}
				else
				{
					var s1 = i[1].toString().toLowerCase(); var s2 = ii[1].toString().toLowerCase();
				}
				if (s1 > s2) return 1; else if (s1 < s2) return -1; else return 0;
			});
		}
		else
		{
			arItems.sort(function(i, ii) {
				if (!isNaN(i[1]) && !isNaN(ii[1]))
				{
					var s1 = parseInt(i[1]);
					var s2 = parseInt(ii[1]);
				}
				else
				{
					var s1 = i[1].toString().toLowerCase();
					var s2 = ii[1].toString().toLowerCase();
				}
				if (s1 < s2) return 1; else if (s1 > s2) return -1; else return 0;
			});
		}

		var arReturnArray = Array();
		for (var i = 0; i < arItems.length; i++)
			arReturnArray.push(object[arItems[i][0]]);

		return arReturnArray;
	},

	// #fdf9e5 => {r=253, g=249, b=229}
	hex2rgb: function(color)
	{
		var rgb = color.replace(/[# ]/g,"").replace(/^(.)(.)(.)$/,'$1$1$2$2$3$3').match(/.{2}/g);
		for (var i=0;  i<3; i++)
		{
			rgb[i] = parseInt(rgb[i], 16);
		}
		return {'r':rgb[0],'g':rgb[1],'b':rgb[2]};
	},

	remove_url_param: function(url, param)
	{
		if (BX.type.isArray(param))
		{
			for (var i=0; i<param.length; i++)
				url = BX.util.remove_url_param(url, param[i])
		}
		else
		{
			url = url.replace(new RegExp('([?&])'+param+'=[^&]*[&]*', 'i'), '$1');
		}

		return url;
	},

	even: function(digit)
	{
		return (parseInt(digit) % 2 == 0)? true: false;
	}
}

BX.type = {
	isString: function(item) {
		return item === '' ? true : (item ? (typeof (item) == "string" || item instanceof String) : false);
	},
	isNotEmptyString: function(item) {
		return BX.type.isString(item) ? item.length > 0 : false;
	},
	isBoolean: function(item) {
		return item === true || item === false;
	},
	isNumber: function(item) {
		return item === 0 ? true : (item ? (typeof (item) == "number" || item instanceof Number) : false);
	},
	isFunction: function(item) {
		return item === null ? false : (typeof (item) == "function" || item instanceof Function);
	},
	isElementNode: function(item) {
		//document.body.ELEMENT_NODE;
		return item && typeof (item) == "object" && "nodeType" in item && item.nodeType == 1 && item.tagName && item.tagName.toUpperCase() != 'SCRIPT' && item.tagName.toUpperCase() != 'STYLE' && item.tagName.toUpperCase() != 'LINK';
	},
	isDomNode: function(item) {
		return item && typeof (item) == "object" && "nodeType" in item;
	},
	isArray: function(item) {
		return item && Object.prototype.toString.call(item) == "[object Array]";
	},
	isDate : function(item) {
		return item && Object.prototype.toString.call(item) == "[object Date]";
	}
}

BX.isNodeInDom = function(node)
{
	return node === document ? true :
		(node.parentNode ? BX.isNodeInDom(node.parentNode) : false);
}

BX.isNodeHidden = function(node)
{
	if (node === document)
		return false;
	else if (BX.style(node, 'display') == 'none')
		return true;
	else
		return (node.parentNode ? BX.isNodeHidden(node.parentNode) : true);
}

BX.evalPack = function(code)
{
	while (code.length > 0)
	{
		var c = code.shift();

		if (c.TYPE == 'SCRIPT_EXT' || c.TYPE == 'SCRIPT_SRC')
		{
			BX.loadScript(c.DATA, function() {BX.evalPack(code)});
		}
		else if (c.TYPE == 'SCRIPT')
			BX.evalGlobal(c.DATA);
	}
}

BX.evalGlobal = function(data)
{
	if (data)
	{
		var head = document.getElementsByTagName("head")[0] || document.documentElement,
			script = document.createElement("script");

		script.type = "text/javascript";

		if (!BX.browser.IsIE())
		{
			script.appendChild(document.createTextNode(data));
		}
		else
		{
			script.text = data;
		}

		head.insertBefore(script, head.firstChild);
		head.removeChild(script);
	}
}

BX.processHTML = function(HTML, scriptsRunFirst)
{
	var matchScript, scripts = [], styles = [], data = HTML;

	while ((matchScript = data.match(r.script)) !== null)
	{
		var end = data.search(/<\/script>/i);
		if (end == -1)
			break;

		var bRunFirst = scriptsRunFirst || (matchScript[1].indexOf('bxrunfirst') != '-1');

		var matchSrc;
		if ((matchSrc = matchScript[1].match(r.script_src)) !== null)
			scripts.push({"bRunFirst": bRunFirst, "isInternal": false, "JS": matchSrc[1]});
		else
		{
			var start = matchScript.index + matchScript[0].length;
			var js = data.substr(start, end-start);

			scripts.push({"bRunFirst": bRunFirst, "isInternal": true, "JS": js});
		}

		data = data.substr(0, matchScript.index) + data.substr(end+9);
	}

	while ((matchStyle = data.match(r.style)) !== null)
	{
		var matchHref;
		if ((matchHref = matchStyle[0].match(r.style_href)) !== null && matchStyle[0].indexOf('media="') < 0)
		{
			styles.push(matchHref[1]);
		}
		data = data.replace(matchStyle[0], '');
	}

	return {'HTML': data, 'SCRIPT': scripts, 'STYLE': styles};
}

BX.garbage = function(call, thisObject)
{
	garbageCollectors.push({callback: call, context: thisObject});
}

/* window pos functions */

BX.GetDocElement = function (pDoc)
{
	pDoc = pDoc || document;
	return (BX.browser.IsDoctype(pDoc) ? pDoc.documentElement : pDoc.body);
}

BX.GetContext = function(node)
{
	if (BX.type.isElementNode(node))
		return node.ownerDocument.parentWindow || node.ownerDocument.defaultView || window;
	else if (BX.type.isDomNode(node))
		return node.parentWindow || node.defaultView || window;
	else
		return window;
}

BX.GetWindowInnerSize = function(pDoc)
{
	var width, height;

	pDoc = pDoc || document;

	if (self.innerHeight) // all except Explorer
	{
		width = BX.GetContext(pDoc).innerWidth;
		height = BX.GetContext(pDoc).innerHeight;
	}
	else if (pDoc.documentElement && (pDoc.documentElement.clientHeight || pDoc.documentElement.clientWidth)) // Explorer 6 Strict Mode
	{
		width = pDoc.documentElement.clientWidth;
		height = pDoc.documentElement.clientHeight;
	}
	else if (pDoc.body) // other Explorers
	{
		width = pDoc.body.clientWidth;
		height = pDoc.body.clientHeight;
	}
	return {innerWidth : width, innerHeight : height};
}

BX.GetWindowScrollPos = function(pDoc)
{
	var left, top;

	pDoc = pDoc || document;

	if (self.pageYOffset) // all except Explorer
	{
		left = BX.GetContext(pDoc).pageXOffset;
		top = BX.GetContext(pDoc).pageYOffset;
	}
	else if (pDoc.documentElement && (pDoc.documentElement.scrollTop || pDoc.documentElement.scrollLeft)) // Explorer 6 Strict
	{
		left = pDoc.documentElement.scrollLeft;
		top = pDoc.documentElement.scrollTop;
	}
	else if (pDoc.body) // all other Explorers
	{
		left = pDoc.body.scrollLeft;
		top = pDoc.body.scrollTop;
	}
	return {scrollLeft : left, scrollTop : top};
}

BX.GetWindowScrollSize = function(pDoc)
{
	var width, height;
	if (!pDoc)
		pDoc = document;

	if ( (pDoc.compatMode && pDoc.compatMode == "CSS1Compat"))
	{
		width = pDoc.documentElement.scrollWidth;
		height = pDoc.documentElement.scrollHeight;
	}
	else
	{
		if (pDoc.body.scrollHeight > pDoc.body.offsetHeight)
			height = pDoc.body.scrollHeight;
		else
			height = pDoc.body.offsetHeight;

		if (pDoc.body.scrollWidth > pDoc.body.offsetWidth ||
			(pDoc.compatMode && pDoc.compatMode == "BackCompat") ||
			(pDoc.documentElement && !pDoc.documentElement.clientWidth)
		)
			width = pDoc.body.scrollWidth;
		else
			width = pDoc.body.offsetWidth;
	}
	return {scrollWidth : width, scrollHeight : height};
}

BX.GetWindowSize = function(pDoc)
{
	var innerSize = this.GetWindowInnerSize(pDoc);
	var scrollPos = this.GetWindowScrollPos(pDoc);
	var scrollSize = this.GetWindowScrollSize(pDoc);

	return  {
		innerWidth : innerSize.innerWidth, innerHeight : innerSize.innerHeight,
		scrollLeft : scrollPos.scrollLeft, scrollTop : scrollPos.scrollTop,
		scrollWidth : scrollSize.scrollWidth, scrollHeight : scrollSize.scrollHeight
	};
}

BX.hide_object = function(ob)
{
	ob = BX(ob);
	ob.style.position = 'absolute';
	ob.style.top = '-1000px';
	ob.style.left = '-1000px';
	ob.style.height = '10px';
	ob.style.width = '10px';
};

BX.is_relative = function(el)
{
	var p = BX.style(el, 'position');
	return p == 'relative' || p == 'absolute';
}

BX.is_float = function(el)
{
	var p = BX.style(el, 'float');
	return p == 'right' || p == 'left';
}

BX.is_fixed = function(el)
{
	var p = BX.style(el, 'position');
	return p == 'fixed';
}

BX.pos = function(el, bRelative)
{
	var r = { top: 0, right: 0, bottom: 0, left: 0, width: 0, height: 0 };
	bRelative = !!bRelative;
	if (!el)
		return r;
	if (typeof (el.getBoundingClientRect) != "undefined" && el.ownerDocument == document && !bRelative)
	{
		var clientRect = el.getBoundingClientRect();
		var root = document.documentElement;
		var body = document.body;

		r.top = clientRect.top + (root.scrollTop || body.scrollTop);
		r.left = clientRect.left + (root.scrollLeft || body.scrollLeft);
		r.width = clientRect.right - clientRect.left;
		r.height = clientRect.bottom - clientRect.top;
		r.right = clientRect.right + (root.scrollLeft || body.scrollLeft);
		r.bottom = clientRect.bottom + (root.scrollTop || body.scrollTop);
	}
	else
	{
		var x = 0, y = 0, w = el.offsetWidth, h = el.offsetHeight;
		var first = true;
		for (; el != null; el = el.offsetParent)
		{
			if (!first && bRelative && BX.is_relative(el))
				break;

			x += el.offsetLeft;
			y += el.offsetTop;
			if (first)
			{
				first = false;
				continue;
			}

			var elBorderLeftWidth = parseInt(BX.style(el, 'border-left-width')),
				elBorderTopWidth = parseInt(BX.style(el, 'border-top-width'));

			if (!isNaN(elBorderLeftWidth) && elBorderLeftWidth > 0)
				x += elBorderLeftWidth;
			if (!isNaN(elBorderTopWidth) && elBorderTopWidth > 0)
				y += elBorderTopWidth;
		}

		r.top = y;
		r.left = x;
		r.width = w;
		r.height = h;
		r.right = r.left + w;
		r.bottom = r.top + h;
	}

	for (var i in r) r[i] = parseInt(r[i]);

	return r;
}


BX.align = function(pos, w, h, type)
{
	if (type)
		type = type.toLowerCase();
	else
		type = '';

	var pDoc = document;
	if (BX.type.isElementNode(pos))
	{
		pDoc = pos.ownerDocument;
		pos = BX.pos(pos);
	}

	var x = pos["left"], y = pos["bottom"];

	var scroll = BX.GetWindowScrollPos(pDoc);
	var size = BX.GetWindowInnerSize(pDoc);

	if((size.innerWidth + scroll.scrollLeft) - (pos["left"] + w) < 0)
	{
		if(pos["right"] - w >= 0 )
			x = pos["right"] - w;
		else
			x = scroll.scrollLeft;
	}

	if(((size.innerHeight + scroll.scrollTop) - (pos["bottom"] + h) < 0) || ~type.indexOf('top'))
	{
		if(pos["top"] - h >= 0 || ~type.indexOf('top'))
			y = pos["top"] - h;
		else
			y = scroll.scrollTop;
	}

	return {'left':x, 'top':y};
}

BX.scrollToNode = function(node)
{
	var obNode = BX(node);

	if (obNode.scrollIntoView)
		obNode.scrollIntoView(true);
	else
	{
		var arNodePos = BX.pos(obNode);
		window.scrollTo(arNodePos.left, arNodePos.top);
	}
}

/* non-xhr loadings */
BX.showWait = function(node, msg)
{
	node = BX(node) || document.body || document.documentElement;
	msg = msg || BX.message('JS_CORE_LOADING');

	var container_id = node.id || Math.random();

	var obMsg = node.bxmsg = document.body.appendChild(BX.create('DIV', {
		props: {
			id: 'wait_' + container_id,
			className: 'bx-core-waitwindow'
		},
		text: msg
	}));

	setTimeout(BX.delegate(_adjustWait, node), 10);

	lastWait[lastWait.length] = obMsg;
	return obMsg;
}

BX.closeWait = function(node, obMsg)
{
	if(node && !obMsg)
		obMsg = node.bxmsg;
	if(node && !obMsg && BX.hasClass(node, 'bx-core-waitwindow'))
		obMsg = node;
	if(node && !obMsg)
		obMsg = BX('wait_' + node.id);
	if(!obMsg)
		obMsg = lastWait.pop();

	if (obMsg && obMsg.parentNode)
	{
		for (var i=0,len=lastWait.length;i<len;i++)
		{
			if (obMsg == lastWait[i])
			{
				lastWait = BX.util.deleteFromArray(lastWait, i);
				break;
			}
		}

		obMsg.parentNode.removeChild(obMsg);
		if (node) node.bxmsg = null;
		BX.cleanNode(obMsg, true);
	}
}

BX.setKernelJS = function(scripts)
{
	if (BX.type.isArray(scripts))
		arKernelJS = scripts;
}

BX.getKernelJS = function()
{
	return arKernelJS;
}

BX.loadScript = function(script, callback, doc)
{
	if (!BX.isReady)
	{
		var _args = arguments;
		BX.ready(function() {
			BX.loadScript.apply(this, _args);
		});
		return;
	}

	doc = doc || document;

	if (BX.type.isString(script))
		script = [script];
	var _callback = function()
	{
		return (callback && BX.type.isFunction(callback)) ? callback() : null
	}
	var load_js = function(ind)
	{
		if(ind >= script.length)
			return _callback();

		if(!!script[ind])
		{
			var fileSrc = '';
			var oHead = doc.getElementsByTagName("head")[0] || doc.documentElement;
			var oScript = doc.createElement('script');
			oScript.src = script[ind];

			var verInd = script[ind].indexOf('.js?');
			if(verInd>0)
				fileSrc = script[ind].substr(0, verInd + 3);
			else
				fileSrc = script[ind];

			if(_isScriptLoaded(fileSrc))
			{
				load_js(++ind);
			}
			else
			{
				var bLoaded = false;
				oScript.onload = oScript.onreadystatechange = function()
				{
					if (!bLoaded && (!oScript.readyState || oScript.readyState == "loaded" || oScript.readyState == "complete"))
					{
						bLoaded = true;
						setTimeout(function (){load_js(++ind);}, 50);

						oScript.onload = oScript.onreadystatechange = null;
						if (oHead && oScript.parentNode)
						{
							oHead.removeChild(oScript);
						}
					}
				}

				return oHead.insertBefore(oScript, oHead.firstChild);
			}
		}
		else
		{
			load_js(++ind);
		}
	}

	load_js(0);
}

BX.loadCSS = function(arCSS, doc, win)
{
	if (!BX.isReady)
	{
		var _args = arguments;
		BX.ready(function() {
			BX.loadCSS.apply(this, _args);
		});
		return null;
	}

	if (BX.type.isString(arCSS))
	{
		var bSingle = true;
		arCSS = [arCSS];
	}
	var i = 0,
		l = arCSS.length,
		lnk = null,
		pLnk = [];

	if (l == 0)
		return null;

	doc = doc || document;
	win = win || window;

	_checkCssList();

	if (!win.bxhead)
	{
		var heads = doc.getElementsByTagName('HEAD');
		win.bxhead = heads[0];

		if (!win.bxhead)
		{
			return null;
		}
	}

	for (i = 0; i < l; i++)
	{
		var _check = arCSS[i]
				.replace(/\.css(\?\d*)/, '.css')
				.replace(/^(http[s]*:)*\/\/[^\/]+/i, '');

		if (BX.util.in_array(_check, cssList))
			continue;

		lnk = document.createElement('LINK');
		lnk.href = arCSS[i];
		lnk.rel = 'stylesheet';
		lnk.type = 'text/css';
		win.bxhead.appendChild(lnk);

		pLnk.push(lnk);
		cssList.push(_check);
	}

	if (bSingle)
		return lnk;

	return pLnk;
}

BX.reload = function(back_url, bAddClearCache)
{
	if (back_url === true)
	{
		bAddClearCache = true;
		back_url = null;
	}

	var new_href = back_url || top.location.href;

	var hashpos = new_href.indexOf('#'), hash = '';

	if (hashpos != -1)
	{
		hash = new_href.substr(hashpos);
		new_href = new_href.substr(0, hashpos);
	}

	if (bAddClearCache && new_href.indexOf('clear_cache=Y') < 0)
		new_href += (new_href.indexOf('?') == -1 ? '?' : '&') + 'clear_cache=Y';

	if (hash)
	{
		// hack for clearing cache in ajax mode components with history emulation
		if (bAddClearCache && (hash.substr(0, 5) == 'view/' || hash.substr(0, 6) == '#view/') && hash.indexOf('clear_cache%3DY') < 0)
			hash += (hash.indexOf('%3F') == -1 ? '%3F' : '%26') + 'clear_cache%3DY'

		new_href = new_href.replace(/(\?|\&)_r=[\d]*/, '');
		new_href += (new_href.indexOf('?') == -1 ? '?' : '&') + '_r='+Math.round(Math.random()*10000) + hash;
	}

	top.location.href = new_href;
}

BX.clearCache = function()
{
	BX.showWait();
	BX.reload(true);
}

BX.template = function(tpl, callback, bKillTpl)
{
	BX.ready(function() {
		_processTpl(BX(tpl), callback, bKillTpl);
	});
}

BX.isAmPmMode = function()
{
	return BX.message('FORMAT_DATETIME').match('T') == null ? false : true;
}

BX.formatDate = function(date, format)
{
	date = date || new Date();

	var bTime = date.getHours() || date.getMinutes() || date.getSeconds(),
		str = !!format
			? format :
			(bTime ? BX.message('FORMAT_DATETIME') : BX.message('FORMAT_DATE')
		);

	return str.replace(/YYYY/ig, date.getFullYear())
		.replace(/MMMM/ig, BX.util.str_pad_left((date.getMonth()+1).toString(), 2, '0'))
		.replace(/MM/ig, BX.util.str_pad_left((date.getMonth()+1).toString(), 2, '0'))
		.replace(/DD/ig, BX.util.str_pad_left(date.getDate().toString(), 2, '0'))
		.replace(/HH/ig, BX.util.str_pad_left(date.getHours().toString(), 2, '0'))
		.replace(/MI/ig, BX.util.str_pad_left(date.getMinutes().toString(), 2, '0'))
		.replace(/SS/ig, BX.util.str_pad_left(date.getSeconds().toString(), 2, '0'));
}

BX.getNumMonth = function(month)
{
	var wordMonthCut = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
	var wordMonth = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

	var q = month.toUpperCase();
	for (i = 1; i <= 12; i++)
	{
		if (q == BX.message('MON_'+i).toUpperCase() || q == BX.message('MONTH_'+i).toUpperCase() || q == wordMonthCut[i-1].toUpperCase() || q == wordMonth[i-1].toUpperCase())
		{
			return i;
		}
	}
	return month;
}

BX.parseDate = function(str)
{
	if (BX.type.isNotEmptyString(str))
	{
		var regMonths = '';
		for (i = 1; i <= 12; i++)
		{
			regMonths = regMonths + '|' + BX.message('MON_'+i);
		}

		var expr = new RegExp('([0-9]+|[a-z]+' + regMonths + ')', 'ig');
		var aDate = str.match(expr),
			aFormat = BX.message('FORMAT_DATE').match(/(DD|MI|MMMM|MM|M|YYYY)/ig),
			i, cnt,
			aDateArgs=[], aFormatArgs=[],
			aResult={};

		if (!aDate)
			return null;

		if(aDate.length > aFormat.length)
		{
			aFormat = BX.message('FORMAT_DATETIME').match(/(DD|MI|MMMM|MM|M|YYYY|HH|H|SS|TT|T|GG|G)/ig);
		}

		for(i = 0, cnt = aDate.length; i < cnt; i++)
		{
			if(BX.util.trim(aDate[i]) != '')
			{
				aDateArgs[aDateArgs.length] = aDate[i];
			}
		}

		for(i = 0, cnt = aFormat.length; i < cnt; i++)
		{
			if(BX.util.trim(aFormat[i]) != '')
			{
				aFormatArgs[aFormatArgs.length] = aFormat[i];
			}
		}


		var m = BX.util.array_search('MMMM', aFormatArgs)
		if (m > 0)
		{
			aDateArgs[m] = BX.getNumMonth(aDateArgs[m]);
			aFormatArgs[m] = "MM";
		}
		else
		{
			m = BX.util.array_search('M', aFormatArgs)
			if (m > 0)
			{
				aDateArgs[m] = BX.getNumMonth(aDateArgs[m]);
				aFormatArgs[m] = "MM";
			}
		}

		for(i = 0, cnt = aFormatArgs.length; i < cnt; i++)
		{
			var k = aFormatArgs[i].toUpperCase();
			aResult[k] = k == 'T' || k == 'TT' ? aDateArgs[i] : parseInt(aDateArgs[i], 10);
		}

		if(aResult['DD'] > 0 && aResult['MM'] > 0 && aResult['YYYY'] > 0)
		{
			var d = new Date();
			d.setDate(1);
			d.setFullYear(aResult['YYYY']);
			d.setMonth(aResult['MM']-1);
			d.setDate(aResult['DD']);
			d.setHours(0, 0, 0);

			if(
				(!isNaN(aResult['HH']) || !isNaN(aResult['GG']) || !isNaN(aResult['H']) || !isNaN(aResult['G']))
					&& !isNaN(aResult['MI'])
			)
			{
				if (!isNaN(aResult['H']) || !isNaN(aResult['G']))
				{
					var bPM = (aResult['T']||aResult['TT']||'am').toUpperCase()=='PM';
					aResult['HH'] = parseInt(aResult['H']||aResult['G']||0, 10) + (bPM ? 12 : 0);
				}
				else
				{
					aResult['HH'] = parseInt(aResult['HH']||aResult['GG']||0, 10);
				}

				if (isNaN(aResult['SS']))
					aResult['SS'] = 00;

				d.setHours(aResult['HH'], aResult['MI'], aResult['SS']);
			}

			return d;
		}
	}

	return null;
}

BX.selectUtils =
{
	addNewOption: function(oSelect, opt_value, opt_name, do_sort, check_unique)
	{
		oSelect = BX(oSelect);
		if(oSelect)
		{
			var n = oSelect.length;
			if(check_unique !== false)
			{
				for(var i=0;i<n;i++)
				{
					if(oSelect[i].value==opt_value)
					{
						return;
					}
				}
			}

			var newoption = new Option(opt_name, opt_value, false, false);
			oSelect.options[n]=newoption;
		}

		if(do_sort === true)
		{
			this.sortSelect(select_id);
		}
	},

	deleteOption: function(oSelect, opt_value)
	{
		oSelect = BX(oSelect);
		if(oSelect)
		{
			for(var i=0;i<oSelect.length;i++)
			{
				if(oSelect[i].value==opt_value)
				{
					oSelect.remove(i);
					break;
				}
			}
		}
	},

	deleteSelectedOptions: function(select_id)
	{
		var oSelect = BX(select_id);
		if(oSelect)
		{
			var i=0;
			while(i<oSelect.length)
			{
				if(oSelect[i].selected)
				{
					oSelect[i].selected=false;
					oSelect.remove(i);
				}
				else
				{
					i++;
				}
			}
		}
	},

	deleteAllOptions: function(oSelect)
	{
		oSelect = BX(oSelect);
		if(oSelect)
		{
			for(var i=oSelect.length-1; i>=0; i--)
			{
				oSelect.remove(i);
			}
		}
	},

	optionCompare: function(record1, record2)
	{
		var value1 = record1.optText.toLowerCase();
		var value2 = record2.optText.toLowerCase();
		if (value1 > value2) return(1);
		if (value1 < value2) return(-1);
		return(0);
	},

	sortSelect: function(oSelect)
	{
		oSelect = BX(select_id);
		if(oSelect)
		{
			var myOptions = [];
			var n = oSelect.options.length;
			for (var i=0;i<n;i++)
			{
				myOptions[i] = {
					optText:oSelect[i].text,
					optValue:oSelect[i].value
				};
			}
			myOptions.sort(this.optionCompare);
			oSelect.length=0;
			n = myOptions.length;
			for(var i=0;i<n;i++)
			{
				var newoption = new Option(myOptions[i].optText, myOptions[i].optValue, false, false);
				oSelect[i]=newoption;
			}
		}
	},

	selectAllOptions: function(oSelect)
	{
		oSelect = BX(select_id);
		if(oSelect)
		{
			var n = oSelect.length;
			for(var i=0;i<n;i++)
			{
				oSelect[i].selected=true;
			}
		}
	},

	selectOption: function(oSelect, opt_value)
	{
		oSelect = BX(select_id);
		if(oSelect)
		{
			var n = oSelect.length;
			for(var i=0;i<n;i++)
			{
				oSelect[i].selected = (oSelect[i].value == opt_value);
			}
		}
	},

	addSelectedOptions: function(oSelect, to_select_id, check_unique, do_sort)
	{
		oSelect = BX(oSelect);
		if(!oSelect)
			return;
		var n = oSelect.length;
		for(var i=0; i<n; i++)
			if(oSelect[i].selected)
				this.addNewOption(to_select_id, oSelect[i].value, oSelect[i].text, do_sort, check_unique);
	},

	moveOptionsUp: function(oSelect)
	{
		oSelect = BX(oSelect)
		if(!oSelect)
			return;
		var n = oSelect.length;
		for(var i=0; i<n; i++)
		{
			if(oSelect[i].selected && i>0 && oSelect[i-1].selected == false)
			{
				var option1 = new Option(oSelect[i].text, oSelect[i].value);
				var option2 = new Option(oSelect[i-1].text, oSelect[i-1].value);
				oSelect[i] = option2;
				oSelect[i].selected = false;
				oSelect[i-1] = option1;
				oSelect[i-1].selected = true;
			}
		}
	},

	moveOptionsDown: function(oSelect)
	{
		oSelect = BX(oSelect);
		if(!oSelect)
			return;
		var n = oSelect.length;
		for(var i=n-1; i>=0; i--)
		{
			if(oSelect[i].selected && i<n-1 && oSelect[i+1].selected == false)
			{
				var option1 = new Option(oSelect[i].text, oSelect[i].value);
				var option2 = new Option(oSelect[i+1].text, oSelect[i+1].value);
				oSelect[i] = option2;
				oSelect[i].selected = false;
				oSelect[i+1] = option1;
				oSelect[i+1].selected = true;
			}
		}
	}
}



/******* HINT ***************/
// if function has 2 params - the 2nd one is hint html. otherwise hint_html is third and hint_title - 2nd;
// '<div onmouseover="BX.hint(this, 'This is &lt;b&gt;Hint&lt;/b&gt;')"'>;
// BX.hint(el, 'This is <b>Hint</b>') - this won't work, use constructor
BX.hint = function(el, hint_title, hint_html, hint_id)
{
	if (null == hint_html)
	{
		hint_html = hint_title;
		hint_title = '';
	}

	if (null == el.BXHINT)
	{
		el.BXHINT = new BX.CHint({
			parent: el, hint: hint_html, title: hint_title, id: hint_id
		});
		el.BXHINT.Show();
	}
}

BX.hint_replace = function(el, hint_title, hint_html)
{
	if (null == hint_html)
	{
		hint_html = hint_title;
		hint_title = '';
	}

	if (!el || !el.parentNode || !hint_html)
			return null;

	var obHint = new BX.CHint({
		hint: hint_html,
		title: hint_title
	});

	obHint.CreateParent();

	el.parentNode.insertBefore(obHint.PARENT, el);
	el.parentNode.removeChild(el);

	obHint.PARENT.style.marginLeft = '5px';

	return el;
}

BX.CHint = function(params)
{
	this.PARENT = BX(params.parent);

	this.HINT = params.hint;
	this.HINT_TITLE = params.title;

	this.PARAMS = {}
	for (var i in this.defaultSettings)
	{
		if (null == params[i])
			this.PARAMS[i] = this.defaultSettings[i];
		else
			this.PARAMS[i] = params[i];
	}

	if (null != params.id)
		this.ID = params.id;

	this.timer = null;
	this.bInited = false;
	this.msover = true;

	if (this.PARAMS.showOnce)
	{
		this.__show();
		this.msover = false;
		this.timer = setTimeout(BX.proxy(this.__hide, this), this.PARAMS.hide_timeout);
	}
	else if (this.PARENT)
	{
		BX.bind(this.PARENT, 'mouseover', BX.proxy(this.Show, this));
		BX.bind(this.PARENT, 'mouseout', BX.proxy(this.Hide, this));
	}

	BX.addCustomEvent('onMenuOpen', BX.delegate(this.disable, this));
	BX.addCustomEvent('onMenuClose', BX.delegate(this.enable, this));
}

BX.CHint.prototype.defaultSettings = {
	show_timeout: 1000,
	hide_timeout: 500,
	dx: 2,
	showOnce: false,
	preventHide: true,
	min_width: 250
}

BX.CHint.prototype.CreateParent = function(element, params)
{
	if (this.PARENT)
	{
		BX.unbind(this.PARENT, 'mouseover', BX.proxy(this.Show, this));
		BX.unbind(this.PARENT, 'mouseout', BX.proxy(this.Hide, this));
	}

	if (!params) params = {}
	var type = 'icon';

	if (params.type && (params.type == "link" || params.type == "icon"))
		type = params.type;

	if (element)
		type = "element";

	if (type == "icon")
	{
		element = BX.create('IMG', {
			props: {
				src: params.iconSrc
					? params.iconSrc
					: "/bitrix/js/main/core/images/hint.gif"
			}
		});
	}
	else if (type == "link")
	{
		element = BX.create("A", {
			props: {href: 'javascript:void(0)'},
			html: '[?]'
		});
	}

	this.PARENT = element;

	BX.bind(this.PARENT, 'mouseover', BX.proxy(this.Show, this));
	BX.bind(this.PARENT, 'mouseout', BX.proxy(this.Hide, this));

	return this.PARENT;
}

BX.CHint.prototype.Show = function()
{
	this.msover = true;

	if (null != this.timer)
		clearTimeout(this.timer);

	this.timer = setTimeout(BX.proxy(this.__show, this), this.PARAMS.show_timeout);
}

BX.CHint.prototype.Hide = function()
{
	this.msover = false;

	if (null != this.timer)
		clearTimeout(this.timer);

	this.timer = setTimeout(BX.proxy(this.__hide, this), this.PARAMS.hide_timeout);
}

BX.CHint.prototype.__show = function()
{
	if (!this.msover || this.disabled) return;
	if (!this.bInited) this.Init();

	if (this.prepareAdjustPos())
	{
		this.DIV.style.display = 'block';
		this.adjustPos();

		BX.bind(window, 'scroll', BX.proxy(this.__onscroll, this));

		if (this.PARAMS.showOnce)
		{
			this.timer = setTimeout(BX.proxy(this.__hide, this), this.PARAMS.hide_timeout);
		}
	}
}

BX.CHint.prototype.__onscroll = function()
{
	if (!BX.admin || !BX.admin.panel || !BX.admin.panel.isFixed()) return;

	if (this.scrollTimer) clearTimeout(this.scrollTimer);

	this.DIV.style.display = 'none';
	this.scrollTimer = setTimeout(BX.proxy(this.Reopen, this), this.PARAMS.show_timeout);
}

BX.CHint.prototype.Reopen = function()
{
	if (null != this.timer) clearTimeout(this.timer);
	this.timer = setTimeout(BX.proxy(this.__show, this), 50);
}

BX.CHint.prototype.__hide = function()
{
	if (this.msover) return;
	if (!this.bInited) return;

	BX.unbind(window, 'scroll', BX.proxy(this.Reopen, this));

	if (this.PARAMS.showOnce)
	{
		this.Destroy();
	}
	else
	{
		this.DIV.style.display = 'none';
	}
}

BX.CHint.prototype.__hide_immediately = function()
{
	this.msover = false;
	this.__hide();
}

BX.CHint.prototype.Init = function()
{
	this.DIV = document.body.appendChild(BX.create('DIV', {
		props: {className: 'bx-panel-tooltip'},
		style: {display: 'none'},
		children: [
			BX.create('DIV', {
				props: {className: 'bx-panel-tooltip-top-border'},
				html: '<div class="bx-panel-tooltip-corner bx-panel-tooltip-left-corner"></div><div class="bx-panel-tooltip-border"></div><div class="bx-panel-tooltip-corner bx-panel-tooltip-right-corner"></div>'
			}),
			(this.CONTENT = BX.create('DIV', {
				props: {className: 'bx-panel-tooltip-content'},
				children: [
					BX.create('DIV', {
						props: {className: 'bx-panel-tooltip-underlay'},
						children: [
							BX.create('DIV', {props: {className: 'bx-panel-tooltip-underlay-bg'}})
						]
					})
				]
			})),

			BX.create('DIV', {
				props: {className: 'bx-panel-tooltip-bottom-border'},
				html: '<div class="bx-panel-tooltip-corner bx-panel-tooltip-left-corner"></div><div class="bx-panel-tooltip-border"></div><div class="bx-panel-tooltip-corner bx-panel-tooltip-right-corner"></div>'
			})
		]
	}));

	if (this.ID)
	{
		this.CONTENT.insertBefore(BX.create('A', {
			attrs: {href: 'javascript:void(0)'},
			props: {className: 'bx-panel-tooltip-close'},
			events: {click: BX.delegate(this.Close, this)}
		}), this.CONTENT.firstChild)
	}

	if (this.HINT_TITLE)
	{
		this.CONTENT.appendChild(
			BX.create('DIV', {
				props: {className: 'bx-panel-tooltip-title'},
				text: this.HINT_TITLE
			})
		)
	}

	if (this.HINT)
	{
		this.CONTENT_TEXT = this.CONTENT.appendChild(BX.create('DIV', {props: {className: 'bx-panel-tooltip-text'}})).appendChild(BX.create('SPAN', {html: this.HINT}));
	}

	if (this.PARAMS.preventHide)
	{
		BX.bind(this.DIV, 'mouseout', BX.proxy(this.Hide, this));
		BX.bind(this.DIV, 'mouseover', BX.proxy(this.Show, this));
	}

	this.bInited = true;
}

BX.CHint.prototype.setContent = function(content)
{
	this.HINT = content;

	if (this.CONTENT_TEXT)
		this.CONTENT_TEXT.innerHTML = this.HINT;
	else
		this.CONTENT_TEXT = this.CONTENT.appendChild(BX.create('DIV', {props: {className: 'bx-panel-tooltip-text'}})).appendChild(BX.create('SPAN', {html: this.HINT}));
}

BX.CHint.prototype.prepareAdjustPos = function()
{
	this._wnd = {scrollPos: BX.GetWindowScrollPos(),scrollSize:BX.GetWindowScrollSize()};
	return BX.style(this.PARENT, 'display') != 'none';
}

BX.CHint.prototype.getAdjustPos = function()
{
	var res = {}, pos = BX.pos(this.PARENT);

	res.top = pos.bottom + this.PARAMS.dx;

	if (BX.admin && BX.admin.panel.DIV)
	{
		var min_top = BX.admin.panel.DIV.offsetHeight + this.PARAMS.dx;

		if (BX.admin.panel.isFixed())
		{
			min_top += this._wnd.scrollPos.scrollTop;
		}
	}

	if (res.top < min_top)
		res.top = min_top;
	else
	{
		if (res.top + this.DIV.offsetHeight > this._wnd.scrollSize.scrollHeight)
			res.top = pos.top - this.PARAMS.dx - this.DIV.offsetHeight;
	}

	res.left = pos.left;
	if (pos.left < this.PARAMS.dx) pos.left = this.PARAMS.dx;
	else
	{
		floatWidth = this.DIV.offsetWidth;

		var max_left = this._wnd.scrollSize.scrollWidth - floatWidth - this.PARAMS.dx;

		if (res.left > max_left)
			res.left = max_left;
	}

	return res;
}

BX.CHint.prototype.adjustWidth = function()
{
	if (this.bWidthAdjusted) return;

	var w = this.DIV.offsetWidth, h = this.DIV.offsetHeight;

	if (w > this.PARAMS.min_width)
		w = Math.round(Math.sqrt(1.618*w*h));

	if (w < this.PARAMS.min_width)
		w = this.PARAMS.min_width;

	this.DIV.style.width = w + "px";

	if (this._adjustWidthInt)
		clearInterval(this._adjustWidthInt);
	this._adjustWidthInt = setInterval(BX.delegate(this._adjustWidthInterval, this), 5);

	this.bWidthAdjusted = true;
}

BX.CHint.prototype._adjustWidthInterval = function()
{
	if (!this.DIV || this.DIV.style.display == 'none')
		clearInterval(this._adjustWidthInt);

	var
		dW = 20,
		maxWidth = 1500,
		w = this.DIV.offsetWidth,
		w1 = this.CONTENT_TEXT.offsetWidth;

	if (w > 0 && w1 > 0 && w - w1 < dW && w < maxWidth)
	{
		this.DIV.style.width = (w + dW) + "px";
		return;
	}

	clearInterval(this._adjustWidthInt);
}

BX.CHint.prototype.adjustPos = function()
{
	this.adjustWidth();

	var pos = this.getAdjustPos();

	this.DIV.style.top = pos.top + 'px';
	this.DIV.style.left = pos.left + 'px';
}

BX.CHint.prototype.Close = function()
{
	if (this.ID && BX.WindowManager)
		BX.WindowManager.saveWindowOptions(this.ID, {display: 'off'});
	this.__hide_immediately();
	this.Destroy();
}

BX.CHint.prototype.Destroy = function()
{
	if (this.PARENT)
	{
		BX.unbind(this.PARENT, 'mouseover', BX.proxy(this.Show, this));
		BX.unbind(this.PARENT, 'mouseout', BX.proxy(this.Hide, this));
	}

	if (this.DIV)
	{
		BX.unbind(this.DIV, 'mouseover', BX.proxy(this.Show, this));
		BX.unbind(this.DIV, 'mouseout', BX.proxy(this.Hide, this));

		BX.cleanNode(this.DIV, true);
	}
}

BX.CHint.prototype.enable = function(){this.disabled = false;}
BX.CHint.prototype.disable = function(){this.__hide_immediately(); this.disabled = true;}

/* ready */
if (document.addEventListener)
{
	__readyHandler = function()
	{
		document.removeEventListener("DOMContentLoaded", __readyHandler, false);
		runReady();
	}
}
else if (document.attachEvent)
{
	__readyHandler = function()
	{
		if (document.readyState === "complete")
		{
			document.detachEvent("onreadystatechange", __readyHandler);
			runReady();
		}
	}
}

function bindReady()
{
	if (!readyBound)
	{
		readyBound = true;

		if (document.readyState === "complete")
		{
			return runReady();
		}

		if (document.addEventListener)
		{
			document.addEventListener("DOMContentLoaded", __readyHandler, false);
			window.addEventListener("load", runReady, false);
		}
		else if (document.attachEvent) // IE
		{
			document.attachEvent("onreadystatechange", __readyHandler);
			window.attachEvent("onload", runReady);

			var toplevel = false;
			try {toplevel = (window.frameElement == null);} catch(e) {}

			if (document.documentElement.doScroll && toplevel)
				doScrollCheck();
		}
	}

	return null;
}


function runReady()
{
	if (!BX.isReady)
	{
		if (!document.body)
			return setTimeout(runReady, 15);

		BX.isReady = true;


		if (readyList && readyList.length > 0)
		{
			var fn, i = 0;
			while (readyList && (fn = readyList[i++]))
			{
				try{
					fn.call(document);
				}
				catch(e){
					BX.debug('BX.ready error: ', e);
				}
			}

			readyList = null;
		}
		// TODO: check ready handlers binded some other way;
	}
	return null;
}

// hack for IE
function doScrollCheck()
{
	if (BX.isReady)
		return;

	try {document.documentElement.doScroll("left");} catch( error ) {setTimeout(doScrollCheck, 1); return;}

	runReady();
}
/* \ready */

function _adjustWait()
{
	if (!this.bxmsg) return;

	var arContainerPos = BX.pos(this),
		div_top = arContainerPos.top;

	if (div_top < BX.GetDocElement().scrollTop)
		div_top = BX.GetDocElement().scrollTop + 5;

	this.bxmsg.style.top = (div_top + 5) + 'px';

	if (this == BX.GetDocElement())
	{
		this.bxmsg.style.right = '5px';
	}
	else
	{
		this.bxmsg.style.left = (arContainerPos.right - this.bxmsg.offsetWidth - 5) + 'px';
	}
}

function _checkDisplay(ob, displayType)
{
	if (typeof displayType != 'undefined')
		ob.BXDISPLAY = displayType;

	var d = ob.style.display || BX.style(ob, 'display');
	if (d != 'none')
	{
		ob.BXDISPLAY = ob.BXDISPLAY || d;
		return true;
	}
	else
	{
		ob.BXDISPLAY = ob.BXDISPLAY || 'block';
		return false;
	}
}

function _processTpl(tplNode, cb, bKillTpl)
{
	if (tplNode)
	{
		if (bKillTpl)
			tplNode.parentNode.removeChild(tplNode);

		var res = {}, nodes = BX.findChildren(tplNode, {attribute: 'data-role'}, true);

		for (var i = 0, l = nodes.length; i < l; i++)
		{
			res[nodes[i].getAttribute('data-role')] = nodes[i];
		}

		cb.apply(tplNode, [res]);
	}
}

function _checkNode(obj, params)
{
	params = params || {};

	if (BX.type.isFunction(params))
		return params.call(window, obj);

	if (!params.allowTextNodes && !BX.type.isElementNode(obj))
		return false;
	var i,j,len;
	for (i in params)
	{
		switch(i)
		{
			case 'tag':
			case 'tagName':
				if (BX.type.isString(params[i]))
				{
					if (obj.tagName.toUpperCase() != params[i].toUpperCase())
						return false;
				}
				else if (params[i] instanceof RegExp)
				{
					if (!params[i].test(obj.tagName))
						return false;
				}
			break;

			case 'class':
			case 'className':
				if (BX.type.isString(params[i]))
				{
					if (!BX.hasClass(obj, params[i]))
						return false;
				}
				else if (params[i] instanceof RegExp)
				{
					if (!BX.type.isString(obj.className) || !params[i].test(obj.className))
						return false;
				}
			break;

			case 'attr':
			case 'attribute':
				if (BX.type.isString(params[i]))
				{
					if (!obj.getAttribute(params[i]))
						return false;
				}
				else if (BX.type.isArray(params[i]))
				{
					for (j = 0, len = params[i].length; j < len; j++)
					{
						if (params[i] && !obj.getAttribute(params[i]))
							return false;
					}
				}
				else
				{
					for (j in params[i])
					{
						var q = obj.getAttribute(j);
						if (params[i][j] instanceof RegExp)
						{
							if (!BX.type.isString(q) || !params[i][j].test(q))
								return false;
						}
						else
						{
							if (q != '' + params[i][j])
								return false;
						}
					}
				}
			break;

			case 'property':
				if (BX.type.isString(params[i]))
				{
					if (!obj[params[i]])
						return false;
				}
				else if (BX.type.isArray(params[i]))
				{
					for (j = 0, len = params[i].length; j < len; j++)
					{
						if (params[i] && !obj[params[i]])
							return false;
					}
				}
				else
				{
					for (j in params[i])
					{
						if (BX.type.isString(params[i][j]))
						{
							if (obj[j] != params[i][j])
								return false;
						}
						else if (params[i][j] instanceof RegExp)
						{
							if (!BX.type.isString(obj[j]) || !params[i][j].test(obj[j]))
								return false;
						}
					}
				}
			break;

			case 'callback':
				return params[i](obj);
			break;
		}
	}

	return true;
}

function _checkCssList()
{
	var linksCol = document.getElementsByTagName('LINK'), links = [];

	if(!!linksCol && linksCol.length > 0)
	{
		for(var i=0;i<linksCol.length;i++)
		{
			links.push(linksCol[i]);
		}
	}

	if(!!window.arKernelCSS && BX.type.isArray(arKernelCSS))
	{
		links = BX.util.array_merge(links, arKernelCSS);
	}

	for (var i = 0; i < links.length; i++)
	{
		var href = BX.type.isDomNode(links[i]) ? links[i].getAttribute('href') : links[i];
		if (!!href && href.replace)
		{
			cssList.push(href
				.replace(/\.css(\?\d*)/, '.css')
				.replace(/^(http[s]*:)*\/\/[^\/]+/i, '')
			);
		}
	}
	_checkCssList = BX.DoNothing;
}

/********* Check for currently loaded core scripts ***********/
function _isScriptLoaded(fileSrc)
{
	return (
		BX.util.in_array(fileSrc, arKernelJS)
		||fileSrc.indexOf('/core/core.js') > 0
		||fileSrc.indexOf('/core_access.js') >= 0 && !!BX.Access
		||fileSrc.indexOf('/core_admin.js') >= 0 && !!BX.admin
		||fileSrc.indexOf('/core_admin_interface.js') >= 0 && !!BX.adminPanel
		||fileSrc.indexOf('/core_admin_login.js') >= 0 && !!BX.adminLogin
		||fileSrc.indexOf('/core_ajax.js') >= 0 && !!BX.ajax
		||fileSrc.indexOf('/core_autosave.js') >= 0 && !!BX.CAutoSave
		||fileSrc.indexOf('/core_date.js') >= 0 && !!BX.date
		||fileSrc.indexOf('/core_finder.js') >= 0 && !!BX.Finder
		||fileSrc.indexOf('/core_fx.js') >= 0 && !!BX.easing
		||fileSrc.indexOf('/core_image.js') >= 0 && !!BX.CImageView
		||fileSrc.indexOf('/core_ls.js') >= 0 && !!BX.localStorage
		||fileSrc.indexOf('/core_popup.js') >= 0 && !!BX.PopupWindowManager
		||fileSrc.indexOf('/core_tags.js') >= 0 && !!BX.TagsWindowArea
		||fileSrc.indexOf('/core_timer.js') >= 0 && !!BX.timer
		||fileSrc.indexOf('/core_tooltip.js') >= 0 && !!BX.tooltip
		||fileSrc.indexOf('/core_translit.js') >= 0 && !!BX.translit
		||fileSrc.indexOf('/core_window.js') >= 0 && !!BX.WindowManager
		||fileSrc.indexOf('/jquery-') >= 0 && !!window.jQuery
	);
}

/* garbage collector */
function Trash()
{
	var i,len;

	for (i = 0, len = garbageCollectors.length; i<len; i++)
	{
		try {
			garbageCollectors[i].callback.apply(garbageCollectors[i].context || window);
			delete garbageCollectors[i];
			garbageCollectors[i] = null;
		} catch (e) {}
	}

	try {BX.unbindAll();} catch(e) {}
/*
	for (i = 0, len = proxyList.length; i < len; i++)
	{
		try {
			delete proxyList[i];
			proxyList[i] = null;
		} catch (e) {}
	}
*/
}

if(window.attachEvent) // IE
	window.attachEvent("onunload", Trash);
else if(window.addEventListener) // Gecko / W3C
	window.addEventListener('unload', Trash, false);
else
	window.onunload = Trash;
/* \garbage collector */

// set empty ready handler
BX(BX.DoNothing);
window.BX = BX;
BX.browser.addGlobalClass();
BX.browser.addGlobalFeatures(["boxShadow", "borderRadius", "flexWrap", "boxDirection", "transition", "transform"])
})(window);

/* End */
;
; /* Start:/bitrix/js/main/core/core_ajax.js*/
;(function(window){

if (window.BX.ajax)
	return;

var
	BX = window.BX,

	tempDefaultConfig = {},
	defaultConfig = {
		method: 'GET', // request method: GET|POST
		dataType: 'html', // type of data loading: html|json|script
		timeout: 0, // request timeout in seconds. 0 for browser-default
		async: true, // whether request is asynchronous or not
		processData: true, // any data processing is disabled if false, only callback call
		scriptsRunFirst: false, // whether to run _all_ found scripts before onsuccess call. script tag can have an attribute "bxrunfirst" to turn  this flag on only for itself
		emulateOnload: true,
		start: true, // send request immediately (if false, request can be started manually via XMLHttpRequest object returned)
		cache: true, // whether NOT to add random addition to URL
		preparePost: true, // whether set Content-Type x-www-form-urlencoded in POST
		headers: false, // add additional headers, example: [{'name': 'If-Modified-Since', 'value': 'Wed, 15 Aug 2012 08:59:08 GMT'}, {'name': 'If-None-Match', 'value': '0'}]
		lsTimeout: 30, //local storage data TTL. useless without lsId.
		lsForce: false //wheter to force query instead of using localStorage data. useless without lsId.
/*
other parameters:
	url: url to get/post
	data: data to post
	onsuccess: successful request callback. BX.proxy may be used.
	onfailure: request failure callback. BX.proxy may be used.

	lsId: local storage id - for constantly updating queries which can communicate via localStorage. core_ls.js needed

any of the default parameters can be overridden. defaults can be changed by BX.ajax.Setup() - for all further requests!
*/
	},
	ajax_session = null,
	loadedScripts = {},
	loadedScriptsQueue = [],
	r = {
		'url_utf': /[^\034-\254]+/g,
		'script_self': /\/bitrix\/js\/main\/core\/core(_ajax)*.js$/i,
		'script_self_window': /\/bitrix\/js\/main\/core\/core_window.js$/i,
		'script_self_admin': /\/bitrix\/js\/main\/core\/core_admin.js$/i,
		'script_onload': /window.onload/g
	};

// low-level method
BX.ajax = function(config)
{
	var status, data;

	if (!config || !config.url || !BX.type.isString(config.url))
	{
		return false;
	}

	for (var i in tempDefaultConfig)
		if (typeof (config[i]) == "undefined") config[i] = tempDefaultConfig[i];

	tempDefaultConfig = {};

	for (i in defaultConfig)
		if (typeof (config[i]) == "undefined") config[i] = defaultConfig[i];

	config.method = config.method.toUpperCase();

	if (!BX.localStorage)
		config.lsId = null;

	if (BX.browser.IsIE())
	{
		var result = r.url_utf.exec(config.url);
		if (result)
		{
			do
			{
				config.url = config.url.replace(result, BX.util.urlencode(result));
				result = r.url_utf.exec(config.url);
			} while (result);
		}
	}

	if(config.dataType == 'json')
		config.emulateOnload = false;

	if (!config.cache && config.method == 'GET')
		config.url = BX.ajax._uncache(config.url);

	if (config.method == 'POST' && config.preparePost)
	{
		config.data = BX.ajax.prepareData(config.data);
	}

	var bXHR = true;
	if (config.lsId && !config.lsForce)
	{
		var v = BX.localStorage.get('ajax-' + config.lsId);
		if (v !== null)
		{
			bXHR = false;

			var lsHandler = function(lsData) {
				if (lsData.key == 'ajax-' + config.lsId && lsData.value != 'BXAJAXWAIT')
				{
					var data = lsData.value,
						bRemove = !!lsData.oldValue && data == null;
					if (!bRemove)
						BX.ajax.__run(config, data);
					else if (config.onfailure)
						config.onfailure("timeout");

					BX.removeCustomEvent('onLocalStorageChange', lsHandler);
				}
			};

			if (v == 'BXAJAXWAIT')
			{
				BX.addCustomEvent('onLocalStorageChange', lsHandler);
			}
			else
			{
				setTimeout(function() {lsHandler({key: 'ajax-' + config.lsId, value: v})}, 10);
			}
		}
	}

	if (bXHR)
	{
		config.xhr = BX.ajax.xhr();
		if (!config.xhr) return;

		if (config.lsId)
		{
			BX.localStorage.set('ajax-' + config.lsId, 'BXAJAXWAIT', config.lsTimeout);
		}

		config.xhr.open(config.method, config.url, config.async);
		if (config.method == 'POST' && config.preparePost)
		{
			config.xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		}
		if (typeof(config.headers) == "object")
		{
			for (i = 0; i < config.headers.length; i++)
				config.xhr.setRequestHeader(config.headers[i].name, config.headers[i].value);
		}

		var bRequestCompleted = false;
		var onreadystatechange = config.xhr.onreadystatechange = function(additional)
		{
			if (bRequestCompleted)
				return;

			if (additional === 'timeout')
			{
				if (config.onfailure)
					config.onfailure("timeout");

				BX.onCustomEvent(config.xhr, 'onAjaxFailure', ['timeout', '', config]);

				config.xhr.onreadystatechange = BX.DoNothing;
				config.xhr.abort();

				if (config.async)
				{
					config.xhr = null;
				}
			}
			else
			{
				if (config.xhr.readyState == 4 || additional == 'run')
				{
					status = BX.ajax.xhrSuccess(config.xhr) ? "success" : "error";
					bRequestCompleted = true;
					config.xhr.onreadystatechange = BX.DoNothing;

					// var status = oAjax.arThreads[TID].httpRequest.getResponseHeader('X-Bitrix-Ajax-Status');
					// var bRedirect = (status == 'Redirect');

					if (status == 'success')
					{
						var data = config.xhr.responseText;

						if (config.lsId)
						{
							BX.localStorage.set('ajax-' + config.lsId, data, config.lsTimeout);
						}

						BX.ajax.__run(config, data);
					}
					else if (config.onfailure)
					{
						config.onfailure("status", config.xhr.status);
						BX.onCustomEvent(config.xhr, 'onAjaxFailure', ['status', config.xhr.status, config]);
					}

					if (config.async)
					{
						config.xhr = null;
					}
				}
			}
		};

		if (config.async && config.timeout > 0)
		{
			setTimeout(function() {
				if (config.xhr && !bRequestCompleted)
				{
					onreadystatechange("timeout");
				}
			}, config.timeout * 1000);
		}

		if (config.start)
		{
			config.xhr.send(config.data);

			if (!config.async)
			{
				onreadystatechange('run');
			}
		}

		return config.xhr;
	}
};

BX.ajax.xhr = function()
{
	if (window.XMLHttpRequest)
	{
		try {return new XMLHttpRequest();} catch(e){}
	}
	else if (window.ActiveXObject)
	{
		try { return new ActiveXObject("Msxml2.XMLHTTP.6.0"); }
			catch(e) {}
		try { return new ActiveXObject("Msxml2.XMLHTTP.3.0"); }
			catch(e) {}
		try { return new ActiveXObject("Msxml2.XMLHTTP"); }
			catch(e) {}
		try { return new ActiveXObject("Microsoft.XMLHTTP"); }
			catch(e) {}
		throw new Error("This browser does not support XMLHttpRequest.");
	}

	return null;
};

BX.ajax.__prepareOnload = function(scripts)
{
	if (scripts.length > 0)
	{
		BX.ajax['onload_' + ajax_session] = null;

		for (var i=0,len=scripts.length;i<len;i++)
		{
			if (scripts[i].isInternal)
			{
				scripts[i].JS = scripts[i].JS.replace(r.script_onload, 'BX.ajax.onload_' + ajax_session);
			}
		}
	}

	BX.CaptureEventsGet();
	BX.CaptureEvents(window, 'load');
};

BX.ajax.__runOnload = function()
{
	if (null != BX.ajax['onload_' + ajax_session])
	{
		BX.ajax['onload_' + ajax_session].apply(window);
		BX.ajax['onload_' + ajax_session] = null;
	}

	var h = BX.CaptureEventsGet();

	if (h)
	{
		for (var i=0; i<h.length; i++)
			h[i].apply(window);
	}
};

BX.ajax.__run = function(config, data)
{
	if (!config.processData)
	{
		if (config.onsuccess)
		{
			config.onsuccess(data);
		}

		BX.onCustomEvent(config.xhr, 'onAjaxSuccess', [data, config]);
	}
	else
	{
		data = BX.ajax.processRequestData(data, config);
	}
};


BX.ajax._onParseJSONFailure = function(data)
{
	this.jsonFailure = true;
	this.jsonResponse = data;
	this.jsonProactive = /^\[WAF\]/.test(data);
};

BX.ajax.processRequestData = function(data, config)
{
	var result, scripts = [], styles = [];
	switch (config.dataType.toUpperCase())
	{
		case 'JSON':
			BX.addCustomEvent(config.xhr, 'onParseJSONFailure', BX.proxy(BX.ajax._onParseJSONFailure, config));
			result = BX.parseJSON(data, config.xhr);
			BX.removeCustomEvent(config.xhr, 'onParseJSONFailure', BX.proxy(BX.ajax._onParseJSONFailure, config));

		break;
		case 'SCRIPT':
			scripts.push({"isInternal": true, "JS": data, bRunFirst: config.scriptsRunFirst});
			config.processScriptsConsecutive = true;
			result = data;
		break;

		default: // HTML
			var ob = BX.processHTML(data, config.scriptsRunFirst);
			result = ob.HTML; scripts = ob.SCRIPT; styles = ob.STYLE;
		break;
	}

	var bSessionCreated = false;
	if (null == ajax_session)
	{
		ajax_session = parseInt(Math.random() * 1000000);
		bSessionCreated = true;
	}

	if (styles.length > 0)
		BX.loadCSS(styles);

	if (config.emulateOnload)
			BX.ajax.__prepareOnload(scripts);

	var cb = BX.DoNothing;
	if(config.emulateOnload || bSessionCreated)
	{
		cb = BX.defer(function()
		{
			if (config.emulateOnload)
				BX.ajax.__runOnload();
			if (bSessionCreated)
				ajax_session = null;
			BX.onCustomEvent(config.xhr, 'onAjaxSuccessFinish', [config]);
		});
	}

	try
	{
		if (!!config.jsonFailure)
		{
			throw {type: 'json_failure', data: config.jsonResponse, bProactive: config.jsonProactive};
		}

		config.scripts = scripts;

		BX.ajax.processScripts(config.scripts, true);


		if (config.onsuccess)
		{
			config.onsuccess(result);
		}

		BX.onCustomEvent(config.xhr, 'onAjaxSuccess', [result, config]);

		if(!config.processScriptsConsecutive)
		{
			BX.ajax.processScripts(config.scripts, false, cb);
		}
		else
		{
			BX.ajax.processScriptsConsecutive(config.scripts, false);
			cb();
		}
	}
	catch (e)
	{
		if (config.onfailure)
			config.onfailure("processing", e);
		BX.onCustomEvent(config.xhr, 'onAjaxFailure', ['processing', e, config]);
	}
};

BX.ajax.processScripts = function(scripts, bRunFirst, cb)
{
	var scriptsExt = [], scriptsInt = '';

	cb=cb||BX.DoNothing;

	for (var i = 0, length = scripts.length; i < length; i++)
	{
		if (typeof bRunFirst != 'undefined' && bRunFirst != !!scripts[i].bRunFirst)
			continue;

		if (scripts[i].isInternal)
			scriptsInt += ';' + scripts[i].JS
		else
			scriptsExt.push(scripts[i].JS);
	}

	scriptsExt = BX.util.array_unique(scriptsExt);

	var l=l1=scriptsExt.length,
		f=scriptsInt.length>0?function(){BX.evalGlobal(scriptsInt)}:BX.DoNothing;

	if(l>0)
	{
		var c=function(){if(--l1<=0){f();cb();f=BX.DoNothing;}};
		for(i=0; i<l;i++)
		{
			BX.loadScript(scriptsExt[i], c);
		}
	}
	else
	{
		//f();BX.defer(cb)();
		f();cb();
	}
};

BX.ajax.processScriptsConsecutive = function(scripts, bRunFirst)
{
	for (var i = 0, length = scripts.length; i < length; i++)
	{
		if (null != bRunFirst && bRunFirst != !!scripts[i].bRunFirst)
			continue;

		if (scripts[i].isInternal)
		{
			BX.evalGlobal(scripts[i].JS);
		}
		else
		{
			BX.ajax.loadScriptAjax([scripts[i].JS]);
		}
	}
};

// TODO: extend this function to use with any data objects or forms
BX.ajax.prepareData = function(arData, prefix)
{
	var data = '';
	if (BX.type.isString(arData))
		data = arData;
	else if (null != arData)
	{
		for(var i in arData)
		{
			if (!arData.hasOwnProperty(i))
				continue;
			if (data.length > 0) data += '&';
			var name = BX.util.urlencode(i);
			if(prefix)
				name = prefix + '[' + name + ']';
			if(typeof arData[i] == 'object')
				data += BX.ajax.prepareData(arData[i], name);
			else
				data += name + '=' + BX.util.urlencode(arData[i]);
		}
	}
	return data;
};

BX.ajax.xhrSuccess = function(xhr)
{
	return (xhr.status >= 200 && xhr.status < 300) || xhr.status === 304 || xhr.status === 1223 || xhr.status === 0;
};

BX.ajax.Setup = function(config, bTemp)
{
	bTemp = !!bTemp;

	for (var i in config)
	{
		if (bTemp)
			tempDefaultConfig[i] = config[i];
		else
			defaultConfig[i] = config[i];
	}
};

BX.ajax.replaceLocalStorageValue = function(lsId, data, ttl)
{
	if (!!BX.localStorage)
		BX.localStorage.set('ajax-' + lsId, data, ttl);
};


BX.ajax._uncache = function(url)
{
	return url + ((url.indexOf('?') !== -1 ? "&" : "?") + '_=' + (new Date).getTime());
};

/* simple interface */
BX.ajax.get = function(url, data, callback)
{
	if (BX.type.isFunction(data))
	{
		callback = data;
		data = '';
	}

	data = BX.ajax.prepareData(data);

	if (data)
	{
		url += (url.indexOf('?') !== -1 ? "&" : "?") + data;
		data = '';
	}

	return BX.ajax({
		'method': 'GET',
		'dataType': 'html',
		'url': url,
		'data':  '',
		'onsuccess': callback
	});
};

BX.ajax.getCaptcha = function(callback)
{
	return BX.ajax.loadJSON('/bitrix/tools/ajax_captcha.php', callback);
};

BX.ajax.insertToNode = function(url, node)
{
	if (node = BX(node))
	{
		BX.onCustomEvent('onAjaxInsertToNode', [{url: url, node: node}]);

		var show = null;
		if (!tempDefaultConfig.denyShowWait)
		{
			show = BX.showWait(node);
			delete tempDefaultConfig.denyShowWait;
		}

		return BX.ajax.get(url, function(data) {
			node.innerHTML = data;
			BX.closeWait(node, show);
		});
	}
};

BX.ajax.post = function(url, data, callback)
{
	data = BX.ajax.prepareData(data);

	return BX.ajax({
		'method': 'POST',
		'dataType': 'html',
		'url': url,
		'data':  data,
		'onsuccess': callback
	});
};

/* load and execute external file script with onload emulation */
BX.ajax.loadScriptAjax = function(script_src, callback, bPreload)
{
	if (BX.type.isArray(script_src))
	{
		for (var i=0,len=script_src.length;i<len;i++)
		{
			BX.ajax.loadScriptAjax(script_src[i], callback, bPreload);
		}
	}
	else
	{
		var script_src_test = script_src.replace(/\.js\?.*/, '.js');

		if (r.script_self.test(script_src_test)) return;
		if (r.script_self_window.test(script_src_test) && BX.CWindow) return;
		if (r.script_self_admin.test(script_src_test) && BX.admin) return;

		if (typeof loadedScripts[script_src_test] == 'undefined')
		{
			if (!!bPreload)
			{
				loadedScripts[script_src_test] = '';
				return BX.loadScript(script_src);
			}
			else
			{
				return BX.ajax({
					url: script_src,
					method: 'GET',
					dataType: 'script',
					processData: true,
					emulateOnload: false,
					scriptsRunFirst: true,
					async: false,
					start: true,
					onsuccess: function(result) {
						loadedScripts[script_src_test] = result;
						if (callback)
							callback(result);
					}
				});
			}
		}
		else if (callback)
		{
			callback(loadedScripts[script_src_test]);
		}
	}
};

/* non-xhr loadings */
BX.ajax.loadJSON = function(url, data, callback, callback_failure)
{
	if (BX.type.isFunction(data))
	{
		callback_failure = callback;
		callback = data;
		data = '';
	}

	data = BX.ajax.prepareData(data);

	if (data)
	{
		url += (url.indexOf('?') !== -1 ? "&" : "?") + data;
		data = '';
	}

	return BX.ajax({
		'method': 'GET',
		'dataType': 'json',
		'url': url,
		'onsuccess': callback,
		'onfailure': callback_failure
	});
};

/*
arObs = [{
	url: url,
	type: html|script|json|css,
	callback: function
}]
*/
BX.ajax.load = function(arObs, callback)
{
	if (!BX.type.isArray(arObs))
		arObs = [arObs];

	var cnt = 0;

	if (!BX.type.isFunction(callback))
		callback = BX.DoNothing;

	var handler = function(data)
		{
			if (BX.type.isFunction(this.callback))
				this.callback(data);

			if (++cnt >= len)
				callback();
		};

	for (var i = 0, len = arObs.length; i<len; i++)
	{
		switch(arObs.type.toUpperCase())
		{
			case 'SCRIPT':
				BX.loadScript([arObs[i].url], jsBX.proxy(handler, arObs[i]));
			break;
			case 'CSS':
				BX.loadCSS([arObs[i].url]);

				if (++cnt >= len)
					callback();
			break;
			case 'JSON':
				BX.ajax.loadJSON(arObs.url, jsBX.proxy(handler, arObs[i]));
			break;

			default:
				BX.ajax.get(arObs.url, '', jsBX.proxy(handler, arObs[i]));
			break;
		}
	}
};

/* ajax form sending */
BX.ajax.submit = function(obForm, callback)
{
	if (!obForm.target)
	{
		if (null == obForm.BXFormTarget)
		{
			var frame_name = 'formTarget_' + Math.random();
			obForm.BXFormTarget = document.body.appendChild(BX.create('IFRAME', {
				props: {
					name: frame_name,
					id: frame_name,
					src: 'javascript:void(0)'
				},
				style: {
					display: 'none'
				}
			}));
		}

		obForm.target = obForm.BXFormTarget.name;
	}

	obForm.BXFormCallback = callback;
	BX.bind(obForm.BXFormTarget, 'load', BX.proxy(BX.ajax._submit_callback, obForm));

	BX.submit(obForm);

	return false;
};

BX.ajax.submitComponentForm = function(obForm, container, bWait)
{
	if (!obForm.target)
	{
		if (null == obForm.BXFormTarget)
		{
			var frame_name = 'formTarget_' + Math.random();
			obForm.BXFormTarget = document.body.appendChild(BX.create('IFRAME', {
				props: {
					name: frame_name,
					id: frame_name,
					src: 'javascript:void(0)'
				},
				style: {
					display: 'none'
				}
			}));
		}

		obForm.target = obForm.BXFormTarget.name;
	}

	if (!!bWait)
		var w = BX.showWait(container);

	obForm.BXFormCallback = function(d) {
		if (!!bWait)
			BX.closeWait(w);

		BX(container).innerHTML = d;
		if (window.bxcompajaxframeonload){
			setTimeout("window.bxcompajaxframeonload();window.bxcompajaxframeonload=null;", 10);
		}
		BX.onCustomEvent('onAjaxSuccess', []);
	};

	BX.bind(obForm.BXFormTarget, 'load', BX.proxy(BX.ajax._submit_callback, obForm));

	return true;
};

// func will be executed in form context
BX.ajax._submit_callback = function()
{
	//opera and IE8 triggers onload event even on empty iframe
	try
	{
		if(this.BXFormTarget.contentWindow.location.href.indexOf('http') != 0)
			return;
	} catch (e) {
		return;
	}

	if (this.BXFormCallback)
		this.BXFormCallback.apply(this, [this.BXFormTarget.contentWindow.document.body.innerHTML]);

	BX.unbindAll(this.BXFormTarget);
};

// TODO: currently in window extension. move it here.
BX.ajax.submitAjax = function(obForm, callback)
{

};

BX.ajax.UpdatePageData = function (arData)
{
	if (arData.TITLE)
		BX.ajax.UpdatePageTitle(arData.TITLE);
	if (arData.NAV_CHAIN)
		BX.ajax.UpdatePageNavChain(arData.NAV_CHAIN);
	if (arData.CSS && arData.CSS.length > 0)
		BX.loadCSS(arData.CSS);
	if (arData.SCRIPTS && arData.SCRIPTS.length > 0)
	{
		var f = function(result,config){
			if(!!config && BX.type.isArray(config.scripts))
			{
				for(var i=0,l=arData.SCRIPTS.length;i<l;i++)
				{
					config.scripts.push({isInternal:false,JS:arData.SCRIPTS[i]});
				}
			}
			else
			{
				BX.loadScript(arData.SCRIPTS);
			}

			BX.removeCustomEvent('onAjaxSuccess',f);
		};
		BX.addCustomEvent('onAjaxSuccess',f);
	}
};

BX.ajax.UpdatePageTitle = function(title)
{
	var obTitle = BX('pagetitle');
	if (obTitle)
	{
		obTitle.removeChild(obTitle.firstChild);
		if (!obTitle.firstChild)
			obTitle.appendChild(document.createTextNode(title));
		else
			obTitle.insertBefore(document.createTextNode(title), obTitle.firstChild);
	}

	document.title = title;
};

BX.ajax.UpdatePageNavChain = function(nav_chain)
{
	var obNavChain = BX('navigation');
	if (obNavChain)
	{
		obNavChain.innerHTML = nav_chain;
	}
};

/* user options handling */
BX.userOptions = {
	options: null,
	bSend: false,
	delay: 5000
};

BX.userOptions.save = function(sCategory, sName, sValName, sVal, bCommon)
{
	if (null == BX.userOptions.options)
		BX.userOptions.options = {};

	bCommon = !!bCommon;
	BX.userOptions.options[sCategory+'.'+sName+'.'+sValName] = [sCategory, sName, sValName, sVal, bCommon];

	var sParam = BX.userOptions.__get();
	if (sParam != '')
		document.cookie = BX.message('COOKIE_PREFIX')+"_LAST_SETTINGS=" + sParam + "&sessid="+BX.bitrix_sessid()+"; expires=Thu, 31 Dec 2020 23:59:59 GMT; path=/;";

	if(!BX.userOptions.bSend)
	{
		BX.userOptions.bSend = true;
		setTimeout(function(){BX.userOptions.send(null)}, BX.userOptions.delay);
	}
};

BX.userOptions.send = function(callback)
{
	var sParam = BX.userOptions.__get();
	BX.userOptions.options = null;
	BX.userOptions.bSend = false;

	if (sParam != '')
	{
		document.cookie = BX.message('COOKIE_PREFIX') + "_LAST_SETTINGS=; path=/;";
		BX.ajax({
			'method': 'GET',
			'dataType': 'html',
			'processData': false,
			'cache': false,
			'url': '/bitrix/admin/user_options.php?'+sParam+'&sessid='+BX.bitrix_sessid(),
			'onsuccess': callback
		});
	}
};

BX.userOptions.del = function(sCategory, sName, bCommon, callback)
{
	BX.ajax.get('/bitrix/admin/user_options.php?action=delete&c='+sCategory+'&n='+sName+(bCommon == true? '&common=Y':'')+'&sessid='+BX.bitrix_sessid(), callback);
};

BX.userOptions.__get = function()
{
	if (!BX.userOptions.options) return '';

	var sParam = '', n = -1, prevParam = '', aOpt, i;

	for (i in BX.userOptions.options)
	{
		aOpt = BX.userOptions.options[i];

		if (prevParam != aOpt[0]+'.'+aOpt[1])
		{
			n++;
			sParam += '&p['+n+'][c]='+BX.util.urlencode(aOpt[0]);
			sParam += '&p['+n+'][n]='+BX.util.urlencode(aOpt[1]);
			if (aOpt[4] == true)
				sParam += '&p['+n+'][d]=Y';
			prevParam = aOpt[0]+'.'+aOpt[1];
		}

		sParam += '&p['+n+'][v]['+BX.util.urlencode(aOpt[2])+']='+BX.util.urlencode(aOpt[3]);
	}

	return sParam.substr(1);
};

BX.ajax.history = {
	expected_hash: '',

	obParams: null,

	obFrame: null,
	obImage: null,

	obTimer: null,

	bInited: false,
	bHashCollision: false,
	bPushState: !!(history.pushState && BX.type.isFunction(history.pushState)),

	startState: null,

	init: function(obParams)
	{
		if (BX.ajax.history.bInited)
			return;

		this.obParams = obParams;
		var obCurrentState = this.obParams.getState();

		if (BX.ajax.history.bPushState)
		{
			BX.ajax.history.expected_hash = window.location.pathname;
			if (window.location.search)
				BX.ajax.history.expected_hash += window.location.search;

			BX.ajax.history.put(obCurrentState, BX.ajax.history.expected_hash, '', true);
			// due to some strange thing, chrome calls popstate event on page start. so we should delay it
			setTimeout("BX.bind(window, 'popstate', BX.ajax.history.__hashListener);", 500);
		}
		else
		{
			BX.ajax.history.expected_hash = window.location.hash;

			if (!BX.ajax.history.expected_hash || BX.ajax.history.expected_hash == '#')
				BX.ajax.history.expected_hash = '__bx_no_hash__';

			jsAjaxHistoryContainer.put(BX.ajax.history.expected_hash, obCurrentState);
			BX.ajax.history.obTimer = setTimeout(BX.ajax.history.__hashListener, 500);

			if (BX.browser.IsIE())
			{
				BX.ajax.history.obFrame = document.createElement('IFRAME');
				BX.hide_object(BX.ajax.history.obFrame);

				document.body.appendChild(BX.ajax.history.obFrame);

				BX.ajax.history.obFrame.contentWindow.document.open();
				BX.ajax.history.obFrame.contentWindow.document.write(BX.ajax.history.expected_hash);
				BX.ajax.history.obFrame.contentWindow.document.close();
			}
			else if (BX.browser.IsOpera())
			{
				BX.ajax.history.obImage = document.createElement('IMG');
				BX.hide_object(BX.ajax.history.obImage);

				document.body.appendChild(BX.ajax.history.obImage);

				BX.ajax.history.obImage.setAttribute('src', 'javascript:location.href = \'javascript:BX.ajax.history.__hashListener();\';');
			}
		}

		BX.ajax.history.bInited = true;
	},

	__hashListener: function(e)
	{
		e = e || window.event || {state:false};

		if (BX.ajax.history.bPushState)
		{
			BX.ajax.history.obParams.setState(e.state||BX.ajax.history.startState);
		}
		else
		{
			if (BX.ajax.history.obTimer)
			{
				window.clearTimeout(BX.ajax.history.obTimer);
				BX.ajax.history.obTimer = null;
			}

			var current_hash;
			if (null != BX.ajax.history.obFrame)
				current_hash = BX.ajax.history.obFrame.contentWindow.document.body.innerText;
			else
				current_hash = window.location.hash;

			if (!current_hash || current_hash == '#')
				current_hash = '__bx_no_hash__';

			if (current_hash.indexOf('#') == 0)
				current_hash = current_hash.substring(1);

			if (current_hash != BX.ajax.history.expected_hash)
			{
				var state = jsAjaxHistoryContainer.get(current_hash);
				if (state)
				{
					BX.ajax.history.obParams.setState(state);

					BX.ajax.history.expected_hash = current_hash;
					if (null != BX.ajax.history.obFrame)
					{
						var __hash = current_hash == '__bx_no_hash__' ? '' : current_hash;
						if (window.location.hash != __hash && window.location.hash != '#' + __hash)
							window.location.hash = __hash;
					}
				}
			}

			BX.ajax.history.obTimer = setTimeout(BX.ajax.history.__hashListener, 500);
		}
	},

	put: function(state, new_hash, new_hash1, bStartState)
	{
		if (this.bPushState)
		{
			if(!bStartState)
			{
				history.pushState(state, '', new_hash);
			}
			else
			{
				BX.ajax.history.startState = state;
			}
		}
		else
		{
			if (typeof new_hash1 != 'undefined')
				new_hash = new_hash1;
			else
				new_hash = 'view' + new_hash;

			jsAjaxHistoryContainer.put(new_hash, state);
			BX.ajax.history.expected_hash = new_hash;

			window.location.hash = BX.util.urlencode(new_hash);

			if (null != BX.ajax.history.obFrame)
			{
				BX.ajax.history.obFrame.contentWindow.document.open();
				BX.ajax.history.obFrame.contentWindow.document.write(new_hash);
				BX.ajax.history.obFrame.contentWindow.document.close();
			}
		}
	},

	checkRedirectStart: function(param_name, param_value)
	{
		var current_hash = window.location.hash;
		if (current_hash.substring(0, 1) == '#') current_hash = current_hash.substring(1);

		var test = current_hash.substring(0, 5);
		if (test == 'view/' || test == 'view%')
		{
			BX.ajax.history.bHashCollision = true;
			document.write('<' + 'div id="__ajax_hash_collision_' + param_value + '" style="display: none;">');
		}
	},

	checkRedirectFinish: function(param_name, param_value)
	{
		document.write('</div>');

		var current_hash = window.location.hash;
		if (current_hash.substring(0, 1) == '#') current_hash = current_hash.substring(1);

		BX.ready(function ()
		{
			var test = current_hash.substring(0, 5);
			if (test == 'view/' || test == 'view%')
			{
				var obColNode = BX('__ajax_hash_collision_' + param_value);
				var obNode = obColNode.firstChild;
				BX.cleanNode(obNode);
				obColNode.style.display = 'block';

				// IE, Opera and Chrome automatically modifies hash with urlencode, but FF doesn't ;-(
				if (test != 'view%')
					current_hash = BX.util.urlencode(current_hash);

				current_hash += (current_hash.indexOf('%3F') == -1 ? '%3F' : '%26') + param_name + '=' + param_value;

				var url = '/bitrix/tools/ajax_redirector.php?hash=' + current_hash;

				BX.ajax.insertToNode(url, obNode);
			}
		});
	}
};

BX.ajax.component = function(node)
{
	this.node = node;
};

BX.ajax.component.prototype.getState = function()
{
	var state = {
		'node': this.node,
		'title': window.document.title,
		'data': BX(this.node).innerHTML
	};

	var obNavChain = BX('navigation');
	if (null != obNavChain)
		state.nav_chain = obNavChain.innerHTML;

	return state;
};

BX.ajax.component.prototype.setState = function(state)
{
	BX(state.node).innerHTML = state.data;
	BX.ajax.UpdatePageTitle(state.title);

	if (state.nav_chain)
		BX.ajax.UpdatePageNavChain(state.nav_chain);
};

var jsAjaxHistoryContainer = {
	arHistory: {},

	put: function(hash, state)
	{
		this.arHistory[hash] = state;
	},

	get: function(hash)
	{
		return this.arHistory[hash];
	}
};


BX.ajax.FormData = function()
{
	this.elements = [];
	this.files = [];
	this.features = {};
	this.isSupported();
	this.log('BX FormData init');
};

BX.ajax.FormData.isSupported = function()
{
	var f = new BX.ajax.FormData();
	var result = f.features.supported;
	f = null;
	return result;
};

BX.ajax.FormData.prototype.log = function(o)
{
	if (false) {
		try {
			if (BX.browser.IsIE()) o = JSON.stringify(o);
			console.log(o);
		} catch(e) {}
	}
};

BX.ajax.FormData.prototype.isSupported = function()
{
	var f = {};
	f.fileReader = (window.FileReader && window.FileReader.prototype.readAsBinaryString);
	f.readFormData = f.sendFormData = !!(window.FormData);
	f.supported = !!(f.readFormData && f.sendFormData);
	this.features = f;
	this.log('features:');
	this.log(f);

	return f.supported;
};

BX.ajax.FormData.prototype.append = function(name, value)
{
	if (typeof(value) === 'object') { // seems to be files element
		this.files.push({'name': name, 'value':value});
	} else {
		this.elements.push({'name': name, 'value':value});
	}
};

BX.ajax.FormData.prototype.send = function(url, callbackOk, callbackProgress, callbackError)
{
	this.log('FD send');
	this.xhr = BX.ajax({
			'method': 'POST',
			'dataType': 'html',
			'url': url,
			'onsuccess': callbackOk,
			'onfailure': callbackError,
			'start': false,
			'preparePost':false
		});

	if (callbackProgress)
	{
		this.xhr.upload.addEventListener(
			'progress',
			function(e) {
				if (e.lengthComputable)
					callbackProgress(e.loaded / e.totalSize);
			},
			false
		);
	}

	if (this.features.readFormData && this.features.sendFormData)
	{
		var fd = new FormData();
		this.log('use browser formdata');
		for (var i in this.elements)
			fd.append(this.elements[i].name,this.elements[i].value);
		for (i in this.files)
			fd.append(this.files[i].name, this.files[i].value);
		this.xhr.send(fd);
	}

	return this.xhr;
};

BX.addCustomEvent('onAjaxFailure', BX.debug);
})(window);

/* End */
;
; /* Start:/bitrix/js/main/core/core_fx.js*/
;(function(window){

var defaultOptions = {
	time: 1.0,
	step: 0.05,
	type: 'linear',

	allowFloat: false
}

/*
options: {
	start: start value or {param: value, param: value}
	finish: finish value or {param: value, param: value}
	time: time to transform in seconds
	type: linear|accelerated|decelerated|custom func name
	callback,
	callback_start,
	callback_complete,

	step: time between steps in seconds
	allowFloat: false|true
}
*/
BX.fx = function(options)
{
	this.options = options;

	if (null != this.options.time)
		this.options.originalTime = this.options.time;
	if (null != this.options.step)
		this.options.originalStep = this.options.step;

	if (!this.__checkOptions())
		return false;

	this.__go = BX.delegate(this.go, this);

	this.PARAMS = {};
}

BX.fx.prototype.__checkOptions = function()
{
	if (typeof this.options.start != typeof this.options.finish)
		return false;

	if (null == this.options.time) this.options.time = defaultOptions.time;
	if (null == this.options.step) this.options.step = defaultOptions.step;
	if (null == this.options.type) this.options.type = defaultOptions.type;
	if (null == this.options.allowFloat) this.options.allowFloat = defaultOptions.allowFloat;

	this.options.time *= 1000;
	this.options.step *= 1000;

	if (typeof this.options.start != 'object')
	{
		this.options.start = {_param: this.options.start};
		this.options.finish = {_param: this.options.finish};
	}

	var i;
	for (i in this.options.start)
	{
		if (null == this.options.finish[i])
		{
			this.options.start[i] = null;
			delete this.options.start[i];
		}
	}

	if (!BX.type.isFunction(this.options.type))
	{
		if (BX.type.isFunction(window[this.options.type]))
			this.options.type = window[this.options.type];
		else if (BX.type.isFunction(BX.fx.RULES[this.options.type]))
			this.options.type = BX.fx.RULES[this.options.type];
		else
			this.options.type = BX.fx.RULES[defaultOptions.type];
	}

	return true;
}

BX.fx.prototype.go = function()
{
	var timeCurrent = new Date().valueOf();
	if (timeCurrent < this.PARAMS.timeFinish)
	{
		for (var i in this.PARAMS.current)
		{
			this.PARAMS.current[i][0] = this.options.type.apply(this, [{
				start_value: this.PARAMS.start[i][0],
				finish_value: this.PARAMS.finish[i][0],
				current_value: this.PARAMS.current[i][0],
				current_time: timeCurrent - this.PARAMS.timeStart,
				total_time: this.options.time
			}]);
		}

		this._callback(this.options.callback);

		if (!this.paused)
			this.PARAMS.timer = setTimeout(this.__go, this.options.step);
	}
	else
	{
		this.stop();
	}
}

BX.fx.prototype._callback = function(cb)
{
	var tmp = {};

	cb = cb || this.options.callback;

	for (var i in this.PARAMS.current)
	{
		tmp[i] = (this.options.allowFloat ? this.PARAMS.current[i][0] : Math.round(this.PARAMS.current[i][0])) + this.PARAMS.current[i][1];
	}

	return cb.apply(this, [null != tmp['_param'] ? tmp._param : tmp]);
}

BX.fx.prototype.start = function()
{
	var i,value, unit;

	this.PARAMS.start = {};
	this.PARAMS.current = {};
	this.PARAMS.finish = {};

	for (i in this.options.start)
	{
		value = +this.options.start[i];
		unit = (this.options.start[i]+'').substring((value+'').length);
		this.PARAMS.start[i] = [value, unit];
		this.PARAMS.current[i] = [value, unit];
		this.PARAMS.finish[i] = [+this.options.finish[i], unit];
	}

	this._callback(this.options.callback_start);
	this._callback(this.options.callback);

	this.PARAMS.timeStart = new Date().valueOf();
	this.PARAMS.timeFinish = this.PARAMS.timeStart + this.options.time;
	this.PARAMS.timer = setTimeout(BX.delegate(this.go, this), this.options.step);

	return this;
}

BX.fx.prototype.pause = function()
{
	if (this.paused)
	{
		this.PARAMS.timer = setTimeout(this.__go, this.options.step);
		this.paused = false;
	}
	else
	{
		clearTimeout(this.PARAMS.timer);
		this.paused = true;
	}
}

BX.fx.prototype.stop = function(silent)
{
	silent = !!silent;
	if (this.PARAMS.timer)
		clearTimeout(this.PARAMS.timer);

	if (null != this.options.originalTime)
		this.options.time = this.options.originalTime;
	if (null != this.options.originalStep)
		this.options.step = this.options.originalStep;

	this.PARAMS.current = this.PARAMS.finish;
	if (!silent) {
		this._callback(this.options.callback);
		this._callback(this.options.callback_complete);
	}
}

/*
type rules of animation
 - linear - simple linear animation
 - accelerated
 - decelerated
*/

/*
	params: {
		start_value, finish_value, current_time, total_time
	}
*/
BX.fx.RULES =
{
	linear: function(params)
	{
		return params.start_value + (params.current_time/params.total_time) * (params.finish_value - params.start_value);
	},

	decelerated: function(params)
	{
		return params.start_value + Math.sqrt(params.current_time/params.total_time) * (params.finish_value - params.start_value);
	},

	accelerated: function(params)
	{
		var q = params.current_time/params.total_time;
		return params.start_value + q * q * (params.finish_value - params.start_value);
	}
}

/****************** effects realizaion ************************/

/*
	type = 'fade' || 'scroll' || 'scale' || 'fold'
*/

BX.fx.hide = function(el, type, opts)
{
	el = BX(el);

	if (typeof type == 'object' && null == opts)
	{
		opts = type;
		type = opts.type
	}

	if (!BX.type.isNotEmptyString(type))
	{
		el.style.display = 'none';
		return;
	}

	var fxOptions = BX.fx.EFFECTS[type](el, opts, 0);
	fxOptions.callback_complete = function () {
		if (opts.hide !== false)
			el.style.display = 'none';

		if (opts.callback_complete)
			opts.callback_complete.apply(this, arguments);
	}

	return (new BX.fx(fxOptions)).start();
}

BX.fx.show = function(el, type, opts)
{
	el = BX(el);

	if (typeof type == 'object' && null == opts)
	{
		opts = type;
		type = opts.type
	}

	if (!opts) opts = {};

	if (!BX.type.isNotEmptyString(type))
	{
		el.style.display = 'block';
		return;
	}

	var fxOptions = BX.fx.EFFECTS[type](el, opts, 1);

	fxOptions.callback_complete = function () {
		if (opts.show !== false)
			el.style.display = 'block';

		if (opts.callback_complete)
			opts.callback_complete.apply(this, arguments);
	}

	return (new BX.fx(fxOptions)).start();
}

BX.fx.EFFECTS = {
	scroll: function(el, opts, action)
	{
		if (!opts.direction) opts.direction = 'vertical';

		var param = opts.direction == 'horizontal' ? 'width' : 'height';

		var val = parseInt(BX.style(el, param));
		if (isNaN(val))
		{
			val = BX.pos(el)[param];
		}

		if (action == 0)
			var start = val, finish = opts.min_height ? parseInt(opts.min_height) : 0;
		else
			var finish = val, start = opts.min_height ? parseInt(opts.min_height) : 0;

		return {
			'start': start,
			'finish': finish,
			'time': opts.time || defaultOptions.time,
			'type': 'linear',
			callback_start: function () {
				if (BX.style(el, 'position') == 'static')
					el.style.position = 'relative';

				el.style.overflow = 'hidden';
				el.style[param] = start + 'px';
				el.style.display = 'block';
			},
			callback: function (val) {el.style[param] = val + 'px';}
		}
	},

	fade: function(el, opts, action)
	{
		var fadeOpts = {
			'time': opts.time || defaultOptions.time,
			'type': action == 0 ? 'decelerated' : 'linear',
			'start': action == 0 ? 1 : 0,
			'finish': action == 0 ? 0 : 1,
			'allowFloat': true
		};

		if (BX.browser.IsIE() && !BX.browser.IsIE9())
		{
			fadeOpts.start *= 100; fadeOpts.finish *= 100; fadeOpts.allowFloat = false;

			fadeOpts.callback_start = function() {
				el.style.display = 'block';
				el.style.filter += "progid:DXImageTransform.Microsoft.Alpha(opacity=" + fadeOpts.start + ")";
			};

			fadeOpts.callback = function (val) {
				(el.filters['DXImageTransform.Microsoft.alpha']||el.filters.alpha).opacity = val;
			}
		}
		else
		{
			fadeOpts.callback_start = function () {
				el.style.display = 'block';
			}

			fadeOpts.callback = function (val) {
				el.style.opacity = el.style.KhtmlOpacity = el.style.MozOpacity = val;
			};
		}

		return fadeOpts;
	},

	fold: function (el, opts, action) // 'fold' is a combination of two consequential 'scroll' hidings.
	{
		if (action != 0) return;

		var pos = BX.pos(el);
		var coef = pos.height / (pos.width + pos.height);
		var old_opts = {time: opts.time || defaultOptions.time, callback_complete: opts.callback_complete, hide: opts.hide};

		opts.type = 'scroll';
		opts.direction = 'vertical';
		opts.min_height = opts.min_height || 10;
		opts.hide = false;
		opts.time = coef * old_opts.time;
		opts.callback_complete = function()
		{
			el.style.whiteSpace = 'nowrap';

			opts.direction = 'horizontal';
			opts.min_height = null;

			opts.time = old_opts.time - opts.time;
			opts.hide = old_opts.hide;
			opts.callback_complete = old_opts.callback_complete;

			BX.fx.hide(el, opts);
		}

		return BX.fx.EFFECTS.scroll(el, opts, action);
	},

	scale: function (el, opts, action)
	{
		var val = {width: parseInt(BX.style(el, 'width')), height: parseInt(BX.style(el, 'height'))};
		if (isNaN(val.width) || isNaN(val.height))
		{
			var pos = BX.pos(el)
			val = {width: pos.width, height: pos.height};
		}

		if (action == 0)
			var start = val, finish = {width: 0, height: 0};
		else
			var finish = val, start = {width: 0, height: 0};

		return {
			'start': start,
			'finish': finish,
			'time': opts.time || defaultOptions.time,
			'type': 'linear',
			callback_start: function () {
				el.style.position = 'relative';
				el.style.overflow = 'hidden';
				el.style.display = 'block';
				el.style.height = start.height + 'px';
				el.style.width = start.width + 'px';
			},
			callback: function (val) {
				el.style.height = val.height + 'px';
				el.style.width = val.width + 'px';
			}
		}
	}
}

// Color animation
//
// Set animation rule
// BX.fx.colorAnimate.addRule('animationRule1',"#FFF","#faeeb4", "background-color", 100, 1, true);
// BX.fx.colorAnimate.addRule('animationRule2',"#fc8282","#ff0000", "color", 100, 1, true);
// Params: 1 - animation name, 2 - start color, 3 - end color, 4 - count step, 5 - delay each step, 6 - return color on end animation
//
// Animate color for element
// BX.fx.colorAnimate(BX('element'), 'animationRule1,animationRule2');

var defaultOptionsColorAnimation = {
	arStack: {},
	arRules: {},
	globalAnimationId: 0
}

BX.fx.colorAnimate = function(element, rule, back)
{
	if (element == null)
		return;

	animationId = element.getAttribute('data-animation-id');
	if (animationId == null)
	{
		animationId = defaultOptionsColorAnimation.globalAnimationId;
		element.setAttribute('data-animation-id', defaultOptionsColorAnimation.globalAnimationId++);
	}
	var aRuleList = rule.split(/\s*,\s*/);

	for (var j	= 0; j < aRuleList.length; j++)
	{
		rule = aRuleList[j];

		if (!defaultOptionsColorAnimation.arRules[rule]) continue;

		var i=0;

		if (!defaultOptionsColorAnimation.arStack[animationId])
		{
			defaultOptionsColorAnimation.arStack[animationId] = {};
		}
		else if (defaultOptionsColorAnimation.arStack[animationId][rule])
		{
			i = defaultOptionsColorAnimation.arStack[animationId][rule].i;
			clearInterval(defaultOptionsColorAnimation.arStack[animationId][rule].tId);
		}

		if ((i==0 && back) || (i==defaultOptionsColorAnimation.arRules[rule][3] && !back)) continue;

		defaultOptionsColorAnimation.arStack[animationId][rule] = {'i':i, 'element': element, 'tId':setInterval('BX.fx.colorAnimate.run("'+animationId+'","'+rule+'")', defaultOptionsColorAnimation.arRules[rule][4]),'back':Boolean(back)};
	}
}

BX.fx.colorAnimate.addRule = function (rule, startColor, finishColor, cssProp, step, delay, back)
{
	defaultOptionsColorAnimation.arRules[rule] = [
		BX.util.hex2rgb(startColor),
		BX.util.hex2rgb(finishColor),
		cssProp.replace(/\-(.)/g,function(){return arguments[1].toUpperCase();}),
		step,
		delay || 1,
		back || false
	];
};

BX.fx.colorAnimate.run = function(animationId, rule)
{
	element = defaultOptionsColorAnimation.arStack[animationId][rule].element;

    defaultOptionsColorAnimation.arStack[animationId][rule].i += defaultOptionsColorAnimation.arStack[animationId][rule].back?-1:1;
 	var finishPercent = defaultOptionsColorAnimation.arStack[animationId][rule].i/defaultOptionsColorAnimation.arRules[rule][3];
	var startPercent = 1 - finishPercent;

	var aRGBStart = defaultOptionsColorAnimation.arRules[rule][0];
	var aRGBFinish = defaultOptionsColorAnimation.arRules[rule][1];

	element.style[defaultOptionsColorAnimation.arRules[rule][2]] = 'rgb('+
	Math.floor( aRGBStart['r'] * startPercent + aRGBFinish['r'] * finishPercent ) + ','+
	Math.floor( aRGBStart['g'] * startPercent + aRGBFinish['g'] * finishPercent ) + ','+
	Math.floor( aRGBStart['b'] * startPercent + aRGBFinish['b'] * finishPercent ) +')';

	if ( defaultOptionsColorAnimation.arStack[animationId][rule].i == defaultOptionsColorAnimation.arRules[rule][3] || defaultOptionsColorAnimation.arStack[animationId][rule].i ==0)
	{
		clearInterval(defaultOptionsColorAnimation.arStack[animationId][rule].tId);
		if (defaultOptionsColorAnimation.arRules[rule][5])
			BX.fx.colorAnimate(defaultOptionsColorAnimation.arStack[animationId][rule].element, rule, true);
	}
}


/*
options = {
	delay: 100,
	duration : 3000,
	start : { scroll : document.body.scrollTop, left : 0, opacity :  100 },
	finish : { scroll : document.body.scrollHeight, left : 500, opacity : 10 },
	transition : BitrixAnimation.makeEaseOut(BitrixAnimation.transitions.quart),

	step : function(state)
	{
		document.body.scrollTop = state.scroll;
		button.style.left =  state.left + "px";
		button.style.opacity =  state.opacity / 100;
	},
	complete : function()
	{
		button.style.background = "green";
	}
}

options =
{
	delay : 20,
	duration : 4000,
	transition : BXAnimation.makeEaseOut(BXAnimation.transitions.quart),
	progress : function(progress)
	{
		document.body.scrollTop = Math.round(topMax * progress);
		button.style.left =  Math.round(leftMax * progress) + "px";
		button.style.opacity =  (100 + Math.round((opacityMin - 100) * progress)) / 100;

	},
	complete : function()
	{
		button.style.background = "green";
	}
}
*/

BX.easing = function(options)
{
	this.options = options;
	this.timer = null;
};

BX.easing.prototype.animate = function()
{
	if (!this.options || !this.options.start || !this.options.finish ||
		typeof(this.options.start) != "object" || typeof(this.options.finish) != "object"
		)
		return null;

	for (var propName in this.options.start)
	{
		if (typeof(this.options.finish[propName]) == "undefined")
		{
			delete this.options.start[propName];
		}
	}

	this.options.progress = function(progress) {
		var state = {};
		for (var propName in this.start)
			state[propName] = Math.round(this.start[propName] + (this.finish[propName] - this.start[propName]) * progress);

		if (this.step)
			this.step(state);
	};

	this.animateProgress();
};

BX.easing.prototype.stop = function(completed)
{
	if (this.timer)
	{
		clearInterval(this.timer);
		this.timer = null;

		if (completed)
			this.options.complete && this.options.complete();
	}
};

BX.easing.prototype.animateProgress = function()
{
	var start = new Date();
	var delta = this.options.transition || BX.easing.transitions.linear;
	var duration = this.options.duration || 1000;

	this.timer = setInterval(BX.proxy(function() {

		var progress = (new Date() - start) / duration;
		if (progress > 1)
			progress = 1;

		this.options.progress(delta(progress));

		if (progress == 1)
			this.stop(true);

	}, this), this.options.delay || 13);

};

BX.easing.makeEaseInOut = function(delta)
{
	return function(progress) {
		if (progress < 0.5)
			return delta( 2 * progress ) / 2;
		else
			return (2 - delta( 2 * (1-progress) ) ) / 2;
	}
};

BX.easing.makeEaseOut = function(delta)
{
	return function(progress) {
		return 1 - delta(1 - progress);
	};
};

BX.easing.transitions = {

	linear : function(progress)
	{
		return progress;
	},

	quad : function(progress)
	{
		return Math.pow(progress, 2);
	},

	cubic : function(progress) {
		return Math.pow(progress, 3);
	},

	quart : function(progress)
	{
		return Math.pow(progress, 4);
	},

	quint : function(progress)
	{
		return Math.pow(progress, 5);
	},

	circ : function(progress)
	{
		return 1 - Math.sin(Math.acos(progress));
	},

	back : function(progress)
	{
		return Math.pow(progress, 2) * ((1.5 + 1) * progress - 1.5);
	},

	elastic: function(progress)
	{
		return Math.pow(2, 10 * (progress-1)) * Math.cos(20 * Math.PI * 1.5/3 * progress);
	},

	bounce : function(progress)
	{
		for(var a = 0, b = 1; 1; a += b, b /= 2) {
			if (progress >= (7 - 4 * a) / 11) {
				return -Math.pow((11 - 6 * a - 11 * progress) / 4, 2) + Math.pow(b, 2);
			}
		}
	}};


})(window);

/* End */
;
; /* Start:/bitrix/js/main/session.js*/
function CBXSession()
{
	var _this = this;
	this.mess = {};
	this.timeout = null;
	this.sessid = null;
	this.bShowMess = true;
	this.dateStart = new Date();
	this.dateInput = new Date();
	this.dateCheck = new Date();
	this.activityInterval = 0;
	this.notifier = null;
	
	this.Expand = function(timeout, sessid, bShowMess, key)
	{
		this.timeout = timeout;
		this.sessid = sessid;
		this.bShowMess = bShowMess;
		this.key = key;
		
		BX.ready(function(){
			BX.bind(document, "keypress", _this.OnUserInput);
			BX.bind(document.body, "mousemove", _this.OnUserInput);
			BX.bind(document.body, "click", _this.OnUserInput);
			
			setTimeout(_this.CheckSession, (_this.timeout-60)*1000);
		})
	},
		
	this.OnUserInput = function()
	{
		var curr = new Date();
		_this.dateInput.setTime(curr.valueOf());
	}
	
	this.CheckSession = function()
	{
		var curr = new Date();
		if(curr.valueOf() - _this.dateCheck.valueOf() < 30000)
			return;

		_this.activityInterval = Math.round((_this.dateInput.valueOf() - _this.dateStart.valueOf())/1000);
		_this.dateStart.setTime(_this.dateInput.valueOf());
		var interval = (_this.activityInterval > _this.timeout? (_this.timeout-60) : _this.activityInterval);
		BX.ajax.get('/bitrix/tools/public_session.php?sessid='+_this.sessid+'&interval='+interval+'&k='+_this.key, function(data){_this.CheckResult(data)});
	}
	
	this.CheckResult = function(data)
	{
		if(data == 'SESSION_EXPIRED')
		{
			if(_this.bShowMess)
			{
				_this.notifier = document.body.appendChild(BX.create('DIV', {
					props: {className: 'bx-session-message'},
					style: {top: '-1000px'},
					html: '<a class="bx-session-message-close" href="javascript:bxSession.Close()"></a>'+_this.mess.messSessExpired
				}));
	
				var windowScroll = BX.GetWindowScrollPos();
				var windowSize = BX.GetWindowInnerSize();

				_this.notifier.style.left = parseInt(windowScroll.scrollLeft + windowSize.innerWidth / 2 - parseInt(_this.notifier.clientWidth) / 2) + 'px';

				var fxStart = windowScroll.scrollTop - _this.notifier.offsetHeight;
				var fxFinish = windowScroll.scrollTop;
	
				(new BX.fx({
					time: 0.5,
					step: 0.01,
					type: 'accelerated',
					start: fxStart,
					finish: fxFinish,
					callback: function(top){_this.notifier.style.top = top + 'px';},
					callback_complete: function()
					{
						if(BX.browser.IsIE())
						{
							BX.bind(window, 'scroll', function()
							{
								var windowScroll = BX.GetWindowScrollPos();
								_this.notifier.style.top = windowScroll.scrollTop + 'px';
							});
						}
						else
						{
							_this.notifier.style.top='0px';
							_this.notifier.style.position='fixed';
						}
					}
				})).start();
			}
		}
		else
		{
			var timeout;
			if(data == 'SESSION_CHANGED')
				timeout = (_this.timeout-60);
			else
				timeout = (_this.activityInterval < 60? 60 : (_this.activityInterval > _this.timeout? (_this.timeout-60) : _this.activityInterval));

			var curr = new Date();
			_this.dateCheck.setTime(curr.valueOf());
			setTimeout(_this.CheckSession, timeout*1000);
		}
	}
	
	this.Close = function()
	{
		this.notifier.style.display = 'none';
	}
}

var bxSession = new CBXSession();
/* End */
;
; /* Start:/bitrix/js/main/core/core_window.js*/
;(function(window) {
if (BX.WindowManager) return;

/* windows manager */
BX.WindowManager = {
	_stack: [],
	_runtime_resize: {},
	_delta: 2,
	_delta_start: 1000,
	currently_loaded: null,

	settings_category: 'BX.WindowManager.9.5',

	register: function (w)
	{
		this.currently_loaded = null;
		var div = w.Get();

		div.style.zIndex = w.zIndex = this.GetZIndex();

		w.WM_REG_INDEX = this._stack.length;
		this._stack.push(w);

		if (this._stack.length < 2)
		{
			BX.bind(document, 'keyup', BX.proxy(this.__checkKeyPress, this));
		}
	},

	unregister: function (w)
	{
		if (null == w.WM_REG_INDEX)
			return null;

		var _current;
		if (this._stack.length > 0)
		{
			while ((_current = this.__pop_stack()) != w)
			{
				if (!_current)
				{
					_current = null;
					break;
				}
			}

			if (this._stack.length <= 0)
			{
				this.enableKeyCheck();
			}

			return _current;
		}
		else
		{
			return null;
		}
	},

	__pop_stack: function(clean)
	{
		if (this._stack.length > 0)
		{
			var _current = this._stack.pop();
			_current.WM_REG_INDEX = null;
			BX.onCustomEvent(_current, 'onWindowUnRegister', [clean === true]);

			return _current;
		}
		else
			return null;
	},

	clean: function()
	{
		while (this.__pop_stack(true)){}
		this._stack = null;
		this.disableKeyCheck();
	},

	Get: function()
	{
		if (this.currently_loaded)
			return this.currently_loaded;
		else if (this._stack.length > 0)
			return this._stack[this._stack.length-1];
		else
			return null;
	},

	setStartZIndex: function(value)
	{
		this._delta_start = value;
	},

	restoreStartZIndex: function()
	{
		this._delta_start = 1000;
	},

	GetZIndex: function()
	{
		return (null != (_current = this._stack[this._stack.length-1])
			? parseInt(_current.Get().style.zIndex) + this._delta
			: this._delta_start
		);
	},

	__get_check_url: function(url)
	{
		var pos = url.indexOf('?');
		return pos == -1 ? url : url.substring(0, pos);
	},

	saveWindowSize: function(url, params)
	{
		var check_url = this.__get_check_url(url);
		if (BX.userOptions)
		{
			BX.userOptions.save(this.settings_category, 'size_' + check_url, 'width', params.width);
			BX.userOptions.save(this.settings_category, 'size_' + check_url, 'height', params.height);
		}

		this._runtime_resize[check_url] = params;
	},

	saveWindowOptions: function(wnd_id, opts)
	{
		if (BX.userOptions)
		{
			for (var i in opts)
			{
				BX.userOptions.save(this.settings_category, 'options_' + wnd_id, i, opts[i]);
			}
		}
	},

	getRuntimeWindowSize: function(url)
	{
		return this._runtime_resize[this.__get_check_url(url)];
	},

	disableKeyCheck: function()
	{
		BX.unbind(document, 'keyup', BX.proxy(this.__checkKeyPress, this));
	},

	enableKeyCheck: function()
	{
		BX.bind(document, 'keyup', BX.proxy(this.__checkKeyPress, this));
	},

	__checkKeyPress: function(e)
	{
		if (null == e)
			e = window.event;

		if (e.keyCode == 27)
		{
			var wnd = BX.WindowManager.Get();
			if (wnd && !wnd.unclosable) wnd.Close();
		}
	}
};

BX.garbage(BX.WindowManager.clean, BX.WindowManager);

/* base button class */
BX.CWindowButton = function(params)
{
	if (params.btn)
	{
		this.btn = params.btn;
		this.parentWindow = params.parentWindow;

		if (/save|apply/i.test(this.btn.name))
		{
			BX.bind(this.btn, 'click', BX.delegate(this.disableUntilError, this));
		}
	}
	else
	{
		this.title = params.title; // html value attr
		this.hint = params.hint; // html title attr
		this.id = params.id; // html name and id attrs
		this.name = params.name; // html name or value attrs when id and title 're absent
		this.className = params.className; // className for button input

		this.action = params.action;
		this.onclick = params.onclick;

		// you can override button creation method
		if (params.Button && BX.type.isFunction(params.Button))
			this.Button = params.Button;

		this.btn = null;
	}
};

BX.CWindowButton.prototype.disable = function()
{
	if (this.btn)
		this.parentWindow.showWait(this.btn);
};
BX.CWindowButton.prototype.enable = function(){
	if (this.btn)
		this.parentWindow.closeWait(this.btn);
};

BX.CWindowButton.prototype.emulate = function()
{
	if (this.btn && this.btn.disabled)
		return;

	var act =
		this.action
		? BX.delegate(this.action, this)
		: (
			this.onclick
			? this.onclick
			: (
				this.btn
				? this.btn.getAttribute('onclick')
				: ''
			)
		);

	if (act)
	{
		setTimeout(act, 50);
		if (this.btn && /save|apply/i.test(this.btn.name) && !this.action)
		{
			this.disableUntilError();
		}
	}
};

BX.CWindowButton.prototype.Button = function(parentWindow)
{
	this.parentWindow = parentWindow;

	var btn = {
		props: {
			'type': 'button',
			'name': this.id ? this.id : this.name,
			'value': this.title ? this.title : this.name,
			'id': this.id
		}
	};

	if (this.hint)
		btn.props.title = this.hint;
	if (!!this.className)
		btn.props.className = this.className;

	if (this.action)
	{
		btn.events = {
			'click': BX.delegate(this.action, this)
		};
	}
	else if (this.onclick)
	{
		if (BX.browser.IsIE())
		{
			btn.events = {
				'click': BX.delegate(function() {eval(this.onclick)}, this)
			};
		}
		else
		{
			btn.attrs = {
				'onclick': this.onclick
			};
		}
	}

	this.btn = BX.create('INPUT', btn);

	return this.btn;
};

BX.CWindowButton.prototype.disableUntilError = function() {
	this.disable();
	if (!this.__window_error_handler_set)
	{
		BX.addCustomEvent(this.parentWindow, 'onWindowError', BX.delegate(this.enable, this));
		this.__window_error_handler_set = true;
	}
};

/* base window class */
BX.CWindow = function(div, type)
{
	this.DIV = div || document.createElement('DIV');

	this.SETTINGS = {
		resizable: false,
		min_height: 0,
		min_width: 0,
		top: 0,
		left: 0,
		draggable: false,
		drag_restrict: true,
		resize_restrict: true
	};

	this.ELEMENTS = {
		draggable: [],
		resizer: [],
		close: []
	};

	this.type = type == 'float' ? 'float' : 'dialog';

	BX.adjust(this.DIV, {
		props: {
			className: 'bx-core-window'
		},
		style: {
			'zIndex': 0,
			'position': 'absolute',
			'display': 'none',
			'top': this.SETTINGS.top + 'px',
			'left': this.SETTINGS.left + 'px',
			'height': '100px',
			'width': '100px'
		}
	});

	this.isOpen = false;

	BX.addCustomEvent(this, 'onWindowRegister', BX.delegate(this.onRegister, this));
	BX.addCustomEvent(this, 'onWindowUnRegister', BX.delegate(this.onUnRegister, this));

	this.MOUSEOVER = null;
	BX.bind(this.DIV, 'mouseover', BX.delegate(this.__set_msover, this));
	BX.bind(this.DIV, 'mouseout', BX.delegate(this.__unset_msover, this));

	BX.ready(BX.delegate(function() {
		document.body.appendChild(this.DIV);
	}, this));
};

BX.CWindow.prototype.Get = function () {return this.DIV};
BX.CWindow.prototype.visible = function() {return this.isOpen;};

BX.CWindow.prototype.Show = function(bNotRegister)
{
	this.DIV.style.display = 'block';

	if (!bNotRegister)
	{
		BX.WindowManager.register(this);
		BX.onCustomEvent(this, 'onWindowRegister');
	}
};

BX.CWindow.prototype.Hide = function()
{
	BX.WindowManager.unregister(this);
	this.DIV.style.display = 'none';
};

BX.CWindow.prototype.onRegister = function()
{
	this.isOpen = true;
};

BX.CWindow.prototype.onUnRegister = function(clean)
{
	this.isOpen = false;

	if (clean || (this.PARAMS && this.PARAMS.content_url))
	{
		if (clean) {BX.onCustomEvent(this, 'onWindowClose', [this, true]);}

		if (this.DIV.parentNode)
			this.DIV.parentNode.removeChild(this.DIV);
	}
	else
	{
		this.DIV.style.display = 'none';
	}
};

BX.CWindow.prototype.CloseDialog = // compatibility
BX.CWindow.prototype.Close = function(bImmediately)
{
	BX.onCustomEvent(this, 'onBeforeWindowClose', [this]);
	if (bImmediately !== true)
	{
		if (this.denyClose)
			return false;
	}

	BX.onCustomEvent(this, 'onWindowClose', [this]);

	//this crashes vis editor in ie via onWindowResizeExt event handler
	//if (this.bExpanded) this.__expand();
	// alternative version:
	if (this.bExpanded)
	{
		var pDocElement = BX.GetDocElement();
		BX.unbind(window, 'resize', BX.proxy(this.__expand_onresize, this));
		pDocElement.style.overflow = this.__expand_settings.overflow;
	}

	BX.WindowManager.unregister(this);

	return true;
};

BX.CWindow.prototype.SetResize = function(elem)
{
	elem.style.cursor = 'se-resize';
	BX.bind(elem, 'mousedown', BX.proxy(this.__startResize, this));

	this.ELEMENTS.resizer.push(elem);
	this.SETTINGS.resizable = true;
};

BX.CWindow.prototype.SetExpand = function(elem, event_name)
{
	event_name = event_name || 'click';
	BX.bind(elem, event_name, BX.proxy(this.__expand, this));
};

BX.CWindow.prototype.__expand_onresize = function()
{
	var windowSize = BX.GetWindowInnerSize();
	this.DIV.style.width = windowSize.innerWidth + "px";
	this.DIV.style.height = windowSize.innerHeight + "px";

	BX.onCustomEvent(this, 'onWindowResize');
};

BX.CWindow.prototype.__expand = function()
{
	var pDocElement = BX.GetDocElement();

	if (!this.bExpanded)
	{
		var wndScroll = BX.GetWindowScrollPos(),
			wndSize = BX.GetWindowInnerSize();

		this.__expand_settings = {
			resizable: this.SETTINGS.resizable,
			draggable: this.SETTINGS.draggable,
			width: this.DIV.style.width,
			height: this.DIV.style.height,
			left: this.DIV.style.left,
			top: this.DIV.style.top,
			scrollTop: wndScroll.scrollTop,
			scrollLeft: wndScroll.scrollLeft,
			overflow: BX.style(pDocElement, 'overflow')
		};

		this.SETTINGS.resizable = false;
		this.SETTINGS.draggable = false;

		window.scrollTo(0,0);
		pDocElement.style.overflow = 'hidden';

		this.DIV.style.top = '0px';
		this.DIV.style.left = '0px';

		this.DIV.style.width = wndSize.innerWidth + 'px';
		this.DIV.style.height = wndSize.innerHeight + 'px';

		this.bExpanded = true;

		BX.onCustomEvent(this, 'onWindowExpand');
		BX.onCustomEvent(this, 'onWindowResize');

		BX.bind(window, 'resize', BX.proxy(this.__expand_onresize, this));
	}
	else
	{
		BX.unbind(window, 'resize', BX.proxy(this.__expand_onresize, this));

		this.SETTINGS.resizable = this.__expand_settings.resizable;
		this.SETTINGS.draggable = this.__expand_settings.draggable;

		pDocElement.style.overflow = this.__expand_settings.overflow;

		this.DIV.style.top = this.__expand_settings.top;
		this.DIV.style.left = this.__expand_settings.left;
		this.DIV.style.width = this.__expand_settings.width;
		this.DIV.style.height = this.__expand_settings.height;

		window.scrollTo(this.__expand_settings.scrollLeft, this.__expand_settings.scrollTop);

		this.bExpanded = false;

		BX.onCustomEvent(this, 'onWindowNarrow');
		BX.onCustomEvent(this, 'onWindowResize');

	}
};

BX.CWindow.prototype.Resize = function(x, y)
{
	var new_width = Math.max(x - this.pos.left + this.dx, this.SETTINGS.min_width);
	var new_height = Math.max(y - this.pos.top + this.dy, this.SETTINGS.min_height);

	if (this.SETTINGS.resize_restrict)
	{
		var scrollSize = BX.GetWindowScrollSize();

		if (this.pos.left + new_width > scrollSize.scrollWidth - this.dw)
			new_width = scrollSize.scrollWidth - this.pos.left - this.dw;
	}

	this.DIV.style.width = new_width + 'px';
	this.DIV.style.height = new_height + 'px';

	BX.onCustomEvent(this, 'onWindowResize');
};

BX.CWindow.prototype.__startResize = function(e)
{
	if (!this.SETTINGS.resizable)
		return false;

	if(!e) e = window.event;

	this.wndSize = BX.GetWindowScrollPos();
	this.wndSize.innerWidth = BX.GetWindowInnerSize().innerWidth;

	this.pos = BX.pos(this.DIV);

	this.x = e.clientX + this.wndSize.scrollLeft;
	this.y = e.clientY + this.wndSize.scrollTop;

	this.dx = this.pos.left + this.pos.width - this.x;
	this.dy = this.pos.top + this.pos.height - this.y;
	this.dw = this.pos.width - parseInt(this.DIV.style.width);

	BX.bind(document, "mousemove", BX.proxy(this.__moveResize, this));
	BX.bind(document, "mouseup", BX.proxy(this.__stopResize, this));

	if(document.body.setCapture)
		document.body.setCapture();

	document.onmousedown = BX.False;

	var b = document.body;
	b.ondrag = b.onselectstart = BX.False;
	b.style.MozUserSelect = this.DIV.style.MozUserSelect = 'none';
	b.style.cursor = 'se-resize';

	BX.onCustomEvent(this, 'onWindowResizeStart');

	return true;
};

BX.CWindow.prototype.__moveResize = function(e)
{
	if(!e) e = window.event;

	var windowScroll = BX.GetWindowScrollPos();

	var x = e.clientX + windowScroll.scrollLeft;
	var y = e.clientY + windowScroll.scrollTop;

	if(this.x == x && this.y == y)
		return;

	this.Resize(x, y);

	this.x = x;
	this.y = y;
};

BX.CWindow.prototype.__stopResize = function()
{
	if(document.body.releaseCapture)
		document.body.releaseCapture();

	BX.unbind(document, "mousemove", BX.proxy(this.__moveResize, this));
	BX.unbind(document, "mouseup", BX.proxy(this.__stopResize, this));

	document.onmousedown = null;

	var b = document.body;
	b.ondrag = b.onselectstart = null;
	b.style.MozUserSelect = this.DIV.style.MozUserSelect = '';
	b.style.cursor = '';

	BX.onCustomEvent(this, 'onWindowResizeFinished')
};

BX.CWindow.prototype.SetClose = function(elem)
{
	BX.bind(elem, 'click', BX.proxy(this.Close, this));
	this.ELEMENTS.close.push(elem);
};

BX.CWindow.prototype.SetDraggable = function(elem)
{
	BX.bind(elem, 'mousedown', BX.proxy(this.__startDrag, this));

	elem.style.cursor = 'move';

	this.ELEMENTS.draggable.push(elem);
	this.SETTINGS.draggable = true;
};

BX.CWindow.prototype.Move = function(x, y)
{
	var dxShadow = 1; // !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

	var left = parseInt(this.DIV.style.left)+x;
	var top = parseInt(this.DIV.style.top)+y;

	if (this.SETTINGS.drag_restrict)
	{
		//Left side
		if (left < 0)
			left = 0;

		//Right side
		var scrollSize = BX.GetWindowScrollSize();
		var floatWidth = this.DIV.offsetWidth;
		var floatHeight = this.DIV.offsetHeight;

		if (left > (scrollSize.scrollWidth - floatWidth - dxShadow))
			left = scrollSize.scrollWidth - floatWidth - dxShadow;

		if (top > (scrollSize.scrollHeight - floatHeight - dxShadow))
			top = scrollSize.scrollHeight - floatHeight - dxShadow;

		//Top side
		if (top < 0)
			top = 0;
	}

	this.DIV.style.left = left+'px';
	this.DIV.style.top = top+'px';

	//this.AdjustShadow(div);
};

BX.CWindow.prototype.__startDrag = function(e)
{
	if (!this.SETTINGS.draggable)
		return false;

	if(!e) e = window.event;

	this.x = e.clientX + document.body.scrollLeft;
	this.y = e.clientY + document.body.scrollTop;

	this.__bWasDragged = false;
	BX.bind(document, "mousemove", BX.proxy(this.__moveDrag, this));
	BX.bind(document, "mouseup", BX.proxy(this.__stopDrag, this));

	if(document.body.setCapture)
		document.body.setCapture();

	document.onmousedown = BX.False;

	var b = document.body;
	b.ondrag = b.onselectstart = BX.False;
	b.style.MozUserSelect = this.DIV.style.MozUserSelect = 'none';
	b.style.cursor = 'move';
	return BX.PreventDefault(e);
};

BX.CWindow.prototype.__moveDrag = function(e)
{
	if(!e) e = window.event;

	var x = e.clientX + document.body.scrollLeft;
	var y = e.clientY + document.body.scrollTop;

	if(this.x == x && this.y == y)
		return;

	this.Move((x - this.x), (y - this.y));
	this.x = x;
	this.y = y;

	if (!this.__bWasDragged)
	{
		BX.onCustomEvent(this, 'onWindowDragStart');
		this.__bWasDragged = true;
		BX.bind(BX.proxy_context, "click", BX.PreventDefault);
	}

	BX.onCustomEvent(this, 'onWindowDrag');
};

BX.CWindow.prototype.__stopDrag = function(e)
{
	if(document.body.releaseCapture)
		document.body.releaseCapture();

	BX.unbind(document, "mousemove", BX.proxy(this.__moveDrag, this));
	BX.unbind(document, "mouseup", BX.proxy(this.__stopDrag, this));

	document.onmousedown = null;

	var b = document.body;
	b.ondrag = b.onselectstart = null;
	b.style.MozUserSelect = this.DIV.style.MozUserSelect = '';
	b.style.cursor = '';

	if (this.__bWasDragged)
	{
		BX.onCustomEvent(this, 'onWindowDragFinished');
		var _proxy_context = BX.proxy_context;
		setTimeout(function(){BX.unbind(_proxy_context, "click", BX.PreventDefault)}, 100);
		this.__bWasDragged = false;
	}
	return BX.PreventDefault(e);
};

BX.CWindow.prototype.DenyClose = function()
{
	this.denyClose = true;
};

BX.CWindow.prototype.AllowClose = function()
{
	this.denyClose = false;
};

BX.CWindow.prototype.ShowError = function(str)
{
	BX.onCustomEvent(this, 'onWindowError', [str]);

	if (this._wait)
		BX.closeWait(this._wait);

	alert(str);
};

BX.CWindow.prototype.__set_msover = function() {this.MOUSEOVER = true;};
BX.CWindow.prototype.__unset_msover = function() {this.MOUSEOVER = false;};

/* dialog window class extends window class */
BX.CWindowDialog = function() {
	arguments[1] = 'dialog';
	BX.CWindowDialog.superclass.constructor.apply(this, arguments);

	this.DIV.style.top = '10px';
	this.OVERLAY = null;
};
BX.extend(BX.CWindowDialog, BX.CWindow);

BX.CWindowDialog.prototype.__resizeOverlay = function()
{
	var windowSize = BX.GetWindowScrollSize();
	this.OVERLAY.style.width = windowSize.scrollWidth + "px";
};

BX.CWindowDialog.prototype.CreateOverlay = function(zIndex)
{
	if (null == this.OVERLAY)
	{
		var windowSize = BX.GetWindowScrollSize();
		this.OVERLAY = document.body.appendChild(BX.create("DIV", {
			style: {
				position: 'absolute',
				top: '0px',
				left: '0px',
				zIndex: zIndex || (parseInt(this.DIV.style.zIndex)-2),
				width: windowSize.scrollWidth + "px",
				height: windowSize.scrollHeight + "px"
			}
		}));
	}

	return this.OVERLAY;
};

BX.CWindowDialog.prototype.Show = function()
{
	BX.CWindowDialog.superclass.Show.apply(this, arguments);

	this.CreateOverlay();

	this.OVERLAY.style.display = 'block';
	this.OVERLAY.style.zIndex = parseInt(this.DIV.style.zIndex)-2;

	BX.unbind(window, 'resize', BX.proxy(this.__resizeOverlay, this));
	BX.bind(window, 'resize', BX.proxy(this.__resizeOverlay, this));
};

BX.CWindowDialog.prototype.onUnRegister = function(clean)
{
	BX.CWindowDialog.superclass.onUnRegister.apply(this, arguments);

	if (this.clean)
	{
		if (this.OVERLAY.parentNode)
			this.OVERLAY.parentNode.removeChild(this.OVERLAY);
	}
	else
	{
		this.OVERLAY.style.display = 'none';
	}

	BX.unbind(window, 'resize', BX.proxy(this.__resizeOverlay, this));
};

/* standard bitrix dialog extends BX.CWindowDialog */
/*
	arParams = {
		(
			title: 'dialog title',
			head: 'head block html',
			content: 'dialog content',
			icon: 'head icon classname or filename',

			resize_id: 'some id to save resize information'// useless if resizable = false
		)
		or
		(
			content_url: url to content load
				loaded content scripts can use BX.WindowManager.Get() to get access to the current window object
		)

		height: window_height_in_pixels,
		width: window_width_in_pixels,

		draggable: true|false,
		resizable: true|false,

		min_height: min_window_height_in_pixels, // useless if resizable = false
		min_width: min_window_width_in_pixels, // useless if resizable = false

		buttons: [
			'html_code',
			BX.CDialog.btnSave, BX.CDialog.btnCancel, BX.CDialog.btnClose
		]
	}
*/
BX.CDialog = function(arParams)
{
	BX.CDialog.superclass.constructor.apply(this);

	this._sender = 'core_window_cdialog';

	this.PARAMS = arParams || {};

	for (var i in this.defaultParams)
	{
		if (typeof this.PARAMS[i] == 'undefined')
			this.PARAMS[i] = this.defaultParams[i];
	}

	this.PARAMS.width = (!isNaN(parseInt(this.PARAMS.width)))
		? this.PARAMS.width
		: this.defaultParams['width'];
	this.PARAMS.height = (!isNaN(parseInt(this.PARAMS.height)))
		? this.PARAMS.height
		: this.defaultParams['height'];

	if (this.PARAMS.resize_id || this.PARAMS.content_url)
	{
		var arSize = BX.WindowManager.getRuntimeWindowSize(this.PARAMS.resize_id || this.PARAMS.content_url);
		if (arSize)
		{
			this.PARAMS.width = arSize.width;
			this.PARAMS.height = arSize.height;
		}
	}

	BX.addClass(this.DIV, 'bx-core-adm-dialog');
	this.DIV.id = 'bx-admin-prefix';

	this.PARTS = {};

	this.DIV.style.height = null;
	this.DIV.style.width = null;

	this.PARTS.TITLEBAR = this.DIV.appendChild(BX.create('DIV', {props: {
			className: 'bx-core-adm-dialog-head'
		}
	}));

	this.PARTS.TITLE_CONTAINER = this.PARTS.TITLEBAR.appendChild(BX.create('SPAN', {
		props: {className: 'bx-core-adm-dialog-head-inner'},
		text: this.PARAMS.title
	}));

	this.PARTS.TITLEBAR_ICONS = this.PARTS.TITLEBAR.appendChild(BX.create('DIV', {
		props: {
			className: 'bx-core-adm-dialog-head-icons'
		},
		children: (this.PARAMS.resizable ? [
			BX.create('SPAN', {props: {className: 'bx-core-adm-icon-expand', title: BX.message('JS_CORE_WINDOW_EXPAND')}}),
			BX.create('SPAN', {props: {className: 'bx-core-adm-icon-close', title: BX.message('JS_CORE_WINDOW_CLOSE')}})
		] : [
			BX.create('SPAN', {props: {className: 'bx-core-adm-icon-close', title: BX.message('JS_CORE_WINDOW_CLOSE')}})
		])
	}));


	this.PARTS.CONTENT = this.DIV.appendChild(BX.create('DIV', {
		props: {className: 'bx-core-adm-dialog-content-wrap adm-workarea'}
	}));

	this.PARTS.CONTENT_DATA = this.PARTS.CONTENT.appendChild(BX.create('DIV', {
		props: {className: 'bx-core-adm-dialog-content'},
		style: {
			height: this.PARAMS.height + 'px',
			width: this.PARAMS.width + 'px'
		}
	}));

	this.PARTS.HEAD = this.PARTS.CONTENT_DATA.appendChild(BX.create('DIV', {
		props: {
			className: 'bx-core-adm-dialog-head-block' + (this.PARAMS.icon ? ' ' + this.PARAMS.icon : '')
		}
	}));

	this.SetHead(this.PARAMS.head);
	this.SetContent(this.PARAMS.content);
	this.SetTitle(this.PARAMS.title);
	this.SetClose(this.PARTS.TITLEBAR_ICONS.lastChild);

	if (this.PARAMS.resizable)
	{
		this.SetExpand(this.PARTS.TITLEBAR_ICONS.firstChild);
		this.SetExpand(this.PARTS.TITLEBAR, 'dblclick');

		BX.addCustomEvent(this, 'onWindowExpand', BX.proxy(this.__onexpand, this));
		BX.addCustomEvent(this, 'onWindowNarrow', BX.proxy(this.__onexpand, this));
	}

	this.PARTS.FOOT = this.PARTS.BUTTONS_CONTAINER = this.PARTS.CONTENT.appendChild(BX.create('DIV', {
			props: {
				className: 'bx-core-adm-dialog-buttons'
			},
			// events: {
			// 	'click': BX.delegateEvent({property:{type: /button|submit/}}, BX.delegate(function() {this.showWait(BX.proxy_context)}, this))
			// },
			children: this.ShowButtons()
		}
	));

	if (this.PARAMS.draggable)
		this.SetDraggable(this.PARTS.TITLEBAR);

	if (this.PARAMS.resizable)
	{
		this.PARTS.RESIZER = this.DIV.appendChild(BX.create('DIV', {
			props: {className: 'bx-core-resizer'}
		}));

		this.SetResize(this.PARTS.RESIZER);

		this.SETTINGS.min_width = this.PARAMS.min_width;
		this.SETTINGS.min_height = this.PARAMS.min_height;
	}

	this.auth_callback = BX.delegate(function(){
		this.PARAMS.content = '';
		this.hideNotify();
		this.Show();
	}, this)
};
BX.extend(BX.CDialog, BX.CWindowDialog);

BX.CDialog.prototype.defaultParams = {
	width: 700,
	height: 400,
	min_width: 500,
	min_height: 300,

	resizable: true,
	draggable: true,

	title: '',
	icon: ''
};

BX.CDialog.prototype.showWait = function(el)
{
	if (BX.type.isElementNode(el) && (el.type == 'button' || el.type == 'submit'))
	{
		BX.defer(function(){el.disabled = true})();

		var bSave = (BX.hasClass(el, 'adm-btn-save') || BX.hasClass(el, 'adm-btn-save')),
			pos = BX.pos(el, true);

		el.bxwaiter = this.PARTS.FOOT.appendChild(BX.create('DIV', {
			props: {className: 'adm-btn-load-img' + (bSave ? '-green' : '')},
			style: {
				top: parseInt((pos.bottom + pos.top)/2 - 10) + 'px',
				left: parseInt((pos.right + pos.left)/2 - 10) + 'px'
			}
		}));

		BX.addClass(el, 'adm-btn-load');

		this.lastWaitElement = el;

		return el.bxwaiter;
	}
	return null;
};

BX.CDialog.prototype.closeWait = function(el)
{
	el = el || this.lastWaitElement;

	if (BX.type.isElementNode(el))
	{
		if (el.bxwaiter)
		{
			if(el.bxwaiter.parentNode)
			{
				el.bxwaiter.parentNode.removeChild(el.bxwaiter);
			}

			el.bxwaiter = null;
		}

		el.disabled = false;
		BX.removeClass(el, 'adm-btn-load');

		if (this.lastWaitElement == el)
			this.lastWaitElement = null;
	}
};

BX.CDialog.prototype.Authorize = function(arAuthResult)
{
	this.bSkipReplaceContent = true;
	this.ShowError(BX.message('JSADM_AUTH_REQ'));

	BX.onCustomEvent(this, 'onWindowError', []);

	BX.closeWait();

	(new BX.CAuthDialog({
		content_url: this.PARAMS.content_url,
		auth_result: arAuthResult,
		callback: BX.delegate(function(){
			if (this.auth_callback)
				this.auth_callback()
		}, this)
	})).Show();
};

BX.CDialog.prototype.ShowError = function(str)
{
	BX.onCustomEvent(this, 'onWindowError', [str]);

	this.closeWait();

	if (this._wait)
		BX.closeWait(this._wait);

	this.Notify(str, true);
};


BX.CDialog.prototype.__expandGetSize = function()
{
	var pDocElement = BX.GetDocElement();
	pDocElement.style.overflow = 'hidden';

	var wndSize = BX.GetWindowInnerSize();

	pDocElement.scrollTop = 0;

	this.DIV.style.top = '-' + this.dxShadow + 'px';
	this.DIV.style.left = '-' + this.dxShadow + 'px';

	return {
		width: (wndSize.innerWidth - parseInt(BX.style(this.PARTS.CONTENT, 'padding-right')) - parseInt(BX.style(this.PARTS.CONTENT, 'padding-left'))) + this.dxShadow,
		height: (wndSize.innerHeight - this.PARTS.TITLEBAR.offsetHeight - this.PARTS.FOOT.offsetHeight - parseInt(BX.style(this.PARTS.CONTENT, 'padding-top')) - parseInt(BX.style(this.PARTS.CONTENT, 'padding-bottom'))) + this.dxShadow
	};
};

BX.CDialog.prototype.__expand = function()
{
	var pDocElement = BX.GetDocElement();
	this.dxShadow = 2;

	if (!this.bExpanded)
	{
		var wndScroll = BX.GetWindowScrollPos();

		this.__expand_settings = {
			resizable: this.SETTINGS.resizable,
			draggable: this.SETTINGS.draggable,
			width: this.PARTS.CONTENT_DATA.style.width,
			height: this.PARTS.CONTENT_DATA.style.height,
			left: this.DIV.style.left,
			top: this.DIV.style.top,
			scrollTop: wndScroll.scrollTop,
			scrollLeft: wndScroll.scrollLeft,
			overflow: BX.style(pDocElement, 'overflow')
		};

		this.SETTINGS.resizable = false;
		this.SETTINGS.draggable = false;

		var pos = this.__expandGetSize();

		this.PARTS.CONTENT_DATA.style.width = pos.width + 'px';
		this.PARTS.CONTENT_DATA.style.height = pos.height + 'px';

		window.scrollTo(0,0);
		pDocElement.style.overflow = 'hidden';

		this.bExpanded = true;

		BX.onCustomEvent(this, 'onWindowExpand');
		BX.onCustomEvent(this, 'onWindowResize');
		BX.onCustomEvent(this, 'onWindowResizeExt', [{'width': pos.width, 'height': pos.height}]);

		BX.bind(window, 'resize', BX.proxy(this.__expand_onresize, this));
	}
	else
	{
		BX.unbind(window, 'resize', BX.proxy(this.__expand_onresize, this));

		this.SETTINGS.resizable = this.__expand_settings.resizable;
		this.SETTINGS.draggable = this.__expand_settings.draggable;

		pDocElement.style.overflow = this.__expand_settings.overflow;

		this.DIV.style.top = this.__expand_settings.top;
		this.DIV.style.left = this.__expand_settings.left;
		this.PARTS.CONTENT_DATA.style.width = this.__expand_settings.width;
		this.PARTS.CONTENT_DATA.style.height = this.__expand_settings.height;
		window.scrollTo(this.__expand_settings.scrollLeft, this.__expand_settings.scrollTop);
		this.bExpanded = false;

		BX.onCustomEvent(this, 'onWindowNarrow');
		BX.onCustomEvent(this, 'onWindowResize');
		BX.onCustomEvent(this, 'onWindowResizeExt', [{'width': parseInt(this.__expand_settings.width), 'height': parseInt(this.__expand_settings.height)}]);
	}
};

BX.CDialog.prototype.__expand_onresize = function()
{
	var pos = this.__expandGetSize();

	this.PARTS.CONTENT_DATA.style.width = pos.width + 'px';
	this.PARTS.CONTENT_DATA.style.height = pos.height + 'px';

	BX.onCustomEvent(this, 'onWindowResize');
	BX.onCustomEvent(this, 'onWindowResizeExt', [pos]);
};

BX.CDialog.prototype.__onexpand = function()
{
	var ob = this.PARTS.TITLEBAR_ICONS.firstChild;
	ob.className = BX.toggle(ob.className, ['bx-core-adm-icon-expand', 'bx-core-adm-icon-narrow']);
	ob.title = BX.toggle(ob.title, [BX.message('JS_CORE_WINDOW_EXPAND'), BX.message('JS_CORE_WINDOW_NARROW')]);

	if (this.PARTS.RESIZER)
	{
		this.PARTS.RESIZER.style.display = this.bExpanded ? 'none' : 'block';
	}
};


BX.CDialog.prototype.__startResize = function(e)
{
	if (!this.SETTINGS.resizable)
		return false;

	if(!e) e = window.event;

	this.wndSize = BX.GetWindowScrollPos();
	this.wndSize.innerWidth = BX.GetWindowInnerSize().innerWidth;

	this.pos = BX.pos(this.PARTS.CONTENT_DATA);

	this.x = e.clientX + this.wndSize.scrollLeft;
	this.y = e.clientY + this.wndSize.scrollTop;

	this.dx = this.pos.left + this.pos.width - this.x;
	this.dy = this.pos.top + this.pos.height - this.y;


	// TODO: suspicious
	this.dw = this.pos.width - parseInt(this.PARTS.CONTENT_DATA.style.width) + parseInt(BX.style(this.PARTS.CONTENT, 'padding-right'));

	BX.bind(document, "mousemove", BX.proxy(this.__moveResize, this));
	BX.bind(document, "mouseup", BX.proxy(this.__stopResize, this));

	if(document.body.setCapture)
		document.body.setCapture();

	document.onmousedown = BX.False;

	var b = document.body;
	b.ondrag = b.onselectstart = BX.False;
	b.style.MozUserSelect = this.DIV.style.MozUserSelect = 'none';
	b.style.cursor = 'se-resize';

	BX.onCustomEvent(this, 'onWindowResizeStart');

	return true;
};

BX.CDialog.prototype.Resize = function(x, y)
{
	var new_width = Math.max(x - this.pos.left + this.dx, this.SETTINGS.min_width);
	var new_height = Math.max(y - this.pos.top + this.dy, this.SETTINGS.min_height);

	if (this.SETTINGS.resize_restrict)
	{
		var scrollSize = BX.GetWindowScrollSize();

		if (this.pos.left + new_width > scrollSize.scrollWidth - this.dw)
			new_width = scrollSize.scrollWidth - this.pos.left - this.dw;
	}

	this.PARTS.CONTENT_DATA.style.width = new_width + 'px';
	this.PARTS.CONTENT_DATA.style.height = new_height + 'px';

	BX.onCustomEvent(this, 'onWindowResize');
	BX.onCustomEvent(this, 'onWindowResizeExt', [{'height': new_height, 'width': new_width}]);
};

BX.CDialog.prototype.SetSize = function(obSize)
{
	this.PARTS.CONTENT_DATA.style.width = obSize.width + 'px';
	this.PARTS.CONTENT_DATA.style.height = obSize.height + 'px';

	BX.onCustomEvent(this, 'onWindowResize');
	BX.onCustomEvent(this, 'onWindowResizeExt', [obSize]);
};

BX.CDialog.prototype.GetParameters = function(form_name)
{
	var form = this.GetForm();

	if(!form)
		return "";

	var i, s = "";
	var n = form.elements.length;

	var delim = '';
	for(i=0; i<n; i++)
	{
		if (s != '') delim = '&';
		var el = form.elements[i];
		if (el.disabled)
			continue;

		switch(el.type.toLowerCase())
		{
			case 'text':
			case 'textarea':
			case 'password':
			case 'hidden':
				if (null == form_name && el.name.substr(el.name.length-4) == '_alt' && form.elements[el.name.substr(0, el.name.length-4)])
					break;
				s += delim + el.name + '=' + BX.util.urlencode(el.value);
				break;
			case 'radio':
				if(el.checked)
					s += delim + el.name + '=' + BX.util.urlencode(el.value);
				break;
			case 'checkbox':
				s += delim + el.name + '=' + BX.util.urlencode(el.checked ? 'Y':'N');
				break;
			case 'select-one':
				var val = "";
				if (null == form_name && form.elements[el.name + '_alt'] && el.selectedIndex == 0)
					val = form.elements[el.name+'_alt'].value;
				else
					val = el.value;
				s += delim + el.name + '=' + BX.util.urlencode(val);
				break;
			case 'select-multiple':
				var j, bAdded = false;
				var l = el.options.length;
				for (j=0; j<l; j++)
				{
					if (el.options[j].selected)
					{
						s += delim + el.name + '=' + BX.util.urlencode(el.options[j].value);
						bAdded = true;
					}
				}
				if (!bAdded)
					s += delim + el.name + '=';
				break;
			default:
				break;
		}
	}

	return s;
};

BX.CDialog.prototype.PostParameters = function(params)
{
	var url = this.PARAMS.content_url;

	if (null == params)
		params = "";

	params += (params == "" ? "" : "&") + "bxsender=" + this._sender;

	var index = url.indexOf('?');
	if (index == -1)
		url += '?' + params;
	else
		url = url.substring(0, index) + '?' + params + "&" + url.substring(index+1);

	BX.showWait();

	this.auth_callback = BX.delegate(function(){
		this.hideNotify();
		this.PostParameters(params);
	}, this);

	BX.ajax.post(url, this.GetParameters(), BX.delegate(function(result) {
		BX.closeWait();
		if (!this.bSkipReplaceContent)
		{
			this.ClearButtons(); // buttons are appended during form reload, so we should clear footer
			this.SetContent(result);
			this.Show(true);
		}

		this.bSkipReplaceContent = false;
	}, this));
};

BX.CDialog.prototype.Submit = function(params, url)
{
	var FORM = this.GetForm();
	if (FORM)
	{
		FORM.onsubmit = null;

		FORM.method = 'POST';
		if (!FORM.action || url)
		{
			url = url || this.PARAMS.content_url;
			if (null != params)
			{
				var index = url.indexOf('?');
				if (index == -1)
					url += '?' + params;
				else
					url = url.substring(0, index) + '?' + params + "&" + url.substring(index+1);
			}

			FORM.action = url;
		}

		if (!FORM._bxsender)
		{
			FORM._bxsender = FORM.appendChild(BX.create('INPUT', {
				attrs: {
					type: 'hidden',
					name: 'bxsender',
					value: this._sender
				}
			}));
		}

		this._wait = BX.showWait();

		this.auth_callback = BX.delegate(function(){
			this.hideNotify();
			this.Submit(params);
		}, this);

		BX.ajax.submit(FORM, BX.delegate(function(){this.closeWait()}, this));
	}
	else
	{
		alert('no form registered!');
	}
};

BX.CDialog.prototype.GetForm = function()
{
	if (null == this.__form)
	{
		var forms = this.PARTS.CONTENT_DATA.getElementsByTagName('FORM');
		this.__form = forms[0] ? forms[0] : null;
	}

	return this.__form;
};

BX.CDialog.prototype.GetRealForm = function()
{
	if (null == this.__rform)
	{
		var forms = this.PARTS.CONTENT_DATA.getElementsByTagName('FORM');
		this.__rform = forms[1] ? forms[1] : (forms[0] ? forms[0] : null);
	}

	return this.__rform;
};

BX.CDialog.prototype._checkButton = function(btn)
{
	var arCustomButtons = ['btnSave', 'btnCancel', 'btnClose'];

	for (var i = 0; i < arCustomButtons.length; i++)
	{
		if (this[arCustomButtons[i]] && (btn == this[arCustomButtons[i]]))
			return arCustomButtons[i];
	}

	return false;
};

BX.CDialog.prototype.ShowButtons = function()
{
	var result = [];
	if (this.PARAMS.buttons)
	{
		if (this.PARAMS.buttons.title) this.PARAMS.buttons = [this.PARAMS.buttons];

		for (var i=0, len=this.PARAMS.buttons.length; i<len; i++)
		{
			if (BX.type.isNotEmptyString(this.PARAMS.buttons[i]))
			{
				result.push(this.PARAMS.buttons[i]);
			}
			else if (this.PARAMS.buttons[i])
			{
				//if (!(this.PARAMS.buttons[i] instanceof BX.CWindowButton))
				if (!BX.is_subclass_of(this.PARAMS.buttons[i], BX.CWindowButton))
				{
					var b = this._checkButton(this.PARAMS.buttons[i]); // hack to set links to real CWindowButton object in btnSave etc;
					this.PARAMS.buttons[i] = new BX.CWindowButton(this.PARAMS.buttons[i]);
					if (b) this[b] = this.PARAMS.buttons[i];
				}

				result.push(this.PARAMS.buttons[i].Button(this));
			}
		}
	}

	return result;
};

BX.CDialog.prototype.setAutosave = function () {
	if (!this.bSetAutosaveDelay)
	{
		this.bSetAutosaveDelay = true;
		setTimeout(BX.proxy(this.setAutosave, this), 10);
	}
};

BX.CDialog.prototype.SetTitle = function(title)
{
	this.PARAMS.title = title;
	BX.cleanNode(this.PARTS.TITLE_CONTAINER).appendChild(document.createTextNode(this.PARAMS.title));
};

BX.CDialog.prototype.SetHead = function(head)
{
	this.PARAMS.head = BX.util.trim(head);
	this.PARTS.HEAD.innerHTML = this.PARAMS.head || "&nbsp;";
	this.PARTS.HEAD.style.display = this.PARAMS.head ? 'block' : 'none';
	this.adjustSize();
};

BX.CDialog.prototype.Notify = function(note, bError)
{
	if (!this.PARTS.NOTIFY)
	{
		this.PARTS.NOTIFY = this.DIV.insertBefore(BX.create('DIV', {
			props: {className: 'adm-warning-block'},
			children: [
				BX.create('SPAN', {
					props: {className: 'adm-warning-text'}
				}),
				BX.create('SPAN', {
					props: {className: 'adm-warning-icon'}
				}),
				BX.create('SPAN', {
					props: {className: 'adm-warning-close'},
					events: {click: BX.proxy(this.hideNotify, this)}
				})
			]
		}), this.DIV.firstChild);
	}

	if (bError)
		BX.addClass(this.PARTS.NOTIFY, 'adm-warning-block-red');
	else
		BX.removeClass(this.PARTS.NOTIFY, 'adm-warning-block-red');

	this.PARTS.NOTIFY.firstChild.innerHTML = note || '&nbsp;';
	this.PARTS.NOTIFY.firstChild.style.width = (this.PARAMS.width-50) + 'px';
	BX.removeClass(this.PARTS.NOTIFY, 'adm-warning-animate');
};

BX.CDialog.prototype.hideNotify = function()
{
	BX.addClass(this.PARTS.NOTIFY, 'adm-warning-animate');
};

BX.CDialog.prototype.__adjustHeadToIcon = function()
{
	if (!this.PARTS.HEAD.offsetHeight)
	{
		setTimeout(BX.delegate(this.__adjustHeadToIcon, this), 50);
	}
	else
	{
		if (this.icon_image && this.icon_image.height && this.icon_image.height > this.PARTS.HEAD.offsetHeight - 5)
		{
			this.PARTS.HEAD.style.height = this.icon_image.height + 5 + 'px';
			this.adjustSize();
		}

		this.icon_image.onload = null;
		this.icon_image = null;
	}
};

BX.CDialog.prototype.SetIcon = function(icon_class)
{
	if (this.PARAMS.icon != icon_class)
	{
		if (this.PARAMS.icon)
			BX.removeClass(this.PARTS.HEAD, this.PARAMS.icon);

		this.PARAMS.icon = icon_class;

		if (this.PARAMS.icon)
		{
			BX.addClass(this.PARTS.HEAD, this.PARAMS.icon);

			var icon_file = (BX.style(this.PARTS.HEAD, 'background-image') || BX.style(this.PARTS.HEAD, 'backgroundImage'));
			if (BX.type.isNotEmptyString(icon_file) && icon_file != 'none')
			{
				var match = icon_file.match(new RegExp('url\\s*\\(\\s*(\'|"|)(.+?)(\\1)\\s*\\)'));
				if(match)
				{
					icon_file = match[2];
					if (BX.type.isNotEmptyString(icon_file))
					{
						this.icon_image = new Image();
						this.icon_image.onload = BX.delegate(this.__adjustHeadToIcon, this);
						this.icon_image.src = icon_file;
					}
				}
			}
		}
	}
	this.adjustSize();
};

BX.CDialog.prototype.SetIconFile = function(icon_file)
{
	this.icon_image = new Image();
	this.icon_image.onload = BX.delegate(this.__adjustHeadToIcon, this);
	this.icon_image.src = icon_file;

	BX.adjust(this.PARTS.HEAD, {style: {backgroundImage: 'url(' + icon_file + ')', backgroundPosition: 'right 9px'/*'99% center'*/}});
	this.adjustSize();
};

/*
BUTTON: {
	title: 'title',
	'action': function executed in window object context
}
BX.CDialog.btnSave || BX.CDialog.btnCancel - standard buttons
*/

BX.CDialog.prototype.SetButtons = function(a)
{
	if (BX.type.isString(a))
	{
		if (a.length > 0)
		{
			this.PARTS.BUTTONS_CONTAINER.innerHTML += a;

			var btns = this.PARTS.BUTTONS_CONTAINER.getElementsByTagName('INPUT');
			if (btns.length > 0)
			{
				this.PARAMS.buttons = [];
				for (var i = 0; i < btns.length; i++)
				{
					this.PARAMS.buttons.push(new BX.CWindowButton({btn: btns[i], parentWindow: this}));
				}
			}
		}
	}
	else
	{
		this.PARAMS.buttons = a;
		BX.adjust(this.PARTS.BUTTONS_CONTAINER, {
			children: this.ShowButtons()
		});
	}
	this.adjustSize();
};

BX.CDialog.prototype.ClearButtons = function()
{
	BX.cleanNode(this.PARTS.BUTTONS_CONTAINER);
	this.adjustSize();
};

BX.CDialog.prototype.SetContent = function(html)
{
	this.__form = null;

	if (BX.type.isElementNode(html))
	{
		if (html.parentNode)
			html.parentNode.removeChild(html);
	}
	else if (BX.type.isString(html))
	{
		html = BX.create('DIV', {html: html});
	}

	this.PARAMS.content = html;
	BX.cleanNode(this.PARTS.CONTENT_DATA);

	BX.adjust(this.PARTS.CONTENT_DATA, {
		children: [
			this.PARTS.HEAD,
			BX.create('DIV', {
				props: {
					className: 'bx-core-adm-dialog-content-wrap-inner'
				},
				children: [this.PARAMS.content]
			})
		]
	});

	if (this.PARAMS.content_url && this.GetForm())
	{
		this.__form.submitbtn = this.__form.appendChild(BX.create('INPUT', {props:{type:'submit'},style:{display:'none'}}));
		this.__form.onsubmit = BX.delegate(this.__submit, this);
	}
};

BX.CDialog.prototype.__submit = function(e)
{
	for (var i=0,len=this.PARAMS.buttons.length; i<len; i++)
	{
		if (
			this.PARAMS.buttons[i]
			&& (
				this.PARAMS.buttons[i].name && /save|apply/i.test(this.PARAMS.buttons[i].name)
				||
				this.PARAMS.buttons[i].btn && this.PARAMS.buttons[i].btn.name && /save|apply/i.test(this.PARAMS.buttons[i].btn.name)
			)
		)
		{
			this.PARAMS.buttons[i].emulate();
			break;
		}
	}

	return BX.PreventDefault(e);
};

BX.CDialog.prototype.SwapContent = function(cont)
{
	cont = BX(cont);

	BX.cleanNode(this.PARTS.CONTENT_DATA);
	cont.parentNode.removeChild(cont);
	this.PARTS.CONTENT_DATA.appendChild(cont);
	cont.style.display = 'block';
	this.SetContent(cont.innerHTML);
};

// this method deprecated
BX.CDialog.prototype.adjustSize = function()
{
};

// this method deprecated
BX.CDialog.prototype.__adjustSize = function()
{
};

BX.CDialog.prototype.adjustSizeEx = function()
{
	BX.defer(this.__adjustSizeEx, this)();
};

BX.CDialog.prototype.__adjustSizeEx = function()
{
	var ob = this.PARTS.CONTENT_DATA.firstChild, new_height = 0;
	while (ob)
	{
		new_height += ob.offsetHeight
			+ parseInt(BX.style(ob, 'margin-top'))
			+ parseInt(BX.style(ob, 'margin-bottom'));

		ob = BX.nextSibling(ob);
	}

	if (new_height)
		this.PARTS.CONTENT_DATA.style.height = new_height + 'px';
};


BX.CDialog.prototype.__onResizeFinished = function()
{
	BX.WindowManager.saveWindowSize(
		this.PARAMS.resize_id || this.PARAMS.content_url, {height: parseInt(this.PARTS.CONTENT_DATA.style.height), width: parseInt(this.PARTS.CONTENT_DATA.style.width)}
	);
};

BX.CDialog.prototype.Show = function(bNotRegister)
{
	if ((!this.PARAMS.content) && this.PARAMS.content_url && BX.ajax && !bNotRegister)
	{
		var wait = BX.showWait();

		BX.WindowManager.currently_loaded = this;

		this.CreateOverlay(parseInt(BX.style(wait, 'z-index'))-1);
		this.OVERLAY.style.display = 'block';
		this.OVERLAY.className = 'bx-core-dialog-overlay';

		var post_data = '', method = 'GET';
		if (this.PARAMS.content_post)
		{
			post_data = this.PARAMS.content_post;
			method = 'POST';
		}

		var url = this.PARAMS.content_url
			+ (this.PARAMS.content_url.indexOf('?')<0?'?':'&')+'bxsender=' + this._sender;

		this.auth_callback = BX.delegate(function(){
			this.PARAMS.content = '';
			this.hideNotify();
			this.Show();
		}, this);

		BX.ajax({
			method: method,
			dataType: 'html',
			url: url,
			data: post_data,
			onsuccess: BX.delegate(function(data) {
				BX.closeWait(null, wait);

				this.SetContent(data || '&nbsp;');
				this.Show();
			}, this),
			processScriptsConsecutive: true
		});
	}
	else
	{
		BX.WindowManager.currently_loaded = null;
		BX.CDialog.superclass.Show.apply(this, arguments);

		this.adjustPos();

		this.OVERLAY.className = 'bx-core-dialog-overlay';

		this.__adjustSize();

		BX.addCustomEvent(this, 'onWindowResize', BX.proxy(this.__adjustSize, this));

		if (this.PARAMS.resizable && (this.PARAMS.content_url || this.PARAMS.resize_id))
			BX.addCustomEvent(this, 'onWindowResizeFinished', BX.delegate(this.__onResizeFinished, this));
	}
};

BX.CDialog.prototype.GetInnerPos = function()
{
	return {'width': parseInt(this.PARTS.CONTENT_DATA.style.width), 'height': parseInt(this.PARTS.CONTENT_DATA.style.height)};
};

BX.CDialog.prototype.adjustPos = function()
{
	if (!this.bExpanded)
	{
		var windowSize = BX.GetWindowInnerSize();
		var windowScroll = BX.GetWindowScrollPos();

		BX.adjust(this.DIV, {
			style: {
				left: parseInt(windowScroll.scrollLeft + windowSize.innerWidth / 2 - parseInt(this.DIV.offsetWidth) / 2) + 'px',
				top: Math.max(parseInt(windowScroll.scrollTop + windowSize.innerHeight / 2 - parseInt(this.DIV.offsetHeight) / 2), 0) + 'px'
			}
		});
	}
};

BX.CDialog.prototype.GetContent = function () {return this.PARTS.CONTENT_DATA};

BX.CDialog.prototype.btnSave = BX.CDialog.btnSave = {
	title: BX.message('JS_CORE_WINDOW_SAVE'),
	id: 'savebtn',
	name: 'savebtn',
	className: BX.browser.IsIE() && BX.browser.IsDoctype() && !BX.browser.IsIE10() ? '' : 'adm-btn-save',
	action: function () {
		this.disableUntilError();
		this.parentWindow.PostParameters();
	}
};

BX.CDialog.prototype.btnCancel = BX.CDialog.btnCancel = {
	title: BX.message('JS_CORE_WINDOW_CANCEL'),
	id: 'cancel',
	name: 'cancel',
	action: function () {
		this.parentWindow.Close();
	}
};

BX.CDialog.prototype.btnClose = BX.CDialog.btnClose = {
	title: BX.message('JS_CORE_WINDOW_CLOSE'),
	id: 'close',
	name: 'close',
	action: function () {
		this.parentWindow.Close();
	}
};

/* special child for admin forms loaded into public page */
BX.CAdminDialog = function(arParams)
{
	BX.CAdminDialog.superclass.constructor.apply(this, arguments);

	this._sender = 'core_window_cadmindialog';

	BX.addClass(this.DIV, 'bx-core-adm-admin-dialog');

	this.PARTS.CONTENT.insertBefore(this.PARTS.HEAD, this.PARTS.CONTENT.firstChild);
	this.PARTS.HEAD.className = 'bx-core-adm-dialog-tabs';
};
BX.extend(BX.CAdminDialog, BX.CDialog);

BX.CAdminDialog.prototype.SetHead = function()
{
	BX.CAdminDialog.superclass.SetHead.apply(this, arguments);

	if (this.PARTS.HEAD.firstChild && BX.type.isElementNode(this.PARTS.HEAD.firstChild))
	{
		var ob = this.PARTS.HEAD.firstChild, new_width = 0;
		while (ob)
		{
			new_width += ob.offsetWidth
				+ parseInt(BX.style(ob, 'margin-left'))
				+ parseInt(BX.style(ob, 'margin-right'));

			ob = BX.nextSibling(ob);
		}

		this.SETTINGS.min_width = Math.max(new_width, this.SETTINGS.min_width) - 2;
		if (this.PARAMS.width < this.SETTINGS.min_width)
		{
			BX.adjust(this.PARTS.CONTENT_DATA, {
				style: {
					width: this.SETTINGS.min_width + 'px'
				}
			});
		}
	}
};

BX.CAdminDialog.prototype.SetContent = function(html)
{
	this.__form = null;

	if (BX.type.isElementNode(html))
	{
		if (html.parentNode)
			html.parentNode.removeChild(html);
	}

	this.PARAMS.content = html;
	BX.cleanNode(this.PARTS.CONTENT_DATA);

	BX.adjust(this.PARTS.CONTENT_DATA, {
		children: [
			this.PARAMS.content || '&nbsp;'
		]
	});

	if (this.PARAMS.content_url && this.GetForm())
	{
		this.__form.appendChild(BX.create('INPUT', {props:{type:'submit'},style:{display:'none'}}));
		this.__form.onsubmit = BX.delegate(this.__submit, this);
	}
};

BX.CAdminDialog.prototype.__adjustSizeEx = function()
{
	var new_height = BX.firstChild(this.PARTS.CONTENT_DATA).offsetHeight;
	if (new_height)
		this.PARTS.CONTENT_DATA.style.height = new_height + 'px';
};

BX.CAdminDialog.prototype.__expandGetSize = function()
{
	var res = BX.CAdminDialog.superclass.__expandGetSize.apply(this, arguments);

	res.width -= parseInt(BX.style(this.PARTS.CONTENT_DATA, 'padding-right')) + parseInt(BX.style(this.PARTS.CONTENT_DATA, 'padding-left'));
	res.height -= parseInt(BX.style(this.PARTS.CONTENT_DATA, 'padding-top')) + parseInt(BX.style(this.PARTS.CONTENT_DATA, 'padding-bottom'));

	res.height -= this.PARTS.HEAD.offsetHeight;

	return res;
};

BX.CAdminDialog.prototype.Submit = function()
{
	var FORM = this.GetForm();
	if (FORM && !FORM['bxpublic'] && !/bxpublic=/.test(FORM.action))
	{
		FORM.appendChild(BX.create('INPUT', {
			props: {
				type: 'hidden',
				name: 'bxpublic',
				value: 'Y'
			}
		}));
	}

	return BX.CAdminDialog.superclass.Submit.apply(this, arguments);
};

BX.CAdminDialog.prototype.btnSave = BX.CAdminDialog.btnSave = {
	title: BX.message('JS_CORE_WINDOW_SAVE'),
	id: 'savebtn',
	name: 'savebtn',
	className: 'adm-btn-save',
	action: function () {
		this.disableUntilError();
		this.parentWindow.Submit();
	}
};

BX.CAdminDialog.btnCancel = BX.CAdminDialog.superclass.btnCancel;
BX.CAdminDialog.btnClose = BX.CAdminDialog.superclass.btnClose;

BX.CDebugDialog = function(arParams)
{
	BX.CDebugDialog.superclass.constructor.apply(this, arguments);
};
BX.extend(BX.CDebugDialog, BX.CDialog);

BX.CDebugDialog.prototype.ShowDetails = function(div_id)
{
	var div = BX(div_id);
	if (div)
	{
		if (this.div_detail_current)
			this.div_detail_current.style.display = 'none';

		div.style.display = 'block';
		this.div_detail_current = div;
	}
};

BX.CDebugDialog.prototype.SetContent = function(html)
{
	if (!html)
		return;

	var arHtml = html.split('#DIVIDER#');
	if (arHtml.length > 1)
	{
		this.PARAMS.content = arHtml[1];

		this.PARTS.CONTENT_DATA.style.overflow = 'hidden';

		BX.CDebugDialog.superclass.SetContent.apply(this, [arHtml[1]]);

		this.PARTS.CONTENT_INNER = this.PARTS.CONTENT_DATA.firstChild.nextSibling;
		this.PARTS.CONTENT_TOP = this.PARTS.CONTENT_DATA.insertBefore(BX.create('DIV', {
			props: {
				className: 'bx-debug-content-top'
			},
			html: arHtml[0]
		}), this.PARTS.CONTENT_INNER);
		this.PARTS.CONTENT_INNER.style.overflow = 'auto';
	}
	else
	{
		BX.CDebugDialog.superclass.SetContent.apply(this, arguments);
	}
};

BX.CDebugDialog.prototype.__adjustSize = function()
{
	BX.CDebugDialog.superclass.__adjustSize.apply(this, arguments);

	if (this.PARTS.CONTENT_TOP)
	{
		var new_height = this.PARTS.CONTENT_DATA.offsetHeight - this.PARTS.HEAD.offsetHeight - this.PARTS.CONTENT_TOP.offsetHeight - 38;

		if (new_height > 0)
		{
			this.PARTS.CONTENT_INNER.style.height = new_height + 'px';
		}
	}
};


/* class for dialog window with editors */

BX.CEditorDialog = function(arParams)
{
	BX.CEditorDialog.superclass.constructor.apply(this, arguments);

	BX.removeClass(this.PARTS.CONTENT, 'bx-core-adm-dialog-content-wrap');
	BX.removeClass(this.PARTS.CONTENT_DATA, 'bx-core-adm-dialog-content');

	BX.removeClass(this.PARTS.CONTENT_DATA.lastChild, 'bx-core-adm-dialog-content-wrap-inner');
	BX.removeClass(this.PARTS.BUTTONS_CONTAINER, 'bx-core-adm-dialog-buttons');

	BX.addClass(this.PARTS.CONTENT, 'bx-core-editor-dialog-content-wrap');
	BX.addClass(this.PARTS.CONTENT_DATA, 'bx-core-editor-dialog-content');
	BX.addClass(this.PARTS.BUTTONS_CONTAINER, 'bx-core-editor-dialog-buttons');
};
BX.extend(BX.CEditorDialog, BX.CDialog);

BX.CEditorDialog.prototype.SetContent  = function()
{
	BX.CEditorDialog.superclass.SetContent.apply(this, arguments);

	BX.removeClass(this.PARTS.CONTENT_DATA.lastChild, 'bx-core-adm-dialog-content-wrap-inner');
};

/* class for wizards in admin section */
BX.CWizardDialog = function(arParams)
{
	BX.CWizardDialog.superclass.constructor.apply(this, arguments);

	BX.removeClass(this.PARTS.CONTENT, 'bx-core-adm-dialog-content-wrap');
	BX.removeClass(this.PARTS.CONTENT_DATA, 'bx-core-adm-dialog-content');
	BX.removeClass(this.PARTS.CONTENT_DATA.lastChild, 'bx-core-adm-dialog-content-wrap-inner');
	BX.removeClass(this.PARTS.BUTTONS_CONTAINER, 'bx-core-adm-dialog-buttons');

	BX.addClass(this.PARTS.CONTENT, 'bx-core-wizard-dialog-content-wrap');
};

BX.extend(BX.CWizardDialog, BX.CDialog);

/* class for auth dialog */
BX.CAuthDialog = function(arParams)
{
	arParams.resizable = false;
	arParams.width = 350;
	arParams.height = 200;

	arParams.buttons = [this.btnSave];

	BX.CAuthDialog.superclass.constructor.apply(this, arguments);
	this._sender = 'core_window_cauthdialog';

	BX.addClass(this.DIV, 'bx-core-auth-dialog');

	BX.AUTHAGENT = this;
};
BX.extend(BX.CAuthDialog, BX.CDialog);

BX.CAuthDialog.prototype.btnSave = BX.CAuthDialog.btnSave = {
	title: BX.message('JS_CORE_WINDOW_AUTH'),
	id: 'savebtn',
	name: 'savebtn',
	className: 'adm-btn-save',
	action: function () {
		this.disableUntilError();
		this.parentWindow.Submit({}, this.parentWindow.PARAMS.content_url);
	}
};

BX.CAuthDialog.prototype.SetError = function(error)
{
	BX.closeWait();

	if (!!error)
		this.ShowError(error.MESSAGE || error);
};

BX.CAuthDialog.prototype.setAuthResult = function(result)
{
	BX.closeWait();

	if (result === false)
	{
		this.Close();
		if (this.PARAMS.callback)
			this.PARAMS.callback();
	}
	else
	{
		this.SetError(result);
	}
};

/* MENU CLASSES */

BX.CWindowFloat = function(node)
{
	BX.CWindowFloat.superclass.constructor.apply(this, [node, 'float']);

	this.SETTINGS.resizable = false;
};
BX.extend(BX.CWindowFloat, BX.CWindow);

BX.CWindowFloat.prototype.adjustPos = function()
{
	if (this.PARAMS.parent)
		this.adjustToNode();
	else if (this.PARAMS.x && this.PARAMS.y)
		this.adjustToPos([this.PARAMS.x, this.PARAMS.y]);
};

BX.CWindowFloat.prototype.adjustToPos = function(pos)
{
	this.DIV.style.left = parseInt(pos[0]) + 'px';
	this.DIV.style.top = parseInt(pos[1]) + 'px';
};

BX.CWindowFloat.prototype.adjustToNodeGetPos = function()
{
	return BX.pos(this.PARAMS.parent);
};

BX.CWindowFloat.prototype.adjustToNode = function(el)
{
	el = el || this.PARAMS.parent;

	this.PARAMS.parent = BX(el);

	if (this.PARAMS.parent)
	{
		var pos = this.adjustToNodeGetPos();

		this.DIV.style.top = pos.top + 'px';//(pos.top - 26) + 'px';
		this.DIV.style.left = pos.left + 'px';

		this.PARAMS.parent.OPENER = this;
	}
};

BX.CWindowFloat.prototype.Show = function()
{
	this.adjustToPos([-1000, -1000]);
	BX.CWindowFloat.superclass.Show.apply(this, arguments);
	this.adjustPos();
};

/* menu opener class */
/*
{
	DOMNode DIV,
	BX.CMenu or Array MENU,
	TYPE = 'hover' | 'click',
	TIMEOUT: 1000
	ATTACH_MODE: 'top' | 'right'
	ACTIVE_CLASS: className for opener element when menu is opened
}
*/
BX.COpener = function(arParams)
{
	this.PARAMS = arParams || {};

	this.MENU = arParams.MENU || [];

	this.DIV = arParams.DIV;
	this.ATTACH = arParams.ATTACH || arParams.DIV;
	this.ATTACH_MODE = arParams.ATTACH_MODE || 'bottom';

	this.ACTIVE_CLASS = arParams.ACTIVE_CLASS || '';
	this.LEVEL = arParams.LEVEL || 0;

	this.CLOSE_ON_CLICK = typeof arParams.CLOSE_ON_CLICK != 'undefined' ? !!arParams.CLOSE_ON_CLICK : true;
	this.ADJUST_ON_CLICK = typeof arParams.ADJUST_ON_CLICK != 'undefined' ? !!arParams.ADJUST_ON_CLICK : true;

	this.TYPE = this.PARAMS.TYPE == 'hover' ? 'hover' : 'click';

	this._openTimeout = null;

	if (this.PARAMS.TYPE == 'hover' && arParams.TIMEOUT !== 0)
		this.TIMEOUT = arParams.TIMEOUT || 1000;
	else
		this.TIMEOUT = 0;

	if (!!this.PARAMS.MENU_URL)
	{
		this.bMenuLoaded = false;
		this.bMenuLoading = false;

		this.MENU = [{
			TEXT: BX.message('JS_CORE_LOADING'),
			CLOSE_ON_CLICK: false
		}];

		if (this.PARAMS.MENU_PRELOAD)
		{
			BX.defer(this.Load, this)();
		}
	}

	BX.ready(BX.defer(this.Init, this));
};

BX.COpener.prototype.Init = function()
{
	this.DIV = BX(this.DIV);

	switch (this.TYPE)
	{
		case 'hover':
			BX.bind(this.DIV, 'mouseover', BX.proxy(this.Open, this));
			BX.bind(this.DIV, 'click', BX.proxy(this.Toggle, this));
		break;

		case 'click':
			BX.bind(this.DIV, 'click', BX.proxy(this.Toggle, this));
		break;
	}

	//BX.bind(window, 'scroll', BX.delegate(this.__close_immediately, this));

	this.bMenuInit = false;
};

BX.COpener.prototype.Load = function()
{
	if (this.PARAMS.MENU_URL && !this.bMenuLoaded)
	{
		if (!this.bMenuLoading)
		{
			var url = this.PARAMS.MENU_URL;
			if (url.indexOf('sessid=') <= 0)
				url += (url.indexOf('?') > 0 ? '&' : '?') + 'sessid=' + BX.bitrix_sessid();

			this.bMenuLoading = true;
			BX.ajax.loadJSON(url, BX.proxy(this.SetMenu, this), BX.proxy(this.LoadFailed, this));
		}
	}
};

BX.COpener.prototype.SetMenu = function(menu)
{
	this.bMenuLoaded = true;
	this.bMenuLoading = false;
	if (this.bMenuInit)
	{
		this.MENU.setItems(menu);
	}
	else
	{
		this.MENU = menu;
	}
};

BX.COpener.prototype.LoadFailed = function()
{
	this.bMenuLoading = false;
	BX.debug(arguments);
};

BX.COpener.prototype.checkAdminMenu = function()
{
	if (document.documentElement.id == 'bx-admin-prefix')
		return true;

	return !!BX.findParent(this.DIV, {property: {id: 'bx-admin-prefix'}});
};

BX.COpener.prototype.Toggle = function(e)
{
	this.__clear_timeout();

	if (!this.bMenuInit || !this.MENU.visible())
	{
		var t = this.TIMEOUT;
		this.TIMEOUT = 0;
		this.Open(e);
		this.TIMEOUT = t;
	}
	else
	{
		this.MENU.Close();
	}

	return !!(e||window.event) && BX.PreventDefault(e);
};

BX.COpener.prototype.GetMenu = function()
{
	if (!this.bMenuInit)
	{
		if (BX.type.isArray(this.MENU))
		{
			this.MENU = new BX.CMenu({
				ITEMS: this.MENU,
				ATTACH_MODE: this.ATTACH_MODE,
				SET_ID: this.checkAdminMenu() ? 'bx-admin-prefix' : '',
				CLOSE_ON_CLICK: !!this.CLOSE_ON_CLICK,
				ADJUST_ON_CLICK: !!this.ADJUST_ON_CLICK,
				LEVEL: this.LEVEL,
				parent: BX(this.DIV),
				parent_attach: BX(this.ATTACH)
			});

			if (this.LEVEL > 0)
			{
				BX.bind(this.MENU.DIV, 'mouseover', BX.proxy(this._on_menu_hover, this));
				BX.bind(this.MENU.DIV, 'mouseout', BX.proxy(this._on_menu_hout, this));
			}
		}

		BX.addCustomEvent(this.MENU, 'onMenuOpen', BX.proxy(this.handler_onopen, this));
		BX.addCustomEvent(this.MENU, 'onMenuClose', BX.proxy(this.handler_onclose, this));

		BX.addCustomEvent('onMenuItemHover', BX.proxy(this.handler_onover, this));

		this.bMenuInit = true;
	}

	return this.MENU;
};

BX.COpener.prototype.Open = function()
{
	this.GetMenu();

	this.bOpen = true;

	this.__clear_timeout();

	if (this.TIMEOUT > 0)
	{
		BX.bind(this.DIV, 'mouseout', BX.proxy(this.__clear_timeout, this));
		this._openTimeout = setTimeout(BX.proxy(this.__open, this), this.TIMEOUT);
	}
	else
	{
		this.__open();
	}

	if (!!this.PARAMS.MENU_URL && !this.bMenuLoaded)
	{
		this._loadTimeout = setTimeout(BX.proxy(this.Load, this), parseInt(this.TIMEOUT/2));
	}

	return true;
};

BX.COpener.prototype.__clear_timeout = function()
{
	if (!!this._openTimeout)
		clearTimeout(this._openTimeout);
	if (!!this._loadTimeout)
		clearTimeout(this._loadTimeout);

	BX.unbind(this.DIV, 'mouseout', BX.proxy(this.__clear_timeout, this));
};

BX.COpener.prototype._on_menu_hover = function()
{
	this.bMenuHover = true;

	this.__clear_timeout();

	if (this.ACTIVE_CLASS)
		BX.addClass(this.DIV, this.ACTIVE_CLASS);

};

BX.COpener.prototype._on_menu_hout = function()
{
	this.bMenuHover = false;
};

BX.COpener.prototype.handler_onover = function(level, opener)
{
	if (this.bMenuHover)
		return;

	if (opener != this && level == this.LEVEL-1 && this.ACTIVE_CLASS)
	{
		BX.removeClass(this.DIV, this.ACTIVE_CLASS);
	}

	if (this.bMenuInit && level <= this.LEVEL-1 && this.MENU.visible())
	{
		if (opener != this)
		{
			this.__clear_timeout();
			this._openTimeout = setTimeout(BX.proxy(this.Close, this), this.TIMEOUT);
		}
	}
};

BX.COpener.prototype.handler_onopen = function()
{
	this.bOpen = true;

	if (this.ACTIVE_CLASS)
		BX.addClass(this.DIV, this.ACTIVE_CLASS);

	BX.defer(function() {
		BX.onCustomEvent(this, 'onOpenerMenuOpen');
	}, this)();
};

BX.COpener.prototype.handler_onclose = function()
{
	this.bOpen = false;
	BX.onCustomEvent(this, 'onOpenerMenuClose');

	if (this.ACTIVE_CLASS)
		BX.removeClass(this.DIV, this.ACTIVE_CLASS);
};

BX.COpener.prototype.Close = function()
{
	if (!this.bMenuInit)
		return;

	if (!!this._openTimeout)
		clearTimeout(this._openTimeout);

	this.bOpen = false;

	this.__close();
};

BX.COpener.prototype.__open = function()
{
	this.__clear_timeout();

	if (this.bMenuInit && this.bOpen && !this.MENU.visible())
		this.MENU.Show();
};

BX.COpener.prototype.__close = function()
{
	if (this.bMenuInit && !this.bOpen && this.MENU.visible())
		this.MENU.Hide();
};

BX.COpener.prototype.__close_immediately = function() {
	this.bOpen = false; this.__close();
};

BX.COpener.prototype.isMenuVisible = function() {
	return null != this.MENU.visible && this.MENU.visible()
};

/* common menu class */

BX.CMenu = function(arParams)
{
	BX.CMenu.superclass.constructor.apply(this);

	this.DIV.style.width = 'auto';//this.DIV.firstChild.offsetWidth + 'px';
	this.DIV.style.height = 'auto';//this.DIV.firstChild.offsetHeight + 'px';

	this.PARAMS = arParams || {};
	this.PARTS = {};

	this.PARAMS.ATTACH_MODE = this.PARAMS.ATTACH_MODE || 'bottom';
	this.PARAMS.CLOSE_ON_CLICK = typeof this.PARAMS.CLOSE_ON_CLICK == 'undefined' ? true : this.PARAMS.CLOSE_ON_CLICK;
	this.PARAMS.ADJUST_ON_CLICK = typeof this.PARAMS.ADJUST_ON_CLICK == 'undefined' ? true : this.PARAMS.ADJUST_ON_CLICK;
	this.PARAMS.LEVEL = this.PARAMS.LEVEL || 0;

	this.DIV.className = 'bx-core-popup-menu bx-core-popup-menu-' + this.PARAMS.ATTACH_MODE + ' bx-core-popup-menu-level' + this.PARAMS.LEVEL + (typeof this.PARAMS.ADDITIONAL_CLASS != 'undefined' ? ' ' + this.PARAMS.ADDITIONAL_CLASS : '');
	if (!!this.PARAMS.SET_ID)
		this.DIV.id = this.PARAMS.SET_ID;

	if (this.PARAMS.LEVEL == 0)
	{
		this.ARROW = this.DIV.appendChild(BX.create('SPAN', {props: {className: 'bx-core-popup-menu-angle'}, style: {left:'15px'}}));
	}

	if (!!this.PARAMS.CLASS_NAME)
		this.DIV.className += ' ' + this.PARAMS.CLASS_NAME;

	BX.bind(this.DIV, 'click', BX.eventCancelBubble);

	this.ITEMS = [];

	this.setItems(this.PARAMS.ITEMS);

	BX.addCustomEvent('onMenuOpen', BX.proxy(this._onMenuOpen, this));
	BX.addCustomEvent('onMenuItemSelected', BX.proxy(this.Hide, this));
};
BX.extend(BX.CMenu, BX.CWindowFloat);

BX.CMenu.broadcastCloseEvent = function()
{
	BX.onCustomEvent("onMenuItemSelected");
};

BX.CMenu._toggleChecked = function()
{
	BX.toggleClass(this, 'bx-core-popup-menu-item-checked');
};

BX.CMenu._itemDblClick = function()
{
	window.location.href = this.href;
};

BX.CMenu.prototype.toggleArrow = function(v)
{
	if (!!this.ARROW)
	{
		if (typeof v == 'undefined')
		{
			v = this.ARROW.style.visibility == 'hidden';
		}

		this.ARROW.style.visibility = !!v ? 'visible' : 'hidden';
	}
};

BX.CMenu.prototype.visible = function()
{
	return this.DIV.style.display !== 'none';
};

BX.CMenu.prototype._onMenuOpen = function(menu, menu_level)
{
	if (this.visible())
	{
		if (menu_level == this.PARAMS.LEVEL && menu != this)
		{
			this.Hide();
		}
	}
};

BX.CMenu.prototype.onUnRegister = function()
{
	if (!this.visible())
		return;

	this.Hide();
};

BX.CMenu.prototype.setItems = function(items)
{
	this.PARAMS.ITEMS = items;

	BX.cleanNode(this.DIV);

	if (!!this.ARROW)
		this.DIV.appendChild(this.ARROW);

	if (this.PARAMS.ITEMS)
	{
		this.PARAMS.ITEMS = BX.util.array_values(this.PARAMS.ITEMS);

		var bIcons = false;
		var cnt = 0;
		for (var i = 0, len = this.PARAMS.ITEMS.length; i < len; i++)
		{
			if ((i == 0 || i == len-1) && this.PARAMS.ITEMS[i].SEPARATOR)
				continue;

			cnt++;

			if (!bIcons)
				bIcons = !!this.PARAMS.ITEMS[i].GLOBAL_ICON;

			this.addItem(this.PARAMS.ITEMS[i], i);
		}

		// Occam turning in his grave
		if (cnt === 1)
			BX.addClass(this.DIV, 'bx-core-popup-menu-single-item');
		else
			BX.removeClass(this.DIV, 'bx-core-popup-menu-single-item');

		if (!bIcons)
			BX.addClass(this.DIV, 'bx-core-popup-menu-no-icons');
		else
			BX.removeClass(this.DIV, 'bx-core-popup-menu-no-icons');

	}
};

BX.CMenu.prototype.addItem = function(item)
{
	this.ITEMS.push(item);

	if (item.SEPARATOR)
	{
		item.NODE = BX.create(
			'DIV', {props: {className: 'bx-core-popup-menu-separator'}}
		);
	}
	else
	{
		var bHasMenu = (!!item.MENU
			&& (
				(BX.type.isArray(item.MENU) && item.MENU.length > 0)
				|| item.MENU instanceof BX.CMenu
			) || !!item.MENU_URL
		);

		if (item.DISABLED)
		{
			item.CLOSE_ON_CLICK = false;
			item.LINK = null;
			item.ONCLICK = null;
			item.ACTION = null;
		}

		item.NODE = BX.create(!!item.LINK || BX.browser.IsIE() && !BX.browser.IsDoctype() ? 'A' : 'SPAN', {
			props: {
				className: 'bx-core-popup-menu-item'
					+ (bHasMenu ? ' bx-core-popup-menu-item-opener' : '')
					+ (!!item.DEFAULT ? ' bx-core-popup-menu-item-default' : '')
					+ (!!item.DISABLED ? ' bx-core-popup-menu-item-disabled' : '')
					+ (!!item.CHECKED ? ' bx-core-popup-menu-item-checked' : ''),
				title: !!BX.message['MENU_ENABLE_TOOLTIP'] ? item.TITLE || '' : '',
				BXMENULEVEL: this.PARAMS.LEVEL
			},
			attrs: !!item.LINK || BX.browser.IsIE() && !BX.browser.IsDoctype() ? {href: item.LINK || 'javascript:void(0)'} : {},
			events: {
				mouseover: function()
				{
					BX.onCustomEvent('onMenuItemHover', [this.BXMENULEVEL, this.OPENER])
				}
			},
			html: '<span class="bx-core-popup-menu-item-icon' + (item.GLOBAL_ICON ? ' '+item.GLOBAL_ICON : '') + '"></span><span class="bx-core-popup-menu-item-text">'+item.TEXT+'</span>'
		});

		if (bHasMenu && !item.DISABLED)
		{
			item.NODE.OPENER = new BX.COpener({
				DIV: item.NODE,
				ACTIVE_CLASS: 'bx-core-popup-menu-item-opened',
				TYPE: 'hover',
				MENU: item.MENU,
				MENU_URL: item.MENU_URL,
				MENU_PRELOAD: !!item.MENU_PRELOAD,
				LEVEL: this.PARAMS.LEVEL + 1,
				ATTACH_MODE:'right',
				TIMEOUT: 500
			});
		}
		else if (this.PARAMS.CLOSE_ON_CLICK && (typeof item.CLOSE_ON_CLICK == 'undefined' || !!item.CLOSE_ON_CLICK))
		{
			BX.bind(item.NODE, 'click', BX.CMenu.broadcastCloseEvent);
		}
		else if (this.PARAMS.ADJUST_ON_CLICK && (typeof item.ADJUST_ON_CLICK == 'undefined' || !!item.ADJUST_ON_CLICK))
		{
			BX.bind(item.NODE, 'click', BX.defer(this.adjustPos, this));
		}

		if (bHasMenu && !!item.LINK)
		{
			BX.bind(item.NODE, 'dblclick', BX.CMenu._itemDblClick);
		}

		if (typeof item.CHECKED != 'undefined')
		{
			BX.bind(item.NODE, 'click', BX.CMenu._toggleChecked);
		}

		item.ONCLICK = item.ACTION || item.ONCLICK;
		if (!!item.ONCLICK)
		{
			if (BX.type.isString(item.ONCLICK))
			{
				item.ONCLICK = new Function("event", item.ONCLICK);
			}

			BX.bind(item.NODE, 'click', item.ONCLICK);
		}
	}

	this.DIV.appendChild(item.NODE);
};

BX.CMenu.prototype._documentClickBind = function()
{
	this._documentClickUnBind();
	BX.bind(document, 'click', BX.proxy(this._documentClick, this));
};

BX.CMenu.prototype._documentClickUnBind = function()
{
	BX.unbind(document, 'click', BX.proxy(this._documentClick, this));
};

BX.CMenu.prototype._documentClick = function(e)
{
	e = e||window.event;
	if(!!e && !(BX.getEventButton(e) & BX.MSLEFT))
		return;

	this.Close();
};

BX.CMenu.prototype.Show = function()
{
	BX.onCustomEvent(this, 'onMenuOpen', [this, this.PARAMS.LEVEL]);
	BX.CMenu.superclass.Show.apply(this, []);

	this.bCloseEventFired = false;

	BX.addCustomEvent(this.PARAMS.parent_attach, 'onChangeNodePosition', BX.proxy(this.adjustToNode, this));

	(BX.defer(this._documentClickBind, this))();
};

BX.CMenu.prototype.Close = // we shouldn't 'Close' window - only hide
BX.CMenu.prototype.Hide = function()
{
	if (!this.visible())
		return;

	BX.removeCustomEvent(this.PARAMS.parent_attach, 'onChangeNodePosition', BX.proxy(this.adjustToNode, this));

	this._documentClickUnBind();

	if (!this.bCloseEventFired)
	{
		BX.onCustomEvent(this, 'onMenuClose', [this, this.PARAMS.LEVEL]);
		this.bCloseEventFired = true;
	}
	BX.CMenu.superclass.Hide.apply(this, arguments);


//	this.DIV.onclick = null;
	//this.PARAMS.parent.onclick = null;
};

BX.CMenu.prototype.__adjustMenuToNode = function()
{
	var pos = BX.pos(this.PARAMS.parent_attach),
		bFixed = !!BX.findParent(this.PARAMS.parent_attach, BX.is_fixed);

	if (bFixed)
		this.DIV.style.position = 'fixed';
	else
		this.DIV.style.position = 'absolute';

	if (!pos.top)
	{
		this.DIV.style.top = '-1000px';
		this.DIV.style.left = '-1000px';
	}

	if (this.bTimeoutSet) return;

	var floatWidth = this.DIV.offsetWidth, floatHeight = this.DIV.offsetHeight;
	if (!floatWidth)
	{
		setTimeout(BX.delegate(function(){
			this.bTimeoutSet = false; this.__adjustMenuToNode();
		}, this), 100);

		this.bTimeoutSet = true;
		return;
	}

	var menu_pos = {},
		wndSize = BX.GetWindowSize();

/*
	if (BX.browser.IsIE() && !BX.browser.IsDoctype())
	{
		pos.top -= 4; pos.bottom -= 4;
		pos.left -= 2; pos.right -= 2;
	}
*/

	switch (this.PARAMS.ATTACH_MODE)
	{
		case 'bottom':
			menu_pos.top = pos.bottom + 9;
			menu_pos.left = pos.left;

			if (!!this.ARROW)
			{
				var arrowPos = parseInt(this.ARROW.style.left);
				if (pos.width > floatWidth)
					arrowPos = parseInt(floatWidth/2 - 7);
				else
					arrowPos = parseInt(Math.min(floatWidth, pos.width)/2 - 7);

				if (arrowPos < 7)
				{
					menu_pos.left -= 15;
					arrowPos += 15;
				}
			}

			if (menu_pos.left > wndSize.scrollWidth - floatWidth - 10)
			{
				var orig_menu_pos = menu_pos.left;
				menu_pos.left = wndSize.scrollWidth - floatWidth - 10;

				if (!!this.ARROW)
					arrowPos += orig_menu_pos - menu_pos.left;
			}

			if (bFixed)
			{
				menu_pos.left -= wndSize.scrollLeft;
			}

			if (!!this.ARROW)
				this.ARROW.style.left = arrowPos + 'px';
		break;
		case 'right':
			menu_pos.top = pos.top-1;
			menu_pos.left = pos.right;

			if (menu_pos.left > wndSize.scrollWidth - floatWidth - 10)
			{
				menu_pos.left = pos.left - floatWidth - 1;
			}
		break;
	}

	if (bFixed)
	{
		menu_pos.top -= wndSize.scrollTop;
	}

	if (!!this.ARROW)
		this.ARROW.className = 'bx-core-popup-menu-angle';

	if((menu_pos.top + floatHeight > wndSize.scrollTop + wndSize.innerHeight)
		|| (menu_pos.top + floatHeight > wndSize.scrollHeight))
	{
		var new_top = this.PARAMS.ATTACH_MODE == 'bottom'
			? pos.top - floatHeight - 9
			: pos.bottom - floatHeight + 1;

		if((new_top > wndSize.scrollTop)
			|| (menu_pos.top + floatHeight > wndSize.scrollHeight))
		{
			if ((menu_pos.top + floatHeight > wndSize.scrollHeight))
			{
				menu_pos.top = Math.max(0, wndSize.scrollHeight-floatHeight);
				this.toggleArrow(false);
			}
			else
			{
				menu_pos.top = new_top;

				if (!!this.ARROW)
					this.ARROW.className = 'bx-core-popup-menu-angle-bottom';
			}
		}
	}

	if (menu_pos.top + menu_pos.left == 0)
	{
		this.Hide();
	}
	else
	{
		this.DIV.style.top = menu_pos.top + 'px';
		this.DIV.style.left = menu_pos.left + 'px';
	}
};

BX.CMenu.prototype.adjustToNode = function(el)
{
	this.PARAMS.parent_attach = BX(el) || this.PARAMS.parent_attach || this.PARAMS.parent;
	this.__adjustMenuToNode();
};


/* components toolbar class */

BX.CMenuOpener = function(arParams)
{
	BX.CMenuOpener.superclass.constructor.apply(this);

	this.PARAMS = arParams || {};
	this.setParent(this.PARAMS.parent);
	this.PARTS = {};

	this.SETTINGS.drag_restrict = true;

	this.defaultAction = null;

	this.timeout = 500;

	this.DIV.className = 'bx-component-opener';
	this.DIV.ondblclick = BX.PreventDefault;

	if (this.PARAMS.component_id)
	{
		this.PARAMS.transform = !!this.PARAMS.transform;
	}

	this.OPENERS = [];

	this.DIV.appendChild(BX.create('SPAN', {
		props: {className: 'bx-context-toolbar' + (this.PARAMS.transform ? ' bx-context-toolbar-vertical-mode' : '')}
	}));

	//set internal structure and register draggable element
	this.PARTS.INNER = this.DIV.firstChild.appendChild(BX.create('SPAN', {
		props: {className: 'bx-context-toolbar-inner'},
		html: '<span class="bx-context-toolbar-drag-icon"></span><span class="bx-context-toolbar-vertical-line"></span><br>'
	}));

	this.EXTRA_BUTTONS = {};

	var btnCount = 0;
	for (var i = 0, len = this.PARAMS.menu.length; i < len; i++)
	{
		var item = this.addItem(this.PARAMS.menu[i]);
		if (null != item)
		{
			btnCount++;
			this.PARTS.INNER.appendChild(item);
			this.PARTS.INNER.appendChild(BX.create('BR'));
		}
	}
	var bHasButtons = btnCount > 0;

	//menu items will be attached here

	this.PARTS.ICONS = this.PARTS.INNER.appendChild(BX.create('SPAN', {
		props: {className: 'bx-context-toolbar-icons'}
	}));

	if (this.PARAMS.component_id)
	{
		this.PARAMS.pin = !!this.PARAMS.pin;

		if (bHasButtons)
			this.PARTS.ICONS.appendChild(BX.create('SPAN', {props: {className: 'bx-context-toolbar-separator'}}));

		this.PARTS.ICON_PIN = this.PARTS.ICONS.appendChild(BX.create('A', {
			attrs: {
				href: 'javascript:void(0)'
			},
			props: {
				className: this.PARAMS.pin
							? 'bx-context-toolbar-pin-fixed'
							: 'bx-context-toolbar-pin'
			},
			events: {
				click: BX.delegate(this.__pin_btn_clicked, this)
			}
		}));
	}


	if (this.EXTRA_BUTTONS['components2_props'])
	{
		var btn = this.EXTRA_BUTTONS['components2_props'] || {URL: 'javascript:void(0)'};
		if (null == this.defaultAction)
		{
			this.defaultAction = btn.ONCLICK;
			this.defaultActionTitle = btn.TITLE || btn.TEXT;
		}

		btn.URL = 'javascript:' + BX.util.urlencode(btn.ONCLICK);

		this.ATTACH = this.PARTS.ICONS.appendChild(BX.create('SPAN', {
			props: {className: 'bx-context-toolbar-button bx-context-toolbar-button-settings' },
			children:
			[
				BX.create('SPAN',
				{
					props:{className: 'bx-context-toolbar-button-inner'},
					children:
					[
						BX.create('A', {
							attrs: {href: btn.URL},
							events: {
								mouseover: BX.proxy(this.__msover_text, this),
								mouseout: BX.proxy(this.__msout_text, this),
								mousedown: BX.proxy(this.__msdown_text, this)
							},
							html: '<span class="bx-context-toolbar-button-icon bx-context-toolbar-settings-icon"></span>'
						}),
						BX.create('A', {
							attrs: {href: 'javascript: void(0)'},
							props: {className: 'bx-context-toolbar-button-arrow'},
							events: {
								mouseover: BX.proxy(this.__msover_arrow, this),
								mouseout: BX.proxy(this.__msout_arrow, this),
								mousedown: BX.proxy(this.__msdown_arrow, this)
							},
							html: '<span class="bx-context-toolbar-button-arrow"></span>'
						})
					]
				})
			]
		}));

		this.OPENER = this.ATTACH.firstChild.lastChild;

		var opener = this.attachMenu(this.EXTRA_BUTTONS['components2_submenu']['MENU']);

		BX.addCustomEvent(opener, 'onOpenerMenuOpen', BX.proxy(this.__menu_open, this));
		BX.addCustomEvent(opener, 'onOpenerMenuClose', BX.proxy(this.__menu_close, this));
	}

	if (btnCount > 1)
	{
		this.PARTS.ICONS.appendChild(BX.create('span', { props: {className: 'bx-context-toolbar-separator bx-context-toolbar-separator-switcher'}}));

		this.ICON_TRANSFORM = this.PARTS.ICONS.appendChild(BX.create('A', {
			attrs: {href: 'javascript: void(0)'},
			props: {className: 'bx-context-toolbar-switcher'},
			events: {
				click: BX.delegate(this.__trf_btn_clicked, this)
			}
		}));
	}

	if (this.PARAMS.HINT)
	{
		this.DIV.BXHINT = this.HINT = new BX.CHint({
			parent: this.DIV,
			hint:this.PARAMS.HINT.TEXT || '',
			title: this.PARAMS.HINT.TITLE || '',
			hide_timeout: this.timeout/2,
			preventHide: false
		});
	}

	BX.addCustomEvent(this, 'onWindowDragFinished', BX.delegate(this.__onMoveFinished, this));
	BX.addCustomEvent('onDynamicModeChange', BX.delegate(this.__onDynamicModeChange, this));
	BX.addCustomEvent('onTopPanelCollapse', BX.delegate(this.__onPanelCollapse, this));

	BX.addCustomEvent('onMenuOpenerMoved', BX.delegate(this.checkPosition, this));
	BX.addCustomEvent('onMenuOpenerUnhide', BX.delegate(this.checkPosition, this));

	if (this.OPENERS)
	{
		for (i=0,len=this.OPENERS.length; i<len; i++)
		{
			BX.addCustomEvent(this.OPENERS[i], 'onOpenerMenuOpen', BX.proxy(this.__hide_hint, this));
		}
	}
};
BX.extend(BX.CMenuOpener, BX.CWindowFloat);

BX.CMenuOpener.prototype.setParent = function(new_parent)
{
	new_parent = BX(new_parent);
	if(new_parent.OPENER && new_parent.OPENER != this)
	{
		new_parent.OPENER.Close();
		new_parent.OPENER.clearHoverHoutEvents();
	}

	if(this.PARAMS.parent && this.PARAMS.parent != new_parent)
	{
		this.clearHoverHoutEvents();
		this.PARAMS.parent.OPENER = null;
	}

	this.PARAMS.parent = new_parent;
	this.PARAMS.parent.OPENER = this;
};

BX.CMenuOpener.prototype.setHoverHoutEvents = function(hover, hout)
{
	if(!this.__opener_events_set)
	{
		BX.bind(this.Get(), 'mouseover', hover);
		BX.bind(this.Get(), 'mouseout', hout);
		this.__opener_events_set = true;
	}
};

BX.CMenuOpener.prototype.clearHoverHoutEvents = function()
{
	if(this.Get())
	{
		BX.unbindAll(this.Get());
		this.__opener_events_set = false;
	}
};


BX.CMenuOpener.prototype.unclosable = true;

BX.CMenuOpener.prototype.__check_intersection = function(pos_self, pos_other)
{
	return !(pos_other.right <= pos_self.left || pos_other.left >= pos_self.right
			|| pos_other.bottom <= pos_self.top || pos_other.top >= pos_self.bottom);
};


BX.CMenuOpener.prototype.__msover_text = function() {
	this.bx_hover = true;
	if (!this._menu_open)
		BX.addClass(this.ATTACH, 'bx-context-toolbar-button-text-hover');
};

BX.CMenuOpener.prototype.__msout_text = function() {
	this.bx_hover = false;
	if (!this._menu_open)
		BX.removeClass(this.ATTACH, 'bx-context-toolbar-button-text-hover bx-context-toolbar-button-text-active');
};

BX.CMenuOpener.prototype.__msover_arrow = function() {
	this.bx_hover = true;
	if (!this._menu_open)
		BX.addClass(this.ATTACH, 'bx-context-toolbar-button-arrow-hover');
};

BX.CMenuOpener.prototype.__msout_arrow = function() {
	this.bx_hover = false;
	if (!this._menu_open)
		BX.removeClass(this.ATTACH, 'bx-context-toolbar-button-arrow-hover bx-context-toolbar-button-arrow-active');
};

BX.CMenuOpener.prototype.__msdown_text = function() {
	this.bx_active = true;
	if (!this._menu_open)
		BX.addClass(this.ATTACH, 'bx-context-toolbar-button-text-active');
};

BX.CMenuOpener.prototype.__msdown_arrow = function() {
	this.bx_active = true;
	if (!this._menu_open)
		BX.addClass(this.ATTACH, 'bx-context-toolbar-button-arrow-active');
};

BX.CMenuOpener.prototype.__menu_close = function() {
	this._menu_open = false;
	this.bx_active = false;
	BX.removeClass(this.ATTACH, 'bx-context-toolbar-button-active bx-context-toolbar-button-text-active bx-context-toolbar-button-arrow-active');
	if (!this.bx_hover)
	{
		BX.removeClass(this.ATTACH, 'bx-context-toolbar-button-hover bx-context-toolbar-button-text-hover bx-context-toolbar-button-arrow-hover');
		this.bx_hover = false;
	}
};

BX.CMenuOpener.prototype.__menu_open = function() {
	this._menu_open = true;
};

BX.CMenuOpener.prototype.checkPosition = function()
{
	if (this.isMenuVisible() || this.DIV.style.display == 'none'
		|| this == BX.proxy_context || BX.proxy_context.zIndex > this.zIndex)
		return;

	this.correctPosition(BX.proxy_context);
};

BX.CMenuOpener.prototype.correctPosition = function(opener)
{
	var pos_self = BX.pos(this.DIV), pos_other = BX.pos(opener.Get());
	if (this.__check_intersection(pos_self, pos_other))
	{
		var new_top = pos_other.top - pos_self.height;
		if (new_top < 0)
			new_top = pos_other.bottom;

		this.DIV.style.top = new_top + 'px';

		BX.addCustomEvent(opener, 'onMenuOpenerHide', BX.proxy(this.restorePosition, this));
		BX.onCustomEvent(this, 'onMenuOpenerMoved');
	}
};

BX.CMenuOpener.prototype.restorePosition = function()
{
	if (!this.MOUSEOVER && !this.isMenuVisible())
	{
		if (this.originalPos)
			this.DIV.style.top = this.originalPos.top + 'px';

		BX.removeCustomEvent(BX.proxy_context, 'onMenuOpenerHide', BX.proxy(this.restorePosition, this));
		if (this.restore_pos_timeout) clearTimeout(this.restore_pos_timeout);
	}
	else
	{
		this.restore_pos_timeout = setTimeout(BX.proxy(this.restorePosition, this), this.timeout);
	}
};


BX.CMenuOpener.prototype.Show = function()
{
	BX.CMenuOpener.superclass.Show.apply(this, arguments);

	this.SetDraggable(this.PARTS.INNER.firstChild);

	this.DIV.style.width = 'auto';
	this.DIV.style.height = 'auto';

	if (!this.PARAMS.pin)
	{
		this.DIV.style.left = '-1000px';
		this.DIV.style.top = '-1000px';

		this.Hide();
	}
	else
	{
		this.bPosAdjusted = true;
		this.bMoved = true;

		if (this.PARAMS.top) this.DIV.style.top = this.PARAMS.top + 'px';
		if (this.PARAMS.left) this.DIV.style.left = this.PARAMS.left + 'px';

		this.DIV.style.display = (!BX.admin.dynamic_mode || BX.admin.dynamic_mode_show_borders) ? 'block' : 'none';

		if (this.DIV.style.display == 'block')
		{
			setTimeout(BX.delegate(function() {BX.onCustomEvent(this, 'onMenuOpenerUnhide')}, this), 50);
		}
	}
};

BX.CMenuOpener.prototype.executeDefaultAction = function()
{
	if (this.defaultAction)
	{
		if (BX.type.isFunction(this.defaultAction))
			this.defaultAction();
		else if(BX.type.isString(this.defaultAction))
			BX.evalGlobal(this.defaultAction);
	}
};

BX.CMenuOpener.prototype.__onDynamicModeChange = function(val)
{
	this.DIV.style.display = val ? 'block' : 'none';
};

BX.CMenuOpener.prototype.__onPanelCollapse = function(bCollapsed, dy)
{
	this.DIV.style.top = (parseInt(this.DIV.style.top) + dy) + 'px';
	if (this.PARAMS.pin)
	{
		this.__savePosition();
	}
};

BX.CMenuOpener.prototype.__onMoveFinished = function()
{
	BX.onCustomEvent(this, 'onMenuOpenerMoved');

	this.bMoved = true;

	if (this.PARAMS.pin)
		this.__savePosition();
};

BX.CMenuOpener.prototype.__savePosition = function()
{
	var arOpts = {};

	arOpts.pin = this.PARAMS.pin;
	if (!this.PARAMS.pin)
	{
		arOpts.top = false; arOpts.left = false; arOpts.transform = false;
	}
	else
	{
		arOpts.transform = this.PARAMS.transform;
		if (this.bMoved)
		{
			arOpts.left = parseInt(this.DIV.style.left);
			arOpts.top = parseInt(this.DIV.style.top);
		}
	}

	BX.WindowManager.saveWindowOptions(this.PARAMS.component_id, arOpts);
};

BX.CMenuOpener.prototype.__pin_btn_clicked = function() {this.Pin()};
BX.CMenuOpener.prototype.Pin = function(val)
{
	if (null == val)
		this.PARAMS.pin = !this.PARAMS.pin;
	else
		this.PARAMS.pin = !!val;

	this.PARTS.ICON_PIN.className = (this.PARAMS.pin ? 'bx-context-toolbar-pin-fixed' : 'bx-context-toolbar-pin');

	this.__savePosition();
};

BX.CMenuOpener.prototype.__trf_btn_clicked = function() {this.Transform()};
BX.CMenuOpener.prototype.Transform = function(val)
{
	if (null == val)
		this.PARAMS.transform = !this.PARAMS.transform;
	else
		this.PARAMS.transform = !!val;

	if (this.bMoved)
	{
		var pos = BX.pos(this.DIV);
	}

	if (this.PARAMS.transform)
		BX.addClass(this.DIV.firstChild, 'bx-context-toolbar-vertical-mode');
	else
		BX.removeClass(this.DIV.firstChild, 'bx-context-toolbar-vertical-mode');

	if (!this.bMoved)
	{
		this.adjustPos();
	}
	else
	{
		this.DIV.style.left = (pos.right - this.DIV.offsetWidth - (BX.browser.IsIE() && !BX.browser.IsDoctype() ? 2 : 0)) + 'px';
	}

	this.__savePosition();
};

BX.CMenuOpener.prototype.adjustToNodeGetPos = function()
{
	var pos = BX.pos(this.PARAMS.parent/*, true*/);

	var scrollSize = BX.GetWindowScrollSize();
	var floatWidth = this.DIV.offsetWidth;

	pos.left -= BX.admin.__border_dx;
	pos.top -= BX.admin.__border_dx;

	if (true || !this.PARAMS.transform)
	{
		pos.top -= 45;
	}

	if (pos.left > scrollSize.scrollWidth - floatWidth)
	{
		pos.left = scrollSize.scrollWidth - floatWidth;
	}

	return pos;
};

BX.CMenuOpener.prototype.addItem = function(item)
{
	if (item.TYPE)
	{
		this.EXTRA_BUTTONS[item.TYPE] = item;
		return null;
	}
	else
	{
		var q = new BX.CMenuOpenerItem(item);
		if (null == this.defaultAction)
		{
			if (q.item.ONCLICK)
			{
				this.defaultAction = item.ONCLICK;
			}
			else if (q.item.MENU)
			{
				this.defaultAction = BX.delegate(function() {this.Open()}, q.item.OPENER);
			}

			this.defaultActionTitle = item.TITLE || item.TEXT;

			BX.addClass(q.Get(), 'bx-content-toolbar-default');
		}
		if (q.item.OPENER) this.OPENERS[this.OPENERS.length] = q.item.OPENER;
		return q.Get();
	}
};

BX.CMenuOpener.prototype.attachMenu = function(menu)
{
	var opener = new BX.COpener({
		'DIV':  this.OPENER,
		'ATTACH': this.ATTACH,
		'MENU': menu,
		'TYPE': 'click'
	});

	this.OPENERS[this.OPENERS.length] = opener;

	return opener;
};

BX.CMenuOpener.prototype.__hide_hint = function()
{
	if (this.HINT) this.HINT.__hide_immediately();
};

BX.CMenuOpener.prototype.isMenuVisible = function()
{
	for (var i=0,len=this.OPENERS.length; i<len; i++)
	{
		if (this.OPENERS[i].isMenuVisible())
			return true;
	}

	return false;
};

BX.CMenuOpener.prototype.Hide = function()
{
	if (!this.PARAMS.pin)
	{
		this.DIV.style.display = 'none';
		BX.onCustomEvent(this, 'onMenuOpenerHide');
	}
};
BX.CMenuOpener.prototype.UnHide = function()
{
	this.DIV.style.display = 'block';
	if (!this.bPosAdjusted && !this.PARAMS.pin)
	{
		this.adjustPos();
		this.bPosAdjusted = true;
	}

	if (null == this.originalPos && !this.bMoved)
	{
		this.originalPos = BX.pos(this.DIV);
	}

	BX.onCustomEvent(this, 'onMenuOpenerUnhide');
};

BX.CMenuOpenerItem = function(item)
{
	this.item = item;

	if (this.item.ACTION && !this.item.ONCLICK)
	{
		this.item.ONCLICK = this.item.ACTION;
	}

	this.DIV = BX.create('SPAN');
	this.DIV.appendChild(BX.create('SPAN', {props: {className: 'bx-context-toolbar-button-underlay'}}));

	this.WRAPPER = this.DIV.appendChild(BX.create('SPAN', {
		props: {className: 'bx-context-toolbar-button-wrapper'},
		children: [
			BX.create('SPAN', {
				props: {className: 'bx-context-toolbar-button', title: item.TITLE},
				children: [
					BX.create('SPAN', {
						props: {className: 'bx-context-toolbar-button-inner'}
					})
				]
			})
		]
	}));

	var btn_icon = BX.create('SPAN', {
		props: {className: 'bx-context-toolbar-button-icon' + (this.item.ICON || this.item.ICONCLASS ? ' ' + (this.item.ICON || this.item.ICONCLASS) : '')},
		attrs: (
				!(this.item.ICON || this.item.ICONCLASS)
				&&
				(this.item.SRC || this.item.IMAGE)
			)
			? {
				style: 'background: scroll transparent url(' + (this.item.SRC || this.item.IMAGE) + ') no-repeat center center !important;'
			}
			: {}
	}), btn_text = BX.create('SPAN', {
		props: {className: 'bx-context-toolbar-button-text'},
		text: this.item.TEXT
	});

	if (this.item.ACTION && !this.item.ONCLICK)
	{
		this.item.ONCLICK = this.item.ACTION;
	}

	this.bHasMenu = !!this.item.MENU;
	this.bHasAction = !!this.item.ONCLICK;

	if (this.bHasAction)
	{
		this.LINK = this.WRAPPER.firstChild.firstChild.appendChild(BX.create('A', {
			attrs: {
				'href': 'javascript: void(0)'
			},
			events: {
				mouseover: this.bHasMenu ? BX.proxy(this.__msover_text, this) : BX.proxy(this.__msover, this),
				mouseout: this.bHasMenu ? BX.proxy(this.__msout_text, this) : BX.proxy(this.__msout, this),
				mousedown: this.bHasMenu ? BX.proxy(this.__msdown_text, this) : BX.proxy(this.__msdown, this)
			},
			children: [btn_icon, btn_text]
		}));

		if (this.bHasMenu)
		{
			this.LINK_MENU = this.WRAPPER.firstChild.firstChild.appendChild(BX.create('A', {
				props: {className: 'bx-context-toolbar-button-arrow'},
				attrs: {
					'href': 'javascript: void(0)'
				},
				events: {
					mouseover: BX.proxy(this.__msover_arrow, this),
					mouseout: BX.proxy(this.__msout_arrow, this),
					mousedown: BX.proxy(this.__msdown_arrow, this)
				},
				children: [
					BX.create('SPAN', {props: {className: 'bx-context-toolbar-button-arrow'}})
				]
			}));
		}

	}
	else if (this.bHasMenu)
	{
		this.item.ONCLICK = null;

		this.LINK = this.LINK_MENU = this.WRAPPER.firstChild.firstChild.appendChild(BX.create('A', {
			attrs: {
				'href': 'javascript: void(0)'
			},
			events: {
				mouseover: BX.proxy(this.__msover, this),
				mouseout: BX.proxy(this.__msout, this),
				mousedown: BX.proxy(this.__msdown, this)
			},
			children: [
				btn_icon,
				btn_text
			]
		}));

		this.LINK.appendChild(BX.create('SPAN', {props: {className: 'bx-context-toolbar-single-button-arrow'}}));

	}

	if (this.bHasMenu)
	{
		this.item.SUBMENU = new BX.CMenu({
			ATTACH_MODE:'bottom',
			ITEMS:this.item['MENU'],
			//PARENT_MENU:this.parentMenu,
			parent: this.LINK_MENU,
			parent_attach: this.WRAPPER.firstChild
		});

		this.item.OPENER = new BX.COpener({
			DIV: this.LINK_MENU,
			TYPE: 'click',
			MENU: this.item.SUBMENU
		});

		BX.addCustomEvent(this.item.OPENER, 'onOpenerMenuOpen', BX.proxy(this.__menu_open, this));
		BX.addCustomEvent(this.item.OPENER, 'onOpenerMenuClose', BX.proxy(this.__menu_close, this));
	}

	if (this.bHasAction)
	{
		BX.bind(this.LINK, 'click', BX.delegate(this.__click, this));
	}
};

BX.CMenuOpenerItem.prototype.Get = function() {return this.DIV;};
BX.CMenuOpenerItem.prototype.__msover = function() {
	this.bx_hover = true;
	if (!this._menu_open)
		BX.addClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-hover');
};
BX.CMenuOpenerItem.prototype.__msout = function() {
	this.bx_hover = false;
	if (!this._menu_open)
		BX.removeClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-hover bx-context-toolbar-button-active');
};
BX.CMenuOpenerItem.prototype.__msover_text = function() {
	this.bx_hover = true;
	if (!this._menu_open)
		BX.addClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-text-hover');
};
BX.CMenuOpenerItem.prototype.__msout_text = function() {
	this.bx_hover = false;
	if (!this._menu_open)
		BX.removeClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-text-hover bx-context-toolbar-button-text-active');
};
BX.CMenuOpenerItem.prototype.__msover_arrow = function() {
	this.bx_hover = true;
	if (!this._menu_open)
		BX.addClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-arrow-hover');
};
BX.CMenuOpenerItem.prototype.__msout_arrow = function() {
	this.bx_hover = false;
	if (!this._menu_open)
		BX.removeClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-arrow-hover bx-context-toolbar-button-arrow-active');
};
BX.CMenuOpenerItem.prototype.__msdown = function() {
	this.bx_active = true;
	if (!this._menu_open)
		BX.addClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-active');
};
BX.CMenuOpenerItem.prototype.__msdown_text = function() {
	this.bx_active = true;
	if (!this._menu_open)
		BX.addClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-text-active');
};
BX.CMenuOpenerItem.prototype.__msdown_arrow = function() {
	this.bx_active = true;
	if (!this._menu_open)
		BX.addClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-arrow-active');
};
BX.CMenuOpenerItem.prototype.__menu_close = function() {

	this._menu_open = false;
	this.bx_active = false;
	BX.removeClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-active bx-context-toolbar-button-text-active bx-context-toolbar-button-arrow-active');
	if (!this.bx_hover)
	{
		BX.removeClass(this.LINK.parentNode.parentNode, 'bx-context-toolbar-button-hover bx-context-toolbar-button-text-hover bx-context-toolbar-button-arrow-hover');
		this.bx_hover = false;
	}
};
BX.CMenuOpenerItem.prototype.__menu_open = function() {
	this._menu_open = true;
};

BX.CMenuOpenerItem.prototype.__click = function() {BX.evalGlobal(this.item.ONCLICK)};

/* global page opener class */
BX.CPageOpener = function(arParams)
{
	//if (null == arParams.pin) arParams.pin = true;
	BX.CPageOpener.superclass.constructor.apply(this, arguments);

	this.timeout = 505;

	window.PAGE_EDIT_CONTROL = this;
};
BX.extend(BX.CPageOpener, BX.CMenuOpener);

BX.CPageOpener.prototype.checkPosition = function()
{
	if (/*this.isMenuVisible() || this.DIV.style.display == 'none' || */this == BX.proxy_context)
		return;

	this.correctPosition(BX.proxy_context);
};

BX.CPageOpener.prototype.correctPosition = function(opener)
{
	if (this.bPosCorrected) return;
	if (this.DIV.style.display == 'none')
	{
		var pos_self = this.adjustToNodeGetPos();
		pos_self.bottom = pos_self.top + 30;
		pos_self.right = pos_self.left + 300;
	}
	else
	{
		pos_self = BX.pos(this.DIV);
	}

	var pos_other = BX.pos(opener.Get());
	if (this.__check_intersection(pos_self, pos_other))
	{
		this.DIV.style.display = 'none';
		BX.addCustomEvent(opener, 'onMenuOpenerHide', BX.proxy(this.restorePosition, this));

		this.bPosCorrected = true;
	}
};

BX.CPageOpener.prototype.restorePosition = function()
{
	if (BX.proxy_context && BX.proxy_context.Get().style.display == 'none')
	{
		this.bPosCorrected = false;

		if (this.PARAMS.parent.bx_over || this.PARAMS.pin)
			this.UnHide();

		BX.removeCustomEvent('onMenuOpenerHide', BX.proxy(this.restorePosition, this));
	}
};

BX.CPageOpener.prototype.UnHide = function()
{
	if (!this.bPosCorrected)
		BX.CPageOpener.superclass.UnHide.apply(this, arguments);
};

BX.CPageOpener.prototype.Remove = function()
{
	BX.admin.removeComponentBorder(this.PARAMS.parent);
	BX.userOptions.save('global', 'settings', 'page_edit_control_enable', 'N');
	this.DIV.style.display = 'none';
};

/******* HINT ***************/
BX.CHintSimple = function()
{
	BX.CHintSimple.superclass.constructor.apply(this, arguments);
};
BX.extend(BX.CHintSimple, BX.CHint);

BX.CHintSimple.prototype.Init = function()
{
	this.DIV = document.body.appendChild(BX.create('DIV', {props: {className: 'bx-tooltip-simple'}, style: {display: 'none'}, children: [(this.CONTENT = BX.create('DIV'))]}));

	if (this.HINT_TITLE)
		this.CONTENT.appendChild(BX.create('B', {text: this.HINT_TITLE}));

	if (this.HINT)
		this.CONTENT_TEXT = this.CONTENT.appendChild(BX.create('DIV')).appendChild(BX.create('SPAN', {html: this.HINT}));

	if (this.PARAMS.preventHide)
	{
		BX.bind(this.DIV, 'mouseout', BX.proxy(this.Hide, this));
		BX.bind(this.DIV, 'mouseover', BX.proxy(this.Show, this));
	}

	this.bInited = true;
};

/*************************** admin informer **********************************/
BX.adminInformer = {

	itemsShow: 3,

	Init: function (itemsShow)
	{
		if(itemsShow)
			BX.adminInformer.itemsShow = itemsShow;

		var informer = BX("admin-informer");

		if(informer)
			document.body.appendChild(informer);

		BX.addCustomEvent("onTopPanelCollapse", BX.proxy(BX.adminInformer.Close, BX.adminInformer));
	},

	Toggle: function(notifyBlock)
	{
		var informer = BX("admin-informer");

		if(!informer)
			return false;

		var pos = BX.pos(notifyBlock);

		informer.style.top = (parseInt(pos.top)+parseInt(pos.height)+7)+'px';
		informer.style.left = pos.left+'px';

		if(!BX.hasClass(informer, "adm-informer-active"))
			BX.adminInformer.Show(informer);
		else
			BX.adminInformer.Hide(informer);

		return false;
	},

	Close: function()
	{
		BX.adminInformer.Hide(BX("admin-informer"));
	},

	OnInnerClick: function(event)
	{
		var target = event.target || event.srcElement;

		if(target.nodeName.toLowerCase() != 'a' || BX.hasClass(target,"adm-informer-footer"))
		{
			return BX.PreventDefault(event);
		}

		return true;
	},

	ToggleExtra : function()
	{
		var footerLink = BX("adm-informer-footer");

		if (BX.hasClass(footerLink, "adm-informer-footer-collapsed"))
			this.ShowAll();
		else
			this.HideExtra();

		return false;
	},

	ShowAll: function()
	{
		var informer = BX("admin-informer");
		for(var i=0; i<informer.children.length; i++)

			if(BX.hasClass(informer.children[i], "adm-informer-item") && informer.children[i].style.display == "none") {
				informer.children[i].style.display = "block";
			}

		var footerLink = BX("adm-informer-footer");

		if(footerLink.textContent !== undefined)
			footerLink.textContent = BX.message('JSADM_AI_HIDE_EXTRA');
		else
			footerLink.innerText = BX.message('JSADM_AI_HIDE_EXTRA');

		BX.removeClass(footerLink, "adm-informer-footer-collapsed");

		return false;
	},

	HideExtra: function()
	{
		var informer = BX("admin-informer");
		var hided = 0;

		for(var i=BX.adminInformer.itemsShow+1; i<informer.children.length; i++)
		{
			if (BX.hasClass(informer.children[i], "adm-informer-item") && informer.children[i].style.display == "block") {
				informer.children[i].style.display = "none";
				hided++;
			}
		}

		var footerLink = BX("adm-informer-footer");

		var linkText = BX.message('JSADM_AI_ALL_NOTIF')+" ("+(BX.adminInformer.itemsShow+parseInt(hided))+")";

		if(footerLink.textContent !== undefined)
			footerLink.textContent = linkText;
		else
			footerLink.innerText = linkText;

		BX.addClass(footerLink, "adm-informer-footer-collapsed");

		return false;
	},

	Show: function(informer)
	{
		var notifButton = BX("adm-header-notif-block");
		if (notifButton)
			BX.addClass(notifButton, "adm-header-notif-block-active");

		BX.onCustomEvent(informer, 'onBeforeAdminInformerShow');
		setTimeout(
			BX.proxy(function() {
					BX.bind(document, "click", BX.proxy(BX.adminInformer.Close, BX.adminInformer));
				},
				BX.adminInformer
			),0
		);
		BX.addClass(informer, "adm-informer-active");
		setTimeout(function() {BX.addClass(informer, "adm-informer-animate");},0);
	},

	Hide: function(informer)
	{
		var notifButton = BX("adm-header-notif-block");
		if (notifButton)
			BX.removeClass(notifButton, "adm-header-notif-block-active");

		BX.unbind(document, "click", BX.proxy(BX.adminInformer.Close, BX.adminInformer));

		BX.removeClass(informer, "adm-informer-animate");

		if (this.IsAnimationSupported())
			setTimeout(function() {BX.removeClass(informer, "adm-informer-active");}, 300);
		else
			BX.removeClass(informer, "adm-informer-active");

		BX.onCustomEvent(informer, 'onAdminInformerHide');
		//setTimeout(function() {BX.adminInformer.HideExtra();},500);
	},

	IsAnimationSupported : function()
	{
		var d = document.body || document.documentElement;
		if (typeof(d.style.transition) == "string")
			return true;
		else if (typeof(d.style.MozTransition) == "string")
			return true;
		else if (typeof(d.style.OTransition) == "string")
			return true;
		else if (typeof(d.style.WebkitTransition) == "string")
			return true;
		else if (typeof(d.style.msTransition) == "string")
			return true;

		return false;
	},


	SetItemHtml: function(itemIdx, html)
	{
		var itemHtmlDiv = BX("adm-informer-item-html-"+itemIdx);

		if(!itemHtmlDiv)
			return false;

		itemHtmlDiv.innerHTML = html;

		return true;
	},

	SetItemFooter: function(itemIdx, html)
	{
		var itemFooterDiv = BX("adm-informer-item-footer-"+itemIdx);

		if(!itemFooterDiv)
			return false;

		itemFooterDiv.innerHTML = html;

		if(html)
			itemFooterDiv.style.display = "block";
		else
			itemFooterDiv.style.display = "none";

		return true;
	}

};

})(window);

/* End */
;
; /* Start:/bitrix/js/main/cphttprequest.js*/
function PShowWaitMessage(container_id, bHide)
{
	if (bHide == null) bHide = false;
	PCloseWaitMessage(container_id, bHide);

	var obContainer = document.getElementById(container_id);

	if (obContainer)
	{
		if (window.ajaxMessages == null) window.ajaxMessages = {};
		if (!window.ajaxMessages.wait) window.ajaxMessages.wait = 'Wait...';

		obContainer.innerHTML = window.ajaxMessages.wait;

		if (bHide) obContainer.style.display = 'inline';
	}
}

function PCloseWaitMessage(container_id, bHide)
{
	if (bHide == null) bHide = false;

	var obContainer = document.getElementById(container_id);

	if (obContainer)
	{
		obContainer.innerHTML = '';

		if (bHide) obContainer.style.display = 'none';
	}

}

function JCPHttpRequest()
{
	this.Action = {}; //{TID:function(result){}}

	this.InitThread = function()
	{
		while (true)
		{
			var TID = 'TID' + Math.floor(Math.random() * 1000000);
			if (!this.Action[TID]) break;
		}

		return TID;
	}

	this.SetAction = function(TID, actionHandler)
	{
		this.Action[TID] = actionHandler;
	}

	this._Close = function(TID, httpRequest)
	{
		if (this.Action[TID]) this.Action[TID] = null;
//		httpRequest.onreadystatechange = null;
		httpRequest = null;
	}

	this._OnDataReady = function(TID, result)
	{
		if(this.Action[TID])
		{
			this.Action[TID](result);
		}
	}

	this._CreateHttpObject = function()
	{
		var obj = null;
		if(window.XMLHttpRequest)
		{
			try {obj = new XMLHttpRequest();} catch(e){}
		}
        else if(window.ActiveXObject)
        {
            try {obj = new ActiveXObject("Microsoft.XMLHTTP");} catch(e){}
            if(!obj)
            	try {obj = new ActiveXObject("Msxml2.XMLHTTP");} catch (e){}
        }
        return obj;
	}

	this._SetHandler = function(TID, httpRequest)
	{
		var _this = this;

		function __handlerReadyStateChange()
		{
			//alert(httpRequest.readyState);
			if(httpRequest.readyState == 4)
			{
//				try
//				{
					var s = httpRequest.responseText;
					var code = [];
					var start;
					
					while((start = s.indexOf('<script>')) != -1)
					{
						var end = s.indexOf('</script>', start);
						if(end != -1)
						{
							code[code.length] = s.substr(start+8, end-start-8);
							s = s.substr(0, start) + s.substr(end+9);
						}
						else
						{
							s = s.substr(0, start) + s.substr(start+8);
						}
					}
					
					_this._OnDataReady(TID, s);

					for(var i in code)
						if(code[i] != '')
							eval(code[i]);
//				}
//				catch (e)
//				{
//					var w = window.open("about:blank");
//					w.document.write(httpRequest.responseText);
//					//w.document.close();
//				}

				_this._Close(TID, httpRequest);
			}
			//alert('done');
		}

		httpRequest.onreadystatechange = __handlerReadyStateChange;
	}

	this._MyEscape = function(str)
	{
		return escape(str).replace(/\+/g, '%2B');
	}

	this._PrepareData = function(arData, prefix)
	{
		var data = '';
		if (arData != null)
		{
			for(var i in arData)
			{
				if (data.length > 0) data += '&';
				var name = this._MyEscape(i);
				if(prefix)
					name = prefix + '[' + name + ']';
				if(typeof arData[i] == 'object')
					data += this._PrepareData(arData[i], name)
				else
					data += name + '=' + this._MyEscape(arData[i])
			}
		}
		return data;
	}

	this.Send = function(TID, url, arData)
	{
		if (arData != null)
			var data = this._PrepareData(arData);

		if (data.length > 0)
		{
			if (url.indexOf('?') == -1)
		 		url += '?' + data;
		 	else
				url += '&' + data;	
		}

		var httpRequest = this._CreateHttpObject();
		if(httpRequest)
		{
			httpRequest.open("GET", url, true);
			this._SetHandler(TID, httpRequest);
			return httpRequest.send("");
  		}
  		return false;
	}

	this.Post = function(TID, url, arData)
	{
		var data = '';

		if (arData != null)
			data = this._PrepareData(arData);

		var httpRequest = this._CreateHttpObject();
		if(httpRequest)
		{
			httpRequest.open("POST", url, true);
			this._SetHandler(TID, httpRequest);
			httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			return httpRequest.send(data);
  		}
  		return false;
	}

	this.__migrateSetHandler = function(obForm, obFrame, handler)
	{
		function __formResultHandler()
		{
			if (!obFrame.contentWindow.document || obFrame.contentWindow.document.body.innerHTML.length == 0) return;
			if (null != handler) 
				handler(obFrame.contentWindow.document.body.innerHTML);
			
			// uncomment next to return form back after first query
			
			/*
			obForm.target = '';
			obForm.removeChild(obForm.lastChild);
			document.body.removeChild(obFrame);
			*/
		}
		
		if (obFrame.addEventListener) 
		{
			obFrame.addEventListener("load", __formResultHandler, false);
		}
		else if (obFrame.attachEvent) 
		{
			obFrame.attachEvent("onload", __formResultHandler);
		}
	}
	
	this.MigrateFormToAjax = function(obForm, handler)
	{
		if (!obForm) 
			return;
		if (obForm.target && obForm.target.substring(0, 5) == 'AJAX')
			return;
		
		var obAJAXIndicator = document.createElement('INPUT');
		obAJAXIndicator.type = 'hidden';
		obAJAXIndicator.name = 'AJAX_CALL';
		obAJAXIndicator.value = 'Y';
		
		obForm.appendChild(obAJAXIndicator);
		
		var frameName = 'AJAX_' + Math.round(Math.random() * 100000);
		
		if (document.getElementById('frameName'))
			var obFrame = document.getElementById('frameName');
		else
		{
			if (currentBrowserDetected == 'IE')
				var obFrame = document.createElement('<iframe name="' + frameName + '"></iframe>');
			else
				var obFrame = document.createElement('IFRAME');
			
			obFrame.style.display = 'none';
			obFrame.src = '';
			obFrame.id = frameName;
			obFrame.name = frameName;
			
			document.body.appendChild(obFrame);
		}
		
		obForm.target = frameName;
		
		this.__migrateSetHandler(obForm, obFrame, handler);
	}
}

var CPHttpRequest = new JCPHttpRequest();

var currentBrowserDetected = "";
if (window.opera)
	currentBrowserDetected = "Opera";
else if (navigator.userAgent)
{
	if (navigator.userAgent.indexOf("MSIE") != -1)
		currentBrowserDetected = "IE";
	else if (navigator.userAgent.indexOf("Firefox") != -1)
		currentBrowserDetected = "Firefox";
}
		

/* End */
;
; /* Start:/bitrix/js/main/utils.js*/
var phpVars;
if(!phpVars)
{
	phpVars = {
		ADMIN_THEME_ID: '.default',
		LANGUAGE_ID: 'en',
		FORMAT_DATE: 'DD.MM.YYYY',
		FORMAT_DATETIME: 'DD.MM.YYYY HH:MI:SS',
		opt_context_ctrl: false,
		cookiePrefix: 'BITRIX_SM',
		titlePrefix: '',
		bitrix_sessid: '',
		messHideMenu: '',
		messShowMenu: '',
		messHideButtons: '',
		messShowButtons: '',
		messFilterInactive: '',
		messFilterActive: '',
		messFilterLess: '',
		messLoading: 'Loading...',
		messMenuLoading: '',
		messMenuLoadingTitle: '',
		messNoData: '',
		messExpandTabs: '',
		messCollapseTabs: '',
		messPanelFixOn: '',
		messPanelFixOff: '',
		messPanelCollapse: '',
		messPanelExpand: ''
	};
}

var jsUtils =
{
	arEvents: Array(),

	addEvent: function(el, evname, func, capture)
	{
		if(el.attachEvent) // IE
			el.attachEvent("on" + evname, func);
		else if(el.addEventListener) // Gecko / W3C
			el.addEventListener(evname, func, false);
		else
			el["on" + evname] = func;
		this.arEvents[this.arEvents.length] = {'element': el, 'event': evname, 'fn': func};
	},

	removeEvent: function(el, evname, func)
	{
		if(el.detachEvent) // IE
			el.detachEvent("on" + evname, func);
		else if(el.removeEventListener) // Gecko / W3C
			el.removeEventListener(evname, func, false);
		else
			el["on" + evname] = null;
	},

	removeAllEvents: function(el)
	{
		var i;
		for(i=0; i<this.arEvents.length; i++)
		{
			if(this.arEvents[i] && (el==false || el==this.arEvents[i].element))
			{
				jsUtils.removeEvent(this.arEvents[i].element, this.arEvents[i].event, this.arEvents[i].fn);
				this.arEvents[i] = null;
			}
		}
		if(el==false)
			this.arEvents.length = 0;
	},

	IsDoctype: function()
	{
		if (document.compatMode)
			return (document.compatMode == "CSS1Compat");

		if (document.documentElement && document.documentElement.clientHeight)
			return true;

		return false;
	},

	GetRealPos: function(el)
	{
		if(window.BX)
			return BX.pos(el);

		if(!el || !el.offsetParent)
			return false;

		var res = Array();
		res["left"] = el.offsetLeft;
		res["top"] = el.offsetTop;
		var objParent = el.offsetParent;

		while(objParent && objParent.tagName != "BODY")
		{
			res["left"] += objParent.offsetLeft;
			res["top"] += objParent.offsetTop;
			objParent = objParent.offsetParent;
		}
		res["right"] = res["left"] + el.offsetWidth;
		res["bottom"] = res["top"] + el.offsetHeight;

		return res;
	},

	FindChildObject: function(obj, tag_name, class_name, recursive)
	{
		if(!obj)
			return null;
		var tag = tag_name.toUpperCase();
		var cl = (class_name? class_name.toLowerCase() : null);
		var n = obj.childNodes.length;
		for(var j=0; j<n; j++)
		{
			var child = obj.childNodes[j];
			if(child.tagName && child.tagName.toUpperCase() == tag)
				if(!class_name || child.className.toLowerCase() == cl)
					return child;
			if(recursive == true)
			{
				var deepChild;
				if((deepChild = jsUtils.FindChildObject(child, tag_name, class_name, true)))
					return deepChild;
			}
		}
		return null;
	},

	FindParentObject: function(obj, tag_name, class_name)
	{
		if(!obj)
			return null;
		var o = obj;
		var tag = tag_name.toUpperCase();
		var cl = (class_name? class_name.toLowerCase() : null);
		while(o.parentNode)
		{
			var parent = o.parentNode;
			if(parent.tagName && parent.tagName.toUpperCase() == tag)
				if(!class_name || parent.className.toLowerCase() == cl)
					return parent;
			o = parent;
		}
		return null;
	},

	FindNextSibling: function(obj, tag_name)
	{
		if(!obj)
			return null;
		var o = obj;
		var tag = tag_name.toUpperCase();
		while(o.nextSibling)
		{
			var sibling = o.nextSibling;
			if(sibling.tagName && sibling.tagName.toUpperCase() == tag)
				return sibling;
			o = sibling;
		}
		return null;
	},

	FindPreviousSibling: function(obj, tag_name)
	{
		if(!obj)
			return null;
		var o = obj;
		var tag = tag_name.toUpperCase();
		while(o.previousSibling)
		{
			var sibling = o.previousSibling;
			if(sibling.tagName && sibling.tagName.toUpperCase() == tag)
				return sibling;
			o = sibling;
		}
		return null;
	},

	bOpera : navigator.userAgent.toLowerCase().indexOf('opera') != -1,
	bIsIE : document.attachEvent && navigator.userAgent.toLowerCase().indexOf('opera') == -1,

	IsIE: function()
	{
		return this.bIsIE;
	},

	IsOpera: function()
	{
		return this.bOpera;
	},

	IsSafari: function()
	{
		var userAgent = navigator.userAgent.toLowerCase();
		return (/webkit/.test(userAgent));
	},

	IsEditor: function()
	{
		var userAgent = navigator.userAgent.toLowerCase();
		var version = (userAgent.match( /.+(msie)[\/: ]([\d.]+)/ ) || [])[2];
		var safari = /webkit/.test(userAgent);

		if (this.IsOpera() || (document.all && !document.compatMode && version < 6) || safari)
			return false;

		return true;
	},

	ToggleDiv: function(div)
	{
		var style = document.getElementById(div).style;
		if(style.display!="none")
			style.display = "none";
		else
			style.display = "block";
		return (style.display != "none");
	},

	urlencode: function(s)
	{
		return escape(s).replace(new RegExp('\\+','g'), '%2B');
	},

	OpenWindow: function(url, width, height)
	{
		var w = screen.width, h = screen.height;
		if(this.IsOpera())
		{
			w = document.body.offsetWidth;
			h = document.body.offsetHeight;
		}
		window.open(url, '', 'status=no,scrollbars=yes,resizable=yes,width='+width+',height='+height+',top='+Math.floor((h - height)/2-14)+',left='+Math.floor((w - width)/2-5));
	},

	SetPageTitle: function(s)
	{
		document.title = phpVars.titlePrefix+s;
		var h1 = document.getElementsByTagName("H1");
		if(h1)
			h1[0].innerHTML = s;
	},

	LoadPageToDiv: function(url, div_id)
	{
		var div = document.getElementById(div_id);
		if(!div)
			return;
		CHttpRequest.Action = function(result)
		{
			CloseWaitWindow();
			document.getElementById(div_id).innerHTML = result;
		}
		ShowWaitWindow();
		CHttpRequest.Send(url);
	},

	trim: function(s)
	{
		if (typeof s == 'string' || typeof s == 'object' && s.constructor == String)
		{
			var r, re;

			re = /^[\s\r\n]+/g;
			r = s.replace(re, "");
			re = /[\s\r\n]+$/g;
			r = r.replace(re, "");
			return r;
		}
		else
			return s;
	},

	Redirect: function(args, url)
	{
		var e = null, bShift = false;
		if(args && args.length > 0)
			e = args[0];
		if(!e)
			e = window.event;
		if(e)
			bShift = e.shiftKey;

		if(bShift)
			window.open(url);
		else
		{
			window.location.href=url;
		}
	},

	False: function(){return false;},

	AlignToPos: function(pos, w, h)
	{
		var x = pos["left"], y = pos["bottom"];

		var scroll = jsUtils.GetWindowScrollPos();
		var size = jsUtils.GetWindowInnerSize();

		if((size.innerWidth + scroll.scrollLeft) - (pos["left"] + w) < 0)
		{
			if(pos["right"] - w >= 0 )
				x = pos["right"] - w;
			else
				x = scroll.scrollLeft;
		}

		if((size.innerHeight + scroll.scrollTop) - (pos["bottom"] + h) < 0)
		{
			if(pos["top"] - h >= 0)
				y = pos["top"] - h;
			else
				y = scroll.scrollTop;
		}

		return {'left':x, 'top':y};
	},

	// evaluate js string in window scope
	EvalGlobal: function(script)
	{
		try {
		if (window.execScript)
			window.execScript(script, 'javascript');
		else if (jsUtils.IsSafari())
			window.setTimeout(script, 0);
		else
			window.eval(script);
		} catch (e) {/*alert("Error! jsUtils.EvalGlobal");*/}
	},

	GetStyleValue: function(el, styleProp)
	{
		var res;
		if(el.currentStyle)
			res = el.currentStyle[styleProp];
		else if(window.getComputedStyle)
			res = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
		if(!res)
			res = '';
		return res;
	},

	GetWindowInnerSize: function(pDoc)
	{
		var width, height;
		if (!pDoc)
			pDoc = document;

		if (self.innerHeight) // all except Explorer
		{
			width = self.innerWidth;
			height = self.innerHeight;
		}
		else if (pDoc.documentElement && (pDoc.documentElement.clientHeight || pDoc.documentElement.clientWidth)) // Explorer 6 Strict Mode
		{
			width = pDoc.documentElement.clientWidth;
			height = pDoc.documentElement.clientHeight;
		}
		else if (pDoc.body) // other Explorers
		{
			width = pDoc.body.clientWidth;
			height = pDoc.body.clientHeight;
		}
		return {innerWidth : width, innerHeight : height};
	},

	GetWindowScrollPos: function(pDoc)
	{
		var left, top;
		if (!pDoc)
			pDoc = document;

		if (self.pageYOffset) // all except Explorer
		{
			left = self.pageXOffset;
			top = self.pageYOffset;
		}
		else if (pDoc.documentElement && (pDoc.documentElement.scrollTop || pDoc.documentElement.scrollLeft)) // Explorer 6 Strict
		{
			left = document.documentElement.scrollLeft;
			top = document.documentElement.scrollTop;
		}
		else if (pDoc.body) // all other Explorers
		{
			left = pDoc.body.scrollLeft;
			top = pDoc.body.scrollTop;
		}
		return {scrollLeft : left, scrollTop : top};
	},

	GetWindowScrollSize: function(pDoc)
	{
		var width, height;
		if (!pDoc)
			pDoc = document;

		if ( (pDoc.compatMode && pDoc.compatMode == "CSS1Compat"))
		{
			width = pDoc.documentElement.scrollWidth;
			height = pDoc.documentElement.scrollHeight;
		}
		else
		{
			if (pDoc.body.scrollHeight > pDoc.body.offsetHeight)
				height = pDoc.body.scrollHeight;
			else
				height = pDoc.body.offsetHeight;

			if (pDoc.body.scrollWidth > pDoc.body.offsetWidth ||
				(pDoc.compatMode && pDoc.compatMode == "BackCompat") ||
				(pDoc.documentElement && !pDoc.documentElement.clientWidth)
			)
				width = pDoc.body.scrollWidth;
			else
				width = pDoc.body.offsetWidth;
		}
		return {scrollWidth : width, scrollHeight : height};
	},

	GetWindowSize: function()
	{
		var innerSize = jsUtils.GetWindowInnerSize();
		var scrollPos = jsUtils.GetWindowScrollPos();
		var scrollSize = jsUtils.GetWindowScrollSize();

		return  {
			innerWidth : innerSize.innerWidth, innerHeight : innerSize.innerHeight,
			scrollLeft : scrollPos.scrollLeft, scrollTop : scrollPos.scrollTop,
			scrollWidth : scrollSize.scrollWidth, scrollHeight : scrollSize.scrollHeight
		};
	},


	arCustomEvents: {},

	addCustomEvent: function(eventName, eventHandler, arParams, handlerContextObject)
	{
		if (!this.arCustomEvents[eventName])
			this.arCustomEvents[eventName] = [];

		if (!arParams)
			arParams = [];
		if (!handlerContextObject)
			handlerContextObject = false;

		this.arCustomEvents[eventName].push(
			{
				handler: eventHandler,
				arParams: arParams,
				obj: handlerContextObject
			}
		);
	},

	removeCustomEvent: function(eventName, eventHandler)
	{
		if (!this.arCustomEvents[eventName])
			return;

		var l = this.arCustomEvents[eventName].length;
		if (l == 1)
		{
			delete this.arCustomEvents[eventName];
			return;
		}

		for (var i = 0; i < l; i++)
		{
			if (!this.arCustomEvents[eventName][i])
				continue;
			if (this.arCustomEvents[eventName][i].handler == eventHandler)
			{
				delete this.arCustomEvents[eventName][i];
				return;
			}
		}
	},

	onCustomEvent: function(eventName, arEventParams)
	{
		if (!this.arCustomEvents[eventName])
			return;

		if (!arEventParams)
			arEventParams = [];

		var h;
		for (var i = 0, l = this.arCustomEvents[eventName].length; i < l; i++)
		{
			h = this.arCustomEvents[eventName][i];
			if (!h || !h.handler)
				continue;

			if (h.obj)
				h.handler.call(h.obj, h.arParams, arEventParams);
			else
				h.handler(h.arParams, arEventParams);
		}
	},

	loadJSFile: function(arJs, oCallBack, pDoc)
	{
		if (!pDoc)
			pDoc = document;
		if (typeof arJs == 'string')
			arJs = [arJs];
		var callback = function()
		{
			if (!oCallBack)
				return;
			if (typeof oCallBack == 'function')
				return oCallBack();
			if (typeof oCallBack != 'object' || !oCallBack.func)
				return;
			var p = oCallBack.params || {};
			if (oCallBack.obj)
				oCallBack.func.apply(oCallBack.obj, p);
			else
				oCallBack.func(p);
		};
		var load_js = function(ind)
		{
			if (ind >= arJs.length)
				return callback();
			var oSript = pDoc.body.appendChild(pDoc.createElement('script'));
			oSript.src = arJs[ind];
			var bLoaded = false;
			oSript.onload = oSript.onreadystatechange = function()
			{
				if (!bLoaded && (!oSript.readyState || oSript.readyState == "loaded" || oSript.readyState == "complete"))
				{
					bLoaded = true;
					setTimeout(function (){load_js(++ind);}, 50);
				}
			};
		};
		load_js(0);
	},

	loadCSSFile: function(arCSS, pDoc, pWin)
	{
		if (typeof arCSS == 'string')
		{
			var bSingle = true;
			arCSS = [arCSS];
		}
		var i, l = arCSS.length, pLnk = [];
		if (l == 0)
			return;
		if (!pDoc)
			pDoc = document;
		if (!pWin)
			pWin = window;
		if (!pWin.bxhead)
		{
			var heads = pDoc.getElementsByTagName('HEAD');
			pWin.bxhead = heads[0];
		}
		if (!pWin.bxhead)
			return;
		for (i = 0; i < l; i++)
		{
			var lnk = document.createElement('LINK');
			lnk.href = arCSS[i];
			lnk.rel = 'stylesheet';
			lnk.type = 'text/css';
			pWin.bxhead.appendChild(lnk);
			pLnk.push(lnk);
		}
		if (bSingle)
			return lnk;
		return pLnk;
	},

	appendBXHint : function(node, html)
	{
		if (!node || !node.parentNode || !html)
			return;
		var oBXHint = new BXHint(html);
		node.parentNode.insertBefore(oBXHint.oIcon, node);
		node.parentNode.removeChild(node);
		oBXHint.oIcon.style.marginLeft = "5px";
	},

	PreventDefault : function(e)
	{
		if(!e) e = window.event;
		if(e.stopPropagation)
		{
			e.preventDefault();
			e.stopPropagation();
		}
		else
		{
			e.cancelBubble = true;
			e.returnValue = false;
		}
		return false;
	},

	CreateElement: function(tag, arAttr, arStyles, pDoc)
	{
		if (!pDoc)
			pDoc = document;
		var pEl = pDoc.createElement(tag), p;
		if(arAttr)
		{
			for(p in arAttr)
			{
				if(p == 'className' || p == 'class')
				{
					pEl.setAttribute('class', arAttr[p]);
					if (jsUtils.IsIE())
						pEl.setAttribute('className', arAttr[p]);
					continue;
				}

				if (arAttr[p] != undefined && arAttr[p] != null)
					pEl.setAttribute(p, arAttr[p]);
			}
		}
		if(arStyles)
		{
			for(p in arStyles)
				pEl.style[p] = arStyles[p];
		}
		return pEl;
	},

	in_array: function(needle, haystack)
	{
		for(var i=0; i<haystack.length; i++)
		{
			if(haystack[i] == needle)
				return true;
		}
		return false;
	},

	htmlspecialchars: function(str)
	{
		if(!str.replace)
			return str;

		return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	}
}

/************************************************/

function JCFloatDiv()
{
	var _this = this;
	this.floatDiv = null;
	this.x = this.y = 0;

	this.Create = function(arParams)
	{
		var div = document.body.appendChild(document.createElement("DIV"));
		div.id = arParams.id;
		div.style.position = 'absolute';
		div.style.left = '-10000px';
		div.style.top = '-10000px';
		if(arParams.className)
			div.className = arParams.className;
		if(arParams.zIndex)
			div.style.zIndex = arParams.zIndex;
		if(arParams.width)
			div.style.width = arParams.width+'px';
		if(arParams.height)
			div.style.height = arParams.height+'px';
		return div;
	}

	this.Show = function(div, left, top, dxShadow, restrictDrag, showSubFrame)
	{
		if (showSubFrame !== false)
			showSubFrame = true;
		var zIndex = parseInt(div.style.zIndex);
		if(zIndex <= 0 || isNaN(zIndex))
			zIndex = 100;

		//document.title = 'zIndex = ' + zIndex;
		div.style.zIndex = zIndex;

		if (left < 0)
			left = 0;

		if (top < 0)
			top = 0;

		div.style.left = parseInt(left) + "px";
		div.style.top = parseInt(top) + "px";

		if(jsUtils.IsIE() && showSubFrame === true)
		{
			var frame = document.getElementById(div.id+"_frame");
			if(!frame)
			{
				frame = document.createElement("IFRAME");
				frame.src = "javascript:''";
				frame.id = div.id+"_frame";
				frame.style.position = 'absolute';
				frame.style.borderWidth = '0px';
				frame.style.zIndex = zIndex-1;
				document.body.appendChild(frame);
			}
			frame.style.width = div.offsetWidth + "px";
			frame.style.height = div.offsetHeight + "px";
			frame.style.left = div.style.left;
			frame.style.top = div.style.top;
			frame.style.visibility = 'visible';
		}

		/*Restrict drag*/
		div.restrictDrag = restrictDrag || false;

		/*shadow*/
		if(isNaN(dxShadow))
			dxShadow = 5;

		if(dxShadow > 0)
		{
			var img = document.getElementById(div.id+'_shadow');
			if(!img)
			{
				if(jsUtils.IsIE())
				{
		 			img = document.createElement("DIV");
		 			img.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/themes/"+phpVars.ADMIN_THEME_ID+"/images/shadow.png',sizingMethod='scale')";
				}
				else
				{
		 			img = document.createElement("IMG");
					img.src = '/bitrix/themes/' + phpVars.ADMIN_THEME_ID+'/images/shadow.png';
				}
				img.id = div.id+'_shadow';
				img.style.position = 'absolute';
				img.style.zIndex = zIndex-2;
				img.style.left = '-1000px';
				img.style.top = '-1000px';
				img.style.lineHeight = 'normal';
				img.className = "bx-js-float-shadow";
				document.body.appendChild(img);
			}
			img.style.width = div.offsetWidth+'px';
			img.style.height = div.offsetHeight+'px';
			img.style.left = parseInt(div.style.left)+dxShadow+'px';
			img.style.top = parseInt(div.style.top)+dxShadow+'px';
			img.style.visibility = 'visible';
		}
		div.dxShadow = dxShadow;
	}

	this.Close = function(div)
	{
		if(!div)
			return;
		var sh = document.getElementById(div.id+"_shadow");
		if(sh)
			sh.style.visibility = 'hidden';

		var frame = document.getElementById(div.id+"_frame");
		if(frame)
			frame.style.visibility = 'hidden';
	}

	this.Move = function(div, x, y)
	{
		if(!div)
			return;

		var dxShadow = div.dxShadow;
		var left = parseInt(div.style.left)+x;
		var top = parseInt(div.style.top)+y;

		if (div.restrictDrag)
		{
			//Left side
			if (left < 0)
				left = 0;

			//Right side
			if ( (document.compatMode && document.compatMode == "CSS1Compat"))
				windowWidth = document.documentElement.scrollWidth;
			else
			{
				if (document.body.scrollWidth > document.body.offsetWidth ||
					(document.compatMode && document.compatMode == "BackCompat") ||
					(document.documentElement && !document.documentElement.clientWidth)
				)
					windowWidth = document.body.scrollWidth;
				else
					windowWidth = document.body.offsetWidth;
			}

			var floatWidth = div.offsetWidth;
			if (left > (windowWidth - floatWidth - dxShadow))
				left = windowWidth - floatWidth - dxShadow;

			//Top side
			if (top < 0)
				top = 0;
		}

		div.style.left = left+'px';
		div.style.top = top+'px';

		this.AdjustShadow(div);
	}

	this.HideShadow = function(div)
	{
		var sh = document.getElementById(div.id + "_shadow");
		sh.style.visibility = 'hidden';
	}

	this.UnhideShadow = function(div)
	{
		var sh = document.getElementById(div.id + "_shadow");
		sh.style.visibility = 'visible';
	}

	this.AdjustShadow = function(div)
	{
		var sh = document.getElementById(div.id + "_shadow");
		if(sh && sh.style.visibility != 'hidden')
		{
			var dxShadow = div.dxShadow;

			sh.style.width = div.offsetWidth+'px';
			sh.style.height = div.offsetHeight+'px';
			sh.style.left = parseInt(div.style.left)+dxShadow+'px';
			sh.style.top = parseInt(div.style.top)+dxShadow+'px';
		}

		var frame = document.getElementById(div.id+"_frame");
		if(frame)
		{
			frame.style.width = div.offsetWidth + "px";
			frame.style.height = div.offsetHeight + "px";
			frame.style.left = div.style.left;
			frame.style.top = div.style.top;
		}
	}

	this.StartDrag = function(e, div)
	{
		if(!e)
			e = window.event;
		this.x = e.clientX + document.body.scrollLeft;
		this.y = e.clientY + document.body.scrollTop;
		this.floatDiv = div;

		jsUtils.addEvent(document, "mousemove", this.MoveDrag);
		document.onmouseup = this.StopDrag;
		if(document.body.setCapture)
			document.body.setCapture();

		document.onmousedown = jsUtils.False;
		var b = document.body;
		b.ondrag = jsUtils.False;
		b.onselectstart = jsUtils.False;
		b.style.MozUserSelect = _this.floatDiv.style.MozUserSelect = 'none';
		b.style.cursor = 'move';
	}

	this.StopDrag = function(e)
	{
		if(document.body.releaseCapture)
			document.body.releaseCapture();

		jsUtils.removeEvent(document, "mousemove", _this.MoveDrag);
		document.onmouseup = null;

		this.floatDiv = null;

		document.onmousedown = null;
		var b = document.body;
		b.ondrag = null;
		b.onselectstart = null;
		b.style.MozUserSelect = _this.floatDiv.style.MozUserSelect = '';
		b.style.cursor = '';
	}

	this.MoveDrag = function(e)
	{
		var x = e.clientX + document.body.scrollLeft;
		var y = e.clientY + document.body.scrollTop;

		if(_this.x == x && _this.y == y)
			return;

		_this.Move(_this.floatDiv, (x - _this.x), (y - _this.y));
		_this.x = x;
		_this.y = y;
	}
}
var jsFloatDiv = new JCFloatDiv();

/************************************************/

var BXHint = function(innerHTML, element, addParams)
{
	this.oDivOver = false;
	this.timeOutID = null;
	this.oIcon = null;
	this.freeze = false;
	this.x = 0;
	this.y = 0;
	this.time = 700;

	if (!innerHTML)
		innerHTML = "";
	this.Create(innerHTML, element, addParams);
}

BXHint.prototype.Create = function(innerHTML, element, addParams)
{
	var
		_this = this,
		width = 0,
		height = 0,
		className = null,
		type = "icon";
	this.bWidth = true;

	if (addParams)
	{
		if (addParams.width === false)
			this.bWidth = false;
		else if (addParams.width)
			width = addParams.width;

		if (addParams.height)
			height = addParams.height;

		if (addParams.className)
			className = addParams.className;

		if (addParams.type && (addParams.type == "link" || addParams.type == "icon"))
			type = addParams.type;
		if (addParams.time > 0)
			this.time = addParams.time;
	}

	if (element)
		type = "element";

	if (type == "icon")
	{
		var element = document.createElement("IMG");
		element.src = (addParams && addParams.iconSrc) ? addParams.iconSrc : "/bitrix/themes/"+phpVars.ADMIN_THEME_ID+"/public/popup/hint.gif";
		element.ondrag = jsUtils.False;
	}
	else if (type == "link")
	{
		var element = document.createElement("A");
		element.href = "";
		element.onclick = function(e){return false;}
		element.innerHTML = "[?]";
	}

	this.element = element;
	if (type == "element")
	{
		if(addParams && addParams.show_on_click)
		{
			jsUtils.addEvent(
				element,
				"click",
				function (event)
				{
					if (!event)
						event = window.event;
					_this.GetMouseXY(event);
					_this.timeOutID = setTimeout(function () {_this.Show(innerHTML,width,height,className) }, 10);
				}
			);
		}
		else
		{
			jsUtils.addEvent(
				element,
				"mouseover",
				function (event)
				{
					if (!event)
						event = window.event;
					_this.GetMouseXY(event);
					_this.timeOutID = setTimeout(function () {_this.Show(innerHTML,width,height,className) }, 750);
				}
			);
		}

		jsUtils.addEvent(
			element,
			"mouseout",
			function(event)
			{
				if (_this.timeOutID)
					clearTimeout(_this.timeOutID);
				_this.SmartHide(_this);
			}
		);
	}
	else
	{
		this.oIcon = element;
		element.onmouseover = function(event) {if (!event) event = window.event; _this.GetMouseXY(event); _this.Show(innerHTML,width,height,className)};
		element.onmouseout = function() {_this.SmartHide(_this);};
	}
}

BXHint.prototype.IsFrozen = function()
{
	return this.freeze;
}

BXHint.prototype.Freeze = function()
{
	this.freeze = true;
	this.Hide();
}

BXHint.prototype.UnFreeze = function()
{
	this.freeze = false;
}

BXHint.prototype.GetMouseXY = function(event)
{
	if (event.pageX || event.pageY)
	{
		this.x = event.pageX;
		this.y = event.pageY;
	}
	else if (event.clientX || event.clientY)
	{
		this.x = event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
		this.y = event.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
	}
}

BXHint.prototype.Show = function(innerHTML, width, height, className)
{
	//Delete previous hint
	var old = document.getElementById("__BXHint_div");
	if (old)
		this.Hide();

	if (this.freeze)
		return;

	var _this = this;
	var oDiv = document.body.appendChild(document.createElement("DIV"));
	oDiv.onmouseover = function(){_this.oDivOver = true};
	oDiv.onmouseout = function(){_this.oDivOver = false; _this.SmartHide(_this);}
	oDiv.id = "__BXHint_div";
	oDiv.className = (className) ? className : "bxhint";
	oDiv.style.position = 'absolute';
	if (width && this.bWidth)
		oDiv.style.width = width + "px";

	if (height)
		oDiv.style.height = height + "px";
	oDiv.innerHTML = innerHTML;

	var w = oDiv.offsetWidth;
	var h = oDiv.offsetHeight;
	if (this.bWidth)
	{
		if (!width && w>200)
			w = Math.round(Math.sqrt(1.618*w*h));
		oDiv.style.width = w + "px";
		h = oDiv.offsetHeight;
	}

	var pos = {left : this.x + 10, right : this.x + w, top : this.y, bottom : this.y + h};

	pos = this.AlignToPos(pos, w, h);

	oDiv.style.zIndex = 2100;

	jsFloatDiv.Show(oDiv, pos.left, pos.top,3);

//	oDiv.ondrag = jsUtils.False;
//	oDiv.onselectstart = jsUtils.False;
//	oDiv.style.MozUserSelect = 'none';
	oDiv = null;
}

BXHint.prototype.AlignToPos = function(pos, w, h)
{
	var body = document.body;
	if((body.clientWidth + body.scrollLeft) < (pos.left + w))
		pos.left = (pos.left - w >= 0) ? (pos.left - w) : body.scrollLeft;

	if((body.clientHeight + body.scrollTop) - (pos["bottom"]) < 0)
		pos.top = (pos.top - h >= 0) ? (pos.top - h) : body.scrollTop;

	return pos;
}

BXHint.prototype.Hide = function()
{
	var oDiv = document.getElementById("__BXHint_div");

	if (!oDiv)
		return;

	jsFloatDiv.Close(oDiv);
	oDiv.parentNode.removeChild(oDiv);
	oDiv = null;
}

BXHint.prototype.SmartHide = function(_this)
{
	setTimeout(function ()
		{
			if (!_this.oDivOver)
				_this.Hide();
		}, 100
	);
}

/************************************************/

function WaitOnKeyPress(e)
{
	if(!e) e = window.event
	if(!e) return;
	if(e.keyCode == 27)
		CloseWaitWindow();
}

function ShowWaitWindow()
{
	CloseWaitWindow();

	var obWndSize = jsUtils.GetWindowSize();

	var div = document.body.appendChild(document.createElement("DIV"));
	div.id = "wait_window_div";
	div.innerHTML = phpVars.messLoading;
	div.className = "waitwindow";
	//div.style.left = obWndSize.scrollLeft + (obWndSize.innerWidth - div.offsetWidth) - (jsUtils.IsIE() ? 5 : 20) + "px";
	div.style.right = (5 - obWndSize.scrollLeft) + 'px';
	div.style.top = obWndSize.scrollTop + 5 + "px";

	if(jsUtils.IsIE())
	{
		var frame = document.createElement("IFRAME");
		frame.src = "javascript:''";
		frame.id = "wait_window_frame";
		frame.className = "waitwindow";
		frame.style.width = div.offsetWidth + "px";
		frame.style.height = div.offsetHeight + "px";
		frame.style.right = div.style.right;
		frame.style.top = div.style.top;
		document.body.appendChild(frame);
	}
	jsUtils.addEvent(document, "keypress", WaitOnKeyPress);
}

function CloseWaitWindow()
{
	jsUtils.removeEvent(document, "keypress", WaitOnKeyPress);

	var frame = document.getElementById("wait_window_frame");
	if(frame)
		frame.parentNode.removeChild(frame);

	var div = document.getElementById("wait_window_div");
	if(div)
		div.parentNode.removeChild(div);
}

/************************************************/

var jsSelectUtils =
{
	addNewOption: function(select_id, opt_value, opt_name, do_sort, check_unique)
	{
		var oSelect = (typeof(select_id) == 'string' || select_id instanceof String? document.getElementById(select_id) : select_id);
		if(oSelect)
		{
			var n = oSelect.length;
			if(check_unique !== false)
			{
				for(var i=0;i<n;i++)
					if(oSelect[i].value==opt_value)
						return;
			}
			var newoption = new Option(opt_name, opt_value, false, false);
			oSelect.options[n]=newoption;
		}
		if(do_sort === true)
			this.sortSelect(select_id);
	},

	deleteOption: function(select_id, opt_value)
	{
		var oSelect = (typeof(select_id) == 'string' || select_id instanceof String? document.getElementById(select_id) : select_id);
		if(oSelect)
		{
			for(var i=0;i<oSelect.length;i++)
				if(oSelect[i].value==opt_value)
				{
					oSelect.remove(i);
					break;
				}
		}
	},

	deleteSelectedOptions: function(select_id)
	{
		var oSelect = (typeof(select_id) == 'string' || select_id instanceof String? document.getElementById(select_id) : select_id);
		if(oSelect)
		{
			var i=0;
			while(i<oSelect.length)
				if(oSelect[i].selected)
				{
					oSelect[i].selected=false;
					oSelect.remove(i);
				}
				else
					i++;
		}
	},

	deleteAllOptions: function(oSelect)
	{
		if(oSelect)
		{
			for(var i=oSelect.length-1; i>=0; i--)
				oSelect.remove(i);
		}
	},

	optionCompare: function(record1, record2)
	{
		var value1 = record1.optText.toLowerCase();
		var value2 = record2.optText.toLowerCase();
		if (value1 > value2) return(1);
		if (value1 < value2) return(-1);
		return(0);
	},

	sortSelect: function(select_id)
	{
		var oSelect = (typeof(select_id) == 'string' || select_id instanceof String? document.getElementById(select_id) : select_id);
		if(oSelect)
		{
			var myOptions = [];
			var n = oSelect.options.length;
			for (var i=0;i<n;i++)
			{
				myOptions[i] = {
					optText:oSelect[i].text,
					optValue:oSelect[i].value
				};
			}
			myOptions.sort(this.optionCompare);
			oSelect.length=0;
			n = myOptions.length;
			for(var i=0;i<n;i++)
			{
				var newoption = new Option(myOptions[i].optText, myOptions[i].optValue, false, false);
				oSelect[i]=newoption;
			}
		}
	},

	selectAllOptions: function(select_id)
	{
		var oSelect = (typeof(select_id) == 'string' || select_id instanceof String? document.getElementById(select_id) : select_id);
		if(oSelect)
		{
			var n = oSelect.length;
			for(var i=0;i<n;i++)
				oSelect[i].selected=true;
		}
	},

	selectOption: function(select_id, opt_value)
	{
		var oSelect = (typeof(select_id) == 'string' || select_id instanceof String? document.getElementById(select_id) : select_id);
		if(oSelect)
		{
			var n = oSelect.length;
			for(var i=0;i<n;i++)
				oSelect[i].selected = (oSelect[i].value == opt_value);
		}
	},

	addSelectedOptions: function(oSelect, to_select_id, check_unique, do_sort)
	{
		if(!oSelect)
			return;
		var n = oSelect.length;
		for(var i=0; i<n; i++)
			if(oSelect[i].selected)
				this.addNewOption(to_select_id, oSelect[i].value, oSelect[i].text, do_sort, check_unique);
	},

	moveOptionsUp: function(oSelect)
	{
		if(!oSelect)
			return;
		var n = oSelect.length;
		for(var i=0; i<n; i++)
		{
			if(oSelect[i].selected && i>0 && oSelect[i-1].selected == false)
			{
				var option1 = new Option(oSelect[i].text, oSelect[i].value);
				var option2 = new Option(oSelect[i-1].text, oSelect[i-1].value);
				oSelect[i] = option2;
				oSelect[i].selected = false;
				oSelect[i-1] = option1;
				oSelect[i-1].selected = true;
			}
		}
	},

	moveOptionsDown: function(oSelect)
	{
		if(!oSelect)
			return;
		var n = oSelect.length;
		for(var i=n-1; i>=0; i--)
		{
			if(oSelect[i].selected && i<n-1 && oSelect[i+1].selected == false)
			{
				var option1 = new Option(oSelect[i].text, oSelect[i].value);
				var option2 = new Option(oSelect[i+1].text, oSelect[i+1].value);
				oSelect[i] = option2;
				oSelect[i].selected = false;
				oSelect[i+1] = option1;
				oSelect[i+1].selected = true;
			}
		}
	}

}

/************************************************/
/* End */
;
; /* Start:/bitrix/js/main/popup_menu.js*/
function PopupMenu(id, zIndex, dxShadow)
{
	var _this = this;
	this.menu_id = id;
	this.controlDiv = null;
	this.zIndex = 100;
	this.dxShadow = 3;
	this.menuItems = null;
	this.submenus = [];
	this.bDoHide = false;
	this.parentItem = null;
	this.parentMenu = null;
	this.submenuIndex = null;
	this.bHasSubmenus = false;

	this.OnClose = null;

	if(!isNaN(zIndex))
		this.zIndex = zIndex;
	if(!isNaN(dxShadow))
		this.dxShadow = dxShadow;

	this.Create = function(zIndex, dxShadow)
	{
		if(!isNaN(zIndex))
			this.zIndex = zIndex;
		if(!isNaN(dxShadow))
			this.dxShadow = dxShadow;

		var div = document.createElement("DIV");
		div.id = this.menu_id;
		div.className = "bx-popup-menu";
		div.style.position = 'absolute';
		div.style.zIndex = this.zIndex;
		div.style.left = '-1000px';
		div.style.top = '-1000px';
		div.style.visibility = 'hidden';
		div.onclick = _this.PreventDefault;
		document.body.appendChild(div);

		div.innerHTML =
			'<table cellpadding="0" cellspacing="0" border="0">'+
			'<tr><td class="popupmenu">'+
			'<table cellpadding="0" cellspacing="0" border="0" id="'+this.menu_id+'_items">'+
			'<tr><td></td></tr>'+
			'</table>'+
			'</td></tr>'+
			'</table>';
	}

	this.ClearItemsStyle = function()
	{
		var tbl = document.getElementById(this.menu_id+'_items');
		for(var i=0; i<tbl.rows.length; i++)
		{
			var div = jsUtils.FindChildObject(tbl.rows[i].cells[0], "div");
			if(div && div.className.indexOf('popupitemover') != -1)
			{
				div.className = div.className.replace(/\s*popupitemover/i, '');
				break;
			}
		}
	}

	this.PopupShow = function(pos)
	{
		var div = document.getElementById(this.menu_id);
		if(!div)
		{
			this.BuildItems();
			div = document.getElementById(this.menu_id);
		}

		this.ClearItemsStyle();

		setTimeout(function(){jsUtils.addEvent(document, "click", _this.CheckClick)}, 10);
		jsUtils.addEvent(document, "keypress", _this.OnKeyPress);

		var w = div.offsetWidth;
		var h = div.offsetHeight;
		pos = jsUtils.AlignToPos(pos, w, h);

		div.style.width = w + 'px';
		div.style.visibility = 'visible';

		jsFloatDiv.Show(div, pos["left"], pos["top"], this.dxShadow, false);

		div.ondrag = jsUtils.False;
		div.onselectstart = jsUtils.False;
		div.style.MozUserSelect = 'none';
	}

	this.PopupHide = function()
	{
		for(var i = 0, length = this.submenus.length; i < length; i++)
			if(this.submenus[i] && this.submenus[i].IsVisible())
				this.submenus[i].PopupHide();

		if(this.parentMenu)
			this.parentMenu.submenuIndex = null;

		var div = document.getElementById(this.menu_id);
		if(div)
		{
			jsFloatDiv.Close(div);
			div.style.visibility = 'hidden';
		}

		if(this.OnClose)
			this.OnClose();

		this.controlDiv = null;
		jsUtils.removeEvent(document, "click", _this.CheckClick);
		jsUtils.removeEvent(document, "keypress", _this.OnKeyPress);
	}

	this.CheckClick = function(e)
	{
		for(var i = 0, length = _this.submenus.length; i < length; i++)
			if(_this.submenus[i] && !_this.submenus[i].CheckClick(e))
				return false;

		var div = document.getElementById(_this.menu_id);
		if(!div)
			return true;

		if (div.style.visibility != 'visible')
			return true;

		var arScroll = jsUtils.GetWindowScrollPos();
		var x = e.clientX + arScroll.scrollLeft;
		var y = e.clientY + arScroll.scrollTop;

		/*menu region*/
		var posLeft = parseInt(div.style.left);
		var posTop = parseInt(div.style.top);
		var posRight = posLeft + parseInt(div.offsetWidth);
		var posBottom = posTop + parseInt(div.offsetHeight);
		if(x >= posLeft && x <= posRight && y >= posTop && y <= posBottom)
			return false;

		if(_this.controlDiv)
		{
			var pos = jsUtils.GetRealPos(_this.controlDiv);
			if(x >= pos['left'] && x <= pos['right'] && y >= pos['top'] && y <= pos['bottom'])
				return false;
		}
		_this.PopupHide();
		return true;
	}

	this.OnKeyPress = function(e)
	{
		if(!e) e = window.event
		if(!e) return;
		if(e.keyCode == 27)
			_this.PopupHide();
	}

	this.PreventDefault = function(e)
	{
		if(!e) e = window.event;
		if(e.stopPropagation)
		{
			e.preventDefault();
			e.stopPropagation();
		}
		else
		{
			e.cancelBubble = true;
			e.returnValue = false;
		}
		return false;
	}

	this.GetItemIndex = function(item)
	{
		var item_id = _this.menu_id+'_item_';
		var item_index = parseInt(item.id.substr(item_id.length));
		return item_index;
	}

	this.ShowSubmenu = function(item, bMouseOver, bDontShow)
	{
		if(!item)
			item = this;
		var item_index = _this.GetItemIndex(item);

		if(bMouseOver == true)
		{
			if(!_this.menuItems[item_index]["__time"])
				return;
			var dxTime = (new Date()).valueOf() - _this.menuItems[item_index]["__time"];
			if(dxTime < 500)
				return;
		}

		var menu;
		if(!_this.submenus[item_index])
		{
			menu = new PopupMenu(_this.menu_id+'_sub_'+item_index);
			menu.Create(_this.zIndex+10, _this.dxShadow);
			menu.SetItems(_this.menuItems[item_index].MENU);
			menu.BuildItems();
			menu.parentItem = document.getElementById(_this.menu_id+'_item_'+item_index);
			menu.parentMenu = _this;
			menu.OnClose = function()
			{
				jsUtils.addEvent(document, "keypress", _this.OnKeyPress);
			}
			_this.submenus[item_index] = menu;

			if(_this.menuItems[item_index].ONMENUPOPUP)
				eval(_this.menuItems[item_index].ONMENUPOPUP);
		}
		else
			menu = _this.submenus[item_index];

		_this.submenuIndex = item_index;

		if(menu.IsVisible() || bDontShow == true)
			return;

		var item_pos = jsUtils.GetRealPos(item);
		var menu_pos = jsUtils.GetRealPos(document.getElementById(_this.menu_id));
		var pos = {'left': menu_pos["right"]-1, 'right': menu_pos["left"]+1, 'top': item_pos["bottom"]+1, 'bottom': item_pos["top"]};

		jsUtils.removeEvent(document, "keypress", _this.OnKeyPress);
		menu.controlDiv = item;
		menu.PopupShow(pos);
	}

	this.OnSubmenuMouseOver = function()
	{
		_this.OnItemMouseOver(this);

		var item_index = _this.GetItemIndex(this);
		if(!_this.menuItems[item_index]["__time"])
			_this.menuItems[item_index]["__time"] = (new Date()).valueOf();

		var div = this;
		setTimeout(function(){_this.ShowSubmenu(div, true)}, 550);
	}

	this.OnItemMouseOver = function(item)
	{
		if(_this.bHasSubmenus)
			_this.ClearItemsStyle();

		var div = (item? item:this);
		div.className="popupitem popupitemover";

		if(_this.parentItem)
		{
			_this.bDoHide = false;
			if(_this.parentItem.className != "popupitem popupitemover")
			{
				_this.parentMenu.ClearItemsStyle();
				_this.parentItem.className = "popupitem popupitemover";
			}
		}

		if(_this.submenuIndex != null)
		{
			var item_index = _this.GetItemIndex(div);
			if(_this.submenuIndex != item_index && _this.submenus[_this.submenuIndex])
			{
				_this.submenus[_this.submenuIndex].bDoHide = true;
				setTimeout(function(){_this.HideSubmenu()}, 500);
			}
		}
	}

	this.OnSubmenuMouseOut = function()
	{
		var item_index = _this.GetItemIndex(this);
		_this.menuItems[item_index]["__time"] = null;
	}

	this.OnItemMouseOut = function()
	{
		this.className="popupitem";
	}

	this.HideSubmenu = function()
	{
		if(_this.submenuIndex == null)
			return;
		if(_this.submenus[_this.submenuIndex].bDoHide != true)
			return;
		_this.submenus[_this.submenuIndex].PopupHide();
	}

	this.SetItems = function(items)
	{
		this.menuItems = items;
		this.submenus = [];
	}

	this.SetItemIcon = function(item_id, icon)
	{
		if(typeof(item_id) == 'string' || item_id instanceof String)
		{
			for(var i in this.menuItems)
			{
				if(this.menuItems[i].ID && this.menuItems[i].ID == item_id)
				{
					this.menuItems[i].ICONCLASS = icon;
					var item_td = document.getElementById(item_id);
					if(item_td)
					{
						var div = jsUtils.FindChildObject(item_td, "div");
						if(div)
							div.className = "icon "+icon;
					}
					break;
				}
			}
		}
		else
		{
			var div = jsUtils.FindChildObject(jsUtils.FindChildObject(item_id, "td", "gutter", true), "div");
			if(div)
			{
				this.menuItems[this.GetItemIndex(item_id)].ICONCLASS = icon;
				div.className = "icon "+icon;
			}
		}
	}

	this.SetAllItemsIcon = function(icon)
	{
		for(var i=0, n=this.menuItems.length; i < n; i++)
		{
			var item = document.getElementById(this.menu_id+'_item_'+i);
			var div = jsUtils.FindChildObject(jsUtils.FindChildObject(item, "td", "gutter", true), "div");
			if(div)
			{
				this.menuItems[i].ICONCLASS = icon;
				div.className = "icon "+icon;
			}
		}
	}

	this.BuildItems = function()
	{
		var items = this.menuItems;
		if(!items || items.length == 0)
			return;

		var div = document.getElementById(this.menu_id);
		if(!div)
		{
			this.Create();
			div = document.getElementById(this.menu_id);
		}
		div.style.left='-1000px';
		div.style.top='-1000px';
		div.style.width='auto';

		this.bHasSubmenus = false;
		var tbl = document.getElementById(this.menu_id+'_items');
		while(tbl.rows.length>0)
			tbl.deleteRow(0);

		var n = items.length;
		for(var i=0; i<n; i++)
		{
			var row = tbl.insertRow(-1);
			var cell = row.insertCell(-1);
			if(items[i]['CLASS'])
				row.className = items[i]['CLASS'];
			if(items[i]['SEPARATOR'])
			{
				cell.innerHTML = '<div class="popupseparator"><div class="empty"></div></div>';
			}
			else
			{
				var s =
					'<div id="'+this.menu_id+'_item_'+i+'" class="popupitem"'+(items[i]['DISABLED']!=true && items[i]['ONCLICK']? ' '+(items[i]['MENU']? 'ondblclick':'onclick')+'="'+jsUtils.htmlspecialchars(items[i]['ONCLICK'])+'"':'')+'>'+
					'	<div style="width:100%;"><table style="width:100% !important" cellpadding="0" cellspacing="0" border="0" dir="ltr">'+
					'		<tr>'+
					'			<td class="gutter"'+(items[i]['ID']? ' id="'+items[i]['ID']+'"' : '')+'><div class="icon'+(items[i]['ICONCLASS']? ' '+items[i]['ICONCLASS']:'')+'"'+(items[i]['IMAGE']? ' style="background-image:url('+items[i]['IMAGE']+');"':'')+'></div></td>'+
					'			<td class="item'+(items[i]['DISABLED'] == true? ' disabled' : '')+(items[i]['DEFAULT'] == true? ' default' : '')+'"'+(items[i]["TITLE"]? ' title="'+items[i]["TITLE"]+'"' : '')+'>'+items[i]['TEXT']+'</td>';
				if(items[i]['MENU'])
					s += '<td class="arrow"></td>';

				s +=
					'		</tr>'+
					'	</table></div></div>';
				cell.innerHTML = s;
				if(items[i]['DISABLED']!=true)
				{
					var item_div = jsUtils.FindChildObject(cell, "div");
					if(items[i]['MENU'])
					{
						item_div.onclick = function(){_this.ShowSubmenu(this)};
						item_div.onmouseover = _this.OnSubmenuMouseOver;
						item_div.onmouseout = _this.OnSubmenuMouseOut;
						this.bHasSubmenus = true;
					}
					else
					{
						item_div.onmouseover = function(){_this.OnItemMouseOver(this)};
						item_div.onmouseout = _this.OnItemMouseOut;
						if(items[i]['ONCLICK'] && (items[i]['AUTOHIDE'] == null || items[i]['AUTOHIDE'] == true))
							jsUtils.addEvent(item_div, "click",	function(){_this.PopupHide();});
					}
				}
				items[i]['__id'] = this.menu_id+'_item_'+i;
			}
		}

		div.style.width = tbl.parentNode.offsetWidth;
	}


	this.GetItemInfo = function(item)
	{
		var td = jsUtils.FindChildObject(item, "td", "item", true);
		if(td)
		{
			var icon = '';
			var icon_div = jsUtils.FindChildObject(jsUtils.FindChildObject(item, "td", "gutter", true), "div");
			//<div class="icon class">
			if(icon_div.className.length > 5)
				icon = icon_div.className.substr(5);
			return {'TEXT': td.innerHTML, 'TITLE':td.title, 'ICON':icon};
		}
		return null;
	}

	this.GetMenuByItemId = function(item_id)
	{
		for(var i = 0, length = this.menuItems.length; i < length; i++)
			if(this.menuItems[i]['__id'] && this.menuItems[i]['__id'] == item_id)
				return this;

		var menu;

		for(var i = 0, length = this.submenus.length; i < length; i++)
			if(this.submenus[i] && (menu = this.submenus[i].GetMenuByItemId(item_id)) != false)
				return menu;

		return false;
	}

	this.IsVisible = function()
	{
		var div = document.getElementById(this.menu_id);
		if(div)
			return (div.style.visibility != 'hidden');
		return false;
	}

	this.ShowMenu = function(control, items, bFixed, dPos, userFunc)
	{
		if(this.controlDiv == control)
		{
			this.PopupHide();
		}
		else
		{
			if(this.IsVisible())
				this.PopupHide();

			if(items)
			{
				this.SetItems(items);
				this.BuildItems();
			}

			control.className += ' pressed bx-pressed';
			var pos = window.BX ? BX.pos(control) : jsUtils.GetRealPos(control);
			if(dPos)
			{
				pos["left"] += dPos["left"];
				pos["right"] += dPos["right"];
				pos["top"] += dPos["top"];
				pos["bottom"] += dPos["bottom"];
			}
			else
				pos["bottom"]+= 2;

			if(bFixed == true && !jsUtils.IsIE())
			{
				var arScroll = jsUtils.GetWindowScrollPos();
				pos["top"] += arScroll.scrollTop;
				pos["bottom"] += arScroll.scrollTop;
				pos["left"] += arScroll.scrollLeft;
				pos["right"] += arScroll.scrollLeft;
			}

			this.controlDiv = control;
			this.OnClose = function()
			{
				control.className = control.className.replace(/\s*pressed bx-pressed/ig, "");
				if(userFunc)
					userFunc();
			}
			this.PopupShow(pos);
		}
	}
}

/* End */
;
; /* Start:/bitrix/js/main/core/core_popup.js*/
;(function(window) {

if (BX.PopupWindowManager)
	return;

BX.PopupWindowManager =
{
	_popups : [],
	_currentPopup : null,

	create : function(uniquePopupId, bindElement, params)
	{
		var index = -1;
		if ( (index = this._getPopupIndex(uniquePopupId)) !== -1)
			return this._popups[index];

		var popupWindow = new BX.PopupWindow(uniquePopupId, bindElement, params);

		BX.addCustomEvent(popupWindow, "onPopupShow", BX.delegate(this.onPopupShow, this));
		BX.addCustomEvent(popupWindow, "onPopupClose", BX.delegate(this.onPopupClose, this));
		BX.addCustomEvent(popupWindow, "onPopupDestroy", BX.delegate(this.onPopupDestroy, this));

		this._popups.push(popupWindow);

		return popupWindow;
	},

	onPopupShow : function(popupWindow)
	{
		if (this._currentPopup !== null)
			this._currentPopup.close();

		this._currentPopup = popupWindow;
	},

	onPopupClose : function(popupWindow)
	{
		this._currentPopup = null;
	},

	onPopupDestroy : function(popupWindow)
	{
		var index = -1;
		if ( (index = this._getPopupIndex(popupWindow.uniquePopupId)) !== -1)
			this._popups = BX.util.deleteFromArray(this._popups, index);
	},

	getCurrentPopup : function()
	{
		return this._currentPopup;
	},

	isPopupExists : function(uniquePopupId)
	{
		return this._getPopupIndex(uniquePopupId) !== -1
	},

	_getPopupIndex : function(uniquePopupId)
	{
		var index = -1;

		for (var i = 0; i < this._popups.length; i++)
			if (this._popups[i].uniquePopupId == uniquePopupId)
				return i;

		return index;
	}
};

BX.PopupWindow = function(uniquePopupId, bindElement, params)
{
	BX.onCustomEvent("onPopupWindowInit", [uniquePopupId, bindElement, params ]);

	this.uniquePopupId = uniquePopupId;
	this.params = params || {};
	this.params.zIndex = parseInt(this.params.zIndex);
	this.params.zIndex = isNaN(this.params.zIndex) ? 0 : this.params.zIndex;
	this.buttons = this.params.buttons && BX.type.isArray(this.params.buttons) ? this.params.buttons : [];
	this.offsetTop = BX.PopupWindow.getOption("offsetTop");
	this.offsetLeft = BX.PopupWindow.getOption("offsetLeft");
	this.firstShow = false;
	this.bordersWidth = 20;
	this.bindElementPos = null;
	this.closeIcon = null;
	this.angle = null;
	this.overlay = null;
	this.titleBar = null;
	this.bindOptions = typeof(this.params.bindOptions) == "object" ? this.params.bindOptions : {};
	this.isAutoHideBinded = false;
	this.closeByEsc = !!this.params.closeByEsc;
	this.isCloseByEscBinded = false;

	this.dragged = false;
	this.dragPageX = 0;
	this.dragPageY = 0;

	if (this.params.events)
	{
		for (var eventName in this.params.events)
			BX.addCustomEvent(this, eventName, this.params.events[eventName]);
	}

	this.popupContainer = document.createElement("DIV");

	BX.adjust(this.popupContainer, {
		props : {
			id : uniquePopupId
		},
		style : {
			zIndex: this.getZindex(),
			position: "absolute",
			display: "none",
			top: "0px",
			left: "0px"
		}
	});

	var tableClassName = "popup-window";
	if (params.lightShadow)
		tableClassName += " popup-window-light";
	if (params.titleBar)
		tableClassName += params.lightShadow ? " popup-window-titlebar-light" : " popup-window-titlebar";
	if (params.className && BX.type.isNotEmptyString(params.className))
		tableClassName += " " + params.className;

	this.popupContainer.innerHTML = ['<table class="', tableClassName,'" cellspacing="0"> \
		<tr class="popup-window-top-row"> \
			<td class="popup-window-left-column"><div class="popup-window-left-spacer"></div></td> \
			<td class="popup-window-center-column">', (params.titleBar ? '<div class="popup-window-titlebar" id="popup-window-titlebar-' + uniquePopupId + '"></div>' : ""),'</td> \
			<td class="popup-window-right-column"><div class="popup-window-right-spacer"></div></td> \
		</tr> \
		<tr class="popup-window-content-row"> \
			<td class="popup-window-left-column"></td> \
			<td class="popup-window-center-column"><div class="popup-window-content" id="popup-window-content-', uniquePopupId ,'"> \
			</div></td> \
			<td class="popup-window-right-column"></td> \
		</tr> \
		<tr class="popup-window-bottom-row"> \
			<td class="popup-window-left-column"></td> \
			<td class="popup-window-center-column"></td> \
			<td class="popup-window-right-column"></td> \
		</tr> \
	</table>'].join("");
	document.body.appendChild(this.popupContainer);

	if (params.closeIcon)
	{
		this.popupContainer.appendChild(
			(this.closeIcon = BX.create("a", {
				props : { className: "popup-window-close-icon" + (params.titleBar ? " popup-window-titlebar-close-icon" : ""), href : ""},
				style : (typeof(params.closeIcon) == "object" ? params.closeIcon : {} ),
				events : { click : BX.proxy(this._onCloseIconClick, this) } } )
			)
		);

		if (BX.browser.IsIE())
			BX.adjust(this.closeIcon, { attrs: { hidefocus: "true" } });
	}

	this.contentContainer = BX("popup-window-content-" +  uniquePopupId);
	this.titleBar = BX("popup-window-titlebar-" +  uniquePopupId);
	this.buttonsContainer = this.buttonsHr = null;

	if (params.angle)
		this.setAngle(params.angle);

	if (params.overlay)
		this.setOverlay(params.overlay);

	this.setOffset(this.params);
	this.setBindElement(bindElement);
	this.setTitleBar(this.params.titleBar);
	this.setContent(this.params.content);
	this.setButtons(this.params.buttons);

	if (this.params.bindOnResize !== false)
	{
		BX.bind(window, "resize", BX.proxy(this._onResizeWindow, this));
	}
};

BX.PopupWindow.prototype.setContent = function(content)
{
	if (!this.contentContainer || !content)
		return;

	if (BX.type.isElementNode(content))
	{
		BX.cleanNode(this.contentContainer);
		this.contentContainer.appendChild(content.parentNode ? content.parentNode.removeChild(content) : content );
		content.style.display = "block";
	}
	else if (BX.type.isString(content))
	{
		this.contentContainer.innerHTML = content;
	}
	else
		this.contentContainer.innerHTML = "&nbsp;";

};

BX.PopupWindow.prototype.setButtons = function(buttons)
{
	this.buttons = buttons && BX.type.isArray(buttons) ? buttons : [];

	if (this.buttonsHr)
		BX.remove(this.buttonsHr);
	if (this.buttonsContainer)
		BX.remove(this.buttonsContainer);

	if (this.buttons.length > 0 && this.contentContainer)
	{
		var newButtons = [];
		for (var i = 0; i < this.buttons.length; i++)
		{
			var button = this.buttons[i];
			if (button == null || !BX.is_subclass_of(button, BX.PopupWindowButton))
				continue;

			button.popupWindow = this;
			newButtons.push(button.render());
		}

		this.buttonsHr = this.contentContainer.parentNode.appendChild(
			BX.create("div",{
				props : { className : "popup-window-hr popup-window-buttons-hr" },
				children : [ BX.create("i", {}) ]
			})
		);

		this.buttonsContainer = this.contentContainer.parentNode.appendChild(
			BX.create("div",{
				props : { className : "popup-window-buttons" },
				children : newButtons
			})
		);
	}
};

BX.PopupWindow.prototype.setBindElement = function(bindElement)
{
	if (!bindElement || typeof(bindElement) != "object")
		return;

	if (BX.type.isDomNode(bindElement) || (BX.type.isNumber(bindElement.top) && BX.type.isNumber(bindElement.left)))
		this.bindElement = bindElement;
	else if (BX.type.isNumber(bindElement.clientX) && BX.type.isNumber(bindElement.clientY))
	{
		BX.fixEventPageXY(bindElement);
		this.bindElement = { left : bindElement.pageX, top : bindElement.pageY, bottom : bindElement.pageY };
	}
};

BX.PopupWindow.prototype.getBindElementPos = function(bindElement)
{
	if (BX.type.isDomNode(bindElement))
	{
		return BX.pos(bindElement, false);
	}
	else if (bindElement && typeof(bindElement) == "object")
	{
		if (!BX.type.isNumber(bindElement.bottom))
			bindElement.bottom = bindElement.top;
		return bindElement;
	}
	else
	{
		var windowSize =  BX.GetWindowInnerSize();
		var windowScroll = BX.GetWindowScrollPos();
		var popupWidth = this.popupContainer.offsetWidth;
		var popupHeight = this.popupContainer.offsetHeight;

		return {
			left : windowSize.innerWidth/2 - popupWidth/2 + windowScroll.scrollLeft,
			top : windowSize.innerHeight/2 - popupHeight/2 + windowScroll.scrollTop,
			bottom : windowSize.innerHeight/2 - popupHeight/2 + windowScroll.scrollTop,

			//for optimisation purposes
			windowSize : windowSize,
			windowScroll : windowScroll,
			popupWidth : popupWidth,
			popupHeight : popupHeight
		};
	}
};

BX.PopupWindow.prototype.setAngle = function(params)
{
	var className = this.params.lightShadow ? "popup-window-light-angly" : "popup-window-angly";
	if (this.angle == null)
	{
		var position = this.bindOptions.position && this.bindOptions.position == "top" ? "bottom" : "top";
		var angleMinLeft = BX.PopupWindow.getOption(position == "top" ? "angleMinTop" : "angleMinBottom");
		var defaultOffset = BX.type.isNumber(params.offset) ? params.offset : 0;

		var angleLeftOffset = BX.PopupWindow.getOption("angleLeftOffset", null);
		if (defaultOffset > 0 && BX.type.isNumber(angleLeftOffset))
			defaultOffset += angleLeftOffset - BX.PopupWindow.defaultOptions.angleLeftOffset;

		this.angle = {
			element : BX.create("div", { props : { className: className + " " + className +"-" + position }}),
			position : position,
			offset : 0,
			defaultOffset : Math.max(defaultOffset, angleMinLeft)
			//Math.max(BX.type.isNumber(params.offset) ? params.offset : 0, angleMinLeft)
		};
		this.popupContainer.appendChild(this.angle.element);
	}

	if (typeof(params) == "object" && params.position && BX.util.in_array(params.position, ["top", "right", "bottom", "left", "hide"]))
	{
		BX.removeClass(this.angle.element, className + "-" +  this.angle.position);
		BX.addClass(this.angle.element, className + "-" +  params.position);
		this.angle.position = params.position;
	}

	if (typeof(params) == "object" && BX.type.isNumber(params.offset))
	{
		var offset = params.offset;
		var minOffset, maxOffset;
		if (this.angle.position == "top")
		{
			minOffset = BX.PopupWindow.getOption("angleMinTop");
			maxOffset = this.popupContainer.offsetWidth - BX.PopupWindow.getOption("angleMaxTop");
			maxOffset = maxOffset < minOffset ? Math.max(minOffset, offset) : maxOffset;

			this.angle.offset = Math.min(Math.max(minOffset, offset), maxOffset);
			this.angle.element.style.left = this.angle.offset + "px";
			this.angle.element.style.marginLeft = "auto";
		}
		else if (this.angle.position == "bottom")
		{
			minOffset = BX.PopupWindow.getOption("angleMinBottom");
			maxOffset = this.popupContainer.offsetWidth - BX.PopupWindow.getOption("angleMaxBottom");
			maxOffset = maxOffset < minOffset ? Math.max(minOffset, offset) : maxOffset;

			this.angle.offset = Math.min(Math.max(minOffset, offset), maxOffset);
			this.angle.element.style.marginLeft = this.angle.offset + "px";
			this.angle.element.style.left = "auto";
		}
		else if (this.angle.position == "right")
		{
			minOffset = BX.PopupWindow.getOption("angleMinRight");
			maxOffset = this.popupContainer.offsetHeight - BX.PopupWindow.getOption("angleMaxRight");
			maxOffset = maxOffset < minOffset ? Math.max(minOffset, offset) : maxOffset;

			this.angle.offset = Math.min(Math.max(minOffset, offset), maxOffset);
			this.angle.element.style.top = this.angle.offset + "px";
		}
		else if (this.angle.position == "left")
		{
			minOffset = BX.PopupWindow.getOption("angleMinLeft");
			maxOffset = this.popupContainer.offsetHeight - BX.PopupWindow.getOption("angleMaxLeft");
			maxOffset = maxOffset < minOffset ? Math.max(minOffset, offset) : maxOffset;

			this.angle.offset = Math.min(Math.max(minOffset, offset), maxOffset);
			this.angle.element.style.top = this.angle.offset + "px";
		}
	}
};

BX.PopupWindow.prototype.isTopAngle = function()
{
	return this.angle != null && this.angle.position == "top";
};

BX.PopupWindow.prototype.isBottomAngle = function()
{
	return this.angle != null && this.angle.position == "bottom";
};

BX.PopupWindow.prototype.isTopOrBottomAngle = function()
{
	return this.angle != null && BX.util.in_array(this.angle.position, ["top", "bottom"]);
};

BX.PopupWindow.prototype.getAngleHeight = function()
{
	return (this.isTopOrBottomAngle() ? BX.PopupWindow.getOption("angleTopOffset") : 0);
};

BX.PopupWindow.prototype.setOffset = function(params)
{
	if (typeof(params) != "object")
		return;

	if (params.offsetLeft && BX.type.isNumber(params.offsetLeft))
		this.offsetLeft = params.offsetLeft + BX.PopupWindow.getOption("offsetLeft");

	if (params.offsetTop && BX.type.isNumber(params.offsetTop))
		this.offsetTop = params.offsetTop + BX.PopupWindow.getOption("offsetTop");
};

BX.PopupWindow.prototype.setTitleBar = function(params)
{
	if (!this.titleBar || typeof(params) != "object" || !BX.type.isDomNode(params.content))
		return;

	this.titleBar.innerHTML = "";
	this.titleBar.appendChild(params.content);

	if (this.params.draggable)
	{
		this.titleBar.parentNode.style.cursor = "move";
		BX.bind(this.titleBar.parentNode, "mousedown", BX.proxy(this._startDrag, this));
	}
};

BX.PopupWindow.prototype.setClosingByEsc = function(enable)
{
	enable = !!enable;
	if (enable)
	{
		this.closeByEsc = true;
		if (!this.isCloseByEscBinded)
		{
			BX.bind(document, "keyup", BX.proxy(this._onKeyUp, this));
			this.isCloseByEscBinded = true;
		}
	}
	else
	{
		this.closeByEsc = false;
		if (this.isCloseByEscBinded)
		{
			BX.unbind(document, "keyup", BX.proxy(this._onKeyUp, this));
			this.isCloseByEscBinded = false;
		}
	}
};

BX.PopupWindow.prototype.setOverlay = function(params)
{
	if (this.overlay == null)
	{
		this.overlay = {
			element : BX.create("div", { props : { className: "popup-window-overlay", id : "popup-window-overlay-" + this.uniquePopupId } })
		};

		this.adjustOverlayZindex();
		this.resizeOverlay();
		document.body.appendChild(this.overlay.element);
	}

	if (params && params.opacity && BX.type.isNumber(params.opacity) && params.opacity >= 0 && params.opacity <= 100)
	{
		if (BX.browser.IsIE() && !BX.browser.IsIE9())
			this.overlay.element.style.filter =  "alpha(opacity=" + params.opacity +")";
		else
		{
			this.overlay.element.style.filter = "none";
			this.overlay.element.style.opacity = parseFloat(params.opacity/100).toPrecision(3);
		}
	}

	if (params && params.backgroundColor)
		this.overlay.element.style.backgroundColor = params.backgroundColor;
};

BX.PopupWindow.prototype.removeOverlay = function()
{
	if (this.overlay != null && this.overlay.element != null)
		BX.remove(this.overlay.element);

	this.overlay = null;
};

BX.PopupWindow.prototype.hideOverlay = function()
{
	if (this.overlay != null && this.overlay.element != null)
		this.overlay.element.style.display = "none";
};

BX.PopupWindow.prototype.showOverlay = function()
{
	if (this.overlay != null && this.overlay.element != null)
		this.overlay.element.style.display = "block";
};

BX.PopupWindow.prototype.resizeOverlay = function()
{
	if (this.overlay != null && this.overlay.element != null)
	{
		var windowSize = BX.GetWindowScrollSize();
		this.overlay.element.style.width = windowSize.scrollWidth + "px";
		this.overlay.element.style.height = windowSize.scrollHeight + "px";
	}
};

BX.PopupWindow.prototype.getZindex = function()
{
	if (this.overlay != null)
		return BX.PopupWindow.getOption("popupOverlayZindex") + this.params.zIndex;
	else
		return BX.PopupWindow.getOption("popupZindex") + this.params.zIndex;
};


BX.PopupWindow.prototype.adjustOverlayZindex = function()
{
	if (this.overlay != null && this.overlay.element != null)
	{
		this.overlay.element.style.zIndex = parseInt(this.popupContainer.style.zIndex) - 1;
	}
};


BX.PopupWindow.prototype.show = function()
{
	if (!this.firstShow)
	{
		BX.onCustomEvent(this, "onPopupFirstShow", [this]);
		this.firstShow = true;
	}
	BX.onCustomEvent(this, "onPopupShow", [this]);

	this.showOverlay();
	this.popupContainer.style.display = "block";

	this.adjustPosition();

	BX.onCustomEvent(this, "onAfterPopupShow", [this]);

	if (this.closeByEsc && !this.isCloseByEscBinded)
	{
		BX.bind(document, "keyup", BX.proxy(this._onKeyUp, this));
		this.isCloseByEscBinded = true;
	}

	if (this.params.autoHide && !this.isAutoHideBinded)
	{
		setTimeout(
			BX.proxy(function() {
				this.isAutoHideBinded = true;
				BX.bind(this.popupContainer, "click", this.cancelBubble);
				BX.bind(document, "click", BX.proxy(this.close, this));
			}, this), 0
		);
	}
};

BX.PopupWindow.prototype.isShown = function()
{
   return this.popupContainer.style.display == "block";
};

BX.PopupWindow.prototype.cancelBubble = function(event)
{
	if(!event)
		event = window.event;

	if (event.stopPropagation)
		event.stopPropagation();
	else
		event.cancelBubble = true;
};

BX.PopupWindow.prototype.close = function(event)
{
	if (!this.isShown())
		return;

	if (event && !(BX.getEventButton(event)&BX.MSLEFT))
		return true;

	BX.onCustomEvent(this, "onPopupClose", [this, event]);

	this.hideOverlay();
	this.popupContainer.style.display = "none";

	if (this.isCloseByEscBinded)
	{
		BX.unbind(document, "keyup", BX.proxy(this._onKeyUp, this));
		this.isCloseByEscBinded = false;
	}

	setTimeout(BX.proxy(this._close, this), 0);
};

BX.PopupWindow.prototype._close = function()
{
	if (this.params.autoHide && this.isAutoHideBinded)
	{
		this.isAutoHideBinded = false;
		BX.unbind(this.popupContainer, "click", this.cancelBubble);
		BX.unbind(document, "click", BX.proxy(this.close, this));
	}
};

BX.PopupWindow.prototype._onCloseIconClick = function(event)
{
	event = event || window.event;
	this.close(event);
	BX.PreventDefault(event);
};

BX.PopupWindow.prototype._onKeyUp = function(event)
{
	event = event || window.event;
	if (event.keyCode == 27)
		this.close(event);
};

BX.PopupWindow.prototype.destroy = function()
{
	BX.onCustomEvent(this, "onPopupDestroy", [this]);
	BX.unbindAll(this);
	BX.unbind(document, "keyup", BX.proxy(this._onKeyUp, this));
	BX.unbind(document, "click", BX.proxy(this.close, this));
	BX.unbind(document, "mousemove", BX.proxy(this._moveDrag, this));
	BX.unbind(document, "mouseup", BX.proxy(this._stopDrag, this));
	BX.unbind(window, "resize", BX.proxy(this._onResizeWindow, this));
	BX.remove(this.popupContainer);
	this.removeOverlay();
};

BX.PopupWindow.prototype.adjustPosition = function(bindOptions)
{
	if (bindOptions && typeof(bindOptions) == "object")
		this.bindOptions = bindOptions;

	var bindElementPos = this.getBindElementPos(this.bindElement);

	if (!this.bindOptions.forceBindPosition && this.bindElementPos != null &&
		 bindElementPos.top == this.bindElementPos.top &&
		 bindElementPos.left == this.bindElementPos.left
	)
		return;

	this.bindElementPos = bindElementPos;

	var windowSize = bindElementPos.windowSize ? bindElementPos.windowSize : BX.GetWindowInnerSize();
	var windowScroll = bindElementPos.windowScroll ? bindElementPos.windowScroll : BX.GetWindowScrollPos();
	var popupWidth = bindElementPos.popupWidth ? bindElementPos.popupWidth : this.popupContainer.offsetWidth;
	var popupHeight = bindElementPos.popupHeight ? bindElementPos.popupHeight : this.popupContainer.offsetHeight;

	var angleTopOffset = BX.PopupWindow.getOption("angleTopOffset");

	var left = this.bindElementPos.left + this.offsetLeft -
				(this.isTopOrBottomAngle() ? BX.PopupWindow.getOption("angleLeftOffset") : 0);

	if ( !this.bindOptions.forceLeft &&
		(left + popupWidth + this.bordersWidth) >= (windowSize.innerWidth + windowScroll.scrollLeft) &&
		(windowSize.innerWidth + windowScroll.scrollLeft - popupWidth - this.bordersWidth) > 0)
	{
			var bindLeft = left;
			left = windowSize.innerWidth + windowScroll.scrollLeft - popupWidth - this.bordersWidth;
			if (this.isTopOrBottomAngle())
			{
				this.setAngle({ offset : bindLeft - left + this.angle.defaultOffset});
			}
	}
	else if (this.isTopOrBottomAngle())
	{
		this.setAngle({ offset : this.angle.defaultOffset + (left < 0 ? left : 0) });
	}

	if (left < 0)
		left = 0;

	var top = 0;

	if (this.bindOptions.position && this.bindOptions.position == "top")
	{
		top = this.bindElementPos.top - popupHeight - this.offsetTop - (this.isBottomAngle() ? angleTopOffset : 0);
		if (top < 0 || (!this.bindOptions.forceTop && top < windowScroll.scrollTop))
		{
			top = this.bindElementPos.bottom + this.offsetTop;
			if (this.angle != null)
			{
				top += angleTopOffset;
				this.setAngle({ position: "top"});
			}
		}
		else if (this.isTopAngle())
		{
			top = top - angleTopOffset + BX.PopupWindow.getOption("positionTopXOffset");
			this.setAngle({ position: "bottom"});
		}
		else
		{
			top += BX.PopupWindow.getOption("positionTopXOffset");
		}
	}
	else
	{
		top = this.bindElementPos.bottom + this.offsetTop + this.getAngleHeight();

		if ( !this.bindOptions.forceTop &&
			(top + popupHeight) > (windowSize.innerHeight + windowScroll.scrollTop) &&
			(this.bindElementPos.top - popupHeight - this.getAngleHeight()) >= 0) //Can we place the PopupWindow above the bindElement?
		{
			//The PopupWindow doesn't place below the bindElement. We should place it above.
			top = this.bindElementPos.top - popupHeight;
			if (this.isTopOrBottomAngle())
			{
				top -= angleTopOffset;
				this.setAngle({ position: "bottom"});
			}

			top += BX.PopupWindow.getOption("positionTopXOffset");
		}
		else if (this.isBottomAngle())
		{
			top += angleTopOffset;
			this.setAngle({ position: "top"});
		}
	}

	if (top < 0)
		top = 0;

	BX.adjust(this.popupContainer, { style: {
		top: top + "px",
		left: left + "px",
		zIndex: this.getZindex()
	}});

	this.adjustOverlayZindex();
};

BX.PopupWindow.prototype._onResizeWindow = function(event)
{
	if (this.isShown())
	{
		this.adjustPosition();
		if (this.overlay != null)
			this.resizeOverlay();
	}
};

BX.PopupWindow.prototype.move = function(offsetX, offsetY)
{
	var left = parseInt(this.popupContainer.style.left) + offsetX;
	var top = parseInt(this.popupContainer.style.top) + offsetY;

	if (typeof(this.params.draggable) == "object" && this.params.draggable.restrict)
	{
		//Left side
		if (left < 0)
			left = 0;

		//Right side
		var scrollSize = BX.GetWindowScrollSize();
		var floatWidth = this.popupContainer.offsetWidth;
		var floatHeight = this.popupContainer.offsetHeight;

		if (left > (scrollSize.scrollWidth - floatWidth))
			left = scrollSize.scrollWidth - floatWidth;

		if (top > (scrollSize.scrollHeight - floatHeight))
			top = scrollSize.scrollHeight - floatHeight;

		//Top side
		if (top < 0)
			top = 0;
	}

	this.popupContainer.style.left = left + "px";
	this.popupContainer.style.top = top + "px";
};

BX.PopupWindow.prototype._startDrag = function(event)
{
	event = event || window.event;
	BX.fixEventPageXY(event);

	this.dragPageX = event.pageX;
	this.dragPageY = event.pageY;
	this.dragged = false;

	BX.bind(document, "mousemove", BX.proxy(this._moveDrag, this));
	BX.bind(document, "mouseup", BX.proxy(this._stopDrag, this));

	if (document.body.setCapture)
		document.body.setCapture();

	//document.onmousedown = BX.False;
	document.body.ondrag = BX.False;
	document.body.onselectstart = BX.False;
	document.body.style.cursor = "move";
	document.body.style.MozUserSelect = "none";
	this.popupContainer.style.MozUserSelect = "none";

	return BX.PreventDefault(event);
};

BX.PopupWindow.prototype._moveDrag = function(event)
{
	event = event || window.event;
	BX.fixEventPageXY(event);

	if(this.dragPageX == event.pageX && this.dragPageY == event.pageY)
		return;

	this.move((event.pageX - this.dragPageX), (event.pageY - this.dragPageY));
	this.dragPageX = event.pageX;
	this.dragPageY = event.pageY;

	if (!this.dragged)
	{
		BX.onCustomEvent(this, "onPopupDragStart");
		this.dragged = true;
	}

	BX.onCustomEvent(this, "onPopupDrag");
};

BX.PopupWindow.prototype._stopDrag = function(event)
{
	if(document.body.releaseCapture)
		document.body.releaseCapture();

	BX.unbind(document, "mousemove", BX.proxy(this._moveDrag, this));
	BX.unbind(document, "mouseup", BX.proxy(this._stopDrag, this));

	//document.onmousedown = null;
	document.body.ondrag = null;
	document.body.onselectstart = null;
	document.body.style.cursor = "";
	document.body.style.MozUserSelect = "";
	this.popupContainer.style.MozUserSelect = "";

	BX.onCustomEvent(this, "onPopupDragEnd");
	this.dragged = false;

	return BX.PreventDefault(event);
};

BX.PopupWindow.options = {};
BX.PopupWindow.defaultOptions = {

	angleLeftOffset : 15,

	positionTopXOffset : 0,
	angleTopOffset : 8,

	popupZindex : 1000,
	popupOverlayZindex : 1100,

	angleMinLeft : 10,
	angleMaxLeft : 10,

	angleMinRight : 10,
	angleMaxRight : 10,

	angleMinBottom : 7,
	angleMaxBottom : 25,

	angleMinTop : 7,
	angleMaxTop : 25,

	offsetLeft : 0,
	offsetTop: 0
};
BX.PopupWindow.setOptions = function(options)
{
	if (!options || typeof(options) != "object")
		return;

	for (var option in options)
		BX.PopupWindow.options[option] = options[option];
};

BX.PopupWindow.getOption = function(option, defaultValue)
{
	if (typeof(BX.PopupWindow.options[option]) != "undefined")
		return BX.PopupWindow.options[option];
	else if (typeof(defaultValue) != "undefined")
		return defaultValue;
	else
		return BX.PopupWindow.defaultOptions[option];
};


/*========================================Buttons===========================================*/

BX.PopupWindowButton = function(params)
{
	this.popupWindow = null;

	this.params = params || {};

	this.text = this.params.text || "";
	this.id = this.params.id || "";
	this.className = this.params.className || "";
	this.events = this.params.events || {};

	this.contextEvents = {};
	for (var eventName in this.events)
		this.contextEvents[eventName] = BX.proxy(this.events[eventName], this);

	this.nameNode = BX.create("span", { props : { className : "popup-window-button-text"}, text : this.text } );
	this.buttonNode = BX.create(
		"span",
		{
			props : { className : "popup-window-button" + (this.className.length > 0 ? " " + this.className : ""), id : this.id },
			children : [
				BX.create("span", { props : { className : "popup-window-button-left"} } ),
				this.nameNode,
				BX.create("span", { props : { className : "popup-window-button-right"} } )
			],
			events : this.contextEvents
		}
	);
};

BX.PopupWindowButton.prototype.render = function()
{
	return this.buttonNode;
};

BX.PopupWindowButton.prototype.setName = function(name)
{
	this.text = name || "";
	if (this.nameNode)
	{
		BX.cleanNode(this.nameNode);
		BX.adjust(this.nameNode, { text : this.text} );
	}
};

BX.PopupWindowButton.prototype.setClassName = function(className)
{
	if (this.buttonNode)
	{
		if (BX.type.isString(this.className) && (this.className != ''))
			BX.removeClass(this.buttonNode, this.className);

		BX.addClass(this.buttonNode, className)
	}

	this.className = className;
};

BX.PopupWindowButtonLink = function(params)
{
	BX.PopupWindowButtonLink.superclass.constructor.apply(this, arguments);

	this.nameNode = BX.create("span", { props : { className : "popup-window-button-link-text" }, text : this.text, events : this.contextEvents });
	this.buttonNode = BX.create(
		"span",
		{
			props : { className : "popup-window-button popup-window-button-link" + (this.className.length > 0 ? " " + this.className : ""), id : this.id },
			children : [this.nameNode]
		}
	);

};

BX.extend(BX.PopupWindowButtonLink, BX.PopupWindowButton);

BX.PopupMenu = {

	Data : {},
	currentItem : null,
	stack : [],

	onkeypresslistener: null,

	show : function(Id, bindElement, menuItems, params, level)
	{
		if (!level)
			level = 0;

		if (level < this.stack.length)
		{
			for (var i = this.stack.length-1; i >= level; i--)
			{
				this.currentItem = this.stack.pop();

				if (this.currentItem)
					this.currentItem.popupWindow.close();

				if (i > 0)
					this.currentItem = this.stack[i-1];
			}
		}

		if (!this.Data[Id])
		{
			this.Data[Id] = { id : Id, bindElement : bindElement, params : params };
			this.Data[Id].popupWindow = this.__createPopup(this.Data[Id], menuItems, params);
		}

		this.currentItem = this.Data[Id];
		this.stack[level] = this.currentItem;

		this.currentItem.popupWindow.show();

		if (!this.onkeypresslistener)
		{
			this.onkeypresslistener = BX.delegate(function(e) {
				e = e || window.event;
				if (e && e.keyCode == 27)
				{
					this.currentItem = this.stack.pop();

					if (this.currentItem)
						this.currentItem.popupWindow.close();

					if (this.stack.length > 0)
						this.currentItem = this.stack[this.stack.length - 1];
				}
			}, this);

			BX.bind(document, 'keypress', this.onkeypresslistener);
		}
	},

	__createPopup : function(node, menuItems, params)
	{
		var items = [];
		for (var i = 0; i < menuItems.length; i++)
		{
			var item = menuItems[i];

			if (!item)
				continue;

			if (i > 0)
				items.push(BX.create("div", { props : { className : "popup-window-hr" }, html:'<i></i>'}));

			if (!!item.delimiter)
			{
				var a = BX.create('span', {props:{className:'popup-window-delimiter'},html:'<i></i>'});
			}
			else if (!!item.text && BX.type.isNotEmptyString(item.text))
			{

				var a = BX.create(!!item.href ? "a" : "span", {
					props : { className: "menu-popup-item" +  (BX.type.isNotEmptyString(item.className) ? " " + item.className : "")},
					attrs : { title : item.title ? item.title : "", onclick: item.onclick && BX.type.isString(item.onclick) ? item.onclick : null},
					events : item.onclick && BX.type.isFunction(item.onclick) ? { click : BX.proxy(item.onclick, node) } : null,
					html :  '<span class="menu-popup-item-left"></span><span class="menu-popup-item-icon"></span><span class="menu-popup-item-text">' + item.text + '</span><span class="menu-popup-item-right"></span>'
				});

				if (item.href)
					a.href = item.href;
			}

			items.push(a);
		}

		var popupWindow = new BX.PopupWindow("menu-popup-" + node.id, node.bindElement, {
			closeByEsc : false,
			autoHide : typeof(params.autoHide) != "undefined" ? params.autoHide : true,
			offsetTop : params.offsetTop ? params.offsetTop : 1,
			offsetLeft : params.offsetLeft ? params.offsetLeft : 0,
			lightShadow : typeof(params.lightShadow) != "undefined" ? params.lightShadow : true,
			angle : typeof(params.angle) != "undefined" ? params.angle : false,
			content : BX.create("div", { props : { className : "menu-popup" }, children: [
				BX.create("div", { props : { className : "menu-popup-items" }, children: items})
			]})
		});

		if (params && params.events)
		{
			for (var eventName in params.events)
				BX.addCustomEvent(popupWindow, eventName, params.events[eventName]);
		}

		return popupWindow;
	}
};

// TODO: copypaste/update/enhance CSS and images from calendar to MAIN CORE
// this.values = [{ID: 1, NAME : '111', DESCRIPTION: '111', URL: 'href://...'}]

window.BXInputPopup = function(params)
{
	this.id = params.id || 'bx-inp-popup-' + Math.round(Math.random() * 1000000);
	this.handler = params.handler || false;
	this.values = params.values || false;
	this.pInput = params.input;
	this.bValues = !!this.values;
	this.defaultValue = params.defaultValue || '';
	this.openTitle = params.openTitle || '';
	this.className = params.className || '';
	this.noMRclassName = params.noMRclassName || 'ec-no-rm';
	this.emptyClassName = params.noMRclassName || 'ec-label';

	var _this = this;
	this.curInd = false;

	if (this.bValues)
	{
		this.pInput.onfocus = this.pInput.onclick = function(e)
		{
			if (this.value == _this.defaultValue)
			{
				this.value = '';
				this.className = '';
			}
			_this.ShowPopup();
			return BX.PreventDefault(e);
		};
		this.pInput.onblur = function()
		{
			if (_this.bShowed)
				setTimeout(function(){_this.ClosePopup(true);}, 200);
			_this.OnChange();
		};
	}
	else
	{
		this.pInput.className = this.noMRclassName;
		this.pInput.onblur = BX.proxy(this.OnChange, this);
	}
}

BXInputPopup.prototype = {
ShowPopup: function()
{
	if (this.bShowed)
		return;

	var _this = this;
	if (!this.oPopup)
	{
		var
			pRow,
			pWnd = BX.create("DIV", {props:{className: "bxecpl-loc-popup " + this.className}});

		for (var i = 0, l = this.values.length; i < l; i++)
		{
			pRow = pWnd.appendChild(BX.create("DIV", {
				props: {id: 'bxecmr_' + i, title: this.values[i].DESCRIPTION},
				text: this.values[i].NAME,
				events: {
					mouseover: function(){this.className = 'bxecplloc-over';},
					mouseout: function(){this.className = '';},
					click: function()
					{
						var ind = this.id.substr('bxecmr_'.length);
						_this.pInput.value = _this.values[ind].NAME;
						_this.curInd = ind;
						_this.OnChange();
						_this.ClosePopup(true);
					}
				}
			}));

			if (this.values[i].URL)
				pRow.appendChild(BX.create('A', {props: {href: this.values[i].URL, className: 'bxecplloc-view', target: '_blank', title: this.openTitle}}));
		}

		this.oPopup = new BX.PopupWindow(this.id, this.pInput, {
			autoHide : true,
			offsetTop : 1,
			offsetLeft : 0,
			lightShadow : true,
			closeByEsc : true,
			content : pWnd
		});

		BX.addCustomEvent(this.oPopup, 'onPopupClose', BX.proxy(this.ClosePopup, this));
	}

	this.oPopup.show();
	this.pInput.select();

	this.bShowed = true;
	BX.onCustomEvent(this, 'onInputPopupShow', [this]);
},

ClosePopup: function(bClosePopup)
{
	this.bShowed = false;

	if (this.pInput.value == '')
		this.OnChange();

	BX.onCustomEvent(this, 'onInputPopupClose', [this]);

	if (bClosePopup === true)
		this.oPopup.close();
},

OnChange: function()
{
	var val = this.pInput.value;
	if (this.bValues)
	{
		if (this.pInput.value == '' || this.pInput.value == this.defaultValue)
		{
			this.pInput.value = this.defaultValue;
			this.pInput.className = this.emptyClassName;
			val = '';
		}
		else
		{
			this.pInput.className = '';
		}
	}

	if (isNaN(parseInt(this.curInd)) || this.curInd !==false && val != this.values[this.curInd].NAME)
		this.curInd = false;
	else
		this.curInd = parseInt(this.curInd);

	BX.onCustomEvent(this, 'onInputPopupChanged', [this, this.curInd, val]);
	if (this.handler && typeof this.handler == 'function')
		this.handler({ind: this.curInd, value: val});
},

Set: function(ind, val, bOnChange)
{
	this.curInd = ind;
	if (this.curInd !== false)
		this.pInput.value = this.values[this.curInd].NAME;
	else
		this.pInput.value = val;

	if (bOnChange !== false)
		this.OnChange();
},

Get: function(ind)
{
	var
		id = false;
	if (typeof ind == 'undefined')
		ind = this.curInd;

	if (ind !== false && this.values[ind])
		id = this.values[ind].ID;
	return id;
},

GetIndex: function(id)
{
	for (var i = 0, l = this.values.length; i < l; i++)
		if (this.values[i].ID == id)
			return i;
	return false;
},

Deactivate: function(bDeactivate)
{
	if (this.pInput.value == '' || this.pInput.value == this.defaultValue)
	{
		if (bDeactivate)
		{
			this.pInput.value = '';
			this.pInput.className = this.noMRclassName;
		}
		else if (this.oEC.bUseMR)
		{
			this.pInput.value = this.defaultValue;
			this.pInput.className = this.emptyClassName;
		}
	}
	this.pInput.disabled = bDeactivate;
}
};


})(window);

/* End */
;
; /* Start:/bitrix/js/main/ajax.js*/
/***********************************************************
Bitrix AJAX library ver 6.5 alpha 
***********************************************************/

/*
private CAjaxThread class - description of current AJAX request thread.
*/
function CAjaxThread(TID)
{
	this.TID = TID;
	this.httpRequest = this._CreateHttpObject();
	this.arAction = [];
}

CAjaxThread.prototype._CreateHttpObject = function()
{
	var obj = null;
	if (window.XMLHttpRequest)
	{
		try {obj = new XMLHttpRequest();} catch(e){}
	}
	else if (window.ActiveXObject)
	{
		try {obj = new ActiveXObject("Microsoft.XMLHTTP");} catch(e){}
		if (!obj)
			try {obj = new ActiveXObject("Msxml2.XMLHTTP");} catch (e){}
	}
	return obj;
}

CAjaxThread.prototype.addAction = function(obHandler)
{
	this.arAction.push(obHandler);
}

CAjaxThread.prototype.clearActions = function()
{
	this.arAction = [];
}

CAjaxThread.prototype.nextAction = function()
{
	return this.arAction.shift();
}

CAjaxThread.prototype.Clear = function()
{
	this.arAction = null;
	this.httpRequest = null;
}

/*
public CAjax main class
*/
function CAjax()
{
	this.arThreads = {};
	this.obTemporary = null;
}

CAjax.prototype._PrepareData = function(arData, prefix)
{
	var data = '';
	if (null != arData)
	{
		for(var i in arData)
		{
			if (data.length > 0) data += '&';
			var name = jsAjaxUtil.urlencode(i);
			if(prefix)
				name = prefix + '[' + name + ']';
			if(typeof arData[i] == 'object')
				data += this._PrepareData(arData[i], name)
			else
				data += name + '=' + jsAjaxUtil.urlencode(arData[i])
		}
	}
	return data;
}

CAjax.prototype.GetThread = function(TID)
{
	return this.arThreads[TID];
}

CAjax.prototype.InitThread = function()
{
	while (true)
	{
		var TID = 'TID' + Math.floor(Math.random() * 1000000);
		if (!this.arThreads[TID]) break;
	}

	this.arThreads[TID] = new CAjaxThread(TID);
	
	return TID;
}

CAjax.prototype.AddAction = function(TID, obHandler)
{
	if (this.arThreads[TID])
	{
		this.arThreads[TID].addAction(obHandler);
	}
}

CAjax.prototype._OnDataReady = function(TID, result)
{
	if (!this.arThreads[TID]) return;

	while (obHandler = this.arThreads[TID].nextAction())
	{
		obHandler(result);
	}
}
	
CAjax.prototype._Close = function(TID)
{
	if (!this.arThreads[TID]) return;

	this.arThreads[TID].Clear();
	this.arThreads[TID] = null;
}
	
CAjax.prototype._SetHandler = function(TID)
{
	var oAjax = this;
	
	function __cancelQuery(e)
	{
		if (!e) e = window.event
		if (!e) return;
		if (e.keyCode == 27)
		{
			oAjax._Close(TID);
			jsEvent.removeEvent(document, 'keypress', this);
		}
	}
	
	function __handlerReadyStateChange()
	{
		if (oAjax.bCancelled) return;
		if (!oAjax.arThreads[TID]) return;
		if (!oAjax.arThreads[TID].httpRequest) return;
		if (oAjax.arThreads[TID].httpRequest.readyState == 4)
		{
			var status = oAjax.arThreads[TID].httpRequest.getResponseHeader('X-Bitrix-Ajax-Status');
			var bRedirect = (status == 'Redirect');
			
			var s = oAjax.arThreads[TID].httpRequest.responseText;
			
			jsAjaxParser.mode = 'implode';
			s = jsAjaxParser.process(s);
			
			if (!bRedirect)
				oAjax._OnDataReady(TID, s);

			oAjax.__prepareOnload();

			if (jsAjaxParser.code.length > 0)
				jsAjaxUtil.EvalPack(jsAjaxParser.code);
			
			oAjax.__runOnload();
			//setTimeout(function() {alert(1); oAjax.__runOnload(); alert(2)}, 30);
			oAjax._Close(TID);
		}
	}

	this.arThreads[TID].httpRequest.onreadystatechange = __handlerReadyStateChange;
	jsEvent.addEvent(document, "keypress", __cancelQuery);
}

CAjax.prototype.__prepareOnload = function()
{
	this.obTemporary = window.onload;
	window.onload = null;
}

CAjax.prototype.__runOnload = function()
{
	if (window.onload) window.onload();
	window.onload = this.obTemporary;
	this.obTemporary = null;
}

CAjax.prototype.Send = function(TID, url, arData)
{
	if (!this.arThreads[TID]) return;

	if (null != arData)
		var data = this._PrepareData(arData);
	else
		var data = '';

	if (data.length > 0) 
	{
		if (url.indexOf('?') == -1)
			url += '?' + data;
		else
			url += '&' + data;	
	}

	if(this.arThreads[TID].httpRequest)
	{
		this.arThreads[TID].httpRequest.open("GET", url, true);
		this._SetHandler(TID);
		return this.arThreads[TID].httpRequest.send("");
	}
}

CAjax.prototype.Post = function(TID, url, arData)
{
	var data = '';

	if (null != arData)
		data = this._PrepareData(arData);
	if(this.arThreads[TID].httpRequest)
	{
		this.arThreads[TID].httpRequest.open("POST", url, true);
		this._SetHandler(TID);
		this.arThreads[TID].httpRequest.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
		return this.arThreads[TID].httpRequest.send(data);
	}
}

/*
public CAjaxForm - class to send forms via iframe
*/
function CAjaxForm(obForm, obHandler, bFirst)
{
	this.obForm = obForm;
	this.obHandler = obHandler;
	this.obFrame = null;

	this.isFormProcessed = false;
	
	if (null == bFirst)
		this.bFirst = false;
	else
		this.bFirst = bFirst;
	
	this.__tmpFormTarget = '';
	this.obAJAXIndicator = null;
	
	this.currentBrowserDetected = "";
	if (window.opera)
		this.currentBrowserDetected = "Opera";
	else if (navigator.userAgent)
	{
		if (navigator.userAgent.indexOf("MSIE") != -1)
			this.currentBrowserDetected = "IE";
		else if (navigator.userAgent.indexOf("Firefox") != -1)
			this.currentBrowserDetected = "Firefox";
	}

	this.IsIE9 = !!document.documentMode && document.documentMode >= 9;
}

CAjaxForm.prototype.setProcessedFlag = function(value)
{
	if (null == value) value = true;
	else value = value ? true : false;
	
	this.obForm.bxAjaxProcessed = value;
	this.isFormProcessed = value;
}

CAjaxForm.isFormProcessed = function(obForm)
{
	if (obForm.bxAjaxProcessed)
		return obForm.bxAjaxProcessed;
	else
		return false;
}

CAjaxForm.prototype.process = function()
{
	var _this = this;

	function __formResultHandler()
	{
		if (!_this.obFrame.contentWindow.document || _this.obFrame.contentWindow.document.body.innerHTML.length == 0) return;

		if (null != _this.obHandler)
		{
			_this.obHandler(_this.obFrame.contentWindow.document.body.innerHTML);
		}

		if (_this.obFrame.contentWindow.AJAX_runExternal)
			_this.obFrame.contentWindow.AJAX_runExternal();

		if (_this.obFrame.contentWindow.AJAX_runGlobal)
			_this.obFrame.contentWindow.AJAX_runGlobal();

		if (_this.bFirst)
		{
			try
			{
				_this.obForm.target = _this.__tmpFormTarget;
				_this.obAJAXIndicator.parentNode.removeChild(_this.obAJAXIndicator);
				_this.obForm.bxAjaxProcessed = false;
			}
			catch (e) 
			{
				_this.obForm = null;
			}
			
			_this.obAJAXIndicator = null;

			if (this.currentBrowserDetected != 'IE') 
				jsEvent.removeAllEvents(_this.obFrame);

			// fixing another strange bug. Now for FF
			var TimerID = setTimeout("document.body.removeChild(document.getElementById('" + _this.obFrame.id + "'));", 100);
			_this.obFrame = null;
			
			if (window.onFormLoaded)
			{
				window.onFormLoaded();
				window.onFormLoaded = null;
			}
		}
	}

	if (this.obForm.target && this.obForm.target.substring(0, 5) == 'AJAX_')
		return;

	if (this.currentBrowserDetected == 'IE')
	{
		if (this.IsIE9)
		{
			this.obAJAXIndicator = document.createElement('input');
			this.obAJAXIndicator.setAttribute('name', 'AJAX_CALL');
			this.obAJAXIndicator.setAttribute('type', 'hidden');
		} 
		else
		{
			this.obAJAXIndicator = document.createElement('<input name="AJAX_CALL" type="hidden" />');
		}
	}
	else
	{
		this.obAJAXIndicator = document.createElement('INPUT');
		this.obAJAXIndicator.type = 'hidden';
		this.obAJAXIndicator.name = 'AJAX_CALL';
	}
	
	this.obAJAXIndicator.value = 'Y';
	
	this.obForm.appendChild(this.obAJAXIndicator);

	var frameName = 'AJAX_' + Math.round(Math.random() * 100000);
	
	if (this.currentBrowserDetected == 'IE')
		if (this.IsIE9)
		{
			this.obFrame = document.createElement('iframe');
			this.obFrame.setAttribute('name', frameName);
		}
		else
		{
			this.obFrame = document.createElement('<iframe name="' + frameName + '"></iframe>');
		}
	else
		this.obFrame = document.createElement('IFRAME');
	
	this.obFrame.style.display = 'none';
	this.obFrame.src = 'javascript:\'\'';
	this.obFrame.id = frameName;
	this.obFrame.name = frameName;
	
	document.body.appendChild(this.obFrame);

	this.__tmpFormTarget = this.obForm.target;
	this.obForm.target = frameName;

	// one more strange bug in IE..
	if (this.currentBrowserDetected == 'IE') 
		this.obFrame.attachEvent("onload", __formResultHandler);
	else
		jsEvent.addEvent(this.obFrame, 'load', __formResultHandler);
	this.setProcessedFlag();
}

var jsAjaxParser = {
	code: [],
	mode: 'implode',
	
	regexp: null,
	regexp_src: null,
	
	process: function(s)
	{
		this.code = [];
		
		if (null == this.regexp)
			this.regexp = /(<script([^>]*)>)([\S\s]*?)(<\/script>)/i;

		do
		{
			var arMatch = s.match(this.regexp);
			
			if (null == arMatch) 
				break;

			var pos = arMatch.index;
			var len = arMatch[0].length;
			
			if (pos > 0)
				this.code.push({TYPE: 'STRING', DATA: s.substring(0, pos)});
			
			if (typeof arMatch[1] == 'undefined' || arMatch[1].indexOf('src=') == -1)
			{
				var script = arMatch[3];
				script = script.replace('<!--', '');

				this.code.push({TYPE: 'SCRIPT', DATA: script});
			}
			else
			{
				if (null == this.regexp_src) 
					this.regexp_src = /src="([^"]*)?"/i;
				var arResult = this.regexp_src.exec(arMatch[1]);
			
				if (null != arResult && arResult[1])
				{
					this.code.push({TYPE: 'SCRIPT_EXT', DATA: arResult[1]});
				}
			}
			
			s = s.substring(pos + len);
		} while (true);

		if (s.length > 0)
		{
			this.code.push({TYPE: 'STRING', DATA: s});
		}
		
		if (this.mode == 'implode')
		{
			s = '';
			for (var i = 0, cnt = this.code.length; i < cnt; i++)
			{
				if (this.code[i].TYPE == 'STRING') 
					s += this.code[i].DATA;
			}
			
			return s;
		}
		else
			return this.code;
	}
}

/*
public jsAjaxUtil - utility object
*/
var jsAjaxUtil = {
	// remove all DOM node children (with events)
	RemoveAllChild: function(pNode)
	{
		try
		{
			while(pNode.childNodes.length>0)
			{
				jsEvent.clearObject(pNode.childNodes[0]);
				pNode.removeChild(pNode.childNodes[0]);
			}
		}
		catch(e)
		{}
	},

	// evaluate js string in window scope
	EvalGlobal: function(script)
	{
		if (window.execScript)
			window.execScript(script, 'javascript');
		else if (jsAjaxUtil.IsSafari())
			window.setTimeout(script, 0);
		else
			window.eval(script);
	},
	
	arLoadedScripts: [],
	
	__isScriptLoaded: function (script_src)
	{
		for (var i=0; i<jsAjaxUtil.arLoadedScripts.length; i++)
			if (jsAjaxUtil.arLoadedScripts[i] == script_src) return true;
		return false;
	},
	
	// evaluate external script
	EvalExternal: function(script_src)
	{
		if (
			/\/bitrix\/js\/main\/ajax.js$/i.test(script_src)
			||
			/\/bitrix\/js\/main\/core\/core.js$/i.test(script_src)
		) return;
	
		if (jsAjaxUtil.__isScriptLoaded(script_src)) return;
		jsAjaxUtil.arLoadedScripts.push(script_src);

		var obAjaxThread = new CAjaxThread();

		obAjaxThread.httpRequest.open("GET", script_src, false); // make *synchronous* request for script source
		obAjaxThread.httpRequest.send("");
		
		var s = obAjaxThread.httpRequest.responseText;
		obAjaxThread.Clear();
		obAjaxThread = null;
		
		jsAjaxUtil.EvalGlobal(s); // evaluate script source
	},
	
	EvalPack: function(code)
	{
		for (var i = 0, cnt = code.length; i < cnt; i++)
		{
			if (code[i].TYPE == 'SCRIPT_EXT' || code[i].TYPE == 'SCRIPT_SRC')
				jsAjaxUtil.EvalExternal(code[i].DATA);
			else if (code[i].TYPE == 'SCRIPT')
				jsAjaxUtil.EvalGlobal(code[i].DATA);
		}
	},
	
	// urlencode js version
	urlencode: function(s)
	{
		return escape(s).replace(new RegExp('\\+','g'), '%2B');
	},
	
	// trim js version
	trim: function(s)
	{
		var r, re;
		re = /^[ \r\n]+/g;
		r = s.replace(re, "");
		re = /[ \r\n]+$/g;
		r = r.replace(re, "");
		return r;
	},
	
	GetWindowSize: function()
	{
		var innerWidth, innerHeight;

		if (self.innerHeight) // all except Explorer
		{
			innerWidth = self.innerWidth;
			innerHeight = self.innerHeight;
		}
		else if (document.documentElement && document.documentElement.clientHeight) // Explorer 6 Strict Mode
		{
			innerWidth = document.documentElement.clientWidth;
			innerHeight = document.documentElement.clientHeight;
		}
		else if (document.body) // other Explorers
		{
			innerWidth = document.body.clientWidth;
			innerHeight = document.body.clientHeight;
		}

		var scrollLeft, scrollTop;
		if (self.pageYOffset) // all except Explorer
		{
			scrollLeft = self.pageXOffset;
			scrollTop = self.pageYOffset;
		}
		else if (document.documentElement && document.documentElement.scrollTop) // Explorer 6 Strict
		{
			scrollLeft = document.documentElement.scrollLeft;
			scrollTop = document.documentElement.scrollTop;
		}
		else if (document.body) // all other Explorers
		{
			scrollLeft = document.body.scrollLeft;
			scrollTop = document.body.scrollTop;
		}

		var scrollWidth, scrollHeight;

		if ( (document.compatMode && document.compatMode == "CSS1Compat"))
		{
			scrollWidth = document.documentElement.scrollWidth;
			scrollHeight = document.documentElement.scrollHeight;
		}
		else
		{
			if (document.body.scrollHeight > document.body.offsetHeight)
				scrollHeight = document.body.scrollHeight;
			else
				scrollHeight = document.body.offsetHeight;

			if (document.body.scrollWidth > document.body.offsetWidth || 
				(document.compatMode && document.compatMode == "BackCompat") ||
				(document.documentElement && !document.documentElement.clientWidth)
			)
				scrollWidth = document.body.scrollWidth;
			else
				scrollWidth = document.body.offsetWidth;
		}

		return  {"innerWidth" : innerWidth, "innerHeight" : innerHeight, "scrollLeft" : scrollLeft, "scrollTop" : scrollTop, "scrollWidth" : scrollWidth, "scrollHeight" : scrollHeight};
	},

	// get element position relative to the whole window
	GetRealPos: function(el)
	{
		if (el.getBoundingClientRect)
		{
			var obRect = el.getBoundingClientRect();
			var obWndSize = jsAjaxUtil.GetWindowSize();
			var arPos = {
				left: obRect.left + obWndSize.scrollLeft, 
				top: obRect.top + obWndSize.scrollTop, 
				right: obRect.right + obWndSize.scrollLeft, 
				bottom: obRect.bottom + obWndSize.scrollTop
			};
			return arPos;
		}
		
		if(!el || !el.offsetParent)
			return false;

		var res = Array();
		res["left"] = el.offsetLeft;
		res["top"] = el.offsetTop;
		var objParent = el.offsetParent;
		
		while(objParent && objParent.tagName != "BODY")
		{
			res["left"] += objParent.offsetLeft;
			res["top"] += objParent.offsetTop;
			objParent = objParent.offsetParent;
		}
		res["right"] = res["left"] + el.offsetWidth;
		res["bottom"] = res["top"] + el.offsetHeight;
		
		return res;
	},
	
	IsIE: function()
	{
		return (document.attachEvent && !jsAjaxUtil.IsOpera());
	},

	IsOpera: function()
	{
		return (navigator.userAgent.toLowerCase().indexOf('opera') != -1);
	},
	
	IsSafari: function()
	{
		var userAgent = navigator.userAgent.toLowerCase();
		return (/webkit/.test(userAgent));
	},

	// simple ajax data loading method (without any visual effects)
	LoadData: function(url, obHandler)
	{
		if (!obHandler) return;

		var TID = jsAjax.InitThread();
		jsAjax.AddAction(TID, obHandler);
		jsAjax.Send(TID, url);
		
		return TID;
	},
	
	// simple ajax data post method (without any visual effects)
	PostData: function(url, arData, obHandler)
	{
		if (!obHandler) return;

		var TID = jsAjax.InitThread();
		jsAjax.AddAction(TID, obHandler);
		jsAjax.Post(TID, url, arData);
		
		return TID;
	},
	
	__LoadDataToDiv: function(url, cont, bReplace, bShadow)
	{
		if (null == bReplace) bReplace = true;
		if (null == bShadow) bShadow = true;
		
		if (typeof cont == 'string' || typeof cont == 'object' && cont.constructor == String)
			var obContainerNode = document.getElementById(cont);
		else
			var obContainerNode = cont;
		
		if (!obContainerNode) return;

		var rnd_tid = Math.round(Math.random() * 1000000);
		
		function __putToContainer(data)
		{
			if (!obContainerNode) return;
			
			//setTimeout('jsAjaxUtil.CloseLocalWaitWindow(\'' + rnd_tid + '\', \'' + obContainerNode.id + '\')', 100);
			jsAjaxUtil.CloseLocalWaitWindow(rnd_tid, obContainerNode);

			if (bReplace)
			{
				jsAjaxUtil.RemoveAllChild(obContainerNode);
				obContainerNode.innerHTML = data;
			}
			else
				obContainerNode.innerHTML += data;
		}

		jsAjaxUtil.ShowLocalWaitWindow(rnd_tid, obContainerNode, bShadow);
		var TID = jsAjaxUtil.LoadData(url, __putToContainer);
	},
	
	// insert ajax data to container (with visual effects)
	InsertDataToNode: function(url, cont, bShadow)
	{
		if (null == bShadow) bShadow = true;
		jsAjaxUtil.__LoadDataToDiv(url, cont, true, bShadow);
	},

	// append ajax data to container (with visual effects)
	AppendDataToNode: function(url, cont, bShadow)
	{
		if (null == bShadow) bShadow = true;
		jsAjaxUtil.__LoadDataToDiv(url, cont, false, bShadow);
	},
	
	GetStyleValue: function(el, styleProp)
	{
		if(el.currentStyle)
			var res = el.currentStyle[styleProp];
		else if(window.getComputedStyle)
			var res = document.defaultView.getComputedStyle(el, null).getPropertyValue(styleProp);
		return res;
	},
	
	// show ajax visuality
	ShowLocalWaitWindow: function (TID, cont, bShadow)
	{
		if (typeof cont == 'string' || typeof cont == 'object' && cont.constructor == String)
			var obContainerNode = document.getElementById(cont);
		else
			var obContainerNode = cont;
		
		if (obContainerNode.getBoundingClientRect)
		{
			var obRect = obContainerNode.getBoundingClientRect();
			var obWndSize = jsAjaxUtil.GetWindowSize();

			var arContainerPos = {
				left: obRect.left + obWndSize.scrollLeft, 
				top: obRect.top + obWndSize.scrollTop, 
				right: obRect.right + obWndSize.scrollLeft, 
				bottom: obRect.bottom + obWndSize.scrollTop
			};
		}
		else
			var arContainerPos = jsAjaxUtil.GetRealPos(obContainerNode);
		
		var container_id = obContainerNode.id;
		
		if (!arContainerPos) return;
		
		if (null == bShadow) bShadow = true;
		
		if (bShadow)
		{
			var obWaitShadow = document.body.appendChild(document.createElement('DIV'));
			obWaitShadow.id = 'waitshadow_' + container_id + '_' + TID;
			obWaitShadow.className = 'waitwindowlocalshadow';
			obWaitShadow.style.top = (arContainerPos.top - 5) + 'px';
			obWaitShadow.style.left = (arContainerPos.left - 5) + 'px';
			obWaitShadow.style.height = (arContainerPos.bottom - arContainerPos.top + 10) + 'px';
			obWaitShadow.style.width = (arContainerPos.right - arContainerPos.left + 10) + 'px';
		}
		
		var obWaitMessage = document.body.appendChild(document.createElement('DIV'));
		obWaitMessage.id = 'wait_' + container_id + '_' + TID;
		obWaitMessage.className = 'waitwindowlocal';
		
		var div_top = arContainerPos.top + 5;
		if (div_top < document.body.scrollTop) div_top = document.body.scrollTop + 5;
		
		obWaitMessage.style.top = div_top + 'px';
		obWaitMessage.style.left = (arContainerPos.left + 5) + 'px';
		
		if(jsAjaxUtil.IsIE())
		{
			var frame = document.createElement("IFRAME");
			frame.src = "javascript:''";
			frame.id = 'waitframe_' + container_id + '_' + TID;
			frame.className = "waitwindowlocal";
			frame.style.width = obWaitMessage.offsetWidth + "px";
			frame.style.height = obWaitMessage.offsetHeight + "px";
			frame.style.left = obWaitMessage.style.left;
			frame.style.top = obWaitMessage.style.top;
			document.body.appendChild(frame);
		}
		
		function __Close(e)
		{
			if (!e) e = window.event
			if (!e) return;
			if (e.keyCode == 27)
			{
				jsAjaxUtil.CloseLocalWaitWindow(TID, cont);
				jsEvent.removeEvent(document, 'keypress', __Close);
			}
		}
		
		jsEvent.addEvent(document, 'keypress', __Close);
	},

	// hide ajax visuality
	CloseLocalWaitWindow: function(TID, cont)
	{
		if (typeof cont == 'string' || typeof cont == 'object' && cont.constructor == String)
			var obContainerNode = document.getElementById(cont);
		else
			var obContainerNode = cont;
	
		var container_id = obContainerNode.id;
		
		var obWaitShadow = document.getElementById('waitshadow_' + container_id + '_' + TID);
		if (obWaitShadow)
			document.body.removeChild(obWaitShadow);
		var obWaitMessageFrame = document.getElementById('waitframe_' + container_id + '_' + TID);
		if (obWaitMessageFrame)
			document.body.removeChild(obWaitMessageFrame);
		var obWaitMessage = document.getElementById('wait_' + container_id + '_' + TID);
		if (obWaitMessage)
			document.body.removeChild(obWaitMessage);
	},

	// simple form sending vithout visual effects. use onsubmit="SendForm(this, MyFunction)"
	SendForm: function(obForm, obHandler)
	{
		if (typeof obForm == 'string' || typeof obForm == 'object' && obForm.constructor == String)
			var obFormHandler = document.getElementById(obForm);
		else
			var obFormHandler = obForm;
			
		if (!obFormHandler.name || obFormHandler.name.length <= 0)
		{
			obFormHandler.name = 'AJAXFORM_' + Math.floor(Math.random() * 1000000);
		}
	
		var obFormMigrate = new CAjaxForm(obFormHandler, obHandler, true);
		obFormMigrate.process();

		return true;
	},
	
	// ajax form submit with visuality and put data to container. use onsubmit="InsertFormDataToNode(this, 'cont_id')"
	InsertFormDataToNode: function(obForm, cont, bShadow)
	{
		if (null == bShadow) bShadow = true;
		return jsAjaxUtil.__LoadFormToDiv(obForm, cont, true, bShadow);
	},

	// similiar with InsertFormDataToNode but append data to container
	AppendFormDataToNode: function(obForm, cont, bShadow)
	{
		if (null == bShadow) bShadow = true;
		return jsAjaxUtil.__LoadFormToDiv(obForm, cont, false, bShadow);
	},
	
	__LoadFormToDiv: function(obForm, cont, bReplace, bShadow)
	{
		if (null == bReplace) bReplace = true;
		if (null == bShadow) bShadow = true;
		
		if (typeof cont == 'string' || typeof cont == 'object' && cont.constructor == String)
			var obContainerNode = document.getElementById(cont);
		else
			var obContainerNode = cont;
		
		if (!obContainerNode) return;

		function __putToContainer(data)
		{
			if (!obContainerNode) return;
			
			if (bReplace)
			{
				jsAjaxUtil.RemoveAllChild(obContainerNode);
				obContainerNode.innerHTML = data;
			}
			else
				obContainerNode.innerHTML += data;
				
			jsAjaxUtil.CloseLocalWaitWindow(obContainerNode.id, obContainerNode);
		}

		jsAjaxUtil.ShowLocalWaitWindow(obContainerNode.id, obContainerNode, bShadow);
		
		return jsAjaxUtil.SendForm(obForm, __putToContainer);
	},

	// load to page new title, css files or script code strings
	UpdatePageData: function (arData)
	{
		if (arData.TITLE) jsAjaxUtil.UpdatePageTitle(arData.TITLE);
		if (arData.NAV_CHAIN) jsAjaxUtil.UpdatePageNavChain(arData.NAV_CHAIN);
		if (arData.CSS && arData.CSS.length > 0) jsAjaxUtil.UpdatePageCSS(arData.CSS);
		if (arData.SCRIPTS && arData.SCRIPTS.length > 0) jsAjaxUtil.UpdatePageScripts(arData.SCRIPTS);
	},
	
	UpdatePageScripts: function(arScripts)
	{
		for (var i = 0; i < arScripts.length; i++)
		{
			jsAjaxUtil.EvalExternal(arScripts[i]);
		}
	},
	
	UpdatePageCSS: function (arCSS)
	{
		jsStyle.UnloadAll();
		for (var i = 0; i < arCSS.length; i++)
		{
			jsStyle.Load(arCSS[i]);
		}
	},
	
	UpdatePageTitle: function(title)
	{
		var obTitle = document.getElementById('pagetitle');
		if (obTitle) 
		{
			obTitle.removeChild(obTitle.firstChild);
			if (!obTitle.firstChild)
				obTitle.appendChild(document.createTextNode(title));
			else
				obTitle.insertBefore(document.createTextNode(title), obTitle.firstChild);
		}
		
		document.title = title;
	},
	
	UpdatePageNavChain: function(nav_chain)
	{
		var obNavChain = document.getElementById('navigation');
		if (obNavChain)
		{
			obNavChain.innerHTML = nav_chain;
		}
	},
	
	ScrollToNode: function(node)
	{
		if (typeof node == 'string' || typeof node == 'object' && node.constructor == String)
			var obNode = document.getElementById(node);
		else
			var obNode = node;
		
		if (obNode.scrollIntoView)
			obNode.scrollIntoView(true);
		else
		{
			var arNodePos = jsAjaxUtil.GetRealPos(obNode);
			window.scrollTo(arNodePos.left, arNodePos.top);
		}
	}
}

/*
public jsStyle - external CSS manager
*/
var jsStyle = {

	arCSS: {},
	bInited: false,
	
	Init: function()
	{
		var arStyles = document.getElementsByTagName('LINK');
		if (arStyles.length > 0)
		{
			for (var i = 0; i<arStyles.length; i++)
			{
				if (arStyles[i].href)
				{
					var filename = arStyles[i].href;
					var pos = filename.indexOf('://');
					if (pos != -1)
						filename = filename.substr(filename.indexOf('/', pos + 3));
					
					arStyles[i].bxajaxflag = false;
					this.arCSS[filename] = arStyles[i];
				}
			}
		}
		
		this.bInited = true;
	},
	
	Load: function(filename)
	{
		if (!this.bInited) 
			this.Init();
	
		if (null != this.arCSS[filename])
		{
			this.arCSS[filename].disabled = false;
			return;
		}

		/*
		var cssNode = document.createElement('link');
		cssNode.type = 'text/css';
		cssNode.rel = 'stylesheet';
		cssNode.href = filename;
		document.getElementsByTagName("head")[0].appendChild(cssNode);
		*/
		
		var link = document.createElement("STYLE");
		link.type = 'text/css';

		var head = document.getElementsByTagName("HEAD")[0];
		head.insertBefore(link, head.firstChild);
		//head.appendChild(link);
		
		if (jsAjaxUtil.IsIE())
		{
			link.styleSheet.addImport(filename);
		}
		else
		{
			var obAjaxThread = new CAjaxThread();
			obAjaxThread.httpRequest.onreadystatechange = null;

			obAjaxThread.httpRequest.open("GET", filename, false); // make *synchronous* request for css source
			obAjaxThread.httpRequest.send("");
			
			var s = obAjaxThread.httpRequest.responseText;
			
			// convert relative resourse paths in css to absolute. current path to css will be lost.
			var pos = filename.lastIndexOf('/');
			if (pos != -1)
			{
				var dirname = filename.substring(0, pos);
				s = s.replace(/url\(([^\/\\].*?)\)/gi, 'url(' + dirname + '/$1)');
			}
			
			obAjaxThread.Clear();
			obAjaxThread = null;

			link.appendChild(document.createTextNode(s));
		}
			
	},
	
	Unload: function(filename)
	{
		if (!this.bInited) this.Init();
	
		if (null != this.arCSS[filename])
		{
			this.arCSS[filename].disabled = true;
		}
	},
	
	UnloadAll: function()
	{
		if (!this.bInited) this.Init();	
		else
			for (var i in this.arCSS)
			{
				if (this.arCSS[i].bxajaxflag)
					this.Unload(i);
			}
	}
}

/*
public jsEvent - cross-browser event manager object
*/
var jsEvent = {
	
	objectList: [null],
	objectEventList: [null],

	__eventManager: function(e)
	{
		if (!e) e = window.event
		var result = true;
	
		// browser comptiability
		try
		{
			if (e.srcElement)
				e.currentTarget = e.srcElement;
		}
		catch (e) {}
		
		if (this.bxEventIndex && jsEvent.objectEventList[this.bxEventIndex] && jsEvent.objectEventList[this.bxEventIndex][e.type])
		{
			var len = jsEvent.objectEventList[this.bxEventIndex][e.type].length;
			for (var i=0; i<len; i++)
			{
				if (jsEvent.objectEventList[this.bxEventIndex][e.type] && jsEvent.objectEventList[this.bxEventIndex][e.type][i])
				{
					var tmp_result = jsEvent.objectEventList[this.bxEventIndex][e.type][i](e);
					if ('boolean' == typeof tmp_result) result = result && tmp_result;
					if (!result) return false;
				}
			}
		}

		return true;
	},
	
	addEvent: function(obElement, event, obHandler)
	{
		if (!obElement.bxEventIndex)
		{
			obElement.bxEventIndex = jsEvent.objectList.length;
			jsEvent.objectList[obElement.bxEventIndex] = obElement;
		}
		
		if (!jsEvent.objectEventList[obElement.bxEventIndex])
			jsEvent.objectEventList[obElement.bxEventIndex] = {};

		if (!jsEvent.objectEventList[obElement.bxEventIndex][event])
		{
			jsEvent.objectEventList[obElement.bxEventIndex][event] = [];
			
			if (obElement['on' + event]) 
				jsEvent.objectEventList[obElement.bxEventIndex][event].push(obElement['on' + event]);
			
			obElement['on' + event] = null;
			obElement['on' + event] = jsEvent.__eventManager;
		}
		
		jsEvent.objectEventList[obElement.bxEventIndex][event].push(obHandler);
	},
	
	removeEvent: function(obElement, event, obHandler)
	{
		if (obElement.bxEventIndex)
		{
			if (jsEvent.objectEventList[obElement.bxEventIndex][event])
			{
				for (var i=0; i<jsEvent.objectEventList[obElement.bxEventIndex][event].length; i++)
				{
					if (obHandler == jsEvent.objectEventList[obElement.bxEventIndex][event][i])
					{
						delete jsEvent.objectEventList[obElement.bxEventIndex][event][i];
						return;
					}
				}
			}
		}
	},
	
	removeAllHandlers: function(obElement, event)
	{
		if (obElement.bxEventIndex)
		{
			if (jsEvent.objectEventList[obElement.bxEventIndex][event])
			{
				// possible memory leak. must be checked;
				jsEvent.objectEventList[obElement.bxEventIndex][event] = [];
			}
		}
	},

	removeAllEvents: function(obElement)
	{
		if (obElement.bxEventIndex)
		{
			if (jsEvent.objectEventList[obElement.bxEventIndex])
			{
				// possible memory leak. must be checked;
				jsEvent.objectEventList[obElement.bxEventIndex] = [];
			}
		}
	},
	
	clearObject: function(obElement)
	{
		if (obElement.bxEventIndex)
		{
			if (jsEvent.objectEventList[obElement.bxEventIndex])
			{
				// possible memory leak. must be checked;
				delete jsEvent.objectEventList[obElement.bxEventIndex];
			}
			
			if (jsEvent.objectList[obElement.bxEventIndex])
			{
				// possible memory leak. must be checked;
				delete jsEvent.objectList[obElement.bxEventIndex];
			}
			
			delete obElement.bxEventIndex;
		}
	}
}

var jsAjaxHistory = {
	expected_hash: '',
	counter: 0,
	bInited: false,
	
	obFrame: null,
	obImage: null,
	bHashCollision: false,
	
	obTimer: null,
	
	__hide_object: function(ob)
	{
		ob.style.position = 'absolute';
		ob.style.top = '-1000px';
		ob.style.left = '-1000px';
		ob.style.height = '10px';
		ob.style.width = '10px';
	},
	
	init: function(node)
	{
		if (jsAjaxHistory.bInited) return;
		
		jsAjaxHistory.expected_hash = window.location.hash;

		if (!jsAjaxHistory.expected_hash || jsAjaxHistory.expected_hash == '#') jsAjaxHistory.expected_hash = '__bx_no_hash__';
		
		var obCurrentState = {'node': node, 'title':window.document.title, 'data': document.getElementById(node).innerHTML};
		var obNavChain = document.getElementById('navigation');
		if (null != obNavChain)
			obCurrentState.nav_chain = obNavChain.innerHTML;
		
		jsAjaxHistoryContainer.put(jsAjaxHistory.expected_hash, obCurrentState);

		jsAjaxHistory.obTimer = setTimeout(jsAjaxHistory.__hashListener, 500);
		
		if (jsAjaxUtil.IsIE())
		{
			jsAjaxHistory.obFrame = document.createElement('IFRAME');
			jsAjaxHistory.__hide_object(jsAjaxHistory.obFrame);
			
			document.body.appendChild(jsAjaxHistory.obFrame);
			
			jsAjaxHistory.obFrame.contentWindow.document.open();
			jsAjaxHistory.obFrame.contentWindow.document.write(jsAjaxHistory.expected_hash);
			jsAjaxHistory.obFrame.contentWindow.document.close();
			jsAjaxHistory.obFrame.contentWindow.document.title = window.document.title;
		}
		else if (jsAjaxUtil.IsOpera())
		{
			jsAjaxHistory.obImage = document.createElement('IMG');
			jsAjaxHistory.__hide_object(jsAjaxHistory.obImage);
			
			document.body.appendChild(jsAjaxHistory.obImage);
			
			jsAjaxHistory.obImage.setAttribute('src', 'javascript:location.href = \'javascript:jsAjaxHistory.__hashListener();\';');
		}
		
		jsAjaxHistory.bInited = true;
	},

	__hashListener: function()
	{
		if (jsAjaxHistory.obTimer)
		{
			window.clearTimeout(jsAjaxHistory.obTimer);
			jsAjaxHistory.obTimer = null;
		}
	
		if (null != jsAjaxHistory.obFrame)
			var current_hash = jsAjaxHistory.obFrame.contentWindow.document.body.innerText;
		else
			var current_hash = window.location.hash;

		if (!current_hash || current_hash == '#') current_hash = '__bx_no_hash__';
		
		if (current_hash.indexOf('#') == 0) current_hash = current_hash.substring(1);
		
		if (current_hash != jsAjaxHistory.expected_hash)
		{
			var state = jsAjaxHistoryContainer.get(current_hash);
			if (state)
			{
				document.getElementById(state.node).innerHTML = state.data;
				jsAjaxUtil.UpdatePageTitle(state.title);
				if (state.nav_chain) 
					jsAjaxUtil.UpdatePageNavChain(state.nav_chain);
				
				jsAjaxHistory.expected_hash = current_hash;
				if (null != jsAjaxHistory.obFrame)
				{
					var __hash = current_hash == '__bx_no_hash__' ? '' : current_hash;
					if (window.location.hash != __hash && window.location.hash != '#' + __hash)
						window.location.hash = __hash;
				}
			}
		}
		
		jsAjaxHistory.obTimer = setTimeout(jsAjaxHistory.__hashListener, 500);
	},

	put: function(node, new_hash)
	{
		//alert(new_hash);
		var state = {
			'node': node,
			'title': window.document.title,
			'data': document.getElementById(node).innerHTML
		};
		
		var obNavChain = document.getElementById('navigation');
		if (obNavChain)
			state.nav_chain = obNavChain.innerHTML;
		
		//var new_hash = '#cnt' + (++jsAjaxHistory.counter);
		jsAjaxHistoryContainer.put(new_hash, state);
		jsAjaxHistory.expected_hash = new_hash;

		window.location.hash = jsAjaxUtil.urlencode(new_hash);

		if (null != jsAjaxHistory.obFrame)
		{
			jsAjaxHistory.obFrame.contentWindow.document.open();
			jsAjaxHistory.obFrame.contentWindow.document.write(new_hash);
			jsAjaxHistory.obFrame.contentWindow.document.close();
			jsAjaxHistory.obFrame.contentWindow.document.title = state.title;
		}
	},

	checkRedirectStart: function(param_name, param_value)
	{
		var current_hash = window.location.hash;
		if (current_hash.substring(0, 1) == '#') current_hash = current_hash.substring(1);
		
		if (current_hash.substring(0, 5) == 'view/')
		{
			jsAjaxHistory.bHashCollision = true;
			document.write('<' + 'div id="__ajax_hash_collision_' + param_value + '" style="display: none;">');
		}
	},
	
	checkRedirectFinish: function(param_name, param_value)
	{
		document.write('</div>');
		
		var current_hash = window.location.hash;
		if (current_hash.substring(0, 1) == '#') current_hash = current_hash.substring(1);
		
		jsEvent.addEvent(window, 'load', function () 
		{
			//alert(current_hash);
			if (current_hash.substring(0, 5) == 'view/')
			{
				var obColNode = document.getElementById('__ajax_hash_collision_' + param_value);
				var obNode = obColNode.firstChild;
				jsAjaxUtil.RemoveAllChild(obNode);
				obColNode.style.display = 'block';
				
				// IE, Opera and Chrome automatically modifies hash with urlencode, but FF doesn't ;-(
				if (!jsAjaxUtil.IsIE() && !jsAjaxUtil.IsOpera() && !jsAjaxUtil.IsSafari())
					current_hash = jsAjaxHistory.urlencode(current_hash);
				
				current_hash += (current_hash.indexOf('%3F') == -1 ? '%3F' : '%26') + param_name + '=' + param_value;
				
				var url = '/bitrix/tools/ajax_redirector.php?hash=' + current_hash; //jsAjaxHistory.urlencode(current_hash);
				jsAjaxUtil.InsertDataToNode(url, obNode, false);
			}
		});
	},
	
	urlencode: function(s)
	{
		if (window.encodeURIComponent)
			return encodeURIComponent(s);
		else if (window.encodeURI)
			return encodeURI(s);
		else
			return jsAjaxUtil.urlencode(s);
	}
}

var jsAjaxHistoryContainer = {
	arHistory: {},
	
	put: function(hash, state)
	{
		this.arHistory[hash] = state;
	},
	
	get: function(hash)
	{
		return this.arHistory[hash];
	}
}

// for compatibility with IE 5.0 browser
if (![].pop)
{
	Array.prototype.pop = function()
	{
		if (this.length <= 0) return false;
		var element = this[this.length-1];
		delete this[this.length-1];
		this.length--;
		return element;
	}
	
	Array.prototype.shift = function()
	{
		if (this.length <= 0) return false;
		var tmp = this.reverse();
		var element = tmp.pop();
		this.prototype = tmp.reverse();
		return element;
	}
	
	Array.prototype.push = function(element)
	{
		this[this.length] = element;
	}
}

var jsAjax = new CAjax();

/* End */
;
; /* Start:/bitrix/js/main/core/core_tooltip.js*/
(function(window) {
if (BX.tooltip) return;

var arTooltipIndex = {},
	bDisable = false;

BX.tooltip = function(user_id, anchor_name, loader, rootClassName, bForceUseLoader)
{
	if (BX.message('TOOLTIP_ENABLED') != "Y")
		return;

	BX.ready(function() {
		var anchor = BX(anchor_name);
		if (null == anchor)
			return;

		var tooltipId = user_id;
		if(bForceUseLoader && BX.type.isNotEmptyString(loader))
		{
			// prepare tooltip ID from custom loader
			var loaderHash = 0;
			for(var i = 0, len = loader.length; i < len; i++)
			{
				loaderHash = (31 * loaderHash + loader.charCodeAt(i)) << 0;
			}

			tooltipId = loaderHash + user_id;
		}

		if (null == arTooltipIndex[tooltipId])
			arTooltipIndex[tooltipId] = new BX.CTooltip(user_id, anchor, loader, rootClassName, bForceUseLoader);
		else
		{
			arTooltipIndex[tooltipId].ANCHOR = anchor;
			arTooltipIndex[tooltipId].rootClassName = rootClassName;
			arTooltipIndex[tooltipId].LOADER = (bForceUseLoader && BX.type.isNotEmptyString(loader)) ? loader : '/bitrix/tools/tooltip.php';
			arTooltipIndex[tooltipId].Create();
		}
	});
};

BX.tooltip.disable = function(){ bDisable = true; };
BX.tooltip.enable = function(){ bDisable = false; };

BX.CTooltip = function(user_id, anchor, loader, rootClassName, bForceUseLoader)
{
	this.LOADER = (bForceUseLoader && BX.type.isNotEmptyString(loader)) ? loader : '/bitrix/tools/tooltip.php';
	this.USER_ID = user_id;
	this.ANCHOR = anchor;
	this.rootClassName = '';

	if (
		rootClassName != 'undefined'
		&& rootClassName != null
		&& rootClassName.length > 0
	)
		this.rootClassName = rootClassName;

	var old = document.getElementById('user_info_' + this.USER_ID);
	if (null != old)
	{
		if (null != old.parentNode)
			old.parentNode.removeChild(old);

		old = null;
	}

	var _this = this;

	this.INFO = null;

	this.width = 393;
	this.height = 302;

	this.CoordsLeft = 0;
	this.CoordsTop = 0;
	this.AnchorRight = 0;
	this.AnchorBottom = 0;

	this.DIV = null;
	this.ROOT_DIV = null;

	if (BX.browser.IsIE())
		this.IFRAME = null;

	this.v_delta = 0;
	this.classNameAnim = false;
	this.classNameFixed = false;

	this.left = 0;
	this.top = 0;

	this.tracking = false;
	this.active = false;
	this.showed = false;

	this.Create = function()
	{
		_this.ANCHOR.onmouseover = function() {
			if (!bDisable)
			{
				_this.StartTrackMouse(this);
			}
		};

		_this.ANCHOR.onmouseout = function() {
			_this.StopTrackMouse(this);
		}
	};

	this.Create();

	this.TrackMouse = function(e)
	{
		if(!_this.tracking)
			return;

		var current;
		if(e && e.pageX)
			current = {x: e.pageX, y: e.pageY};
		else
			current = {x: e.clientX + document.body.scrollLeft, y: e.clientY + document.body.scrollTop};

		if(current.x < 0)
			current.x = 0;
		if(current.y < 0)
			current.y = 0;

		current.time = _this.tracking;

		if(!_this.active)
			_this.active = current;
		else
		{
			if(
				_this.active.x >= (current.x - 1) && _this.active.x <= (current.x + 1)
				&& _this.active.y >= (current.y - 1) && _this.active.y <= (current.y + 1)
			)
			{
				if((_this.active.time + 20/*2sec*/) <= current.time)
					_this.ShowTooltip();
			}
			else
				_this.active = current;
		}
	};

	this.ShowTooltip = function()
	{
		var old = document.getElementById('user_info_' + _this.USER_ID);
		if(bDisable || old && old.style.display == 'block')
			return;

		var bIE = (BX.browser.IsIE() && !BX.browser.IsIE10());

		if (null == _this.DIV && null == _this.ROOT_DIV)
		{
			_this.ROOT_DIV = document.body.appendChild(document.createElement('DIV'));
			_this.ROOT_DIV.style.position = 'absolute';

			_this.DIV = _this.ROOT_DIV.appendChild(document.createElement('DIV'));
			if (bIE)
				_this.DIV.className = 'bx-user-info-shadow-ie';
			else
				_this.DIV.className = 'bx-user-info-shadow';

			_this.DIV.style.width = _this.width + 'px';
			_this.DIV.style.height = _this.height + 'px';
		}

		var left = _this.CoordsLeft;
		var top = _this.CoordsTop + 30;
		var arScroll = jsUtils.GetWindowScrollPos();
		var body = document.body;

		var h_mirror = false;
		var v_mirror = false;

		if((body.clientWidth + arScroll.scrollLeft) < (left + _this.width))
		{
			left = _this.AnchorRight - _this.width;
			h_mirror = true;
		}

		if((top - arScroll.scrollTop) < 0)
		{
			top = _this.AnchorBottom - 5;
			v_mirror = true;
			_this.v_delta = 40;
		}
		else
			_this.v_delta = 0;

		_this.ROOT_DIV.style.left = parseInt(left) + "px";
		_this.ROOT_DIV.style.top = parseInt(top) + "px";
		_this.ROOT_DIV.style.zIndex = 1200;

		BX.bind(BX(_this.ROOT_DIV), "click", BX.eventCancelBubble);

		if (
			this.rootClassName != 'undefined'
			&& this.rootClassName != null
			&& this.rootClassName.length > 0
		)
			_this.ROOT_DIV.className = this.rootClassName;

		if ('' == _this.DIV.innerHTML)
		{
			var url;
			if (_this.LOADER.indexOf('?') >= 0)
				url = _this.LOADER + '&MUL_MODE=INFO&USER_ID=' + _this.USER_ID + '&site=' + BX.message('SITE_ID');
			else
				url = _this.LOADER + '?MUL_MODE=INFO&USER_ID=' + _this.USER_ID + '&site=' + BX.message('SITE_ID');

			BX.ajax.get(url, _this.InsertData);
			_this.DIV.id = 'user_info_' + _this.USER_ID;

			_this.DIV.innerHTML = '<div class="bx-user-info-wrap">'
				+ '<div class="bx-user-info-leftcolumn">'
					+ '<div class="bx-user-photo" id="user-info-photo-' + _this.USER_ID + '"><div class="bx-user-info-data-loading">' + BX.message('JS_CORE_LOADING') + '</div></div>'
					+ '<div class="bx-user-tb-control bx-user-tb-control-left" id="user-info-toolbar-' + _this.USER_ID + '"></div>'
				+ '</div>'
				+ '<div class="bx-user-info-data">'
					+ '<div id="user-info-data-card-' + _this.USER_ID + '"></div>'
					+ '<div class="bx-user-info-data-tools">'
						+ '<div class="bx-user-tb-control bx-user-tb-control-right" id="user-info-toolbar2-' + _this.USER_ID + '"></div>'
						+ '<div class="bx-user-info-data-clear"></div>'
					+ '</div>'
				+ '</div>'
				+ '</div><div class="bx-user-info-bottomarea"></div>';
		}

		if (bIE)
		{
			_this.DIV.className = 'bx-user-info-shadow-ie';
			_this.classNameAnim = 'bx-user-info-shadow-anim-ie';
			_this.classNameFixed = 'bx-user-info-shadow-ie';
		}
		else
		{
			_this.DIV.className = 'bx-user-info-shadow';
			_this.classNameAnim = 'bx-user-info-shadow-anim';
			_this.classNameFixed = 'bx-user-info-shadow';
		}

		_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-left-top.png', sizingMethod = 'crop' );";

		if (h_mirror && v_mirror)
		{
			if (BX.browser.IsIE6())
			{
				_this.DIV.className = 'bx-user-info-shadow-hv-ie6';
				_this.classNameAnim = 'bx-user-info-shadow-hv-anim-ie6';
				_this.classNameFixed = 'bx-user-info-shadow-hv-ie6';
			}
			else if (bIE)
			{
				_this.DIV.className = 'bx-user-info-shadow-hv-ie';
				_this.classNameAnim = 'bx-user-info-shadow-hv-anim-ie';
				_this.classNameFixed = 'bx-user-info-shadow-hv-ie';
			}
			else
			{
				_this.DIV.className = 'bx-user-info-shadow-hv';
				_this.classNameAnim = 'bx-user-info-shadow-hv-anim';
				_this.classNameFixed = 'bx-user-info-shadow-hv';
			}

			_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-right-bottom.png', sizingMethod = 'crop' );";
		}
		else
		{
			if (h_mirror)
			{
				if (bIE)
				{
					_this.DIV.className = 'bx-user-info-shadow-h-ie';
					_this.classNameAnim = 'bx-user-info-shadow-h-anim-ie';
					_this.classNameFixed = 'bx-user-info-shadow-h-ie';
				}
				else
				{
					_this.DIV.className = 'bx-user-info-shadow-h';
					_this.classNameAnim = 'bx-user-info-shadow-h-anim';
					_this.classNameFixed = 'bx-user-info-shadow-h';
				}

				_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-right-top.png', sizingMethod = 'crop' );";
			}

			if (v_mirror)
			{
				if (BX.browser.IsIE6())
				{
					_this.DIV.className = 'bx-user-info-shadow-v-ie6';
					_this.classNameAnim = 'bx-user-info-shadow-v-anim-ie6';
					_this.classNameFixed = 'bx-user-info-shadow-v-ie6';
				}
				else if (bIE)
				{
					_this.DIV.className = 'bx-user-info-shadow-v-ie';
					_this.classNameAnim = 'bx-user-info-shadow-v-anim-ie';
					_this.classNameFixed = 'bx-user-info-shadow-v-ie';
				}
				else
				{
					_this.DIV.className = 'bx-user-info-shadow-v';
					_this.classNameAnim = 'bx-user-info-shadow-v-anim';
					_this.classNameFixed = 'bx-user-info-shadow-v';
				}

				_this.filterFixed = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='/bitrix/components/bitrix/main.user.link/templates/.default/images/cloud-left-bottom.png', sizingMethod = 'crop' );";
			}
		}


		if (BX.browser.IsIE() && null == _this.IFRAME)
		{
			_this.IFRAME = document.body.appendChild(document.createElement('IFRAME'));
			_this.IFRAME.id = _this.DIV.id + "_frame";
			_this.IFRAME.style.position = 'absolute';
			_this.IFRAME.style.width = (_this.width - 60) + 'px';
			_this.IFRAME.style.height = (_this.height - 100) + 'px';
			_this.IFRAME.style.borderStyle = 'solid';
			_this.IFRAME.style.borderWidth = '0px';
			_this.IFRAME.style.zIndex = 550;
			_this.IFRAME.style.display = 'none';
		}
		if (BX.browser.IsIE())
		{
			_this.IFRAME.style.left = (parseInt(left) + 25) + "px";
			_this.IFRAME.style.top = (parseInt(top) + 30 + _this.v_delta) + "px";
		}

		_this.DIV.style.display = 'none';
		_this.ShowOpacityEffect({func: _this.SetVisible, obj: _this.DIV, arParams: []}, 0);

		document.getElementById('user_info_' + _this.USER_ID).onmouseover = function() {
			_this.StartTrackMouse(this);
		};

		document.getElementById('user_info_' + _this.USER_ID).onmouseout = function() {
			_this.StopTrackMouse(this);
		}
	};

	this.InsertData = function(data)
	{
		if (null != data && data.length > 0)
		{
			eval('_this.INFO = ' + data);

			var cardEl = document.getElementById('user-info-data-card-' + _this.USER_ID);
			cardEl.innerHTML = _this.INFO.RESULT.Card;

			var photoEl = document.getElementById('user-info-photo-' + _this.USER_ID);
			photoEl.innerHTML = _this.INFO.RESULT.Photo;

			var toolbarEl = document.getElementById('user-info-toolbar-' + _this.USER_ID);
			toolbarEl.innerHTML = _this.INFO.RESULT.Toolbar;

			var toolbar2El = document.getElementById('user-info-toolbar2-' + _this.USER_ID);
			toolbar2El.innerHTML = _this.INFO.RESULT.Toolbar2;
		}
	}

};
BX.CTooltip.prototype.StartTrackMouse = function(ob)
{
	var _this = this;

	if(!this.tracking)
	{
		var elCoords = jsUtils.GetRealPos(ob);
		this.CoordsLeft = elCoords.left + 0;
		this.CoordsTop = elCoords.top - 325;
		this.AnchorRight = elCoords.right;
		this.AnchorBottom = elCoords.bottom;

		this.tracking = 1;
		jsUtils.addEvent(document, "mousemove", _this.TrackMouse);
		setTimeout(function() {_this.tickTimer()}, 500);
	}
};

BX.CTooltip.prototype.StopTrackMouse = function()
{
	var _this = this;
	if(this.tracking)
	{
		jsUtils.removeEvent(document, "mousemove", _this.TrackMouse);
		this.active = false;
		setTimeout(function() {_this.HideTooltip()}, 500);
		this.tracking = false;
	}
};

BX.CTooltip.prototype.tickTimer = function()
{
	var _this = this;

	if(this.tracking)
	{
		this.tracking++;
		if(this.active)
		{
			if( (this.active.time + 5/*0.5sec*/)  <= this.tracking)
				this.ShowTooltip();
		}
		setTimeout(function() {_this.tickTimer()}, 100);
	}
};

BX.CTooltip.prototype.HideTooltip = function()
{
	if(!this.tracking)
		this.ShowOpacityEffect({func: this.SetInVisible, obj: this.DIV, arParams: []}, 1);
};

BX.CTooltip.prototype.ShowOpacityEffect = function(oCallback, bFade)
{
	var steps = 3;
	var period = 1;
	var delta = 1 / steps;
	var i = 0, op, _this = this;

	if(BX.browser.IsIE() && _this.DIV)
		_this.DIV.className = _this.classNameAnim;

	var show = function()
	{
		i++;
		if (i > steps)
		{
			clearInterval(intId);
			if (!oCallback.arParams)
				oCallback.arParams = [];
			if (oCallback.func && oCallback.obj)
				oCallback.func.apply(oCallback.obj, oCallback.arParams);
			return;
		}
		op = bFade ? 1 - i * delta : i * delta;

		if (_this.DIV != null)
		{
			try{
				_this.DIV.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity=' + (op * 100) + ')';
				_this.DIV.style.opacity = op;
				_this.DIV.style.MozOpacity = op;
				_this.DIV.style.KhtmlOpacity = op;
			}
			catch(e){
			}
			finally{
				if (!bFade && i == 1)
					_this.DIV.style.display = 'block';

				if (bFade && i == steps && _this.DIV)
					_this.DIV.style.display = 'none';


				if (jsUtils.IsIE() && i == 1 && bFade && _this.IFRAME)
					_this.IFRAME.style.display = 'none';


				if (jsUtils.IsIE() && i == steps && _this.DIV)
				{
					if (!bFade)
						_this.IFRAME.style.display = 'block';

					_this.DIV.style.filter = _this.filterFixed;
					_this.DIV.className = _this.classNameFixed;
					_this.DIV.innerHTML = ''+_this.DIV.innerHTML;
				}
			}
		}

	};
	var intId = setInterval(show, period);

}

})(window);
/* End */
;
; /* Start:/bitrix/js/main/json/json2.min.js*/

var JSON;if(!JSON){JSON={};}
(function(){'use strict';function f(n){return n<10?'0'+n:n;}
if(typeof Date.prototype.toJSON!=='function'){Date.prototype.toJSON=function(key){return isFinite(this.valueOf())?this.getUTCFullYear()+'-'+
f(this.getUTCMonth()+1)+'-'+
f(this.getUTCDate())+'T'+
f(this.getUTCHours())+':'+
f(this.getUTCMinutes())+':'+
f(this.getUTCSeconds())+'Z':null;};String.prototype.toJSON=Number.prototype.toJSON=Boolean.prototype.toJSON=function(key){return this.valueOf();};}
var cx=/[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,escapable=/[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,gap,indent,meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'},rep;function quote(string){escapable.lastIndex=0;return escapable.test(string)?'"'+string.replace(escapable,function(a){var c=meta[a];return typeof c==='string'?c:'\\u'+('0000'+a.charCodeAt(0).toString(16)).slice(-4);})+'"':'"'+string+'"';}
function str(key,holder){var i,k,v,length,mind=gap,partial,value=holder[key];if(value&&typeof value==='object'&&typeof value.toJSON==='function'){value=value.toJSON(key);}
if(typeof rep==='function'){value=rep.call(holder,key,value);}
switch(typeof value){case'string':return quote(value);case'number':return isFinite(value)?String(value):'null';case'boolean':case'null':return String(value);case'object':if(!value){return'null';}
gap+=indent;partial=[];if(Object.prototype.toString.apply(value)==='[object Array]'){length=value.length;for(i=0;i<length;i+=1){partial[i]=str(i,value)||'null';}
v=partial.length===0?'[]':gap?'[\n'+gap+partial.join(',\n'+gap)+'\n'+mind+']':'['+partial.join(',')+']';gap=mind;return v;}
if(rep&&typeof rep==='object'){length=rep.length;for(i=0;i<length;i+=1){if(typeof rep[i]==='string'){k=rep[i];v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}else{for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=str(k,value);if(v){partial.push(quote(k)+(gap?': ':':')+v);}}}}
v=partial.length===0?'{}':gap?'{\n'+gap+partial.join(',\n'+gap)+'\n'+mind+'}':'{'+partial.join(',')+'}';gap=mind;return v;}}
if(typeof JSON.stringify!=='function'){JSON.stringify=function(value,replacer,space){var i;gap='';indent='';if(typeof space==='number'){for(i=0;i<space;i+=1){indent+=' ';}}else if(typeof space==='string'){indent=space;}
rep=replacer;if(replacer&&typeof replacer!=='function'&&(typeof replacer!=='object'||typeof replacer.length!=='number')){throw new Error('JSON.stringify');}
return str('',{'':value});};}
if(typeof JSON.parse!=='function'){JSON.parse=function(text,reviver){var j;function walk(holder,key){var k,v,value=holder[key];if(value&&typeof value==='object'){for(k in value){if(Object.prototype.hasOwnProperty.call(value,k)){v=walk(value,k);if(v!==undefined){value[k]=v;}else{delete value[k];}}}}
return reviver.call(holder,key,value);}
text=String(text);cx.lastIndex=0;if(cx.test(text)){text=text.replace(cx,function(a){return'\\u'+
('0000'+a.charCodeAt(0).toString(16)).slice(-4);});}
if(/^[\],:{}\s]*$/.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,'@').replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']').replace(/(?:^|:|,)(?:\s*\[)+/g,''))){j=eval('('+text+')');return typeof reviver==='function'?walk({'':j},''):j;}
throw new SyntaxError('JSON.parse');};}}());
/* End */
;
; /* Start:/bitrix/js/main/core/core_ls.js*/
;(function(window){
if (window.BX.localStorage) return;

var
	BX = window.BX,
	localStorageInstance = null,
	_prefix = 'bx' + BX.message('USER_ID') + '-' + BX.message('SITE_ID') + '-',
	_key = '_bxCurrentKey',
	_support = false;

BX.localStorage = function()
{
	this.keyChanges = {}; // flag to skip self changes in IE
	BX.bind(
		(BX.browser.IsIE() && !BX.browser.IsIE9()) ? document : window, // HATE!
		'storage',
		BX.proxy(this._onchange, this)
	);

	setInterval(BX.delegate(this._clear, this), 5000);
};

/* localStorage public interface */

BX.localStorage.checkBrowser = function()
{
	return _support;
};

BX.localStorage.set = function(key, value, ttl)
{
	return BX.localStorage.instance().set(key, value, ttl);
};

BX.localStorage.get = function(key)
{
	return BX.localStorage.instance().get(key);
};

BX.localStorage.remove = function(key)
{
	return BX.localStorage.instance().remove(key);
};

BX.localStorage.instance = function()
{
	if (!localStorageInstance)
	{
		var support = BX.localStorage.checkBrowser();
		if (support == 'native')
			localStorageInstance = new BX.localStorage();
		else if (support == 'ie8')
			localStorageInstance = new BX.localStorageIE8();
		else if (support == 'ie7')
			localStorageInstance = new BX.localStorageIE7();
		else
		{
			localStorageInstance = {
				'set' : BX.DoNothing,
				'get' : function(){return null},
				'remove' : BX.DoNothing
			};
		}
	}
	return localStorageInstance;
};

/* localStorage prototype */

BX.localStorage.prototype.prefix = function()
{
	return _prefix;
}

BX.localStorage.prototype._onchange = function(e)
{
	e = e || window.event;

	if (!e.key)
		return;

	if (BX.browser.IsIE() && this.keyChanges[e.key])
	{
		this.keyChanges[e.key] = false;
		return;
	}

	if (!!e.key && e.key.substring(0,this.prefix().length) == this.prefix())
	{
		var d = {
			key: e.key.substring(this.prefix().length, e.key.length),
			value: !!e.newValue? this._decode(e.newValue.substring(11, e.newValue.length)): null,
			oldValue: !!e.oldValue? this._decode(e.oldValue.substring(11, e.oldValue.length)): null
		};

		switch(d.key)
		{
			case 'BXGCE': // BX Global Custom Event
				if (d.value)
				{
					BX.onCustomEvent(d.value.e, d.value.p);
				}
			break;
			default:
				// normal event handlers
				if (e.newValue)
					BX.onCustomEvent(window, 'onLocalStorageSet', [d]);
				if (e.oldValue && !e.newValue)
					BX.onCustomEvent(window, 'onLocalStorageRemove', [d]);

				BX.onCustomEvent(window, 'onLocalStorageChange', [d]);
			break;
		}
	}
};

BX.localStorage.prototype._clear = function()
{
	var curDate = +new Date(), key, i;

	for (i=0; i<localStorage.length; i++)
	{
		key = localStorage.key(i);
		if (key.substring(0,2) == 'bx')
		{
			var ttl = localStorage.getItem(key).split(':', 1)*1000;
			if (curDate >= ttl)
				localStorage.removeItem(key);
		}
	}
};

BX.localStorage.prototype._encode = function(value)
{
	if (typeof(value) == 'object')
		value = JSON.stringify(value)
	else
		value = value.toString();
	return value;
};

BX.localStorage.prototype._decode = function(value)
{
	var answer = null;
	if (!!value)
	{
		try {answer = JSON.parse(value);}
		catch(e) { answer = value; }
	}
	return answer;
};

BX.localStorage.prototype._trigger_error = function(e, key, value, ttl)
{
	BX.onCustomEvent(this, 'onLocalStorageError', [e, {key: key, value: value, ttl: ttl}]);
}

BX.localStorage.prototype.set = function(key, value, ttl)
{
	if (!ttl || ttl <= 0)
		ttl = 60;

	if (key == undefined || key == null || value == undefined)
		return false;

	this.keyChanges[this.prefix()+key] = true;
	try
	{
		localStorage.setItem(
			this.prefix()+key,
			(Math.round((+new Date())/1000)+ttl)+':'+this._encode(value)
		);
	}
	catch (e)
	{
		this._trigger_error(e, key, value, ttl);
	}
};

BX.localStorage.prototype.get = function(key)
{
	var storageAnswer = localStorage.getItem(this.prefix()+key);

	if (storageAnswer)
	{
		var ttl = storageAnswer.split(':', 1)*1000;
		if ((+new Date()) <= ttl)
		{
			storageAnswer = storageAnswer.substring(11, storageAnswer.length);
			return this._decode(storageAnswer);
		}
	}

	return null;
};

BX.localStorage.prototype.remove = function(key)
{
	this.keyChanges[this.prefix()+key] = true;
	localStorage.removeItem(this.prefix()+key);
};

/************** IE 7 ******************/

BX.localStorageIE7 = function()
{
	this.NS = 'BXLocalStorage';
	this.__current_state = {};
	this.keyChanges = {};

	BX.ready(BX.delegate(this._Init, this));
};

BX.extend(BX.localStorageIE7, BX.localStorage);

BX.localStorageIE7.prototype._Init = function()
{
	this.storage_element = document.body.appendChild(BX.create('DIV'));
	this.storage_element.addBehavior('#default#userData');
	this.storage_element.load(this.NS);

	var doc = this.storage_element.xmlDocument,
		len = doc.firstChild.attributes.length;

	for (var i = 0; i<len; i++)
	{
		if (!!doc.firstChild.attributes[i])
		{
			var k = doc.firstChild.attributes[i].nodeName;
			if (k.substring(0,this.prefix().length) == this.prefix())
			{
				this.__current_state[k] = doc.firstChild.attributes[i].nodeValue;
			}
		}
	}

	setInterval(BX.delegate(this._Listener, this), 500);
	setInterval(BX.delegate(this._clear, this), 5000);
};

BX.localStorageIE7.prototype._Listener = function(bInit)
{
	this.storage_element.load(this.NS);

	var doc = this.storage_element.xmlDocument,
		len = doc.firstChild.attributes.length,
		i,k,v;

	var new_state = {}, arChanges = [];

	for (i = 0; i<len; i++)
	{
		if (!!doc.firstChild.attributes[i])
		{
			k = doc.firstChild.attributes[i].nodeName;
			if (k.substring(0,this.prefix().length) == this.prefix())
			{
				v = doc.firstChild.attributes[i].nodeValue;

				if (this.__current_state[k] != v)
				{
					arChanges.push({
						key: k, newValue: v, oldValue: this.__current_state[k]
					});
				}

				new_state[k] = v;
				delete this.__current_state[k];
			}
		}
	}

	for (i in this.__current_state)
	{
		arChanges.push({
			key: i, newValue: undefined, oldValue: this.__current_state[i]
		});
	}

	this.__current_state = new_state;

	for (i=0; i<arChanges.length; i++)
	{
		this._onchange(arChanges[i]);
	}
};

BX.localStorageIE7.prototype._clear = function()
{
	this.storage_element.load(this.NS);

	var doc = this.storage_element.xmlDocument,
		len = doc.firstChild.attributes.length,
		curDate = +new Date(),
		i,k,v,ttl;

	for (i = 0; i<len; i++)
	{
		if (!!doc.firstChild.attributes[i])
		{
			k = doc.firstChild.attributes[i].nodeName;
			if (k.substring(0,2) == 'bx')
			{
				v = doc.firstChild.attributes[i].nodeValue;
				ttl = v.split(':', 1)*1000
				if (curDate >= ttl)
				{
					doc.firstChild.removeAttribute(k)
				}
			}
		}
	}

	this.storage_element.save(this.NS);
};

BX.localStorageIE7.prototype.set = function(key, value, ttl)
{
	if (!ttl || ttl <= 0)
		ttl = 60;

	try
	{
		this.storage_element.load(this.NS);

		var doc = this.storage_element.xmlDocument;

		this.keyChanges[this.prefix()+key] = true;

		doc.firstChild.setAttribute(
			this.prefix()+key,
			(Math.round((+new Date())/1000)+ttl)+':'+this._encode(value)
		);

		this.storage_element.save(this.NS);
	}
	catch(e)
	{
		this._trigger_error(e, key, value, ttl);
	}
};

BX.localStorageIE7.prototype.get = function(key)
{
	this.storage_element.load(this.NS);
	var doc = this.storage_element.xmlDocument;

	var storageAnswer = doc.firstChild.getAttribute(this.prefix()+key);

	if (storageAnswer)
	{
		var ttl = storageAnswer.split(':', 1)*1000;
		if ((+new Date()) <= ttl)
		{
			storageAnswer = storageAnswer.substring(11, storageAnswer.length);
			return this._decode(storageAnswer);
		}
	}

	return null;
};

BX.localStorageIE7.prototype.remove = function(key)
{
	this.storage_element.load(this.NS);

	var doc = this.storage_element.xmlDocument;
	doc.firstChild.removeAttribute(this.prefix()+key);

	this.keyChanges[this.prefix()+key] = true;
	this.storage_element.save(this.NS);

	return this._decode(storageAnswer);
};

/************** IE 8 & FF 3.6 ***************/

BX.localStorageIE8 = function()
{
	this.key = _key;

	this.currentKey = null;
	this.currentValue = null;

	BX.localStorageIE8.superclass.constructor.apply(this);
};
BX.extend(BX.localStorageIE8, BX.localStorage);

BX.localStorageIE8.prototype._onchange = function(e)
{
	if (null == this.currentKey)
	{
		this.currentKey = localStorage.getItem(this.key);
		if (this.currentKey)
		{
			this.currentValue = localStorage.getItem(this.prefix() + this.currentKey);
		}
	}
	else
	{
		var e = {
			key: this.prefix() + this.currentKey,
			newValue: localStorage.getItem(this.prefix() + this.currentKey),
			oldValue: this.currentValue
		};

		this.currentKey = null;
		this.currentValue = null;

		// especially for FF3.6
		if (this.keyChanges[e.key])
		{
			this.keyChanges[e.key] = false;
			return;
		}

		BX.localStorageIE8.superclass._onchange.apply(this, [e]);
	}
}

BX.localStorageIE8.prototype.set = function(key, value, ttl)
{
	this.currentKey = null;
	this.keyChanges[this.prefix()+key] = true;

	try
	{
		localStorage.setItem(this.key, key);
		BX.localStorageIE8.superclass.set.apply(this, arguments);
	}
	catch(e)
	{
		this._trigger_error(e, key, value, ttl);
	}
}

BX.localStorageIE8.prototype.remove = function(key)
{
	this.currentKey = null;
	this.keyChanges[this.prefix()+key] = true;

	localStorage.setItem(this.key, key);
	BX.localStorageIE8.superclass.remove.apply(this, arguments);
}

/* additional functions */

BX.onGlobalCustomEvent = function(eventName, arEventParams, bSkipSelf)
{
	if (!!BX.localStorage.checkBrowser())
		BX.localStorage.set('BXGCE', {e:eventName,p:arEventParams}, 1);

	if (!bSkipSelf)
		BX.onCustomEvent(eventName, arEventParams);
};

/***************** initialize *********************/

try {
	_support = !!localStorage.setItem;
} catch(e) {}

if (_support)
{
	_support = 'native';

	// hack to check FF3.6 && IE8
	var _target = (BX.browser.IsIE() && !BX.browser.IsIE9()) ? document : window,
		_checkFFnIE8 = function(e) {
		if (typeof(e||window.event).key == 'undefined')
			_support = 'ie8';
		BX.unbind(_target, 'storage', _checkFFnIE8);
		BX.localStorage.instance();
	};
	BX.bind(_target, 'storage', _checkFFnIE8);
	localStorage.setItem(_key, null);
}
else if (BX.browser.IsIE())
{
	_support = 'ie7';
	BX.localStorage.instance();
}

})(window)

/* End */
;
; /* Start:/bitrix/js/main/core/core_image.js*/
;(function(){

if (window.BX.CImageView)
	return;

/******* image viewer ********/

// show single image - not recommended
BX.viewImage = function(img_src, w, h, title, params)
{
	params = params || {};
	params.cycle = false;
	params.list = [{image:img_src, height: h, width: w, title: title}];

	var obView = new BX.CImageView(params);
	obView.show();

	return obView;
}

// bind image viewer on concrete node
BX.viewImageBind = function(div, params, isTarget, groupBy)
{
	var obImageView = new BX.CImageView(params);

	if(!isTarget)
		isTarget = {tag:'IMG'};

	BX.ready(function(){
		_viewImageBind(div, isTarget, groupBy, obImageView);
	});

	return obImageView;
};

function _viewImageBind(div, isTarget, groupBy, obImageView)
{
	var div = BX(div);
	if (!!div)
	{
		BX.bindDelegate(div, 'click', isTarget, function(e)
		{
			var parent = div;
			if (!!groupBy)
			{
				parent = BX.findParent(this, groupBy, div)||parent;
			}

			var imgNodeList = BX.findChildren(parent, isTarget, true),
				imgList = [],
				currentImage = false;

			for(var i=0; i<imgNodeList.length; i++)
			{
				var imgData = {
					thumb: imgNodeList[i].src,
					image: imgNodeList[i].getAttribute('data-bx-image'),

					width: imgNodeList[i].getAttribute('data-bx-width'),
					height: imgNodeList[i].getAttribute('data-bx-height'),

					full: imgNodeList[i].getAttribute('data-bx-full'),
					full_width: imgNodeList[i].getAttribute('data-bx-full-width'),
					full_height: imgNodeList[i].getAttribute('data-bx-full-height'),
					full_size: imgNodeList[i].getAttribute('data-bx-full-size'),

					title: imgNodeList[i].getAttribute('data-bx-title')||imgNodeList[i].alt||imgNodeList[i].title
				};

				var bHasLink = imgNodeList[i].parentNode.tagName.toUpperCase() == 'A' && !!imgNodeList[i].parentNode.href;

				if(bHasLink)
				{
					imgData.image = imgData.image || imgNodeList[i].parentNode.href;
					imgData.title = imgData.title || imgNodeList[i].parentNode.title;

					imgData.width = imgNodeList[i].parentNode.getAttribute('data-bx-width');
					imgData.height = imgNodeList[i].parentNode.getAttribute('data-bx-height');

					imgData.full = imgData.full || imgNodeList[i].parentNode.getAttribute('data-bx-full');
					if(!!imgData.full)
					{
						imgData.full_width = imgData.full_width || imgNodeList[i].parentNode.getAttribute('data-bx-full-width');
						imgData.full_height = imgData.full_height || imgNodeList[i].parentNode.getAttribute('data-bx-full-height');
						imgData.full_size = imgData.full_size || imgNodeList[i].parentNode.getAttribute('data-bx-full-size');
					}

					imgData.title = imgData.title||imgNodeList[i].parentNode.getAttribute('data-bx-title')||imgNodeList[i].parentNode.alt||imgNodeList[i].parentNode.title;
				}

				imgData.image = imgData.image || imgData.thumb;

				if(imgNodeList[i] == this)
					currentImage = imgData.image

				if (!!imgData.image)
					imgList.push(imgData);
			}

			var bLink = this.parentNode.tagName.toUpperCase() == 'A' && !!this.parentNode.href,
				bExtLink = bLink && !!currentImage && this.parentNode.href != currentImage;

			if(!bExtLink)
			{
				obImageView.setList(imgList);
				obImageView.show(this.getAttribute('data-bx-image')||this.src);

				if(bLink)
					return BX.PreventDefault(e);
			}
		});
	}
};

/******* image viewer main class ********/
/*
params: {
	list: [], // starting list of images
	cycle: true, // whether to cycle images list - go to first after last
	resize: 'WH', //'W' - resize image to fit width, 'H' - resize image to fit height, 'WH' - W&H , ''||false => show original image size without resizing. RECOMMENDATION: set lockScroll: true for resize: W or resize: false;
	resizeToggle: false,
	showTitle: true, // whether to show image title
	preload: 1, // number of list images to be preloaded (in both sides. default - 1 next and 1 previous)
	minMargin: 20, // - minimum space between viewer and screen edge.
	minPadding: 12, // - minimum space between viewer and image edge.
	lockScroll: false, // whether to lock page scroll.
	keyMap: {} // map for hotkeys. set to false to disable hotkeys. use BX.CImageView.defaultSettings.keyMap as default
}

elements: [{
	thumb: '/images/image.jpg',
	image: '/images/thumb.jpg',
	title: 'This is my image!',
	height: int
	width: int
}]
*/
BX.CImageView = function(params)
{
	this.params = BX.clone(BX.CImageView.defaultSettings);
	for(var i in params)
	{
		this.params[i] = params[i];
	}

	this.DIV = null;
	this.OVERLAY = null;
	this.IMAGE_WRAP = null;
	this.IMAGE = BX.create('IMG', {
		props: {
			className: 'bx-images-viewer-image'
		},
		events: {
			load: BX.proxy(this.adjustPos, this),
			click: BX.proxy(this.next, this)
		}
	});

	this.list = this.params.list;
	this.list_preload = [];

	this._current = 0;

	this.bVisible = false;
};

BX.CImageView.defaultSettings = {
	list: [],
	cycle: true, // whether to cycle images list - go to first after last
	resize: 'WH', //'W' - resize image to fit width, 'H' - resize image to fit height, 'WH' - W&H , ''||false => show original image size without resizing
	resizeToggle: false,
	showTitle: true, // whether to show image title
	preload: 1, // number of list images to be preloaded
	minMargin: 20, //minimal margin
	minPadding: 12, // minimal padding
	lockScroll: false,
	keyMap: {
		27: 'close', // esc
		33: 'prev', // pgup
		37: 'prev', // left
		38: 'prev', // up
		34: 'next', // pgdn
		39: 'next', // right
		40: 'next', // down
		32: 'next' // space
	}
};

BX.CImageView.prototype._create = function()
{
	if (!this.DIV)
	{
		var specTag = BX.browser.IsIE() && !BX.browser.IsDoctype() ? 'A' : 'SPAN',
			specHref = specTag == 'A' ? 'javascript:void(0)' : null;

		this.OVERLAY = document.body.appendChild(BX.create('DIV', {
			props: {className: 'bx-images-viewer-overlay'},
			events: {click: BX.proxy(this._hide, this)}
		}));

		this.DIV = this.OVERLAY.appendChild(BX.create('DIV', {
			props: {className: 'bx-images-viewer-wrap-outer'},
			events: {
				click: BX.eventCancelBubble
			},
			children: [
				(this.PREV_LINK = BX.create(specTag, {
					props: {
						className: 'bx-images-viewer-prev-outer',
						href: specHref
					},
					events: {
						click: BX.proxy(this.prev, this)
					},
					html: '<span class="bx-images-viewer-prev"></span>'
				})),
				(this.NEXT_LINK = BX.create(specTag, {
					props: {
						className: 'bx-images-viewer-next-outer',
						href: specHref
					},
					events: {
						click: BX.proxy(this.next, this)
					},
					html: '<span class="bx-images-viewer-next"></span>'
				})),
				(this.IMAGE_TITLE = BX.create('DIV', {
					style: {bottom: '0'},
					props: {className: 'bx-images-viewer-title'}
				})),
				BX.create('DIV', {
					props: {className: 'bx-images-viewer-wrap-inner'},
					style: {padding: this.params.minPadding + 'px'},
					children: [
						(this.IMAGE_WRAP = BX.create('DIV', {
							props: {className: 'bx-images-viewer-wrap'},
							children: [
								this.IMAGE
							]
						}))
					]
				}),
				BX.create(specTag, {
					props: {
						className: 'bx-images-viewer-close',
						href: specHref
					},
					events: {click: BX.proxy(this._hide, this)},
					html: '<span class="bx-images-viewer-close-inner"></span>'
				})
			]
		}));

		if (!!this.params.resizeToggle)
		{
			this.IMAGE_WRAP.appendChild(BX.create('SPAN', {
				props: {className: 'bx-images-viewer-size-toggle'},
				style: {
					right: this.params.minPadding + 'px',
					bottom: this.params.minPadding + 'px'
				},
				events: {
					click: BX.proxy(this._toggle_resize, this)
				}
			}))
		}
	}
};

BX.CImageView.prototype._keypress = function(e)
{
	var key = (e||window.event).keyCode || (e||window.event).charCode;
	if (!!this.params.keyMap && !!this.params.keyMap[key] && !!this[this.params.keyMap[key]])
	{
		this[this.params.keyMap[key]].apply(this);
		return BX.PreventDefault(e);
	}
};

BX.CImageView.prototype._toggle_resize = function()
{
	var tmp = this.params.resize;
	this.params.resize = this.params.resizeToggle;
	this.params.resizeToggle = tmp;

	if (this.params.resize != 'WH')
	{
		this.params.lockScroll = true;
		this._lock_scroll();
	}
	else
	{
		this.params.lockScroll = false;
		this._unlock_scroll();
	}

	this.adjustSize();
	this.adjustPos();
};

BX.CImageView.prototype.adjustPos = function()
{
	if (this.list[this._current].height > 0 && this.list[this._current].width > 0)
	{
		this._adjustPosByImg();
	}
	else
	{
		if (!this.IMAGE_WRAP.style.height)
			this.IMAGE_WRAP.style.height = "100px";
		if (!this.IMAGE_WRAP.style.width)
			this.IMAGE_WRAP.style.width = "100px";

		setTimeout(BX.proxy(this._adjustPosByImg, this), 250);
	}
};

BX.CImageView.prototype._adjustPosByImg = function()
{
	if (this.bVisible)
	{
		var wndSize = BX.GetWindowSize(),
			top = parseInt((wndSize.innerHeight - parseInt(this.IMAGE_WRAP.style.height) - 2 * this.params.minPadding)/2),
			left = parseInt((wndSize.innerWidth - parseInt(this.IMAGE_WRAP.style.width) - 2 * this.params.minPadding)/2);

		if (!this.params.lockScroll && wndSize.innerWidth < wndSize.scrollHeight)
			left -= 20;

		if (top < this.params.minMargin)
			top = this.params.minMargin;
		if (left < this.params.minMargin + Math.min(70, this.PREV_LINK.offsetWidth))
			left = this.params.minMargin + Math.min(70, this.PREV_LINK.offsetWidth);

		if (this.params.showTitle && !!this.list[this._current].title)
		{
			top -= 20;
		}

		this.DIV.style.top = top + 'px';
		this.DIV.style.left = left + 'px';
	}
};

BX.CImageView.prototype.adjustSize = function()
{
	var wndSize = BX.GetWindowSize(), img = this.list[this._current];

	if (!!img.height && !!img.width)
	{
		if (!this.params.lockScroll && wndSize.innerWidth < wndSize.scrollHeight)
			wndSize.innerWidth -= 20;

		wndSize.innerWidth -= this.params.minMargin * 2 + this.params.minPadding * 2 + Math.min(140, this.PREV_LINK.offsetWidth + this.NEXT_LINK.offsetWidth);
		wndSize.innerHeight -= this.params.minMargin * 2 + this.params.minPadding * 2;

		if (this.params.showTitle && !!this.list[this._current].title)
		{
			wndSize.innerHeight -= 40;
		}

		var height = img.height,
			width = img.width,
			ratio = [1];

		if (this.params.resize)
		{
			if(this.params.resize.indexOf('W') >= 0)
				ratio.push(wndSize.innerWidth/width);
			if (this.params.resize.indexOf('H') >= 0)
				ratio.push(wndSize.innerHeight/height);
		}

		ratio = Math.min.apply(window, ratio);

		height *= ratio;
		width *= ratio;

		this.IMAGE_WRAP.style.height = parseInt(height) + 'px';
		this.IMAGE_WRAP.style.width = parseInt(width) + 'px';

		if (BX.browser.IsIE())
		{
			var h = parseInt(this.IMAGE_WRAP.style.height) + this.params.minPadding * 2;

			this.PREV_LINK.style.height = this.NEXT_LINK.style.height = h + 'px';
			this.PREV_LINK.firstChild.style.top = this.NEXT_LINK.firstChild.style.top = parseInt(h/2-20) + 'px';
		}
	}
};

BX.CImageView.prototype._lock_scroll = function()
{
	if (this.params.lockScroll)
		BX.addClass(document.body, 'bx-images-viewer-lock-scroll');
};

BX.CImageView.prototype._unlock_scroll = function()
{
	if (this.params.lockScroll)
		BX.removeClass(document.body, 'bx-images-viewer-lock-scroll');
};

BX.CImageView.prototype._unhide = function()
{
	this.bVisible = true;

	this.DIV.style.display = 'block';
	this.OVERLAY.style.display = 'block';

	this.PREV_LINK.style.display = (this.list.length > 1 && (this.params.cycle || this._current > 0)) ? 'block' : 'none';
	this.NEXT_LINK.style.display = (this.list.length > 1 && (this.params.cycle || this._current < this.list.length-1)) ? 'block' : 'none';

	this.adjustPos();

	BX.unbind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustPos, this));
	BX.bind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.bind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.bind(window, 'resize', BX.proxy(this.adjustPos, this));

	this._lock_scroll();
};

BX.CImageView.prototype._hide = function()
{
	this.bVisible = false;

	this.DIV.style.display = 'none';
	this.OVERLAY.style.display = 'none';

	BX.unbind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustPos, this));

	this._unlock_scroll();

	BX.onCustomEvent(this, 'onImageViewClose', [this.list[this._current]]);
};

BX.CImageView.prototype.add = function(data)
{
	this.list.push(data);
};

BX.CImageView.prototype.setList = function(list)
{
	this.list = [];
	this.list_preload = [];

	if (!!list && BX.type.isArray(list))
	{
		for(var i=0; i<list.length; i++)
		{
			this.add(list[i]);
		}
	}

	if (this.bVisible)
	{
		if (this.list.length > 0)
			this.show();
		else
			this.close();
	}
};

BX.CImageView.prototype.show = function(img)
{
	var _current = this._current;

	if (BX.type.isElementNode(img))
		img = img.getAttribute('src');

	if(typeof(img) == 'object' && (!!img.image || !!img.thumb))
		img = (img.image||img.thumb);

	if (BX.type.isString(img))
	{
		for(var i=0; i < this.list.length; i++)
		{
			if(this.list[i].image == img || this.list[i].thumb == img)
			{
				_current = i;
				break;
			}
		}
	}

	img = this.list[_current];

	if (!img)
		return;

	this._current = _current;

	this._create();

	this.IMAGE.style.opacity = 0;

	this.adjustSize();

	if (!this.list_preload[this._current])
	{
		BX.addClass(this.IMAGE_WRAP, 'bx-images-viewer-wrap-loading');
		this.list_preload[this._current] = new Image();
		this.list_preload[this._current].bxloaded = false;
		this.list_preload[this._current].onload = this._get_image_onload();
		this.list_preload[this._current].src = img.image;

		BX.defer(function(){
			if((this.list_preload[this._current].width > 0 || this.list_preload[this._current].height > 0))
			{
				this.IMAGE.onload = null;
				this.IMAGE.style.opacity = 1;
			}
		}, this)();
	}
	else if (this.list_preload[this._current].bxloaded)
	{
		setTimeout(BX.delegate(this.list_preload[this._current].onload, this.list_preload[this._current]), 350);
	}

	setTimeout(BX.proxy(this._check_title, this), 300);
	this._unhide();

	BX.onCustomEvent(this, 'onImageViewShow', [img]);
};

BX.CImageView.prototype._check_title = function()
{
	this.IMAGE_TITLE.innerHTML = '';

	if (this.params.showTitle && this.list[this._current].title || this.list[this._current].full)
	{
		var height = 0,
			bottom = 0,
			params = {
				style: {
					opacity: '1'
				},
				children: []
			};

		if(this.params.showTitle && this.list[this._current].title)
		{
			params.children.push(BX.create('DIV', {props: {className: 'bx-images-viewer-title-item'}, text: this.list[this._current].title}));
			height += 35;
			bottom += 35;
		}

		if(this.list[this._current].full)
		{
			var p = [];
			if(this.list[this._current].full_height && this.list[this._current].full_width)
			{
				p.push(this.list[this._current].full_width+'x'+this.list[this._current].full_height);
			}

			if(this.list[this._current].full_size)
			{
				p.push(this.list[this._current].full_size);
			}

			html = '<a href="'+this.list[this._current].full+'" class="bx-images-viewer-full-link" target="_blank">' + BX.message('JS_CORE_IMAGE_FULL') + (p.length > 0 ? (' ('+p.join(', ')+')') : '') + '</a>';
			params.children.push(BX.create('DIV', {props: {className: 'bx-images-viewer-title-item bx-images-viewer-full'}, html: html}));
			height += 35;
			bottom += 35;
		}

		params.style.height = height + 'px';
		params.style.bottom = -bottom + 'px';
		BX.adjust(this.IMAGE_TITLE, params);
	}
	else
	{
		this.IMAGE_TITLE.style.opacity = '0';
		this.IMAGE_TITLE.style.bottom = '0';
		this.IMAGE_TITLE.style.height = '0';
	}
}

BX.CImageView.prototype._get_image_onload = function(_current)
{
	_current = typeof _current == 'undefined' ? this._current : _current;
	return BX.delegate(function(){
		BX.proxy_context.bxloaded = true;
		if (_current == this._current)
		{
			var img = this.list[this._current];

			BX.removeClass(this.IMAGE_WRAP, 'bx-images-viewer-wrap-loading');

			this.IMAGE.onload = function(){
				this.onload = null;
				this.style.opacity = 1;
			};

			this.IMAGE.src = BX.proxy_context.src;

			if (BX.proxy_context.width)
				img.width = BX.proxy_context.width;
			if (BX.proxy_context.height)
				img.height = BX.proxy_context.height;

			this.adjustSize();
			this.adjustPos();

			BX.defer(this._preload, this)();
		}
		BX.onCustomEvent(this, 'onImageViewLoad', [this.list[_current], _current == this._current]);
	}, this);
}

BX.CImageView.prototype._preload = function()
{
	if (this.params.preload > 0)
	{
		var finish = Math.max(this._current-this.params.preload, this.params.cycle ? -1000 : 0),
			start = Math.min(this._current+this.params.preload, this.params.cycle ? this.list.length + 1000 : this.list.length-1);

		if (finish < start)
		{
			for (var i=start; i>=finish; i--)
			{
				var ix = i;
				if (ix < 0)
					ix += this.list.length;
				else if (ix >= this.list.length)
					ix -= this.list.length;

				if (!this.list_preload[ix])
				{
					this.list_preload[ix] = new Image();
					this.list_preload[ix].src = this.list[ix].image;
					this.list_preload[ix].onload = this._get_image_onload(ix);
				}
			}
		}

	}
};

BX.CImageView.prototype.next = function()
{
	if (this.list.length > 1)
	{
		this._current++;
		if(this._current >= this.list.length)
		{
			if(!!this.params.cycle)
				this._current = 0;
			else
				this._current--;

			BX.onCustomEvent(this, 'onImageViewFinishList', [this.list[this._current], 1]);
		}

		this.show();
	}
};

BX.CImageView.prototype.prev = function()
{
	if (this.list.length > 1)
	{
		this._current--;
		if(this._current < 0)
		{
			if(!!this.params.cycle)
				this._current = this.list.length-1;
			else
				this._current++;

			BX.onCustomEvent(this, 'onImageViewFinishList', [this.list[this._current], -1]);
		}

		this.show();
	}
};

BX.CImageView.prototype.close = function()
{
	this._hide();
};

})(window);
/* End */
;
; /* Start:/bitrix/js/socialnetwork/sonet-iframe-popup.js*/
BX.SonetIFramePopup = function(params)
{
	this.params = params;
	this.title = '';

	this.pathToView = "";
	this.pathToCreate = "";
	this.pathToEdit = "";
	this.pathToInvite = "";

	if (params.pathToView)
		this.pathToView = this.params.pathToView;
	if (params.pathToCreate)
		this.pathToCreate = this.params.pathToCreate + (this.params.pathToCreate.indexOf("?") == -1 ? "?" : "&") + "IFRAME=Y&SONET=Y";
	if (params.pathToEdit)
		this.pathToEdit = this.params.pathToEdit + (this.params.pathToEdit.indexOf("?") == -1 ? "?" : "&") + "IFRAME=Y&SONET=Y";
	if (params.pathToInvite)
		this.pathToInvite = this.params.pathToInvite + (this.params.pathToInvite.indexOf("?") == -1 ? "?" : "&") + "IFRAME=Y&SONET=Y";

	this.width = (this.params.width ? params.width : 900);
	this.height = (this.params.height ? params.height : 400);

	this.isReady = false;

	this.popup = null;
	this.iframe = null;

	BX.addCustomEvent('onSonetIframeCallbackRefresh', BX.delegate(this.onSonetIframeCallbackRefresh, this));
	BX.addCustomEvent('onSonetIframeCallbackGroup', BX.delegate(this.onSonetIframeCallbackGroup, this));
	BX.addCustomEvent('onSonetIframeCancelClick', BX.delegate(this.Hide, this));
};

BX.SonetIFramePopup.prototype.onSonetIframeCallbackRefresh = function()
{
	if (this.popup != null && this.popup.isShown())
	{
		this.Hide();
		BX.reload();
	}
};

BX.SonetIFramePopup.prototype.onSonetIframeCallbackGroup = function(group_id)
{
	if (this.popup != null && this.popup.isShown())
	{
		this.Hide();
		top.location.href = this.pathToView.replace('#group_id#', group_id);
	}
};

BX.SonetIFramePopup.prototype.Create = function()
{
	if (this.iframe != null)
		return;

	this.iframe = BX.create('IFRAME', {
		props: {
			scrolling: "no",
			frameBorder: "0"
		},
		style: {
			width: this.width + "px",
			height: this.height + "px",
			overflow: "hidden",
			border: "1px solid #fff",
			borderTop: "0px",
			borderRadius: "4px"
		}
	});

	this.popup = BX.PopupWindowManager.create(
		'sonet_iframe_popup_' + parseInt(Math.random() * 10000),
		window.top,
		{
			autoHide: false,
			titleBar: true,
			closeIcon: true,
			draggable: true,
			overlay: true,
			content: (this.content = BX.create('DIV', {
				style: {
					width: parseInt(this.width) + 'px'
				},
				children: [ this.iframe ]
			}))
		}
	);
};


BX.SonetIFramePopup.prototype.Show = function(url)
{
	if (this.popup == null)
		this.Create();

	if (!this.popup.isShown())
	{
		var iframeDocument = null;
		if (this.iframe.contentDocument)
			iframeDocument = this.iframe.contentDocument;
		else if (this.iframe.contentWindow)
			iframeDocument = this.iframe.contentWindow.document;

		if (iframeDocument.body && iframeDocument.body.innerHTML)
			iframeDocument.body.innerHTML = '';

		this.iframe.src = url;
		this.popup.setTitleBar({content: this.GetTitle()});
		this.popup.show();
	}
};

BX.SonetIFramePopup.prototype.Hide = function()
{
	if (this.popup != null && this.popup.isShown())
		this.popup.close();
};

BX.SonetIFramePopup.prototype.Add = function(groupId, groupName)
{
	this.SetTitle(BX.message("SONET_GROUP_TITLE_CREATE"));
	this.Show(this.pathToCreate);
};

BX.SonetIFramePopup.prototype.Edit = function(groupId, groupName)
{
	this.SetTitle(BX.message("SONET_GROUP_TITLE_EDIT").replace("#GROUP_NAME#", groupName));
	this.Show(this.pathToEdit.replace("#group_id#", groupId));
};

BX.SonetIFramePopup.prototype.Invite = function(groupId, groupName)
{
	this.SetTitle(BX.message("SONET_GROUP_TITLE_INVITE").replace("#GROUP_NAME#", groupName));
	this.Show(this.pathToInvite.replace("#group_id#", groupId));
};

BX.SonetIFramePopup.prototype.SetTitle = function(title)
{
	this.title = title;
};

BX.SonetIFramePopup.prototype.GetTitle = function()
{
	return BX.create('DIV', {
		props: {className: 'sonet-popup-title'},
		text: this.title
	});
};

BX.SonetIFramePopup.prototype.isOpened = function() {
	return this.popup != null && this.popup.isShown();
};
/* End */
;
; /* Start:/bitrix/js/main/rating.js*/
if (!BXRS)
{
	var BXRS = {};
	var BXRSW = {};
} 

Rating = function(voteId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile)
{	
	this.enabled = true;
	this.voteId = voteId;
	this.entityTypeId = entityTypeId;
	this.entityId = entityId;
	this.available = available == 'Y'? true: false;
	this.userId = userId;
	this.localize = localize;	
	this.template = template;
	this.light = template == 'light'? true: false;
	this.pathToUserProfile = pathToUserProfile;
	
	this.box = template == 'light'? BX('bx-rating-'+voteId): BX('rating-vote-'+voteId);
	if (this.box === null)
	{
		this.enabled = false;
		return false;
	}
	if (!this.light)
	{
		this.buttonPlus = BX('rating-vote-'+voteId+'-plus');
		this.buttonMinus = BX('rating-vote-'+voteId+'-minus');
		this.result = BX('rating-vote-'+voteId+'-result');
	}
	else
	{
		this.buttonPlus = BX.findChild(this.box, {className:'bx-rating-yes'}, true, false);
		this.buttonMinus = BX.findChild(this.box, {className:'bx-rating-no'}, true, false);
		this.buttonPlusCount = BX.findChild(this.buttonPlus, {className:'bx-rating-yes-count'}, true, false);
		this.buttonMinusCount = BX.findChild(this.buttonMinus, {className:'bx-rating-no-count'}, true, false);
		this.buttonPlusText = BX.findChild(this.buttonPlus, {className:'bx-rating-yes-text'}, true, false);
		this.buttonMinusText = BX.findChild(this.buttonMinus, {className:'bx-rating-no-text'}, true, false);
	
		this.popupPlus = null;
		this.popupMinus = null;
		this.popupTimeoutId = null;
		this.popupContentPlus = BX.findChild(BX('bx-rating-popup-cont-'+voteId+'-plus'), {tagName:'span', className:'bx-ilike-popup'}, true, false);
		this.popupContentMinus = BX.findChild(BX('bx-rating-popup-cont-'+voteId+'-minus'), {tagName:'span', className:'bx-ilike-popup'}, true, false);
		this.popupContentPagePlus = 1;	
		this.popupContentPageMinus = 1;	
		this.popupListProcess = false;	
		this.popupTimeout = false;	
	}
	
	this.voteProcess = false;
}

Rating.Set = function(voteId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile)
{
	if (template === undefined)
		template = 'standart';

	if (!BXRS[voteId] || BXRS[voteId].tryToSet <= 5)
	{
		var tryToSend = BXRS[voteId] && BXRS[voteId].tryToSet? BXRS[voteId].tryToSet: 1;
		BXRS[voteId] = new Rating(voteId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile);
		if (BXRS[voteId].enabled)
			Rating.Init(voteId);
		else
		{
			setTimeout(function(){
				BXRS[voteId].tryToSet = tryToSend+1;
				Rating.Set(voteId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile);
			}, 500);
		}
	}
};

Rating.Init = function(voteId)
{
	if (BXRS[voteId].available)
	{
		BX.bind(BXRS[voteId].light? BXRS[voteId].buttonPlusText: BXRS[voteId].buttonPlus, 'click' , function()	{
			if (BXRS[voteId].voteProcess)
				return false;
				
			BXRS[voteId].voteProcess = true;	
			BX.addClass(BXRS[voteId].buttonPlus, BXRS[voteId].light? 'bx-rating-load': 'rating-vote-load');
			if (BX.hasClass(BXRS[voteId].buttonPlus, BXRS[voteId].light? 'bx-rating-yes-active': 'rating-vote-plus-active'))
				Rating.Vote(voteId, 'plus', 'cancel');
			else
				Rating.Vote(voteId, 'plus', 'plus');

			return false;
		});
		
		BX.bind(BXRS[voteId].buttonPlus, 'mouseover', function() {BX.addClass(this, BXRS[voteId].light? 'bx-rating-hover': 'rating-vote-hover')});
		BX.bind(BXRS[voteId].buttonPlus, 'mouseout', function() {BX.removeClass(this, BXRS[voteId].light? 'bx-rating-hover': 'rating-vote-hover')});
		
		if (false && BXRS[voteId].light)
		{
			Rating.PopupScroll(voteId, 'plus');
			
			BX.bind(BXRS[voteId].buttonPlus, 'mouseover' , function() {
				clearTimeout(BXRS[voteId].popupTimeoutId);
				BXRS[voteId].popupTimeoutId = setTimeout(function(){
					if (BXRSW['plus'] == voteId)
						return false;
					if (BXRS[voteId].popupContentPagePlus == 1)
						Rating.List(voteId, 1, 'plus');
					BXRS[voteId].popupTimeoutId = setTimeout(function() {
						Rating.OpenWindow(voteId, 'plus');
					}, 1000);
				}, 400);
			});
			BX.bind(BXRS[voteId].buttonPlus, 'mouseout' , function() {
				clearTimeout(BXRS[voteId].popupTimeoutId);
				BXRS[voteId].popupTimeout = setTimeout(function(){
					if (BXRS[voteId].popupPlus !== null)
					{
						BXRS[voteId].popupPlus.close();
						BXRSW['plus'] = null;
					}
				}, 1000);
			});
			BX.bind(BXRS[voteId].buttonPlusCount, 'click' , function() {
				clearTimeout(BXRS[voteId].popupTimeoutId);	
				if (BXRS[voteId].popupContentPagePlus == 1)
					Rating.List(voteId, 1, 'plus');
				Rating.OpenWindow(voteId, 'plus');
			});
			BX.bind(BXRS[voteId].buttonPlusCount, 'mouseover' , function() {
				clearTimeout(BXRS[voteId].popupTimeout);
			});
			BX.bind(BXRS[voteId].buttonPlusText, 'mouseover' , function() {
				clearTimeout(BXRS[voteId].popupTimeout);
			});
		}
		
		BX.bind(BXRS[voteId].light? BXRS[voteId].buttonMinusText: BXRS[voteId].buttonMinus, 'click' , function() {
			if (BXRS[voteId].voteProcess)
				return false;
			
			BXRS[voteId].voteProcess = true;
			BX.addClass(BXRS[voteId].buttonMinus, BXRS[voteId].light? 'bx-rating-load': 'rating-vote-load');
			if (BX.hasClass(BXRS[voteId].buttonMinus, BXRS[voteId].light? 'bx-rating-no-active': 'rating-vote-minus-active'))
			{
				Rating.Vote(voteId, 'minus', 'cancel');
			}
			else
			{
				Rating.Vote(voteId, 'minus', 'minus');
			}
			return false;
		});
		
		BX.bind(BXRS[voteId].buttonMinus, 'mouseover', function() {BX.addClass(this, BXRS[voteId].light? 'bx-rating-hover': 'rating-vote-hover')});
		BX.bind(BXRS[voteId].buttonMinus, 'mouseout', function() {BX.removeClass(this, BXRS[voteId].light? 'bx-rating-hover': 'rating-vote-hover')});
		
		if (false && BXRS[voteId].light)
		{
			Rating.PopupScroll(voteId, 'minus');
			
			BX.bind(BXRS[voteId].buttonMinus, 'mouseover' , function() {
				clearTimeout(BXRS[voteId].popupTimeoutId);
				BXRS[voteId].popupTimeoutId = setTimeout(function(){
					if (BXRSW['minus'] == voteId)
						return false;
					if (BXRS[voteId].popupContentPageMinus == 1)
						Rating.List(voteId, 1, 'minus');
					BXRS[voteId].popupTimeoutId = setTimeout(function() {
						Rating.OpenWindow(voteId, 'minus');
					}, 1000);
				}, 400);
			});
			BX.bind(BXRS[voteId].buttonMinus, 'mouseout' , function() {
				clearTimeout(BXRS[voteId].popupTimeoutId);
				BXRS[voteId].popupTimeout = setTimeout(function(){
					if (BXRS[voteId].popupMinus !== null)
					{
						BXRS[voteId].popupMinus.close();
						BXRSW['minus'] = null;
					}
				}, 1000);
			});
			BX.bind(BXRS[voteId].buttonMinusCount, 'click' , function() {
				clearTimeout(BXRS[voteId].popupTimeoutId);	
				if (BXRS[voteId].popupContentPageMinus == 1)
					Rating.List(voteId, 1, 'minus');
				Rating.OpenWindow(voteId, 'minus');
			});
			BX.bind(BXRS[voteId].buttonMinusCount, 'mouseover' , function() {
				clearTimeout(BXRS[voteId].popupTimeout);
			});
			BX.bind(BXRS[voteId].buttonMinusText, 'mouseover' , function() {
				clearTimeout(BXRS[voteId].popupTimeout);
			});
		}
	}
}

Rating.UpdateStatus = function(voteId, button, action)
{
	BXRS[voteId].buttonPlus.title = (action == 'cancel' || button == 'minus' ? BXRS[voteId].localize['PLUS']: BXRS[voteId].localize['CANCEL']); 
	BXRS[voteId].buttonMinus.title = (action == 'cancel' || button == 'plus' ? BXRS[voteId].localize['MINUS']: BXRS[voteId].localize['CANCEL']); 				
	BX.removeClass(BXRS[voteId].buttonPlus, BXRS[voteId].light? (button == 'plus'? 'bx-rating-load': 'bx-rating-yes-active'): (button == 'plus'? 'rating-vote-load': 'rating-vote-plus-active'));
	BX.removeClass(BXRS[voteId].buttonMinus, BXRS[voteId].light? (button == 'plus'? 'bx-rating-no-active': 'bx-rating-load'): (button == 'plus'? 'rating-vote-minus-active': 'rating-vote-load'));	
	if (action == 'cancel')
		BX.removeClass(button == 'plus'? BXRS[voteId].buttonPlus: BXRS[voteId].buttonMinus, BXRS[voteId].light? 'bx-rating-'+(button == 'plus'? 'yes': 'no')+'-active': 'rating-vote-'+button+'-active');
	else
		BX.addClass(button == 'plus'? BXRS[voteId].buttonPlus: BXRS[voteId].buttonMinus, BXRS[voteId].light? 'bx-rating-'+(button == 'plus'? 'yes': 'no')+'-active': 'rating-vote-'+button+'-active');
}

Rating.Vote = function(voteId, button, action)
{
	BX.ajax({
		url: '/bitrix/components/bitrix/rating.vote/vote.ajax.php',
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE' : 'Y', 'RATING_RESULT' : 'Y', 'RATING_VOTE_TYPE_ID' : BXRS[voteId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRS[voteId].entityId, 'RATING_VOTE_ACTION' : action, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)
		{
			if (BXRS[voteId].light)
			{
				BXRS[voteId].buttonPlusCount.innerHTML = data['resultPositiveVotes'];
				BXRS[voteId].buttonMinusCount.innerHTML = data['resultNegativeVotes'];			
				if (data['action'] == 'cancel')
					BX.removeClass(BXRS[voteId].box, 'bx-rating-active');
				else
					BX.addClass(BXRS[voteId].box, 'bx-rating-active');
			}
			else
			{
				BXRS[voteId].result.title = data['resultTitle'];
				BXRS[voteId].result.innerHTML = data['resultValue'];
				BX.removeClass(BXRS[voteId].result, data['resultStatus'] == 'minus' ? 'rating-vote-result-plus' : 'rating-vote-result-minus');
				BX.addClass(BXRS[voteId].result, data['resultStatus'] == 'minus' ? 'rating-vote-result-minus' : 'rating-vote-result-plus');
			}
			
			Rating.UpdateStatus(voteId, button, action);
			BXRS[voteId].voteProcess = false;
		},
		onfailure: function(data)
		{
			BX.removeClass(button == 'minus' ? BXRS[voteId].buttonMinus : BXRS[voteId].buttonPlus,  BXRS[voteId].light? 'bx-rating-load': 'rating-vote-load');
		}
	});

	return false;
}

Rating.OpenWindow = function(voteId, action)
{
	if (parseInt(action == 'plus'? BXRS[voteId].buttonPlusCount.innerHTML: BXRS[voteId].buttonMinusCount.innerHTML) == 0)
		return false;
	
	if ((action == 'plus'? BXRS[voteId].popupPlus: BXRS[voteId].popupMinus) == null)	
	{
		__popup = new BX.PopupWindow('rating-popup-'+voteId+'-'+action, action == 'plus'? BXRS[voteId].buttonPlusCount: BXRS[voteId].buttonMinusCount, { 	content:BX('bx-rating-popup-cont-'+voteId+(action == 'plus'? '-plus': '-minus')), lightShadow:true, autoHide:true, zIndex: 2500 });			
		if (action == 'plus')
			BXRS[voteId].popupPlus = __popup;
		else
			BXRS[voteId].popupMinus = __popup;
			
		BX.bind(BX('rating-popup-'+voteId+'-'+action), 'mouseout' , function() {
			clearTimeout(BXRS[voteId].popupTimeout);
			BXRS[voteId].popupTimeout = setTimeout(function(){
				if (action == 'plus')
					BXRS[voteId].popupPlus.close();
				else
					BXRS[voteId].popupMinus.close();
				BXRSW[action] = null;
			}, 1000);		
		});
		
		BX.bind(BX('rating-popup-'+voteId+'-'+action), 'mouseover' , function() {
			clearTimeout(BXRS[voteId].popupTimeout);
		});
	}
	else if(BX('rating-popup-'+voteId+'-'+action).style.display == "block")
	{
		if (action == 'plus')
			BXRS[voteId].popupPlus.close();
		else
			BXRS[voteId].popupMinus.close();
		BXRSW[action] = null;
		return false
	}
	
	if (BXRSW['plus'] != null)
	{
		BXRS[BXRSW['plus']].popupPlus.close();
		BXRSW['plus'] = null;
	}
	if (BXRSW['minus'] != null)
	{
		BXRS[BXRSW['minus']].popupMinus.close();
		BXRSW['minus'] = null;
	}
	
	if (action == 'plus')
		BXRS[voteId].popupPlus.show();
	else
		BXRS[voteId].popupMinus.show();
	
	BXRSW = voteId;
	
	if (action == 'plus')
		BXRS[voteId].popupPlus.setAngle({	position:'bottom'	});
	else
		BXRS[voteId].popupMinus.setAngle({	position:'bottom'	});
		
	Rating.AdjustWindow(voteId, action);
}

Rating.List = function(voteId, page, action)
{
	if (parseInt(action == 'plus'? BXRS[voteId].buttonPlusCount.innerHTML: BXRS[voteId].buttonMinusCount.innerHTML) == 0)
		return false;
	
	if (page == null)
		page = action == 'plus'? BXRS[voteId].popupContentPagePlus: BXRS[voteId].popupContentPageMinus;
	
	BXRS[voteId].popupListProcess = true;
	BX.ajax({
		url: '/bitrix/components/bitrix/rating.vote/vote.ajax.php',
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE_LIST' : 'Y', 'RATING_VOTE_LIST_TYPE' : action, 'RATING_VOTE_TYPE_ID' : BXRS[voteId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRS[voteId].entityId, 'RATING_VOTE_LIST_PAGE' : page, 'PATH_TO_USER_PROFILE' : BXRS[voteId].pathToUserProfile, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)
		{
			//BXRS[voteId].buttonPlusCount.innerHTML = data.items_all;	
			
			if ( parseInt(data.items_page) == 0 )
				return false;
								
			if (page == 1)
			{
				spanTag0 = document.createElement("span"); 
				spanTag0.className = "bx-ilike-bottom_scroll";
				if (action == 'plus')
				{
					BXRS[voteId].popupContentPlus.innerHTML = '';
					BXRS[voteId].popupContentPlus.appendChild(spanTag0);
				}
				else
				{
					BXRS[voteId].popupContentMinus.innerHTML = '';
					BXRS[voteId].popupContentMinus.appendChild(spanTag0);
				}
			}
			if (action == 'plus')
				BXRS[voteId].popupContentPagePlus += 1;
			else
				BXRS[voteId].popupContentPageMinus += 1;

			for (var i in data.items) {					
				aTag = document.createElement("a"); 
				aTag.className = "bx-ilike-popup-img";
				aTag.href = data.items[i]['URL'];
				aTag.target = "_blank";
					
					spanTag1 = document.createElement("span"); 
					spanTag1.className = "bx-ilike-popup-avatar";
					spanTag1.innerHTML = data.items[i]['PHOTO'];
					aTag.appendChild(spanTag1);
					
					spanTag2 = document.createElement("span"); 
					spanTag2.className = "bx-ilike-popup-name";
					spanTag2.appendChild(document.createTextNode(BX.util.htmlspecialcharsback(data.items[i]['FULL_NAME'])));
					aTag.appendChild(spanTag2);
				if (action == 'plus')	
					BXRS[voteId].popupContentPlus.appendChild(aTag);	
				else
					BXRS[voteId].popupContentMinus.appendChild(aTag);	
			}

			Rating.AdjustWindow(voteId, action);
			Rating.PopupScroll(voteId, action);
			
			BXRS[voteId].popupListProcess = false;
		},	
		onfailure: function(data)	{} 
	});
	return false;
}

Rating.AdjustWindow = function(voteId, action)
{
	children = BX.findChild(action == 'plus'? BXRS[voteId].popupContentPlus: BXRS[voteId].popupContentMinus, {className:'bx-ilike-popup-img'}, true, true);
	if (children !== null)
	{
		iOffsetHeight = BX.browser.IsIE()? 5: 0;
		for (var i in children) {	
			iOffsetHeight += children[i].offsetHeight;
		}
	}
	else 
		iOffsetHeight = BX.browser.IsIE()? 35: 30;

	if (iOffsetHeight < 121)
		if (action == 'plus')	
			BXRS[voteId].popupContentPlus.style.height = iOffsetHeight+'px';
		else
			BXRS[voteId].popupContentMinus.style.height = iOffsetHeight+'px';
	else
		if (action == 'plus')	
			BXRS[voteId].popupContentPlus.style.height = '121px';
		else
			BXRS[voteId].popupContentMinus.style.height = '121px';

	var offsetTop = 5;
		
	arScroll = BX.GetWindowScrollPos();
	if (action == 'plus')
		iLeft = BXRS[voteId].popupPlus.bindElementPos.left-10;
	else
		iLeft = BXRS[voteId].popupMinus.bindElementPos.left-10;
		
	iLeftAngle = 0;
	if (action == 'plus')
		iWindow = iLeft+BXRS[voteId].popupPlus.popupContainer.offsetWidth;
	else
		iWindow = iLeft+BXRS[voteId].popupMinus.popupContainer.offsetWidth;
	
	iBody = document.body.clientWidth + arScroll.scrollLeft;
	
	if (iWindow>iBody)
	{
		iLeft = iLeft-(iWindow-iBody);
		if (action == 'plus')
			BXRS[voteId].popupPlus.setAngle({ offset : (iWindow-iBody)+iLeftAngle });
		else
			BXRS[voteId].popupMinus.setAngle({ offset : (iWindow-iBody)+iLeftAngle });
	} 
	else if (iLeft<0)
	{
		if (action == 'plus')
			BXRS[voteId].popupPlus.setAngle({ offset : (iLeft)+iLeftAngle });
		else
			BXRS[voteId].popupMinus.setAngle({ offset : (iLeft)+iLeftAngle });
		iLeft = 0;
	}
	if (action == 'plus')
		BX.adjust(BX('rating-popup-'+voteId+'-'+action), {style: {	top: BXRS[voteId].popupPlus.bindElementPos.top-(BXRS[voteId].popupPlus.popupContainer.offsetHeight+offsetTop) + "px",		left: iLeft+"px"	}});
	else
		BX.adjust(BX('rating-popup-'+voteId+'-'+action), {style: {	top: BXRS[voteId].popupMinus.bindElementPos.top-(BXRS[voteId].popupMinus.popupContainer.offsetHeight+offsetTop) + "px",		left: iLeft+"px"	}});
}

Rating.PopupScroll = function(voteId, action)
{
	BX.bind(action == 'plus'? BXRS[voteId].popupContentPlus: BXRS[voteId].popupContentMinus, 'scroll' , function() {
		if (this.scrollTop > (this.scrollHeight - this.offsetHeight) / 1.5)
		{
			Rating.List(voteId, null, action);
			BX.unbindAll(this);
		}
	});
}

/* End */
;
; /* Start:/bitrix/js/main/core/core_date.js*/
;(function(){

if (BX.date)
	return;

BX.date = {};


BX.date.format = function(format, timestamp, now, utc)
{
	/*
	PHP to Javascript:
		time() = new Date()
		mktime(...) = new Date(...)
		gmmktime(...) = new Date(Date.UTC(...))
		mktime(0,0,0, 1, 1, 1970) != 0          new Date(1970,0,1).getTime() != 0
		gmmktime(0,0,0, 1, 1, 1970) == 0        new Date(Date.UTC(1970,0,1)).getTime() == 0
		date("d.m.Y H:i:s") = BX.date.format("d.m.Y H:i:s")
		gmdate("d.m.Y H:i:s") = BX.date.format("d.m.Y H:i:s", null, null, true);
	*/
	var date = BX.type.isDate(timestamp) ? new Date(timestamp.getTime()) : BX.type.isNumber(timestamp) ? new Date(timestamp * 1000) : new Date();
	var nowDate = BX.type.isDate(now) ? new Date(now.getTime()) : BX.type.isNumber(now) ? new Date(now * 1000) : new Date();
	var isUTC = !!utc;

	if (BX.type.isArray(format))
		return _formatDateInterval(format, date, nowDate, isUTC);
	else if (!BX.type.isNotEmptyString(format))
		return "";

	var formatRegex = /\\?(sago|iago|isago|Hago|dago|mago|Yago|sdiff|idiff|Hdiff|ddiff|mdiff|Ydiff|yesterday|today|tommorow|[a-z])/gi;

	var dateFormats = {
		d : function() {
			// Day of the month 01 to 31
			return BX.util.str_pad_left(getDate(date).toString(), 2, "0");
		},

		D : function() {
			//Mon through Sun
			return BX.message("DOW_" + getDay(date));
		},

		j : function() {
			//Day of the month 1 to 31
			return getDate(date);
		},

		l : function() {
			//Sunday through Saturday
			return BX.message("DAY_OF_WEEK_" + getDay(date));
		},

		N : function() {
			//1 (for Monday) through 7 (for Sunday)
			return getDay(date) || 7;
		},

		S : function() {
			//st, nd, rd or th. Works well with j
			if (getDate(date) % 10 == 1 && getDate(date) != 11)
				return "st";
			else if (getDate(date) % 10 == 2 && getDate(date) != 12)
				return "nd";
			else if (getDate(date) % 10 == 3 && getDate(date) != 13)
				return "rd";
			else
				return "th";
		},

		w : function() {
			//0 (for Sunday) through 6 (for Saturday)
			return getDay(date);
		},

		z : function() {
			//0 through 365
			var firstDay = new Date(getFullYear(date), 0, 1);
			var currentDay = new Date(getFullYear(date), getMonth(date), getDate(date));
			return Math.ceil( (currentDay - firstDay) / (24 * 3600 * 1000) );
		},

		W : function() {
			//ISO-8601 week number of year
			var newDate  = new Date(date.getTime());
		    var dayNumber   = (getDay(date) + 6) % 7;
			setDate(newDate, getDate(newDate) - dayNumber + 3);
		    var firstThursday = newDate.getTime();
			setMonth(newDate, 0, 1);
		    if (getDay(newDate) != 4)
				setMonth(newDate, 0, 1 + ((4 - getDay(newDate)) + 7) % 7);
			var weekNumber = 1 + Math.ceil((firstThursday - newDate) / (7 * 24 * 3600 * 1000));
		    return BX.util.str_pad_left(weekNumber.toString(), 2, "0");
		},

		F : function() {
			//January through December
			return BX.message("MONTH_" + (getMonth(date) + 1) + "_S");
		},

		f : function() {
			//January through December
			return BX.message("MONTH_" + (getMonth(date) + 1));
		},

		m : function() {
			//Numeric representation of a month 01 through 12
			return BX.util.str_pad_left((getMonth(date) + 1).toString(), 2, "0");
		},

		M : function() {
			//A short textual representation of a month, three letters Jan through Dec
			return BX.message("MON_" + (getMonth(date) + 1));
		},

		n : function() {
			//Numeric representation of a month 1 through 12
			return getMonth(date) + 1;
		},

		t : function() {
			//Number of days in the given month 28 through 31
			var lastMonthDay = isUTC ? new Date(Date.UTC(getFullYear(date), getMonth(date) + 1, 0)) : new Date(getFullYear(date), getMonth(date) + 1, 0);
			return getDate(lastMonthDay);
		},

		L : function() {
			//1 if it is a leap year, 0 otherwise.
			var year = getFullYear(date);
			return (year % 4 == 0 && year % 100 != 0 || year % 400 == 0 ? 1 : 0);
		},

		o : function() {
			//ISO-8601 year number
			var correctDate  = new Date(date.getTime());
			setDate(correctDate, getDate(correctDate) - ((getDay(date) + 6) % 7) + 3);
   			return getFullYear(correctDate);
		},

		Y : function() {
			//A full numeric representation of a year, 4 digits
			return getFullYear(date);
		},

		y : function() {
			//A two digit representation of a year
			return getFullYear(date).toString().slice(2);
		},

		a : function() {
			//am or pm
			return getHours(date) > 11 ? "pm" : "am";
		},

		A : function() {
			//AM or PM
			return getHours(date) > 11 ? "PM" : "AM";
		},

		B : function() {
			//000 through 999
			var swatch = ((date.getUTCHours() + 1) % 24) + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
			return BX.util.str_pad_left(Math.floor(swatch * 1000 / 24).toString(), 3, "0");
		},

		g : function() {
			//12-hour format of an hour without leading zeros 1 through 12
			return getHours(date) % 12 || 12;
		},

		G : function() {
			//24-hour format of an hour without leading zeros 0 through 23
			return getHours(date);
		},

		h : function() {
			//12-hour format of an hour with leading zeros 01 through 12
			return BX.util.str_pad_left((getHours(date) % 12 || 12).toString(), 2, "0");
		},

		H : function() {
			//24-hour format of an hour with leading zeros 00 through 23
			return BX.util.str_pad_left(getHours(date).toString(), 2, "0");
		},

		i : function() {
			//Minutes with leading zeros 00 to 59
			return BX.util.str_pad_left(getMinutes(date).toString(), 2, "0");
		},

		s : function() {
			//Seconds, with leading zeros 00 through 59
			return BX.util.str_pad_left(getSeconds(date).toString(), 2, "0");
		},

		u : function() {
			//Microseconds
			return BX.util.str_pad_left((getMilliseconds(date) * 1000).toString(), 6, "0");
		},

		e : function() {
			if (isUTC)
				return "UTC";
			return "";
		},

		I : function() {
			if (isUTC)
				return 0;

			//Whether or not the date is in daylight saving time 1 if Daylight Saving Time, 0 otherwise
			var firstJanuary = new Date(getFullYear(date), 0, 1);
			var firstJanuaryUTC = Date.UTC(getFullYear(date), 0, 1);
			var firstJuly = new Date(getFullYear(date), 6, 0);
			var firstJulyUTC = Date.UTC(getFullYear(date), 6, 0);
			return 0 + ((firstJanuary - firstJanuaryUTC) !== (firstJuly - firstJulyUTC));
		},

		O : function() {
			if (isUTC)
				return "+0000";

			//Difference to Greenwich time (GMT) in hours +0200
			var timezoneOffset = date.getTimezoneOffset();
			var timezoneOffsetAbs = Math.abs(timezoneOffset);
			return (timezoneOffset > 0 ? "-" : "+") + BX.util.str_pad_left((Math.floor(timezoneOffsetAbs / 60) * 100 + timezoneOffsetAbs % 60).toString(), 4, "0");
		},

		P : function() {
			if (isUTC)
				return "+00:00";

			//Difference to Greenwich time (GMT) with colon between hours and minutes +02:00
			var difference = this.O();
			return difference.substr(0, 3) + ":" + difference.substr(3);
		},

		Z : function() {
			if (isUTC)
				return 0;
			//Timezone offset in seconds. The offset for timezones west of UTC is always negative,
			//and for those east of UTC is always positive.
			return -date.getTimezoneOffset() * 60;
		},

		c : function() {
			//ISO 8601 date
			return "Y-m-d\\TH:i:sP".replace(formatRegex, _replaceDateFormat);
		},

		r : function() {
			//RFC 2822 formatted date
			return "D, d M Y H:i:s O".replace(formatRegex, _replaceDateFormat);
		},

		U : function() {
			//Seconds since the Unix Epoch
			return Math.floor(date.getTime() / 1000);
		},

		sago : function() {
			return _formatDateMessage(intval((nowDate - date) / 1000), {
				"0" : "FD_SECOND_AGO_0",
				"1" : "FD_SECOND_AGO_1",
				"10_20" : "FD_SECOND_AGO_10_20",
				"MOD_1" : "FD_SECOND_AGO_MOD_1",
				"MOD_2_4" : "FD_SECOND_AGO_MOD_2_4",
				"MOD_OTHER" : "FD_SECOND_AGO_MOD_OTHER"
			});
		},

		sdiff : function() {
			return _formatDateMessage(intval((nowDate - date) / 1000), {
				"0" : "FD_SECOND_DIFF_0",
				"1" : "FD_SECOND_DIFF_1",
				"10_20" : "FD_SECOND_DIFF_10_20",
				"MOD_1" : "FD_SECOND_DIFF_MOD_1",
				"MOD_2_4" : "FD_SECOND_DIFF_MOD_2_4",
				"MOD_OTHER" : "FD_SECOND_DIFF_MOD_OTHER"
			});
		},

		iago : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 1000), {
				"0" : "FD_MINUTE_AGO_0",
				"1" : "FD_MINUTE_AGO_1",
				"10_20" : "FD_MINUTE_AGO_10_20",
				"MOD_1" : "FD_MINUTE_AGO_MOD_1",
				"MOD_2_4" : "FD_MINUTE_AGO_MOD_2_4",
				"MOD_OTHER" : "FD_MINUTE_AGO_MOD_OTHER"
			});
		},

		idiff : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 1000), {
				"0" : "FD_MINUTE_DIFF_0",
				"1" : "FD_MINUTE_DIFF_1",
				"10_20" : "FD_MINUTE_DIFF_10_20",
				"MOD_1" : "FD_MINUTE_DIFF_MOD_1",
				"MOD_2_4" : "FD_MINUTE_DIFF_MOD_2_4",
				"MOD_OTHER" : "FD_MINUTE_DIFF_MOD_OTHER"
			});
		},

		isago : function() {
			var minutesAgo = intval((nowDate - date) / 60 / 1000);
			var result = _formatDateMessage(minutesAgo, {
				"0" : "FD_MINUTE_0",
				"1" : "FD_MINUTE_1",
				"10_20" : "FD_MINUTE_10_20",
				"MOD_1" : "FD_MINUTE_MOD_1",
				"MOD_2_4" : "FD_MINUTE_MOD_2_4",
				"MOD_OTHER" : "FD_MINUTE_MOD_OTHER"
			});

			result += " ";

			var secondsAgo = intval((nowDate - date) / 1000) - (minutesAgo * 60);
			result += _formatDateMessage(secondsAgo, {
				"0" : "FD_SECOND_AGO_0",
				"1" : "FD_SECOND_AGO_1",
				"10_20" : "FD_SECOND_AGO_10_20",
				"MOD_1" : "FD_SECOND_AGO_MOD_1",
				"MOD_2_4" : "FD_SECOND_AGO_MOD_2_4",
				"MOD_OTHER" : "FD_SECOND_AGO_MOD_OTHER"
			});
			return result;
		},

		Hago : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 1000), {
				"0" : "FD_HOUR_AGO_0",
				"1" : "FD_HOUR_AGO_1",
				"10_20" : "FD_HOUR_AGO_10_20",
				"MOD_1" : "FD_HOUR_AGO_MOD_1",
				"MOD_2_4" : "FD_HOUR_AGO_MOD_2_4",
				"MOD_OTHER" : "FD_HOUR_AGO_MOD_OTHER"
			});
		},

		Hdiff : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 1000), {
				"0" : "FD_HOUR_DIFF_0",
				"1" : "FD_HOUR_DIFF_1",
				"10_20" : "FD_HOUR_DIFF_10_20",
				"MOD_1" : "FD_HOUR_DIFF_MOD_1",
				"MOD_2_4" : "FD_HOUR_DIFF_MOD_2_4",
				"MOD_OTHER" : "FD_HOUR_DIFF_MOD_OTHER"
			});
		},

		yesterday : function() {
			return BX.message("FD_YESTERDAY");
		},

		today : function() {
			return BX.message("FD_TODAY");
		},

		tommorow : function() {
			return BX.message("FD_TOMORROW");
		},

		dago : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 24 / 1000), {
				"0" : "FD_DAY_AGO_0",
				"1" : "FD_DAY_AGO_1",
				"10_20" : "FD_DAY_AGO_10_20",
				"MOD_1" : "FD_DAY_AGO_MOD_1",
				"MOD_2_4" : "FD_DAY_AGO_MOD_2_4",
				"MOD_OTHER" : "FD_DAY_AGO_MOD_OTHER"
			});
		},

		ddiff : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 24 / 1000), {
				"0" : "FD_DAY_DIFF_0",
				"1" : "FD_DAY_DIFF_1",
				"10_20" : "FD_DAY_DIFF_10_20",
				"MOD_1" : "FD_DAY_DIFF_MOD_1",
				"MOD_2_4" : "FD_DAY_DIFF_MOD_2_4",
				"MOD_OTHER" : "FD_DAY_DIFF_MOD_OTHER"
			});
		},

		mago : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 24 / 31 / 1000), {
				"0" : "FD_MONTH_AGO_0",
				"1" : "FD_MONTH_AGO_1",
				"10_20" : "FD_MONTH_AGO_10_20",
				"MOD_1" : "FD_MONTH_AGO_MOD_1",
				"MOD_2_4" : "FD_MONTH_AGO_MOD_2_4",
				"MOD_OTHER" : "FD_MONTH_AGO_MOD_OTHER"
			});
		},

		mdiff : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 24 / 31 / 1000), {
				"0" : "FD_MONTH_DIFF_0",
				"1" : "FD_MONTH_DIFF_1",
				"10_20" : "FD_MONTH_DIFF_10_20",
				"MOD_1" : "FD_MONTH_DIFF_MOD_1",
				"MOD_2_4" : "FD_MONTH_DIFF_MOD_2_4",
				"MOD_OTHER" : "FD_MONTH_DIFF_MOD_OTHER"
			});
		},

		Yago : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 24 / 365 / 1000), {
				"0" : "FD_YEARS_AGO_0",
				"1" : "FD_YEARS_AGO_1",
				"10_20" : "FD_YEARS_AGO_10_20",
				"MOD_1" : "FD_YEARS_AGO_MOD_1",
				"MOD_2_4" : "FD_YEARS_AGO_MOD_2_4",
				"MOD_OTHER" : "FD_YEARS_AGO_MOD_OTHER"
			});
		},

		Ydiff : function() {
			return _formatDateMessage(intval((nowDate - date) / 60 / 60 / 24 / 365 / 1000), {
				"0" : "FD_YEARS_DIFF_0",
				"1" : "FD_YEARS_DIFF_1",
				"10_20" : "FD_YEARS_DIFF_10_20",
				"MOD_1" : "FD_YEARS_DIFF_MOD_1",
				"MOD_2_4" : "FD_YEARS_DIFF_MOD_2_4",
				"MOD_OTHER" : "FD_YEARS_DIFF_MOD_OTHER"
			});
		},

		x : function() {
			return BX.date.format([
				["tommorow", "tommorow, H:i"],
				["-", BX.date.convertBitrixFormat(BX.message("FORMAT_DATETIME")).replace(/:s$/g, "")],
				["s", "sago"],
				["i", "iago"],
				["today", "today, H:i"],
				["yesterday", "yesterday, H:i"],
				["", BX.date.convertBitrixFormat(BX.message("FORMAT_DATETIME")).replace(/:s$/g, "")]
			], date, nowDate, isUTC);
		},

		X : function() {
			var day = BX.date.format([
				["tommorow", "tommorow"],
				["-", BX.date.convertBitrixFormat(BX.message("FORMAT_DATE"))],
				["today", "today"],
				["yesterday", "yesterday"],
				["", BX.date.convertBitrixFormat(BX.message("FORMAT_DATE"))]
			], date, nowDate, isUTC);

			var time = BX.date.format([
				["tommorow", "H:i"],
				["today", "H:i"],
				["yesterday", "H:i"],
				["", ""]
			], date, nowDate, isUTC);

			if (time.length > 0)
				return BX.message("FD_DAY_AT_TIME").replace(/#DAY#/g, day).replace(/#TIME#/g, time);
			else
				return day;
		},

		Q : function() {
			var daysAgo = intval((nowDate - date) / 60 / 60 / 24 / 1000);
			if(daysAgo == 0)
				return BX.message("FD_DAY_DIFF_1").replace(/#VALUE#/g, 1);
			else
				return BX.date.format([ ["d", "ddiff"], ["m", "mdiff"], ["", "Ydiff"] ], date, nowDate);
		}
	};

	var cutZeroTime = false;
	if (format[0] && format[0] == "^")
	{
		cutZeroTime = true;
		format = format.substr(1);
	}

	var result = format.replace(formatRegex, _replaceDateFormat);

	if (cutZeroTime)
	{
		/* 	15.04.12 13:00:00 => 15.04.12 13:00
			00:01:00 => 00:01
			4 may 00:00:00 => 4 may
			01-01-12 00:00 => 01-01-12
		*/

		result = result.replace(/\s*00:00:00\s*/g, "").
						replace(/(\d\d:\d\d)(:00)/g, "$1").
						replace(/(\s*00:00\s*)(?!:)/g, "");
	}

	return result;

	function _formatDateInterval(formats, date, nowDate, isUTC)
	{
		var secondsAgo = intval((nowDate - date) / 1000);
		for (var i = 0; i < formats.length; i++)
		{
			var formatInterval = formats[i][0];
			var formatValue = formats[i][1];
			var match = null;
			if (formatInterval == "s")
			{
				if (secondsAgo < 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if ((match = /^s(\d+)/.exec(formatInterval)) != null)
			{
				if (secondsAgo < match[1])
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "i")
			{
				if (secondsAgo < 60 * 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if ((match = /^i(\d+)/.exec(formatInterval)) != null)
			{
				if (secondsAgo < match[1]*60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "H")
			{
				if (secondsAgo < 24 * 60 * 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if ((match = /^H(\d+)/.exec(formatInterval)) != null)
			{
				if (secondsAgo < match[1] * 60 * 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "d")
			{
				if (secondsAgo < 31 *24 * 60 * 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if ((match = /^d(\d+)/.exec(formatInterval)) != null)
			{
				if (secondsAgo < match[1] * 60 * 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "m")
			{
				if (secondsAgo < 365 * 24 * 60 * 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if ((match = /^m(\d+)/.exec(formatInterval)) != null)
			{
				if (secondsAgo < match[1] * 31 * 24 * 60 * 60)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "today")
			{
				var year = getFullYear(nowDate), month = getMonth(nowDate), day = getDate(nowDate);
				var todayStart = isUTC ? new Date(Date.UTC(year, month, day, 0, 0, 0, 0)) : new Date(year, month, day, 0, 0, 0, 0);
				var todayEnd = isUTC ? new Date(Date.UTC(year, month, day+1, 0, 0, 0, 0)) : new Date(year, month, day+1, 0, 0, 0, 0);
				if (date >= todayStart && date < todayEnd)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "yesterday")
			{
				year = getFullYear(nowDate); month = getMonth(nowDate); day = getDate(nowDate);
				var yesterdayStart = isUTC ? new Date(Date.UTC(year, month, day-1, 0, 0, 0, 0)) : new Date(year, month, day-1, 0, 0, 0, 0);
				var yesterdayEnd = isUTC ? new Date(Date.UTC(year, month, day, 0, 0, 0, 0)) : new Date(year, month, day, 0, 0, 0, 0);
				if (date >= yesterdayStart && date < yesterdayEnd)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "tommorow")
			{
				year = getFullYear(nowDate); month = getMonth(nowDate); day = getDate(nowDate);
				var tommorowStart = isUTC ? new Date(Date.UTC(year, month, day+1, 0, 0, 0, 0)) : new Date(year, month, day+1, 0, 0, 0, 0);
				var tommorowEnd = isUTC ? new Date(Date.UTC(year, month, day+2, 0, 0, 0, 0)) : new Date(year, month, day+2, 0, 0, 0, 0);
				if (date >= tommorowStart && date < tommorowEnd)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
			else if (formatInterval == "-")
			{
				if (secondsAgo < 0)
					return BX.date.format(formatValue, date, nowDate, isUTC);
			}
		}

		return formats.length > 0 ? BX.date.format(formats.pop()[1], date, nowDate, isUTC) : "";
	}


	function getFullYear(date) { return isUTC ? date.getUTCFullYear() : date.getFullYear(); }
	function getDate(date) { return isUTC ? date.getUTCDate() : date.getDate(); }
	function getMonth(date) { return isUTC ? date.getUTCMonth() : date.getMonth(); }
	function getHours(date) { return isUTC ? date.getUTCHours() : date.getHours(); }
	function getMinutes(date) { return isUTC ? date.getUTCMinutes() : date.getMinutes(); }
	function getSeconds(date) { return isUTC ? date.getUTCSeconds() : date.getSeconds(); }
	function getMilliseconds(date) { return isUTC ? date.getUTCMilliseconds() : date.getMilliseconds(); }
	function getDay(date) { return isUTC ? date.getUTCDay() : date.getDay(); }
	function setDate(date, dayValue) { return isUTC ? date.setUTCDate(dayValue) : date.setDate(dayValue); }
	function setMonth(date, monthValue, dayValue) { return isUTC ? date.setUTCMonth(monthValue, dayValue) : date.setMonth(monthValue, dayValue); }

	function _formatDateMessage(value, messages)
	{
		var val = value < 100 ? Math.abs(value) : Math.abs(value % 100);
		var dec = val % 10;
		var message = "";

		if(val == 0)
			message = BX.message(messages["0"]);
		else if (val == 1)
			message = BX.message(messages["1"]);
		else if (val >= 10 && val <= 20)
			message = BX.message(messages["10_20"]);
		else if (dec == 1)
			message = BX.message(messages["MOD_1"]);
		else if (2 <= dec && dec <= 4)
			message = BX.message(messages["MOD_2_4"]);
		else
			message = BX.message(messages["MOD_OTHER"]);

		return message.replace(/#VALUE#/g, value);
	}

	function _replaceDateFormat(match, matchFull)
	{
		if (dateFormats[match])
			return dateFormats[match]();
		else
			return matchFull;
	}

	function intval(number)
	{
		return number >= 0 ? Math.floor(number) : Math.ceil(number);
	}
};

BX.date.convertBitrixFormat = function(format)
{
	if (!BX.type.isNotEmptyString(format))
		return "";

	return format.replace("YYYY", "Y")	// 1999
				 .replace("MMMM", "F")	// January - December
				 .replace("MM", "m")	// 01 - 12
				 .replace("M", "M")	// Jan - Dec
				 .replace("DD", "d")	// 01 - 31
				 .replace("G", "g")	//  1 - 12
				 .replace(/GG/i, "G")	//  0 - 23
				 .replace("H", "h")	// 01 - 12
				 .replace(/HH/i, "H")	// 00 - 24
				 .replace("MI", "i")	// 00 - 59
				 .replace("SS", "s")	// 00 - 59
				 .replace("TT", "A")	// AM - PM
				 .replace("T", "a");	// am - pm
};

BX.date.convertToUTC = function(date)
{
	if (!BX.type.isDate(date))
		return null;
	return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
};

/*
 function creates and returns Javascript Date() object from server timestamp regardless of local browser (system) timezone.
 For example can be used to convert timestamp from some exact date on server to the JS Date object with the same value.

 params: {
 timestamp: timestamp in seconds
 }
 */
BX.date.getNewDate = function(timestamp)
{
	return new Date(BX.date.getBrowserTimestamp(timestamp));
};

/*
 function transforms server timestamp (in sec) to javascript timestamp (calculated depend on local browser timezone offset). Returns timestamp in milliseconds.
 Also see BX.date.getNewDate description.

 params: {
 timestamp: timestamp in seconds
 }
 */
BX.date.getBrowserTimestamp = function(timestamp)
{
	if (this._browserOffset == undefined)
		this._browserOffset = new Date().getTimezoneOffset() * 60;
	return (parseInt(timestamp, 10) + parseInt(BX.message('SERVER_TZ_OFFSET')) + this._browserOffset) * 1000;
};

/*
 function transforms local browser timestamp (in ms) to server timestamp (calculated depend on local browser timezone offset). Returns timestamp in seconds.

 params: {
 timestamp: timestamp in milliseconds
 }
 */
BX.date.getServerTimestamp = function(timestamp)
{
	if (this._browserOffset == undefined)
		this._browserOffset = new Date().getTimezoneOffset() * 60;

	return Math.round(timestamp / 1000 - (parseInt(BX.message('SERVER_TZ_OFFSET'), 10) + parseInt(this._browserOffset, 10)));
}

/************************************** calendar class **********************************/

var obCalendarSingleton = null;

/*
params: {
	node: bind element || document.body

	value - start value in site format (using 'field' param if 'value' does not exist)
	callback - date check handler. can return false to prevent calendar closing.
	callback_after - another handler, called after date picking

	field - field to read/write data

	bTime = true - whether to enable time control
	bHideTime = false - whether to hide time control by default

	currentTime - current UTC time()

}
*/


BX.calendar = function(params)
{
	return BX.calendar.get().Show(params);
}

BX.calendar.get = function()
{
	if (!obCalendarSingleton)
		obCalendarSingleton = new BX.JCCalendar();

	return obCalendarSingleton;
}

// simple func for compatibility with the oldies
BX.calendar.InsertDaysBack = function(input, days)
{
	if (days != '')
	{
		var d = new Date();
		if(days > 0)
		{
			d.setTime(d.valueOf() - days*86400000);
		}

		input.value = BX.date.format(BX.date.convertBitrixFormat(BX.message('FORMAT_DATE')), d, null);
	}
	else
	{
		input.value = '';
	}
}

BX.calendar.ValueToString = function(value, bTime, bUTC)
{
	return BX.date.format(
		BX.date.convertBitrixFormat(BX.message(bTime ? 'FORMAT_DATETIME' : 'FORMAT_DATE')),
		value,
		null,
		!!bUTC
	);
}


BX.CalendarPeriod =
{
	Init: function(inputFrom, inputTo, selPeriod)
	{
		if((inputFrom.value != "" || inputTo.value != "") && selPeriod.value == "")
			selPeriod.value = "interval";

		selPeriod.onchange();
	},

	ChangeDirectOpts: function(peroidValue, selPParent) // "week" || "others"
	{
		var selDirect = BX.findChild(selPParent, {'className':'adm-select adm-calendar-direction'}, true);

		if(peroidValue == "week")
		{
			selDirect.options[0].text = BX.message('JSADM_CALEND_PREV_WEEK');
			selDirect.options[1].text = BX.message('JSADM_CALEND_CURR_WEEK');
			selDirect.options[2].text = BX.message('JSADM_CALEND_NEXT_WEEK');
		}
		else
		{
			selDirect.options[0].text = BX.message('JSADM_CALEND_PREV');
			selDirect.options[1].text = BX.message('JSADM_CALEND_CURR');
			selDirect.options[2].text = BX.message('JSADM_CALEND_NEXT');
		}
	},

	SaveAndClearInput: function(oInput)
	{
		if(!window.SavedPeriodValues)
			window.SavedPeriodValues = {};

		window.SavedPeriodValues[oInput.id] = oInput.value;
		oInput.value="";
	},

	RestoreInput: function(oInput)
	{
		if(!window.SavedPeriodValues || !window.SavedPeriodValues[oInput.id])
			return;

		oInput.value = window.SavedPeriodValues[oInput.id];
		delete(window.SavedPeriodValues[oInput.id]);
	},

	OnChangeP: function(sel)
	{
		var selPParent = sel.parentNode.parentNode;
		var bShowFrom = bShowTo = bShowDirect = bShowSeparate = false;

		var inputFromWrap = BX.findChild(selPParent, {'className':'adm-input-wrap adm-calendar-inp adm-calendar-first'});
		var inputToWrap = BX.findChild(selPParent, {'className':'adm-input-wrap adm-calendar-second'});
		var selDirectWrap = BX.findChild(selPParent, {'className':'adm-select-wrap adm-calendar-direction'});
		var separator = BX.findChild(selPParent, {'className':'adm-calendar-separate'});
		var inputFrom = BX.findChild(selPParent, {'className':'adm-input adm-calendar-from'},true);
		var inputTo = BX.findChild(selPParent, {'className':'adm-input adm-calendar-to'},true);

		// define who must be shown
		switch (sel.value)
		{
			case "day":
			case "week":
			case "month":
			case "quarter":
			case "year":
				bShowDirect=true;
				BX.CalendarPeriod.OnChangeD(selDirectWrap.children[0]);
				break;

			case "before":
				bShowTo = true;
				break;

			case "after":
				bShowFrom = true;
				break;

			case "exact":
				bShowFrom= true;
				break;

			case "interval":
				bShowFrom = bShowTo = bShowSeparate = true;
				BX.CalendarPeriod.RestoreInput(inputFrom);
				BX.CalendarPeriod.RestoreInput(inputTo);

				break;

			case "":
				BX.CalendarPeriod.SaveAndClearInput(inputFrom);
				BX.CalendarPeriod.SaveAndClearInput(inputTo);
				break;

			default:
				break;

		}

		BX.CalendarPeriod.ChangeDirectOpts(sel.value, selPParent);

		inputFromWrap.style.display = (bShowFrom? 'inline-block':'none');
		inputToWrap.style.display = (bShowTo? 'inline-block':'none');
		selDirectWrap.style.display = (bShowDirect? 'inline-block':'none');
		separator.style.display = (bShowSeparate? 'inline-block':'none');
	},


	OnChangeD: function(sel)
	{
		var selPParent = sel.parentNode.parentNode;
		var inputFrom = BX.findChild(selPParent, {'className':'adm-input adm-calendar-from'},true);
		var inputTo = BX.findChild(selPParent, {'className':'adm-input adm-calendar-to'},true);
		var selPeriod = BX.findChild(selPParent, {'className':'adm-select adm-calendar-period'},true);

		var offset=0;

		switch (sel.value)
		{
			case "previous":
				offset = -1;
				break;

			case "next":
				offset = 1;
				break;

			case "current":
			default:
				break;

		}

		var from = false;
		var to = false;

		var today = new Date();
		var year = today.getFullYear();
		var month = today.getMonth();
		var day = today.getDate();
		var dayW = today.getDay();

		if (dayW == 0)
				dayW = 7;

		switch (selPeriod.value)
		{
			case "day":
				from = new Date(year, month, day+offset, 0, 0, 0);
				to = new Date(year, month, day+offset, 23, 59, 59);
				break;

			case "week":
				from = new Date(year, month, day-dayW+1+offset*7, 0, 0, 0);
				to = new Date(year, month, day+(7-dayW)+offset*7, 23, 59, 59);
				break;

			case "month":
				from = new Date(year, month+offset, 1, 0, 0, 0);
				to = new Date(year, month+1+offset, 0, 23, 59, 59);
				break;

			case "quarter":
				var quarterNum = Math.floor((month/3))+offset;
				from = new Date(year, 3*(quarterNum), 1, 0, 0, 0);
				to = new Date(year, 3*(quarterNum+1), 0, 23, 59, 59);
				break;

			case "year":
				from = new Date(year+offset, 0, 1, 0, 0, 0);
				to = new Date(year+1+offset, 0, 0, 23, 59, 59);
				break;

			default:
				break;
		}

		var format = window[inputFrom.name+"_bTime"] ? BX.message('FORMAT_DATETIME') : BX.message('FORMAT_DATE');

		if(from)
		{
			inputFrom.value = BX.formatDate(from, format);
			BX.addClass(inputFrom,"adm-calendar-inp-setted");
		}

		if(to)
		{
			inputTo.value = BX.formatDate(to, format);
			BX.addClass(inputTo,"adm-calendar-inp-setted");
		}
	}
}


BX.JCCalendar = function()
{
	this.params = {};

	this.bAmPm = BX.isAmPmMode();

	this.popup = null;
	this.popup_month = null;
	this.popup_year = null;

	this.value = null;

	this.control_id = Math.random();

	this._layers = {};
	this._current_layer = null;

	this.DIV = null;
	this.PARTS = {};

	this.weekStart = 0;
	this.numRows = 6;

	this._create = function(params)
	{
		this.popup = new BX.PopupWindow('calendar_popup_' + this.control_id, params.node, {
			closeByEsc: true,
			autoHide: false,
			content: this._get_content(),
			zIndex: 3000,
			bindOptions: {forceBindPosition: true}
		});

		BX.bind(this.popup.popupContainer, 'click', this.popup.cancelBubble);
	};

	this._auto_hide_disable = function()
	{
		BX.unbind(document, 'click', BX.proxy(this._auto_hide, this));
	}

	this._auto_hide_enable = function()
	{
		BX.bind(document, 'click', BX.proxy(this._auto_hide, this));
	}

	this._auto_hide = function(e)
	{
		this._auto_hide_disable();
		this.popup.close();
	}

	this._get_content = function()
	{
		var _layer_onclick = BX.delegate(function(e) {
			e = e||window.event;
			this.SetDate(new Date(parseInt(BX.proxy_context.getAttribute('data-date'))), e.type=='dblclick')
		}, this);

		this.DIV = BX.create('DIV', {
			props: {className: 'bx-calendar'},
			children: [
				BX.create('DIV', {
					props: {
						className: 'bx-calendar-header'
					},
					children: [
						BX.create('A', {
							attrs: {href: 'javascript:void(0)'},
							props: {className: 'bx-calendar-left-arrow'},
							events: {click: BX.proxy(this._prev, this)}
						}),

						BX.create('SPAN', {
							props: {className: 'bx-calendar-header-content'},
							children: [
								(this.PARTS.MONTH = BX.create('A', {
									attrs: {href: 'javascript:void(0)'},
									props: {className: 'bx-calendar-top-month'},
									events: {click: BX.proxy(this._menu_month, this)}
								})),

								(this.PARTS.YEAR = BX.create('A', {
									attrs: {href: 'javascript:void(0)'},
									props: {className: 'bx-calendar-top-year'},
									events: {click: BX.proxy(this._menu_year, this)}
								}))
							]
						}),

						BX.create('A', {
							attrs: {href: 'javascript:void(0)'},
							props: {className: 'bx-calendar-right-arrow'},
							events: {click: BX.proxy(this._next, this)}
						})
					]
				}),

				(this.PARTS.WEEK = BX.create('DIV', {
					props: {
						className: 'bx-calendar-name-day-wrap'
					}
				})),

				(this.PARTS.LAYERS = BX.create('DIV', {
					props: {
						className: 'bx-calendar-cell-block'
					},
					events: {
						click: BX.delegateEvent({className: 'bx-calendar-cell'}, _layer_onclick),
						dblclick: BX.delegateEvent({className: 'bx-calendar-cell'}, _layer_onclick)
					}
				})),

				(this.PARTS.TIME = BX.create('DIV', {
					props: {
						className: 'bx-calendar-set-time-wrap'
					},
					events: {
						click: BX.delegateEvent(
							{attr: 'data-action'},
							BX.delegate(this._time_actions, this)
						)
					},
					html: '<a href="javascript:void(0)" data-action="time_show" class="bx-calendar-set-time"><i></i>'+BX.message('CAL_TIME_SET')+'</a><div class="bx-calendar-form-block"><span class="bx-calendar-form-text">'+BX.message('CAL_TIME')+'</span><span class="bx-calendar-form"><input type="text" class="bx-calendar-form-input" maxwidth="2" onkeyup="BX.calendar.get()._check_time()" /><span class="bx-calendar-form-separator"></span><input type="text" class="bx-calendar-form-input" maxwidth="2" onkeyup="BX.calendar.get()._check_time()" />'+(this.bAmPm?'<span class="bx-calendar-AM-PM-block"><span class="bx-calendar-AM-PM-text" data-action="time_ampm"></span><span class="bx-calendar-form-arrow-r"><a href="javascript:void(0)" class="bx-calendar-form-arrow-top" data-action="time_ampm_up"><i></i></a><a href="javascript:void(0)" class="bx-calendar-form-arrow-bottom" data-action="time_ampm_down"><i></i></a></span></span>':'')+'</span><a href="javascript:void(0)" data-action="time_hide" class="bx-calendar-form-close"><i></i></a></div>'
				})),

				BX.create('DIV', {
					props: {className: 'bx-calendar-button-block'},
					events: {
						click: BX.delegateEvent(
							{attr: 'data-action'},
							BX.delegate(this._button_actions, this)
						)
					},
					html: '<a href="javascript:void(0)" class="bx-calendar-button bx-calendar-button-select" data-action="submit"><span class="bx-calendar-button-left"></span><span class="bx-calendar-button-text">'+BX.message('CAL_BUTTON')+'</span><span class="bx-calendar-button-right"></span></a><a href="javascript:void(0)" class="bx-calendar-button bx-calendar-button-cancel" data-action="cancel"><span class="bx-calendar-button-left"></span><span class="bx-calendar-button-text">'+BX.message('JS_CORE_WINDOW_CLOSE')+'</span><span class="bx-calendar-button-right"></span></a>'
				})
			]
		});

		this.PARTS.TIME_INPUT_H = BX.findChild(this.PARTS.TIME, {tag: 'INPUT'}, true);
		this.PARTS.TIME_INPUT_M = this.PARTS.TIME_INPUT_H.nextSibling.nextSibling;

		if (this.bAmPm)
			this.PARTS.TIME_AMPM = this.PARTS.TIME_INPUT_M.nextSibling.firstChild;

		var spinner = (new BX.JCSpinner({
			input: this.PARTS.TIME_INPUT_H,
			callback_change: BX.proxy(this._check_time, this),
			bSaveValue: false
		})).Show();
		spinner.className = 'bx-calendar-form-arrow-l';
		this.PARTS.TIME_INPUT_H.parentNode.insertBefore(spinner, this.PARTS.TIME_INPUT_H);

		spinner = (new BX.JCSpinner({
			input: this.PARTS.TIME_INPUT_M,
			callback_change: BX.proxy(this._check_time, this),
			bSaveValue: true
		})).Show();
		spinner.className = 'bx-calendar-form-arrow-r';
		if (!this.PARTS.TIME_INPUT_M.nextSibling)
			this.PARTS.TIME_INPUT_M.parentNode.appendChild(spinner);
		else
			this.PARTS.TIME_INPUT_M.parentNode.insertBefore(spinner, this.PARTS.TIME_INPUT_M.nextSibling);

		for (var i = 0; i < 7; i++)
		{
			this.PARTS.WEEK.appendChild(BX.create('SPAN', {
				props: {
					className: 'bx-calendar-name-day'
				},
				text: BX.message('DOW_' + ((i + this.weekStart) % 7))
			}));
		}

		return this.DIV;
	};

	this._time_actions = function()
	{
		var v;
		switch (BX.proxy_context.getAttribute('data-action'))
		{
			case 'time_show':
				BX.addClass(this.PARTS.TIME, 'bx-calendar-set-time-opened');
				this.popup.adjustPosition();
			break;
			case 'time_hide':
				BX.removeClass(this.PARTS.TIME, 'bx-calendar-set-time-opened');
				this.popup.adjustPosition();
			break;
			case 'time_ampm':
				this.PARTS.TIME_AMPM.innerHTML = this.PARTS.TIME_AMPM.innerHTML == 'AM' ? 'PM' : 'AM';
			break;
			case 'time_ampm_up':
				this._check_time({bSaveValue: false}, null, 12);
				return;
			break;
			case 'time_ampm_down':
				this._check_time({bSaveValue: false}, null, -12);
				return;
			break;
		}

		this._check_time();
	};

	this._button_actions = function()
	{
		switch (BX.proxy_context.getAttribute('data-action'))
		{
			case 'submit':
				this.SaveValue();
			break;
			case 'cancel':
				this.Close();
			break;
		}
	};

	this._check_time = function(params, value, direction)
	{
		var h = parseInt(this.PARTS.TIME_INPUT_H.value.substring(0,5),10)||0,
			m = parseInt(this.PARTS.TIME_INPUT_M.value.substring(0,5),10)||0,
			bChanged = false;

		if (!!params && !params.bSaveValue)
		{
			this.value.setHours(this.value.getHours() + direction);
		}
		else if (!isNaN(h))
		{
			if (this.bAmPm)
			{
				if (h != 12 && this.PARTS.TIME_AMPM.innerHTML == 'PM')
				{
					h += 12;
				}
			}

			bChanged = true;
			this.value.setHours(h);
		}

		if (!isNaN(m))
		{
			bChanged = true;
			this.value.setMinutes(m);
		}

		if (bChanged)
		{
			this.SetValue(this.value);
		}
	};

	this._set_layer = function()
	{
		var layerId = parseInt(this.value.getFullYear() + '' + BX.util.str_pad_left(this.value.getMonth()+'', 2, "0"));

		if (!this._layers[layerId])
		{
			this._layers[layerId] = this._create_layer();
			this._layers[layerId].BXLAYERID = layerId;
		}

		if (this._current_layer)
		{
			var v = new Date(this.value.valueOf());
			v.setHours(0); v.setMinutes(0);

			var cur_value = BX.findChild(this._layers[layerId], {
					tag: 'A',
					className: 'bx-calendar-active'
				}, true),
				new_value = BX.findChild(this._layers[layerId], {
					tag: 'A',
					attr: {
						'data-date' : v.valueOf() + ''
					}
				}, true);

			if (cur_value)
			{
				BX.removeClass(cur_value, 'bx-calendar-active');
			}

			if (new_value)
			{
				BX.addClass(new_value, 'bx-calendar-active');
			}

			this._replace_layer(this._current_layer, this._layers[layerId]);
		}
		else
		{
			this.PARTS.LAYERS.appendChild(this._layers[layerId]);
		}

		this._current_layer = this._layers[layerId];
	};

	this._replace_layer = function(old_layer, new_layer)
	{
		if (old_layer != new_layer)
		{
			if (!BX.browser.IsIE() || BX.browser.IsDoctype())
			{
				var dir = old_layer.BXLAYERID > new_layer.BXLAYERID ? 1 : -1;

				var old_top = 0;
					new_top = -dir * old_layer.offsetHeight;

				old_layer.style.position = 'relative';
				old_layer.style.top = "0px";
				old_layer.style.zIndex = 5;

				new_layer.style.position = 'absolute';
				new_layer.style.top = new_top + 'px';
				new_layer.style.zIndex = 6;

				this.PARTS.LAYERS.appendChild(new_layer);

				var delta = 15;

				var f
				(f = function() {
					new_top += dir * delta;
					old_top += dir * delta;

					if (dir * new_top < 0)
					{
						old_layer.style.top = old_top + 'px';
						new_layer.style.top = new_top + 'px';
						setTimeout(f, 10);
					}
					else
					{
						old_layer.parentNode.removeChild(old_layer);

						new_layer.style.top = "0px";
						new_layer.style.position = 'static';
						new_layer.style.zIndex = 0;
					}
				})();
			}
			else
			{
				this.PARTS.LAYERS.replaceChild(new_layer, old_layer);
			}
		}
	};

	this._create_layer = function()
	{
		var l = BX.create('DIV', {
			props: {
				className: 'bx-calendar-layer'
			}
		});

		var month_start = new Date(this.value);
		month_start.setHours(0);
		month_start.setMinutes(0);

		month_start.setDate(1);

		if (month_start.getDay() != this.weekStart)
		{
			var d = month_start.getDay() - this.weekStart;
			d += d < 0 ? 7 : 0;
			month_start = new Date(month_start.valueOf()-86400000*d);
		}

		var cur_month = this.value.getMonth(),
			cur_day = this.value.getDate(),
			s = '';
		for (var i = 0; i < this.numRows; i++)
		{
			s += '<div class="bx-calendar-range'
				+(i == this.numRows-1 ? ' bx-calendar-range-noline' : '')
				+'">';

			for (var j = 0; j < 7; j++)
			{
				var d = month_start.getDate(),
					wd = month_start.getDay(),
					className = 'bx-calendar-cell';
				if (cur_month != month_start.getMonth())
					className += ' bx-calendar-date-hidden';
				else if (cur_day == d)
					className += ' bx-calendar-active';


				if (wd == 0 || wd == 6)
					className += ' bx-calendar-weekend';

				s += '<a href="javascript:void(0)" class="'+className+'" data-date="' + month_start.valueOf() + '">' + d + '</a>';
				month_start = new Date(month_start.valueOf()+86400000);
			}
			s += '</div>';
		}

		l.innerHTML = s;

		return l;
	}

	this._prev = function()
	{
		this.SetMonth(this.value.getMonth()-1);
	};

	this._next = function()
	{
		this.SetMonth(this.value.getMonth()+1);
	};

	this._menu_month_content = function()
	{
		var months = '', cur_month = this.value.getMonth(), i;
		for (i=0; i<12; i++)
		{
			months += '<a href="javascript:void(0)" class="bx-calendar-month'+(i == cur_month ? ' bx-calendar-month-active' : '')+'" onclick="BX.calendar.get().SetMonth('+i+')">'+BX.message('MONTH_' + (i+1))+'</a>';
		}

		return '<div class="bx-calendar-month-popup"><div class="bx-calendar-month-title" onclick="BX.calendar.get().popup_month.close();">'+BX.message('MONTH_' + (this.value.getMonth()+1))+'</div><div class="bx-calendar-month-content">'+months+'</div></div>';
	};

	this._menu_month = function()
	{
		if (!this.popup_month)
		{
			this.popup_month = BX.PopupWindowManager.create(
				'calendar_popup_month_' + this.control_id, this.PARTS.MONTH,
				{
					content: this._menu_month_content(),
					zIndex: 3001,
					closeByEsc: true,
					autoHide: true,
					offsetTop: -29,
					offsetLeft: -1
				}
			);

			this.popup_month.BXMONTH = this.value.getMonth();
		}
		else if (this.popup_month.BXMONTH != this.value.getMonth())
		{
			this.popup_month.setContent(this._menu_month_content());
			this.popup_month.BXMONTH = this.value.getMonth();
		}

		this.popup_month.show();
	};

	this._menu_year_content = function()
	{
		var s = '<div class="bx-calendar-year-popup"><div class="bx-calendar-year-title" onclick="BX.calendar.get().popup_year.close();">'+this.value.getFullYear()+'</div><div class="bx-calendar-year-content" id="bx-calendar-year-content">'

			for (var i=-3; i <= 3; i++)
			{
				s += '<a href="javascript:void(0)" class="bx-calendar-year-number'+(i==0?' bx-calendar-year-active':'')+'" onclick="BX.calendar.get().SetYear('+(this.value.getFullYear()-i)+')">'+(this.value.getFullYear()-i)+'</a>'
			}

			s += '</div><input type="text" class="bx-calendar-year-input" onkeyup="if(this.value>=1900&&this.value<=2100)BX.calendar.get().SetYear(this.value);" maxlength="4" /></div>';

		return s;
	};

	this._menu_year = function()
	{
		if (!this.popup_year)
		{
			this.popup_year = BX.PopupWindowManager.create(
				'calendar_popup_year_' + this.control_id, this.PARTS.YEAR,
				{
					content: this._menu_year_content(),
					zIndex: 3001,
					closeByEsc: true,
					autoHide: true,
					offsetTop: -29,
					offsetLeft: -1
				}
			);

			this.popup_year.BXYEAR = this.value.getFullYear();
		}
		else if (this.popup_year.BXYEAR != this.value.getFullYear())
		{
			this.popup_year.setContent(this._menu_year_content());
			this.popup_year.BXYEAR = this.value.getFullYear();
		}

		this.popup_year.show();
	};

	this._check_date = function(v)
	{
		if (BX.type.isString(v))
			v = BX.parseDate(v);

		if (!BX.type.isDate(v))
		{
			v = new Date();
			if (this.params.bHideTime)
			{
				v.setHours(0);
				v.setMinutes(0);
			}
		}

		//v = BX.date.convertToUTC(v);
		v.setMilliseconds(0);
		v.setSeconds(0);

		v.BXCHECKED = true;

		return v;
	};
};

BX.JCCalendar.prototype.Show = function(params)
{
	if (!BX.isReady)
	{
		BX.ready(BX.delegate(function() {this.Show(params)}, this));
		return;
	}

	params.node = params.node||document.body;

	if (BX.type.isNotEmptyString(params.node))
	{
		var n = BX(params.node);
		if (!n)
		{
			n = document.getElementsByName(params.node);
			if (n && n.length > 0)
			{
				n = n[0]
			}
		}
		params.node = n;
	}

	if (!params.node)
		return;

	if (!!params.field)
	{
		if (BX.type.isString(params.field))
		{
			var n = BX(params.field);
			if (!!n)
			{
				params.field = n;
			}
			else
			{
				if (params.form)
				{
					if (BX.type.isString(params.form))
					{
						params.form = document.forms[params.form];
					}
				}

				if (BX.type.isDomNode(params.form) && !!params.form[params.field])
				{
					params.field = params.form[params.field];
				}
				else
				{
					var n = document.getElementsByName(params.field);
					if (n && n.length > 0)
					{
						n = n[0];
						params.field = n;
					}
				}
			}

			if (BX.type.isString(params.field))
			{
				params.field = BX(params.field);
			}
		}
	}

	var bShow = !this.popup || !this.popup.isShown() || this.params.node != params.node;

	this.params = params;

	this.params.bTime = typeof this.params.bTime == 'undefined' ? true : !!this.params.bTime;
	this.params.bHideTime = typeof this.params.bHideTime == 'undefined' ? true : !!this.params.bHideTime;

	this.weekStart = parseInt(this.params.weekStart || this.params.weekStart || BX.message('WEEK_START'));
	if (isNaN(this.weekStart))
		this.weekStart = 1;

	if (!this.popup)
	{
		this._create(this.params);
	}
	else
	{
		this.popup.setBindElement(this.params.node);
	}

	var bHideTime = !!this.params.bHideTime;
	if (this.params.value)
	{
		this.SetValue(this.params.value);
		bHideTime = this.value.getHours() <= 0 && this.value.getMinutes() <= 0;
	}
	else if (this.params.field)
	{
		this.SetValue(this.params.field.value);
		bHideTime = this.value.getHours() <= 0 && this.value.getMinutes() <= 0;
	}
	else if (!!this.params.currentTime)
	{
		this.SetValue(this.params.currentTime);
	}
	else
	{
		this.SetValue(new Date());
	}

	if (!!this.params.bTime)
		BX.removeClass(this.DIV, 'bx-calendar-time-disabled');
	else
		BX.addClass(this.DIV, 'bx-calendar-time-disabled');

	if (!!bHideTime)
		BX.removeClass(this.PARTS.TIME, 'bx-calendar-set-time-opened');
	else
		BX.addClass(this.PARTS.TIME, 'bx-calendar-set-time-opened');

	if (bShow)
	{
		this._auto_hide_disable();
		this.popup.show();
		setTimeout(BX.proxy(this._auto_hide_enable, this))
	}

	params.node.blur();

	return this;
};

BX.JCCalendar.prototype.SetDay = function(d)
{
	this.value.setDate(d);
	return this.SetValue(this.value);
};

BX.JCCalendar.prototype.SetMonth = function(m)
{
	if (this.popup_month)
		this.popup_month.close();
	this.value.setMonth(m);
	return this.SetValue(this.value);
};

BX.JCCalendar.prototype.SetYear = function(y)
{
	if (this.popup_year)
		this.popup_year.close();
	this.value.setFullYear(y);
	return this.SetValue(this.value);
};

BX.JCCalendar.prototype.SetDate = function(v, bSet)
{
	v = this._check_date(v);
	v.setHours(this.value.getHours());
	v.setMinutes(this.value.getMinutes());
	v.setSeconds(this.value.getSeconds());

	if (this.params.bTime && !bSet)
	{
		return this.SetValue(v);
	}
	else
	{
		this.SetValue(v);
		this.SaveValue();
	}
};

BX.JCCalendar.prototype.SetValue = function(v)
{
	this.value = (v && v.BXCHECKED) ? v : this._check_date(v);

	this.PARTS.MONTH.innerHTML = BX.message('MONTH_' + (this.value.getMonth()+1));
	this.PARTS.YEAR.innerHTML = this.value.getFullYear();

	if (!!this.params.bTime)
	{
		var h = this.value.getHours();
		if (this.bAmPm)
		{
			if (h >= 12)
			{
				this.PARTS.TIME_AMPM.innerHTML = 'PM';

				if (h != 12)
					h -= 12;
			}
			else
			{
				this.PARTS.TIME_AMPM.innerHTML = 'AM'

				if (h == 0)
					h = 12;
			}
		}

		this.PARTS.TIME_INPUT_H.value = BX.util.str_pad_left(h.toString(), 2, "0");
		this.PARTS.TIME_INPUT_M.value = BX.util.str_pad_left(this.value.getMinutes().toString(), 2, "0");
	}

	this._set_layer();

	return this;
};

BX.JCCalendar.prototype.SaveValue = function()
{
	if (this.popup_month)
		this.popup_month.close();
	if (this.popup_year)
		this.popup_year.close();

	var bSetValue = true;
	if (!!this.params.callback)
	{
		var res = this.params.callback.apply(this, [this.value]);
		if (res === false)
			bSetValue = false;
	}

	if (bSetValue)
	{
		if (this.params.field)
		{
			var bTime = !!this.params.bTime && BX.hasClass(this.PARTS.TIME, 'bx-calendar-set-time-opened');
			this.params.field.value = BX.calendar.ValueToString(this.value, bTime);
			BX.fireEvent(this.params.field, 'change');
		}

		this.popup.close();

		if (!!this.params.callback_after)
		{
			this.params.callback_after.apply(this, [this.value]);
		}
	}

	return this;
};

BX.JCCalendar.prototype.Close = function()
{
	if (!!this.popup)
		this.popup.close();

	return this;
};

BX.JCSpinner = function(params)
{
	params = params || {};
	this.params = {
		input: params.input || null,

		delta: params.delta || 1,

		timeout_start: params.timeout_start || 1000,
		timeout_cont: params.timeout_cont || 150,

		callback_start: params.callback_start || null,
		callback_change: params.callback_change || null,
		callback_finish: params.callback_finish || null,

		bSaveValue: typeof params.bSaveValue == 'undefined' ? !!params.input : !!params.bSaveValue
	}

	this.mousedown = false;
	this.direction = 1;
}

BX.JCSpinner.prototype.Show = function()
{
	this.node = BX.create('span', {
		events: {
			mousedown: BX.delegateEvent(
				{attr: 'data-dir'},
				BX.delegate(this.Start, this)
			)
		},
		html: '<a href="javascript:void(0)" class="bx-calendar-form-arrow bx-calendar-form-arrow-top" data-dir="1"><i></i></a><a href="javascript:void(0)" class="bx-calendar-form-arrow bx-calendar-form-arrow-bottom" data-dir="-1"><i></i></a>'
	});
	return this.node;
}

BX.JCSpinner.prototype.Start = function()
{
	this.mousedown = true;
	this.direction = BX.proxy_context.getAttribute('data-dir') > 0 ? 1 : -1;
	BX.bind(document, "mouseup", BX.proxy(this.MouseUp, this));
	this.ChangeValue(true);
}

BX.JCSpinner.prototype.ChangeValue = function(bFirst)
{
	if(!this.mousedown)
		return;

	if (this.params.input)
	{
		var v = parseInt(this.params.input.value, 10) + this.params.delta * this.direction;

		if (this.params.bSaveValue)
			this.params.input.value = v;

		if (!!bFirst && this.params.callback_start)
			this.params.callback_start(this.params, v, this.direction);

		if (this.params.callback_change)
			this.params.callback_change(this.params, v, this.direction);

		setTimeout(
			BX.proxy(this.ChangeValue, this),
			!!bFirst ? this.params.timeout_start : this.params.timeout_cont
		);
	}
}

BX.JCSpinner.prototype.MouseUp = function()
{
	this.mousedown = false;
	BX.unbind(document, "mouseup", BX.proxy(this.MouseUp, this));

	if (this.params.callback_finish)
		this.params.callback_finish(this.params, this.params.input.value);
}

/**************** compatibility hacks ***************************/

window.jsCalendar = {
	Show: function(obj, field, fieldFrom, fieldTo, bTime, serverTime, form_name, bHideTimebar)
	{
		return BX.calendar({
			node: obj, field: field, form: form_name, bTime: !!bTime, currentTime: serverTime, bHideTimebar: !!bHideTimebar
		});
	},

	ValueToString: BX.calendar.ValueToString
}


/************ clock popup transferred from timeman **************/

BX.CClockSelector = function(params)
{
	this.params = params;

	this.params.popup_buttons = this.params.popup_buttons || [
		new BX.PopupWindowButton({
			text : BX.message('CAL_BUTTON'),
			className : "popup-window-button-create",
			events : {click : BX.proxy(this.setValue, this)}
		})
	];

	this.isReady = false;

	this.WND = new BX.PopupWindow(
		this.params.popup_id || 'clock_selector_popup',
		this.params.node,
		this.params.popup_config || {
			titleBar: {content: BX.create('SPAN', {text: BX.message('CAL_TIME')})},
			offsetLeft: -45,
			offsetTop: -135,
			autoHide: true,
			closeIcon: true,
			closeByEsc: true,
			zIndex: this.params.zIndex
		}
	);

	this.SHOW = false;
	BX.addCustomEvent(this.WND, "onPopupClose", BX.delegate(this.onPopupClose, this));

	this.obClocks = {};
	this.CLOCK_ID = this.params.clock_id || 'clock_selector';
};

BX.CClockSelector.prototype.Show = function()
{
	if (!this.isReady)
	{
		//BX.timeman.showWait(this.parent.DIV);

		BX.addCustomEvent('onClockRegister', BX.proxy(this.onClockRegister, this));
		return BX.ajax.get('/bitrix/tools/clock_selector.php', {start_time: this.params.start_time, clock_id: this.CLOCK_ID, sessid: BX.bitrix_sessid()}, BX.delegate(this.Ready, this));
	}

	this.WND.setButtons(this.params.popup_buttons);
	this.WND.show();

	this.SHOW = true;

	if (window['bxClock_' + this.obClocks[this.CLOCK_ID]])
	{
		setTimeout("window['bxClock_" + this.obClocks[this.CLOCK_ID] + "'].CalculateCoordinates()", 40);
	}

	return true;
};

BX.CClockSelector.prototype.onClockRegister = function(obClocks)
{
	if (obClocks[this.CLOCK_ID])
	{
		this.obClocks[this.CLOCK_ID] = obClocks[this.CLOCK_ID];
		BX.removeCustomEvent('onClockRegister', BX.proxy(this.onClockRegister, this));
	}
};

BX.CClockSelector.prototype.Ready = function(data)
{
	this.content = this.CreateContent(data);
	this.WND.setContent(this.content);

	this.isReady = true;
	//BX.timeman.closeWait();

	setTimeout(BX.proxy(this.Show, this), 30);
};

BX.CClockSelector.prototype.CreateContent = function(data)
{
	return BX.create('DIV', {
		events: {click: BX.PreventDefault},
		html:
			'<div class="bx-tm-popup-clock">' + data + '</div>'
	});
};

BX.CClockSelector.prototype.setValue = function(e)
{
	if (this.params.callback)
	{
		var input = BX.findChild(this.content, {tagName: 'INPUT'}, true);
		this.params.callback.apply(this.params.node, [input.value]);
	}

	return BX.PreventDefault(e);
};

BX.CClockSelector.prototype.closeWnd = function(e)
{
	this.WND.close();
	return (e || window.event) ? BX.PreventDefault(e) : true;
};

BX.CClockSelector.prototype.setNode = function(node)
{
	this.WND.setBindElement(node);
};

BX.CClockSelector.prototype.setTime = function(timestamp)
{
	this.params.start_time = timestamp;
	if (window['bxClock_' + this.obClocks[this.CLOCK_ID]])
	{
		window['bxClock_' +  this.obClocks[this.CLOCK_ID]].SetTime(parseInt(timestamp/3600), parseInt((timestamp%3600)/60));
	}
};

BX.CClockSelector.prototype.setCallback = function(cb)
{
	this.params.callback = cb;
};

BX.CClockSelector.prototype.onPopupClose = function()
{
	this.SHOW = false;
};

})();
/* End */
;
; /* Start:/bitrix/js/main/core/core_dd.js*/
(function(window){
BX.DD = function(params)
{
	return new BX.DD.dragdrop(params);
}

BX.DD.allowSelection = function()
{
	document.onmousedown = null;
	var b = document.body;
	b.ondrag = null;
	b.onselectstart = null;
	b.style.MozUserSelect = '';
	
	// if (jsDD.current_node)
	// {
		// jsDD.current_node.ondrag = null;
		// jsDD.current_node.onselectstart = null;
		// jsDD.current_node.style.MozUserSelect = '';
	// }
}
	
BX.DD.denySelection = function()
{
	document.onmousedown = BX.False;
	var b = document.body;
	b.ondrag = BX.False;
	b.onselectstart = BX.False;
	b.style.MozUserSelect = 'none';
	// if (jsDD.current_node) 
	// {
		// jsDD.current_node.ondrag = jsUtils.False;
		// jsDD.current_node.onselectstart = jsUtils.False;
		// jsDD.current_node.style.MozUserSelect = 'none';
	// }
}

BX.DD.dragdrop = function(params)
{


}

/*
 * BX.DD.dropFiles - for html5 drag and drop files
 *
 * example:
 *
 * BX(function() {
 *	  var dropBoxNode = BX('WebDAV23');
 *    var dropbox = new BX.DD.dropFiles(dropBoxNode);
 *    if (dropbox && dropbox.supported())
 *    {
 *        BX.addCustomEvent(dropbox, 'dropFiles', function(files) { WDUploadDroppedFiles(files);});
 *        BX.addCustomEvent(dropbox, 'dragEnter', function() {BX.addClass( dropBoxNode, 'droptarget');});
 *        BX.addCustomEvent(dropbox, 'dragLeave', function() {BX.removeClass( dropBoxNode, 'droptarget');});
 *    }
 * });
 *
 * to save files use BX.ajax.FormData
 */
BX.DD.dropFiles = function(div)
{
	if (BX.type.isElementNode(div)
		&& this.supported())
	{
		div.setAttribute('dropzone', 'copy f:*/*');
		this.DIV = div;
		this._timer = null;
		this._initEvents();

		this._cancelLeave = function()
		{
			if (this._timer != null)
			{
				clearTimeout(this._timer);
				this._timer = null;
			}
		}
		this._prepareLeave = function()
		{
			this._cancelLeave();
			this._timer = setTimeout( BX.delegate(function() {
				BX.onCustomEvent(this, 'dragLeave')
			}, this), 100);
		}

		return this;
	}
	return false;
}

BX.DD.dropFiles.prototype._initEvents = function()
{
	BX.bind(this.DIV, 'dragover', BX.proxy(this._dragOver, this));
	BX.bind(this.DIV, 'dragenter', BX.proxy(this._dragEnter, this));
	BX.bind(this.DIV, 'dragleave', BX.proxy(this._dragLeave, this));
	BX.bind(this.DIV, 'dragexit', BX.proxy(this._dragExit, this));
	BX.bind(this.DIV, 'drop', BX.proxy(this._drop, this));
}

BX.DD.dropFiles.prototype._dragEnter = function(e)
{
	BX.PreventDefault(e);
	this._cancelLeave();
	BX.onCustomEvent(this, 'dragEnter');
	return true;
}

BX.DD.dropFiles.prototype._dragExit = function(e)
{
	BX.PreventDefault(e);
	this._prepareLeave();
	return false;
}


BX.DD.dropFiles.prototype._dragLeave = function(e)
{
	BX.PreventDefault(e);
	this._prepareLeave();
	return false;
}

BX.DD.dropFiles.prototype._dragOver = function(e)
{
	BX.PreventDefault(e);
	this._cancelLeave();
	return true;
}

BX.DD.dropFiles.prototype._drop = function(e)
{
	BX.PreventDefault(e);
	var dt = e.dataTransfer;
	var files = dt.files;
	BX.onCustomEvent(this, 'dropFiles', [files]);
	BX.onCustomEvent(this, 'dragLeave')
	return false;
}

BX.DD.dropFiles.prototype.isEventSupported = function(event)
{
	var div = BX.create('DIV');
	var eventName = 'on'+event;
	var result = (eventName in div);
	
	if (!result && div.setAttribute && div.removeAttribute)
	{
		div.setAttribute(eventName, '');
		result = (typeof div[eventName] === 'function');
	}

	div = null;
	return result;
}

BX.DD.dropFiles.prototype.supported = function()
{
	return ( (!!window.FileReader) && this.isEventSupported('dragstart') && this.isEventSupported('drop') );
}

})(window)

/* End */
;
; /* Start:/bitrix/js/fileman/light_editor/le_dialogs.js*/
window.LHEDailogs = {};

window.LHEDailogs['Anchor'] = function(pObj)
{
	return {
		title: BX.message.AnchorProps,
		innerHTML : '<table>' +
			'<tr>' +
				'<td class="lhe-dialog-label lhe-label-imp">' + BX.message.AnchorName + ':</td>' +
				'<td class="lhe-dialog-param"><input type="text" size="20" value="" id="lhed_anchor_name"></td>' +
			'</tr></table>',
		width: 300,
		OnLoad: function()
		{
			pObj.pName = BX("lhed_anchor_name");
			pObj.pLEditor.focus(pObj.pName);

			var pElement = pObj.pLEditor.GetSelectionObject();
			var value = "";
			if (pElement)
			{
				var bxTag = pObj.pLEditor.GetBxTag(pElement);
				if (bxTag.tag == "anchor" && bxTag.params.value)
				{
					value = bxTag.params.value.replace(/([\s\S]*?name\s*=\s*("|'))([\s\S]*?)(\2[\s\S]*?(?:>\s*?<\/a)?(?:\/?))?>/ig, "$3");
				}
			}
			pObj.pName.value = value;
		},
		OnSave: function()
		{
			var anchorName = pObj.pName.value.replace(/[^\w\d]/gi, '_');
			if(pObj.pSel)
			{
				if(anchorName.length > 0)
					pObj.pSel.id = anchorName;
				else
					pObj.pLEditor.executeCommand('Delete');
			}
			else if(anchorName.length > 0)
			{
				var id = pObj.pLEditor.SetBxTag(false, {tag: "anchor", params: {value : '<a name="' + anchorName + '"></a>'}});
				pObj.pLEditor.InsertHTML('<img id="' + id + '" src="' + pObj.pLEditor.oneGif + '" class="bxed-anchor" />');
			}
		}
	};
}

window.LHEDailogs['Link'] = function(pObj)
{
	var strHref = pObj.pLEditor.arConfig.bUseFileDialogs ? '<input type="text" size="26" value="" id="lhed_link_href"><input type="button" value="..." style="width: 20px;" onclick="window.LHED_Link_FDOpen();">' : '<input type="text" size="30" value="" id="lhed_link_href">';

	var str = '<table width="100%">' +
	'<tr>' +
		'<td class="lhe-dialog-label lhe-label-imp">' + BX.message.LinkText + ':</td>' +
		'<td class="lhe-dialog-param"><input type="text" size="30" value="" id="lhed_link_text"></td>' +
	'</tr>' +
	'<tr>' +
		'<td class="lhe-dialog-label lhe-label-imp">' + BX.message.LinkHref + ':</td>' +
		'<td class="lhe-dialog-param">' + strHref + '</td>' +
	'</tr>';

	if (!pObj.pLEditor.arConfig.bBBCode)
	{
		str +=
	'<tr>' +
		'<td class="lhe-dialog-label">' + BX.message.LinkTitle + ':</td>' +
		'<td class="lhe-dialog-param"><input type="text" size="30" value="" id="lhed_link_title"></td>' +
	'</tr>' +
	'<tr>' +
		'<td class="lhe-dialog-label">' + BX.message.LinkTarget + '</td>' +
		'<td class="lhe-dialog-param">' +
			'<select id="lhed_link_target">' +
				'<option value="">' + BX.message.LinkTarget_def + '</option>' +
				'<option value="_blank">' + BX.message.LinkTarget_blank + '</option>' +
				'<option value="_parent">' + BX.message.LinkTarget_parent + '</option>' +
				'<option value="_self">' + BX.message.LinkTarget_self + '</option>' +
				'<option value="_top">' + BX.message.LinkTarget_top + '</option>' +
			'</select>' +
		'</td>' +
	'</tr>';
	}
	str += '</table>';

	return {
		title: BX.message.LinkProps,
		innerHTML : str,
		width: 420,
		OnLoad: function()
		{
			pObj._selectionStart = pObj._selectionEnd = null;
			pObj.bNew = true;
			pObj.pText = BX("lhed_link_text");
			pObj.pHref = BX("lhed_link_href");

			pObj.pLEditor.focus(pObj.pHref);

			if (!pObj.pLEditor.bBBCode)
			{
				pObj.pTitle = BX("lhed_link_title");
				pObj.pTarget = BX("lhed_link_target");
			}

			if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode)
			{
				if (pObj.prevTextSelection)
					pObj.pText.value = pObj.prevTextSelection;

				if (pObj.pLEditor.pTextarea.selectionStart != undefined)
				{
					pObj._selectionStart = pObj.pLEditor.pTextarea.selectionStart;
					pObj._selectionEnd = pObj.pLEditor.pTextarea.selectionEnd;
				}
			}
			else // WYSIWYG
			{
				if(!pObj.pSel)
				{
					var bogusImg = pObj.pLEditor.pEditorDocument.getElementById('bx_lhe_temp_bogus_node');
					if (bogusImg)
					{
						pObj.pSel = BX.findParent(bogusImg, {tagName: 'A'});
						bogusImg.parentNode.removeChild(bogusImg);
					}
				}

				var parA = (pObj.pSel && pObj.pSel.tagName.toUpperCase() != 'A') ? BX.findParent(pObj.pSel, {tagName : 'A'}) : false;
				if (parA)
					pObj.pSel = parA;

				pObj.bNew = !pObj.pSel || pObj.pSel.tagName.toUpperCase() != 'A';

				// Select Link
				if (!pObj.bNew && !BX.browser.IsIE())
					pObj.pLEditor.oPrevRange = pObj.pLEditor.SelectElement(pObj.pSel);


				var
					selectedText = false,
					oRange = pObj.pLEditor.oPrevRange;

				// Get selected text
				if (oRange.startContainer && oRange.endContainer) // DOM Model
				{
					if (oRange.startContainer == oRange.endContainer && (oRange.endContainer.nodeType == 3 || oRange.endContainer.nodeType == 1))
						selectedText = oRange.startContainer.textContent.substring(oRange.startOffset, oRange.endOffset) || '';
				}
				else // IE
				{
					if (oRange.text == oRange.htmlText)
						selectedText = oRange.text || '';
				}

				if (pObj.pSel && pObj.pSel.tagName.toUpperCase() == 'IMG')
					selectedText = false;

				if (selectedText === false)
				{
					var textRow = BX.findParent(pObj.pText, {tagName: 'TR'});
					textRow.parentNode.removeChild(textRow);
					pObj.pText = false;
				}
				else
				{
					pObj.pText.value = selectedText || '';
				}

				if (!pObj.bNew)
				{
					var bxTag = pObj.pLEditor.GetBxTag(pObj.pSel);
					if (pObj.pText !== false)
						pObj.pText.value = pObj.pSel.innerHTML;

					if (pObj.pSel && pObj.pSel.childNodes && pObj.pSel.childNodes.length > 0)
					{
						for (var i = 0; i < pObj.pSel.childNodes.length; i++)
						{
							if (pObj.pSel.childNodes[i] && pObj.pSel.childNodes[i].nodeType != 3)
							{
								var textRow = BX.findParent(pObj.pText, {tagName: 'TR'});
								textRow.parentNode.removeChild(textRow);
								pObj.pText = false;
								break;
							}
						}
					}

					if (bxTag.tag == 'a')
					{
						pObj.pHref.value = bxTag.params.href;
						if (!pObj.pLEditor.bBBCode)
						{
							pObj.pTitle.value = bxTag.params.title || '';
							pObj.pTarget.value = bxTag.params.target || '';
						}
					}
					else
					{
						pObj.pHref.value = pObj.pSel.getAttribute('href');
						if (!pObj.pLEditor.bBBCode)
						{
							pObj.pTitle.value = pObj.pSel.getAttribute('title') || '';
							pObj.pTarget.value = pObj.pSel.getAttribute('target') || '';
						}
					}
				}
			}
		},
		OnSave: function()
		{
			var
				link,
				href = pObj.pHref.value;

			if (href.length  < 1) // Need for showing error
				return;

			if (pObj.pText && pObj.pText.value.length <=0)
				pObj.pText.value = href;

			// BB code mode
			if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode)
			{
				if (pObj._selectionStart != undefined && pObj._selectionEnd != undefined)
				{
					pObj.pLEditor.pTextarea.selectionStart = pObj._selectionStart;
					pObj.pLEditor.pTextarea.selectionEnd = pObj._selectionEnd;
				}

				var res = "";
				if (!pObj.pText || pObj.pText && pObj.pText.value == href)
					res = '[URL]' + href + '[/URL]';
				else
					res = '[URL=' + href + ']' + pObj.pText.value + '[/URL]';
				pObj.pLEditor.WrapWith("", "",  res);
			}
			else
			{
				// WYSIWYG mode
				var arlinks = [];
				if (pObj.pSel && pObj.pSel.tagName.toUpperCase() == 'A')
				{
					arlinks[0] = pObj.pSel;
				}
				else
				{
					var sRand = '#'+Math.random().toString().substring(5);
					var pDoc = pObj.pLEditor.pEditorDocument;

					if (pObj.pText !== false) // Simple case
					{
						pObj.pLEditor.InsertHTML('<a id="bx_lhe_' + sRand + '">#</a>');
						arlinks[0] = pDoc.getElementById('bx_lhe_' + sRand);
						arlinks[0].removeAttribute("id");
					}
					else
					{
						pDoc.execCommand('CreateLink', false, sRand);
						var arLinks_ = pDoc.getElementsByTagName('A');
						for(var i = 0; i < arLinks_.length; i++)
							if(arLinks_[i].getAttribute('href', 2) == sRand)
								arlinks.push(arLinks_[i]);
					}
				}

				var oTag, i, l = arlinks.length, link;
				for (i = 0;  i < l; i++)
				{
					link = arlinks[i];
					oTag = false;

					if (pObj.pSel && i == 0)
					{
						oTag = pObj.pLEditor.GetBxTag(link);
						if (oTag.tag != 'a' || !oTag.params)
							oTag = false;
					}

					if (!oTag)
						oTag = {tag: 'a', params: {}};

					oTag.params.href = href;
					if (!pObj.pLEditor.bBBCode)
					{
						oTag.params.title = pObj.pTitle.value;
						oTag.params.target = pObj.pTarget.value;
					}

					pObj.pLEditor.SetBxTag(link, oTag);
					SetAttr(link, 'href', href);
					// Add text
					if (pObj.pText !== false)
						link.innerHTML = BX.util.htmlspecialchars(pObj.pText.value);

					if (!pObj.pLEditor.bBBCode)
					{
						SetAttr(link, 'title', pObj.pTitle.value);
						SetAttr(link, 'target', pObj.pTarget.value);
					}
				}
			}
		}
	};
}

window.LHEDailogs['Image'] = function(pObj)
{
	var sText = '', i, strSrc;

	if (pObj.pLEditor.arConfig.bUseMedialib)
		strSrc = '<input type="text" size="30" value="" id="lhed_img_src"><input class="lhe-br-but" type="button" value="..." onclick="window.LHED_Img_MLOpen();">';
	else if (pObj.pLEditor.arConfig.bUseFileDialogs)
		strSrc = '<input type="text" size="30" value="" id="lhed_img_src"><input class="lhe-br-but" type="button" value="..." onclick="window.LHED_Img_FDOpen();">';
	else
		strSrc = '<input type="text" size="33" value="" id="lhed_img_src">';

	for (i = 0; i < 200; i++){sText += 'text ';}

	var str = '<table width="100%">' +
	'<tr>' +
		'<td class="lhe-dialog-label lhe-label-imp">' + BX.message.ImageSrc + ':</td>' +
		'<td class="lhe-dialog-param">' + strSrc + '</td>' +
	'</tr>';
	if (!pObj.pLEditor.arConfig.bBBCode)
	{
		str +=
	'<tr>' +
		'<td class="lhe-dialog-label">' + BX.message.ImageTitle + ':</td>' +
		'<td class="lhe-dialog-param"><input type="text" size="33" value="" id="lhed_img_title"></td>' +
	'</tr>' +
	'<tr>' +
		'<td class="lhe-dialog-label">' + BX.message.ImgAlign + ':</td>' +
		'<td class="lhe-dialog-param">' +
			'<select id="lhed_img_align">' +
				'<option value="">' + BX.message.LinkTarget_def + '</option>' +
				'<option value="top">' + BX.message.ImgAlignTop + '</option>' +
				'<option value="right">' + BX.message.ImgAlignRight + '</option>' +
				'<option value="bottom">' + BX.message.ImgAlignBottom + '</option>' +
				'<option value="left">' + BX.message.ImgAlignLeft + '</option>' +
				'<option value="middle">' + BX.message.ImgAlignMiddle + '</option>' +
			'</select>' +
		'</td>' +
	'</tr>' +
	'<tr>' +
		'<td colSpan="2" class="lhe-dialog-param"><span class="lhed-img-preview-label">' + BX.message.ImageSizing + ':</span>' +
		'<div class="lhed-img-size-cont"><input type="text" size="4" value="" id="lhed_img_width"> x <input type="text" size="4" value="" id="lhed_img_height"> <input type="checkbox" id="lhed_img_save_prop" checked><label for="lhed_img_save_prop">' + BX.message.ImageSaveProp + '</label></div></td>' +
	'</tr>';
	str +=
	'<tr>' +
		'<td colSpan="2" class="lhe-dialog-param"><span class="lhed-img-preview-label">' + BX.message.ImagePreview + ':</span>' +
			'<div class="lhed-img-preview-cont"><img id="lhed_img_preview" style="display:none" />' + sText + '</div>' +
		'</td>' +
	'</tr>';
	}
	str += '</table>';

	var PreviewOnLoad = function()
	{
		var w = parseInt(this.style.width || this.getAttribute('width') || this.offsetWidth);
		var h = parseInt(this.style.height || this.getAttribute('hright') || this.offsetHeight);
		if (!w || !h)
			return;
		pObj.iRatio = w / h; // Remember proportion
		pObj.curWidth = pObj.pWidth.value = w;
		pObj.curHeight = pObj.pHeight.value = h;
	};

	var PreviewReload = function()
	{
		var newSrc = pObj.pSrc.value;
		if (!newSrc) return;
		if (pObj.prevSrc != newSrc)
		{
			pObj.prevSrc = pObj.pPreview.src = newSrc;
			pObj.pPreview.style.display = "";
			pObj.pPreview.removeAttribute("width");
			pObj.pPreview.removeAttribute("height");
		}

		if (pObj.curWidth && pObj.curHeight)
		{
			pObj.pPreview.style.width = pObj.curWidth + 'px';
			pObj.pPreview.style.height = pObj.curHeight + 'px';
		}

		if (!pObj.pLEditor.bBBCode)
		{
			SetAttr(pObj.pPreview, 'align', pObj.pAlign.value);
			SetAttr(pObj.pPreview, 'title', pObj.pTitle.value);
		}
	};

	if (pObj.pLEditor.arConfig.bUseMedialib || pObj.pLEditor.arConfig.bUseFileDialogs)
	{
		window.LHED_Img_SetUrl = function(filename, path, site)
		{
			var url, srcInput = BX("lhed_img_src"), pTitle;

			if (typeof filename == 'object') // Using medialibrary
			{
				url = filename.src;
				if (pTitle = BX("lhed_img_title"))
					pTitle.value = filename.name;
			}
			else // Using file dialog
			{
				url = (path == '/' ? '' : path) + '/'+filename;
			}

			srcInput.value = url;
			if(srcInput.onchange)
				srcInput.onchange();

			pObj.pLEditor.focus(srcInput, true);
		};
	}

	return {
		title: BX.message.ImageProps,
		innerHTML : str,
		width: 500,
		OnLoad: function()
		{
			pObj.bNew = !pObj.pSel || pObj.pSel.tagName.toUpperCase() != 'IMG';
			pObj.bSaveProp = true;
			pObj.iRatio = 1;

			pObj.pSrc = BX("lhed_img_src");
			pObj.pLEditor.focus(pObj.pSrc);

			if (!pObj.pLEditor.bBBCode)
			{
				pObj.pPreview = BX("lhed_img_preview");
				pObj.pTitle = BX("lhed_img_title");
				pObj.pAlign = BX("lhed_img_align");
				pObj.pWidth = BX("lhed_img_width");
				pObj.pHeight = BX("lhed_img_height");
				pObj.pSaveProp = BX("lhed_img_save_prop");
				pObj.bSetInStyles = false;
				pObj.pSaveProp.onclick = function()
				{
					pObj.bSaveProp = this.checked ? true : false;
					if (pObj.bSaveProp)
						pObj.pWidth.onchange();
				};
				pObj.pWidth.onchange = function()
				{
					var w = parseInt(this.value);
					if (isNaN(w)) return;
					pObj.curWidth = pObj.pWidth.value = w;
					if (pObj.bSaveProp)
					{
						var h = Math.round(w / pObj.iRatio);
						pObj.curHeight = pObj.pHeight.value = h;
					}
					PreviewReload();
				};
				pObj.pHeight.onchange = function()
				{
					var h = parseInt(this.value);
					if (isNaN(h)) return;
					pObj.curHeight = pObj.pHeight.value = h;
					if (pObj.bSaveProp)
					{
						var w = parseInt(h * pObj.iRatio);
						pObj.curWidth = pObj.pWidth.value = w;
					}
					PreviewReload();
				};
				pObj.pAlign.onchange = pObj.pTitle.onchange = PreviewReload;
				pObj.pSrc.onchange = PreviewReload;
				pObj.pPreview.onload = PreviewOnLoad;
			}
			else if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode && pObj.pLEditor.pTextarea.selectionStart != undefined)
			{
				pObj._selectionStart = pObj.pLEditor.pTextarea.selectionStart;
				pObj._selectionEnd = pObj.pLEditor.pTextarea.selectionEnd;
			}

			if (!pObj.bNew) // Select Img
			{
				var bxTag = pObj.pLEditor.GetBxTag(pObj.pSel);
				if (bxTag.tag !== 'img')
					bxTag.params = {};

				pObj.pSrc.value = bxTag.params.src || '';
				if (!pObj.pLEditor.bBBCode)
				{
					pObj.pPreview.onload = function(){pObj.pPreview.onload = PreviewOnLoad;};
					if (pObj.pSel.style.width || pObj.pSel.style.height)
						pObj.bSetInStyles = true;
					pObj.bSetInStyles = false;

					var w = parseInt(pObj.pSel.style.width || pObj.pSel.getAttribute('width') || pObj.pSel.offsetWidth);
					var h = parseInt(pObj.pSel.style.height || pObj.pSel.getAttribute('height') || pObj.pSel.offsetHeight);
					if (w && h)
					{
						pObj.iRatio = w / h; // Remember proportion
						pObj.curWidth = pObj.pWidth.value = w;
						pObj.curHeight = pObj.pHeight.value = h;
					}
					pObj.pTitle.value = bxTag.params.title || '';
					pObj.pAlign.value = bxTag.params.align || '';
					PreviewReload();
				}
			}
		},
		OnSave: function()
		{
			var src = pObj.pSrc.value, img, oTag;

			if (src.length < 1) // Need for showing error
				return;

			// BB code mode
			if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode)
			{
				if (pObj._selectionStart != undefined && pObj._selectionEnd != undefined)
				{
					pObj.pLEditor.pTextarea.selectionStart = pObj._selectionStart;
					pObj.pLEditor.pTextarea.selectionEnd = pObj._selectionEnd;
				}
				pObj.pLEditor.WrapWith("", "",  '[IMG]' + src + '[/IMG]');
			}
			else
			{
				// WYSIWYG mode
				if (pObj.pSel)
				{
					img = pObj.pSel;
					oTag = pObj.pLEditor.GetBxTag(img);
					if (oTag.tag != 'img' || !oTag.params)
						oTag = false;
				}
				else
				{
					var tmpid = Math.random().toString().substring(4);
					pObj.pLEditor.InsertHTML('<img id="' + tmpid + '" src="" />');
					img = pObj.pLEditor.pEditorDocument.getElementById(tmpid);
					img.removeAttribute("id");
				}
				SetAttr(img, "src", src);

				if (!oTag)
					oTag = {tag: 'img', params: {}};

				oTag.params.src = src;

				if (!pObj.pLEditor.bBBCode)
				{
					if (pObj.bSetInStyles)
					{
						img.style.width = pObj.pWidth.value + 'px';
						img.style.height = pObj.pHeight.value + 'px';
						SetAttr(img, "width", '');
						SetAttr(img, "height", '');
					}
					else
					{
						SetAttr(img, "width", pObj.pWidth.value);
						SetAttr(img, "height", pObj.pHeight.value);
						img.style.width = '';
						img.style.height = '';
					}

					oTag.params.align = pObj.pAlign.value;
					oTag.params.title = pObj.pTitle.value;

					SetAttr(img, "align", pObj.pAlign.value);
					SetAttr(img, "title", pObj.pTitle.value);
				}

				pObj.pLEditor.SetBxTag(img, oTag);
			}
		}
	};
}

window.LHEDailogs['Video'] = function(pObj)
{
	var strPath;
	if (pObj.pLEditor.arConfig.bUseMedialib)
		strPath = '<input type="text" size="30" value="" id="lhed_video_path"><input class="lhe-br-but" type="button" value="..." onclick="window.LHED_Video_MLOpen();">';
	else if (pObj.pLEditor.arConfig.bUseFileDialogs)
		strPath = '<input type="text" size="30" value="" id="lhed_video_path"><input class="lhe-br-but" type="button" value="..." onclick="window.LHED_VideoPath_FDOpen();">';
	else
		strPath = '<input type="text" size="33" value="" id="lhed_video_path">';

	var strPreview = pObj.pLEditor.arConfig.bUseFileDialogs ? '<input type="text" size="30" value="" id="lhed_video_prev_path"><input type="button" value="..." style="width: 20px;" onclick="window.LHED_VideoPreview_FDOpen();">' : '<input type="text" size="33" value="" id="lhed_video_prev_path">';

	var sText = '', i;
	for (i = 0; i < 200; i++){sText += 'text ';}

	var str = '<table width="100%">' +
	'<tr>' +
		'<td class="lhe-dialog-label lhe-label-imp">' + BX.message.VideoPath + ':</td>' +
		'<td class="lhe-dialog-param">' + strPath + '</td>' +
	'</tr>';
	if (!pObj.pLEditor.arConfig.bBBCode)
	{
		str +=
	'<tr>' +
		'<td class="lhe-dialog-label">' + BX.message.VideoPreviewPath + ':</td>' +
		'<td class="lhe-dialog-param">' + strPreview + '</td>' +
	'</tr>';
	}
	str +=
	'<tr>' +
		'<td class="lhe-dialog-label lhe-label-imp">' + BX.message.ImageSizing + ':</td>' +
		'<td class="lhe-dialog-param">' +
		'<div class="lhed-img-size-cont"><input type="text" size="4" value="" id="lhed_video_width"> x <input type="text" size="4" value="" id="lhed_video_height"></div></td>' +
	'</tr>';
	if (!pObj.pLEditor.arConfig.bBBCode)
	{
		str +=
	'<tr>' +
		'<td class="lhe-dialog-label"></td>' +
		'<td class="lhe-dialog-param"><input type="checkbox" id="lhed_video_autoplay"><label for="lhed_video_autoplay">' + BX.message.VideoAutoplay + '</label></td>' +
	'</tr>' +
	'<tr>' +
		'<td class="lhe-dialog-label">' + BX.message.VideoVolume + ':</td>' +
		'<td class="lhe-dialog-param">' +
			'<select id="lhed_video_volume">' +
				'<option value="10">10</option><option value="20">20</option>' +
				'<option value="30">30</option><option value="40">40</option>' +
				'<option value="50">50</option><option value="60">60</option>' +
				'<option value="70">70</option><option value="80">80</option>' +
				'<option value="90" selected="selected">90</option><option value="100">100</option>' +
			'</select> %' +
		'</td>' +
	'</tr>';
	}

	window.LHED_Video_SetPath = function(filename, path, site)
	{
		var url, srcInput = BX("lhed_video_path");
		if (typeof filename == 'object') // Using medialibrary
			url = filename.src;
		else // Using file dialog
			url = (path == '/' ? '' : path) + '/' + filename;

		srcInput.value = url;
		if(srcInput.onchange)
			srcInput.onchange();

		pObj.pLEditor.focus(srcInput, true);
	};

	return {
		title: BX.message.VideoProps,
		innerHTML : str,
		width: 500,
		OnLoad: function()
		{
			pObj.pSel = pObj.pLEditor.GetSelectionObject();
			pObj.bNew = true;
			var bxTag = {};

			if (pObj.pSel)
				bxTag = pObj.pLEditor.GetBxTag(pObj.pSel);

			if (pObj.pSel && pObj.pSel.id)
				bxTag = pObj.pLEditor.GetBxTag(pObj.pSel.id);

			if (bxTag.tag == 'video' && bxTag.params)
				pObj.bNew = false;
			else
				pObj.pSel = false;

			pObj.pPath = BX("lhed_video_path");
			pObj.pLEditor.focus(pObj.pPath);
			pObj.pWidth = BX("lhed_video_width");
			pObj.pHeight = BX("lhed_video_height");

			if (!pObj.pLEditor.bBBCode)
			{
				pObj.pPrevPath = BX("lhed_video_prev_path");
				pObj.pVolume = BX("lhed_video_volume");
				pObj.pAutoplay = BX("lhed_video_autoplay");
			}
			else if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode && pObj.pLEditor.pTextarea.selectionStart != undefined)
			{
				pObj._selectionStart = pObj.pLEditor.pTextarea.selectionStart;
				pObj._selectionEnd = pObj.pLEditor.pTextarea.selectionEnd;
			}

			if (!pObj.bNew)
			{
				pObj.arParams = bxTag.params || {};

				var path, prPath, vol, w, h, autoplay;
				if (pObj.arParams.flashvars) //FLV
				{
					path = pObj.arParams.flashvars.file;
					w = pObj.arParams.width || '';
					h = pObj.arParams.height || '';
					prPath = pObj.arParams.flashvars.image || '';
					vol = pObj.arParams.flashvars.volume || '90';
					autoplay = pObj.arParams.flashvars.autostart || false;
				}
				else
				{
					path = pObj.arParams.JSConfig.file;
					w = pObj.arParams.JSConfig.width || '';
					h = pObj.arParams.JSConfig.height || '';
					prPath = pObj.arParams.JSConfig.image || '';
					vol = pObj.arParams.JSConfig.volume || '90';
					autoplay = pObj.arParams.JSConfig.autostart || false;
				}
				pObj.pPath.value = path;
				pObj.pWidth.value = w;
				pObj.pHeight.value = h;

				if (!pObj.pLEditor.bBBCode)
				{
					if (pObj.pPrevPath)
						pObj.pPrevPath.value = prPath;
					pObj.pVolume.value = vol;
					pObj.pAutoplay.checked = autoplay ? true : false;
				}
			}
		},
		OnSave: function()
		{
			var
				path = pObj.pPath.value,
				w = parseInt(pObj.pWidth.value) || 240,
				h = parseInt(pObj.pHeight.value) || 180,
				pVid, ext,
				arVidConf = pObj.pLEditor.arConfig.videoSettings;

			if (path.length  < 1) // Need for showing error
				return;

			if (pObj.pSel)
			{
				pVid = pObj.pSel;
			}
			else
			{
				pObj.videoId = "bx_video_" + Math.round(Math.random() * 100000);

				pObj.pLEditor.InsertHTML('<img id="' + pObj.videoId + '" src="' + pObj.pLEditor.oneGif + '" class="bxed-video" />');

				pVid = pObj.pLEditor.pEditorDocument.getElementById(pObj.videoId);
			}

			if (arVidConf.maxWidth && w && parseInt(w) > parseInt(arVidConf.maxWidth))
				w = arVidConf.maxWidth;
			if (arVidConf.maxHeight && h && parseInt(h) > parseInt(arVidConf.maxHeight))
				h = arVidConf.maxHeight;

			var oVideo = {width: w, height: h};
			if (path.indexOf('http://') != -1 || path.indexOf('.') != -1)
			{
				ext = (path.indexOf('.') != -1) ? path.substr(path.lastIndexOf('.') + 1).toLowerCase() : false;
				if (ext && (ext == 'wmv' || ext == 'wma')) // WMV
				{
					oVideo.JSConfig = {file: path};
					if (!pObj.pLEditor.bBBCode)
					{
						if (pObj.pPrevPath)
							oVideo.JSConfig.image = pObj.pPrevPath.value || '';
						oVideo.JSConfig.volume = pObj.pVolume.value;
						oVideo.JSConfig.autostart = pObj.pAutoplay.checked ? true : false;
						oVideo.JSConfig.width = w;
						oVideo.JSConfig.height = h;
					}
				}
				else
				{
					oVideo.flashvars= {file: path};
					if (!pObj.pLEditor.bBBCode)
					{
						if (pObj.pPrevPath)
							oVideo.flashvars.image = pObj.pPrevPath.value || '';
						oVideo.flashvars.volume = pObj.pVolume.value;
						oVideo.flashvars.autostart = pObj.pAutoplay.checked ? true : false;
					}
				}

				pVid.title= BX.message.Video + ': ' + path;
				pVid.style.width = w + 'px';
				pVid.style.height = h + 'px';
				if (pObj.pPrevPath && pObj.pPrevPath.value.length > 0)
					pVid.style.backgroundImage = 'url(' + pObj.pPrevPath.value + ')';

				oVideo.id = pObj.videoId;
				pVid.id = pObj.pLEditor.SetBxTag(false, {tag: 'video', params: oVideo});
			}
			else
			{
				pObj.pLEditor.InsertHTML('');
			}
		}
	};
}

// Table
window.LHEDailogs['Table'] = function(pObj)
{
	return {
		title: BX.message.InsertTable,
		innerHTML : '<table>' +
			'<tr>' +
				'<td class="lhe-dialog-label lhe-label-imp"><label for="' + pObj.pLEditor.id + 'lhed_table_cols">' + BX.message.TableCols + ':</label></td>' +
				'<td class="lhe-dialog-param"><input type="text" size="4" value="3" id="' + pObj.pLEditor.id + 'lhed_table_cols"></td>' +
				'<td class="lhe-dialog-label lhe-label-imp"><label for="' + pObj.pLEditor.id + 'lhed_table_rows">' + BX.message.TableRows + ':</label></td>' +
				'<td class="lhe-dialog-param"><input type="text" size="4" value="3" id="' + pObj.pLEditor.id + 'lhed_table_rows"></td>' +
			'</tr>' +
			'<tr>' +
				'<td colSpan="4">' +
					'<span>' + BX.message.TableModel + ': </span>' +
					'<div class="lhed-model-cont" id="' + pObj.pLEditor.id + 'lhed_table_model" ><div>' +
				'</td>' +
			'</tr></table>',
		width: 350,
		OnLoad: function(oDialog)
		{
			pObj.pCols = BX(pObj.pLEditor.id + "lhed_table_cols");
			pObj.pRows = BX(pObj.pLEditor.id + "lhed_table_rows");
			pObj.pModelDiv = BX(pObj.pLEditor.id + "lhed_table_model");

			pObj.pLEditor.focus(pObj.pCols, true);

			if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode && pObj.pLEditor.pTextarea.selectionStart != undefined)
			{
				pObj._selectionStart = pObj.pLEditor.pTextarea.selectionStart;
				pObj._selectionEnd = pObj.pLEditor.pTextarea.selectionEnd;
			}

			var BuildModel = function()
			{
				BX.cleanNode(pObj.pModelDiv);
				var
					rows = parseInt(pObj.pRows.value),
					cells = parseInt(pObj.pCols.value);

				if (rows > 0 && cells > 0)
				{
					var tbl = pObj.pModelDiv.appendChild(BX.create("TABLE", {props: {className: "lhe-table-model"}}));
					var i, j, row, cell;
					for(i = 0; i < rows; i++)
					{
						row = tbl.insertRow(-1);
						for(j = 0; j < cells; j++)
							row.insertCell(-1).innerHTML = "&nbsp;";
					}
				}
			};

			pObj.pCols.onkeyup = pObj.pRows.onkeyup = BuildModel;
			BuildModel();
		},
		OnSave: function()
		{
			var
				rows = parseInt(pObj.pRows.value),
				cells = parseInt(pObj.pCols.value),
				t1 = "<", t2 = ">", res = "", cellHTML = "<br _moz_editor_bogus_node=\"on\" />";

			if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode)
			{
				t1 = "[";
				t2 = "]";
				cellHTML = " ";
			}

			if (rows > 0 && cells > 0)
			{
				res = "\n" + t1 + "TABLE" + t2 + "\n";

				var i, j;
				for(i = 0; i < rows; i++)
				{
					res += "\t" + t1 + "TR" + t2 + "\n";
					for(j = 0; j < cells; j++)
						res += "\t\t" + t1 + "TD" + t2 + cellHTML + t1 + "/TD" + t2 + "\n";
					res += "\t" + t1 + "/TR" + t2 + "\n";
				}

				res += t1 + "/TABLE" + t2 + "\n";
			}

			if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode)
			{
				if (pObj._selectionStart != undefined && pObj._selectionEnd != undefined)
				{
					pObj.pLEditor.pTextarea.selectionStart = pObj._selectionStart;
					pObj.pLEditor.pTextarea.selectionEnd = pObj._selectionEnd;
				}
				pObj.pLEditor.WrapWith("", "", res);
			}
			else if (pObj.pLEditor.sEditorMode == 'code' && !pObj.pLEditor.bBBCode)
			{
				// ?
			}
			else // WYSIWYG
			{
				pObj.pLEditor.InsertHTML(res + "</br>");
			}
		}
	};
}

// Ordered and unordered lists for BBCodes
window.LHEDailogs['List'] = function(pObj)
{
	return {
		title: pObj.arParams.bOrdered ? BX.message.OrderedList : BX.message.UnorderedList,
		innerHTML : '<table class="lhe-dialog-list-table"><tr>' +
				'<td>' + BX.message.ListItems + ':</td>' +
			'</tr><tr>' +
				'<td class="lhe-dialog-list-items"><div id="' + pObj.pLEditor.id + 'lhed_list_items"></div></td>' +
			'</tr><tr>' +
				'<td align="right"><a href="javascript:void(0);" title="' + BX.message.AddLITitle + '" id="' + pObj.pLEditor.id + 'lhed_list_more">' + BX.message.AddLI + '</a>' +
			'</tr><table>',
		width: 350,
		OnLoad: function(oDialog)
		{
			if (pObj.pLEditor.sEditorMode == 'code' && pObj.pLEditor.bBBCode && pObj.pLEditor.pTextarea.selectionStart != undefined)
			{
				pObj._selectionStart = pObj.pLEditor.pTextarea.selectionStart;
				pObj._selectionEnd = pObj.pLEditor.pTextarea.selectionEnd;
			}

			pObj.pItemsCont = BX(pObj.pLEditor.id + "lhed_list_items");
			pObj.pMore = BX(pObj.pLEditor.id + "lhed_list_more");

			BX.cleanNode(pObj.pItemsCont);
			pObj.pList = pObj.pItemsCont.appendChild(BX.create(pObj.arParams.bOrdered ? "OL" : "UL"));

			var firstItemText = "";
			if (pObj.prevTextSelection)
				firstItemText = pObj.prevTextSelection;

			var addItem = function(val, pPrev, bFocus, bCheck)
			{
				var pLi = BX.create("LI");
				var pInput = pLi.appendChild(BX.create("INPUT", {props: {type: 'text', value: val || "", size: 35}}));

				if (pPrev && pPrev.nextSibling)
					pObj.pList.insertBefore(pLi, pPrev.nextSibling);
				else
					pObj.pList.appendChild(pLi);

				pInput.onkeyup = function(e)
				{
					if (!e)
						e = window.event;

					if (e.keyCode == 13) // Enter
					{
						addItem("", this.parentNode, true, true);
						return BX.PreventDefault(e);
					}
				}

				pLi.appendChild(BX.create("IMG", {props: {src: pObj.pLEditor.oneGif, className: "lhe-dialog-list-del", title: BX.message.DelListItem}})).onclick = function()
				{
					// del list item
					var pLi = BX.findParent(this, {tagName: 'LI'});
					if (pLi)
						pLi.parentNode.removeChild(pLi);
				};

				if(bFocus !== false)
					pObj.pLEditor.focus(pInput);

				if (bCheck === true)
				{
					var arInp = pObj.pList.getElementsByTagName("INPUT"), i, l = arInp.length;
					for (i = 0; i < l; i++)
						arInp[i].onfocus = (i == l - 1) ? function(){addItem("", false, false, true);} : null;
				}
			};

			addItem(firstItemText, false, firstItemText == "");
			addItem("", false, firstItemText != "");
			addItem("", false, false, true);

			pObj.pMore.onclick = function(){addItem("", false, true, true);};
		},
		OnSave: function()
		{
			var
				res = "",
				arInputs = pObj.pList.getElementsByTagName("INPUT"),
				i, l = arInputs.length;

			if (l == 0)
				return;

			res = "\n[LIST";
			if (pObj.arParams.bOrdered)
				res += "=1";
			res += "]\n";

			var i, j;
			for (i = 0; i < l; i++)
			{
				if (arInputs[i].value != "" || i == 0)
					res += "[*]" + arInputs[i].value + "\n";
			}
			res += "[/LIST]" + "\n";

			if (pObj._selectionStart != undefined && pObj._selectionEnd != undefined)
			{
				pObj.pLEditor.pTextarea.selectionStart = pObj._selectionStart;
				pObj.pLEditor.pTextarea.selectionEnd = pObj._selectionEnd;
			}
			pObj.pLEditor.WrapWith("", "", res);
		}
	};
}



/* End */
;
; /* Start:/bitrix/js/fileman/light_editor/le_controls.js*/
function LHEButton(oBut, pLEditor)
{
	if (!oBut.name)
		oBut.name = oBut.id;

	if (!oBut.title)
		oBut.title = oBut.name;
	this.disabled = false;

	this.pLEditor = pLEditor;

	this.oBut = oBut;
	if (this.oBut && typeof this.oBut.OnBeforeCreate == 'function')
		this.oBut = this.oBut.OnBeforeCreate(this.pLEditor, this.oBut);

	if(this.oBut)
		this.Create();
}

LHEButton.prototype = {
	Create: function ()
	{
		var _this = this;
		this.pCont = BX.create("DIV", {props: {className: 'lhe-button-cont'}});

		this.pWnd = this.pCont.appendChild(BX.create("IMG", {props: {src: this.oBut.src || this.pLEditor.oneGif, title: this.oBut.title, className: "lhe-button lhe-button-normal", id: "lhe_btn_" + this.oBut.id.toLowerCase()}}));

		if (this.oBut.disableOnCodeView)
			BX.addCustomEvent(this.pLEditor, "OnChangeView", BX.proxy(this.OnChangeView, this));

		if (this.oBut.width)
		{
			this.pCont.style.width = parseInt(this.oBut.width) + 5 + "px";
			this.pWnd.style.width = parseInt(this.oBut.width) + "px";
		}

		this.pWnd.onmouseover = function(e){_this.OnMouseOver(e, this)};
		this.pWnd.onmouseout = function(e){_this.OnMouseOut(e, this)};
		this.pWnd.onmousedown = function(e){_this.OnClick(e, this);};
	},

	OnMouseOver: function (e, pEl)
	{
		if(this.disabled)
			return;
		pEl.className = 'lhe-button lhe-button-over';
	},

	OnMouseOut: function (e, pEl)
	{
		if(this.disabled)
			return;

		if(this.checked)
			pEl.className = 'lhe-button lhe-button-checked';
		else
			pEl.className = 'lhe-button lhe-button-normal';
	},

	OnClick: function (e, pEl)
	{
		if(this.disabled)
			return false;

		var res = false;
		if (this.pLEditor.sEditorMode == 'code' && this.pLEditor.bBBCode && typeof this.oBut.bbHandler == 'function')
		{
			res = this.oBut.bbHandler(this) !== false;
		}
		else
		{
			if(typeof this.oBut.handler == 'function')
				res = this.oBut.handler(this) !== false;

			if(this.pLEditor.sEditorMode != 'code' && !res && this.oBut.cmd)
				res = this.pLEditor.executeCommand(this.oBut.cmd);

			this.pLEditor.SetFocus();
			BX.defer(this.pLEditor.SetFocus, this.pLEditor)();
		}

		return res;
	},

	Check: function (bFlag)
	{
		if(bFlag == this.checked || this.disabled)
			return;

		this.checked = bFlag;
		if(this.checked)
			BX.addClass(this.pWnd, 'lhe-button-checked');
		else
			BX.removeClass(this.pWnd, 'lhe-button-checked');
	},

	Disable: function (bFlag)
	{
		if(bFlag == this.disabled)
			return false;
		this.disabled = bFlag;
		if(bFlag)
			BX.addClass(this.pWnd, 'lhe-button-disabled');
		else
			BX.removeClass(this.pWnd, 'lhe-button-disabled');
	},

	OnChangeView: function()
	{
		if (this.oBut.disableOnCodeView)
			this.Disable(this.pLEditor.sEditorMode == 'code');
	}
}

// Dialog
function LHEDialog(arParams, pLEditor)
{
	this.pSel = arParams.obj || false;
	this.pLEditor = pLEditor;
	this.id = arParams.id;
	this.arParams = arParams;
	this.Create();
};

LHEDialog.prototype = {
	Create: function()
	{
		if (!window.LHEDailogs[this.id] || typeof window.LHEDailogs[this.id] != 'function')
			return;

		var oDialog = window.LHEDailogs[this.id](this);
		if (!oDialog)
			return;

		this.prevTextSelection = "";
		if (this.pLEditor.sEditorMode == 'code')
			this.prevTextSelection = this.pLEditor.GetTextSelection();

		this.pLEditor.SaveSelectionRange();

		if (BX.browser.IsIE() && !this.arParams.bCM && this.pLEditor.sEditorMode != 'code')
		{
			if (this.pLEditor.GetSelectedText(this.pLEditor.oPrevRange) == '')
			{
				this.pLEditor.InsertHTML('<img id="bx_lhe_temp_bogus_node" src="' + this.pLEditor.oneGif + '" _moz_editor_bogus_node="on" style="border: 0px !important;"/>');
				this.pLEditor.oPrevRange = this.pLEditor.GetSelectionRange();
			}
		}

		var arDConfig = {
			title : oDialog.title || this.name || '',
			width: oDialog.width || 500,
			height: 200,
			resizable: false
		};

		if (oDialog.height)
			arDConfig.height = oDialog.height;

		if (oDialog.resizable)
		{
			arDConfig.resizable = true;
			arDConfig.min_width = oDialog.min_width;
			arDConfig.min_height = oDialog.min_height;
			arDConfig.resize_id = oDialog.resize_id;
		}

		window.obLHEDialog = new BX.CDialog(arDConfig);

		var _this = this;
		BX.addCustomEvent(obLHEDialog, 'onWindowUnRegister', function()
		{
			_this.pLEditor.bPopup = false;
			if (obLHEDialog.DIV && obLHEDialog.DIV.parentNode)
				obLHEDialog.DIV.parentNode.removeChild(window.obLHEDialog.DIV);

			if (_this.arParams.bEnterClose !== false)
				BX.unbind(window, "keydown", BX.proxy(_this.OnKeyPress, _this));
		});

		if (this.arParams.bEnterClose !== false)
			BX.bind(window, "keydown", BX.proxy(this.OnKeyPress, this));

		this.pLEditor.bPopup = true;
		obLHEDialog.Show();
		obLHEDialog.SetContent(oDialog.innerHTML);

		if (oDialog.OnLoad && typeof oDialog.OnLoad == 'function')
			oDialog.OnLoad();

		obLHEDialog.oDialog = oDialog;
		obLHEDialog.SetButtons([
			new BX.CWindowButton(
				{
					title: BX.message.DialogSave,
					action: function()
					{
						var res = true;
						if (oDialog.OnSave && typeof oDialog.OnSave == 'function')
						{
							_this.pLEditor.RestoreSelectionRange();
							res = oDialog.OnSave();
						}
						if (res !== false)
							window.obLHEDialog.Close();
					}
				}),
			obLHEDialog.btnCancel
		]);
		BX.addClass(obLHEDialog.PARTS.CONTENT, "lhe-dialog");

		obLHEDialog.adjustSizeEx();
		// Hack for Opera
		setTimeout(function(){obLHEDialog.Move(1, 1);}, 100);
	},

	OnKeyPress: function(e)
	{
		if(!e)
			e = window.event
		if (e.keyCode == 13)
			obLHEDialog.PARAMS.buttons[0].emulate();
	},

	Close: function(floatDiv)
	{
		this.RemoveOverlay();
		if (!floatDiv)
			floatDiv = this.floatDiv;
		if (!floatDiv || !floatDiv.parentNode)
			return;

		this.pLEditor.bDialogOpened = false;
		jsFloatDiv.Close(floatDiv);
		floatDiv.parentNode.removeChild(floatDiv);
		if (window.jsPopup)
			jsPopup.AllowClose();
	},

	CreateOverlay: function()
	{
		var ws = BX.GetWindowScrollSize();
		this.overlay = document.body.appendChild(BX.create("DIV", {props: {id: this.overlay_id, className: "lhe-overlay"}, style: {zIndex: this.zIndex - 5, width: ws.scrollWidth + "px", height: ws.scrollHeight + "px"}}));
		this.overlay.ondrag = BX.False;
		this.overlay.onselectstart = BX.False;
	},

	RemoveOverlay: function()
	{
		if (this.overlay && this.overlay.parentNode)
			this.overlay.parentNode.removeChild(this.overlay);
	}
}

// List
function LHEList(oBut, pLEditor)
{
	if (!oBut.name)
		oBut.name = oBut.id;
	if (!oBut.title)
		oBut.title = oBut.name;
	this.disabled = false;
	this.zIndex = 5000;

	this.pLEditor = pLEditor;
	this.oBut = oBut;
	this.Create();
	this.bRunOnOpen = false;
	if (this.oBut && typeof this.oBut.OnBeforeCreate == 'function')
		this.oBut = this.oBut.OnBeforeCreate(this.pLEditor, this.oBut);

	if (this.oBut)
	{
		if (oBut.OnCreate && typeof oBut.OnCreate == 'function')
			this.bRunOnOpen = true;

		if (this.oBut.disableOnCodeView)
			BX.addCustomEvent(this.pLEditor, "OnChangeView", BX.proxy(this.OnChangeView, this));
	}
	else
	{
		BX.defer(function(){BX.remove(this.pCont);}, this)();
	}
}

LHEList.prototype = {
	Create: function ()
	{
		var _this = this;

		this.pWnd = BX.create("IMG", {props: {src: this.pLEditor.oneGif, title: this.oBut.title, className: "lhe-button lhe-button-normal", id: "lhe_btn_" + this.oBut.id.toLowerCase()}});

		this.pWnd.onmouseover = function(e){_this.OnMouseOver(e, this)};
		this.pWnd.onmouseout = function(e){_this.OnMouseOut(e, this)};
		this.pWnd.onmousedown = function(e){_this.OnClick(e, this)};

		this.pCont = BX.create("DIV", {props: {className: 'lhe-button-cont'}});
		this.pCont.appendChild(this.pWnd);

		this.pValuesCont = document.body.appendChild(BX.create("DIV", {props: {className: "lhe-list-val-cont"}, style: {zIndex: this.zIndex}}));

		if (this.oBut && typeof this.oBut.OnAfterCreate == 'function')
			this.oBut.OnAfterCreate(this.pLEditor, this);
	},

	OnChangeView: function()
	{
		if (this.oBut.disableOnCodeView)
			this.Disable(this.pLEditor.sEditorMode == 'code');
	},

	Disable: function (bFlag)
	{
		if(bFlag == this.disabled)
			return false;
		this.disabled = bFlag;
		if(bFlag)
			BX.addClass(this.pWnd, 'lhe-button-disabled');
		else
			BX.removeClass(this.pWnd, 'lhe-button-disabled');
	},

	OnMouseOver: function (e, pEl)
	{
		if(this.disabled)
			return;
		BX.addClass(pEl, 'lhe-button-over');
	},

	OnMouseOut: function (e, pEl)
	{
		if(this.disabled)
			return;

		BX.removeClass(pEl, 'lhe-button-over');
		if(this.checked)
			BX.addClass(pEl, 'lhe-button-checked');

		// if(this.checked)
		// pEl.className = 'lhe-button lhe-button-checked';
		// else
		// pEl.className = 'lhe-button lhe-button-normal';
	},

	OnKeyPress: function(e)
	{
		if(!e) e = window.event
		if(e.keyCode == 27)
			this.Close();
	},

	OnClick: function (e, pEl)
	{
		this.pLEditor.SaveSelectionRange();

		if(this.disabled)
			return false;

		if (this.bOpened)
			return this.Close();

		this.Open();
	},

	Close: function ()
	{
		this.pValuesCont.style.display = 'none';
		this.pLEditor.oTransOverlay.Hide();

		BX.unbind(window, "keypress", BX.proxy(this.OnKeyPress, this));
		BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));

		this.bOpened = false;
	},

	CheckClose: function(e)
	{
		if (!this.bOpened)
			return BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));

		var pEl;
		if (e.target)
			pEl = e.target;
		else if (e.srcElement)
			pEl = e.srcElement;
		if (pEl.nodeType == 3)
			pEl = pEl.parentNode;

		if (!BX.findParent(pEl, {className: 'lhe-colpick-cont'}))
			this.Close();
	},

	Open: function ()
	{
		if (this.bRunOnOpen)
		{
			if (this.oBut.OnCreate && typeof this.oBut.OnCreate == 'function')
				this.oBut.OnCreate(this);
			this.bRunOnOpen = false;
		}

		this.pValuesCont.style.display = 'block';
		var
			pOverlay = this.pLEditor.oTransOverlay.Show(),
			pos = BX.align(BX.pos(this.pWnd), parseInt(this.pValuesCont.offsetWidth) || 150, parseInt(this.pValuesCont.offsetHeight) || 200),
			_this = this;

		BX.bind(window, "keypress", BX.proxy(this.OnKeyPress, this));
		pOverlay.onclick = function(){_this.Close()};

		this.pLEditor.oPrevRange = this.pLEditor.GetSelectionRange();
		if (this.oBut.OnOpen && typeof this.oBut.OnOpen == 'function')
			this.oBut.OnOpen(this);

		this.pValuesCont.style.top = pos.top + 'px';
		this.pValuesCont.style.left = pos.left + 'px';
		this.bOpened = true;

		setTimeout(function()
		{
			BX.bind(document, 'mousedown', BX.proxy(_this.CheckClose, _this));
		},100);
	},

	SelectItem: function(bSelect)
	{
		var pItem = this.arItems[this.pSelectedItemId || 0].pWnd;
		if (bSelect)
		{
			pItem.style.border = '1px solid #4B4B6F';
			pItem.style.backgroundColor = '#FFC678';
		}
		else
		{
			pItem.style.border = '';
			pItem.style.backgroundColor = '';
		}
	}
}

function LHETransOverlay(arParams, pLEditor)
{
	this.pLEditor = pLEditor;
	this.id = 'lhe_trans_overlay';
	this.zIndex = arParams.zIndex || 100;
}

LHETransOverlay.prototype =
{
	Create: function ()
	{
		this.bCreated = true;
		this.bShowed = false;
		var ws = BX.GetWindowScrollSize();
		this.pWnd = document.body.appendChild(BX.create("DIV", {props: {id: this.id, className: "lhe-trans-overlay"}, style: {zIndex: this.zIndex, width: ws.scrollWidth + "px", height: ws.scrollHeight + "px"}}));

		this.pWnd.ondrag = BX.False;
		this.pWnd.onselectstart = BX.False;
	},

	Show: function(arParams)
	{
		if (!this.bCreated)
			this.Create();
		this.bShowed = true;
		this.pLEditor.bPopup = true;

		var ws = BX.GetWindowScrollSize();

		this.pWnd.style.display = 'block';
		this.pWnd.style.width = ws.scrollWidth + "px";
		this.pWnd.style.height = ws.scrollHeight + "px";

		if (!arParams)
			arParams = {};

		if (arParams.zIndex)
			this.pWnd.style.zIndex = arParams.zIndex;

		BX.bind(window, "resize", BX.proxy(this.Resize, this));
		return this.pWnd;
	},

	Hide: function ()
	{
		var _this = this;
		setTimeout(function(){_this.pLEditor.bPopup = false;}, 50);
		if (!this.bShowed)
			return;
		this.bShowed = false;
		this.pWnd.style.display = 'none';
		BX.unbind(window, "resize", BX.proxy(this.Resize, this));
		this.pWnd.onclick = null;
	},

	Resize: function ()
	{
		if (this.bCreated)
			this.pWnd.style.width = BX.GetWindowScrollSize().scrollWidth + "px";
	}
}


function LHEColorPicker(oPar, pLEditor)
{
	if (!oPar.name)
		oPar.name = oPar.id;
	if (!oPar.title)
		oPar.title = oPar.name;
	this.disabled = false;
	this.bCreated = false;
	this.bOpened = false;
	this.zIndex = 5000;

	this.pLEditor = pLEditor;

	this.oPar = oPar;
	this.BeforeCreate();
}

LHEColorPicker.prototype = {
	BeforeCreate: function()
	{
		var _this = this;
		this.pWnd = BX.create("IMG", {props: {src: this.pLEditor.oneGif, title: this.oPar.title, className: "lhe-button lhe-button-normal", id: "lhe_btn_" + this.oPar.id.toLowerCase()}});

		this.pWnd.onmouseover = function(e){_this.OnMouseOver(e, this)};
		this.pWnd.onmouseout = function(e){_this.OnMouseOut(e, this)};
		this.pWnd.onmousedown = function(e){_this.OnClick(e, this)};
		this.pCont = BX.create("DIV", {props: {className: 'lhe-button-cont'}});
		this.pCont.appendChild(this.pWnd);

		if (this.oPar && typeof this.oPar.OnBeforeCreate == 'function')
			this.oPar = this.oPar.OnBeforeCreate(this.pLEditor, this.oPar);

		if (this.oPar.disableOnCodeView)
			BX.addCustomEvent(this.pLEditor, "OnChangeView", BX.proxy(this.OnChangeView, this));
	},

	Create: function ()
	{
		var _this = this;
		this.pColCont = document.body.appendChild(BX.create("DIV", {props: {className: "lhe-colpick-cont"}, style: {zIndex: this.zIndex}}));

		var
			arColors = this.pLEditor.arColors,
			row, cell, colorCell,
			tbl = BX.create("TABLE", {props: {className: 'lha-colpic-tbl'}}),
			i, l = arColors.length;

		row = tbl.insertRow(-1);
		cell = row.insertCell(-1);
		cell.colSpan = 8;
		var defBut = cell.appendChild(BX.create("SPAN", {props: {className: 'lha-colpic-def-but'}, text: BX.message.DefaultColor}));
		defBut.onmouseover = function()
		{
			this.className = 'lha-colpic-def-but lha-colpic-def-but-over';
			colorCell.style.backgroundColor = 'transparent';
		};
		defBut.onmouseout = function(){this.className = 'lha-colpic-def-but';};
		defBut.onmousedown = function(e){_this.Select(false);}

		colorCell = row.insertCell(-1);
		colorCell.colSpan = 8;
		colorCell.className = 'lha-color-inp-cell';
		colorCell.style.backgroundColor = arColors[38];

		for(i = 0; i < l; i++)
		{
			if (Math.round(i / 16) == i / 16) // new row
				row = tbl.insertRow(-1);

			cell = row.insertCell(-1);
			cell.innerHTML = '&nbsp;';
			cell.className = 'lha-col-cell';
			cell.style.backgroundColor = arColors[i];
			cell.id = 'lhe_color_id__' + i;

			cell.onmouseover = function (e)
			{
				this.className = 'lha-col-cell lha-col-cell-over';
				colorCell.style.backgroundColor = arColors[this.id.substring('lhe_color_id__'.length)];
			};
			cell.onmouseout = function (e){this.className = 'lha-col-cell';};
			cell.onmousedown = function (e)
			{
				var k = this.id.substring('lhe_color_id__'.length);
				_this.Select(arColors[k]);
			};
		}

		this.pColCont.appendChild(tbl);
		this.bCreated = true;
	},

	OnChangeView: function()
	{
		if (this.oPar.disableOnCodeView)
			this.Disable(this.pLEditor.sEditorMode == 'code');
	},

	Disable: function (bFlag)
	{
		if(bFlag == this.disabled)
			return false;
		this.disabled = bFlag;
		if(bFlag)
			BX.addClass(this.pWnd, 'lhe-button-disabled');
		else
			BX.removeClass(this.pWnd, 'lhe-button-disabled');
	},

	OnClick: function (e, pEl)
	{
		this.pLEditor.SaveSelectionRange();

		if(this.disabled)
			return false;

		if (!this.bCreated)
			this.Create();

		if (this.bOpened)
			return this.Close();

		this.Open();
	},

	Open: function ()
	{
		var
			pOverlay = this.pLEditor.oTransOverlay.Show(),
			pos = BX.align(BX.pos(this.pWnd), 325, 155),
			_this = this;

		this.pLEditor.oPrevRange = this.pLEditor.GetSelectionRange();

		BX.bind(window, "keypress", BX.proxy(this.OnKeyPress, this));
		pOverlay.onclick = function(){_this.Close()};

		this.pColCont.style.display = 'block';
		this.pColCont.style.top = pos.top + 'px';
		this.pColCont.style.left = pos.left + 'px';
		this.bOpened = true;

		setTimeout(function()
		{
			BX.bind(document, 'mousedown', BX.proxy(_this.CheckClose, _this));
		},100);
	},

	Close: function ()
	{
		this.pColCont.style.display = 'none';
		this.pLEditor.oTransOverlay.Hide();
		BX.unbind(window, "keypress", BX.proxy(this.OnKeyPress, this));
		BX.unbind(window, 'mousedown', BX.proxy(this.CheckClose, this));

		this.bOpened = false;
	},

	CheckClose: function(e)
	{
		if (!this.bOpened)
			return BX.unbind(document, 'mousedown', BX.proxy(this.CheckClose, this));

		var pEl;
		if (e.target)
			pEl = e.target;
		else if (e.srcElement)
			pEl = e.srcElement;
		if (pEl.nodeType == 3)
			pEl = pEl.parentNode;

		if (!BX.findParent(pEl, {className: 'lhe-colpick-cont'}))
			this.Close();
	},

	OnMouseOver: function (e, pEl)
	{
		if(this.disabled)
			return;
		pEl.className = 'lhe-button lhe-button-over';
	},

	OnMouseOut: function (e, pEl)
	{
		if(this.disabled)
			return;
		pEl.className = 'lhe-button lhe-button-normal';
	},

	OnKeyPress: function(e)
	{
		if(!e) e = window.event
		if(e.keyCode == 27)
			this.Close();
	},

	Select: function (color)
	{
		this.pLEditor.RestoreSelectionRange();

		if (this.oPar.OnSelect && typeof this.oPar.OnSelect == 'function')
			this.oPar.OnSelect(color, this);

		this.Close();
	}
};

// CONTEXT MENU FOR EDITING AREA
function LHEContextMenu(arParams, pLEditor)
{
	this.zIndex = arParams.zIndex;
	this.pLEditor = pLEditor;
	this.Create();
}

LHEContextMenu.prototype = {
	Create: function()
	{
		this.pref = 'LHE_CM_' + this.pLEditor.id.toUpperCase()+'_';
		this.oDiv = document.body.appendChild(BX.create('DIV', {props: {className: 'lhe-cm', id: this.pref + '_cont'}, style: {zIndex: this.zIndex}, html: '<table><tr><td class="lhepopup"><table id="' + this.pref + '_cont_items"><tr><td></td></tr></table></td></tr></table>'}));

		// Part of logic of JCFloatDiv.Show()   Prevent bogus rerendering window in IE... And SpeedUp first context menu calling
		document.body.appendChild(BX.create('IFRAME', {props: {id: this.pref + '_frame', src: "javascript:void(0)"}, style: {position: 'absolute', zIndex: this.zIndex - 5, left: '-1000px', top: '-1000px', visibility: 'hidden'}}));
		this.menu = new PopupMenu(this.pref + '_cont');
	},

	Show: function(arParams)
	{
		if (!arParams.pElement || !this.FetchAndBuildItems(arParams.pElement))
			return;

		try{this.pLEditor.SelectElement(arParams.pElement);}catch(e){}
		this.pLEditor.oPrevRange = this.pLEditor.GetSelectionRange();
		this.oDiv.style.width = parseInt(this.oDiv.firstChild.offsetWidth) + 'px';

		var
			_this = this,
			w = parseInt(this.oDiv.offsetWidth),
			h = parseInt(this.oDiv.offsetHeight),
			pOverlay = this.pLEditor.oTransOverlay.Show();
		pOverlay.onclick = function(){_this.Close()};
		BX.bind(window, "keypress", BX.proxy(this.OnKeyPress, this));

		arParams.oPos.right = arParams.oPos.left + w;
		arParams.oPos.bottom = arParams.oPos.top;

		this.menu.PopupShow(arParams.oPos);
	},

	Close: function()
	{
		this.menu.PopupHide();
		this.pLEditor.oTransOverlay.Hide();
		BX.unbind(window, "keypress", BX.proxy(this.OnKeyPress, this));
	},

	FetchAndBuildItems: function(pElement)
	{
		var pElementTemp,
			i, k,
			arMenuItems = [],
			arUsed = {},
			strPath, strPath1,
			__bxtagname = false;
		this.arSelectedElement = {};

		//Adding elements
		while(pElement && (pElementTemp = pElement.parentNode) != null)
		{
			if(pElementTemp.nodeType == 1 && pElement.tagName && (strPath = pElement.tagName.toUpperCase()) && strPath != 'TBODY' && !arUsed[strPath])
			{
				strPath1 = strPath;
				if (pElement.getAttribute && (__bxtagname = pElement.getAttribute('__bxtagname')))
					strPath1 = __bxtagname.toUpperCase();

				arUsed[strPath] = pElement;
				if(LHEContMenu[strPath1])
				{
					this.arSelectedElement[strPath1] = pElement;
					if (arMenuItems.length > 0)
						arMenuItems.push('separator');
					for(i = 0, k = LHEContMenu[strPath1].length; i < k; i++)
						arMenuItems.push(LHEContMenu[strPath1][i]);
				}
			}
			else
			{
				pElement = pElementTemp;
				continue;
			}
		}

		if (arMenuItems.length == 0)
			return false;

		//Cleaning menu
		var contTbl = document.getElementById(this.pref + '_cont_items');
		while(contTbl.rows.length>0)
			contTbl.deleteRow(0);
		return this.BuildItems(arMenuItems, contTbl);
	},

	BuildItems: function(arMenuItems, contTbl, parentName)
	{
		var n = arMenuItems.length;
		var _this = this;
		var arSubMenu = {};
		this.subgroup_parent_id = '';
		this.current_opened_id = '';

		var _hide = function()
		{
			var cs = document.getElementById("__curent_submenu");
			if (!cs)
				return;
			_over(cs);
			_this.current_opened_id = '';
			_this.subgroup_parent_id = '';
			cs.style.display = "none";
			cs.id = "";
		};

		var _over = function(cs)
		{
			if (!cs)
				return;
			var t = cs.parentNode.nextSibling;
			t.parentNode.className = '';
		};

		var _refresh = function() {setTimeout(function() {_this.current_opened_id = '';_this.subgroup_parent_id = '';}, 400);}
		var i, row, cell, el_params, _atr, _innerHTML, oItem;

		//Creation menu elements
		for(var i = 0; i < n; i++)
		{
			oItem = arMenuItems[i];
			row = contTbl.insertRow(-1);
			cell = row.insertCell(-1);
			if(oItem == 'separator')
			{
				cell.innerHTML = '<div class="popupseparator"></div>';
			}
			else
			{
				if (oItem.isgroup)
				{
					var c = BX.browser.IsIE() ? 'arrow_ie' : 'arrow';
					cell.innerHTML =
						'<div id="_oSubMenuDiv_' + oItem.id + '" style="position: relative;"></div>'+
							'<table cellpadding="0" cellspacing="0" class="popupitem" id="'+oItem.id+'">'+
							'	<tr>'+
							'		<td class="gutter"></td>'+
							'		<td class="item">' + oItem.name + '</td>' +
							'		<td class="'+c+'"></td>'+
							'	</tr>'+
							'</table>';
					var oTable = cell.childNodes[1];
					var _LOCAL_CACHE = {};
					arSubMenu[oItem.id] = oItem.elements;

					oTable.onmouseover = function(e)
					{
						var pTbl = this;
						pTbl.className = 'popupitem popupitemover';
						_over(document.getElementById("__curent_submenu"));
						setTimeout(function()
						{
							//pTbl.parentNode.className = 'popup_open_cell';
							if (_this.current_opened_id && _this.current_opened_id == _this.subgroup_parent_id)
							{
								_refresh();
								return;
							}
							if (pTbl.className == 'popupitem')
								return;
							_hide();
							_this.current_opened_id = pTbl.id;

							var _oSubMenuDiv = document.getElementById("_oSubMenuDiv_" + pTbl.id);
							var left = parseInt(oTable.offsetWidth) + 1 + 'px';
							var oSubMenuDiv = BX.create('DIV', {props: {className : 'popupmenu'}, style: {position: 'absolute', zIndex: 1500, left: left, top: '-1px'}});

							_oSubMenuDiv.appendChild(oSubMenuDiv);
							oSubMenuDiv.onmouseover = function(){pTbl.parentNode.className = 'popup_open_cell';};

							var contTbl = oSubMenuDiv.appendChild(BX.create('TABLE', {props: {cellPadding:0, cellSpacing:0}}));
							_this.BuildItems(arSubMenu[pTbl.id], contTbl, pTbl.id);

							oSubMenuDiv.style.display = "block";
							oSubMenuDiv.id = "__curent_submenu";
						}, 400);
					};
					oTable.onmouseout = function(e){this.className = 'popupitem';};
					continue;
				}

				_innerHTML =
					'<table class="popupitem" id="lhe_cm__' + oItem.id + '"><tr>' +
						'	<td class="gutter"><div class="lhe-button" id="lhe_btn_' + oItem.id.toLowerCase()+'"></div></td>' +
						'	<td class="item">' + (oItem.name_edit || oItem.name) + '</td>' +
						'</tr></table>';
				cell.innerHTML = _innerHTML;

				var oTable = cell.firstChild;
				oTable.onmouseover = function(e){this.className='popupitem popupitemover';}
				oTable.onmouseout = function(e){this.className = 'popupitem';};
				oTable.onmousedown = function(e){_this.OnClick(this);};
			}
		}

		this.oDiv.style.width = contTbl.parentNode.offsetWidth;
		return true;
	},

	OnClick: function(pEl)
	{
		var oItem = LHEButtons[pEl.id.substring('lhe_cm__'.length)];
		if(!oItem || oItem.disabled)
			return false;
		this.pLEditor.RestoreSelectionRange();

		var res = false;

		if(oItem.handler)
			res = oItem.handler(this) !== false;

		if(!res && oItem.cmd)
		{
			this.pLEditor.executeCommand(oItem.cmd);
			this.pLEditor.SetFocus();
		}

		this.Close();
	},

	OnKeyPress: function(e)
	{
		if(!e) e = window.event

		if(e.keyCode == 27)
			this.Close();
	}
}
/* End */
;
; /* Start:/bitrix/js/fileman/light_editor/le_core.js*/
function JCLightHTMLEditor(arConfig) {this.Init(arConfig);}

JCLightHTMLEditor.items = {};

JCLightHTMLEditor.prototype = {
Init: function(arConfig)
{
	this.id = arConfig.id;
	JCLightHTMLEditor.items[this.id] = this;

	var _this = this;
	this.arConfig = arConfig;
	this.bxTags = {};

	this.bPopup = false;
	this.buttonsIndex = {};
	this.parseAlign = true;
	this.parseTable = true;
	this.lastCursorId = 'bxed-last-cursor';
	this.bHandleOnPaste = this.arConfig.bHandleOnPaste !== false;

	this.arBBTags = ['p', 'u', 'div', 'table', 'tr', 'td', 'th', 'img', 'a', 'center', 'left', 'right', 'justify'];
	this._turnOffCssCount = 0;

	if (this.arConfig.arBBTags)
		this.arBBTags = this.arBBTags.concat(this.arConfig.arBBTags);

	this.arConfig.width = this.arConfig.width ? parseInt(this.arConfig.width) + (this.arConfig.width.indexOf('%') == -1 ? "px" : '%') : "100%";
	this.arConfig.height = this.arConfig.height ? parseInt(this.arConfig.height) + (this.arConfig.height.indexOf('%') == -1 ? "px" : '%') : "100%";
	this.SetConstants();
	this.sEditorMode = 'html';
	this.toolbarLineCount = 1;

	this.CACHE = {};
	this.arVideos = {};

	// Set content from config;
	this.content = this.arConfig.content;
	this.oSpecialParsers = {};
	BX.onCustomEvent(window, 'LHE_OnBeforeParsersInit', [this]);

	this.oSpecialParsers.cursor = {
		Parse: function(sName, sContent, pLEditor)
		{
			return sContent.replace(/#BXCURSOR#/ig, '<span id="' + pLEditor.lastCursorId + '"></span>');
		},
		UnParse: function(bxTag, pNode, pLEditor)
		{
			return '#BXCURSOR#';
		}
	};

	if (arConfig.parsers)
	{
		for (var p in arConfig.parsers)
		{
			if (arConfig.parsers[p])
				this.oSpecialParsers[p] = arConfig.parsers[p];
		}
	}

	this.bDialogOpened = false;

	// Sceleton
	this.pFrame = BX('bxlhe_frame_' + this.id);
	if (!this.pFrame)
		return;

	this.pFrame.style.display = "block";

	this.pFrame.style.width = this.arConfig.width;
	this.pFrame.style.height = this.arConfig.height;

	this.pFrameTable = this.pFrame.firstChild;
	this.pButtonsCell = this.pFrameTable.rows[0].cells[0];
	this.pButtonsCont = this.pButtonsCell.firstChild;
	this.pEditCont = this.pFrameTable.rows[1].cells[0];

	if (this.arConfig.height.indexOf('%') == -1)
	{
		var h = parseInt(this.arConfig.height) - this.toolbarLineCount * 27;
		if (h > 0)
			this.pEditCont.style.height = h + 'px';
	}

	// iFrame
	this.CreateFrame();

	// Textarea
	this.pSourceDiv = this.pEditCont.appendChild(BX.create("DIV", {props: {className: 'lha-source-div' }}));
	this.pTextarea = this.pSourceDiv.appendChild(BX.create("TEXTAREA", {props: {className: 'lha-textarea', rows: 25, id: this.arConfig.inputId}}));
	this.pHiddenInput = this.pFrame.appendChild(BX.create("INPUT", {props: {type: 'hidden', name: this.arConfig.inputName}}));

	this.pTextarea.onfocus = function(){_this.bTextareaFocus = true;};
	this.pTextarea.onblur = function(){_this.bTextareaFocus = false;};

	this.pTextarea.style.fontFamily = this.arConfig.fontFamily;
	this.pTextarea.style.fontSize = this.arConfig.fontSize;
	this.pTextarea.style.fontSize = this.arConfig.lineHeight;

	if (this.pHiddenInput.form)
	{
		BX.bind(this.pHiddenInput.form, 'submit', function(){
			try{
				_this.SaveContent();
				_this.pHiddenInput.value = _this.pTextarea.value = _this.pHiddenInput.value.replace(/#BXCURSOR#/ig, '');
			}
			catch(e){}
		});
	}

	// Sort smiles
	if (this.arConfig.arSmiles && this.arConfig.arSmiles.length > 0)
	{
		this.sortedSmiles = [];
		var i, l, smile, j, k, arCodes;
		for (i = 0, l = this.arConfig.arSmiles.length; i < l; i++)
		{
			smile = this.arConfig.arSmiles[i];
			if (!smile['codes'] || smile['codes'] == smile['code'])
			{
				this.sortedSmiles.push(smile);
			}
			else if(smile['codes'].length > 0)
			{
				arCodes = smile['codes'].split(' ');
				for(j = 0, k = arCodes.length; j < k; j++)
					this.sortedSmiles.push({name: smile.name, path: smile.path, code: arCodes[j]});
			}
		}

		//this.sortedSmiles = BX.clone(this.arConfig.arSmiles);
		this.sortedSmiles = this.sortedSmiles.sort(function(a, b){return b.code.length - a.code.length;});
	}

	if (!this.arConfig.bBBCode && this.arConfig.bConvertContentFromBBCodes)
		this.arConfig.bBBCode = true;

	this.bBBCode = this.arConfig.bBBCode;
	if (this.bBBCode)
	{
		if (this.InitBBCode && typeof this.InitBBCode == 'function')
			this.InitBBCode();
	}

	this.bBBParseImageSize = this.arConfig.bBBParseImageSize;

	if (this.arConfig.bResizable)
	{
		if (this.arConfig.bManualResize)
		{
			this.pResizer = BX('bxlhe_resize_' + this.id);
			/*this.pResizer.style.width = this.arConfig.width;*/
			this.pResizer.title = BX.message.ResizerTitle;

			if (!this.arConfig.minHeight || parseInt(this.arConfig.minHeight) <= 0)
				this.arConfig.minHeight = 100;
			if (!this.arConfig.maxHeight || parseInt(this.arConfig.maxHeight) <= 0)
				this.arConfig.maxHeight = 2000;

			this.pResizer.unselectable = "on";
			this.pResizer.ondragstart = function (e){return BX.PreventDefault(e);};
			this.pResizer.onmousedown = function(){_this.InitResizer(); return false;};
		}

		if (this.arConfig.bAutoResize)
		{
			BX.bind(this.pTextarea, 'keydown', BX.proxy(this.AutoResize, this));
			BX.addCustomEvent(this, 'onShow', BX.proxy(this.AutoResize, this));
		}
	}

	// Add buttons
	this.AddButtons();

	// Check if ALIGN tags allowed
	this.parseAlign = !!(this.buttonsIndex['Justify'] || this.buttonsIndex['JustifyLeft']);
	this.parseTable = !!this.buttonsIndex['Table'];

	if (!this.parseAlign || !this.parseTable)
	{
		var arBBTags = [];
		for (var k in this.arBBTags)
		{
			// Align tags
			if (!this.parseAlign && (
				this.arBBTags[k] == 'center' || this.arBBTags[k] ==  'left' ||
				this.arBBTags[k] ==  'right' || this.arBBTags[k] == 'justify'
			))
				continue;

			// Table tags
			if (!this.parseTable && (
				this.arBBTags[k] == 'table' || this.arBBTags[k] ==  'tr' ||
					this.arBBTags[k] ==  'td' || this.arBBTags[k] == 'th'
				))
				continue;

			arBBTags.push(this.arBBTags[k]);
		}
		this.arBBTags = arBBTags;
	}

	this.SetEditorContent(this.content);
	this.oTransOverlay = new LHETransOverlay({zIndex: 995}, this);
	// TODO: Fix it
	//this.oContextMenu = new LHEContextMenu({zIndex: 1000}, this);

	BX.onCustomEvent(window, 'LHE_OnInit', [this, false]);

	// Init events
	BX.bind(this.pEditorDocument, 'click', BX.proxy(this.OnClick, this));
	BX.bind(this.pEditorDocument, 'mousedown', BX.proxy(this.OnMousedown, this));
	//BX.bind(this.pEditorDocument, 'contextmenu', BX.proxy(this.OnContextMenu, this));

	if (this.arConfig.bSaveOnBlur)
		BX.bind(document, "mousedown", BX.proxy(this.OnDocMousedown, this));

	if (this.arConfig.ctrlEnterHandler && typeof window[this.arConfig.ctrlEnterHandler] == 'function')
		this.ctrlEnterHandler = window[this.arConfig.ctrlEnterHandler];

	// Android < 4.x
	if (BX.browser.IsAndroid() && /Android\s[1-3].[0-9]/i.test(navigator.userAgent))
	{
		this.arConfig.bSetDefaultCodeView = true;
	}

	if (this.arConfig.bSetDefaultCodeView)
	{
		if (this.sourseBut)
			this.sourseBut.oBut.handler(this.sourseBut);
		else
			this.SetView('code');
	}

	BX.ready(function(){
		if (_this.pFrame.offsetWidth == 0 && _this.pFrame.offsetWidth == 0)
		{
			_this.onShowInterval = setInterval(function(){
				if (_this.pFrame.offsetWidth != 0 && _this.pFrame.offsetWidth != 0)
				{
					BX.onCustomEvent(_this, 'onShow');
					clearInterval(_this.onShowInterval);
				}
			}, 500);
		}
		else
		{
			BX.onCustomEvent(_this, 'onShow');
		}
	});

	this.adjustBodyInterval = 1000;
	this._AdjustBodyWidth();
	BX.removeClass(this.pButtonsCont, "lhe-stat-toolbar-cont-preload"); /**/
},

CreateFrame: function()
{
	if (this.iFrame && this.iFrame.parentNode)
	{
		this.pEditCont.removeChild(this.iFrame);
		this.iFrame = null;
	}

	this.iFrame = this.pEditCont.appendChild(BX.create("IFRAME", {props: { id: 'LHE_iframe_' + this.id, className: 'lha-iframe', src: "javascript:void(0)", frameborder: 0}}));

	if (this.iFrame.contentDocument && !BX.browser.IsIE())
		this.pEditorDocument = this.iFrame.contentDocument;
	else
		this.pEditorDocument = this.iFrame.contentWindow.document;
	this.pEditorWindow = this.iFrame.contentWindow;
},

ReInit: function(content)
{
	if (typeof content == 'undefined')
		content = '';
	this.SetContent(content);
	this.CreateFrame();
	this.SetEditorContent(this.content);
	this.SetFocus();

	BX.onCustomEvent(window, 'LHE_OnInit', [this, true]);
},

SetConstants: function()
{
	//this.reBlockElements = /^(BR|TITLE|TABLE|SCRIPT|TR|TBODY|P|DIV|H1|H2|H3|H4|H5|H6|ADDRESS|PRE|OL|UL|LI)$/i;
	this.reBlockElements = /^(TITLE|TABLE|SCRIPT|TR|TBODY|H1|H2|H3|H4|H5|H6|ADDRESS|PRE|OL|UL|LI)$/i;
	this.oneGif = this.arConfig.oneGif;
	this.imagePath = this.arConfig.imagePath;

	if (!this.arConfig.fontFamily)
		this.arConfig.fontFamily = 'Helvetica, Verdana, Arial, sans-serif';
	if (!this.arConfig.fontSize)
		this.arConfig.fontSize = '12px';
	if (!this.arConfig.lineHeight)
		this.arConfig.lineHeight = '16px';

	this.arColors = [
		'#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FFFFFF', '#EBEBEB', '#E1E1E1', '#D7D7D7', '#CCCCCC', '#C2C2C2', '#B7B7B7', '#ACACAC', '#A0A0A0', '#959595',
		'#EE1D24', '#FFF100', '#00A650', '#00AEEF', '#2F3192', '#ED008C', '#898989', '#7D7D7D', '#707070', '#626262', '#555', '#464646', '#363636', '#262626', '#111', '#000000',
		'#F7977A', '#FBAD82', '#FDC68C', '#FFF799', '#C6DF9C', '#A4D49D', '#81CA9D', '#7BCDC9', '#6CCFF7', '#7CA6D8', '#8293CA', '#8881BE', '#A286BD', '#BC8CBF', '#F49BC1', '#F5999D',
		'#F16C4D', '#F68E54', '#FBAF5A', '#FFF467', '#ACD372', '#7DC473', '#39B778', '#16BCB4', '#00BFF3', '#438CCB', '#5573B7', '#5E5CA7', '#855FA8', '#A763A9', '#EF6EA8', '#F16D7E',
		'#EE1D24', '#F16522', '#F7941D', '#FFF100', '#8FC63D', '#37B44A', '#00A650', '#00A99E', '#00AEEF', '#0072BC', '#0054A5', '#2F3192', '#652C91', '#91278F', '#ED008C', '#EE105A',
		'#9D0A0F', '#A1410D', '#A36209', '#ABA000', '#588528', '#197B30', '#007236', '#00736A', '#0076A4', '#004A80', '#003370', '#1D1363', '#450E61', '#62055F', '#9E005C', '#9D0039',
		'#790000', '#7B3000', '#7C4900', '#827A00', '#3E6617', '#045F20', '#005824', '#005951', '#005B7E', '#003562', '#002056', '#0C004B', '#30004A', '#4B0048', '#7A0045', '#7A0026'
	];

	this.systemCSS = "img.bxed-anchor{background-image: url(" + this.imagePath + "lhe_iconkit.gif)!important; background-position: -260px 0!important; height: 20px!important; width: 20px!important;}\n" +
		"body{font-family:" + this.arConfig.fontFamily + "; font-size: " + this.arConfig.fontSize + "; line-height:" + this.arConfig.lineHeight + "}\n" +
		"p{padding:0!important; margin: 0!important;}\n" +
		"span.bxed-noscript{color: #0000a0!important; padding: 2px!important; font-style:italic!important; font-size: 90%!important;}\n" +
		"span.bxed-noindex{color: #004000!important; padding: 2px!important; font-style:italic!important; font-size: 90%!important;}\n" +
		"img.bxed-flash{border: 1px solid #B6B6B8!important; background: url(" + this.imagePath + "flash.gif) #E2DFDA center center no-repeat !important;}\n" +
		"table{border: 1px solid #B6B6B8!important; border-collapse: collapse;}\n" +
		"table td{border: 1px solid #B6B6B8!important; padding: 2px 5px;}\n" +
		"img.bxed-video{border: 1px solid #B6B6B8!important; background-color: #E2DFDA!important; background-image: url(" + this.imagePath + "video.gif); background-position: center center!important; background-repeat:no-repeat!important;}\n" +
		"img.bxed-hr{padding: 2px!important; width: 100%!important; height: 2px!important;}\n";

	if (this.arConfig.documentCSS)
		this.systemCSS += "\n" + this.arConfig.documentCSS;

	this.tabNbsp = "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"; // &nbsp; x 6
	this.tabNbspRe1 = new RegExp(String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160), 'ig'); //
	this.tabNbspRe2 = new RegExp(String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + String.fromCharCode(160) + ' ', 'ig'); //
},

OnMousedown: function(e)
{
	if (!e)
		e = window.event;

	if (BX.browser.IsOpera() && e.shiftKey)
	{
		//this.OnContextMenu(e);
		//BX.PreventDefault(e);
	}
},

OnClick: function(e)
{
	//if(!e)
	//	e = window.event;
	//if (this.arConfig.bArisingToolbar)
	//	this.ShowFloatToolbar(true);
	this.CheckBr();
},

OnDblClick: function(e)
{
	return;
},

OnContextMenu: function(e, pElement)
{
	return;
	var
		_this = this,
		oFramePos,
		x, y;
	if (!e) e = this.pEditorWindow.event;

	if(e.pageX || e.pageY)
	{
		x = e.pageX - this.pEditorDocument.body.scrollLeft;
		y = e.pageY - this.pEditorDocument.body.scrollTop;
	}
	else if(e.clientX || e.clientY)
	{
		x = e.clientX;
		y = e.clientY;
	}

	oFramePos = this.CACHE['frame_pos'];
	if (!oFramePos)
		this.CACHE['frame_pos'] = oFramePos = BX.pos(this.pEditCont);

	x += oFramePos.left;
	y += oFramePos.top;

	var targ;
	if (e.target)
		targ = e.target;
	else if (e.srcElement)
		targ = e.srcElement;
	if (targ.nodeType == 3) // defeat Safari bug
		targ = targ.parentNode;

	if (!targ || !targ.nodeName)
		return;
	var res = this.oContextMenu.Show({oPos: {left : x, top : y}, pElement: targ});

	return BX.PreventDefault(e);
},

OnKeyDown: function(e)
{
	if(!e)
		e = window.event;
	BX.onCustomEvent(this, 'OnDocumentKeyDown', [e]);

	var key = e.which || e.keyCode;
	if (e.ctrlKey && !e.shiftKey && !e.altKey)
	{
		// if (!BX.browser.IsIE() && !BX.browser.IsOpera())
		// {
		switch (key)
		{
			case 66 : // B
			case 98 : // b
				this.executeCommand('Bold');
				return BX.PreventDefault(e);
			case 105 : // i
			case 73 : // I
				this.executeCommand('Italic');
				return BX.PreventDefault(e);
			case 117 : // u
			case 85 : // U
				this.executeCommand('Underline');
				return BX.PreventDefault(e);
			case 81 : // Q - quote
				if (this.quoteBut)
				{
					this.quoteBut.oBut.handler(this.quoteBut);
					return BX.PreventDefault(e);
				}
		}
		//}
	}

	if (this.bHandleOnPaste
		&&
		(
			(e.ctrlKey && !e.shiftKey && !e.altKey && e.keyCode == 86) /* Ctrl+V */
				||
				(!e.ctrlKey && e.shiftKey && !e.altKey && e.keyCode == 45) /*Shift+Ins*/
				||
				(e.metaKey && !e.shiftKey && !e.altKey && e.keyCode == 86) /* Cmd+V */
			)
		)
	{
		this.OnPaste();
	}

	// Shift +Del - Deleting code fragment in WYSIWYG
	if (this.bCodeBut && e.shiftKey && e.keyCode == 46 /* Del*/)
	{
		var pSel = this.GetSelectionObject();
		if (pSel)
		{
			if (pSel.className == 'lhe-code')
			{
				pSel.parentNode.removeChild(pSel);
				return BX.PreventDefault(e);
			}
			else if(pSel.parentNode)
			{
				var pCode = BX.findParent(pSel, {className: 'lhe-code'});
				if (pCode)
				{
					pCode.parentNode.removeChild(pCode);
					return BX.PreventDefault(e);
				}
			}
		}
	}

	// Tab
	if (key == 9 && this.arConfig.bReplaceTabToNbsp)
	{
		this.InsertHTML(this.tabNbsp);
		return BX.PreventDefault(e);
	}

	if (this.bCodeBut && e.keyCode == 13)
	{
		if (BX.browser.IsIE() || BX.browser.IsSafari() || BX.browser.IsChrome())
		{
			var pElement = this.GetSelectionObject();
			if (pElement)
			{
				var bFind = false;
				if (pElement && pElement.nodeName && pElement.nodeName.toLowerCase() == 'pre')
					bFind = true;

				if (!bFind)
					bFind = !!BX.findParent(pElement, {tagName: 'pre'});

				if (bFind)
				{
					if (BX.browser.IsIE())
						this.InsertHTML("<br/><img src=\"" + this.oneGif + "\" height=\"20\" width=\"1\"/>");
					else if (BX.browser.IsSafari() || BX.browser.IsChrome())
						this.InsertHTML(" \r\n");

					return BX.PreventDefault(e);
				}
			}
		}
	}

	// Ctrl + Enter
	if ((e.keyCode == 13 || e.keyCode == 10) && e.ctrlKey && this.ctrlEnterHandler)
	{
		this.SaveContent();
		this.ctrlEnterHandler();
	}

	if (this.arConfig.bAutoResize && this.arConfig.bResizable)
	{
		if (this._resizeTimeout)
		{
			clearTimeout(this._resizeTimeout);
			this._resizeTimeout = null;
		}

		this._resizeTimeout = setTimeout(BX.proxy(this.AutoResize, this), 200);
	}

	if (this._CheckBrTimeout)
	{
		clearTimeout(this._CheckBrTimeout);
		this._CheckBrTimeout = null;
	}

	this._CheckBrTimeout = setTimeout(BX.proxy(this.CheckBr, this), 1000);
},

OnDocMousedown: function(e)
{
	if (!e)
		e = window.event;

	var pEl;
	if (e.target)
		pEl = e.target;
	else if (e.srcElement)
		pEl = e.srcElement;
	if (pEl.nodeType == 3)
		pEl = pEl.parentNode;

	if (!this.bPopup && !BX.findParent(pEl, {className: 'bxlhe-frame'}))
		this.SaveContent();
},

SetView: function(sType)
{
	if (this.sEditorMode == sType)
		return;

	this.SaveContent();
	if (sType == 'code')
	{
		this.iFrame.style.display = "none";
		this.pSourceDiv.style.display = "block";
		this.SetCodeEditorContent(this.GetContent());
	}
	else
	{
		this.iFrame.style.display = "block";
		this.pSourceDiv.style.display = "none";
		this.SetEditorContent(this.GetContent());
		this.CheckBr();
	}
	this.sEditorMode = sType;
	BX.onCustomEvent(this, "OnChangeView");
},

SaveContent: function()
{
	var sContent = this.sEditorMode == 'code' ? this.GetCodeEditorContent() : this.GetEditorContent();
	if (this.bBBCode)
		sContent = this.OptimizeBB(sContent);

	this.SetContent(sContent);

	BX.onCustomEvent(this, 'OnSaveContent', [sContent]);
},

SetContent: function(sContent)
{
	this.pHiddenInput.value = this.pTextarea.value = this.content = sContent;
},

GetContent: function()
{
	return this.content.toString();
},

SetEditorContent: function(sContent)
{
	if (this.pEditorDocument)
	{
		sContent = this.ParseContent(sContent);

		if (this.pEditorDocument.designMode)
		{
			try{
				this.pEditorDocument.designMode = 'off';
			}catch(e){alert('SetEditorContent: designMode=\'off\'');}
		}

		this.pEditorDocument.open();
		this.pEditorDocument.write('<html><head></head><body>' + sContent + '</body></html>');
		this.pEditorDocument.close();

		this.pEditorDocument.body.style.padding = "8px";
		this.pEditorDocument.body.style.margin = "0";
		this.pEditorDocument.body.style.borderWidth = "0";

		this.pEditorDocument.body.style.fontFamily = this.arConfig.fontFamily;
		this.pEditorDocument.body.style.fontSize = this.arConfig.fontSize;
		this.pEditorDocument.body.style.lineHeight = this.arConfig.lineHeight;

		// Set events
		BX.bind(this.pEditorDocument, 'keydown', BX.proxy(this.OnKeyDown, this));

		if(BX.browser.IsIE())
		{
			if (this.bHandleOnPaste)
				BX.bind(this.pEditorDocument.body, 'paste', BX.proxy(this.OnPaste, this));
			this.pEditorDocument.body.contentEditable = true;
		}
		else if (this.pEditorDocument.designMode)
		{
			this.pEditorDocument.designMode = "on";
			this._TurnOffStyleWithCSS(true);
		}

		if (this.arConfig.bConvertContentFromBBCodes)
			this.ShutdownBBCode();
	}
},

_TurnOffStyleWithCSS: function(bTimeout)
{
	try{
		this._turnOffCssCount++;
		if (this._turnOffCssCount < 5 && bTimeout !== false)
			bTimeout = true;

		this.pEditorDocument.execCommand("styleWithCSS", false, false);
		try{this.pEditorDocument.execCommand("useCSS", false, true);}catch(e){}
	}
	catch(e)
	{
		if (bTimeout === true)
			setTimeout(BX.proxy(this._TurnOffStyleWithCSS, this), 500);
	}
},

_AdjustBodyWidth: function()
{
	if (this.pEditorDocument && this.pEditorDocument.body)
	{
		var html = this.pEditorDocument.body.innerHTML;
		if (html != this.lastEditedBodyHtml)
		{
			this.adjustBodyInterval = 500;
			var _this = this;
			this.pEditorDocument.body.style.width = null;
			this.lastEditedBodyHtml = html;
			setTimeout(function(){
				var scrollWidth = BX.GetWindowScrollSize(_this.pEditorDocument).scrollWidth - 16;
				if (scrollWidth > 0)
					_this.pEditorDocument.body.style.width = scrollWidth + 'px';
			}, 50);
		}
		else
		{
			this.adjustBodyInterval = 5000;
		}
	}

	setTimeout(BX.proxy(this._AdjustBodyWidth, this), this.adjustBodyInterval)
},

GetEditorContent: function()
{
	var sContent = this.UnParseContent();
	return sContent;
},

SetCodeEditorContent: function(sContent)
{
	this.pHiddenInput.value = this.pTextarea.value = sContent;
},

GetCodeEditorContent: function()
{
	return this.pTextarea.value;
},

OptimizeHTML: function(str)
{
	var
		iter = 0,
		bReplasing = true,
		arTags = ['b', 'em', 'font', 'h\\d', 'i', 'li', 'ol', 'p', 'small', 'span', 'strong', 'u', 'ul'],
		replaceEmptyTags = function(){i--; bReplasing = true; return ' ';},
		re, tagName, i, l;

	while(iter++ < 20 && bReplasing)
	{
		bReplasing = false;
		for (i = 0, l = arTags.length; i < l; i++)
		{
			tagName = arTags[i];
			re = new RegExp('<'+tagName+'[^>]*?>\\s*?</'+tagName+'>', 'ig');
			str = str.replace(re, replaceEmptyTags);

			re = new RegExp('<' + tagName + '\\s+?[^>]*?/>', 'ig');
			str = str.replace(re, replaceEmptyTags);

			// Replace <b>text1</b>    <b>text2</b> ===>>  <b>text1 text2</b>
			re = new RegExp('<((' + tagName + '+?)(?:\\s+?[^>]*?)?)>([\\s\\S]+?)<\\/\\2>\\s*?<\\1>([\\s\\S]+?)<\\/\\2>', 'ig');
			str = str.replace(re, function(str, b1, b2, b3, b4)
				{
					bReplasing = true;
					return '<' + b1 + '>' + b3 + ' ' + b4 + '</' + b2 + '>';
				}
			);
		}
	}
	return str;
},

_RecursiveDomWalker: function(pNode, pParentNode)
{
	var oNode =
	{
		arAttributes : {},
		arNodes : [],
		type : null,
		text : "",
		arStyle : {}
	};

	switch(pNode.nodeType)
	{
		case 9:
			oNode.type = 'document';
			break;
		case 1:
			if(pNode.tagName.length <= 0 || pNode.tagName.substring(0, 1) == "/")
				return;

			oNode.text = pNode.tagName.toLowerCase();
			if (oNode.text == 'script')
				break;

			oNode.type = 'element';
			var
				attr = pNode.attributes,
				j, l = attr.length;

			if (pNode.nodeName.toLowerCase() == 'a' && pNode.innerHTML == '' && (this.bBBCode || !pNode.getAttribute("name")))
				return;

			for(j = 0; j < l; j++)
			{
				if(attr[j].specified || (oNode.text == "input" && attr[j].nodeName.toLowerCase()=="value"))
				{
					var attrName = attr[j].nodeName.toLowerCase();

					if(attrName == "style")
					{
						oNode.arAttributes[attrName] = pNode.style.cssText;
						oNode.arStyle = pNode.style;

						if(oNode.arStyle.display == 'none')
						{
							oNode.type = 'text';
							oNode.text = '';
							break;
						}

						if(oNode.arStyle.textAlign && (oNode.text == 'div' || oNode.text == 'p' || oNode.text == 'span'))
						{
							var align = oNode.arStyle.textAlign;
							BX.util.in_array(oNode.arStyle.textAlign, ['left', 'right', 'center', 'justify'])
							{
								oNode.arStyle = {};
								oNode.text = 'span';
								oNode.arAttributes['style'] = 'text-align:' + align + ';display:block;';
								oNode.arStyle.textAlign = align;
								oNode.arStyle.display = 'block';
							}
						}
					}
					else if(attrName=="src" || attrName=="href"  || attrName=="width"  || attrName=="height")
					{
						oNode.arAttributes[attrName] = pNode.getAttribute(attrName, 2);
					}
					else if(!this.bBBCode && attrName == 'align' && BX.util.in_array(attr[j].nodeValue, ['left', 'right', 'center', 'justify']))
					{
						oNode.text = 'span';
						oNode.arAttributes['style'] = 'text-align:' + attr[j].nodeValue + ';display:block;';
						oNode.arStyle.textAlign = attr[j].nodeValue;
						oNode.arStyle.display = 'block';
					}
					else
					{
						oNode.arAttributes[attrName] = attr[j].nodeValue;
					}
				}
			}
			break;
		case 3:
			oNode.type = 'text';
			var res = pNode.nodeValue;

			if (this.arConfig.bReplaceTabToNbsp)
			{
				res = res.replace(this.tabNbspRe1, "\t");
				res = res.replace(this.tabNbspRe2, "\t");
			}

			if(!pParentNode || (pParentNode.text != 'pre' && pParentNode.arAttributes['class'] != 'lhe-code'))
			{
				res = res.replace(/\n+/g, ' ');
				res = res.replace(/ +/g, ' ');
			}

			oNode.text = res;
			break;
	}

	if (oNode.type != 'text')
	{
		var
			arChilds = pNode.childNodes,
			i, l = arChilds.length;

		for(i = 0; i < l; i++)
			oNode.arNodes.push(this._RecursiveDomWalker(arChilds[i], oNode));
	}

	return oNode;
},

_RecursiveGetHTML: function(pNode)
{
	if (!pNode || typeof pNode != 'object' || !pNode.arAttributes)
		return "";

	var ob, res = "", id = pNode.arAttributes["id"];

	if (pNode.text == 'img' && !id) // Images pasted by Ctrl+V
		id = this.SetBxTag(false, {tag: 'img', params: {src: pNode.arAttributes["src"]}});

	if (id)
	{
		var bxTag = this.GetBxTag(id);
		if(bxTag.tag)
		{
			var parser = this.oSpecialParsers[bxTag.tag];
			if (parser && parser.UnParse)
				return parser.UnParse(bxTag, pNode, this);
			else if (bxTag.params && bxTag.params.value)
				return '\n' + bxTag.params.value + '\n';
			else
				return '';
		}
	}

	if (pNode.arAttributes["_moz_editor_bogus_node"])
		return '';

	if (this.bBBCode)
	{
		var bbRes = this.UnParseNodeBB(pNode);
		if (bbRes !== false)
			return bbRes;
	}

	bFormatted = true;

	if (pNode.text.toLowerCase() != 'body')
		res = this.GetNodeHTMLLeft(pNode);

	var bNewLine = false;

	var sIndent = '';
	if (typeof pNode.bFormatted != 'undefined')
		bFormatted = !!pNode.bFormatted;

	if (bFormatted && pNode.type != 'text')
	{
		if (this.reBlockElements.test(pNode.text) && !(pNode.oParent && pNode.oParent.text && pNode.oParent.text.toLowerCase() == 'pre'))
		{
			for (var j = 0; j < pNode.iLevel - 3; j++)
				sIndent += "  ";
			bNewLine = true;
			res = "\r\n" + sIndent + res;
		}
	}

	for (var i = 0; i < pNode.arNodes.length; i++)
		res += this._RecursiveGetHTML(pNode.arNodes[i]);

	if (pNode.text.toLowerCase() != 'body')
		res += this.GetNodeHTMLRight(pNode);

	if (bNewLine)
		res += "\r\n" + (sIndent == '' ? '' : sIndent.substr(2));

	return res;
},

// Redeclared in BBCode mode
GetNodeHTMLLeft: function(pNode)
{
	if(pNode.type == 'text')
		return BX.util.htmlspecialchars(pNode.text);

	var atrVal, attrName, res;

	if(pNode.type == 'element')
	{
		res = "<" + pNode.text;

		for(attrName in pNode.arAttributes)
		{
			atrVal = pNode.arAttributes[attrName];
			if(attrName.substring(0,4).toLowerCase() == '_moz')
				continue;

			if(pNode.text.toUpperCase()=='BR' && attrName.toLowerCase() == 'type' && atrVal == '_moz')
				continue;

			if(attrName == 'style')
			{
				if (atrVal.length > 0 && atrVal.indexOf('-moz') != -1) // Kill -moz* styles from firefox
					atrVal = BX.util.trim(atrVal.replace(/-moz.*?;/ig, ''));

				if (pNode.text == 'td') // Kill border-image: none; styles from firefox for <td>
					atrVal = BX.util.trim(atrVal.replace(/border-image:\s*none;/ig, ''));

				if(atrVal.length <= 0)
					continue;
			}

			res += ' ' + attrName + '="' + (pNode.bDontUseSpecialchars ? atrVal : BX.util.htmlspecialchars(atrVal)) + '"';
		}

		if(pNode.arNodes.length <= 0 && !this.IsPairNode(pNode.text))
			return res + " />";
		return res + ">";
	}
	return "";
},

// Redeclared in BBCode mode
GetNodeHTMLRight: function(pNode)
{
	if(pNode.type == 'element' && (pNode.arNodes.length>0 || this.IsPairNode(pNode.text)))
		return "</" + pNode.text + ">";
	return "";
},

IsPairNode: function(text)
{
	if(text.substr(0, 1) == 'h' || text == 'br' || text == 'img' || text == 'input')
		return false;
	return true;
},

executeCommand: function(commandName, sValue)
{
	this.SetFocus();
	//try{
	var res = this.pEditorWindow.document.execCommand(commandName, false, sValue);
	//}catch(e){};
	this.SetFocus();
	//this.OnEvent("OnSelectionChange");
	//this.OnChange("executeCommand", commandName);

	if (this.arConfig.bAutoResize && this.arConfig.bResizable)
		this.AutoResize();

	return res;
},

queryCommand: function(commandName)
{
	var sValue = '';
	if (!this.pEditorDocument.queryCommandEnabled || !this.pEditorDocument.queryCommandValue)
		return null;

	if(!this.pEditorDocument.queryCommandEnabled(commandName))
		return null;

	return this.pEditorDocument.queryCommandValue(commandName);
},

SetFocus: function()
{
	if (this.sEditorMode != 'html')
		return;

	//try{
	if(this.pEditorWindow.focus)
		this.pEditorWindow.focus();
	else
		this.pEditorDocument.body.focus();
	//} catch(e){}
},

SetFocusToEnd: function()
{
	this.CheckBr();
	var ss = BX.GetWindowScrollSize(this.pEditorDocument);
	this.pEditorWindow.scrollTo(0, ss.scrollHeight);

	this.SetFocus();
	this.SelectElement(this.pEditorDocument.body.lastChild);
},

SetCursorFF: function()
{
	if (this.sEditorMode != 'code' && !BX.browser.IsIE())
	{
		var _this = this;
		try{
			this.iFrame.blur();
			this.iFrame.focus();

			setTimeout(function(){
				_this.iFrame.blur();
				_this.iFrame.focus();
			}, 600);

			setTimeout(function(){
				_this.iFrame.blur();
				_this.iFrame.focus();
			}, 1000);
		}catch(e){}
	}
},

CheckBr: function()
{
	if (this.CheckBrTimeout)
	{
		clearTimeout(this.CheckBrTimeout);
		this.CheckBrTimeout = false;
	}

	var _this = this;
	this.CheckBrTimeout = setTimeout(function()
	{
		var lastChild = _this.pEditorDocument.body.lastChild;
		if (lastChild && lastChild.nodeType == 1)
		{
			var nn = lastChild.nodeName.toUpperCase();
			var reBlockElements = /^(TITLE|TABLE|SCRIPT|DIV|H1|H2|H3|H4|H5|H6|ADDRESS|PRE|OL|UL|LI|BLOCKQUOTE|FORM|CENTER|)$/i;
			if (reBlockElements.test(nn))
				_this.pEditorDocument.body.appendChild(_this.pEditorDocument.createElement("BR"));
		}
	}, 200);
},

ParseContent: function(sContent, bJustParse) // HTML -> WYSIWYG
{
	var _this = this;
	var arCodes = [];
	sContent = sContent.replace(/\[code\]((?:\s|\S)*?)\[\/code\]/ig, function(str, code)
	{
		var strId = '';
		if (!_this.bBBCode)
			strId = " id=\"" + _this.SetBxTag(false, {tag: "code"}) + "\" ";

		arCodes.push('<pre ' + strId + 'class="lhe-code" title="' + BX.message.CodeDel + '">' + BX.util.htmlspecialchars(code) + '</pre>');
		return '#BX_CODE' + (arCodes.length - 1) + '#';
	});

	if (!bJustParse)
		BX.onCustomEvent(this, 'OnParseContent');

	if (this.arConfig.bBBCode)
		sContent = this.ParseBB(sContent);

	sContent = sContent.replace(/(<td[^>]*>)\s*(<\/td>)/ig, "$1<br _moz_editor_bogus_node=\"on\">$2");

	if (this.arConfig.bReplaceTabToNbsp)
		sContent = sContent.replace(/\t/ig, this.tabNbsp);

	if (!BX.browser.IsIE())
	{
		sContent = sContent.replace(/<hr[^>]*>/ig, function(sContent)
			{
				return '<img class="bxed-hr" src="' + _this.imagePath + 'break_page.gif" id="' + _this.SetBxTag(false, {tag: "hr", params: {value : sContent}}) + '"/>';
			}
		);
	}

	for (var p in this.oSpecialParsers)
	{
		if (this.oSpecialParsers[p] && this.oSpecialParsers[p].Parse)
			sContent = this.oSpecialParsers[p].Parse(p, sContent, this);
	}

	if (!bJustParse)
		setTimeout(function(){
			_this.AppendCSS(_this.systemCSS);
			// Hack for chrome: we have to unset font family
			// because than user paste text - chrome wraps it with [FONT=.....
			setTimeout(function(){
				_this.pEditorDocument.body.style.fontFamily = '';
				_this.pEditorDocument.body.style.fontSize = '';
			}, 1);
		}, 300);

	if (arCodes.length > 0) // Replace back CODE content without modifications
		sContent = sContent.replace(/#BX_CODE(\d+)#/ig, function(s, num){return arCodes[num] || s;});

	if (this.bBBCode)
	{
		sContent = sContent.replace(/&amp;#91;/ig, "[");
		sContent = sContent.replace(/&amp;#93;/ig, "]");
	}

	sContent = BX.util.trim(sContent);

	// Add <br> in the end of the message if text not ends with <br>
	if (this.arConfig.bBBCode && !sContent.match(/(<br[^>]*>)$/ig))
		sContent += '<br/>';

	return sContent;
},

UnParseContent: function() // WYSIWYG - > html
{
	BX.onCustomEvent(this, 'OnUnParseContent');
	var sContent = this._RecursiveGetHTML(this._RecursiveDomWalker(this.pEditorDocument.body, false));

	if (this.bBBCode)
	{
		if (!BX.browser.IsIE())
			sContent = sContent.replace(/\r/ig, '');
		sContent = sContent.replace(/\n/ig, '');
	}

	var arDivRules = [
		['#BR#(#TAG_BEGIN#)', "$1"], // 111<br><div>... => 111<>
		['(#TAG_BEGIN#)(?:#BR#)*?(#TAG_END#)', "$1$2"], // [DIV]#BR#[/DIV]  ==> [DIV][/DIV]
		['(#TAG_BEGIN#)((?:\\s|\\S)*?)#TAG_END#(?:\\n|\\r|\\s)*?#TAG_BEGIN#((?:\\s|\\S)*?)(#TAG_END#)', function(str, s1, s2,s3,s4){return s1 + s2 + '#BR#' + s3 + s4;}, true], //
		['^#TAG_BEGIN#', ""], //kill [DIV] in the begining of the text
		['((?:\\s|\\S)*?(\\[\\/\\w+\\])*?)#TAG_BEGIN#((?:\\s|\\S)*?)#TAG_END#((?:\\s|\\S)*?)', function(str, s1, s2,s3,s4)
		{
			if (s2 && s2.toLowerCase && s2.toLowerCase() == '[/list]')
				return s1 + s3 + '#BR#' + s4;
			return s1 + '#BR#' + s3 + '#BR#' + s4;
		}, true], // [/list][DIV]wwww[/div]wwww => [/list]wwww#BR#wwwww, text[DIV]wwww[/div]wwww => text#BR#www#BR#
		['#TAG_END#', "#BR#"] // [/DIV] ==> \n
	];

	var re, i, l = arDivRules.length, str;
	if (this.bBBCode)
	{
		//
		if (BX.browser.IsOpera())
			sContent = sContent.replace(/(?:#BR#)*?\[\/P\]/ig, "[/P]"); // #BR#[/P]  ==> [/P] for opera

		for (i = 0; i < l; i++)
		{
			re = arDivRules[i][0];
			re = re.replace(/#TAG_BEGIN#/g, '\\[P\\]');
			re = re.replace(/#TAG_END#/g, '\\[\\/P\\]');
			re = re.replace(/\\\\/ig, '\\\\');

			if (arDivRules[i][2] === true)
				while(true)
				{
					str = sContent.replace(new RegExp(re, 'igm'), arDivRules[i][1]);
					if (str == sContent)
						break;
					else
						sContent = str;
				}
			else
				sContent = sContent.replace(new RegExp(re, 'igm'), arDivRules[i][1]);
		}
		sContent = sContent.replace(/^((?:\s|\S)*?)(?:\n|\r|\s)+$/ig, "$1\n\n"); //kill multiple \n in the end

		// Handle  [DIV] tags from safari, chrome
		for (i = 0; i < l; i++)
		{
			re = arDivRules[i][0];
			re = re.replace(/#TAG_BEGIN#/g, '\\[DIV\\]');
			re = re.replace(/#TAG_END#/g, '\\[\\/DIV\\]');
			re = re.replace(/\\\\/ig, '\\\\');

			if (arDivRules[i][2] === true)
				while(true)
				{
					str = sContent.replace(new RegExp(re, 'igm'), arDivRules[i][1]);
					if (str == sContent)
						break;
					else
						sContent = str;
				}
			else
				sContent = sContent.replace(new RegExp(re, 'igm'), arDivRules[i][1]);
		}

		sContent = sContent.replace(/#BR#/ig, "\n");
		sContent = sContent.replace(/\[DIV]/ig, "");
		sContent = BX.util.htmlspecialcharsback(sContent);
	}

	this.__sContent = sContent;
	BX.onCustomEvent(this, 'OnUnParseContentAfter');
	sContent = this.__sContent;
	return sContent;
},

InitResizer: function()
{
	this.oTransOverlay.Show();

	var
		_this = this,
		coreContPos = BX.pos(this.pFrame),
		newHeight = false;

	var MouseMove = function(e)
	{
		e = e || window.event;
		BX.fixEventPageY(e);
		newHeight = e.pageY - coreContPos.top;

		// New height
		if (newHeight < _this.arConfig.minHeight)
		{
			newHeight = _this.arConfig.minHeight;
			document.body.style.cursor = "not-allowed";
		}
		else if (newHeight > _this.arConfig.maxHeight)
		{
			newHeight = _this.arConfig.maxHeight;
			document.body.style.cursor = "not-allowed";
		}
		else
		{
			document.body.style.cursor = "n-resize";
		}

		_this.pFrame.style.height = newHeight + "px";
		_this.ResizeFrame(newHeight);
	};

	var MouseUp = function(e)
	{
		if (_this.arConfig.autoResizeSaveSize)
			BX.userOptions.save('fileman', 'LHESize_' + _this.id, 'height', newHeight);
		_this.arConfig.height = newHeight;

		document.body.style.cursor = "";
		if (_this.oTransOverlay && _this.oTransOverlay.bShowed)
			_this.oTransOverlay.Hide();

		BX.unbind(document, "mousemove", MouseMove);
		BX.unbind(document, "mouseup", MouseUp);
	};

	BX.bind(document, "mousemove", MouseMove);
	BX.bind(document, "mouseup", MouseUp);
},

AutoResize: function()
{
	var
		heightOffset = parseInt(this.arConfig.autoResizeOffset || 80),
		maxHeight = parseInt(this.arConfig.autoResizeMaxHeight || 0),
		minHeight = parseInt(this.arConfig.autoResizeMinHeight || 50),
		newHeight,
		_this = this;

	if (this.autoResizeTimeout)
		clearTimeout(this.autoResizeTimeout);

	this.autoResizeTimeout = setTimeout(function()
	{
		if (_this.sEditorMode == 'html')
		{
			//newHeight = _this.pEditorDocument.body.offsetHeight + heightOffset;
			newHeight = _this.pEditorDocument.body.offsetHeight;
			var
				body = _this.pEditorDocument.body,
				node = body.lastChild,
				offsetTop = false, i;

			while (true)
			{
				if (!node)
					break;
				if (node.offsetTop)
				{
					offsetTop = node.offsetTop + (node.offsetHeight || 0);
					newHeight = offsetTop + heightOffset;
					break;
				}
				else
				{
					node = node.previousSibling;
				}
			}

			var oEdSize = BX.GetWindowSize(_this.pEditorDocument);
			if (oEdSize.scrollHeight - oEdSize.innerHeight > 5)
				newHeight = Math.max(oEdSize.scrollHeight + heightOffset, newHeight);
		}
		else
		{
			newHeight = (_this.pTextarea.value.split("\n").length /* rows count*/ + 5) * 17;
		}

		if (newHeight > parseInt(_this.arConfig.height))
		{
			if (BX.browser.IsIOS())
				maxHeight = Infinity;
			else if (!maxHeight || maxHeight < 10)
				maxHeight = Math.round(BX.GetWindowInnerSize().innerHeight * 0.9); // 90% from screen height

			newHeight = Math.min(newHeight, maxHeight);
			newHeight = Math.max(newHeight, minHeight);

			_this.SmoothResizeFrame(newHeight);
		}
	}, 300);
},

MousePos: function (e)
{
	if(window.event)
		e = window.event;

	if(e.pageX || e.pageY)
	{
		e.realX = e.pageX;
		e.realY = e.pageY;
	}
	else if(e.clientX || e.clientY)
	{
		e.realX = e.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft) - document.documentElement.clientLeft;
		e.realY = e.clientY + (document.documentElement.scrollTop || document.body.scrollTop) - document.documentElement.clientTop;
	}
	return e;
},

SmoothResizeFrame: function(height)
{
	var
		_this = this,
		curHeight = parseInt(this.pFrame.offsetHeight),
		count = 0,
		bRise = height > curHeight,
		timeInt = BX.browser.IsIE() ? 50 : 50,
		dy = 5;

	if (!bRise)
		return;

	if (this.smoothResizeInterval)
		clearInterval(this.smoothResizeInterval);

	this.smoothResizeInterval = setInterval(function()
		{
			if (bRise)
			{
				curHeight += Math.round(dy * count);
				if (curHeight > height)
				{
					clearInterval(_this.smoothResizeInterval);
					if (curHeight > height)
						curHeight = height;
				}
			}
			else
			{
				curHeight -= Math.round(dy * count);
				if (curHeight < height)
				{
					curHeight = height;
					clearInterval(_this.smoothResizeInterval);
				}
			}

			_this.pFrame.style.height = curHeight + "px";
			_this.ResizeFrame(curHeight);
			count++;
		},
		timeInt
	);
},

ResizeFrame: function(newHeight)
{
	var
		deltaWidth = 7,
		resizeHeight = this.arConfig.bManualResize ? 3 : 0, // resize row
		height = newHeight || parseInt(this.pFrame.offsetHeight),
		width = this.pFrame.offsetWidth;

	this.pFrameTable.style.height = height + 'px';
	var contHeight = height - this.buttonsHeight - resizeHeight;

	if (contHeight > 0)
	{
		this.pEditCont.style.height = contHeight + 'px';
		this.pTextarea.style.height = contHeight + 'px';
	}

	this.pTextarea.style.width = (width > deltaWidth) ? (width - deltaWidth) + 'px' : 'auto';
	this.pButtonsCell.style.height = this.buttonsHeight + 'px';

	/*if (this.arConfig.bResizable)
	 this.pResizer.parentNode.style.height = resizeHeight + 'px';*/
},

AddButtons: function()
{
	var
		i, l, butId, grInd, arButtons,
		toolbarConfig = this.arConfig.toolbarConfig;
	this.buttonsCount = 0;

	if(!toolbarConfig)
		toolbarConfig = [
			//'Source',
			'Bold', 'Italic', 'Underline', 'Strike', 'RemoveFormat', 'InsertHR',
			'Anchor',
			'CreateLink', 'DeleteLink', 'Image', //'SpecialChar',
			'Justify',
			'InsertOrderedList', 'InsertUnorderedList', 'Outdent', 'Indent',
			'BackColor', 'ForeColor',
			'Video',
			'StyleList', 'HeaderList',
			'FontList', 'FontSizeList',
			'Table'
			//smiles:['SmileList']
		];

	if (oBXLEditorUtils.oTune && oBXLEditorUtils.oTune[this.id])
	{
		var
			ripButtons = oBXLEditorUtils.oTune[this.id].ripButtons,
			addButtons = oBXLEditorUtils.oTune[this.id].buttons;

		if (ripButtons)
		{
			i = 0;
			while(i < toolbarConfig.length)
			{
				if (ripButtons[toolbarConfig[i]])
					toolbarConfig = BX.util.deleteFromArray(toolbarConfig, i);
				else
					i++;
			}
		}

		if (addButtons)
		{
			for (var j = 0, n = addButtons.length; j < n; j++)
			{
				if (addButtons[j].ind == -1 || addButtons[j].ind >= toolbarConfig.length)
					toolbarConfig.push(addButtons[j].but.id);
				else
					toolbarConfig = BX.util.insertIntoArray(toolbarConfig, addButtons[j].ind, addButtons[j].but.id);
			}
		}
	}

	var
		begWidth = 0,
		endWidth = 0, // 4
		curLineWidth = begWidth, pCont,
		butContWidth = parseInt(this.pButtonsCont.offsetWidth);

	this.ToolbarStartLine(true);
	for(i in toolbarConfig)
	{
		butId = toolbarConfig[i];
		if (typeof butId != 'string')
			continue;

		if (butId == '=|=')
		{
			this.ToolbarNewLine();
			curLineWidth = begWidth;
		}
		else if (LHEButtons[butId])
		{
			this.buttonsIndex[butId] = i;
			pCont = this.AddButton(LHEButtons[butId], butId);
			if (pCont)
			{
				curLineWidth += parseInt(pCont.style.width) || 23;
				if (curLineWidth + endWidth > butContWidth && butContWidth > 0)
				{
					butContWidth = parseInt(this.pButtonsCont.offsetWidth); // Doublecheck
					if (curLineWidth + endWidth > butContWidth && butContWidth > 0)
					{
						this.ToolbarNewLine();
						this.pButtonsCont.appendChild(pCont);
						curLineWidth = begWidth;
					}
				}
			}
		}
	}
	this.ToolbarEndLine();

	if (typeof this.arConfig.controlButtonsHeight == 'undefined')
		this.buttonsHeight = this.toolbarLineCount * 27;
	else
		this.buttonsHeight = parseInt(this.arConfig.controlButtonsHeight || 0);

	this.arConfig.minHeight += this.buttonsHeight;
	this.arConfig.maxHeight += this.buttonsHeight;

	BX.addCustomEvent(this, 'onShow', BX.proxy(this.ResizeFrame, this));
},

AddButton: function(oBut, buttonId)
{
	if (oBut.parser && oBut.parser.obj)
		this.oSpecialParsers[oBut.parser.name] = oBut.parser.obj;

	this.buttonsCount++;
	var result;
	if (!oBut.type || !oBut.type == 'button')
	{
		if (buttonId == 'Code')
			this.bCodeBut = true;

		var pButton = new window.LHEButton(oBut, this);
		if (pButton && pButton.oBut)
		{
			if (buttonId == 'Source')
				this.sourseBut = pButton;
			else if(buttonId == 'Quote')
				this.quoteBut = pButton;

			result = this.pButtonsCont.appendChild(pButton.pCont);
		}
	}
	else if (oBut.type == 'Colorpicker')
	{
		var pColorpicker = new window.LHEColorPicker(oBut, this);
		result =  this.pButtonsCont.appendChild(pColorpicker.pCont);
	}
	else if (oBut.type == 'List')
	{
		var pList = new window.LHEList(oBut, this);
		result =  this.pButtonsCont.appendChild(pList.pCont);
	}

	if (oBut.parsers)
	{
		for(var i = 0, cnt = oBut.parsers.length; i < cnt; i++)
			if (oBut.parsers[i] && oBut.parsers[i].obj)
				this.oSpecialParsers[oBut.parsers[i].name] = oBut.parsers[i].obj;
	}

	return result;
},

AddParser: function(parser)
{
	if (parser && parser.name && typeof parser.obj == 'object')
		this.oSpecialParsers[parser.name] = parser.obj;
},

ToolbarStartLine: function(bFirst)
{
	// Hack for IE 7
	if (!bFirst && BX.browser.IsIE())
		this.pButtonsCont.appendChild(BX.create("IMG", {props: {src: this.oneGif, className: "lhe-line-ie"}}));

	this.pButtonsCont.appendChild(BX.create("DIV", {props: {className: 'lhe-line-begin'}}));
},

ToolbarEndLine: function()
{
	this.pButtonsCont.appendChild(BX.create("DIV", {props: {className: 'lhe-line-end'}}));
},

ToolbarNewLine: function()
{
	this.toolbarLineCount++;
	this.ToolbarEndLine();
	this.ToolbarStartLine();
},

OpenDialog: function(arParams)
{
	var oDialog = new window.LHEDialog(arParams, this);
},

GetSelectionObject: function()
{
	var oSelection, oRange, root;
	if(this.pEditorDocument.selection) // IE
	{
		oSelection = this.pEditorDocument.selection;
		oRange = oSelection.createRange();

		if(oSelection.type=="Control")
			return oRange.commonParentElement();

		return oRange.parentElement();
	}
	else // FF
	{
		oSelection = this.pEditorWindow.getSelection();
		if(!oSelection)
			return false;

		var container, i, rangeCount = oSelection.rangeCount, obj;
		for(var i = 0; i < rangeCount; i++)
		{
			oRange = oSelection.getRangeAt(i);
			container = oRange.startContainer;
			if(container.nodeType != 3)
			{
				if(container.nodeType == 1 && container.childNodes.length <= 0)
					obj = container;
				else
					obj = container.childNodes[oRange.startOffset];
			}
			else
			{
				temp = oRange.commonAncestorContainer;
				while(temp && temp.nodeType == 3)
					temp = temp.parentNode;
				obj = temp;
			}
			root = (i == 0) ? obj : BXFindParentElement(root, obj);
		}
		return root;
	}
},

GetSelectionObjects: function()
{
	var oSelection;
	if(this.pEditorDocument.selection) // IE
	{
		oSelection = this.pEditorDocument.selection;
		var s = oSelection.createRange();

		if(oSelection.type=="Control")
			return s.commonParentElement();

		return s.parentElement();
	}
	else // FF
	{
		oSelection = this.pEditorWindow.getSelection();
		if(!oSelection)
			return false;
		var oRange;
		var container, temp;
		var res = [];
		for(var i = 0; i < oSelection.rangeCount; i++)
		{
			oRange = oSelection.getRangeAt(i);
			container = oRange.startContainer;
			if(container.nodeType != 3)
			{
				if(container.nodeType == 1 && container.childNodes.length <= 0)
					res[res.length] = container;
				else
					res[res.length] = container.childNodes[oRange.startOffset];
			}
			else
			{
				temp = oRange.commonAncestorContainer;
				while(temp && temp.nodeType == 3)
					temp = temp.parentNode;
				res[res.length] = temp;
			}
		}
		if(res.length > 1)
			return res;
		return res[0];
	}
},

GetSelectionRange: function(doc, win)
{
	try{
		var
			oDoc = doc || this.pEditorDocument,
			oWin = win || this.pEditorWindow,
			oRange,
			oSel = this.GetSelection(oDoc, oWin);

		if (oSel)
		{
			if (oDoc.createRange)
			{
				if (oSel.getRangeAt)
					oRange = oSel.getRangeAt(0);
				else
				{
					oRange = document.createRange();
					oRange.setStart(oSel.anchorNode, oSel.anchorOffset);
					oRange.setEnd(oSel.focusNode, oSel.focusOffset);
				}
			}
			else
				oRange = oSel.createRange();
		}
		else
		{
			oRange = false;
		}

	} catch(e) {oRange = false;}

	return oRange;
},

SelectRange: function(oRange, doc, win)
{
	try{ // IE9 sometimes generete JS error
		if (!oRange)
			return;

		var
			oDoc = doc || this.pEditorDocument,
			oWin = win || this.pEditorWindow;

		this.ClearSelection(oDoc, oWin);
		if (oDoc.createRange) // FF
		{
			var oSel = oWin.getSelection();
			oSel.removeAllRanges();
			oSel.addRange(oRange);
		}
		else //IE
		{
			oRange.select();
		}

	}catch(e){}
},

SelectElement: function(pElement)
{
	try{
		var
			oRange,
			oDoc = this.pEditorDocument,
			oWin = this.pEditorWindow;

		if(oWin.getSelection)
		{
			var oSel = oWin.getSelection();
			oSel.selectAllChildren(pElement);
			oRange = oSel.getRangeAt(0);
			if (oRange.selectNode)
				oRange.selectNode(pElement);
		}
		else
		{
			oDoc.selection.empty();
			oRange = oDoc.selection.createRange();
			oRange.moveToElementText(pElement);
			oRange.select();
		}
		return oRange;
	}catch(e){}
},

GetSelectedText: function(oRange)
{
	// Get selected text
	var selectedText = '';
	if (oRange.startContainer && oRange.endContainer) // DOM Model
	{
		if (oRange.startContainer == oRange.endContainer && (oRange.endContainer.nodeType == 3 || oRange.endContainer.nodeType == 1))
			selectedText = oRange.startContainer.textContent.substring(oRange.startOffset, oRange.endOffset);
	}
	else // IE
	{
		if (oRange.text == oRange.htmlText)
			selectedText = oRange.text;
	}
	return selectedText || '';
},

ClearSelection: function(doc, win)
{
	var
		oDoc = doc || this.pEditorDocument,
		oWin = win || this.pEditorWindow;

	if (oWin.getSelection)
		oWin.getSelection().removeAllRanges();
	else
		oDoc.selection.empty();
},

GetSelection: function(oDoc, oWin)
{
	if (!oDoc)
		oDoc = document;
	if (!oWin)
		oWin = window;

	var oSel = false;
	if (oWin.getSelection)
		oSel = oWin.getSelection();
	else if (oDoc.getSelection)
		oSel = oDoc.getSelection();
	else if (oDoc.selection)
		oSel = oDoc.selection;
	return oSel;
},

InsertHTML: function(sContent)
{
	try{ // Don't clear try... Some times browsers generetes failures
		this.SetFocus();
		if(BX.browser.IsIE())
		{
			var oRng = this.pEditorDocument.selection.createRange();
			if (oRng.pasteHTML)
			{
				oRng.pasteHTML(sContent);
				oRng.collapse(false);
				oRng.select();
			}
		}
		else
		{
			this.pEditorWindow.document.execCommand('insertHTML', false, sContent);
		}
	}catch(e){}

	if (this.arConfig.bAutoResize && this.arConfig.bResizable)
		this.AutoResize();
},

AppendCSS: function(styles)
{
	styles = BX.util.trim(styles);
	if (styles.length <= 0)
		return false;

	var
		pDoc = this.pEditorDocument,
		pHeads = pDoc.getElementsByTagName("HEAD");

	if(pHeads.length != 1)
		return false;

	if(BX.browser.IsIE())
	{
		setTimeout(function()
		{
			try{
				if (pDoc.styleSheets.length == 0)
					pHeads[0].appendChild(pDoc.createElement("STYLE"));
				pDoc.styleSheets[0].cssText += styles;
			}catch(e){}
		}, 100);
	}
	else
	{
		try{
			var xStyle = pDoc.createElement("STYLE");
			pHeads[0].appendChild(xStyle);
			xStyle.appendChild(pDoc.createTextNode(styles));
		}catch(e){}
	}
	return true;
},

SetBxTag: function(pElement, params)
{
	var id;
	if (params.id || pElement && pElement.id)
		id = params.id || pElement.id;

	if (!id)
		id = 'bxid_' + Math.round(Math.random() * 1000000);
	else if (this.bxTags[id] && !params.tag)
		params.tag = this.bxTags[id].tag;

	params.id = id;
	if (pElement)
		pElement.id = params.id;

	this.bxTags[params.id] = params;
	return params.id;
},

GetBxTag: function(id)
{
	if (id)
	{
		if (typeof id != "string" && id.id)
			id = id.id;

		if (id && id.length > 0 && this.bxTags[id] && this.bxTags[id].tag)
		{
			this.bxTags[id].tag = this.bxTags[id].tag.toLowerCase();
			return this.bxTags[id];
		}
	}

	return {tag: false};
},

GetAttributesList: function(str)
{
	str = str + " ";

	var arParams = {}, arPHP = [], bPhp = false, _this = this;
	// 1. Replace PHP by #BXPHP#
	str = str.replace(/<\?.*?\?>/ig, function(s)
	{
		arPHP.push(s);
		return "#BXPHP" + (arPHP.length - 1) + "#";
	});

	// 2.0 Parse params - without quotes
	str = str.replace(/([^\w]??)(\w+?)=([^\s\'"]+?)(\s)/ig, function(s, b0, b1, b2, b3)
	{
		b2 = b2.replace(/#BXPHP(\d+)#/ig, function(s, num){return arPHP[num] || s;});
		arParams[b1.toLowerCase()] = BX.util.htmlspecialcharsback(b2);
		return b0;
	});

	// 2.1 Parse params
	str = str.replace(/([^\w]??)(\w+?)\s*=\s*("|\')([^\3]*?)\3/ig, function(s, b0, b1, b2, b3)
	{
		// 3. Replace PHP back
		b3 = b3.replace(/#BXPHP(\d+)#/ig, function(s, num){return arPHP[num] || s;});
		arParams[b1.toLowerCase()] = BX.util.htmlspecialcharsback(b3);
		return b0;
	});

	return arParams;
},

RidOfNode: function (pNode, bHard)
{
	if (!pNode || pNode.nodeType != 1)
		return;

	var i, nodeName = pNode.tagName.toLowerCase(),
		nodes = ['span', 'strike', 'del', 'font', 'code', 'div'];

	if (BX.util.in_array(nodeName, nodes)) // Check node names
	{
		if (bHard !== true)
		{
			for (i = pNode.attributes.length - 1; i >= 0; i--)
			{
				if (BX.util.trim(pNode.getAttribute(pNode.attributes[i].nodeName.toLowerCase())) != "")
					return false; // Node have attributes, so we cant get rid of it without loosing info
			}
		}

		var arNodes = pNode.childNodes;
		while(arNodes.length > 0)
			pNode.parentNode.insertBefore(arNodes[0], pNode);

		pNode.parentNode.removeChild(pNode);
		//this.OnEvent("OnSelectionChange");
		return true;
	}

	return false;
},

WrapSelectionWith: function (tagName, arAttributes)
{
	this.SetFocus();
	var oRange, oSelection;

	if (!tagName)
		tagName = 'SPAN';

	var sTag = 'FONT', i, pEl, arTags, arRes = [];

	try{this.pEditorDocument.execCommand("styleWithCSS", false, false);}catch(e){}
	this.executeCommand("FontName", "bitrixtemp");

	arTags = this.pEditorDocument.getElementsByTagName(sTag);

	for(i = arTags.length - 1; i >= 0; i--)
	{
		if (arTags[i].getAttribute('face') != 'bitrixtemp')
			continue;

		pEl = BX.create(tagName, arAttributes, this.pEditorDocument);
		arRes.push(pEl);

		while(arTags[i].firstChild)
			pEl.appendChild(arTags[i].firstChild);

		arTags[i].parentNode.insertBefore(pEl, arTags[i]);
		arTags[i].parentNode.removeChild(arTags[i]);
	}

	if (this.arConfig.bAutoResize && this.arConfig.bResizable)
		this.AutoResize();

	return arRes;
},

SaveSelectionRange: function()
{
	if (this.sEditorMode == 'code')
		this.oPrevRangeText = this.GetSelectionRange(document, window);
	else
		this.oPrevRange = this.GetSelectionRange();
},

RestoreSelectionRange: function()
{
	if (this.sEditorMode == 'code')
		this.IESetCarretPos(this.oPrevRangeText);
	else if(this.oPrevRange)
		this.SelectRange(this.oPrevRange);
},

focus: function(el, bSelect)
{
	setTimeout(function()
	{
		try{
			el.focus();
			if(bSelect)
				el.select();
		}catch(e){}
	}, 100);
},

// Methods below used in BB-mode
// Earlier was in bb.js
InitBBCode: function()
{
	this.stack = [];
	var _this = this;
	this.pTextarea.onkeydown = BX.proxy(this.OnKeyDownBB, this);

	// Backup parser functions
	this._GetNodeHTMLLeft = this.GetNodeHTMLLeft;
	this._GetNodeHTMLRight = this.GetNodeHTMLRight;

	this.GetNodeHTMLLeft = this.GetNodeHTMLLeftBB;
	this.GetNodeHTMLRight = this.GetNodeHTMLRightBB;
},

ShutdownBBCode: function()
{
	this.bBBCode = false;
	this.arConfig.bBBCode = false;

	this.pTextarea.onkeydown = null;

	// Restore parser functions
	this.GetNodeHTMLLeft = this._GetNodeHTMLLeft;
	this.GetNodeHTMLRight = this._GetNodeHTMLRight;

	this.arConfig.bConvertContentFromBBCodes = false;
},

FormatBB: function(params)
{
	var
		pBut = params.pBut,
		value = params.value,
		tag = params.tag.toUpperCase(),
		tag_end = tag;

	if (tag == 'FONT' || tag == 'COLOR' || tag == 'SIZE')
		tag += "=" + value;

	if ((!BX.util.in_array(tag, this.stack) || this.GetTextSelection()) && !(tag == 'FONT' && value == 'none'))
	{
		if (!this.WrapWith("[" + tag + "]", "[/" + tag_end + "]"))
		{
			this.stack.push(tag);

			if (pBut && pBut.Check)
				pBut.Check(true);
		}
	}
	else
	{
		var res = false;
		while (res = this.stack.pop())
		{
			this.WrapWith("[/" + res + "]", "");
			if (pBut && pBut.Check)
				pBut.Check(false);

			if (res == tag)
				break;
		}
	}
},

GetTextSelection: function()
{
	var res = false;
	if (typeof this.pTextarea.selectionStart != 'undefined')
	{
		res = this.pTextarea.value.substr(this.pTextarea.selectionStart, this.pTextarea.selectionEnd - this.pTextarea.selectionStart);
	}
	else if (document.selection && document.selection.createRange)
	{
		res = document.selection.createRange().text;
	}
	else if (window.getSelection)
	{
		res = window.getSelection();
		res = res.toString();
	}

	return res;
},

IESetCarretPos: function(oRange)
{
	if (!oRange || !BX.browser.IsIE() || oRange.text.length != 0 /* text selected*/)
		return;

	oRange.moveStart('character', - this.pTextarea.value.length);
	var pos = oRange.text.length;

	var range = this.pTextarea.createTextRange();
	range.collapse(true);
	range.moveEnd('character', pos);
	range.moveStart('character', pos);
	range.select();
},

WrapWith: function (tagBegin, tagEnd, postText)
{
	if (!tagBegin)
		tagBegin = "";
	if (!tagEnd)
		tagEnd = ""

	if (!postText)
		postText = "";

	if (tagBegin.length <= 0 && tagEnd.length <= 0 && postText.length <= 0)
		return true;

	var bReplaceText = !!postText;
	var sSelectionText = this.GetTextSelection();

	if (!this.bTextareaFocus)
		this.pTextarea.focus(); // BUG IN IE

	var isSelect = (sSelectionText ? 'select' : bReplaceText ? 'after' : 'in');

	if (bReplaceText)
		postText = tagBegin + postText + tagEnd;
	else if (sSelectionText)
		postText = tagBegin + sSelectionText + tagEnd;
	else
		postText = tagBegin + tagEnd;

	if (typeof this.pTextarea.selectionStart != 'undefined')
	{
		var
			currentScroll = this.pTextarea.scrollTop,
			start = this.pTextarea.selectionStart,
			end = this.pTextarea.selectionEnd;

		this.pTextarea.value = this.pTextarea.value.substr(0, start) + postText + this.pTextarea.value.substr(end);

		if (isSelect == 'select')
		{
			this.pTextarea.selectionStart = start;
			this.pTextarea.selectionEnd = start + postText.length;
		}
		else if (isSelect == 'in')
		{
			this.pTextarea.selectionStart = this.pTextarea.selectionEnd = start + tagBegin.length;
		}
		else
		{
			this.pTextarea.selectionStart = this.pTextarea.selectionEnd = start + postText.length;
		}
		this.pTextarea.scrollTop = currentScroll;
	}
	else if (document.selection && document.selection.createRange)
	{
		var sel = document.selection.createRange();
		var selection_copy = sel.duplicate();
		postText = postText.replace(/\r?\n/g, '\n');
		sel.text = postText;
		sel.setEndPoint('StartToStart', selection_copy);
		sel.setEndPoint('EndToEnd', selection_copy);

		if (isSelect == 'select')
		{
			sel.collapse(true);
			postText = postText.replace(/\r\n/g, '1');
			sel.moveEnd('character', postText.length);
		}
		else if (isSelect == 'in')
		{
			sel.collapse(false);
			sel.moveEnd('character', tagBegin.length);
			sel.collapse(false);
		}
		else
		{
			sel.collapse(false);
			sel.moveEnd('character', postText.length);
			sel.collapse(false);
		}
		sel.select();
	}
	else
	{
		// failed - just stuff it at the end of the message
		this.pTextarea.value += postText;
	}
	return true;
},

ParseBB: function (sContent)  // BBCode -> WYSIWYG
{
	sContent = BX.util.htmlspecialchars(sContent);

	// Table
	sContent = sContent.replace(/[\r\n\s\t]?\[table\][\r\n\s\t]*?\[tr\]/ig, '[TABLE][TR]');
	sContent = sContent.replace(/\[tr\][\r\n\s\t]*?\[td\]/ig, '[TR][TD]');
	sContent = sContent.replace(/\[tr\][\r\n\s\t]*?\[th\]/ig, '[TR][TH]');
	sContent = sContent.replace(/\[\/td\][\r\n\s\t]*?\[td\]/ig, '[/TD][TD]');
	sContent = sContent.replace(/\[\/tr\][\r\n\s\t]*?\[tr\]/ig, '[/TR][TR]');
	sContent = sContent.replace(/\[\/td\][\r\n\s\t]*?\[\/tr\]/ig, '[/TD][/TR]');
	sContent = sContent.replace(/\[\/th\][\r\n\s\t]*?\[\/tr\]/ig, '[/TH][/TR]');
	sContent = sContent.replace(/\[\/tr\][\r\n\s\t]*?\[\/table\][\r\n\s\t]?/ig, '[/TR][/TABLE]');

	// List
	sContent = sContent.replace(/[\r\n\s\t]*?\[\/list\]/ig, '[/LIST]');
	sContent = sContent.replace(/[\r\n\s\t]*?\[\*\]?/ig, '[*]');

	var
		arSimpleTags = [
			'b','u', 'i', ['s', 'del'], // B, U, I, S
			'table', 'tr', 'td', 'th'//, // Table
		],
		bbTag, tag, i, l = arSimpleTags.length, re;

	for (i = 0; i < l; i++)
	{
		if (typeof arSimpleTags[i] == 'object')
		{
			bbTag = arSimpleTags[i][0];
			tag = arSimpleTags[i][1];
		}
		else
		{
			bbTag = tag = arSimpleTags[i];
		}

		sContent = sContent.replace(new RegExp('\\[(\\/?)' + bbTag + '\\]', 'ig'), "<$1" + tag + ">");
	}

	// Link
	sContent = sContent.replace(/\[url\]((?:\s|\S)*?)\[\/url\]/ig, "<a href=\"$1\">$1</a>");
	sContent = sContent.replace(/\[url\s*=\s*((?:[^\[\]]*?(?:\[[^\]]+?\])*[^\[\]]*?)*)\s*\]((?:\s|\S)*?)\[\/url\]/ig, "<a href=\"$1\">$2</a>");

	// Img
	var _this = this;
	sContent = sContent.replace(/\[img(?:\s*?width=(\d+)\s*?height=(\d+))?\]((?:\s|\S)*?)\[\/img\]/ig,
		function(str, w, h, src)
		{
			var strSize = "";
			w = parseInt(w);
			h = parseInt(h);

			if (w && h && _this.bBBParseImageSize)
				strSize = ' width="' + w + '" height="' + h + '"';

			return '<img  src="' + src + '"' + strSize + '/>';
		}
	);

	// Font color
	i = 0;
	while (sContent.toLowerCase().indexOf('[color=') != -1 && sContent.toLowerCase().indexOf('[/color]') != -1 && i++ < 20)
		sContent = sContent.replace(/\[color=((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/color\]/ig, "<font color=\"$1\">$2</font>");

	// List
	i = 0;
	while (sContent.toLowerCase().indexOf('[list=') != -1 && sContent.toLowerCase().indexOf('[/list]') != -1 && i++ < 20)
		sContent = sContent.replace(/\[list=1\]((?:\s|\S)*?)\[\/list\]/ig, "<ol>$1</ol>");

	i = 0;
	while (sContent.toLowerCase().indexOf('[list') != -1 && sContent.toLowerCase().indexOf('[/list]') != -1 && i++ < 20)
		sContent = sContent.replace(/\[list\]((?:\s|\S)*?)\[\/list\]/ig, "<ul>$1</ul>");

	sContent = sContent.replace(/\[\*\]/ig, "<li>");

	// Font
	i = 0;
	while (sContent.toLowerCase().indexOf('[font=') != -1 && sContent.toLowerCase().indexOf('[/font]') != -1 && i++ < 20)
		sContent = sContent.replace(/\[font=((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/font\]/ig, "<font face=\"$1\">$2</font>");

	// Font size
	i = 0;
	while (sContent.toLowerCase().indexOf('[size=') != -1 && sContent.toLowerCase().indexOf('[/size]') != -1 && i++ < 20)
		sContent = sContent.replace(/\[size=((?:\s|\S)*?)\]((?:\s|\S)*?)\[\/size\]/ig, "<font size=\"$1\">$2</font>");

	// Replace \n => <br/>
	sContent = sContent.replace(/\n/ig, "<br />");

	return sContent;
},

UnParseNodeBB: function (pNode) // WYSIWYG -> BBCode
{
	if (pNode.text == "br")
		return "#BR#";

	if (pNode.type == 'text')
		return false;

	//[CODE] Handle code tag
	if (pNode.text == "pre" && pNode.arAttributes['class'] == 'lhe-code')
		return "[CODE]" + this.RecGetCodeContent(pNode) + "[/CODE]";

	pNode.bbHide = true;
	if (pNode.text == 'font' && pNode.arAttributes.color)
	{
		pNode.bbHide = false;
		pNode.text = 'color';
		pNode.bbValue = pNode.arAttributes.color;
	}
	else if (pNode.text == 'font' && pNode.arAttributes.size)
	{
		pNode.bbHide = false;
		pNode.text = 'size';
		pNode.bbValue = pNode.arAttributes.size;
	}
	else if (pNode.text == 'font' && pNode.arAttributes.face)
	{
		pNode.bbHide = false;
		pNode.text = 'font';
		pNode.bbValue = pNode.arAttributes.face;
	}
	else if(pNode.text == 'del')
	{
		pNode.bbHide = false;
		pNode.text = 's';
	}
	else if(pNode.text == 'strong' || pNode.text == 'b')
	{
		pNode.bbHide = false;
		pNode.text = 'b';
	}
	else if(pNode.text == 'em' || pNode.text == 'i')
	{
		pNode.bbHide = false;
		pNode.text = 'i';
	}
	else if(pNode.text == 'blockquote')
	{
		pNode.bbHide = false;
		pNode.text = 'quote';
	}
	else if(pNode.text == 'ol')
	{
		pNode.bbHide = false;
		pNode.text = 'list';
		pNode.bbBreakLineRight = true;
		pNode.bbValue = '1';
	}
	else if(pNode.text == 'ul')
	{
		pNode.bbHide = false;
		pNode.text = 'list';
		pNode.bbBreakLineRight = true;
	}
	else if(pNode.text == 'li')
	{
		pNode.bbHide = false;
		pNode.text = '*';
		pNode.bbBreakLine = true;
		pNode.bbHideRight = true;
	}
	else if(pNode.text == 'a')
	{
		pNode.bbHide = false;
		pNode.text = 'url';
		pNode.bbValue = pNode.arAttributes.href;
	}
	else if(this.parseAlign
		&&
		(pNode.arAttributes.align || pNode.arStyle.textAlign)
		&&
		!(BX.util.in_array(pNode.text.toLowerCase(), ['table', 'tr', 'td', 'th']))
		)
	{
		var align = pNode.arStyle.textAlign || pNode.arAttributes.align;
		if (BX.util.in_array(align, ['left', 'right', 'center', 'justify']))
		{
			pNode.bbHide = false;
			pNode.text = align;
		}
		else
		{
			pNode.bbHide = !BX.util.in_array(pNode.text, this.arBBTags);
		}
	}
	else if(BX.util.in_array(pNode.text, this.arBBTags)) //'p', 'u', 'div', 'table', 'tr', 'img', 'td', 'a'
	{
		pNode.bbHide = false;
	}

	return false;
},

RecGetCodeContent: function(pNode) // WYSIWYG -> BBCode
{
	if (!pNode || !pNode.arNodes || !pNode.arNodes.length)
		return '';

	var res = '';
	for (var i = 0; i < pNode.arNodes.length; i++)
	{
		if (pNode.arNodes[i].type == 'text')
			res += pNode.arNodes[i].text;
		else if (pNode.arNodes[i].type == 'element' && pNode.arNodes[i].text == "br")
			res += (this.bBBCode ? "#BR#" : "\n");
		else if (pNode.arNodes[i].arNodes)
			res += this.RecGetCodeContent(pNode.arNodes[i]);
	}

	if (this.bBBCode)
	{
		if (BX.browser.IsIE())
			res = res.replace(/\r/ig, "#BR#");
		else
			res = res.replace(/\n/ig, "#BR#");
	}
	else if (BX.browser.IsIE())
	{
		res = res.replace(/\n/ig, "\r\n");
	}

	return res;
},

GetNodeHTMLLeftBB: function (pNode)
{
	if(pNode.type == 'text')
	{
		var text = BX.util.htmlspecialchars(pNode.text);
		text = text.replace(/\[/ig, "&#91;");
		text = text.replace(/\]/ig, "&#93;");
		return text;
	}

	var res = "";
	if (pNode.bbBreakLine)
		res += "\n";

	if(pNode.type == 'element' && !pNode.bbHide)
	{
		res += "[" + pNode.text.toUpperCase();
		if (pNode.bbValue)
			res += '=' + pNode.bbValue;
		res += "]";
	}

	return res;
},

GetNodeHTMLRightBB: function (pNode)
{
	var res = "";
	if (pNode.bbBreakLineRight)
		res += "\n";

	if(pNode.type == 'element' && (pNode.arNodes.length > 0 || this.IsPairNode(pNode.text)) && !pNode.bbHide && !pNode.bbHideRight)
		res += "[/" + pNode.text.toUpperCase() + "]";

	return res;
},

OptimizeBB: function (str)
{
	// TODO: kill links without text and names
	// TODO: Kill multiple line ends
	var
		iter = 0,
		bReplasing = true,
		arTags = ['b', 'i', 'u', 's', 'color', 'font', 'size', 'quote'],
		replaceEmptyTags = function(){i--; bReplasing = true; return ' ';},
		re, tagName, i, l;

	while(iter++ < 20 && bReplasing)
	{
		bReplasing = false;
		for (i = 0, l = arTags.length; i < l; i++)
		{
			tagName = arTags[i];
			// Replace empties: [b][/b]  ==> ""
			re = new RegExp('\\[' + tagName + '[^\\]]*?\\]\\s*?\\[/' + tagName + '\\]', 'ig');
			str = str.replace(re, replaceEmptyTags);

			if (tagName !== 'quote')
			{
				re = new RegExp('\\[((' + tagName + '+?)(?:\\s+?[^\\]]*?)?)\\]([\\s\\S]+?)\\[\\/\\2\\](\\s*?)\\[\\1\\]([\\s\\S]+?)\\[\\/\\2\\]', 'ig');
				str = str.replace(re, function(str, b1, b2, b3, spacer, b4)
					{
						if (spacer.indexOf("\n") != -1)
							return str;
						bReplasing = true;
						return '[' + b1 + ']' + b3 + ' ' + b4 + '[/' + b2 + ']';
					}
				);

				//Replace [b]1 [b]2[/b] 3[/b] ===>>  [b]1 2 3[/b]
				// re = new RegExp('(\\[' + tagName + '(?:\\s+?[^\\]]*?)?\\])([\\s\\S]+?)\\1([\\s\\S]+?)(\\[\\/' + tagName + '\\])([\\s\\S]+?)\\4', 'ig');
				// str = str.replace(re, function(str, b1, b2, b3, b4, b5)
				// {
				// bReplasing = true;
				// return b1 + b2 + b3 + b5 + b4;
				// }
				// );
			}
		}
	}
	//
	str = str.replace(/[\r\n\s\t]*?\[\/list\]/ig, "\n[/LIST]");
	str = str.replace(/[\r\n\s\t]*?\[\/list\]/ig, "\n[/LIST]");

	// Cut "\n" in the end of the message (only for BB)
	str = str.replace(/\n*$/ig, '');

	return str;
},

RemoveFormatBB: function()
{
	var str = this.GetTextSelection();
	if (str)
	{
		var
			it = 0,
			arTags = ['b', 'i', 'u', 's', 'color', 'font', 'size'],
			i, l = arTags.length;

		//[b]123[/b]  ==> 123
		while (it < 30)
		{
			str1 = str;
			for (i = 0; i < l; i++)
				str = str.replace(new RegExp('\\[(' + arTags[i] + ')[^\\]]*?\\]([\\s\\S]*?)\\[/\\1\\]', 'ig'), "$2");

			if (str == str1)
				break;
			it++;
		}

		this.WrapWith('', '', str);
	}
},

OnKeyDownBB: function(e)
{
	if(!e) e = window.event;

	var key = e.which || e.keyCode;
	if (e.ctrlKey && !e.shiftKey && !e.altKey)
	{
		switch (key)
		{
			case 66 : // B
			case 98 : // b
				this.FormatBB({tag: 'B'});
				return BX.PreventDefault(e);
			case 105 : // i
			case 73 : // I
				this.FormatBB({tag: 'I'});
				return BX.PreventDefault(e);
			case 117 : // u
			case 85 : // U
				this.FormatBB({tag: 'U'});
				return BX.PreventDefault(e);
			case 81 : // Q - quote
				this.FormatBB({tag: 'QUOTE'});
				return BX.PreventDefault(e);
		}
	}

	// Tab
	if (key == 9)
	{
		this.WrapWith('', '', "\t");
		return BX.PreventDefault(e);
	}

	// Ctrl + Enter
	if ((e.keyCode == 13 || e.keyCode == 10) && e.ctrlKey && this.ctrlEnterHandler)
	{
		this.SaveContent();
		this.ctrlEnterHandler();
	}
},

GetCutHTML: function(e)
{
	if (this.curCutId)
	{
		var pCut = this.pEditorDocument.getElementById(this.curCutId);
		if (pCut)
		{
			pCut.parentNode.insertBefore(BX.create("BR", {}, this.pEditorDocument), pCut);
			pCut.parentNode.removeChild(pCut);
		}
	}

	this.curCutId = this.SetBxTag(false, {tag: "cut"});
	return '<img src="' + this.oneGif+ '" class="bxed-cut" id="' + this.curCutId + '" title="' + BX.message.CutTitle + '"/>';
},

OnPaste: function()
{
	if (this.bOnPasteProcessing)
		return;

	this.bOnPasteProcessing = true;
	var _this = this;
	var scrollTop = this.pEditorDocument.body.scrollTop;
	setTimeout(function(){
		_this.bOnPasteProcessing = false;
		_this.InsertHTML('<span style="visibility: hidden;" id="' + _this.SetBxTag(false, {tag: "cursor"}) + '" ></span>');

		_this.SaveContent();
		setTimeout(function()
		{
			var content = _this.GetContent();

			if (/<\w[^>]*(( class="?MsoNormal"?)|(="mso-))/gi.test(content))
				content = _this.CleanWordText(content);

			_this.SetEditorContent(content);

			setTimeout(function()
			{
				try{
					var pCursor = _this.pEditorDocument.getElementById(_this.lastCursorId);
					if (pCursor && pCursor.parentNode)
					{
						var newScrollTop = pCursor.offsetTop - 30;
						if (newScrollTop > 0)
						{
							if (scrollTop > 0 && scrollTop + parseInt(_this.pFrame.offsetHeight) > newScrollTop)
								_this.pEditorDocument.body.scrollTop = scrollTop;
							else
								_this.pEditorDocument.body.scrollTop = newScrollTop;
						}

						_this.SelectElement(pCursor);
						pCursor.parentNode.removeChild(pCursor);
						_this.SetFocus();
					}
				}catch(e){}
			}, 100);

		}, 100);
	}, 100);
},

CleanWordText: function(text)
{
	text = text.replace(/<(P|B|U|I|STRIKE)>&nbsp;<\/\1>/g, ' ');
	text = text.replace(/<o:p>([\s\S]*?)<\/o:p>/ig, "$1");
	//text = text.replace(/<o:p>[\s\S]*?<\/o:p>/ig, "&nbsp;");

	text = text.replace(/<span[^>]*display:\s*?none[^>]*>([\s\S]*?)<\/span>/gi, ''); // Hide spans with display none

	text = text.replace(/<!--\[[\s\S]*?\]-->/ig, ""); //<!--[.....]--> <!--[if gte mso 9]>...<![endif]-->
	text = text.replace(/<!\[[\s\S]*?\]>/ig, ""); //	<! [if !vml]>
	text = text.replace(/<\\?\?xml[^>]*>/ig, ""); //<xml...>, </xml...>

	text = text.replace(/<o:p>\s*<\/o:p>/ig, "");

	text = text.replace(/<\/?[a-z1-9]+:[^>]*>/gi, "");	//<o:p...>, </o:p>
	text = text.replace(/<([a-z1-9]+[^>]*) class=([^ |>]*)(.*?>)/gi, "<$1$3");
	text = text.replace(/<([a-z1-9]+[^>]*) [a-z]+:[a-z]+=([^ |>]*)(.*?>)/gi, "<$1$3"); //	xmlns:v="urn:schemas-microsoft-com:vml"

	text = text.replace(/&nbsp;/ig, ' ');
	text = text.replace(/\s+?/gi, ' ');

	// Remove mso-xxx styles.
	text = text.replace(/\s*mso-[^:]+:[^;"]+;?/gi, "");

	// Remove margin styles.
	text = text.replace(/\s*margin: 0cm 0cm 0pt\s*;/gi, "");
	text = text.replace(/\s*margin: 0cm 0cm 0pt\s*"/gi, "\"");

	text = text.replace(/\s*TEXT-INDENT: 0cm\s*;/gi, "");
	text = text.replace(/\s*TEXT-INDENT: 0cm\s*"/gi, "\"");


	text = text.replace(/\s*TEXT-ALIGN: [^\s;]+;?"/gi, "\"");
	text = text.replace(/\s*PAGE-BREAK-BEFORE: [^\s;]+;?"/gi, "\"");
	text = text.replace(/\s*FONT-VARIANT: [^\s;]+;?"/gi, "\"");
	text = text.replace(/\s*tab-stops:[^;"]*;?/gi, "");
	text = text.replace(/\s*tab-stops:[^"]*/gi, "");

	text = text.replace(/<FONT[^>]*>([\s\S]*?)<\/FONT>/gi, '$1');
	text = text.replace(/\s*face="[^"]*"/gi, "");
	text = text.replace(/\s*face=[^ >]*/gi, "");
	text = text.replace(/\s*FONT-FAMILY:[^;"]*;?/gi, "");

	// Remove Class attributes
	text = text.replace(/<(\w[^>]*) class=([^ |>]*)([^>]*)/gi, "<$1$3");

	// Remove styles.
	text = text.replace(/<(\w[^>]*) style="([^\"]*)"([^>]*)/gi, "<$1$3");

	// Remove empty styles.
	text = text.replace(/\s*style="\s*"/gi, '');

	// Remove Lang attributes
	text = text.replace(/<(\w[^>]*) lang=([^ |>]*)([^>]*)/gi, "<$1$3");

	var iter = 0;
	while (text.toLowerCase().indexOf('<span') != -1 && text.toLowerCase().indexOf('</span>') != -1 && iter++ < 20)
		text = text.replace(/<span[^>]*?>([\s\S]*?)<\/span>/gi, '$1');

	var
		_text,
		i, tag, arFormatTags = ['b', 'strong', 'i', 'u', 'font', 'span', 'strike'];

	while (true)
	{
		_text = text;
		for (i in arFormatTags)
		{
			tag = arFormatTags[i];
			text = text.replace(new RegExp('<' + tag + '[^>]*?>(\\s*?)<\\/' + tag + '>', 'gi'), '$1');
			text = text.replace(new RegExp('<\\/' + tag + '[^>]*?>(\\s*?)<' + tag + '>', 'gi'), '$1');
		}

		if (_text == text)
			break;
	}

	// Remove empty tags
	text = text.replace(/<(?:[^\s>]+)[^>]*>([\s\n\t\r]*)<\/\1>/g, "$1");
	text = text.replace(/<(?:[^\s>]+)[^>]*>(\s*)<\/\1>/g, "$1");
	text = text.replace(/<(?:[^\s>]+)[^>]*>(\s*)<\/\1>/g, "$1");

	//text = text.replace(/<\/?xml[^>]*>/gi, "");	//<xml...>, </xml...>
	text = text.replace(/<xml[^>]*?(?:>\s*?<\/xml)?(?:\/?)?>/ig, '');
	text = text.replace(/<meta[^>]*?(?:>\s*?<\/meta)?(?:\/?)?>/ig, '');
	text = text.replace(/<link[^>]*?(?:>\s*?<\/link)?(?:\/?)?>/ig, '');
	text = text.replace(/<style[\s\S]*?<\/style>/ig, '');

	text = text.replace(/<table([\s\S]*?)>/gi, "<table>");
	text = text.replace(/<tr([\s\S]*?)>/gi, "<tr>");
	text = text.replace(/(<td[\s\S]*?)width=("|')[\s\S]*?\2([\s\S]*?>)/gi, "$1$3");
	text = text.replace(/(<td[\s\S]*?)height=("|')[\s\S]*?\2([\s\S]*?>)/gi, "$1$3");
	text = text.replace(/(<td[\s\S]*?)style=("|')[\s\S]*?\2([\s\S]*?>)/gi, "$1$3");
	text = text.replace(/(<td[\s\S]*?)valign=("|')[\s\S]*?\2([\s\S]*?>)/gi, "$1$3");
	text = text.replace(/(<td[\s\S]*?)nowrap=("|')[\s\S]*?\2([\s\S]*?>)/gi, "$1$3");
	text = text.replace(/(<td[\s\S]*?)nowrap([\s\S]*?>)/gi, "$1$3");

	text = text.replace(/(<col[\s\S]*?)width=("|')[\s\S]*?\2([\s\S]*?>)/gi, "$1$3");
	text = text.replace(/(<col[\s\S]*?)style=("|')[\s\S]*?\2([\s\S]*?>)/gi, "$1$3");

	// For Opera (12.10+) only when in text we have reference links.
	if (BX.browser.IsOpera())
		text = text.replace(/REF\s+?_Ref\d+?[\s\S]*?MERGEFORMAT\s([\s\S]*?)\s[\s\S]*?<\/xml>/gi, " $1 ");

	return text;
}
};

BXLEditorUtils = function()
{
	this.oTune = {};
	this.setCurrentEditorId('default');
};
BXLEditorUtils.prototype = {
	setCurrentEditorId: function(id)
	{
		this.curId = id;
	},

	prepare : function()
	{
		if (!this.oTune[this.curId])
			this.oTune[this.curId] =
			{
				buttons: [],
				ripButtons: {}
			};
	},

	addButton : function(pBut, ind)
	{
		if (!pBut || !pBut.id)
			return false;
		if (typeof ind == 'undefined')
			ind = -1;

		this.prepare();
		this.oTune[this.curId].buttons.push({but: pBut, ind: ind});

		return true;
	},

	removeButton: function(id)
	{
		this.prepare();
		this.oTune[this.curId].ripButtons[id] = true;
	}
};
oBXLEditorUtils = new BXLEditorUtils();

function BXFindParentElement(pElement1, pElement2)
{
	var p, arr1 = [], arr2 = [];
	while((pElement1 = pElement1.parentNode) != null)
		arr1[arr1.length] = pElement1;
	while((pElement2 = pElement2.parentNode) != null)
		arr2[arr2.length] = pElement2;

	var min, diff1 = 0, diff2 = 0;
	if(arr1.length<arr2.length)
	{
		min = arr1.length;
		diff2 = arr2.length - min;
	}
	else
	{
		min = arr2.length;
		diff1 = arr1.length - min;
	}

	for(var i=0; i<min-1; i++)
	{
		if(BXElementEqual(arr1[i+diff1], arr2[i+diff2]))
			return arr1[i+diff1];
	}
	return arr1[0];
}

window.BXFindParentByTagName = function (pElement, tagName)
{
	tagName = tagName.toUpperCase();
	while(pElement && (pElement.nodeType !=1 || pElement.tagName.toUpperCase() != tagName))
		pElement = pElement.parentNode;
	return pElement;
}


function SetAttr(pEl, attr, val)
{
	if(attr=='className' && !BX.browser.IsIE())
		attr = 'class';

	if(val.length <= 0)
		pEl.removeAttribute(attr);
	else
		pEl.setAttribute(attr, val);
}

function BXCutNode(pNode)
{
	while(pNode.childNodes.length > 0)
		pNode.parentNode.insertBefore(pNode.childNodes[0], pNode);

	pNode.parentNode.removeChild(pNode);
}

/* End */
;
; /* Start:/bitrix/js/main/rating_like.js*/
if (!BXRL)
{
	var BXRL = {};
	var BXRLW = null;
}

RatingLike = function(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile)
{
	this.enabled = true;
	this.likeId = likeId;
	this.entityTypeId = entityTypeId;
	this.entityId = entityId;
	this.available = available == 'Y'? true: false;
	this.userId = userId;
	this.localize = localize;
	this.template = template;
	this.pathToUserProfile = pathToUserProfile;

	this.box = BX('bx-ilike-button-'+likeId);
	if (this.box === null)
	{
		this.enabled = false;
		return false;
	}

	this.button = BX.findChild(this.box, {className:'bx-ilike-left-wrap'}, true, false);
	this.buttonText = BX.findChild(this.button, {className:'bx-ilike-text'}, true, false);
	this.count = BX.findChild(this.box,  {tagName:'span', className:'bx-ilike-right-wrap'}, true, false);
	this.countText	= BX.findChild(this.count, {tagName:'span', className:'bx-ilike-right'}, true, false);
	this.popup = null;
	this.popupId = null;
	this.popupOpenId = null;
	this.popupTimeoutId = null;
	this.popupContent = BX.findChild(BX('bx-ilike-popup-cont-'+likeId), {tagName:'span', className:'bx-ilike-popup'}, true, false);
	this.popupContentPage = 1;
	this.popupListProcess = false;
	this.popupTimeout = false;
	this.likeTimeout = false;

	this.lastVote = BX.hasClass(template == 'standart'? this.button: this.count, 'bx-you-like')? 'plus': 'cancel';
}

RatingLike.LiveUpdate = function(params)
{
	if (params.USER_ID == BX.message('USER_ID'))
		return false;

	for(var i in BXRL)
	{
		if (BXRL[i].entityTypeId == params.ENTITY_TYPE_ID & BXRL[i].entityId == params.ENTITY_ID)
		{
			var element = BXRL[i];
			element.countText.innerHTML = parseInt(params.TOTAL_POSITIVE_VOTES);
			element.count.insertBefore(
				BX.create("span", { props : { className : "bx-ilike-plus-one" }, style: {width: (element.countText.clientWidth-8)+'px', height: (element.countText.clientHeight-8)+'px'}, html: (params.TYPE == 'ADD'? '+1': '-1')})
			, element.count.firstChild);

			if (element.popup)
			{
				element.popup.close();
				element.popupContentPage = 1;
			}
		}
	}
}

RatingLike.Set = function(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile)
{
	if (template === undefined)
		template = 'standart';

	if (!BXRL[likeId] || BXRL[likeId].tryToSet <= 5)
	{
		var tryToSend = BXRL[likeId] && BXRL[likeId].tryToSet? BXRL[likeId].tryToSet: 1;
		BXRL[likeId] = new RatingLike(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile);
		if (BXRL[likeId].enabled)
			RatingLike.Init(likeId);
		else
		{
			setTimeout(function(){
				BXRL[likeId].tryToSet = tryToSend+1;
				RatingLike.Set(likeId, entityTypeId, entityId, available, userId, localize, template, pathToUserProfile);
			}, 500);
		}
	}
};

RatingLike.Init = function(likeId)
{
	// like/unlike button
	if (BXRL[likeId].available)
	{

		BX.bind(BXRL[likeId].template == 'standart'? BXRL[likeId].button: BXRL[likeId].buttonText, 'click' ,function(e) {
			clearTimeout(BXRL[likeId].likeTimeout);
			if (BX.hasClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like'))
			{
				BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_N'];
				BXRL[likeId].countText.innerHTML		= 	parseInt(BXRL[likeId].countText.innerHTML)-1;
				BX.removeClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like');

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'cancel')
						RatingLike.Vote(likeId, 'cancel');
				}, 1000);
			}
			else
			{
				BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_Y'];
				BXRL[likeId].countText.innerHTML 	= 	parseInt(BXRL[likeId].countText.innerHTML)+1;
				BX.addClass(BXRL[likeId].template == 'standart'? this: BXRL[likeId].count, 'bx-you-like');

				BXRL[likeId].likeTimeout = setTimeout(function(){
					if (BXRL[likeId].lastVote != 'plus')
						RatingLike.Vote(likeId, 'plus');
				}, 1000);
			}
			BX.removeClass(this.box, 'bx-ilike-button-hover');
			BX.PreventDefault(e);
		});
		// Hover/unHover like-button
		BX.bind(BXRL[likeId].box, 'mouseover', function() {BX.addClass(this, 'bx-ilike-button-hover')});
		BX.bind(BXRL[likeId].box, 'mouseout', function() {BX.removeClass(this, 'bx-ilike-button-hover')});

	}
	else
	{
		if (BXRL[likeId].buttonText != undefined)
			BXRL[likeId].buttonText.innerHTML	=	BXRL[likeId].localize['LIKE_D'];
	}
	// get like-user-list
	RatingLike.PopupScroll(likeId);

	BX.bind(BXRL[likeId].count, 'mouseover' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
		BXRL[likeId].popupTimeoutId = setTimeout(function(){
			if (BXRLW == likeId)
				return false;
			if (BXRL[likeId].popupContentPage == 1)
				RatingLike.List(likeId, 1);
			BXRL[likeId].popupTimeoutId = setTimeout(function() {
				RatingLike.OpenWindow(likeId);
			}, 400);
		}, 400);
	});
	BX.bind(BXRL[likeId].count, 'mouseout' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
	});
	BX.bind(BXRL[likeId].count, 'click' , function() {
		clearTimeout(BXRL[likeId].popupTimeoutId);
		if (BXRL[likeId].popupContentPage == 1)
			RatingLike.List(likeId, 1);
		RatingLike.OpenWindow(likeId);
	});

	BX.bind(BXRL[likeId].box, 'mouseout' , function() {
		clearTimeout(BXRL[likeId].popupTimeout);
		BXRL[likeId].popupTimeout = setTimeout(function(){
			if (BXRL[likeId].popup !== null)
			{
				BXRL[likeId].popup.close();
				BXRLW = null;
			}
		}, 1000);
	});
	BX.bind(BXRL[likeId].box, 'mouseover' , function() {
		clearTimeout(BXRL[likeId].popupTimeout);
	});
}

RatingLike.OpenWindow = function(likeId)
{
	if (parseInt(BXRL[likeId].countText.innerHTML) == 0)
		return false;

	if (BXRL[likeId].popup == null)
	{
		BXRL[likeId].popup = new BX.PopupWindow('ilike-popup-'+likeId, (BXRL[likeId].template == 'standart'? BXRL[likeId].count: BXRL[likeId].box), {
			lightShadow : true,
			offsetLeft: 5,
			autoHide: true,
			closeByEsc: true,
			zIndex: 2005,
			bindOptions: {position: "top"},
			events : {
				onPopupClose : function() { BXRLW = null; },
				onPopupDestroy : function() {  }
			},
			content : BX('bx-ilike-popup-cont-'+likeId)
		});
		BXRL[likeId].popup.setAngle({});

		BX.bind(BX('ilike-popup-'+likeId), 'mouseout' , function() {
			clearTimeout(BXRL[likeId].popupTimeout);
			BXRL[likeId].popupTimeout = setTimeout(function(){
				BXRL[likeId].popup.close();
			}, 1000);
		});

		BX.bind(BX('ilike-popup-'+likeId), 'mouseover' , function() {
			clearTimeout(BXRL[likeId].popupTimeout);
		});
	}

	if (BXRLW != null)
		BXRL[BXRLW].popup.close();

	BXRLW = likeId;
	BXRL[likeId].popup.show();

	RatingLike.AdjustWindow(likeId);
}

RatingLike.Vote = function(likeId, voteAction)
{
	BX.ajax({
		url: '/bitrix/components/bitrix/rating.vote/vote.ajax.php',
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE' : 'Y', 'RATING_VOTE_TYPE_ID' : BXRL[likeId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRL[likeId].entityId, 'RATING_VOTE_ACTION' : voteAction, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)	{
			BXRL[likeId].lastVote = data.action;
			BXRL[likeId].countText.innerHTML = data.items_all;
			BXRL[likeId].popupContentPage = 1;

			BXRL[likeId].popupContent.innerHTML = '';
			spanTag0 = document.createElement("span");
			spanTag0.className = "bx-ilike-wait";
			BXRL[likeId].popupContent.appendChild(spanTag0);
			RatingLike.AdjustWindow(likeId);

			if(BX('ilike-popup-'+likeId) && BX('ilike-popup-'+likeId).style.display == "block")
				RatingLike.List(likeId, null);
		},
		onfailure: function(data)	{}
	});
	return false;
}

RatingLike.List = function(likeId, page)
{
	if (parseInt(BXRL[likeId].countText.innerHTML) == 0)
		return false;

	if (page == null)
		page = BXRL[likeId].popupContentPage;
	BXRL[likeId].popupListProcess = true;
	BX.ajax({
		url: '/bitrix/components/bitrix/rating.vote/vote.ajax.php',
		method: 'POST',
		dataType: 'json',
		data: {'RATING_VOTE_LIST' : 'Y', 'RATING_VOTE_TYPE_ID' : BXRL[likeId].entityTypeId, 'RATING_VOTE_ENTITY_ID' : BXRL[likeId].entityId, 'RATING_VOTE_LIST_PAGE' : page, 'PATH_TO_USER_PROFILE' : BXRL[likeId].pathToUserProfile, 'sessid': BX.bitrix_sessid()},
		onsuccess: function(data)
		{
			BXRL[likeId].countText.innerHTML = data.items_all;

			if ( parseInt(data.items_page) == 0 )
				return false;

			if (page == 1)
			{
				BXRL[likeId].popupContent.innerHTML = '';
				spanTag0 = document.createElement("span");
				spanTag0.className = "bx-ilike-bottom_scroll";
				BXRL[likeId].popupContent.appendChild(spanTag0);
			}
			BXRL[likeId].popupContentPage += 1;

			for (var i = 0; i < data.items.length; i++)
			{
				BXRL[likeId].popupContent.appendChild(
					BX.create("a", { attrs: { href: data.items[i]['URL'], target: '_blank' }, props : { className : "bx-ilike-popup-img"}, children:[
						BX.create("span", { props : { className : "bx-ilike-popup-avatar"}, html: data.items[i]['PHOTO']}),
						BX.create("span", { props : { className : "bx-ilike-popup-name"}, html: data.items[i]['FULL_NAME']})
					]})
				);
			}

			RatingLike.AdjustWindow(likeId);
			RatingLike.PopupScroll(likeId);

			BXRL[likeId].popupListProcess = false;
		},
		onfailure: function(data)	{}
	});
	return false;
}

RatingLike.AdjustWindow = function(likeId)
{
	if (BXRL[likeId].popup != null)
	{
		BXRL[likeId].popup.bindOptions.forceBindPosition = true;
		BXRL[likeId].popup.adjustPosition();
		BXRL[likeId].popup.bindOptions.forceBindPosition = false;
	}
}

RatingLike.PopupScroll = function(likeId)
{
	BX.bind(BXRL[likeId].popupContent, 'scroll' , function() {
		if (this.scrollTop > (this.scrollHeight - this.offsetHeight) / 1.5)
		{
			RatingLike.List(likeId, null);
			BX.unbindAll(this);
		}
	});
}
/* End */
;
; /* Start:/bitrix/js/main/core/core_viewer.js*/
;(function(){

if (window.BX.CViewer)
	return;

BX.viewElementBind = function(div, params, isTarget, groupBy)
{
	var obElementViewer = new BX.CViewer(params);

	if(!isTarget)
		isTarget = function(node){
			return BX.type.isElementNode(node) && (node.getAttribute('data-bx-viewer') || node.tagName.toUpperCase() == 'IMG');
		}
;

	BX.ready(function(){
		_viewerElementBind(div, isTarget, groupBy, obElementViewer);
	});

	return obElementViewer;
};

function _viewerElementBind(div, isTarget, groupBy, obElementViewer)
{
	var div = BX(div);
	if (!!div)
	{
		BX.bindDelegate(div, 'click', isTarget, function(e)
		{
			//not run elementShow if click on folder
			if(this.getAttribute('data-bx-viewer') == 'folder')
				return true;

			var parent = div;
			if (!!groupBy)
			{
				parent = BX.findParent(this, groupBy, div)||parent;
			}

			obElementViewer.setList([]);
			var elementNodeList = BX.findChildren(parent, isTarget, true);
			for(var i=0; i<elementNodeList.length; i++)
			{
				var type = elementNodeList[i].getAttribute('data-bx-viewer');
				if(type == 'image' || elementNodeList[i].getAttribute('data-bx-image'))
				{
					obElementViewer.add(new BX.CViewImageElement({
						src: elementNodeList[i].getAttribute('data-bx-src') || elementNodeList[i].getAttribute('data-bx-download') || elementNodeList[i].getAttribute('data-bx-image'),
						width: elementNodeList[i].getAttribute('data-bx-width'),
						height: elementNodeList[i].getAttribute('data-bx-height'),
						title: elementNodeList[i].getAttribute('data-bx-title')||elementNodeList[i].alt||elementNodeList[i].title,
						full: elementNodeList[i].getAttribute('data-bx-full'),
						full_width: elementNodeList[i].getAttribute('data-bx-full-width'),
						full_height: elementNodeList[i].getAttribute('data-bx-full-height'),
						full_size: elementNodeList[i].getAttribute('data-bx-full-size'),
						buttons: [
							BX.create('a', {
								props: {
									className: 'bx-viewer-btn',
									href: elementNodeList[i].getAttribute('data-bx-download') || elementNodeList[i].getAttribute('data-bx-full') || elementNodeList[i].getAttribute('data-bx-image') || elementNodeList[i].getAttribute('data-bx-src')
								},
								events: {
									click: BX.eventCancelBubble
								},
								text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
							})
						]
					}));
				}
				else if(type == 'iframe-extlinks')
				{
					var iframeElement = new BX.CViewIframeExtLinksElement({
						title: elementNodeList[i].getAttribute('data-bx-title'),
						src: elementNodeList[i].getAttribute('data-bx-src'),
						viewerUrl: elementNodeList[i].getAttribute('data-bx-viewerUrl'),
						buttons: []
					});
					iframeElement.buttons.push(
						BX.create('a', {
							props: {
								className: 'bx-viewer-btn',
								href: elementNodeList[i].getAttribute('data-bx-src')
							},
							events: {
								click: function(e)
								{
									//if click on download link, but iframe not loaded.
									if(!iframeElement.loaded)
									{
										setTimeout(function(){
											obElementViewer.show(iframeElement);
										}, 50);
									}
									BX.eventCancelBubble(e);
									return false;
								}
							},
							text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
						}));
					obElementViewer.add(iframeElement);
				}
				else if(type == 'iframe')
				{
					var iframeElement = obElementViewer.createIframeElement(elementNodeList[i]);
					obElementViewer.add(iframeElement);
				}
				else if(type == 'unknown')
				{
					obElementViewer.add(new BX.CViewUnknownElement({
						title: elementNodeList[i].getAttribute('data-bx-title'),
						src: elementNodeList[i].getAttribute('data-bx-src'),
						owner: elementNodeList[i].getAttribute('data-bx-owner'),
						size: elementNodeList[i].getAttribute('data-bx-size'),
						dateModify: elementNodeList[i].getAttribute('data-bx-dateModify'),
						tooBigSizeMsg: !!elementNodeList[i].getAttribute('data-bx-tooBigSizeMsg'),
						buttons: [
							BX.create('a', {
								props: {
									className: 'bx-viewer-btn',
									href: elementNodeList[i].getAttribute('data-bx-src')
								},
								events: {
									click: BX.eventCancelBubble
								},
								text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
							})
						]
					}));
				}
				else if(type == 'folder')
				{
					obElementViewer.add(new BX.CViewFolderElement({
						title: elementNodeList[i].getAttribute('data-bx-title'),
						src: elementNodeList[i].getAttribute('data-bx-src'),
						owner: elementNodeList[i].getAttribute('data-bx-owner'),
						dateModify: elementNodeList[i].getAttribute('data-bx-dateModify'),
						buttons: []
					}));
				}
			}
			BX.CViewer.objNowInShow = obElementViewer;
			obElementViewer.show(this.getAttribute('data-bx-image')||this.getAttribute('data-bx-src')||this.src);

			return BX.PreventDefault(e);
		});
	}
};


BX.CViewCoreElement = function(params)
{
	params = params || {};
	this.baseElementId = params.baseElementId;
	this.id = params.id || params.src;
	this.title = params.title;
	this.text = params.text;
	this.width = params.width;
	this._minWidth = params._minWidth;
	this.height = params.height;
	this._minHeight = params._minHeight;
	this.domElement = null;
	this.titleDomElement = null;
	this.titleButtons = null;
	this.src = params.src;
	this.loaded = false;
	this.preventShow = false;
	this.listOfTimeoutIds = [];
	this.contentWrap = null;
	this.isProccessed = false;
	this.topPadding = 0;
	this.buttons = params.buttons || [];
	this.showTitle = params.showTitle || true;
	this.isHistory = false;

	if(this._minWidth === undefined)
	{
		this._minWidth = 550;
	}
	if(this._minHeight === undefined)
	{
		this._minHeight = 350;
	}
}

BX.CViewCoreElement.prototype.getDataForCommit = function()
{
	return {};
}

BX.CViewCoreElement.prototype.setContentWrap = function(contentWrap){
	this.contentWrap = contentWrap;
};

BX.CViewCoreElement.prototype.runAction = function(action, params){
	return;
};

BX.CViewCoreElement.prototype.getTextForSave = function(){
	return '';
};

BX.CViewCoreElement.prototype.getIconClassByName = function(filename)
{
	filename = filename || '';
	var extension = filename.split('.').pop();
	var className = '';
	switch(extension.toLowerCase())
	{
		case 'txt':
			className = 'bx-viewer-icon-txt';
			break;
		case 'archive':
		case 'gz':
		case 'bz2':
		case 'tar':
			className = 'bx-viewer-icon-archive';
			break;
		case 'zip':
			className = 'bx-viewer-icon-zip';
			break;
		case 'rar':
			className = 'bx-viewer-icon-rar';
			break;
		case 'pdf':
			className = 'bx-viewer-icon-pdf';
			break;
		case 'ppt':
		case 'pptx':
			className = 'bx-viewer-icon-ppt';
			break;
		case 'doc':
		case 'docx':
			className = 'bx-viewer-icon-doc';
			break;
		case 'xls':
		case 'xlsx':
			className = 'bx-viewer-icon-xls';
			break;
		default:
			className = 'bx-viewer-icon';
			break;
	}
	return className;
}

BX.CViewCoreElement.prototype.load = function(successLoadCallback)
{
}
BX.CViewCoreElement.prototype.preload = function(successLoadCallback)
{
}
BX.CViewCoreElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.preventTimeout();
	this.preventShow = true;
}

BX.CViewCoreElement.prototype.show = function()
{
	this.preventShow = false;
}

BX.CViewCoreElement.prototype.successLoad = function(self)
{}

BX.CViewCoreElement.prototype.onLoad = function()
{
}

BX.CViewCoreElement.prototype.getTitle = function()
{
	return this.title;
}
BX.CViewCoreElement.prototype.getSize = function()
{
	return {
		width: this.width,
		height: this.height
	};
}
BX.CViewCoreElement.prototype.resize = function(w, h)
{
	this.width = w;
	this.height = h;
}
BX.CViewCoreElement.prototype.addTimeoutId = function(id)
{
	this.listOfTimeoutIds.push(id);
}
BX.CViewCoreElement.prototype.preventTimeout = function()
{
	if(!BX.type.isArray(this.listOfTimeoutIds))
	{
		return;
	}
	for (var i in this.listOfTimeoutIds)
	{
		if (this.listOfTimeoutIds.hasOwnProperty(i))
		{
			clearTimeout(this.listOfTimeoutIds[i]);
		}
	}
	this.listOfTimeoutIds = [];
}
BX.CViewCoreElement.prototype.addToLinkSessid = function(link)
{
	return this.addToLinkParam(link, 'sessid', BX.bitrix_sessid());
}
BX.CViewCoreElement.prototype.addToLinkParam = function(link, name, value)
{
	if(!link.length)
	{
		return '?' + name + '=' + value;
	}
	link = BX.util.remove_url_param(link, name);
	if(link.indexOf('?') != -1)
	{
		return link + '&' + name + '=' + value;
	}
	return link + '?' + name + '=' + value;
}
//##############################################################################

BX.CViewImageElement = function(params)
{
	params = params || {};
	BX.CViewIframeElement.superclass.constructor.apply(this, arguments);
	this.image = null;
	this.width = params.width || 200;
	this.height = params.height || 200;
	this.full = params.full;
	this.full_width = params.full_width;
	this.full_height = params.full_height;
	this.full_size = params.full_size;
	this.topPadding = 43;
}

BX.extend(BX.CViewImageElement, BX.CViewCoreElement);

BX.CViewImageElement.prototype.setContentWrap = function(contentWrap){
	this.contentWrap = contentWrap;
};
BX.CViewImageElement.prototype.load = function(successLoadCallback)
{
	successLoadCallback = successLoadCallback || BX.CViewImageElement.prototype.successLoad;
	if(!this.loaded)
	{
		this.preload(function(self){
			successLoadCallback(self);
			self.contentWrap.appendChild(self.domElement);
		});
	}
	else
	{
		(function(self){
			successLoadCallback(self);
			self.contentWrap.appendChild(self.domElement);
		})(this);
	}
	//buildDomElement
	//this.contentWrap.appendChild(this.domElement);
	//this.show();
}
BX.CViewImageElement.prototype.preload = function(successLoadCallback)
{
	if(this.isProccessed)
	{
		return false;
	}
	this.successLoad = successLoadCallback || BX.CViewImageElement.prototype.successLoad;
	if(!this.loaded)
	{
		this.titleDomElement = BX.create('span', {
			props: {
				className: 'bx-viewer-file-name',
				title: this.title
			},
			text: this.title
		});
		this.titleButtons = BX.create('span', {
			props: {
				className: 'bx-viewer-top-right'
			},
			style: {
				display: 'none'
			},
			children: this.buttons
		});

		this.image = new Image();
		this.image.onload = BX.proxy(this.onLoad, this);
		this.image.src = this.src;
		this.image.className = 'bx-viewer-image';
		this.image.style.opacity = 0;

		this.isProccessed = true;
		this.domElement = BX.create('div', {
			props: {
				className:'bx-viewer-cap-wrap'
			},
			children: [
			]
		});
	}

	return this.domElement;
}
BX.CViewImageElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.image.style.opacity = 0;
	this.titleButtons.style.display = 'none';
	this.preventTimeout();
	this.preventShow = isCloseElement? false : true;
}

BX.CViewImageElement.prototype.show = function()
{
	if(!this.domElement)
	{
		return;
	}
	var visibleHeight = this.height;
	if(this.image && this.image.style.height)
	{
		visibleHeight = parseInt(this.image.style.height);
	}
	//vertical align
	if(visibleHeight < this._minHeight)
	{
		BX.adjust(this.domElement, {
			style: {
				paddingTop: (this._minHeight - visibleHeight)/2 + 'px'
			}
		});
	}

	this.titleButtons.style.display = 'block';
	this.image.style.opacity = 1;
	this.preventShow = false;
}

BX.CViewImageElement.prototype.successLoad = function(self)
{}

BX.CViewImageElement.prototype.onLoad = function()
{
	var self = this;
	this.isProccessed = false;
	setTimeout(function(){
		self.loaded = true;
		self.height = self.image.height;
		self.width = self.image.width;
		self.image.style.maxWidth = self.width + "px";
		self.image.style.maxHeight = self.height  + "px";
		self.domElement.appendChild(self.image);
		self.successLoad(self);
	}, 50);
}

//##############################################################################
BX.CViewIframeElement = function(params)
{
	BX.CViewIframeElement.superclass.constructor.apply(this, arguments);
	this.width = 800;
	this._minWidth = 800;
	this.height = 600;
	this._minHeight = 600;
	this.topPadding = 43;
	this.viewerUrl = '';
	this.askConvert = !!params.askConvert;
	this.editUrl = params.editUrl? this.addToLinkSessid(params.editUrl) : '';
	this.downloadUrl = params.downloadUrl || '';
	this.dataForCommit = {};
	this.urlToPost = params.urlToPost || '';
	this.idToPost = params.idToPost || '';
}

BX.extend(BX.CViewIframeElement, BX.CViewCoreElement);

BX.CViewIframeElement.prototype.runAction = function(action, params){

	//todo normalize this! check params, add action class. Return result action.
	action = action.toLowerCase();
	switch(action)
	{
		case 'discard':
			var uriToDoc = params.uriToDoc;
			var idDoc = params.idDoc;
			if(!uriToDoc || !idDoc)
			{
				return false;
			}
			BX.ajax.loadJSON(uriToDoc, {discard: 1, id: idDoc, sessid: BX.bitrix_sessid()}, function(){

			});

			break;
		case 'edit':
			if(!this.editUrl)
			{
				return false;
			}
			this.addTimeoutId(setTimeout(function(){
				BX.fireEvent(BX('bx-viewer-edit-btn'), 'click')
			}, 100));
			break;
		case 'forceedit':
			if(!this.editUrl || !params.obElementViewer)
			{
				return false;
			}
//			this.addTimeoutId(setTimeout(BX.delegate(function(){
				this.editFile(params.obElementViewer);
//			}, this), 100));
			break;
		case 'commit':
			this.commitFile(params);
			break;
	}
	
	return;
};

BX.CViewIframeElement.prototype.getTextForSave = function(){
	return BX.message('JS_CORE_VIEWER_IFRAME_PROCESS_SAVE_DOC');
};

BX.CViewIframeElement.prototype.editFile = function(obElementViewer)
{
	if(!this.askConvert)
	{
		var editUrl = this.editUrl;
		if(BX.CViewer.temporaryServiceEditDoc)
		{
			editUrl = BX.util.remove_url_param(this.editUrl, 'editIn');
			if(editUrl.indexOf('?'))
				editUrl += '&editIn=' + BX.CViewer.temporaryServiceEditDoc;
			else
				editUrl += '?editIn=' + BX.CViewer.temporaryServiceEditDoc;
			BX.CViewer.temporaryServiceEditDoc = '';
		}
		var modalWindow = obElementViewer.openModal(
			editUrl,
			this.title
		);

		obElementViewer.openConfirm(BX.message('JS_CORE_VIEWER_IFRAME_DESCR_SAVE_DOC'), [
			new BX.PopupWindowButton({
				text : BX.message('JS_CORE_VIEWER_IFRAME_SAVE_DOC'),
				className : "popup-window-button-accept",
				events : { click : BX.delegate(function() {

						obElementViewer.showLoading({text: obElementViewer.getCurrent().getTextForSave()});

						var dataForCommit = obElementViewer.getCurrent().getDataForCommit();
						dataForCommit.obElementViewer = obElementViewer;
						dataForCommit.success = BX.delegate(function(element, response){
							if(this.bVisible && this.isCurrent(element))
							{
								var elementId = response.elementId;
								var cid = response.cid;
								if(element.urlToPost && response.serialize /*&& fileId*/)
								{
									BX.ajax({
										'method': 'POST',
										'dataType': 'html',
										'url': element.urlToPost,
										'data':  {
											sessid: BX.bitrix_sessid(),
											comment_post_id: element.idToPost,
											act: 'add',
											post: 'Y',
											save: 'Y',
											webdav_history: 'Y',
											'UF_BLOG_COMMENT_FH': response.serialize,
											blog_upload_cid: cid,
											comment: BX.message('JS_CORE_VIEWER_IFRAME_UPLOAD_NEW_VERSION_IN_COMMENT')
										},
										'onsuccess': function(data){}
									});
									element.isHistory = true;
								}

								if(element.isHistory && element.baseElementId)
								{
									this.setCurrent(this.createIframeElement(BX(element.baseElementId)));
									this.show();
								}
								else
								{
									this.show(element, true);
								}
							}
						}, obElementViewer);

						obElementViewer.runActionByCurrentElement('commit', dataForCommit);
						obElementViewer.closeConfirm();
						try{
							modalWindow.close();
						}catch(e){}
					}, this
				)}
			}),
			new BX.PopupWindowButton({
				text : BX.message('JS_CORE_VIEWER_IFRAME_DISCARD_DOC'),
				events : { click : BX.delegate(function() {
						obElementViewer.closeConfirm();
						try{
							modalWindow.close();
						}catch(e){}
						obElementViewer.runActionByCurrentElement('discard', obElementViewer.getCurrent().getDataForCommit());
					}, this
				)}
			})
		], true);


		return false;
	}

	obElementViewer.openConfirm(BX.util.htmlspecialchars(BX.message('JS_CORE_VIEWER_IFRAME_CONVERT_TO_NEW_FORMAT')), [
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_IFRAME_CONVERT_ACCEPT'),
			className : "popup-window-button-accept",
			events : { click : BX.delegate(function() {
					var modalWindow = obElementViewer.openModal(
						this.editUrl,
						this.title
					);
					obElementViewer.closeConfirm();
					obElementViewer.openConfirm(BX.message('JS_CORE_VIEWER_IFRAME_DESCR_SAVE_DOC'), [
						new BX.PopupWindowButton({
							text : BX.message('JS_CORE_VIEWER_IFRAME_SAVE_DOC'),
							className : "popup-window-button-accept",
							events : { click : BX.delegate(function() {
									obElementViewer.showLoading({text: obElementViewer.getCurrent().getTextForSave()});

									var dataForCommit = obElementViewer.getCurrent().getDataForCommit();
									dataForCommit.obElementViewer = obElementViewer;
									dataForCommit.success = BX.delegate(function(element, data){
										if(this.bVisible && this.isCurrent(element))
										{
											this.show(element, true);
										}
									}, obElementViewer);

									obElementViewer.runActionByCurrentElement('commit', dataForCommit);
									obElementViewer.closeConfirm();
									try{
										modalWindow.close();
									}catch(e){}
								}, this
							)}
						}),
						new BX.PopupWindowButton({
							text : BX.message('JS_CORE_VIEWER_IFRAME_DISCARD_DOC'),
							events : { click : BX.delegate(function() {
									obElementViewer.closeConfirm();
									try{
										modalWindow.close();
									}catch(e){}
									obElementViewer.runActionByCurrentElement('discard', obElementViewer.getCurrent().getDataForCommit());
								}, this
							)}
						})
					], true);
				}, this
			)}
		}),
		new BX.PopupWindowButton({
			text : BX.message('JS_CORE_VIEWER_IFRAME_CONVERT_DECLINE'),
			events : { click : BX.delegate(function() {
					obElementViewer.closeConfirm();
				}, this
			)}
		})
	], true);

	return false;
}

BX.CViewIframeElement.prototype.load = function(successLoadCallback)
{
	var self = this;
	if(!this.loaded)
	{
		BX.ajax({
			'method': 'POST',
			'dataType': 'json',
			'url': self.src,
			'data':  {
				sessid: BX.bitrix_sessid(),
				json: 1
			},
			'onsuccess': function(data){
				var checkIframeError = function(){
					if(BX.localStorage.get('iframe_options_error'))
					{
						BX.onCustomEvent(self, 'onIframeDocError', [self]);
						return;
					}
					if(BX.localStorage.get('iframe_options_error') !== null)
					{
						return;
					}
					BX.ajax({
						'method': 'POST',
						'dataType': 'json',
						'url': self.src,
						'data':  {
							extLink: data.file,
							sessid: BX.bitrix_sessid(),
							checkViewByGoogle: 1
						},
						'onsuccess': function(data){
							if(!data || !data.viewByGoogle)
							{
								BX.onCustomEvent(self, 'onIframeDocError', [self]);
							}
							else
							{
								BX.onCustomEvent(self, 'onIframeDocSuccess', [self]);
							}
						}
					});
				};

				self.domElement = BX.create('iframe', {
					props: {
						className: 'bx-viewer-image',
						src: data.viewerUrl
					},
					events: {
						load: BX.browser.IsFirefox()? BX.proxy(function(){
							BX.proxy(this.onLoad, this);
							checkIframeError();
						}, self) : BX.proxy(self.onLoad, self)
					},
					style: {
						border: 'none'
					}
				});
				self.contentWrap.appendChild(self.domElement);

				self.viewerUrl = data.viewerUrl;
				if(BX.localStorage.get('iframe_options_error'))
				{
					BX.onCustomEvent(self, 'onIframeDocError', [self]);
				}
				else if(!BX.browser.IsFirefox() && BX.localStorage.get('iframe_options_error') === null)
				{
					self.addTimeoutId(setTimeout(checkIframeError, 15000));
				}

			}
		});

		this.titleDomElement = BX.create('span', {
			props: {
				className: 'bx-viewer-file-name',
				title: this.title
			},
			text: this.title
		});

		this.titleButtons = BX.create('span', {
			props: {
				className: 'bx-viewer-top-right'
			},
			style: {
				//display: 'none'
			},
			children: this.buttons
		});

		this.successLoad = successLoadCallback || BX.CViewIframeElement.prototype.successLoad;
		this.isProccessed = true;
	}
}
BX.CViewIframeElement.prototype.commitFile = function(parameters)
{
	parameters = parameters || {};
	if(!parameters || !parameters.obElementViewer)
	{
		return false;
	}

	var uriToDoc = parameters.uriToDoc;
	var idDoc = parameters.idDoc;
	if(!uriToDoc || !idDoc)
	{
		return false;
	}

	BX.ajax.loadJSON(uriToDoc, {commit: 1, id: idDoc, sessid: BX.bitrix_sessid()}, BX.delegate(function(result){
		var newName = result.newName;
		var oldName = result.oldName;
		if(newName)
		{
			BX.CViewer._convertElementsMatch[this.src] = {
				src: this.src.replace(oldName, newName),
				title: this.title.replace(oldName, newName)
			};
			this.title = BX.CViewer._convertElementsMatch[this.src].title;
			this.src = BX.CViewer._convertElementsMatch[this.src].src;
		}
		if(BX.type.isFunction(parameters.success))
		{
			parameters.success(this, result);
		}
	}, this));

	return false;
}

BX.CViewIframeElement.prototype.setDataForCommit = function(data)
{
	if(data && arguments.length == 1)
	{
		this.dataForCommit = data;
	}
	else if(BX.browser.IsIE())
	{
		//IE and garbage collector delete all objects (from modal window). This is half-hack.
		for(var key in arguments)
		{
			switch(key)
			{
				case 0:
				case '0':
					this.dataForCommit['iframeSrc'] = arguments[key];
					break;
				case 1:
				case '1':
					this.dataForCommit['uriToDoc'] = arguments[key];
					break;
				case 2:
				case '2':
					this.dataForCommit['idDoc'] = arguments[key];
					break;
			}
		}

	}

	return;
}

BX.CViewIframeElement.prototype.getDataForCommit = function()
{
	return this.dataForCommit;
}

BX.CViewIframeElement.prototype.preload = function(successLoadCallback)
{
	return false;
}
BX.CViewIframeElement.prototype.onLoad = function()
{
	if(this.loaded)
	{
		return;
	}
	this.loaded = true;
	this.successLoad(this);
}
BX.CViewIframeElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	//this.titleButtons.style.display = 'block';
	this.preventShow = false;
}
BX.CViewIframeElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	if(this.domElement)
	{
		this.domElement.style.opacity = 0;
		//this.titleButtons.style.display = 'none';
		BX.unbind(this.domElement, 'load', BX.proxy(this.onLoad, this));
	}
	//this.domElement.style.display = 'none';
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}

//##############################################################################
BX.CViewIframeExtLinksElement = function(params)
{
	BX.CViewIframeExtLinksElement.superclass.constructor.apply(this, arguments);
	this.width = 800;
	this._minWidth = 800;
	this.height = 600;
	this._minHeight = 600;
	this.topPadding = 43;
	this.viewerUrl = params.viewerUrl;
	this.askConvert = false;
	this.editUrl = false;
}

BX.extend(BX.CViewIframeExtLinksElement, BX.CViewIframeElement);

BX.CViewIframeExtLinksElement.prototype.load = function(successLoadCallback)
{
	var self = this;
	if(!this.loaded)
	{
		var checkIframeError = function(){
			if(BX.localStorage.get('iframe_options_error'))
			{
				BX.onCustomEvent(self, 'onIframeDocError', [self]);
				return;
			}
			if(BX.localStorage.get('iframe_options_error') !== null)
			{
				return;
			}
			BX.ajax({
				'method': 'POST',
				'dataType': 'json',
				'url': self.src,
				'data':  {
					sessid: BX.bitrix_sessid(),
					checkViewByGoogle: 1
				},
				'onsuccess': function(data){
					if(!data || !data.viewByGoogle)
					{
						BX.onCustomEvent(self, 'onIframeDocError', [self]);
					}
					else
					{
						BX.onCustomEvent(self, 'onIframeDocSuccess', [self]);
					}
				}
			});
		};

		this.domElement = BX.create('iframe', {
			props: {
				className: 'bx-viewer-image',
				src: this.viewerUrl
			},
			events: {
				load: BX.browser.IsFirefox()? BX.proxy(function(){
					BX.proxy(this.onLoad, this);
					checkIframeError();
				}, self) : BX.proxy(self.onLoad, self)
			},
			style: {
				border: 'none'
			}
		});
		this.contentWrap.appendChild(this.domElement);

		if(BX.localStorage.get('iframe_options_error'))
		{
			BX.onCustomEvent(this, 'onIframeDocError', [this]);
		}
		else if(!BX.browser.IsFirefox() && BX.localStorage.get('iframe_options_error') === null)
		{
			this.addTimeoutId(setTimeout(checkIframeError, 15000));
		}

		this.titleDomElement = BX.create('span', {
			props: {
				className: 'bx-viewer-file-name',
				title: this.title
			},
			text: this.title
		});

		this.titleButtons = BX.create('span', {
			props: {
				className: 'bx-viewer-top-right'
			},
			style: {
				//display: 'none'
			},
			children: this.buttons
		});

		this.successLoad = successLoadCallback || BX.CViewIframeExtLinksElement.prototype.successLoad;
		this.isProccessed = true;
	}
}
BX.CViewIframeExtLinksElement.prototype.commitFile = function(parameters)
{
	return false;
}

//##############################################################################
BX.CViewErrorIframeElement = function(params)
{
	BX.CViewErrorIframeElement.superclass.constructor.apply(this, arguments);
	this.width = 600;
	this._minWidth = 600;
	this.height = 350;
	this._minHeight = 350;
	this.topPadding = 43;
	this.buttonUrl = params.buttonUrl;
}

BX.extend(BX.CViewErrorIframeElement, BX.CViewCoreElement);

BX.CViewErrorIframeElement.prototype.load = function(successLoadCallback)
{
	this.titleDomElement = BX.create('span', {
		props: {
			className: 'bx-viewer-file-name',
			title: this.title
		},
		text: this.title
	});

	this.titleButtons = BX.create('span', {
		props: {
			className: 'bx-viewer-top-right'
		},
		children: this.buttons
	});

	this.domElement = BX.create('div', {
		props: {
			className: 'bx-viewer-cap-wrap bx-viewer-cap-file'
		},
		children: [
			(BX.create('div', {
					props: {
					},
					children: [
						(BX.create('div', {
							props: {
								className: 'bx-viewer-icon ' + this.getIconClassByName(this.title)
							}
						})),
						(BX.create('div', {
							props: {
								className: 'bx-viewer-cap-text-block'
							},
							children: [
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-title',
										title: this.title
									},
									text: this.title
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-too-big-title'
									},
									text: BX.message('JS_CORE_VIEWER_IFRAME_DESCR_ERROR')
								})),
								(BX.create('a', {
									props: {
										className: 'bx-viewer-btn',
										target: '_blank',
										href: this.buttonUrl
									},
									events: {
										click: BX.eventCancelBubble
									},
									text: BX.message('JS_CORE_VIEWER_OPEN_WITH_GVIEWER')
								}))
							]
						}))
					]
			}))
		]
	});

	this.successLoad = successLoadCallback || BX.CViewUnknownElement.prototype.successLoad;
	this.contentWrap.appendChild(this.domElement);
	this.loaded = true;
	this.successLoad(this);

}

BX.CViewErrorIframeElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	this.titleButtons.style.display = 'block';
	this.preventShow = false;
}
BX.CViewErrorIframeElement.prototype.hide = function()
{
	this.domElement.style.opacity = 0;
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}


//##############################################################################
BX.CViewUnknownElement = function(params)
{
	BX.CViewUnknownElement.superclass.constructor.apply(this, arguments);
	this.width = 600;
	this._minWidth = 600;
	this.height = 350;
	this._minHeight = 350;
	this.owner = params.owner;
	this.dateModify = params.dateModify;
	this.size = params.size;
	this.topPadding = 43;
	this.tooBigSizeMsg = !!params.tooBigSizeMsg;
}

BX.extend(BX.CViewUnknownElement, BX.CViewCoreElement);

BX.CViewUnknownElement.prototype.load = function(successLoadCallback)
{
	if(this.loaded)
	{
		return;
	}

	this.titleDomElement = BX.create('span', {
		props: {
			className: 'bx-viewer-file-name',
			title: this.title
		},
		text: this.title
	});

	this.titleButtons = BX.create('span', {
		props: {
			className: 'bx-viewer-top-right'
		},
		children: this.buttons
	});

	var srcLink = this.src;
	this.domElement = BX.create('div', {
		props: {
			className: 'bx-viewer-cap-wrap bx-viewer-cap-file'
		},
		children: [
			(BX.create('div', {
					props: {
					},
					children: [
						(BX.create('div', {
							props: {
								className: 'bx-viewer-icon ' + this.getIconClassByName(this.title)
							}
						})),
						(BX.create('div', {
							props: {
								className: 'bx-viewer-cap-text-block'
							},
							children: [
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-title',
										title: this.title
									},
									text: this.title
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-too-big-title'
									},
									style: {
										display: this.tooBigSizeMsg? '' : 'none'
									},
									text: BX.message('JS_CORE_VIEWER_TOO_BIG_FOR_VIEW')
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-text'
									},
									html:'<span class="bx-viewer-cap-text-title">' + BX.message('JS_CORE_VIEWER_DESCR_AUTHOR') + ': </span> ' + BX.util.htmlspecialchars(this.owner) + '<br/>' + '<span class="bx-viewer-cap-text-title">' + BX.message('JS_CORE_VIEWER_DESCR_LAST_MODIFY') + ': </span> ' + BX.util.htmlspecialchars(this.dateModify) + '<br/>' + this.size
								})),
								(BX.create('span', {
									props: {
										className: 'bx-viewer-btn'
									},
									events: {
										click: function(e){
											document.location.href = srcLink;
											return false;
										}
									},
									text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
								}))
							]
						}))
					]
			}))
		]
	});
	this.successLoad = successLoadCallback || BX.CViewUnknownElement.prototype.successLoad;
	this.contentWrap.appendChild(this.domElement);
	this.loaded = true;
	this.successLoad(this);
}
BX.CViewUnknownElement.prototype.preload = function(successLoadCallback)
{
}
BX.CViewUnknownElement.prototype.onLoad = function()
{
}
BX.CViewUnknownElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	this.titleButtons.style.display = 'block';
	this.preventShow = false;
}
BX.CViewUnknownElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.domElement.style.opacity = 0;
	this.titleButtons.style.display = 'none';
	//this.domElement.style.display = 'none';
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}
//##############################################################################
BX.CViewFolderElement = function(params)
{
	BX.CViewFolderElement.superclass.constructor.apply(this, arguments);
	this.width = 600;
	this._minWidth = 600;
	this.height = 350;
	this._minHeight = 350;
	this.owner = params.owner;
	this.dateModify = params.dateModify;
	this.size = params.size;
	this.topPadding = 0;
	this.showTitle = false;
}

BX.extend(BX.CViewFolderElement, BX.CViewCoreElement);

BX.CViewFolderElement.prototype.load = function(successLoadCallback)
{
	if(this.loaded)
	{
		return;
	}

	this.titleDomElement = null;
	this.titleButtons = null;

	this.domElement = BX.create('div', {
		props: {
			className: 'bx-viewer-cap-wrap bx-viewer-folder'
		},
		children: [
			(BX.create('div', {
					props: {
						className: 'bx-viewer-cap'
					},
					children: [
						(BX.create('div', {
							props: {
								className: 'bx-viewer-icon'
							}
						})),
						(BX.create('div', {
							props: {
								className: 'bx-viewer-cap-text-block'
							},
							children: [
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-title',
										title: this.title
									},
									text: this.title
								})),
								(BX.create('div', {
									props: {
										className: 'bx-viewer-cap-text'
									},
									html: BX.message('JS_CORE_VIEWER_DESCR_AUTHOR') + ': ' + BX.util.htmlspecialchars(this.owner) + '<br/>' + BX.message('JS_CORE_VIEWER_DESCR_LAST_MODIFY') + ': ' + BX.util.htmlspecialchars(this.dateModify) + '<br/>'
								}))
							]
						}))
					]
			}))
		]
	});
	this.contentWrap.appendChild(this.domElement);
	this.loaded = true;
}
BX.CViewFolderElement.prototype.preload = function(successLoadCallback)
{
}
BX.CViewFolderElement.prototype.onLoad = function()
{
}
BX.CViewFolderElement.prototype.show = function()
{
	this.domElement.style.opacity = 1;
	this.domElement.style.display = 'block';
	this.preventShow = false;
}
BX.CViewFolderElement.prototype.hide = function(isCloseElement)
{
	isCloseElement = isCloseElement || false;
	this.domElement.style.opacity = 0;
	//this.domElement.style.display = 'none';
	this.preventTimeout();
	this.loaded = false;
	this.preventShow = false;
	this.isProccessed = false;
}


BX.CViewer = function(params)
{
	this.params = BX.clone(BX.CViewer.defaultSettings);
	for(var i in params)
	{
		this.params[i] = params[i];
	}

	this.DIV = null;
	this.OVERLAY = null;
	this.CONTENT_WRAP = null;

	this.list = this.params.list;
	this._current = 0;
	this.FULL_TITLE = null;
	this.bVisible = false;
	this.preload = 0; //todo preload don't working! We set to 0;
	this.currentElement = null; //if this not set current element get from this.list
	this.popupConfirm = null;
};

BX.CViewer.temporaryServiceEditDoc = '';
BX.CViewer._convertElementsMatch = {};
//todo refactor! globals....
BX.CViewer.rightNowRunActionAfterShow = '';
BX.CViewer.objNowInShow = false;
BX.CViewer.localChangeServiceEdit = false;

BX.CViewer.defaultSettings = {
	list: [],
	cycle: true, // whether to cycle element list - go to first after last
	resize: 'WH', //'W' - resize element to fit width, 'H' - resize element to fit height, 'WH' - W&H , ''||false => show original element size without resizing
	resizeToggle: false,
	showTitle: true, // whether to show element title
	preload: 0, // number of list element to be preloaded !!!!!don't working!
	minMargin: 20, //minimal margin
	minPadding: 11, // minimal padding
	lockScroll: true,
	keyMap: {
		27: 'close', // esc
		33: 'prev', // pgup
		37: 'prev', // left
		38: 'prev', // up
		34: 'next', // pgdn
		39: 'next', // right
		40: 'next', // down
		32: 'next' // space
	}
};

BX.CViewer.prototype._create = function()
{
	if (!this.DIV)
	{
		var specTag = BX.browser.IsIE() && !BX.browser.IsDoctype() ? 'A' : 'SPAN',
			specHref = specTag == 'A' ? 'javascript:void(0)' : null;

		this.OVERLAY = document.body.appendChild(BX.create('DIV', {
			props: {className: 'bx-viewer-overlay'}
		}));

		this.OVERLAY.appendChild(
			(this.PREV_LINK = BX.create(specTag, {
				props: {
					className: 'bx-viewer-prev-outer',
					href: specHref
				},
				events: {
					click: BX.proxy(this.prev, this)
				},
				html: '<span class="bx-viewer-prev"></span>'
			}))
		);
		this.OVERLAY.appendChild(
			(this.NEXT_LINK = BX.create(specTag, {
				props: {
					className: 'bx-viewer-next-outer',
					href: specHref
				},
				events: {
					click: BX.proxy(this.next, this)
				},
				html: '<span class="bx-viewer-next"></span>'
			}))
		);

		this.DIV = this.OVERLAY.appendChild(BX.create('DIV', {
			props: {className: 'bx-viewer-wrap-outer'},
			events: {
				click: BX.eventCancelBubble
			},
			children: [
				BX.create('DIV', {
					props: {className: 'bx-viewer-wrap-inner'},
					//style: {padding:padding},
					children: [
						(this.CONTENT_WRAP = BX.create('DIV', {
							props: {className: 'bx-viewer-wrap bx-viewer-cap'}
						}))
					]
				}),
				(this.CONTENT_TITLE = BX.create('DIV', {
					style: {bottom: '0'},
					props: {className: 'bx-viewer-title'}
				})),
				(this.FULL_TITLE = BX.create('DIV', {
					style: {bottom: '-32px'},
					props: {className: 'bx-viewer-full-title'}
				})),
				BX.create(specTag, {
					props: {
						className: 'bx-viewer-close',
						href: specHref
					},
					events: {click: BX.proxy(this._hide, this)},
					html: '<span class="bx-viewer-close-inner"></span>'
				})
			]
		}));

		if (!!this.params.resizeToggle)
		{
			this.CONTENT_WRAP.appendChild(BX.create('SPAN', {
				props: {className: 'bx-viewer-size-toggle'},
				style: {
					right: this.params.minPadding + 'px',
					bottom: this.params.minPadding + 'px'
				},
				events: {
					click: BX.proxy(this._toggle_resize, this)
				}
			}))
		}
	}

	//from N
	var padding;
	if (this.params.topPadding) {
		padding = this.params.topPadding + 'px ' + this.params.minPadding + 'px ' + this.params.minPadding + 'px'
	} else {
		padding = this.params.minPadding + 'px'
	}
	this.CONTENT_WRAP.parentNode.style.padding = padding;
	//end from N

};

BX.CViewer.prototype.setCurrent = function(element)
{
	if(!BX.is_subclass_of(element, BX.CViewCoreElement))
	{
		BX.debug('current element not instance of BX.CViewCoreElement');
		return;
	}

	this.currentElement = element;
}

BX.CViewer.prototype.isCurrent = function(element)
{
	if(typeof(element) == 'object')
	{
		element = (element.id||element.image||element.thumb||element.src);
	}
	else
	{
		return false;
	}

	var current = this.getCurrent();
	if(!current)
	{
		return false;
	}
	current = (current.id||current.image||current.thumb||current.src||false);
	if(!current)
	{
		return false;
	}

	return current == element;
}

BX.CViewer.prototype.getCurrent = function()
{
	if(!BX.is_subclass_of((this.currentElement || this.list[this._current]), BX.CViewCoreElement))
	{
		BX.debug('current element not instance of BX.CViewCoreElement');
		return false;
	}
	else
	{
		BX.addCustomEvent((this.currentElement || this.list[this._current]), 'onIframeDocSuccess', BX.delegate(function (elementWithError) {
			BX.localStorage.set('iframe_options_error', false, 60*2);
		}, this));
		BX.addCustomEvent((this.currentElement || this.list[this._current]), 'onIframeDocError', BX.delegate(function (elementWithError) {
			if((!elementWithError.id || this.getCurrent().id != elementWithError.id) && this.getCurrent().src != elementWithError.src)
			{
				return;
			}
			this.getCurrent().hide();
			this.setCurrent(new BX.CViewErrorIframeElement({
				buttonUrl: elementWithError.viewerUrl,
				title: elementWithError.title,
				buttons: [
					BX.create('a', {
						props: {
							className: 'bx-viewer-btn',
							href: elementWithError.downloadUrl
						},
						events: {
							click: BX.eventCancelBubble
						},
						text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
					})
				]
			}));
			this.show();
			BX.localStorage.set('iframe_options_error', true, 60*2);
		}, this));

	}
	return (this.currentElement || this.list[this._current]);
}

BX.CViewer.prototype._keypress = function(e)
{
	var key = (e||window.event).keyCode || (e||window.event).charCode;
	if (!!this.params.keyMap && !!this.params.keyMap[key] && !!this[this.params.keyMap[key]])
	{
		this[this.params.keyMap[key]].apply(this);
		return BX.PreventDefault(e);
	}
};

BX.CViewer.prototype._toggle_resize = function()
{
	var tmp = this.params.resize;
	this.params.resize = this.params.resizeToggle;
	this.params.resizeToggle = tmp;

	if (this.params.resize != 'WH')
	{
		this.params.lockScroll = true;
		this._lock_scroll();
	}
	else
	{
		this.params.lockScroll = false;
		this._unlock_scroll();
	}

	this.adjustSize();
	this.adjustPos();
};

BX.CViewer.prototype.adjustPos = function()
{
	if (this.getCurrent().height > 0 && this.getCurrent().width > 0)
	{
		this._adjustPosByElement();
	}
	else
	{
		if (!this.CONTENT_WRAP.style.height)
			this.CONTENT_WRAP.style.height = "100px";
		if (!this.CONTENT_WRAP.style.width)
			this.CONTENT_WRAP.style.width = "100px";

		//this._adjustPosByElement();
		this.getCurrent().addTimeoutId(
			setTimeout(BX.proxy(this._adjustPosByElement, this), 250)
		);
	}
};

BX.CViewer.prototype._adjustPosByElement = function()
{
	if (this.bVisible)
	{
		var wndSize = BX.GetWindowSize(),
			top = parseInt((wndSize.innerHeight - parseInt(this.CONTENT_WRAP.style.height) - 2 * this.params.minPadding - this.params.topPadding)/2),
			left = parseInt((wndSize.innerWidth - parseInt(this.CONTENT_WRAP.style.width) - 2 * this.params.minPadding)/2);

		if (!this.params.lockScroll && wndSize.innerWidth < wndSize.scrollHeight)
			left -= 20;

		if (top < this.params.minMargin)
			top = this.params.minMargin;
		if (left < this.params.minMargin + Math.min(70, this.PREV_LINK.offsetWidth))
			left = this.params.minMargin + Math.min(70, this.PREV_LINK.offsetWidth);

		if (this.params.showTitle && !!this.getCurrent().title)
		{
			top -= 20;
		}

		this.DIV.style.top = top + 'px';
		this.DIV.style.left = left + 'px';
	}
};

BX.CViewer.prototype.adjustSizeTitle = function()
{
	if(!this.getCurrent().titleButtons)
	{
		return false;
	}

	if(this.getCurrent().titleButtons.offsetLeft + this.getCurrent().titleButtons.offsetWidth + 10 > this.getCurrent().titleDomElement.offsetLeft)
	{
		BX.adjust(this.getCurrent().titleDomElement, {
			style: {
				marginLeft: '10px',
//				textAlign: 'inherit',
//				marginLeft: (this.getCurrent().titleButtons.offsetLeft + this.getCurrent().titleButtons.offsetWidth)  + 'px',
				maxWidth: (this.CONTENT_TITLE.offsetWidth - 2*(this.getCurrent().titleButtons.offsetLeft + this.getCurrent().titleButtons.offsetWidth)) + 'px'
			}
		});
		return true;
	}
	return false;
}
	
BX.CViewer.prototype.adjustSize = function()
{
	var wndSize = BX.GetWindowSize(), currentElement = this.getCurrent();

	if (!!currentElement.height && !!currentElement.width)
	{
		if (!this.params.lockScroll && wndSize.innerWidth < wndSize.scrollHeight)
			wndSize.innerWidth -= 20;

		wndSize.innerWidth -= this.params.minMargin * 2 + this.params.minPadding * 2 + Math.min(140, this.PREV_LINK.offsetWidth + this.NEXT_LINK.offsetWidth);
		wndSize.innerHeight -= this.params.topPadding + this.params.minMargin * 2 + this.params.minPadding * 2;

		if (this.params.showTitle && !!currentElement.title)
		{
			wndSize.innerHeight -= 40;
		}

		var height = currentElement.height,
			width = currentElement.width,
			ratio = [1];

		if (this.params.resize)
		{
			if(this.params.resize.indexOf('W') >= 0)
				ratio.push(wndSize.innerWidth/width);
			if (this.params.resize.indexOf('H') >= 0)
				ratio.push(wndSize.innerHeight/height);
		}

		ratio = Math.min.apply(window, ratio);

		height *= ratio;
		width *= ratio;
		if(currentElement.image)
		{
			currentElement.image.style.height = parseInt(height) + 'px';
			currentElement.image.style.width = parseInt(width) + 'px';
		}
		if(currentElement._minWidth && currentElement._minWidth > width)
		{
			width = currentElement._minWidth;
		}
		if(currentElement._minHeight && currentElement._minHeight > height)
		{
			height = currentElement._minHeight;
		}

		this.CONTENT_WRAP.style.height = parseInt(height) + 'px';
		this.CONTENT_WRAP.style.width = parseInt(width) + 'px';

		if(this.getCurrent().domElement && this.getCurrent().titleDomElement)
		{
			var self = this;
			setTimeout(function(){
				if(!self.adjustSizeTitle())
				{
					BX.adjust(self.getCurrent().titleDomElement, {
						style: {
							marginLeft: '',
							maxWidth: '100%'
						}
					});
					self.adjustSizeTitle();
				}
			}, 220);
		}

		if (BX.browser.IsIE())
		{
			var h = parseInt(this.CONTENT_WRAP.style.height) + this.params.minPadding * 2;

			this.PREV_LINK.style.height = this.NEXT_LINK.style.height = h + 'px';
			this.PREV_LINK.firstChild.style.top = this.NEXT_LINK.firstChild.style.top = parseInt(h/2-20) + 'px';
		}
	}
};

BX.CViewer.prototype._lock_scroll = function()
{
	if (this.params.lockScroll)
		BX.addClass(document.body, 'bx-viewer-lock-scroll');
};

BX.CViewer.prototype._unlock_scroll = function()
{
	if (this.params.lockScroll)
		BX.removeClass(document.body, 'bx-viewer-lock-scroll');
};

BX.CViewer.prototype._unhide = function()
{
	this.bVisible = true;

	this.DIV.style.display = 'block';
	this.OVERLAY.style.display = 'block';

	this.PREV_LINK.style.display = this.NEXT_LINK.style.display = 'none';
	if(this.list.length > 1 && (this.params.cycle || this._current > 0))
	{
		this.PREV_LINK.style.display = 'block';
		this.PREV_LINK.style.opacity = '0.2';
	}
	if(this.list.length > 1 && (this.params.cycle || this._current < this.list.length-1))
	{
		this.NEXT_LINK.style.display = 'block';
		this.NEXT_LINK.style.opacity = '0.2';
	}

	this.adjustPos();

	BX.unbind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustPos, this));
	BX.bind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.bind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.bind(window, 'resize', BX.proxy(this.adjustPos, this));

	this._lock_scroll();
};

BX.CViewer.prototype._hide = function()
{
	if(this.isOpenedConfirm())
	{
		return false;
	}
	this.bVisible = false;

	this.DIV.style.display = 'none';
	this.OVERLAY.style.display = 'none';

	BX.unbind(document, 'keydown', BX.proxy(this._keypress, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustSize, this));
	BX.unbind(window, 'resize', BX.proxy(this.adjustPos, this));

	this._unlock_scroll();
	//todo may set PreventShow = false  to all element in cycle
	this.getCurrent().hide(true);
	this.currentElement = null;
	this.closeConfirm();
	BX.onCustomEvent(this, 'onElementViewClose', [this.getCurrent()]);
};

BX.CViewer.prototype.add = function(data)
{
	this.list.push(data);
};

BX.CViewer.prototype.setList = function(list)
{
	this.list = [];

	if (!!list && BX.type.isArray(list))
	{
		for(var i=0; i<list.length; i++)
		{
			if(!BX.is_subclass_of(list[i], BX.CViewCoreElement))
			{
				this.add(new BX.CViewCoreElement(list[i]));
			}
			else
			{
				this.add(list[i]);
			}
		}
	}

	if (this.bVisible)
	{
		if (this.list.length > 0)
			this.show();
		else
			this.close();
	}
};

BX.CViewer.prototype.show = function(element, force)
{	
	BX.CViewer.temporaryServiceEditDoc = '';
	this.closeConfirm();
	force = force || false;
	BX.browser.addGlobalClass();

	var _current = this._current;
	var self = this;

	if(typeof(element) == 'object' && (!!element.image || !!element.thumb))
		element = (element.id||element.image||element.thumb||element.src);

	if (BX.type.isString(element))
	{
		for(var i=0; i < this.list.length; i++)
		{
			if(this.list[i].image == element || this.list[i].thumb == element || this.list[i].src == element || this.list[i].id == element)
			{
				_current = i;
				break;
			}
		}
	}
	if(!this.currentElement)
	{
		var currentElement = this.list[_current];

		if (!currentElement)
			return;
		this._current = _current;
	}
	else
	{
		//this is current not from list of elements
		var currentElement = this.currentElement;
	}

	this.params.topPadding = 0;
	if(currentElement.showTitle && currentElement.title)
	{
		this.params.topPadding = currentElement.topPadding || 0;
	}

	this._create();
	currentElement.setContentWrap(this.CONTENT_WRAP);
	BX.cleanNode(this.CONTENT_WRAP);
	this.adjustSize();
	if(force)
	{
		currentElement.hide();
		currentElement.loaded = false;
		currentElement.hide();
	}
	if(!currentElement.loaded)
	{
		BX.addClass(this.CONTENT_WRAP, 'bx-viewer-wrap-loading');
		currentElement.load(function (element) {
			BX.removeClass(self.CONTENT_WRAP, 'bx-viewer-wrap-loading');
			//if(!element.preventShow)
				element.show();
			self.adjustSize();
			self.adjustPos();
			self._preload();
		});
	}
	else
	{
		currentElement.load(function (element) {
			BX.removeClass(self.CONTENT_WRAP, 'bx-viewer-wrap-loading');
			//self.adjustSize();
			self.adjustPos();
			element.addTimeoutId(setTimeout(function(){
				//if(!element.preventShow)
					element.show();
					self.adjustSize();
			}, 200));
			self._preload();
		});
	}
	if(BX.CViewer.rightNowRunActionAfterShow)
	{
		this.runActionByCurrentElement(BX.CViewer.rightNowRunActionAfterShow);
		BX.CViewer.rightNowRunActionAfterShow = false;
	}

	//this._check_title()
	this.getCurrent().addTimeoutId(
		setTimeout(BX.proxy(this._check_title, this), 10)
	);
	this._unhide();

	BX.onCustomEvent(this, 'onElementViewShow', [currentElement]);
};

BX.CViewer.prototype.showLoading = function(params)
{
	params = params || {};
	this.getCurrent().hide();
	BX.addClass(this.CONTENT_WRAP, 'bx-viewer-wrap-loading');
	BX.cleanNode(this.CONTENT_WRAP);
	BX.adjust(this.CONTENT_WRAP, {
		children: [
			BX.create('div', {
					style: {
						display: 'table',
						width: '100%',
						height: '100%'
					},
					children: [
						BX.create('div', {
							style: {
								display: 'table-cell',
								verticalAlign: 'middle',
								textAlign: 'center'
							},
							children: [
								BX.create('div', {
									props: {
										className: 'bx-viewer-wrap-loading'
									}
								}),
								BX.create('span', {
									text: params.text || ''
								})
							]
						})
					]
				}
			)]
	});
}

BX.CViewer.prototype._check_title = function()
{
	BX.cleanNode(this.CONTENT_TITLE);
	BX.cleanNode(this.FULL_TITLE);
	if (this.params.showTitle)
	{
		if(this.getCurrent().showTitle && this.getCurrent().title)
		{
			if(BX.type.isDomNode(this.getCurrent().titleDomElement))
			{
				if(BX.type.isDomNode(this.getCurrent().titleButtons))
				{
					this.CONTENT_TITLE.appendChild(this.getCurrent().titleButtons);
				}

				this.CONTENT_TITLE.appendChild(this.getCurrent().titleDomElement);
			}
			else if(BX.type.isNotEmptyString(this.getCurrent().title))
			{
				BX.adjust(this.CONTENT_TITLE, {
					text: this.getCurrent().title
				});
			}
			else
			{
				this.CONTENT_TITLE.style.opacity = '0';
				this.CONTENT_TITLE.style.bottom = '0';
			}
		}
		else
		{
			//so bad...
			this.params.topPadding = 0;
		}
		if(this.getCurrent().full)
		{
			BX.cleanNode(this.FULL_TITLE);

			var p = [];
			if(this.getCurrent().full_height && this.getCurrent().full_width)
			{
				p.push(this.getCurrent().full_width+'x'+this.getCurrent().full_height);
			}

			if(this.getCurrent().full_size)
			{
				p.push(this.getCurrent().full_size);
			}

			var html = '<a href="'+this.getCurrent().full+'" class="bx-viewer-full-link" target="_blank">' + BX.message('JS_CORE_IMAGE_FULL') + (p.length > 0 ? (' ('+p.join(', ')+')') : '') + '</a>';
			BX.adjust(this.FULL_TITLE, {
				style: {
					opacity: '1'
				},
				children: [BX.create('div', {props: {className: 'bx-viewer-full-item '}, html: html})]
			});
		}
	}
	else
	{
		this.CONTENT_TITLE.style.opacity = '0';
		this.CONTENT_TITLE.style.bottom = '0';
		BX.cleanNode(this.CONTENT_TITLE);
	}
}

BX.CViewer.prototype._preload = function()
{
	if (this.params.preload > 0)
	{
		var finish = Math.max(this._current-this.params.preload, this.params.cycle ? -1000 : 0),
			start = Math.min(this._current+this.params.preload, this.params.cycle ? this.list.length + 1000 : this.list.length-1);

		if (finish < start)
		{
			for (var i=start; i>=finish; i--)
			{
				var ix = i;
				if (ix < 0)
					ix += this.list.length;
				else if (ix >= this.list.length)
					ix -= this.list.length;

				if (!this.list[ix].isProccessed)
				{
					this.list[ix].preload();
				}
			}
		}

	}
};

BX.CViewer.prototype.next = function()
{
	if (this.list.length > 1)
	{
		this.getCurrent().hide();
		this.currentElement = null;
		this._current++;
		if(this._current >= this.list.length)
		{
			if(!!this.params.cycle)
				this._current = 0;
			else
				this._current--;

			BX.onCustomEvent(this, 'onElementViewFinishList', [this.getCurrent(), 1]);
		}
		this.getCurrent().preventShow = false;
		this.show();
	}
};

BX.CViewer.prototype.prev = function()
{
	if (this.list.length > 1)
	{
		this.getCurrent().hide();
		this.currentElement = null;
		this._current--;
		if(this._current < 0)
		{
			if(!!this.params.cycle)
				this._current = this.list.length-1;
			else
				this._current++;

			BX.onCustomEvent(this, 'onElementViewFinishList', [this.getCurrent(), -1]);
		}
		this.getCurrent().preventShow = false;
		this.show();
	}
};

BX.CViewer.prototype.close = function()
{
	this._hide();
};

BX.CViewer.prototype.runActionByCurrentElement = function(action, params)
{
	params = params || {};
	if(this.getCurrent())
	{
		this.getCurrent().runAction(action, params);
	}
}

BX.CViewer.prototype.openModal = function(link, title, width, height)
{
	width = width || 1030;
	height = height || 700;

	var modalWindow = BX.util.popup(link, width, height);
	modalWindow.elementViewer = this;
	modalWindow.currentElement = this.getCurrent();
	window._ie_elementViewer = this;
	window._ie_currentElement = this.getCurrent();

	return modalWindow;
};

BX.CViewer.prototype.isOpenedConfirm = function()
{
	if (this.popupConfirm != null)
	{
		return this.popupConfirm.isShown();
	}
	return false;
};
BX.CViewer.prototype.closeConfirm = function()
{
	if (this.popupConfirm != null)
	{
		this.popupConfirm.close();
		this.popupConfirm.destroy();
	}
};
BX.CViewer.prototype.openConfirm = function(content, buttons, modal, bindElement, params)
{
	if (this.popupConfirm != null)
		this.popupConfirm.destroy();

	params = params || {};
	bindElement = bindElement || null;

	if(typeof(content) == "object")
	{
	}
	else
	{
		content = BX.create("div", { props : { className : "bx-gedit-convert-confirm-cont" }, html: content});
	}

	modal = modal === true? true: false;
	buttons = typeof(buttons) == "object"? buttons : false;

	if(!params.autoHide)
	{
		params.autoHide = buttons === false? true: false;
	}
	//params.closeByEsc = buttons === false? true: false;
	//todo catch event close by esc and run close event
	params.closeByEsc = false;
	params.zIndex = 200;
	if(params.overlay)
	{
		params.overlay = params.overlay;
	}
	else
	{
		params.overlay = modal;
	}
	params.content = content;
	params.buttons = buttons;
	params.events = { onPopupClose : function() { this.destroy() }};
	if(params.shown)
	{
		params.events.onPopupShow = params.shown;
	}

	this.popupConfirm = new BX.PopupWindow('bx-gedit-convert-confirm', bindElement, params);
	this.popupConfirm.show();
	//BX.bind(this.popupConfirm.popupContainer, "click", BX.PreventDefault);
};

BX.CViewer.prototype.initEditService = function()
{
	var service = BX.message('wd_service_edit_doc_default');
	//now not set local (in browser) edit service, then we use global setting.
	if(BX.CViewer.localChangeServiceEdit && BX.localStorage.get('wd_service_edit_doc_default'))
	{
		service = BX.localStorage.get('wd_service_edit_doc_default');
	}
	service = service || 'g';
	this.setEditService(service);
	return service;
}

BX.CViewer.prototype.setEditService = function(service)
{
	if(!BX('viewer-toggle-popup-btn-google') || !BX('viewer-toggle-popup-btn-skydrive'))
	{
		return false;
	}
	service = service.toLowerCase();
	switch(service)
	{
		case 'g':
		case 'google':
			BX.removeClass(BX('viewer-toggle-popup-btn-google'), 'viewer-toggle-popup-btn-active');
			BX.removeClass(BX('viewer-toggle-popup-btn-skydrive'), 'viewer-toggle-popup-btn-active');

			BX.addClass(BX('viewer-toggle-popup-btn-google'), 'viewer-toggle-popup-btn-active');
			if(BX('viewer-checkbox-collaborative').checked)
			{
				BX.userOptions.save('webdav', 'user_settings', 'service_edit_doc_default', 'g');
				BX.localStorage.set('wd_service_edit_doc_default', 'g', 60*2);
				BX.CViewer.localChangeServiceEdit = true;
			}
			BX.CViewer.temporaryServiceEditDoc = 'g';

			return true;
			break;

		case 's':
		case 'skydrive':
		case 'sky-drive':
			BX.removeClass(BX('viewer-toggle-popup-btn-google'), 'viewer-toggle-popup-btn-active');
			BX.removeClass(BX('viewer-toggle-popup-btn-skydrive'), 'viewer-toggle-popup-btn-active');

			BX.addClass(BX('viewer-toggle-popup-btn-skydrive'), 'viewer-toggle-popup-btn-active');
			if(BX('viewer-checkbox-collaborative').checked)
			{
				BX.userOptions.save('webdav', 'user_settings', 'service_edit_doc_default', 's');
				BX.localStorage.set('wd_service_edit_doc_default', 's', 60*2);
				BX.CViewer.localChangeServiceEdit = true;
			}
			BX.CViewer.temporaryServiceEditDoc = 's';

			return true;
			break;
	}

	return false;
};

BX.CViewer.prototype.createIframeElement = function(element)	
{
	var iframeElement = new BX.CViewIframeElement({
		baseElementId: element.getAttribute('data-bx-baseElementId'),
		title: element.getAttribute('data-bx-title'),
		editUrl: element.getAttribute('data-bx-edit'),
		urlToPost: element.getAttribute('data-bx-urlToPost'),
		idToPost: element.getAttribute('data-bx-idToPost'),
		downloadUrl: element.getAttribute('data-bx-download'),
		src: element.getAttribute('data-bx-src'),
		askConvert: element.getAttribute('data-bx-askConvert'),
		buttons: []
	});
	if(BX.CViewer._convertElementsMatch[iframeElement.src])
	{
		var afterConvert = BX.CViewer._convertElementsMatch[iframeElement.src];
		iframeElement.src = afterConvert.src;
		iframeElement.title = afterConvert.title;
	}

	var selfViewer = this; //kill self.
	iframeElement.buttons.push(
		BX.create('a', {
			props: {
				className: 'bx-viewer-btn',
				href: element.getAttribute('data-bx-download')
			},
			events: {
				click: BX.proxy(function(e)
					{
						//if click on download link, but iframe not loaded.
						if(!this.loaded)
						{
							var self = this;
							setTimeout(function(){
								selfViewer.show(self, true);
							}, 1000);
						}
						BX.eventCancelBubble(e);
						return false;
					}
					, iframeElement)
			},
			text: BX.message('JS_CORE_VIEWER_DOWNLOAD')
		}));

	if(element.getAttribute('data-bx-edit'))
	{
		iframeElement.buttons.push(
			BX.create('span', {
				props: {
					className: 'bx-viewer-btn-split'
				},
				children: [
					BX.create('span', {
						props: {
							className: 'bx-viewer-btn-split-l'
						},
						children: [
							BX.create('span', {
								props: {
									id: 'bx-viewer-edit-btn',
									className: 'bx-viewer-btn-split-text'
								},
								text: BX.message('JS_CORE_VIEWER_EDIT'),
								events: {
									click: BX.delegate(function(e){
										BX.PreventDefault(e);
										selfViewer.runActionByCurrentElement('forceEdit', {obElementViewer: selfViewer});
									}, iframeElement)
								}
							}),
							BX.create('span', {
								props: {
									className: 'bx-viewer-btn-split-bg'
								}
							})
						]
					}),
					BX.create('span', {
						props: {
							className: 'bx-viewer-btn-split-r'
						},
						events: {
							click: function()
							{
								selfViewer.openConfirm(
									BX.create('div', {
										props: {
											className: 'viewer-toggle-popup-cont'
										},
										children: [
											BX.create('div', {
												props: {
													className: 'viewer-toggle-popup-title'
												},
												html: BX.message('JS_CORE_VIEWER_IFRAME_CHOICE_SERVICE_EDIT')
											}),
											BX.create('div', {
												props: {
													id: 'viewer-toggle-popup-btn-block',
													className: 'viewer-toggle-popup-btn-block'
												},
												children: [
													BX.create('div', {
														props: {
															id: 'viewer-toggle-popup-btn-google',
															className: 'viewer-toggle-popup-btn viewer-toggle-popup-btn-active'
														},
														events: {
															click: function(){
																selfViewer.setEditService('google');
															}
														},
														children: [
															BX.create('span', {
																props: {
																	className: 'status-google'
																},
																text: BX.message('JS_CORE_VIEWER_SERVICE_GOOGLE_DRIVE'),
																children: []
															})
														]
													}),
													BX.create('div', {
														props: {
															id: 'viewer-toggle-popup-btn-skydrive',
															className: 'viewer-toggle-popup-btn'
														},
														events: {
															click: function(){
																selfViewer.setEditService('skydrive');
															}
														},
														children: [
															BX.create('span', {
																props: {
																	className: 'status-sky-drive'
																},
																text: BX.message('JS_CORE_VIEWER_SERVICE_SKYDRIVE'),
																children: []
															})
														]
													})
												]
											}),
											BX.create('div', {
												props: {
													className: 'viewer-toggle-popup-checkbox'
												},
												children: [
													BX.create('input', {
														props: {
															id: 'viewer-checkbox-collaborative',
															type: 'checkbox',
															className: 'viewer-checkbox'
														}
													}),
													BX.create('label', {
														props: {
															htmlFor: 'viewer-checkbox-collaborative',
															className: 'viewer-checkbox-label'
														},
														text: BX.message('JS_CORE_VIEWER_IFRAME_SET_DEFAULT_SERVICE_EDIT')
													})
												]
											})
										]
									}),
									[
										new BX.PopupWindowButton({
											text : BX.message('JS_CORE_VIEWER_IFRAME_CHOICE_SERVICE_EDIT_ACCEPT'),
											className : "popup-window-button-accept",
											events : { click : BX.delegate(function() {
													//todo bad-bad
													selfViewer.setEditService(BX.CViewer.temporaryServiceEditDoc);
													selfViewer.closeConfirm();
													BX.fireEvent(BX('bx-viewer-edit-btn'), 'click');
												}, this
											)}
										}),
										new BX.PopupWindowButtonLink({
											text : BX.message('JS_CORE_VIEWER_IFRAME_CHOICE_SERVICE_EDIT_DECLINE'),
											className: "webform-small-button-link",
											events : { click : BX.delegate(function() {
													BX.CViewer.temporaryServiceEditDoc = '';
													selfViewer.closeConfirm();
												}, this
											)}
										})
									],
									false,
									this,
									{
										autoHide: true,
										overlay: {
											opacity: 0.01
										},									  
										angle: true,
										offsetLeft: -35,
										offsetTop: 2,
										zIndex: 1005,
										lightShadow: true,
										shown: BX.delegate(function(){this.initEditService()}, selfViewer)
									}
								);
							}
						},
						children: [
							BX.create('span', {
								props: {
									className: 'bx-viewer-btn-split-bg'
								}
							})
						]
					})
				]
			})
		);
	}
	return iframeElement;
}
	


})(window);
/* End */
;