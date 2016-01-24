/**
 * 
 */

var TinCanRegistrationIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
};

TinCanRegistrationIdevice.prototype = {
	
	create: function() {
		var buttonEl = document.createElement("button");
		buttonEl.setAttribute("id", "exe-tincan-reg-startbutton-" + this.ideviceId);
		buttonEl.textContent = "Start Record";
		document.getElementById("id" + this.ideviceId).appendChild(buttonEl);
		this.bindEvents();
	},
	
	bindEvents: function() {
		this._getStartButtonEl().addEventListener("click", this.handleClick.bind(this));
	},
	
	_getStartButtonEl: function() {
		return document.getElementById("exe-tincan-reg-startbutton-" + this.ideviceId);
	},
	
	editOn: function() {
		var buttonEl = this._getStartButtonEl();
		var editEl = document.createElement("div");
		editEl.setAttribute("id", "exe-tincanreg-edit-" + this.ideviceId);
		editEl.innerHTML = "Button Text:<br/>";
		var inputEl = document.createElement("input");
		inputEl.value = buttonEl.textContent.trim();
		inputEl.setAttribute("id", "exe-tincan-reg-text-" + this.ideviceId);
		editEl.appendChild(inputEl);
		buttonEl.style.display = "none";
		document.getElementById("id" + this.ideviceId).appendChild(editEl);
	},
	
	editOff: function() {
		var editEl = document.getElementById("exe-tincanreg-edit-" + this.ideviceId);
		var buttonEl = this._getStartButtonEl();
		buttonEl.textContent = document.getElementById("exe-tincan-reg-text-" + this.ideviceId).value;
		editEl.parentNode.removeChild(editEl);
		buttonEl.style.display = "";
		eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, 
				document.getElementById("id"+ this.ideviceId).innerHTML);
	},
	
	handleClick: function(evt) {
		eXeTinCan.getPackageTinCanID(function(err, tinCanID) {
			eXeTinCan.startRegistration(tinCanID, function(err, status){
				alert("New Registration Opened");
			});
		});
	}
};


(function() {
	var _regIdevices = {};
	
	var _initFn = function() {
		var allIdevices = document.querySelectorAll("div[data-idevice-type='net.exelearning.tincanregistration']");
		var deviceId;
		for(var i = 0; i < allIdevices.length; i++) {
			deviceId = allIdevices[i].getAttribute("id").substring(2);//idevice id attributes are prefixed by the letters 'id'
			_regIdevices[deviceId] = new TinCanRegistrationIdevice(deviceId);
			_regIdevices[deviceId].bindEvents();
		}
	};
	
	if(document.readyState === "interactive" || document.readyState === "complete") {
		_initFn();
	}else {
		document.addEventListener("DOMContentLoaded", _initFn, false);
	}
	
	document.addEventListener("idevicecreate", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.tincanregistration") {
			var targetEl = evt.target || evt.srcElement;
			var ideviceId = evt.detail.ideviceId;
			_regIdevices[ideviceId] = new TinCanRegistrationIdevice(ideviceId);
			_regIdevices[ideviceId].create();
		}
	}, false);
	
	document.addEventListener("ideviceediton", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.tincanregistration") {
			var ideviceId = evt.detail.ideviceId;
			if(!_regIdevices[ideviceId]) {
				_regIdevices[ideviceId] = new TinCanRegistrationIdevice(ideviceId);
			}
			
			_regIdevices[evt.detail.ideviceId].editOn();
		}
	}, false);
	
	document.addEventListener("ideviceeditoff", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.tincanregistration") {
			_regIdevices[evt.detail.ideviceId].editOff();
		}
	});
})();
