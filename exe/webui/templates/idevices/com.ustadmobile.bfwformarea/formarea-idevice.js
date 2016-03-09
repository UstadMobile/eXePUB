/**
 * 
 */
var FormAreaIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	if(this._getEl()) {
		this.initFields();
	}
	
	this.textInputCommitTimeouts = {};
};

/**
 * The time (in ms) between the last change and when we will save the
 * state using the state api
 */
FormAreaIdevice.COMMIT_TIMEOUT = 500;



FormAreaIdevice.initTinyMcePlugins = function(){
	
	if(!tinymce.PluginManager.get("bfwformarea")) {
		tinymce.PluginManager.add('bfwformarea', function(editor, url) {
		    // Add a button that opens a window
		    
		    var self;
		    
		    var getIdeviceFn = function() {
		    	var myIdeviceId = $(editor.getBody()).closest(".Idevice").attr("id");
			    myIdeviceId = myIdeviceId.substring(2);//chop off the preceding "id" string
			    var myIdevice = Idevice.getById(myIdeviceId);
			    return myIdevice;
		    };
		    
		    editor.addButton('bfwformarea_insertcheckbox', {
		        text: "Insert Checkbox",
		    	
		        onclick: function() {
		        	var myDevice = getIdeviceFn();
		        	var blockId = myDevice.getNextBlockId();
		        	var checkboxHTML = "<input type='checkbox' data-block-id='" + blockId +"'/>";
		        	editor.insertContent(checkboxHTML);
		        	myDevice._getEl().querySelector("[data-block-id='" + blockId 
		        			+"']").addEventListener("click", myDevice.handleCheckboxClicked.bind(myDevice));
		        }
		    });
		    
		    editor.addButton('bfwformarea_insertlevelbox', {
		        text: "Insert Level Box",
		    	
		        onclick: function() {
		        	var myDevice = getIdeviceFn();
		        	var blockId = myDevice.getNextBlockId();
		        	var levelBoxId = myDevice.ideviceId + "_" + blockId;
		        	var levelBoxHTML = "<img src='exe-files/common/cordaid-level0.png' " +
	        			"id='id" + levelBoxId +"' " +
	        			"data-block-id='" + blockId + "' " +
	        			"class='cordaid-level-box-widget' data-level='0'/>";
		        	editor.insertContent(levelBoxHTML);
		        	LevelBoxWidget.initLevelBox(levelBoxId, {});
		        }
		    });
		    
		    editor.addButton('bfwformarea_inserttextinput', {
		        text: "Insert Text Input Line",
		    	
		        onclick: function() {
		        	var myDevice = getIdeviceFn();
		        	var blockId = myDevice.getNextBlockId();
		        	var checkboxHTML = "<input type='text' data-block-id='" + blockId +"'/>";
		        	editor.insertContent(checkboxHTML);
		        	myDevice._getEl().querySelector("[data-block-id='" + blockId +
		        			"']").el.addEventListener("input", myDevice.handleTextInput.bind(myDevice));
		        }
		    });
		});
	}
	
	
}



