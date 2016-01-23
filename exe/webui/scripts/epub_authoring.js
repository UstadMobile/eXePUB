//Begin functions copied out of authoring.js 
var eXe = parent.eXe;



//TinyMCE file_browser_callback
var exe_tinymce = {
	
	chooseImage : function(field_name, url, type, win) {
		var tinyMCEVersion = 4;
		
		var fn = function(local_imagePath) {
			win.focus();
		
			// if the user hits CANCEL, then bail "immediately",
			// i.e., after bringing the tinyMCE image dialog back into focus, above.
			if (local_imagePath == "") {
			   return;
			}
		
			// UNescape, to remove the %20's for spaces, etc.:
			var unescaped_local_imagePath = unescape(local_imagePath);
			var oldImageStr = new String(unescaped_local_imagePath);
			
			/* HTML 5 */
			exe_tinymce.uploaded_file_1_name = "";
			
			var last_uploaded_file_path = unescaped_local_imagePath.split("\\");
			var last_uploaded_file_name = last_uploaded_file_path[last_uploaded_file_path.length-1];
			/* Main file */
			if (field_name=="src") {
				exe_tinymce.uploaded_file_1_name = last_uploaded_file_name;
			}		
			/* /HTML5 */		
		
			// and replace path delimiters (':', '\', or '/') or '%', ' ', or '&' 
			// with '_':
			var RegExp1 = /[\ \\\/\:\%\&]/g;
			var ReplaceStr1 = new String("_");
			var newImageStr = oldImageStr.replace(RegExp1, ReplaceStr1);
		
			// For simplicity across various file encoding schemes, etc.,
			// just ensure that the TinyMCE media window also gets a URI safe link, 
			// for doing its showPreview():
			var early_preview_imageName = encodeURIComponent(newImageStr);
			// and one more escaping of the '%'s to '_'s, to flatten for simplicity:
			var preview_imageName  = early_preview_imageName.replace(RegExp1, ReplaceStr1);
			var full_previewImage_url = "/previews/"+preview_imageName;
		
			// pass the file information on to the server,
			// to copy it into the server's "previews" directory:
			window.parent.nevow_clientToServerEvent('previewTinyMCEimage', this, '', win, win.name, field_name, unescaped_local_imagePath, preview_imageName)
			
			if(tinyMCEVersion != 4) {
				
				
				// first, clear out any old value in the tinyMCE image filename field:
				win.document.forms[0].elements[field_name].value = "";
				
				
				
				// set the tinyMCE image filename field:
				win.document.forms[0].elements[field_name].value = full_previewImage_url;
				// then force its onchange event:
			
				// PreviewImage is only available for images:
				if (type == "image") {
				   win.ImageDialog.showPreviewImage(full_previewImage_url);
				}
				else if (type == "media") {
				   win.window.Media.preview();
				}
			
				// this onchange works, but it's dirty because it is hardcoding the 
				// onChange=".." event of that field, and if that were to ever change 
				// in tinyMCE, then this would be out of sync.
			
				// and finally, be sure to update the tinyMCE window's image data:
				if (win.getImageData) {
					win.getImageData();
				} else {
					if (window.tinyMCE.getImageData) {
					   window.tinyMCE.getImageData();
					}
				}
			}else {
				win.document.getElementById(field_name).value = full_previewImage_url;
			}
			
			
		
			
		}

		// ask user for image or media, depending on type requested:
		if (type == "image") {
		   askUserForImage(false, fn);
		} else if (type == "media") {
		   askUserForMedia(fn);
		} else if (type == "file") {
		   // new for advlink plugin, to link ANY resource into text:
		   // re-use the Media browser, which defaults to All file types (*.*)
		   askUserForMedia(fn);
		} else if (type == "image2insert" || type == "media2insert" || type == "file2insert") {
			if (type == "file2insert" && url.indexOf('#') >= 0) {
				// looks like a link to an internal anchor due to the #, so do
				// not proceed any further, since there is no more action necessary:
				return;
				// UNLESS this causes problems with embedding real filenames w/ #!!
				// But this will only be for links or filenames typed by hand;
				// those textlink URLs inserted via its file browser will use 
				// type=file rather than type=file2insert
			}
			// new direct insert capabilities, no file browser needed.
			// just copy the passed-in URL directly, no browser necessary:
			fn(url);
		}
	}//chooseImage
	
};


