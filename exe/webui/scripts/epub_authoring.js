/**
 * Handles authoring mode
 */

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
	
	var createNewIdeviceElement = function(id, ideviceType) {
		
	};
	
	var _ideviceContainer = null;
	
	return {
		
		/** 
		 * Each page is designed (for now) to have one idevice 
		 * container: these are the selectors that will be used
		 * in order to find that container
		 */
		IDEVICE_CONTAINER_SELECTORS: ["[data-role*='idevicecontainer']", 
		                              "[role*='main']", "#main"],
		
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
							ideviceContainer.appendChild(ideviceEl);
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
		
	};
})();


