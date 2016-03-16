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
			var processFn = (function(tcXmlDoc) {
				var launchEl = tcXmlDoc.querySelector("launch");
				var packageId = launchEl.parentNode.getAttribute("id");
				
				if(callback) {
					callback.call(opts && opts.context ? opts.context : this, null, packageId);
				}else {
					return packageId;
				}
			}).bind(this);
			
			if(callback) {
				this.getPackageTinCanXML(opts, processFn);
			}else {
				return processFn(this.getPackageTinCanXML(opts));
			}
		},
		
		getTinCanAndPageIds: function(opts, callback) {
			var cbContext = opts.context ? opts.context : this;
			this.getPackageTinCanID(opts, (function(err, tinCanID) {
				eXeEpubCommon.getPageID(opts, function(err, itemId) {
					callback.call(cbContext, null, tinCanID, itemId);
				});
			}).bind(this));
		},
		
		/**
		 * Given an activity id in the form of epub:xxx-yyy-zzz/Page_id/x_y where x
		 * is the idevice id and y is the block id (optional) return just x_y
		 */
		getStateKeyIdByActivityId: function(activityId) {
			return activityId.substring(activityId.lastIndexOf("/")+1)
		},
		
		getPackageTinCanXML: function(options, callback) {
			var pathToXML = "../tincan.xml";
			var xmlHTTP = new XMLHttpRequest();
			
			var processFn = function() {
				if(xmlHTTP.readyState === 4 && xmlHTTP.status === 200) {
					var tcXmlDoc = xmlHTTP.responseXML;
					if(typeof callback === "function") {
						var cbContext = options && options.context ? 
								options.context : this;
						callback.apply(cbContext, [tcXmlDoc]);
					}else {
						return tcXmlDoc;
					}
				}
			};
			
			if(callback) {
				xmlHTTP.onreadystatechange = processFn;
			}
			
			xmlHTTP.open("get", pathToXML, callback ? true : false);
			xmlHTTP.send();
			
			if(!callback) {
				return processFn();
			}
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
				_currentRegistrationUUID = localStorage.getItem(KEY_CURRENT_REG);
			}
			
			return _currentRegistrationUUID;
		},
		
		/**
		 * Start a registration for tracking a particular attempt, 
		 * data entry record etc.
		 * 
		 * @param {String} activityId Activity ID for the registration (e.g. the package id)
		 * @param {function} callback callback function to run on completion.
		 * 
		 */
		startRegistration: function(activityId, callback) {
			
			_currentRegistrationUUID = TinCan.Utils.getUUID();
			
			localStorage.setItem(KEY_CURRENT_REG, _currentRegistrationUUID);
			
			if(!this.getActor()) {
				if(typeof callback === "function") {
					callback(null, 0);
				}
				return;//there is no tincan actor cannot make statement
			}
			
			var stmt = new TinCan.Statement({
				actor: this.getActor(),
				verb: new TinCan.Verb({
					id : "http://adlnet.gov/expapi/verbs/initalized",
		    		display : {
		                "en-US": "initalized"
		            }
				}),
				target: new TinCan.Activity({
					id : activityId,
					definition : {
		    			type : "http://adlnet.gov/expapi/activities/assessment",
		        		name : {
		        			"en-US" : "Start Record" 
		        		},
		        		description : {
		        			"en-US" : "Start Registration"
		        		}
		        	}
				}),
				context: new TinCan.Context({
		    		"registration" : _currentRegistrationUUID
		    	}) 
			}, {'storeOriginal' : true});	
			
			this.sendStatement(stmt, opts, callback);
		},
		
		/**
		 * Get the value of the state for the given key.  Also supports
		 * looking through all keys by prefix which returns an object 
		 * of all matching key ids and values.
		 * 
		 * @param {string} key the key id being requested
		 * @param {function} callback callback function to run once loaded
		 * @param {Object} opts
		 * @param {boolean} [opts.prefix] set to true to return all key values which start with key
		 */
		getPkgStateValue: function(key, callback, opts) {
			if(_xAPIstateStatus === eXeTinCan.STATE_LOADED || _xAPIstateStatus === eXeTinCan.STATE_UNAVAILABLE) {
				callback.call(opts && opts.context ? opts.context : this, this._getPkgStateValue(key, opts));
			}else {
				_pendingReadyCallbacks.push([callback, opts, key]);
			}
		},
		
		/**
		 * Gets the score of the given item
		 * @param {string} key 
		 */
		getPkgStateScoreSync: function(key){
			if(_xAPIstateStatus === eXeTinCan.STATE_LOADED || _xAPIstateStatus === eXeTinCan.STATE_UNAVAILABLE) {
				if(key.substring(0, 5) === "epub:") {
					key = this.getStateKeyIdByActivityId(key);
				}
				
				if(key === "score") {
					return eXeTinCan.getCurrentScore();
				}else if(_state["id"+key] && typeof _state["id"+key].score !== "undefined") {
					return _state["id"+key].score;
				}
			}else {
				throw "Illegal State: cannot get state based score before state is loaded";
			}
		},
		
		/**
		 * Returns the value of a given key, or in prefix mode, all key 
		 * id and value pairs that start with key as a prefix
		 */
		_getPkgStateValue: function(key, opts) {
			if(!(opts && opts.prefix) && typeof key === "string") {
				return _state[key];
			}else {
				var keyValues = {};
				var keysToMatch = key;
				var matchByPrefix = (opts && opts.prefix);
				var keyToCheck, i;
				
				if(typeof key === "string") {
					keysToMatch = [key];
				}
				
				for(keyId in _state) {
					if(_state.hasOwnProperty(keyId)) {
						for(i = 0; i < keysToMatch.length && (typeof keyValues[keyId] === "undefined"); i++) {
							keyToCheck = keysToMatch[i];
							if(keyToCheck === "*") {
								keyValues[keyId] = _state[keyId];
							}else if(matchByPrefix && keyId.substring(0, keyToCheck.length) === keyToCheck) {
								keyValues[keyId] = _state[keyId];
							}else if(!matchByPrefix && keyId === keyToCheck) {
								keyValues[keyId] = _state[keyId];
							}
						}
					}
				}
				
				return keyValues;
			}
		},
		
		/**
		 * This function will check all those state values that have a 
		 * score property.  This must only be called after the state is 
		 * loaded
		 */
		getCurrentScore: function() {
			var score = 0;
			for(keyId in _state) {
				if(_state.hasOwnProperty(keyId) && typeof _state[keyId].score === "number") {
					score += _state[keyId].score;
				}
			}
			
			return score;
		},
		
		/**
		 * Sets the given package state key.
		 * 
		 * @param {Object} values object in form of :
		 * 	ID to save in the form of idX[_Y...] where X = ideviceId, _Y = block ID etc - value
		 * @param {Object} opts General options
		 * @param {function} [opts.callback] callback function to run if/when we call saveState 
		 * @param {boolean} [opts.autosave=true] whether or not to immediately use saveState to save the new value
		 * @param {boolean} [opts.async=true] set to false to force no callback synchronous mode for saveState
		 */
		setPkgStateValues: function(values, opts) {
			var saveStateKeys = [];
			for(key in values) {
				if(values.hasOwnProperty(key)) {
					_state[key] = values[key];
					saveStateKeys.push(key);
				}
			}
			
			
			/*
			 * If there is no callback object this will be run as a 
			 * synchronous HTTP request... which effects UI performance etc.
			 */
			var opts = opts || {};
			var callback = null;
			if(!(typeof opts.async === "boolean" && opts.async === false)) {
				callback = typeof opts.callback === "function" ? opts.callback : (function(){});
			}
			
			//make a copy of the opts and then add the keys to it
			if(!(typeof opts.autosave === "boolean" && opts.autosave === false)) {
				var saveStateOpts = {};
				for(optKey in opts) {
					if(opts.hasOwnProperty(optKey)) {
						saveStateOpts[optKey] = opts[optKey];
					}
				}
				saveStateOpts.keys = saveStateKeys;
				
				this.saveState(saveStateOpts, callback);
			}
		},
		
		/**
		 * Legacy fill : better to use setPkgStateValues
		 */
		setPkgStateValue: function(key, value, opts) {
			var stateValues = {};
			stateValues[key] = value;
			this.setPkgStateValues(stateValues, opts);
		},
		
		/**
		 * Make the parameters required to get/save a state
		 */
		_makeStateParams: function(pkgId, callbackFn) {
			var params = {
				agent : this.getActor(),
				activity: new TinCan.Activity({
					id: pkgId
				})
			};
			
			if(callbackFn) {
				params.callback = callbackFn;
			}
			
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
			return "exe-tincan-" + encodeURIComponent(agentStr) + "-" +
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
			if(err === null && (result === null || result.contents === null)) {
				//results.content is very weird
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
						args.push(this._getPkgStateValue(key, keyOpts));
					}
					_pendingReadyCallbacks[i][_PENDING_IDX_FN].apply(
							keyOpts.context ? keyOpts.context : this, args);
				}catch(err) {
					console.log(err);
				}
			}
			_pendingReadyCallbacks = [];
			
			if(document.readyState === "interactive" || document.readyState === "complete") {
				this._setResponseValueEls();
			}else {
				document.addEventListener("DOMContentLoaded", this._setResponseValueEls.bind(this), false);
			}
		},
		
		/**
		 * When the author uses the TinyMCE plugin to create a span that should be
		 * filled by a previously inserted value a span is created...
		 */
		_setResponseValueEls: function() {
			if(eXeEpubCommon.isAuthoringMode()) {
				return;//dont do fill-ins in authoring mode
			}
			
			var responseEls = document.querySelectorAll("span.exe-insert-response");
			for(var i = 0; i < responseEls.length; i++) {
				var activityId = responseEls[i].getAttribute("data-activity-id");
				var stateKeyId = "id" + activityId.substring(activityId.lastIndexOf("/") + 1).replace(".", "_");
				if(typeof _state[stateKeyId] !== "undefined") {
					responseEls[i].textContent = _state[stateKeyId].response;
				}
			}
		},
		
		/**
		 * @param {Object} opts : General options
		 * @param {string} [opts.keys] If given send only the listed keys to the server
		 * @param {Object} context : context (e.g. this) to use for callback
		 */
		saveState: function(opts, callback) {
			var stateToStore = _state;
			
			if(opts.keys) {
				stateToStore = {};
				for(var i = 0; i < opts.keys.length; i++) {
					stateToStore[opts.keys[i]] = _state[opts.keys[i]];
				}
			}
			
			var processPkgIdFn = (function(err, pkgId) {
				var callbackFn = null;
				if(callback) {
					callbackFn = opts.context ? callback.bind(opts.context) : callback;
				}
				
				
				
				var params = this._makeStateParams(pkgId, callbackFn);
				params.contentType = "application/json";
				if(this.isLRSActive()) {
					return _tinCan.setState(STATE_ID, stateToStore, params);
				}else {
					return this.setStateToLocalStorage(STATE_ID, stateToStore, params);
				}
					
			}).bind(this);
			
			if(callback) {
				this.getPackageTinCanID(opts, processPkgIdFn);
			}else {
				return processPkgIdFn(null, this.getPackageTinCanID(opts));
			}
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
			var result = new TinCan.State({
				id : stateId,
				contents: currentVal,
				contentType: "application/json"
			});
			
			if(typeof cfg.callback === "function") {
				cfg.callback(null, result);
			}else {
				return result;
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
			
			if(this.getCurrentRegistrationUUID()) {
				stmtParams.context = new TinCan.Context({
		    		"registration" : this.getCurrentRegistrationUUID()
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
		},
		
		getActivityByIdFromArr: function(arr, activityId) {
			for(var i = 0; i < arr.length; i++) {
				if(arr[i].getAttribute("id") === activityId) {
					return arr[i];
				}
			}
			
			return null;
		}
		
	};
	mod.init();
	return mod;
})();

