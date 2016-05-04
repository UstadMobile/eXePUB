/**
 * 
 */

var InstitutionalProfileIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.availableSources = null;
	this.textAreaCommitTimeouts = {};
};

InstitutionalProfileIdevice.prototype = Object.create(Idevice.prototype, {
	onCreate: {
		value: function() {
			$("#id" + this.ideviceId).load("exe-files/idevices/net.exelearning.institutionalprofile/institutional-profile-template.html .inst-profile-template",
					this.onCreate2.bind(this));
		}
	},
	
	onCreate2: {
		value: function(){
			this.addRow();
		}
	},
	
	addRow: {
		value: function(){
			var blockId = this.getNextBlockId();
			var newRow = $("<tr/>", {
				"class" : "inst-profile-srcrow",
				"data-block-id" : blockId,
				"data-checkbox-src" : "",
			});
			var td1 = $("<td/>", {
				'class' : "inst-profile-labeltd"
			}).text("src");
			newRow.append(td1);
			
			for(var i = 0; i < 2; i++) {
				var cbTd = $("<td/>", {
					"class" : "inst-profile-leveltd"
				});
				newRow.append(cbTd);
			}
			
			$("#id" + this.ideviceId).find(".inst-profile-template tr").last().after(newRow);
		}
	},
	
	editOn: {
		value: function(){
			if(this.availableSources  === null) {
				eXeTinCan.getActivitiesByExtension(
						"http://www.ustadmobile.com/ns/tincan-ext-checkboxtable-parent",
						"true", {}, (function(matchingActivities) {
							this.availableSources = matchingActivities;
							this._editOn2();
						}).bind(this));
			}else{
				this._editOn2();
			}
		}
	},
	
	_editOn2: {
		value: function() {
			this.removeTextboxes();
			var srcRows = $(this._getEl()).find("tr.inst-profile-srcrow:not([data-exe-editing])");
			for(var i = 0; i < srcRows.length; i++) {
				var srcTd = $(srcRows.get(i)).find("td.inst-profile-labeltd");
				var checkBoxSrcId = srcRows.get(i).getAttribute("data-checkbox-src");
				srcTd.empty();
				
				var deleteBtn = $("<img/>",{
					src: "/images/stock-delete.png"
				});
				deleteBtn.on("click", {blockId : srcRows.get(i).getAttribute("data-block-id")},
						this.handleClickDeleteRow.bind(this));
				srcTd.append(deleteBtn);
				
				srcTd.append(eXeEpubAuthoring.activitiesArrToSelectEl(
						this.availableSources, checkBoxSrcId));
				$(srcRows.get(i)).attr("data-exe-editing", "true");
			}
			
			var editBar = $(this._getEl()).find(".exe-editing-bar");
			if(!editBar.length) {
				editBar = $("<div/>", {
					'class' : 'exe-editing-bar exe-editing-only'
				});
				var addRowBtn = $("<button/>").text("Add Row");
				addRowBtn.on("click", this.handleClickAddRow.bind(this));
				editBar.append(addRowBtn);
				
				editBar.append("<div><b>Enter column headers separated by ,</b></div>");
				var inputEl = $("<input/>", {
					"type" : "text"
				}).val($(this._getEl()).find("table").attr("data-textboxes"));
				editBar.append(inputEl);
				
				$(this._getEl()).find("table").after(editBar);
			}
			this.setTinyMceEnabled(true);
		}
	},
	
	editOff: {
		value: function() {
			var srcRows = $(this._getEl()).find("tr.inst-profile-srcrow[data-exe-editing]");
			for(var i = 0; i < srcRows.length; i++) {
				
				var selectedId = $(srcRows.get(i)).find("select").val();
				var selectedText = $(srcRows.get(i)).find("select option:selected").text();
				$(srcRows.get(i)).attr("data-checkbox-src", selectedId);
				$(srcRows.get(i)).find(".inst-profile-labeltd").text(selectedText);
			}
			
			var textBoxes = $(this._getEl()).find(".exe-editing-bar input").val();
			$(this._getEl()).find("table").attr("data-textboxes", textBoxes);
			$(this._getEl()).find("[data-exe-editing]").removeAttr("data-exe-editing");
			$(this._getEl()).find(".exe-editing-only").remove();
			this.addTextboxes();
			this.setTinyMceEnabled(false);
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
		}
	},
	
	getTextInputLabels: {
		value: function() {
			var srcRows = $(this._getEl()).find("tr.inst-profile-srcrow");
			var textboxes = $(this._getEl()).find("table").attr("data-textboxes").split(",");
			for(var i = 0; i < textboxes.length; i++) {
				textboxes[i] = textboxes[i].trim();
			}
			return textboxes;
		}
	},
	
	addTextboxes: {
		value: function() {
			var srcRows = $(this._getEl()).find("tr.inst-profile-srcrow");
			var textboxes = this.getTextInputLabels();
			
			for(var i = 0; i < srcRows.length; i++) {
				var nextRow = $(srcRows.get(i)).next();
				if(!nextRow.hasClass("inst-profile-textbox-tr")) {
					for(var j = textboxes.length-1; j >= 0; j--) {
						var newRow = $("<tr/>", {
							'class' : 'inst-profile-textbox-tr'
						});
						var labelTd = $("<td/>", {
							'class' : 'inst-profile-textbox-label-td'
						}).text(textboxes[j]);
						newRow.append(labelTd);
						
						var boxTd = $("<td/>", {
							'colspan' : '3',
							'class' : 'inst-profile-textbox-textbox-td'
						});
						boxTd.append($("<input/>", {
							'class' : 'inst-profile-textbox-textbox'
						}));
						newRow.append(boxTd);
						
						$(srcRows.get(i)).after(newRow);
					}
				}
			}
		}
	},
	
	removeTextboxes: {
		value: function() {
			$(this._getEl()).find(".inst-profile-textbox-tr").remove();
		}
	},
	
	handleClickAddRow: {
		value: function() {
			this.addRow();
			this._editOn2();
		}
	},
	
	handleClickDeleteRow: {
		value: function(evt) {
			$(this._getEl()).find("[data-block-id=" + evt.data.blockId+"]").remove();
		}
	},
	
	isStateSupported: {
		value: function() {
			return !eXeEpubCommon.isAuthoringMode();
		}
	},
	
	setState: {
		value: function(state){
			var srcRows = $(this._getEl()).find(".inst-profile-srcrow");
			for(var i = 0; i < srcRows.length; i++) {
				this.setRowState(srcRows.get(i), state);
			}
			srcRows.css("display", "none");
		}
	},
	
	handleBoxClicked: {
		value: function(boxWidget, level) {
			//chop of the prefixed idX_ which gives the idevice id
			var internalId = boxWidget.id.substring(boxWidget.id.indexOf("_")+1);
			var boxState = {};
			boxState[internalId] = level;
			this.saveStateValues(boxState);
		}
	},
	
	handleTextAreaInput: {
		value: function(evt) {
			var elId = evt.target.id;
			if(this.textAreaCommitTimeouts[elId]) {
				clearInterval(this.textAreaCommitTimeouts[elId]);
				this.textAreaCommitTimeouts[elId] = null;
			}
			
			this.textAreaCommitTimeouts = setTimeout((function() {
				this.commitTextInput(elId);
			}).bind(this), 500);
		}
	},
	
	commitTextInput: {
		value: function(elId) {
			//chop of the prefixed idX_ which gives the idevice id
			var internalId = elId.substring(elId.indexOf("_")+1);
			var textState = {};
			textState[internalId] = $("#"+elId).val();
			this.saveStateValues(textState);
		}
	},
	
	setRowState: {
		value: function(row, state) {
			var srcId = $(row).attr('data-checkbox-src');
			var textboxInputLabels = this.getTextInputLabels();
			
			CheckboxUtils.getCheckedItemsByCheckedIndex(srcId, 0, (function(checkedItems) {
				var srcIdeviceId = CheckboxUtils.getIdeviceIdFromActivityId(srcId);
				for(var i = 0; i < 2; i++) {
					var next = $(row).next();
					if(next.is(".inst-profile-textbox-tr")) {
						next.remove();
					}else {
						break;
					}
				}
				
				var headerTr = $("<tr/>", {
					'class' : 'inst-profile-data-header'
				});
				$(row).after(headerTr);
				
				var headerTd = $("<td/>", {
					'class' : 'inst-profile-data-header-td'
				}).text($(row).find("td").first().text()).css("font-weight", "bold");
				headerTr.append(headerTd);
				
				
				var dataRow, dataTd, levelTd, levelWidgetId;
				var lastRow = headerTr;
				var baseId = this.ideviceId + "_" + srcIdeviceId;
				
				for(var i = 0; i < checkedItems.length; i++) {
					var labelRow = $("<tr/>", {
						'class' : 'inst-profile-data-label-tr'
					});
					$(lastRow).after(labelRow);
					
					var descTd = $("<td/>", {
						'class' : 'inst-profile-data-label-td'
					}).text(checkedItems[i].desc);
					labelRow.append(descTd);
					for(var j = 0; j < 2; j++) {
						levelWidgetId = baseId + "_" + checkedItems[i].id + "_level_" + j;
						levelTd = $("<td/>");
						labelRow.append(levelTd);
						LevelBoxWidget.initLevelBox(levelWidgetId, {
							container : levelTd.get(0)
						}).setOnLevelChange(this.handleBoxClicked.bind(this));
						
						if(typeof state["id" + levelWidgetId] !== "undefined") {
							LevelBoxWidget.getBoxById(levelWidgetId).setLevel(state["id" + levelWidgetId]);
						}
					}
					
					lastRow = labelRow;
					
					var textTr, textLabelTd, textInputTd, textAreaEl, textElId;
					for(var j = 0; j < textboxInputLabels.length; j++) {
						textTr = $("<tr/>", {
							"class": "inst-profile-data-text-tr"
						});
						lastRow.after(textTr);
						
						textLabelTd = $("<td/>", {
							'class' : 'inst-profile-data-text-label-td'
						}).text(textboxInputLabels[j]);
						textTr.append(textLabelTd);
						
						textInputTd = $("<td/>", {
							'class': 'inst-profile-data-textarea-label-td',
							'colspan' : 2
						});
						textElId = baseId + "_" + checkedItems[i].id + "_text_" + j;
						textAreaEl = $("<textarea/>", {
							cols: 60,
							'class' : 'inst-profile-data-textarea',
							id :  'id' + textElId
						});
						
						if(typeof state["id" + textElId] !== "undefined") {
							textAreaEl.val(state["id" + textElId]);
						}
						
						textAreaEl.on("input", this.handleTextAreaInput.bind(this));
						
						textInputTd.append(textAreaEl);
						textTr.append(textInputTd);
						
						lastRow = textTr;
					}
					
					//lastRow = labelRow;
				}
				
				
				$(row).css("display", "none");
				
				
			}).bind(this));
		}
	},
	
	getState : {
		value: function() {
			var stateVal = {};
			var levelItems = $(this._getEl()).find(".cordaid-level-box-widget");
			var itemId, elId;
			for(var i = 0; i < levelItems.length; i++) {
				elId = $(levelItems.get(i)).attr("id");
				itemId = elId.substring(2);//chop off id prefix
				stateVal[elId] = LevelBoxWidget.getBoxById(itemId).getLevel();
			}
			
			var textItems = $(this._getEl()).find(".inst-profile-data-textarea");
			for(var i = 0; i < textItems.length; i++) {
				elId = $(textItems.get(i)).attr("id");
				stateVal[elId] = $(textItems.get(i)).val(); 
			}
			
			return stateVal;
		}
	}
	
});

InstitutionalProfileIdevice.prototype.constructor = InstitutionalProfileIdevice;

Idevice.registerType("net.exelearning.institutionalprofile", InstitutionalProfileIdevice);

