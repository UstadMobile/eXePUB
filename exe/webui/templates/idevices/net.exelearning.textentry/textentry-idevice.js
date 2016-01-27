/**
 * 
 */
var TextEntryIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	var textArea = this.getTextArea();
	if(textArea) {
		//make it readonly when shown in eXeLearning authoring page before editing mode goes on
		textArea.setAttribute("readonly", "readonly");
		if(textArea.hasAttribute("placeholder")) {
			textArea.innerHTML = "";
		}else {
			textArea.value = textArea.value.trim();
		}
	}
};

TextEntryIdevice.prototype = {
		
	getTextArea: function() {
		return this._getEl().querySelector("textarea");
	},
		
	_getEl: function() {
		return document.getElementById("id" + this.ideviceId);
	},
	
	create: function() {
		var introText = $("<div/>", {
			"class" : 'exe-tei-intro',
			'id': "exe_tei_int" + this.ideviceId
		});
		introText.text("Explanation Text Here");
		
		var entryHolder = $("<div/>", {
			'class' : 'exe-tei-h',
			'id' : 'exe_tei_' + this.ideviceId
		});
		
		var textEntryArea = $("<textarea/>", {
			rows: 5,
			cols: 72,
			readonly : 'readonly'
		});
		
		entryHolder.append(introText);
		entryHolder.append(textEntryArea);
		$(this._getEl()).append(entryHolder);
		
	},
	
	editOn: function() {
		var editBar = $("<div/>", {
			'class' : 'exe-editing-only exe-tei-editbar'
		});
		
		var textArea = $(this.getTextArea());
		var numCols = textArea.attr("cols");
		var numRows = textArea.attr("rows");
		
		editBar.append("Rows: ").append($("<input/>", {
			value: numRows,
			'type' : 'text',
			'class' : 'exe-tei-numrows',
			'id' : 'exe_tei_r' + this.ideviceId,
			size : 4,
			maxlength: 4
		}));
		
		editBar.append("Cols: ").append($("<input/>", {
			value: numCols,
			'type' : 'text',
			'id' : 'exe_tei_c' + this.ideviceId,
			'class' : 'exe-tei-numcols',
			size : 4,
			maxlength: 4
		}));
		
		$(this._getEl()).append(editBar);
		
		
		var currentMode = textArea[0].hasAttribute("placeholder") ? "placeholder" : "textvalue";
		
		if(currentMode === "placeholder") {
			textArea.val(textArea.attr("placeholder"));
		}
		
		var selectDefTextType = $("<select/>", {
			'class' : 'exe-tei-select-default-type'
		});
		selectDefTextType.append("<option value='placeholder'>Placeholder</option>");
		selectDefTextType.append("<option value='textvalue'>Normal Text</option>");
		selectDefTextType.val(currentMode);
		editBar.append("Default Text Type").append(selectDefTextType);
		textArea.removeAttr("readonly");
		
		eXeEpubAuthoring.setTinyMceEnabledById('exe_tei_int' + this.ideviceId, true);
	},
	
	editOff: function() {
		var textArea = $(this.getTextArea());
		var defType = $(this._getEl()).find(".exe-tei-select-default-type").val();
		if(defType === "placeholder") {
			textArea.attr("placeholder", textArea.val());
			textArea.val("");
		}else if(textArea[0].hasAttribute("placeholder")){
			textArea.removeAttr("placeholder");
		}
		
		textArea.attr("rows", $(this._getEl()).find(".exe-tei-numrows").val());
		textArea.attr("cols", $(this._getEl()).find(".exe-tei-numcols").val());
		
		$(this._getEl()).find(".exe-editing-only").remove();
		
		eXeEpubAuthoring.setTinyMceEnabledById('exe_tei_int' + this.ideviceId, false);
		
		
		var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
		textArea.attr("readonly", "readonly");
		eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
	}
};



(function() {
	var _idevices = {};
	
	var _initFn = function() {
		var allIdevices = document.querySelectorAll("div[data-idevice-type='net.exelearning.textentry']");
		var deviceId;
		for(var i = 0; i < allIdevices.length; i++) {
			deviceId = allIdevices[i].getAttribute("id").substring(2);//idevice id attributes are prefixed by the letters 'id'
			_idevices[deviceId] = new TextEntryIdevice(deviceId);
		}
	};
	
	if(document.readyState === "interactive" || document.readyState === "complete") {
		_initFn();
	}else {
		document.addEventListener("DOMContentLoaded", _initFn, false);
	}
	
	document.addEventListener("idevicecreate", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.textentry") {
			var targetEl = evt.target || evt.srcElement;
			var ideviceId = evt.detail.ideviceId;
			_idevices[ideviceId] = new TextEntryIdevice(ideviceId);
			_idevices[ideviceId].create();
		}
	}, false);
	
	document.addEventListener("ideviceediton", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.textentry") {
			var ideviceId = evt.detail.ideviceId;
			if(!_idevices[ideviceId]) {
				_idevices[ideviceId] = new TextEntryIdevice(ideviceId);
			}
			
			_idevices[evt.detail.ideviceId].editOn();
		}
	}, false);
	
	document.addEventListener("ideviceeditoff", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.textentry") {
			_idevices[evt.detail.ideviceId].editOff();
		}
	});
})();
