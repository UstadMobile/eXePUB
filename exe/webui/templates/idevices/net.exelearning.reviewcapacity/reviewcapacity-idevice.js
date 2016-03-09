
var ReviewCapacityIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.availableSources = null;
	this.enhance();
	this.textAreaCommitTimeouts = {};
}

ReviewCapacityIdevice.prototype = Object.create(Idevice.prototype, {
	onCreate: {
		value: function() {
			$("#id" + this.ideviceId).load("exe-files/idevices/net.exelearning.reviewcapacity/reviewcapacity-template.html .review-capacity-template",
					this.onCreate2.bind(this));
		}
	},
	
	onCreate2: {
		value: function() {
			this.setIdeviceIdAttrs(this._getEl());
			this.addRow();
		}
	},
	
	editOn: {
		value: function(){
			if(this.availableSources === null) {
				eXeTinCan.getActivitiesByExtension(
						"http://www.ustadmobile.com/ns/tincan-ext-checkboxtable-parent",
						"true", {}, (function(matchingActivities) {
							this.availableSources = matchingActivities;
							this.editOn2();
						}).bind(this));
			}else {
				this.editOn2();
			}
		}
	},
	
	editOn2: {
		value: function(){
			this.unEnhance();
			var srcRows = $(this._getEl()).find("tr.review-capacity-srcrow:not([data-exe-editing])");
			for(var i = 0; i < srcRows.length; i++) {
				var srcTd = $(srcRows.get(i)).find("td.review-capacity-td-0");
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
				
				editBar.append("<div><b>Enter row headers separated by ,</b></div>");
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
			var srcRows = $(this._getEl()).find("tr.review-capacity-srcrow[data-exe-editing]");
			for(var i = 0; i < srcRows.length; i++) {
				
				var selectedId = $(srcRows.get(i)).find("select").val();
				var selectedText = $(srcRows.get(i)).find("select option:selected").text();
				$(srcRows.get(i)).attr("data-checkbox-src", selectedId);
				$(srcRows.get(i)).find(".review-capacity-td-0").text(selectedText);
			}
			
			
			var textBoxes = $(this._getEl()).find(".exe-editing-bar input").val();
			$(this._getEl()).find("table").attr("data-textboxes", textBoxes);
			$(this._getEl()).find("[data-exe-editing]").removeAttr("data-exe-editing");
			$(this._getEl()).find(".exe-editing-only").remove();
			
			
			this.setTinyMceEnabled(false);
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
			this.enhance();
		}
	},

	
	addRow: {
		value: function() {
			var blockId = this.getNextBlockId();
			var newRow = $("<tr/>", {
				"class" : "review-capacity-srcrow",
				"data-block-id" : blockId,
				"data-checkbox-src" : ""
			});
			
			for(var i = 0; i < 2; i++) {
				var cbTd = $("<td/>", {
					"class" : "review-capacity-td-" + i
				});
				if(i === 0) {
					cbTd.text("src");
				}
				newRow.append(cbTd);
			}
			
			$("#id" + this.ideviceId).find(".review-capacity-template tr").last().after(newRow);
		}
	},
	
	enhance: {
		value: function(container, selector, handleEvents, state, checkedItemId) {
			container = typeof container !== "undefined" ? container : this._getEl();
			selector = typeof selector !== "undefined" ? selector : "tr.review-capacity-srcrow";
			checkedItemId = checkedItemId ? checkedItemId : "";
			
			var srcRows = $(container);
			if(selector) {
				srcRows = srcRows.find("tr.review-capacity-srcrow");
			}
			if(srcRows.length === 0) {
				return;//idevice is not actually ready yet
			}
			
			var textboxes = $(this._getEl()).find("table").attr("data-textboxes").split(",");
			var i;
			var j;
			var k;
			
			for(i = 0; i < textboxes.length; i++) {
				textboxes[i] = textboxes[i].trim();
			}
			
			for(i = 0; i < srcRows.length; i++) {
				var rightTable = $("<table/>", {
					'class' : 'review-capacity-side-table'
				});
				
				rightTable.append("<tr><td>&#160;</td><td>Yes</td><td>No</td></tr>");
				for(j = 0; j < textboxes.length; j++) {
					var tr = $("<tr/>", {
						'class' : "review-capacity-side-tr-lead"
					});
					
					tr.append($("<td/>", {
						'class' : "review-capacity-side-td-label"
					}).text(textboxes[j]));
					rightTable.append(tr);
					
					for(var k = 0; k < 2; k++) {
						var td = $("<td/>", {
							'class' : 'review-capacity-td-checkbox'
						});
						
						var inId = "id" + this.ideviceId + "_" + checkedItemId + 
							"_" + i + "_cb" + j + "_" + k;
						td.append($("<label/>", {
							'for' : inId
						}).text(" "));
						
						var inputEl = $("<input/>", {
							'type' : 'checkbox',
							'value' : ""+k,
							'class' : 'review-capacity-checkbox',
							'id' : inId,
							'name' : inId
						}); 
						
						if(state && state[inId]) {
							inputEl.prop("checked", state[inId]);
							var textAreaId = inId + "_text";
							var text = state[textAreaId] ? state[textAreaId] : "";
							this.addTextInputRow(tr, text, textAreaId);
						}
						
						td.append(inputEl);
						
						if(handleEvents) {
							inputEl.on("click", this.handleCheckboxClick.bind(this));
						}
						
						tr.append(td);
					}
					
				}
				
				$(srcRows.get(i)).find(".review-capacity-td-1").empty().append(rightTable);
			}
		}
	},
	
	handleCheckboxClick: {
		value: function(evt) {
			var checkboxId = $(evt.delegateTarget).attr("id");
			var textAreaId = checkboxId + "_text";
			var textArea = $("#" + textAreaId);
			
			//if this is the yes checkbox - check for the text area
			if($(evt.delegateTarget).is(":checked") && $(evt.target).val() === "0") {
				if(textArea.length === 0) {
					this.addTextInputRow($(evt.delegateTarget).closest("tr"), "", textAreaId);
				}
			}else {
				$("#"+textAreaId + "_tr").remove();
				//remove it if it exists
			}
			
			//now save the state of the checkbxo
			var stateObj = {};
			var internalId = checkboxId.substring(checkboxId.indexOf("_") +1);
			stateObj[internalId] = $(evt.delegateTarget).is(":checked");
			this.saveStateValues(stateObj);
		}
	},
	
	addTextInputRow: {
		value: function(precedingRow, textVal, id) {
			var textTr = $("<tr/>", {
				'class' : 'review-capacity-side-textarea-tr',
				'id' : id + "_tr"
			});
			precedingRow.after(textTr);
			var textAreaTd = $("<td/>", {
				'class' : "review-capacity-side-textarea-td",
				'colspan' : 3
			});
			textTr.append(textAreaTd);
			
			var textArea = $("<textarea/>", {
				'class' : 'review-capacity-side-textarea',
				'id' : id
			});
			textArea.val(textVal);
			textAreaTd.append(textArea);
			textArea.on("input", this.handleTextAreaInput.bind(this));
		}
	},
	
	handleTextAreaInput: {
		value: function(evt) {
			var id = evt.target.id;
			if(this.textAreaCommitTimeouts[id]) {
				clearInterval(this.textAreaCommitTimeouts[id]);
				this.textAreaCommitTimeouts[id] = null;
			}
			
			this.textAreaCommitTimeouts[id] = setTimeout((function() {
				this.commitTextAreaInput(id);
			}).bind(this), 500);
		}
	},
	
	commitTextAreaInput: {
		value: function(id) {
			var stateVal = {};
			var internalId = id.substring(id.indexOf("_")+1);
			stateVal[internalId] = $("#"+id).val();
			this.saveStateValues(stateVal);
		}
	},
	
	unEnhance: {
		value: function() {
			$(this._getEl()).find(".review-capacity-side-table").remove();
		}
	},
	
	handleClickDeleteRow: {
		value: function(evt) {
			this.deleteBlockId(evt.data.blockId);
		}
	},
	
	handleClickAddRow: {
		value: function() {
			this.addRow();
			this.editOn2();
		}
	},
	

	isStateSupported: {
		value: function() {
			return !eXeEpubCommon.isAuthoringMode();
		}
	},
	

	setState: {
		value: function(state) {
			//find out what we are looking for
			this.unEnhance();
			var rows = $("#id" + this.ideviceId).find(".review-capacity-srcrow");
			for(var i = 0; i < rows.length; i++) {
				this.setRowState(rows.get(i), state, i);
			}
		}
	},
	
	setRowState: {
		value: function(row, state, index) {
			var srcId = $(row).attr("data-checkbox-src");
			CheckboxUtils.getCheckedItemsByCheckedIndex(srcId, 0, (function(checkedItems) {
				var srcIdeviceId = CheckboxUtils.getIdeviceIdFromActivityId(srcId);
				
				var headerTr = $("<tr/>", {
					"class" : "review-capacity-datarow-header-tr"
				});
				$(row).after(headerTr);
				var headerTd = $("<td/>", {
					'class' : 'review-capacity-datarow-header-td'
				}).text($(row).text()).css("font-weight", "bold");
				headerTr.append(headerTd);
				
				var dataRow, dataTd, rightTd, levelWidgetId;
				var lastRow = headerTr;
				var baseId = this.ideviceId + "_" + srcIdeviceId;
				
				for(var i = 0; i < checkedItems.length; i++) {
					dataRow = $("<tr/>", {
						'class' : "review-capacity-datarow-tr"
					});
					lastRow.after(dataRow);
					dataTd = $("<td/>", {
						'class' : 'review-capacity-datarow-labeltd',
						'valign' : 'top'
					});
					dataTd.text(checkedItems[i].desc);
					dataRow.append(dataTd);
					rightTd = $("<td/>", {
						'class' : 'review-capacity-td-1'
					});
					dataRow.append(rightTd);
					this.enhance(dataRow[0], null, true, state, checkedItems[i].id);
					
					lastRow = dataRow;
				}
				$(row).css("display", "none");
				
			}).bind(this));
			
		}
	}
});

ReviewCapacityIdevice.prototype.constructor = ReviewCapacityIdevice;

Idevice.registerType("net.exelearning.reviewcapacity", ReviewCapacityIdevice);
