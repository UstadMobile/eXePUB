/**
 * eXeTinCan provides wrapper functions to make it straightforward
 * to use the xAPI and save/restore key/value pairs using the xAPI
 * State API where available and falling back to local storage when
 * this is not available.
 * 
 * The State API always uses the main activity ID (e.g. the activity
 * in tincan.xml where there is a launch element).
 */
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
	 * [callback function, opts, key requested]
	 * key requested is optional
	 */
	var _pendingReadyCallbacks = [];
	
	var _PENDING_IDX_FN = 0;
	
	var _PENDING_IDX_OPTS = 1;
	
	var _PENDING_IDX_KEY = 2;
	
	var _xAPIstateStatus = 0;
	
	var _lrsActive = false;
		
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
		 * Check and see if we are active communicating with an LRS or not
		 * 
		 * @return {boolean} true if there is an active LRS; false otherwise
		 */
		isLRSActive: function() {
			return _lrsActive;
		},
		
		/**
		 * Handle the Rustici launch method to set parameters - endpoint, actor, etc. 
		 * 
		 * We'll allow setting only the actor and/or registration and not the endpoint 
		 * for testing purposes.
		 * 
		 * @method setLRSParamsFromLaunchURL
		 */
	    setLRSParamsFromLaunchURL : function() {
	    	var queryVars = eXeEpubCommon.getQueryVars();

	    	// Handle Rustici launch method
	    	if(queryVars['actor']) {
	    	 	var queryActorStr = queryVars['actor'];
		    	var ourActor = TinCan.Agent.fromJSON(queryActorStr);
		    	this.setActor(ourActor);
	    	}
	    	
	    	if(queryVars['registration']) {
				_currentRegistrationUUID = queryVars['registration'];
			}
	    	
	    	if(queryVars['endpoint']) {
	    		_lrsActive = true;
				var newLRS = new TinCan.LRS({
		            "endpoint" : queryVars['endpoint'],
		            "version" : "1.0.2",
		            "user" : ourActor,
		            'auth' : queryVars['auth'],
		            allowFail: false
		        }); 
		    	
				_tinCan.recordStores[0] = newLRS;
	    	}
	    	
	    	this.loadState();
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
				_pendingReadyCallbacks.push([callback, opts, key]);
			}
		},
		
		setPkgStateValue: function(key, value, callback, opts) {
			_state[key] = value;
			
		},
		
		/**
		 * Make the parameters required to get/save a state
		 */
		_makeStateParams: function(pkgId, callbackFn) {
			var params = {
				agent : this.getActor(),
				activity: new TinCan.Activity({
					id: pkgId
				}),
				callback : callbackFn
			};
			
			if(_currentRegistrationUUID !== -1) {
				params.registration = _currentRegistration; 
			}
			
			return params;
		},
		
		runAfterStateLoaded: function(opts, callback) {
			if(_xAPIstateStatus == eXeTinCan.STATE_LOADED || _xAPIstateStatus == eXeTinCan.STATE_UNAVAILABLE) {
				callback.call(opts.context ? opts.context : this)
			}else {
				_pendingReadyCallbacks.push([callback, opts]);
			}
		},
		
		loadState: function(opts, callback) {
			_xAPIstateStatus = 1; // eXeTinCan.STATE_LOADING - Object not yet accessible when this runs
			this.getPackageTinCanID(opts, function(err, pkgId){
				var cbWrapper = (function(err, result) {
					this.handleStateLoaded(err, result);
					if(typeof callback === "function") {
						callback.call(opts.context ? opts.context : this, 
								err, result);
					}
				}).bind(this);
				
				var params = this._makeStateParams(pkgId, cbWrapper);
				
				if(this.isLRSActive()) {
					_tinCan.getState(STATE_ID, params);
				}else {
					this.getStateFromLocalStorage(STATE_ID, params);
				}
			}, {context : this});
		},
		
		_getCurrentLocalStorageKey: function(cfg) {
			var regId = cfg.registration ? cfg.registration : "";
			var agentStr = cfg.agent ? cfg.agent.toString() : "NOAGENT";
			return "exe-tincan-" + encodeURIComponent(agentStr) + "-"
				cfg.activity.id + "-" + regId;
		},
		
		/**
		 * Filler to handle loading the state from the localStorage instead 
		 * of the xAPI server using the same parameters
		 */
		getStateFromLocalStorage: function(stateId, cfg) {
			var stateVal = localStorage.getItem(this._getCurrentLocalStorageKey(cfg));
			if(typeof cfg.callback === "function") {
				stateVal = stateVal ? JSON.parse(stateVal) : {};
				var state = new TinCan.State({
					id: stateId,
					contents: stateVal,
					contentType: "application/json"
				});
				cfg.callback(null, state);
			}
		},
		
		handleStateLoaded: function(err, result) {
			if(err === null && result === null) {
				//State has not been saved yet, it's blank
				_xAPIstateStatus = eXeTinCan.STATE_LOADED;
				_state = {};
			}else if(result) {
				_xAPIstateStatus = eXeTinCan.STATE_LOADED;
				_state = result.contents;
			}else {
				//not good really - XAPI was enabled but it didn't load
				_xAPIstateStatus = eXeTinCan.STATE_UNAVAILABLE;
				_state = {};
			}
			
			var keyOpts;
			var key;
			var args;
			for(var i = 0; i < _pendingReadyCallbacks.length; i++) {
				try {
					args = [];
					keyOpts = _pendingReadyCallbacks[i][_PENDING_IDX_OPTS] ? 
							_pendingReadyCallbacks[i][_PENDING_IDX_OPTS] : {};
					key = _pendingReadyCallbacks[i][_PENDING_IDX_KEY];
					if(key) {
						args.push(_state[key]);
					}
					_pendingReadyCallbacks[i][_PENDING_IDX_FN].apply(
							keyOpts.context ? keyOpts.context : this, args);
				}catch(err) {
					console.log(err);
				}
			}
			_pendingReadyCallbacks = [];
		},
		
		saveState: function(opts, callback) {
			this.getPackageTinCanID(opts, function(err, pkgId) {
				var cbWrapper = (function(err, results) {
					if(typeof callback === "function") {
						callback.call(opts.context ? opts.context : this, err, results);
					}
				}).bind(this);
				var params = this._makeStateParams(pkgId,
						cbWrapper);
				params.contentType = "application/json";
				if(this.isLRSActive()) {
					_tinCan.setState(STATE_ID, _state, params);
				}else {
					this.setStateToLocalStorage(STATE_ID, _state, params);
				}
			}, {context: this});
		},
		
		setStateToLocalStorage: function(stateId, state, cfg) {
			var storageKey = this._getCurrentLocalStorageKey(cfg);
			var currentVal = localStorage.getItem(storageKey);
			currentVal = currentVal ? JSON.parse(currentVal) : {};
			for(var prop in state) {
				if(state.hasOwnProperty(prop)) {
					currentVal[prop] = state[prop];
				}
			}
			
			localStorage.setItem(storageKey, JSON.stringify(currentVal));
			if(typeof cfg.callback === "function") {
				cfg.callback(null, new TinCan.State({
					id : stateId,
					contents: currentVal,
					contentType: "application/json"
				}));
			}
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

