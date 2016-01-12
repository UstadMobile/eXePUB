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
	
	return {
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
							//TODO: Create the idevice dom node
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
		}
	};
})();


