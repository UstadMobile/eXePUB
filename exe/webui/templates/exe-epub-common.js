/**
 * 
 * Idevice DOM elements must have an ID attribute in the form of idX
 * where X is the ideviceId param e.g. id0 id1 etc. (as per eXeLearning's
 * python generated code)
 * 
 * @constructor
 * @param {string} ideviceId The idevice ID 
 */
function Idevice(ideviceId) {
	this.ideviceId = ideviceId;
}

Idevice.prototype = {
	/**
	 * Get the DOM element that is the main container of this iDevice
	 * 
	 * @return {Element} DOM element of this idevice
	 */
	_getEl: function() {
		return document.getElementById("id" + this.ideviceId);
	},
	
	/**
	 * Handle when the idevice itself is first created
	 */
	onCreate: function() {
		
	},
	
	/**
	 * Handle when the user clicks into editing mode
	 */
	editOn: function() {
		
	},
	
	/**
	 * Handle when editing mode is over
	 */
	editOff: function() {
		
	},
	
	/**
	 * Turn on or off tinymce editing on this idevice for any elements
	 * that have the class exe-editable.  Such elements MUST also have
	 * a unique id attribute
	 */
	setTinyMceEnabled: function(enabled) {
		eXeEpubAuthoring.setTinyMceEnabledBySelector(this._getEl(), 
				".exe-editable", enabled);
	},
	
	/**
	 * Save the given tincan activities on the server side as the 
	 * tincan.xml representation of this idevice
	 * 
	 * @param {String|Document} The TinCan to save as an XML string or XML Document
	 */
	saveTinCan: function(tinCan) {
		if(typeof tinCan !== "string") {
			tinCan = new XMLSerializer().serializeToString(tinCan);
		}
		
		eXeEpubAuthoring.saveIdeviceTinCanXML(this.ideviceId, tinCan);
	},
	
	/**
	 * Used to create internal ids - included elements should have a
	 * data-block-id attribute
	 */
	getNextBlockId: function() {
		var maxId = 0;
		var currentBlocks = this._getEl().querySelectorAll("[data-block-id]");
		for(var i = 0; i < currentBlocks.length; i++) {
			try {
				maxId = Math.max(maxId, 
					parseInt(currentBlocks[i].getAttribute("data-block-id")));
			}catch(err) {}//badly formatted/something else?
		}
		
		return maxId + 1;
	},
	
	/**
	 * Goes through a given element and whenever the id contains
	 * __IDEVICEID__ this will be replaced with the actual ideviceId
	 * Useful for templates etc.
	 */
	setIdeviceIdAttrs: function(el) {
		var elArr = el.querySelectorAll("[id]");
		var id;
		for(var i = 0; i < elArr.length; i++) {
			id = elArr[i].getAttribute("id");
			if(id.indexOf("__IDEVICEID__") !== -1) {
				elArr[i].setAttribute("id", 
					id.replace("__IDEVICEID__", this.ideviceId));
			}
		}
	},
	
	/**
	 * Delete a part of this idevice : this part should have a data-block-id 
	 * attribute
	 */
	deleteBlockId: function(blockId) {
		var el = this._getEl().querySelector("[data-block-id='" + blockId+"']")
		if(eXeEpubAuthoring) {
			eXeEpubAuthoring.removeAllTinyMceInstances(el);
		}
		el.parentNode.removeChild(el);
	},
	
	/**
	 * Answers whether or not this iDevice supports saving/restore it's
	 * state.  If so the idevice must implement getState and setState, 
	 * which should return an object (json array style) that will be 
	 * persisted by the xAPI state API or in local storage as a string
	 * 
	 * @method
	 */
	isStateSupported: function() {
		return false;
	},
	
	/**
	 * Returns the state of the idevice as a JSON array (e.g. the text 
	 * of the answer last given etc).  These values when passed
	 * to setState should set the idevice up to appear as it was when 
	 * getState was called
	 * 
	 * @return {Object} State of this idevice as a json style object
	 */
	getState: function() {
		return null;
	},
	
	/**
	 * Set the state of this idevice from a given object to set it 
	 * up as it was before (e.g. answer selected, etc).  The blank
	 * 
	 * @param {Object} state Object as was given by getState
	 */
	setState: function(state) {
		
	},
	
	/**
	 * Save the given state values for this idevice to the state API
	 */
	saveStateValues: function(values, opts) {
		var stateValuesObj = {};
		for(key in values) {
			if(values.hasOwnProperty(key)) {
				stateValuesObj["id"+this.ideviceId + "_" + key] = values[key];
			}
		}
		
		eXeTinCan.setPkgStateValues(stateValuesObj, opts);
	},
	
	/**
	 * Transition support method
	 */
	addPrefixToStateValues: function(stateValues) {
		var retVal = {};
		var keyName;
		for(key in stateValues) {
			if(!key.substring(0, 2) === "id") {
				key = "id" + this.ideviceId + "_" + key;
			}
			
			retVal[key] = stateValues[key];
		}
		
		return retVal;
	},
	
	/**
	 * If state support is enabled for this idevice this method will 
	 * save the value of getState to the exe package state
	 */
	saveState: function() {
		if(this.isStateSupported()) {
			var stateVals = this.getState();
			for(key in stateVals) {
				if(stateVals.hasOwnProperty(key)) {
					eXeTinCan.setPkgStateValue(key, stateVals[key]);
				}
			}
		}
	},
	
	
	
	/**
	 * Checks to see if the package state has a value for the current 
	 * idevice, if so it will call setState with the loaded state value
	 */
	loadState: function() {
		if(this.isStateSupported()) {
			eXeTinCan.getPkgStateValue("id" + this.ideviceId, (function(keyVals) {
				keyVals = keyVals || null;
				this.setState(keyVals);
			}).bind(this), {prefix : true});
		}
	},
	
	/**
	 * 
	 * @param callback
	 */
	getUserFiles: function(opts, callback) {
		eXeEpubCommon.getExeResourcesXML(opts, (function(err, opfDoc, resXMLDoc) {
			var itemRefsById = {};
			var ideviceRefs = resXMLDoc.querySelectorAll("ideviceref[idref='"
				+ this.ideviceId + "']");
			var itemRef, itemId, itemEl;
			for(var i = 0; i < ideviceRefs.length; i++) {
				itemRef = ideviceRefs[i].parentNode;
				itemId = itemRef.getAttribute("idref");
				itemEl = opfDoc.querySelector("item[id='" + itemId +"']");
				
				if(itemEl) {
					itemRefsById[itemId] = {
						id : itemId,
						href : itemEl.getAttribute("href"),
						mediaType : itemEl.getAttribute("media-type")
					}
				}
			}
			
			//now turn it into an array
			var userFilesArr = [];
			for(itemId in itemRefsById) {
				if(itemRefsById.hasOwnProperty(itemId)) {
					userFilesArr.push(itemRefsById[itemId]);
				}
			}
			
			callback.call(opts.context ? opts.context : this, null,
				userFilesArr);
		}).bind(this));
	},
	
	removeUserFile: function() {
		
	}
	
	
	
};