FormAreaIdevice.prototype = Object.create(Idevice.prototype, {
	
	onCreate: {
		value : function() {
			var editDiv = $("<div/>", {
				"class" : 'exe',
				'id': "exe_fa_" + this.ideviceId
			});
			
			editDiv.text("Edit Me");
			$(this._getEl()).append(editDiv);
			//this.bindEvents();
		}
	},
	
	initFields: {
		value: function() {
			var i;
			var levelBoxes = this._getEl().querySelectorAll(".cordaid-level-box-widget");
			for(i = 0; i < levelBoxes.length; i++) {
				LevelBoxWidget.initLevelBox(
					levelBoxes[i].id.substring(2)).setOnLevelChange(
							this.handleLevelBoxChanged.bind(this));
			}
			
			var checkboxes = this._getEl().querySelectorAll("input[type='checkbox']");
			for(i = 0; i < checkboxes.length; i++) {
				$(checkboxes[i]).on("click", this.handleCheckboxClicked.bind(this));
			}
			
			var textInputs = this._getEl().querySelectorAll("input[type='text']");
			for(i = 0; i < textInputs.length; i++){
				$(textInputs[i]).on("input", this.handleTextInput.bind(this));
			}
		}
	},
	
	handleTextInput: {
		value: function(evt) {
			var blockId = evt.target.getAttribute("data-block-id");
			if(this.textInputCommitTimeouts[blockId]){
				clearInterval(this.textInputCommitTimeouts[blockId]);
				this.textInputCommitTimeouts[blockId] = null;
			}
			
			this.textInputCommitTimeouts[blockId] = setTimeout((function() {
				this.commitTextInput(blockId);
			}).bind(this), 500);
		}
	},
	
	commitTextInput: {
		value: function(blockId) {
			var stateValues = {};
			var textEl = this._getEl().querySelector("[data-block-id='" + blockId +"']");
			stateValues[blockId] = $(textEl).val();
			this.saveStateValues(stateValues);
		}
	},
	
	handleLevelBoxChanged: {
		value: function(levelBox, level) {
			var stateValues = {};
			var internalId = levelBox.id.substring(levelBox.id.indexOf("_")+1);
			stateValues[internalId] = level;
			this.saveStateValues(stateValues);
		}
	},
	
	handleCheckboxClicked: {
		value: function(evt) {
			var stateValues = {};
			var internalId = evt.target.getAttribute("data-block-id");
			stateValues[internalId] = $(evt.target).is(":checked");
			this.saveStateValues(stateValues);
		}
	},
	
	isStateSupported: {
		value: function() {
			//states are supported but not in authoring mode
			return !eXeEpubCommon.isAuthoringMode();
		}
	},
	
	setState: {
		value: function(state) {
			//set level boxes
			var levelBoxes = this._getEl().querySelectorAll(".cordaid-level-box-widget");
			var itemId, levelBoxId, i;
			for(i = 0; i < levelBoxes.length; i++) {
				itemId = levelBoxes[i].id;
				levelBoxId = itemId.substring(2);
				if(state[itemId]) {
					LevelBoxWidget.getBoxById(levelBoxId).setLevel(state[itemId]);
				}
			}
			
			var blockIdPrefix = "id" + this.ideviceId + "_";
			var checkboxes = this._getEl().querySelectorAll("input[type='checkbox']");
			for(var i = 0; i < checkboxes.length; i++){
				itemId = checkboxes[i].getAttribute("data-block-id");
				if(state[blockIdPrefix + itemId]) {
					checkboxes[i].checked = true;
				}
			}
			
			var textInputs = this._getEl().querySelectorAll("input[type='text']");
			for(var i = 0; i < textInputs.length; i++) {
				itemId = textInputs[i].getAttribute("data-block-id");
				if(state[blockIdPrefix + itemId]) {
					textInputs[i].value = state[blockIdPrefix + itemId]; 
				}
			}
		}
	},
	
	editOn: {
		value:function() {
			FormAreaIdevice.initTinyMcePlugins();
			var tinyMceOpts = eXeEpubTinyMce.getDefaultOptions();
			tinyMceOpts.plugins.push("bfwformarea");
			tinyMceOpts.toolbar = [tinyMceOpts.toolbar, "bfwformarea_insertcheckbox | bfwformarea_insertlevelbox | bfwformarea_inserttextinput"];
			eXeEpubAuthoring.setTinyMceEnabledById('exe_fa_' + this.ideviceId, 
					true, {tinymceopts : tinyMceOpts});
		}
	},
	

	editOff: {
		value: function() {
			eXeEpubAuthoring.setTinyMceEnabledById('exe_fa_' + this.ideviceId, false);
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
		}
	}
	
		
});

FormAreaIdevice.prototype.constructor = FormAreaIdevice;

Idevice.registerType("com.ustadmobile.bfwformarea", FormAreaIdevice);
