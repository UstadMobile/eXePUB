
var eXeTinCan = (function() {
	
	var _currentActor = null;
	
	var _currentRegistrationUUID = -1;
	
	var _currentScoreComponents = {};
	
	var KEY_CURRENT_REG = "eXeTC-Current-RegistrationUUID";
	
	var STATE_ID = "exe_pkg_state";
	
	var _tinCan = null;
	
	var _state = null;
	
	/**
	 * Array of arrays in the form of 
	 * [key requested, callback function, opts]
	 */
	var _pendingReadyKeys = [];
	
	var _xAPIstateStatus = 0;
		
	var mod = {
		
		STATE_PENDING : 0,
		
		STATE_LOADING : 1,
		
		STATE_UNAVAILABLE : 2,
		
		STATE_LOADED : 3,
			
		localStoragePrefix : "eXeTC-",
		
		/**
		 * 
		 * @method setActor
		 */
		setActor : function(actor) {
			_currentActor = actor;
		},

		/**
		 * 
		 * @method getActor
		 */
		getActor : function() {
			return _currentActor;
		}, 
		
		init: function() {
			_tinCan = new TinCan();
			this.setLRSParamsFromLaunchURL();
			
		},
		
		/**
		 * Set how we are working based on parameters in URL
		 * 
		 * If exetincanproxy is set all statements will be sent to the proxy without
		 * authentication (e.g. Ustad Mobile) to a local server
		 * 
		 * Otherwise the statement will be serialized and sent to the LRS if Rustici
		 * launch method parameters are in the URL
		 * 
		 * @method setLRSParamsFromLaunchURL
		 */
	    setLRSParamsFromLaunchURL : function() {
	    	var queryVars = eXeEpubCommon.getQueryVars();
	    	// Handle Rustici method
	    	if(queryVars['actor']) {
	    		debugger;
	    	 	var queryActorStr = queryVars['actor'];
		    	var ourActor = TinCan.Agent.fromJSON(queryActorStr);
		    	this.setActor(ourActor);
		    	
				var newLRS = new TinCan.LRS({
		            "endpoint" : queryVars['endpoint'],
		            "version" : "1.0.0",
		            "user" : ourActor,
		            'auth' : queryVars['auth']
		        }); 
		    	
				_tinCan.recordStores[0] = newLRS;
				if(queryVars['registration']) {
					_currentRegistrationUUID = queryVars['registration'];
				}
				//this.loadState();
	    	}
	    },
		
		/**
		 * The package's TinCan ID is the Activity ID with the launch
		 * element
		 * 
		 * @param {function} callback function to run once the ID is obtained
		 * @param {Object} [opts] optional additional arguments
		 * @param {Object} [opts.context] callback context to use
		 */
		getPackageTinCanID: function(opts, callback) {
			this.getPackageTinCanXML(opts, (function(tcXmlDoc) {
				var launchEl = tcXmlDoc.querySelector("launch");
				var packageId = launchEl.parentNode.getAttribute("id");
				callback.call(opts && opts.context ? opts.context : this, null, packageId);
			}).bind(this));
		},
		
		getTinCanAndPageIds: function(opts, callback) {
			var cbContext = opts.context ? opts.context : this;
			this.getPackageTinCanID(opts, (function(err, tinCanID) {
				eXeEpubCommon.getPageID(opts, function(err, itemId) {
					callback.call(cbContext, null, tinCanID, itemId);
				});
			}).bind(this));
		},
		
		getPackageTinCanXML: function(options, callback) {
			var pathToXML = "../tincan.xml";
			var xmlHTTP = new XMLHttpRequest();
			
			xmlHTTP.onreadystatechange = function() {
				if(xmlHTTP.readyState === 4 && xmlHTTP.status === 200) {
					var tcXmlDoc = xmlHTTP.responseXML;
					if(typeof callback === "function") {
						var cbContext = options && options.context ? 
								options.context : this;
						callback.apply(cbContext, [tcXmlDoc]);
					}
				}
			};
			
			xmlHTTP.open("get", pathToXML, true);
			xmlHTTP.send();
		},
		
		getActivitiesByInteractionType: function(interactionTypes, options, callback) {
			this.getPackageTinCanXML({}, (function(xmlDoc) {
				var matchingActivities = [];
				var interactionTypeEls = xmlDoc.querySelectorAll("interactionType");
				
				var j;
				var match;
				for(var i = 0 ; i < interactionTypeEls.length; i++) {
					match = false;
					for(j = 0; j < interactionTypes.length && !match; j++) {
						if(interactionTypeEls[i].textContent === interactionTypes[j]) {
							match = true;
						}
					}
					
					if(match) {
						matchingActivities.push(interactionTypeEls[i].parentNode);
					}
				}
				
				if(typeof callback === "function") {
					var cbContext = options && options.context ? options.context : this;
					callback.apply(cbContext, [matchingActivities]);
				}
			}).bind(this));
		},
		
		getActivitiesByExtension: function(extensionKey, extensionValue, options,  callback) {
			this.getPackageTinCanXML({}, (function(xmlDoc) {
				var matchingActivities = [];
				var selector = "extension[key='" + extensionKey + "']";
				var queryMatches = xmlDoc.querySelectorAll(selector);
				var currentVal;
				for(var i = 0; i < queryMatches.length; i++) {
					currentVal = queryMatches[i].textContent.trim();
					if(extensionValue === null || currentVal === extensionValue) {
						matchingActivities.push(queryMatches[i].parentNode.parentNode);
					}
				}
				
				if(typeof callback === "function") {
					var cbContext = options && options.context ? options.context : this;
					callback.apply(cbContext, [matchingActivities]);
				}
			}).bind(this));
		},
		
		getCurrentRegistrationUUID: function() {
			if(_currentRegistrationUUID === -1) {
				_currentRegistrationUUID = document.localStorage.getItem(
						KEY_CURRENT_REG);
			}
			
			return _currentRegistrationUUID;
		},
		
		/**
		 * Start a registration for tracking a particular attempt, 
		 * data entry record etc.
		 */
		startRegistration: function(activityId, callback) {
			
			_currentRegistrationUUID = TinCan.Utils.getUUID();
			
			localStorage.setItem(KEY_CURRENT_REG, _currentRegistrationUUID);
			
			var myVerb = new TinCan.Verb({
				id : "http://adlnet.gov/expapi/verbs/initalized",
	    		display : {
	                "en-US": "initalized"
	            }
			});
			
			var myActivity = new TinCan.Activity({
				id : activityId,
				definition : {
	    			type : "http://adlnet.gov/expapi/activities/assessment",
	        		name : {
	        			"en-US" : "Start Assessment" 
	        		},
	        		description : {
	        			"en-US" : "Start Assessment"
	        		}
	        	}
			});
			
			
			//TODO: submit the statement itself
			if(typeof callback === "function") {
				callback(null, 200);
			}
		},
		
		getPkgStateValue: function(key, callback, opts) {
			if(_xAPIstateStatus === eXeTinCan.STATE_LOADED || _xAPIstateStatus === eXeTinCan.STATE_UNAVAILABLE) {
				callback.call(opts && opts.context ? opts.context : this, _state[key]);
			}else {
				_pendingReadyKeys.push([key,callback, opts]);
			}
		},
		
		loadState: function() {
			_xAPIstateStatus = eXeTinCan.STATE_LOADING;
			this.getPackageTinCanID({}, function(err, pkgId){
				var params = {
					agent : this.getActor(),
					activity: pkgId,
					callback : this.handleStateLoaded.bind(this)
				};
				
				if(_currentRegistrationUUID !== -1) {
					params.registration = _currentRegistration; 
				}
				
				_tinCan.getState(KEY_CURRENT_REG, params);
			}, {context : this})
		},
		
		saveState: function() {
			
		},
		
		handleStateLoaded: function(state) {
			if(_state === null) {
				_xAPIstateStatus = eXeTinCan.STATE_UNAVAILABLE;
				//not good really... 
				_state = {};
			}else {
				_xAPIstateStatus = eXeTinCan.STATE_LOADED;
				_state = JSON.parse(state.content);
			}
			
			var keyOpts;
			var key;
			for(var i = 0; i < _pendingReadyKeys.length; i++) {
				try {
					keyOpts = _pendingReadyKeys[i][2] ? _pendingReadyKeys[i][2] : {};
					key = _pendingReadyKeys[i][0];
					
					_pendingReadyKeys[i][1].call(
						keyOpts.context ? keyOpts.context : this, _state[key]);
				}catch(err) {
					console.log(err);
				}
			}
			_pendingReadyKeys = [];
		},
		
		/**
		 * Send the given statement to the LRS
		 * 
		 * @param {Statement} stmt The TinCan.Statement object to send to LRS
		 * @param {Object} opts additional arguments
		 * @param {Object} [opts.context] Context for this object when running callback
		 * @param {callback} callback to execute after statement transmission has been attempted 
		 *   takes params (err, result, tinCanStmt) 
		 */
		sendStatement: function(stmt, opts, callback) {
			_tinCan.sendStatement(stmt, function(results, tinCanStmt) {
				var sendErr = [];
		        for(var j = 0; j < results.length; j++) {
		            //see if it was sent OK
		            var err = results[j]['err'];
		            var xhr = results[j]['xhr'];
		            if((err !== null|| err !== 0) || xhr.status >= 300){
		                //this one sent OK
		                sendErr.push([err, xhr.status]);
		            }
		        }
		        sendErr = sendErr.length === 0 ? null : sendErr;
		        if(typeof callback === "function") {
		        	callback.call(opts.context ? opts.context : this, sendErr, results);
		        }
			});
		},
		
		
		/**
		 * Function to make a statement about the user selecting a 
		 * given choice (e.g. MCQ, true - false, checkbox, etc) 
		 * 
		 * @param {string} [opts.choice] The choice of the user
		 * @param {Object} [opts.result] Result object
		 * 
		 */
		makeAnsweredStmt: function(activityId, opts) {
			var stmtParams = {
				actor: this.getActor(),
				verb: new TinCan.Verb({
					id : "http://adlnet.gov/expapi/activities/answered",
					name : {
						"en-US" : "Answered"
					}
				}),
				target: new TinCan.Activity({
					"id" : activityId
				})
			};
			
			if(opts.result) {
				resultParams = {};
				for(var key in opts.result) {
					if(opts.result.hasOwnProperty(key)) {
						resultParams[key] = opts.result[key];
					}
				}
				stmtParams.result = new TinCan.Result(resultParams);
			}
			
			if(_currentRegistrationUUID) {
				stmtParams.context = new TinCan.Context({
		    		"registration" : this.registrationUUID
		    	});
			}
			
			return new TinCan.Statement(stmtParams, {'storeOriginal' : true});
		},
		
		/**
		 * Makes name and description elements with the lang 
		 * 
		 * @param {Element} element - the element (eg activity element) to add to
		 * @param {Array} elementNames - Array of elements to create e.g. ['description', 'name']
		 * @param {string} lang - the lang that the description / name is in e.g. en-us
		 * @param {string} text - the text of the name/description itself
		 */
		appendLangElements: function(element, elementNames, lang, text) {
			var textEl;
			for(var j = 0; j < elementNames.length; j++) {
				textEl = element.ownerDocument.createElementNS(
						eXeEpubAuthoring.NS_TINCAN, elementNames[j]);
				textEl.setAttribute("lang", lang);
				textEl.textContent = text;
				element.appendChild(textEl);
			}
		},
		
		/**
		 * Appends an interactionType element to the given element
		 * 
		 * @param {Element} element The Element to append the interaction type to
		 * @param {string} interactionType The text content put inside the interactionType e.g. choice, fill-in etc.
		 */
		appendInteractionType: function(element, interactionType) {
			var iTypeEl = element.ownerDocument.createElementNS(
					eXeEpubAuthoring.NS_TINCAN, "interactionType");
			iTypeEl.textContent = interactionType;
			element.appendChild(iTypeEl);
		}
	};
	mod.init();
	return mod;
})();

