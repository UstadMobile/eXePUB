
var eXeTinCan = (function() {
	
	var _currentActor = null;
	
	var _currentRegistrationUUID = -1;
	
	var _currentScoreComponents = {};
	
	var KEY_CURRENT_REG = "eXeTC-Current-RegistrationUUID";
	
	return {
		
		localStoragePrefix : "eXeTC-",
		
		/**
		 * The package's TinCan ID is the Activity ID with the launch
		 * element
		 */
		getPackageTinCanID: function(callback) {
			this.getPackageTinCanXML((function(tcXmlDoc) {
				var launchEl = tcXmlDoc.querySelector("launch");
				var packageId = launchEl.parentNode.getAttribute("id");
				callback(null, packageId);
			}).bind(this));
		},
		
		getPackageTinCanXML: function(callback, options) {
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
			this.getPackageTinCanXML((function(xmlDoc) {
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
		
		
		getPkgStateValue: function(key) {
			
		},
		
		getState: function(activityId, registrationUUID, callback) {
			
		}
	};
})();