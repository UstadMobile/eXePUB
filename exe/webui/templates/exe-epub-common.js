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
		this.enableFilePickers();
		this.setTinyMceEnabled(true);
	},
	
	/**
	 * File pickers are div elements with data-role='exe-fileholder'  The 
	 * picker will have data-href set to the file the user selected and the
	 * element itself will be empty normally.
	 * 
	 * @param {Element} [el] : optional : specify the element in which to enable file pickers.  By default the idevice element
	 */
	enableFilePickers: function(el) {
		var filePickers = this.getAllFileHolderEls(el);
		var buttonText;
		for(var i = 0; i < filePickers.length; i++) {
			var filePickButton = filePickers[i].querySelector("button");
			if(!filePickButton) {
				filePickButton = document.createElement("button");
				filePickButton.classList.add("exe-editing-only");
				buttonText = filePickers[i].hasAttribute("data-button-label") ? 
						filePickers[i].getAttribute("data-button-label") : "Choose File";
				filePickButton.textContent = buttonText;
				filePickers[i].appendChild(filePickButton);
				filePickButton.addEventListener("click", 
						this.handleFilePickerClick.bind(this));
				this._updateFileHolderLink(filePickers[i]);
				filePickers[i].setAttribute("data-editing-mode", "on");
			}
		}
	},
	
	/**
	 * Get all file holder elements in the given element or by default in the idevice itself
	 * @param {Element} [el] Optional: specify a specific element in which to search for file holders
	 * @return Array of file holder elements
	 */
	getAllFileHolderEls: function(el) {
		el = el ? el : this._getEl();
		return el.querySelectorAll("[data-role='exe-fileholder']");
	},
	
	handleFilePickerClick: function(evt) {
		var fileHolderButton = evt.target;
		var fileHolderEl = fileHolderButton.parentNode;
		var filters = [];
		var fileType = fileHolderEl.getAttribute("data-file-type");
		if(fileType === "image") {
			filters = eXeEpubAuthoring.FILE_FILTERS_IMG;
		}else if(fileType === "audio") {
			filters = eXeEpubAuthoring.FILE_FILTERS_AUDIO;
		}else {
			filters = eXeEpubAuthoring.FILE_FILTERS_ALLFILES;
		}
		eXeEpubAuthoring.requestUserFiles({ideviceId : this.ideviceId, filters: filters}, (function(entry) {
			var currentFile = fileHolderEl.getAttribute("data-href");
			var updateLinkFn = (function() {
				fileHolderEl.setAttribute('data-href', entry.href);
				this._updateFileHolderLink(fileHolderEl);
			}).bind(this);
			
			var unlinkRequired = currentFile && 
				!this._isHrefReferencedByOtherHolders(currentFile, fileHolderEl);
			if(!unlinkRequired) {
				updateLinkFn();
			}else {
				this.unlinkUserFile({href : currentFile}, updateLinkFn);
			}
			
		}).bind(this));
	},
	
	/**
	 * Checks to see if there are any other file holders that have the 
	 * same file.  E.g. when a file is changed/removed : check and see
	 * if anything else in the idevice is using this file.  If not then
	 * we know we should unlink it from this idevice
	 * 
	 * @param {string} href The HREF to check
	 * @param {boolean} true if referenced false otherwise
	 */
	_isHrefReferencedByOtherHolders: function(href, holder) {
		var fileHolders = this.getAllFileHolderEls();
		var holderHref;
		for(var i = 0; i < fileHolders.length; i++) {
			holderHref = fileHolders[i].getAttribute("data-href");
			if(holderHref === href && fileHolders[i] !== holder) {
				return true;
			}
		}
		
		return false;
	},
	
	_updateFileHolderLink: function(fileHolderEl) {
		var fileHref = fileHolderEl.getAttribute("data-href");
		var linkEl = fileHolderEl.querySelector("a.file-link");
		if(fileHref) {
			if(!linkEl) {
				linkEl = document.createElement("a");
				linkEl.classList.add("file-link", "exe-editing-only");
				linkEl.setAttribute("target", "_blank");
				fileHolderEl.appendChild(linkEl);
			}
			linkEl.textContent = fileHref;
			linkEl.setAttribute("href", fileHref);
		}else {
			if(linkEl) {
				linkEl.parentNode.removeChild(linkEl);
			}
		}
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
	 * Saves the actual HTML inside this element: should only be used 
	 * in authoring mode
	 */
	saveHTML: function(callback) {
		var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
		eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
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
			this._getEl().setAttribute("data-idevice-state", "loading");
			eXeTinCan.getPkgStateValue("id" + this.ideviceId, (function(keyVals) {
				keyVals = keyVals || null;
				this.setState(keyVals);
				this._getEl().setAttribute("data-idevice-state", "loaded");
			}).bind(this), {prefix : true});
		}else {
			this._getEl().setAttribute("data-idevice-state", "na");
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
	
	/**
	 * Unlink the given file from this idevice
	 * 
	 * @param {string} opts.href href of the file to be runlinkemoved e.g. "user-added/file.jpg"
	 * @param {function} callback callback to run once the unlink is done
	 */
	unlinkUserFile: function(opts, callback) {
		opts.ideviceId = this.ideviceId;
		opts.callbackMode = eXeEpubAuthoring.CALLBACK_ONREQUEST;
		eXeEpubAuthoring.unlinkUserFile(opts, callback);
	}
	
	
	
};

Idevice._registeredDevices = {};

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
         * Requires the opf document to get started
         * 
         * @param {Document} opts.opf the OPF document for this package
         */
        getNav: function(opts, callback) {
        	//TODO: use actually referred to navigation instead of exe default
        	var navPath = "nav.xhtml";
        	var xmlHTTP = new XMLHttpRequest();
        	xmlHTTP.onreadystatechange = (function(evt) {
        		if(xmlHTTP.readyState === 4 && xmlHTTP.status === 200) {
        			var xmlDoc = xmlHTTP.responseXML ? xmlHTTP.responseXML : 
        				new DOMParser().parseFromString(xmlHTTP.responseText, "text/xml");
        			callback.call(opts.context ? opts.context : this, 
        					null, xmlDoc);
        		}
        	}).bind(this);
        	xmlHTTP.open("get", navPath, true);
        	xmlHTTP.send();
        },
        
        getNavOptions: function(opts, callback) {
        	this.getOPF(opts, (function(err, opfDoc) {
        		opts.opf = opfDoc;
        		this.getNav(opts, (function(err, navDoc) {
        			var optionsArr = [];
        			var navContainer = navDoc.querySelector("nav");
        			optionsArr = this.populateNavOptions(navContainer, optionsArr, 0, opfDoc);
        			callback.call(opts.context ? opts.context: this, null, optionsArr);
        		}).bind(this));
        	}).bind(this));
        },
        
        populateNavOptions: function(containerEl, optionsArr, indentLevel, opfDoc) {
        	var currentNode;
        	var currentHref;
        	var currentId;
        	
        	var listChildren;
        	var liChild;
        	for(var i = 0; i < containerEl.childNodes.length; i++) {
        		currentNode = containerEl.childNodes[i];
        		if(currentNode.nodeType === Node.ELEMENT_NODE && currentNode.tagName === "a") {
        			currentHref = currentNode.getAttribute("href");
        			var idEl = opfDoc.querySelector("item[href='" + currentHref +"']");
        			if(idEl) {
        				currentId = idEl.getAttribute("id");
        			}else {
        				currentId = null;
        			}
        			optionsArr.push({
        				title: currentNode.textContent, 
        				id : currentId,
        				href: currentHref,
        				indent: indentLevel
    				});
        		}else if(currentNode.nodeType === Node.ELEMENT_NODE && currentNode.tagName === "ol") {
        			for(var j = 0; j < currentNode.childNodes.length; j++) {
        				liChild = currentNode.childNodes[j];
        				if(liChild.nodeType === Node.ELEMENT_NODE && liChild.tagName === "li") {
        					this.populateNavOptions(liChild, optionsArr, indentLevel + 1, opfDoc);
        				}
        			}
        		}
        	}
        	
        	return optionsArr;
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

