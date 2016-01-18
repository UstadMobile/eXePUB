/**
 * Handles authoring mode
 */

/**
 * Class representing an editable idevice
 */
var eXeEpubIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.editActive = false;
};

eXeEpubIdevice.prototype = {
		
	initToolbar: function() {
		var ideviceEl = this._getIdeviceEl();
		var toolbarEl = document.createElement("div");
		toolbarEl.setAttribute("class", "epub-idevice-toolbar");
		
		var editButton = document.createElement("img");
		editButton.setAttribute("class", "exe-epub-button-editidevice");
		editButton.setAttribute("src", "/images/edit.gif");
		editButton.addEventListener("click",  this.toggleEdit.bind(this), 
				false);
		toolbarEl.appendChild(editButton);
		
		var deleteButton = document.createElement("img");
		deleteButton.setAttribute("src", "/images/stock-delete.png");
		deleteButton.addEventListener("click", this.handleClickDelete.bind(this),
				false);
		
		toolbarEl.appendChild(deleteButton);
		toolbarEl.setAttribute("id", "exe_epub_toolbar_" + this.ideviceId);
		
		ideviceEl.parentNode.insertBefore(toolbarEl, ideviceEl.nextSibling);
		ideviceEl.setAttribute('data-idevice-editing', 'off');
	},
	
	
	_getIdeviceEl: function() {
		return document.getElementById("id" + this.ideviceId);
	},
	
	_getIdeviceType: function() {
		return this._getIdeviceEl().getAttribute("data-idevice-type");
	},
	
	_getToolbarEl: function() {
		return document.getElementById("exe_epub_toolbar_" + this.ideviceId);
	},
	
	toggleEdit: function() {
		var ideviceEl = this._getIdeviceEl();
		var editingState = ideviceEl.getAttribute("data-idevice-editing");
		
		var evtName;
		var imageSrc;
		var newEditState;
		
		if(editingState === "on") {
			evtName = "ideviceeditoff";
			imageSrc = "/images/edit.gif";
			newEditState = "off";
		}else {
			evtName = "ideviceediton";
			imageSrc = "/images/stock-apply.png";
			newEditState = "on";
		}
		
		var editEvent = new CustomEvent(evtName, {
			detail: {
				ideviceType: this._getIdeviceType(),
				ideviceId: this.ideviceId
			},
			bubbles: true
		});
		
		ideviceEl.dispatchEvent(editEvent);
		ideviceEl.setAttribute("data-idevice-editing", newEditState);
		
		//edit img is the first child of the toolbar...
		this._getToolbarEl().childNodes[0].src = imageSrc;
	},
	
	handleClickDelete: function() {
		
	}
	
};


