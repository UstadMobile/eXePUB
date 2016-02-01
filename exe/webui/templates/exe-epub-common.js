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
			Idevice._registeredDevices = new cls(deviceId);
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
        }
        
	};
})();