Idevice._registeredDevices = {};

/*
Idevice.handleBeforeUnload = function(evt) {
	console.log("Idevice: beforeunload");
	for(ideviceId in Idevice._registeredDevices) {
		if(Idevice._registeredDevices.hasOwnProperty(ideviceId)) {
			if(Idevice._registeredDevices[ideviceId].isStateSupported()) {
				Idevice._registeredDevices[ideviceId].saveState();
			}
		}
	}
	
	if(eXeTinCan) {
		eXeTinCan.saveState({});
	}
};

window.addEventListener("beforeunload", Idevice.handleBeforeUnload.bind(Idevice), false);
*/


Idevice.registerType = function(typeId, cls) {
	document.addEventListener("idevicecreate", function(evt) {
		if(evt.detail.ideviceType === typeId) {
			var targetEl = evt.target || evt.srcElement;
			var ideviceId = evt.detail.ideviceId;
			Idevice._registeredDevices[ideviceId] = new cls(ideviceId);
			Idevice._registeredDevices[ideviceId].onCreate();
		}
	}, false);
	
	document.addEventListener("ideviceediton", function(evt) {
		if(evt.detail.ideviceType === typeId) {
			var ideviceId = evt.detail.ideviceId;
			if(!Idevice._registeredDevices[ideviceId]) {
				Idevice._registeredDevices[ideviceId] = new cls(ideviceId);
			}
			
			Idevice._registeredDevices[evt.detail.ideviceId].editOn();
		}
	}, false);
	
	document.addEventListener("ideviceeditoff", function(evt) {
		if(evt.detail.ideviceType === typeId) {
			Idevice._registeredDevices[evt.detail.ideviceId].editOff();
		}
	});
	
	var _initFn = function() {
		var allIdevices = document.querySelectorAll("div[data-idevice-type='" + typeId + "']");
		var deviceId;
		for(var i = 0; i < allIdevices.length; i++) {
			deviceId = allIdevices[i].getAttribute("id").substring(2);//idevice id attributes are prefixed by the letters 'id'
			Idevice._registeredDevices[deviceId] = new cls(deviceId);
			Idevice._registeredDevices[deviceId].loadState();
		}
	};
	
	if(document.readyState === "interactive" || document.readyState === "complete") {
		_initFn();
	}else {
		document.addEventListener("DOMContentLoaded", _initFn, false);
	}
};

