/**
 * 
 */
var TextEntryIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	var textArea = this.getTextArea();
	
	if(textArea) {
		textArea.value = textArea.value.trim();
		
		//make it readonly when shown in eXeLearning authoring page before editing mode goes on
		var authoringMode = eXeEpubCommon.getQueryVars()['exe-authoring-mode'];
		if(typeof authoringMode === "string" && authoringMode === "true") {
			textArea.setAttribute("readonly", "readonly");
		}else {
			eXeTinCan.getPkgStateValue("id" + this.ideviceId, function(keyVal) {
				if(keyVal) {
					textArea.value = keyVal.response;
				}
			}, {});
		}
	}
	
	
};

TextEntryIdevice.prototype = Object.create(Idevice.prototype, {
	getTextArea: {
		value: function() {
			return this._getEl().querySelector("textarea");
		}
	},
	
	onCreate: {
		value : function() {
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
			
		}
	},
	
	editOn: {
		value:function() {
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
		}
	},
	

	editOff: {
		value: function() {
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
			
			//readonly should be removed for saving purposes
			textArea.removeAttr("readonly");
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
			
			textArea.attr("readonly", "readonly");
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
			this.saveTinCan(this.makeTinCanActivities());
		}
	},
	
	makeTinCanActivities: {
		value: function() {
			var ns = eXeEpubAuthoring.NS_TINCAN;
			var xmlDoc = document.implementation.createDocument(ns, "activities");
			var activityEl = xmlDoc.createElementNS(ns, "activity");
			activityEl.setAttribute("id", this.ideviceId);
			eXeTinCan.appendLangElements(activityEl,
				["name", "description"], "en", 
				$("#exe_tei_int" + this.ideviceId).text());
			eXeTinCan.appendInteractionType(activityEl, "fill-in");
			xmlDoc.documentElement.appendChild(activityEl);
			return xmlDoc;
		}
	},
	
	saveState: {
		value: function() {
			console.log("textentry: savestate");
			eXeTinCan.setPkgStateValue("id" + this.ideviceId, {
				'response' : $(this.getTextArea()).val()
			});
		}
	}
});

TextEntryIdevice.prototype.constructor = TextEntryIdevice;

Idevice.registerType("net.exelearning.textentry", TextEntryIdevice);
