/**
 * 
 */

var CheckboxLevelReviewIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.availableSources = null;
};

CheckboxLevelReviewIdevice.prototype = Object.create(Idevice.prototype, {
	
	onCreate: {
		value: function() {
			$("#id" + this.ideviceId).append($("<table/>", {
				'class' : 'checkboxlevelreview-template',
				'data-box-type' : 'Checkbox',
				'data-show-text' : 'true',
				'data-add-text' : 'true'
			}));
			
			var headerRow = $("<tr/>", {
				'class' : 'checkboxlevel-header-row'
			});
			//spacer that aligns with the first column with text
			headerRow.append("<td> </td>");
			$(this._getTable()).append(headerRow);
			
			this.addRow();
			this.addCol();
		}
	},
	
	_getTable: {
		value: function() {
			return this._getEl().querySelector("table.checkboxlevelreview-template");
		}
	},
	
	addRow: {
		value: function() {
			var blockId = this.getNextBlockId();
			var newRow = $("<tr/>", {
				"class" : "checkboxlevel-srcrow",
				"data-block-id" : blockId,
				"data-checkbox-src" : ""
			});
			
			for(var i = 0; i < 2; i++) {
				var cbTd = $("<td/>", {
					"class" : "checkbox-level-review-td-" + i
				});
				if(i === 0) {
					cbTd.text("src");
				}
				newRow.append(cbTd);
			}
			
			$("#id" + this.ideviceId).find(".checkboxlevelreview-template").append(newRow);
		}
	},
	
	addCol: {
		value: function() {
			//add the header row
			var blockId = this.getNextBlockId();
			var headerTd = $("<td/>", {
				'class' : 'checkboxlevel-col-header-td',
				'data-block-id' : blockId
			});
			
			var headerDiv = $("<div/>", {
				'class': 'checkboxlevel-col-header-div exe-editable',
				'id' : 'cblr_ch_' + this.ideviceId + "_" + blockId
			}).text("header").appendTo(headerTd);
			$(this._getTable()).find(".checkboxlevel-header-row").append(headerTd);
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
			var srcRows = $(this._getEl()).find("tr.checkboxlevel-srcrow:not([data-exe-editing])");
			for(var i = 0; i < srcRows.length; i++) {
				var srcTd = $(srcRows.get(i)).find("td.checkbox-level-review-td-0");
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
			
			var headerCols = $(this._getEl()).find("td.checkboxlevel-col-header-td:not([data-exe-editing])");
			for(var i = 0; i < headerCols.length; i++) {
				var deleteBtn = $("<img/>",{
					src: "/images/stock-delete.png",
					'class' : 'exe-editing-only'
				});
				deleteBtn.on("click", {blockId : headerCols.get(i).getAttribute("data-block-id")},
						this.handleClickDeleteRow.bind(this));
				$(headerCols.get(i)).prepend(deleteBtn);
				$(headerCols.get(i)).attr("data-exe-editing", "true");
			}
			
			var editBar = $(this._getEl()).find(".exe-editing-bar");
			
			if(!editBar.length) {
				editBar = $("<div/>", {
					'class' : 'exe-editing-bar exe-editing-only'
				});
				var addRowBtn = $("<button/>").text("Add Row");
				addRowBtn.on("click", this.handleClickAddRow.bind(this));
				editBar.append(addRowBtn);
				
				var addColBtn = $("<button/>").text("Add Col");
				addColBtn.on("click", this.handleClickAddCol.bind(this));
				editBar.append(addColBtn);
				
				
				editBar.append("<div><b>Box Type:</b></div>");
				var boxTypeSelect = $("<select/>", {
					'id' : 'cblr_bts_' + this.ideviceId,
					'class' : 'review-capacity-boxtype-select'
				});
				
				var currentBoxType = $(this._getTable()).attr("data-box-type");
				var boxTypes = ['Checkbox', 'Level'];
				var optionEl;
				for(var i = 0; i < boxTypes.length; i++) {
					optionEl = $("<option/>", {
						'value' : boxTypes[i]
					}).text(boxTypes[i]);
					
					if(currentBoxType === boxTypes[i]) {
						optionEl.attr('selected', "selected");
					}
					boxTypeSelect.append(optionEl);
				}
				
				editBar.append(boxTypeSelect);
				editBar.append("<br/>");
				
				//controls to enable/disable showing text associated with checkbox entry
				var showTextInputEl = $("<input/>", {
					"id": "cblr_st_" + this.ideviceId,
					'type' : 'checkbox'
				});
				if($(this._getTable()).attr('data-show-text') === "true") {
					showTextInputEl.attr('checked', 'checked');
				}
				
				editBar.append(showTextInputEl);
				var showTextLabelEl = $("<label/>", {
					"for": "cblr_" + this.ideviceId
				}).text("Show text entered (if any)");
				editBar.append(showTextLabelEl);
				editBar.append("<br/>");
				
				//controls to enable/disable adding additional text
				var addTextInputEl = $("<input/>", {
					"id" : "cblr_at_" + this.ideviceId,
					'type' : 'checkbox'
				});
				if($(this._getTable()).attr('data-add-text') === "true") {
					addTextInputEl.attr('checked', 'checked');
				}
				
				editBar.append(addTextInputEl);
				
				
				var addTextLabelEl = $("<label/>", {
					"for" : "cblr_at_" + this.ideviceId
				}).text("Show additional text box to fill in");
				editBar.append(addTextLabelEl);
				
				$(this._getEl()).find("table").after(editBar);
			}
			
			this.setTinyMceEnabled(true);
		}
	},
	
	editOff: {
		value: function() {
			var srcRows = $(this._getEl()).find("tr.checkboxlevel-srcrow[data-exe-editing]");
			for(var i = 0; i < srcRows.length; i++) {
				
				var selectedId = $(srcRows.get(i)).find("select").val();
				var selectedText = $(srcRows.get(i)).find("select option:selected").text();
				$(srcRows.get(i)).attr("data-checkbox-src", selectedId);
				$(srcRows.get(i)).find("td.checkbox-level-review-td-0").text(selectedText);
			}
			
			$(this._getTable()).attr('data-show-text',
				$("#cblr_st_" + this.ideviceId).is(':checked') ? "true" : "false");
			
			$(this._getTable()).attr('data-add-text',
					$("#cblr_at_" + this.ideviceId).is(':checked') ? "true" : "false");
			
			$(this._getTable()).attr("data-box-type", 
					$(this._getEl()).find("#cblr_bts_" + this.ideviceId).val());
			
			$(this._getEl()).find("[data-exe-editing]").removeAttr("data-exe-editing");
			$(this._getEl()).find(".exe-editing-only").remove();
			this.setTinyMceEnabled(false);
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
			this.setTinyMceEnabled(false);
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
	
	handleClickAddCol: {
		value : function() {
			this.addCol();
			this.editOn2();
		}
	}
		
});

CheckboxLevelReviewIdevice.prototype.constructor = CheckboxLevelReviewIdevice;

Idevice.registerType("net.exelearning.checkboxlevelreview", CheckboxLevelReviewIdevice);