/**
 * Get the idevice object by id
 */
Idevice.getById = function(ideviceId) {
	return Idevice._registeredDevices[ideviceId];
};

var eXeToolTipMgr = function() {};

eXeToolTipMgr.initTooltips = function(container) {
	if(!container || !container.querySelectorAll) {
		container = document.body;
	}
	var toolTipHolders = container.querySelectorAll(".tooltip_holder");
	for(var i = 0; i < toolTipHolders.length; i++) {
		//remove event listener if present to avoid double calls
		toolTipHolders[i].removeEventListener("click", eXeToolTipMgr.handleClickTooltipHolder);
		toolTipHolders[i].addEventListener("click", eXeToolTipMgr.handleClickTooltipHolder);
	}
};

eXeToolTipMgr.handleClickTooltipHolder = function(evt) {
	var tooltipNode = null;
	var currentNode = evt.target;
	for(var i = 0; i < 5 && tooltipNode === null; i++){
		if(currentNode.classList && currentNode.classList.contains("tooltip_content")) {
			tooltipNode = currentNode;
		}
		
		currentNode = currentNode.nextSibling;
	}
	
	if(tooltipNode) {
		tooltipNode.style.position = "absolute";
		tooltipNode.style.display = "inline-block";
	}
};

if(document.readyState === "interactive" || document.readyState === "complete") {
	eXeToolTipMgr.initTooltips();
}else {
	document.addEventListener("DOMContentLoaded", eXeToolTipMgr.initTooltips, false);
}

/**
 * Common utility functions
 */
