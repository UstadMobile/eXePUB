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
		var currentBlocks = this._getEl().querySelectorAll("[data-block-id");
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
	}
	
};

Idevice._registeredDevices = {};

Idevice.handleBeforeUnload = function(evt) {
	console.log("Idevice: beforeunload");
	for(ideviceId in Idevice._registeredDevices) {
		if(Idevice._registeredDevices.hasOwnProperty(ideviceId)) {
			if(typeof Idevice._registeredDevices[ideviceId].saveState === "function") {
				Idevice._registeredDevices[ideviceId].saveState();
			}
		}
	}
	
	if(eXeTinCan) {
		eXeTinCan.saveState({});
	}
};

window.addEventListener("beforeunload", Idevice.handleBeforeUnload.bind(Idevice), false);



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
		}
	};
	
	if(document.readyState === "interactive" || document.readyState === "complete") {
		_initFn();
	}else {
		document.addEventListener("DOMContentLoaded", _initFn, false);
	}
};

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
        }
        
	};
})();
