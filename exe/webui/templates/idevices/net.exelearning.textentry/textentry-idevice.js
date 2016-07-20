/**
 * 
 */
var TextEntryIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	var textArea = this.getTextArea();
	this._handleChangeBound = this.handleChange.bind(this);
	
	if(textArea) {
		textArea.value = textArea.value.trim();
		
		//make it readonly when shown in eXeLearning authoring page before editing mode goes on
		var authoringMode = eXeEpubCommon.getQueryVars()['exe-authoring-mode'];
		if(typeof authoringMode === "string" && authoringMode === "true") {
			textArea.setAttribute("readonly", "readonly");
		}
		
		this.bindEvents();
		window.addEventListener("blur", this.handleWindowBlur.bind(this));
	}
	
	this.timeLastChanged = -1;
	
	this.checkChangeTimeout = null;
};

/**
 * The time (in ms) between the last change and when we will save the
 * state using the state api
 */
TextEntryIdevice.COMMIT_TIMEOUT = 500;

TextEntryIdevice.TEXT_EL_PREFIX = "exe_tei_textel_";


TextEntryIdevice.prototype = Object.create(Idevice.prototype, {
	getTextArea: {
		value: function() {
			return document.getElementById(TextEntryIdevice.TEXT_EL_PREFIX  + this.ideviceId) || 
				this._getEl().querySelector("textarea");
		}
	},
	
	isStateSupported: {
		value: function() {
			//states are supported but not in authoring mode
			return !eXeEpubCommon.isAuthoringMode();
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
				readonly : 'readonly',
				id: ""
			});
			
			entryHolder.append(introText);
			entryHolder.append(textEntryArea);
			$(this._getEl()).append(entryHolder);
			this.bindEvents();
		}
	},
	
	bindEvents: {
		value: function() {
			$(this.getTextArea()).off("input", this._handleChangeBound);
			$(this.getTextArea()).on("input", this._handleChangeBound);
		}
	},
	
	isDirty: {
		/**
		 * Marks whether or not the value has changed since the last statement was made to the LRS
		 */
		value: function() {
			return this.getTextArea().hasAttribute("data-dirty");
		}
	},
	
	handleChange: {
		value: function(evt) {
			if(this.checkChangeTimeout) {
				clearTimeout(this.checkChangeTimeout);
				this.checkChangeTimeout = null;
			}
			
			this.checkChangeTimeout = setTimeout(this.commitChange.bind(this), 
					TextEntryIdevice.COMMIT_TIMEOUT);
			this.getTextArea().setAttribute("data-dirty", "true");
		}
	},
	
	handleWindowBlur : {
		value: function(evt) {
			if(this.isDirty()) {
				this.makeAnsweredStmt({}, function() {console.log("window blur: stmt made")});
			}
		}
	},
	
	handleBeforeUnload: {
		value: function() {
			debugger;
			if(this.isDirty()) {
				this.makeAnsweredStmt({}, null);//make the answered statement synchronously
			}
		}
	},
	
	makeAnsweredStmt: {
		/**
		 * @param {Object} opts 
		 * @param {function} opts.callback : callback function.  If not provided / null - send statement synchronously
		 */
		value: function(opts, callback) {
			var stmtOpts = {
				result: {
					response: $(this.getTextArea()).val()
				}
			};
			
			var stmt = eXeTinCan.makeAnsweredStmt(eXeTinCan.getPackageId() + 
				"/" + eXeTinCan.getCurrentItemId() + "/" + this.ideviceId, 
				stmtOpts);
			if(typeof callback === "function") {
				eXeTinCan.sendStatement(stmt, opts, (function(sendErr, results) {
					this.getTextArea().removeAttribute("data-dirty");
					callback.apply(opts.context ? opts.context : this, sendErr, results);
				}).bind(this));
			}
			
		}
	},
	
	commitChange: {
		value: function() {
			if(!eXeEpubCommon.isAuthoringMode()) {
				eXeTinCan.setPkgStateValue("id"+this.ideviceId, {
					response: $(this.getTextArea()).val()
				});
			}
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
			
			var elTypeSelect = $("<select id='tei_" + this.ideviceId +"'/>");
			elTypeSelect.append("<option value='textarea'>Multi Line</option>");
			elTypeSelect.append("<option value='input'>Single Line</option>");
			elTypeSelect.val(this.getTextArea().tagName);
					
			editBar.append(elTypeSelect);
			elTypeSelect.on("change", this.handleChangeEntryType.bind(this));
			
			var textAreaBarSect = $("<div/>", {
				'class' : 'tei-textarea-bar-textarea'
			});
			
			textAreaBarSect.append("Rows: ").append($("<input/>", {
				value: numRows,
				'type' : 'text',
				'class' : 'exe-tei-numrows',
				'id' : 'exe_tei_r' + this.ideviceId,
				size : 4,
				maxlength: 4
			}));
			
			textAreaBarSect.append("Cols: ").append($("<input/>", {
				value: numCols,
				'type' : 'text',
				'id' : 'exe_tei_c' + this.ideviceId,
				'class' : 'exe-tei-numcols',
				size : 4,
				maxlength: 4
			}));
			
			editBar.append(textAreaBarSect);
			
			var inputElBar = $("<div/>", {
				'class' : "tei-textarea-bar-input"
			});
			
			var inputTypeSelect = $("<select/>", {
				"id" : "tei_type_" + this.ideviceId 
			});
			
			inputTypeSelect.append("<option value='text'>Text</option>");
			inputTypeSelect.append("<option value='number'>Number</option>");
			inputTypeSelect.on("change", this.handleChangeInputType.bind(this));
			inputElBar.append(inputTypeSelect);
			
			editBar.append(inputElBar);
			
			$(this._getEl()).append(editBar);
			
			
			var currentMode = textArea[0].hasAttribute("placeholder") ? "placeholder" : "textvalue";
			
			var selectDefTextType = $("<select/>", {
				'class' : 'exe-tei-select-default-type'
			});
			selectDefTextType.append("<option value='placeholder'>Placeholder</option>");
			selectDefTextType.append("<option value='textvalue'>Normal Text</option>");
			selectDefTextType.val(currentMode);
			editBar.append("Default Text Type").append(selectDefTextType);
			textArea.removeAttr("readonly");
			
			/*
			 * In order to enable free editing of the placeholder / default value text
			 * we need to change this into a text type field for the time during which
			 * it's being edited, so save the actual type value into data-type
			 */
			if(this.getTextArea().tagName === "input") {
				textArea.attr("data-type", textArea.attr("type"));
				textArea.attr("type", "text");
			}
			
			if(currentMode === "placeholder") {
				textArea.val(textArea.attr("placeholder"));
			}
			
			this.updateEditEntryTypeOpts(this.getTextArea().tagName);
			
			eXeEpubAuthoring.setTinyMceEnabledById('exe_tei_int' + this.ideviceId, true);
		}
	},
	
	handleChangeEntryType: {
		value: function(evt) {
			this.updateEditEntryTypeOpts($(evt.target).val());
		}
	},
	
	handleChangeInputType: {
		value: function(evt) {
			this.setInputType($(evt.target).val());
		}
	},
	
	setInputType: {
		value: function(inputType) {
			this.getTextArea().setAttribute("data-type", inputType);
		}
	},
	
	/**
	 * Update whether users see options for a single line or multi line field
	 */
	updateEditEntryTypeOpts: {
		value: function(editType) {
			var textEl = this.getTextArea();
			
			if(textEl.tagName !== editType) {
				var defValType = $(this._getEl()).find(".exe-tei-select-default-type").val();
				var newEl = $("<" + editType +"/>").attr("id",
						TextEntryIdevice.TEXT_EL_PREFIX  + this.ideviceId);
				
				if(editType === "textarea") {
					newEl.attr("rows", 5).attr("cols", 72);
				}else {
					newEl.attr("type", "text");
				}
				
				newEl.val($(textEl).val());
				
				$(textEl).replaceWith(newEl);
				textEl = newEl[0];
			}
			
			if(editType === "textarea") {
				$(this._getEl()).find(".tei-textarea-bar-textarea").show();
				$(this._getEl()).find(".tei-textarea-bar-input").hide();
			}else {
				$(this._getEl()).find(".tei-textarea-bar-textarea").hide();
				$(this._getEl()).find(".tei-textarea-bar-input").show();
				
				//set the type that's been selected
				$("#tei_type_" + this.ideviceId).val(textEl.getAttribute("data-type"));
			}
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
			
			if(this.getTextArea().tagName === "input") {
				textArea.attr("type", textArea.attr("data-type"));
				textArea.removeAttr("data-type");
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
	
	setState: {
		value: function(state) {
			if(state && state['id'+ this.ideviceId]) {
				this.getTextArea().value = state['id' + this.ideviceId].response;
			}
		}
	}
	
});

TextEntryIdevice.prototype.constructor = TextEntryIdevice;

Idevice.registerType("net.exelearning.textentry", TextEntryIdevice);