var eXeEpubAuthoring = (function() {
	
	//"private" methods
	/**
	 * Given an idevice resources node that has child script and css
	 * elements add all the resources to load to the given resourcesArr
	 */
	var addResourcesFromIdeviceEl = function(el, prefix, resourcesArr) {
		var nodeName = null;
		for(var i = 0; i < el.children.length; i++) {
			if(el.children[i].nodeType === 1) {//Is Element Node
				nodeName = el.children[i].nodeName;
				if(nodeName === "css" || nodeName === "script") {
					resourcesArr[resourcesArr.length] = prefix + el.children[i].textContent;
				}
			}
		}
		
		return resourcesArr;
	};
	
	var _ideviceContainer = null;
	
	var _editableIdevices = {};
	
	return {
		
		/** 
		 * Each page is designed (for now) to have one idevice 
		 * container: these are the selectors that will be used
		 * in order to find that container
		 * 
		 * If changed: see also epubpackage.py get_idevice_container_el
		 */
		IDEVICE_CONTAINER_SELECTORS: ["[data-role*='idevicecontainer']", 
		                              "[role*='main']", "#main"],
		
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
                    retVal[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
                }
            }
            return retVal;
        },
        
        init: function() {
        	var pageIdevices = document.querySelectorAll(".Idevice");
        	for(var i = 0; i < pageIdevices.length; i++) {
        		//all id attrs are idX where X is the actual id
        		var ideviceId = pageIdevices[i].getAttribute("id").substring(2);
        		_editableIdevices[ideviceId] = new eXeEpubIdevice(ideviceId);
        		_editableIdevices[ideviceId].initToolbar();
        	}
        },
		                              
		addIdevice: function(ideviceType, ideviceId) {
			//load required scripts if not already loaded
			this.addIdeviceXHTTP = new XMLHttpRequest();
			this.addIdeviceXHTTP.onreadystatechange = (function(response) {
				if(this.addIdeviceXHTTP.readyState === 4 && this.addIdeviceXHTTP.status === 200) {
					var ideviceXML = this.addIdeviceXHTTP.responseXML;
					var resourcesEl = ideviceXML.getElementsByTagName("system-resources");
					var resourcesArr = [];
					if(resourcesEl[0]) {
						addResourcesFromIdeviceEl(resourcesEl[0], "exe-files/common/", resourcesArr);
					}
					
					resourcesEl = ideviceXML.getElementsByTagName("idevice-resources");
					if(resourcesEl[0]) {
						addResourcesFromIdeviceEl(resourcesEl[0], "exe-files/idevices/"+ideviceType+"/", resourcesArr);
					}
					
					var numResources = resourcesArr.length;
					if(resourcesArr && resourcesArr.length) {
						eXeEpubAuthoring.loadResources(resourcesArr, function() {
							var ideviceContainer = eXeEpubAuthoring.getIdeviceContainer();
							var ideviceEl = document.createElement("div");
							var ideviceCssClass = ideviceXML.getElementsByTagName("cssclass")[0].textContent;
							ideviceEl.setAttribute("class", "Idevice " + ideviceCssClass);
							ideviceEl.setAttribute("id", "id" + ideviceId);
							ideviceEl.setAttribute("data-idevice-type", ideviceType);
							ideviceContainer.appendChild(ideviceEl);
							
							_editableIdevices[ideviceId] = new eXeEpubIdevice(ideviceId);
							_editableIdevices[ideviceId].initToolbar();
							
							var creationEvent = new CustomEvent("idevicecreate", {
								detail: {
									ideviceType: ideviceType,
									ideviceId: ideviceId
								},
								bubbles: true
							});
							ideviceEl.dispatchEvent(creationEvent);
						});
					}
				}
			}).bind(this);
			this.addIdeviceXHTTP.open("get", "/templates/idevices/" + ideviceType + 
					"/idevice.xml");
			this.addIdeviceXHTTP.send();
		},
		
		/**
		 * Load a CSS or Javascript resource if it is not yet already loaded 
		 * 
		 */
		loadResources: function(resURLs, callback) {
			var currentResIndex = 0;
			
			var goNextScriptFn = function() {
				if(currentResIndex < resURLs.length-1) {
					currentResIndex++;
					loadScriptFn();
				}else if(typeof callback === "function"){
					callback();
				}
				
			};
			
			var loadScriptFn = function() {
				var resURL = resURLs[currentResIndex];
				var isCSS = resURL.substring(resURL.length-4, resURL.length) === ".css";
				var attrName = isCSS ? "href" : "src";
				var tagName = isCSS ? "link" : "script"
				var resEl = document.querySelector("head " + tagName + "[" + attrName + "=\"" + resURL + "\"]");
				if(!resEl) {
					var newEl = document.createElement(tagName);
					if(isCSS) {
						newEl.setAttribute("rel", "stylesheet");
						newEl.setAttribute("type", "text/css");
					}else {
						newEl.setAttribute("type", "text/javascript");
					}
					newEl.setAttribute(attrName, resURL);
					newEl.onload = goNextScriptFn;
					newEl.onerror = goNextScriptFn;
					document.getElementsByTagName("head")[0].appendChild(newEl);
				}else {
					goNextScriptFn();
				}
			}
			
			loadScriptFn();
		},
		
		/**
		 * Find the element that is to be used as the container of idevices: this is where idevices 
		 * will be appended to.
		 */
		getIdeviceContainer: function() {
			if(_ideviceContainer) {
				return _ideviceContainer;
			}
			
			var result;
			for(var i = 0; i < eXeEpubAuthoring.IDEVICE_CONTAINER_SELECTORS.length; i++) {
				result = document.querySelector(eXeEpubAuthoring.IDEVICE_CONTAINER_SELECTORS[i]);
				if(result) {
					_ideviceContainer = result;
					break;
				}
			}
			
			return _ideviceContainer;
		},
		
		saveIdeviceHTML: function(ideviceId, html, callback) {
			//var saveURL = document.location.
			var queryVars = eXeEpubAuthoring.getQueryVars();
			var pageID = queryVars['exe-page-id'];
			
			var xmlHTTP = new XMLHttpRequest();
			xmlHTTP.onreadystatechange = function() {
				//for now - do nothing
			};
			
			//wrap innerHTML in a single element so it can be unwrapped by lxml
			xmlHTTP.open("POST", queryVars["exe-authoring-save-to"], true);
			xmlHTTP.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlHTTP.send("action=saveidevicehtml&" +
					"page_id=" + encodeURIComponent(pageID) + 
					"&idevice_id=" + encodeURIComponent(ideviceId) +
					"&html=" + encodeURIComponent(html));
		}
		
	};
})();

//for now run init immediately: this script is dynamically loaded after the page itself loads
eXeEpubAuthoring.init();