var eXeEpubCommon = (function() {
	
	return {
		
		decodeURLComponent: function(comp) {
			return decodeURIComponent(comp.replace("+", "%20"));
		},
		
		getQueryVars: function(queryStr) {
            var locationQuery = window.location.search.substring.length >= 1 ?
                window.location.search.substring(1) : "";
            var query = (typeof queryStr !== "undefined") ? queryStr : 
                locationQuery;
            
            var retVal = {};
            if(window.location.search.length > 2) {
                var vars = query.split("&");
                for (var i=0;i<vars.length;i++) {
                    var pair = vars[i].split("=");
                    retVal[eXeEpubCommon.decodeURLComponent(pair[0])] = 
                    	eXeEpubCommon.decodeURLComponent(pair[1]);
                }
            }
            return retVal;
        },
        
        
        
        
        
        /**
         * Get the exeresources.xml file as an xml document along with
         * the opf xml document which is needed to make sense of it
         * 
         * @param {Object} misc options for retrieving the xml files
         * @param {string} [opts.opfPath="package.opf"] path to the opf file    
         * @param {function} callback the callback function to receive the 
         * arguments error, opfDoc, resXMLDoc
         */
        getExeResourcesXML: function(opts, callback) {
        	this.getOPF(opts, (function(err, opfDoc) {
        		var exeResourcesXMLPath = "exeresources.xml";
        		var xmlHTTP = new XMLHttpRequest();
        		xmlHTTP.onreadystatechange = (function(evt) {
        			if(xmlHTTP.readyState === 4 && xmlHTTP.status === 200) {
        				var resXMLDoc = xmlHTTP.responseXML ? xmlHTTP.responseXML :
        					new DOMParser().parseFromString(xmlHTTP.responseText, "text/xml");
        				callback.call(opts.context ? opts.context : this, 
            					null, opfDoc, resXMLDoc);
        			}
        		}).bind(this);
        		xmlHTTP.open("get", exeResourcesXMLPath, true);
        		xmlHTTP.send();
        	}).bind(this));
        },
        
        
        getOPF: function(opts, callback) {
        	var opfPath = opts.opfPath ? opts.opfPath : "package.opf";
        	
        	//now load the opf
        	var xmlHTTP = new XMLHttpRequest();
        	xmlHTTP.onreadystatechange = (function(evt) {
        		if(xmlHTTP.readyState === 4 && xmlHTTP.status === 200) {
        			var xmlDoc = xmlHTTP.responseXML ? xmlHTTP.responseXML : 
        				new DOMParser().parseFromString(xmlHTTP.responseText, "text/xml");
        			callback.call(opts.context ? opts.context : this, 
        					null, xmlDoc);
        		}
        	}).bind(this);
        	xmlHTTP.open("get", opfPath, true);
        	xmlHTTP.send();
        },
        
        /**
         * Finds out the current page id
         * 
         * @param {Object} opts
         * @param {string} [opts.opfPath="package.opf"] Path to opf - defaults to package.opf
         * @param {string} [opts.docPath=document.location.href] Path of the current document: 
         *  defaults to using document.location.href
         * @param {function} callback callback function accepting params (err, id)
         *  
         */
        getPageID: function(opts, callback) {
        	//TODO: Calculate this out when it could be in another directory
        	var docPath = opts.docPath ? opts.docPath : document.location.href;
        	var queryIndex = docPath.indexOf('?');
        	var relativePath = docPath.substring(docPath.lastIndexOf('/')+1,
        			queryIndex !== -1 ? queryIndex : docPath.length);
        	this.getOPF(opts, (function(err, opfDoc){
        		var itemId = this._getItemIdByHref(opfDoc, relativePath);
            	callback.call(opts.context ? opts.context : this, 
    					null, itemId);
        	}).bind(this));
        },
        
        _getItemIdByHref: function(opfDoc, pageHref) {
        	var itemEl = opfDoc.querySelector("item[href='" + pageHref + "']");
        	if(itemEl) {
        		return itemEl.getAttribute("id");
        	}else {
        		return null;
        	}
        },
        
        /**
         * Checks to see if the page is in the authoring frame
         * 
         * @return {boolean} true if authoring mode is enabled, false otherwise
         */
        isAuthoringMode: function() {
        	if(eXeEpubCommon.getQueryVars()['exe-authoring-mode']) {
        		return true;
        	}else {
        		return false;
        	}
        }
        
	};
})();