//Asks the user for an image, returns the path or an empty string
function askUserForImage(multiple, fn, filter) {
    var fp, mode;
    if (multiple)
        mode = parent.eXe.view.filepicker.FilePicker.modeOpenMultiple;
    else
        mode = parent.eXe.view.filepicker.FilePicker.modeOpen;
    fp = parent.Ext.create("eXe.view.filepicker.FilePicker", {
        type: mode,
        title: multiple? parent._("Select one or more images") : parent._("Select an image"),
        modal: true,
        scope: this,
        callback: function(fp) {
            if (fp.status == parent.eXe.view.filepicker.FilePicker.returnOk) {
                if (multiple) {
		            var result = new String("");
                    for (f in fp.files) {
		                if (result != "") {
		                    result += "&";
		                }
		                result += escape(fp.files[f].path);
		            }
		            fn(result);
		        } else {
                    fn(fp.file.path);
                }
            }
            else
                fn("");
        }
    });
    fp.appendFilters([
        filter
        ? filter
        : { "typename": parent._("Image Files (.jpg, .jpeg, .png, .gif, .svg)"), "extension": "*.png", "regex": /.*\.(jpg|jpeg|png|gif|svg)$/i },
          { "typename": parent._("All Files"), "extension": "*.*", "regex": /.*$/ }
    ]);
    parent.window.focus();
    fp.show();
}


//End functions copied out of authoring.js



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
		
        NS_TINCAN : "http://projecttincan.com/tincan.xsd",
        
        NS_EXETINCAN: "http://ustadmobile.com/ns/exe-tincan",
		                              
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
        	//load other required scripts
        	var resourcesToLoad = ['/templates/tinymce/tinymce.full.min.js',
        	                       '/templates/tinymce4-exe-settings.js',
        	                       '/templates/tinymce/skins/lightgray/skin.ie7.min.css',
        	                       '/templates/tinymce/skins/lightgray/content.min.css',
        	                       '/templates/tinymce/skins/lightgray/skin.min.css',
        	                       '/templates/tinymce/skins/lightgray/content.inline.min.css',
        	                       '/templates/tinymce/plugins/visualblocks/css/visualblocks.css'
        	                       ];
        	
        	eXeEpubAuthoring.loadResources(resourcesToLoad, function() {
        		var pageIdevices = document.querySelectorAll(".Idevice");
            	for(var i = 0; i < pageIdevices.length; i++) {
            		//all id attrs are idX where X is the actual id
            		var ideviceId = pageIdevices[i].getAttribute("id").substring(2);
            		_editableIdevices[ideviceId] = new eXeEpubIdevice(ideviceId);
            		_editableIdevices[ideviceId].initToolbar();
            	}
        	});
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
		},
		
		saveIdeviceTinCanXML: function(ideviceId, tincanXML, callback) {
			var queryVars = eXeEpubAuthoring.getQueryVars();
			var xmlHTTP = new XMLHttpRequest();
			
			xmlHTTP.open("POST", queryVars['exe-authoring-save-to'], true);
			xmlHTTP.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xmlHTTP.send("action=saveidevicetincan&" +
					"idevice_id=" + encodeURIComponent(ideviceId) +
					"&tincan_xml=" + encodeURIComponent(tincanXML));
		},
		
		/**
		 * Turn TinyMCE editing on or off on a given element.
		 * @param id
		 * @param editingEnabled
		 * @param options
		 * @param options.auto_focus - if true will auto focus this editing element
		 * @param options.tinymceopts - if set will use as the tinymce init options (no selector setting required - this is handled)
		 */
		setTinyMceEnabledById: function(id, editingEnabled, options) {
			var editor = tinymce.get(id);
			options = options || {};
			eXeEpubTinyMce.initExternalToolbarHolder();
			var el = document.getElementById(id); 
			
			if(editingEnabled) {
				var tinyMceOpts = options.tinymceopts ? options.tinymceopts : eXeEpubTinyMce.getDefaultOptions();
				tinyMceOpts.selector = "#" + id;
				tinymce.init(tinyMceOpts);
			}else {
				tinymce.remove("#" + id);
				document.getElementById(id).setAttribute("contenteditable", false);
			}
		},
		
		/**
		 * Before removing elements from the DOM: if they have tinyMCE 
		 * attached we should turn it off so as not to confuse tinymce
		 * if another element comes along with the same ID
		 */
		removeAllTinyMceInstances: function(el) {
			var mceEditors = el.querySelectorAll(".mce-content-body");
			for(var i = 0; i < mceEditors.length; i++) {
				tinymce.remove("#" + mceEditors[i].getAttribute("id"));
			}
		},
		
		/**
		 * Remove TinyMCE classes etc. from the HTML of a given element that 
		 */
		getSavableHTML: function(el) {
			var dupNode = el.cloneNode(true);
			var allChildren = dupNode.getElementsByTagName("*");
			for(var i = 0; i < allChildren.length; i++) {
				if(allChildren[i].classList.contains("mce-content-body")) {
					allChildren[i].classList.remove("mce-content-body");
					if(allChildren[i].classList.contains("mce-edit-focus")) {
						allChildren[i].classList.remove("mce-edit-focus");
					}
					
					allChildren[i].removeAttribute("contenteditable");
					allChildren[i].removeAttribute("spellcheck")
				} 
			}
			
			return dupNode.innerHTML;
		}
		
	};
})();

//for now run init immediately: this script is dynamically loaded after the page itself loads
eXeEpubAuthoring.init();


