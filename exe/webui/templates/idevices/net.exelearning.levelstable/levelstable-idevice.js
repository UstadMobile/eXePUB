
var LevelsTableIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	this.availableCheckboxActivities = null;
	this.handleClickLevelBound = this.handleClickLevel.bind(this);
	this.bindEvents();
};


LevelsTableIdevice.prototype = Object.create(Idevice.prototype, {
	onCreate: {
		value: function() {
			$("#id" + this.ideviceId).load("exe-files/idevices/net.exelearning.levelstable/levelstable-template.html .levels-table-template",
					 this.bindEvents.bind(this));
			 
		},
	},
	
	handleClickLevel: {
		value : function(evt) {
			var tdEl = evt.delegateTarget;
			var currentLevel = parseInt($(tdEl).attr('data-level'));
			currentLevel += 1;
			if(currentLevel > 2) {
				currentLevel = 0;
			}
			$(tdEl).attr('data-level', ""+currentLevel);
		}
	},
	
	bindEvents: {
		value : function() {
			$(".levels-box").off("click", this.handleClickLevelBound);
			$(".levels-box").on("click", this.handleClickLevelBound);
		}
	},
	
	editOn: {
		value: function() {
			if(this.availableCheckboxActivities === null) {
				eXeTinCan.getActivitiesByExtension(
					"http://www.ustadmobile.com/ns/tincan-ext-checkboxtable-parent",
					"true", {}, (function(matchingActivities) {
						this.availableCheckboxActivities = matchingActivities;
						this._editOn2();
					}).bind(this));
			}else {
				this._editOn2();
			}
		}
	},
	
	_addRow: {
		value: function() {
			var newRow = $("<tr/>", {
				'class': 'levels-table-template'
			});
			var newTd = $("<td class='levels-table-sourcerow'>&#160;</td>");
			newRow.append(newTd);
			for(var i = 0; i < 6; i++) {
				newRow.append("<td class='levels-box' data-level='0'>&#160;</td>");
			}
			
			$("#id" + this.ideviceId).find(".levels-table-template tr").last().after(newRow);
			this._editOnRow(newTd);
		}
	},
	
	_editOn2: {
		value: function() {
			var levelRows = $("#id" + this.ideviceId).find(".levels-table-sourcerow");
			for(var i = 0; i < levelRows.length; i++) {
				this._editOnRow(levelRows[i]);
			}
			
			var btnHolder = $("<div/>", {
				'class' : 'exe-editing-only'
			});
			var addSrcBtn = $("<button/>").text("Add Source");
			addSrcBtn.on("click", this._addRow.bind(this));
			btnHolder.append(addSrcBtn);
			
			$("#id" + this.ideviceId).find(".levels-table-template").last().after(btnHolder);
		}
	},
	
	_editOnRow: {
		value: function(row) {
			var rowEditor = $("<div/>", {
				'class' : "exe-editing-only"
			});
			
			var selectSrc = $("<select/>", {
				'class' : 'levels-table-selectsrc'
			});
			
			$(rowEditor).append(
					eXeEpubAuthoring.activitiesArrToSelectEl(
							this.availableCheckboxActivities, 
							$(row).attr("data-src-checkbox-table")));
			
			$(rowEditor).append("Filter column:");
			
			var columnFilterIn = $("<input/>", {
				"size" : '2',
				'style' : 'width: 30px'
			}).css("width", "30px");
			if($(row)[0].hasAttribute("data-filter-col")) {
				columnFilterIn.val($(row).attr("data-filter-col"));
			}
			
			$(rowEditor).append(columnFilterIn);
			
			var deleteImg = $("<img/>", {
				"src" : "/images/stock-delete.png"
			});
			
			deleteImg.on("click", this._handleClickDeleteRow.bind(this));
			rowEditor.prepend(deleteImg);
			
			$(row).append(rowEditor);
		}
	},
	
	_handleClickDeleteRow: {
		value: function(evt) {
			$(evt.delegateTarget).closest("tr").remove();
		}
	},
	
	editOff: {
		value: function() {
			
			var levelRows = $("#id" + this.ideviceId).find(".levels-table-sourcerow");
			for(var i = 0; i < levelRows.length; i++) {
				var filterCol = $(levelRows[i]).find("input").val();
				$(levelRows[i]).attr("data-filter-col", filterCol);
				var dataSrc= $(levelRows[i]).find("select").val();
				$(levelRows[i]).attr("data-src-checkbox-table", dataSrc);
				$(levelRows[i]).text("Checked items from: " + 
						$(levelRows[i]).find("select option:selected").text());
			}
			
			$("#id" + this.ideviceId).find(".exe-editing-only").remove();
			this.bindEvents();
			
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(document.getElementById("id" + this.ideviceId));
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
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
			var levelRows = $("#id" + this.ideviceId).find(".levels-table-sourcerow");
			for(var i = 0; i < levelRows.length; i++) {
				this.setRowState(levelRows.get(i), state);
			}
		}
	},
	
	handleClickBox: {
		value: function(levelWidget, level) {
			var stateVal = {};
			var internalId = levelWidget.id.substring(levelWidget.id.indexOf("_")+1);
			stateVal[internalId] = level;
			this.saveStateValues(stateVal);
		}
	},
	
	setRowState: {
		value: function(srcRow, state) {
			var srcId = $(srcRow).attr("data-src-checkbox-table");
			var srcRowTr = $(srcRow).parent();
			CheckboxUtils.getCheckedItemsByCheckedIndex(srcId, 0, (function(checkedItems) {
				var srcIdeviceId = CheckboxUtils.getIdeviceIdFromActivityId(srcId);
				var headerTr = $("<tr/>", {
					"class" : "levels-table-datarow-header-tr"
				});
				$(srcRowTr).after(headerTr);
				var headerTd = $("<td/>", {
					'class' : 'levels-table-datarow-header-td'
				}).text($(srcRow).text()).css("font-weight", "bold");
				headerTr.append(headerTd);
				
				var dataRow, dataTd, levelTd, levelWidgetId;
				var lastRow = headerTr;
				var baseId = this.ideviceId + "_" + srcIdeviceId;
				
				for(var i = 0; i < checkedItems.length; i++) {
					dataRow = $("<tr/>", {
						"class" : "levels-table-datarow-tr"
					});
					lastRow.after(dataRow);
					dataTd = $("<td/>", {
						"class" : "levels-table-datarow-td"
					}).text(checkedItems[i].desc);
					dataRow.append(dataTd);
					
					for(var j = 0; j < 6; j++) {
						levelTd = $("<td/>");
						dataRow.append(levelTd);
						
						levelWidgetId = baseId + "_" + checkedItems[i].id + "_" + j;
						LevelBoxWidget.initLevelBox(levelWidgetId, {
							container : levelTd.get(0)
						}).setOnLevelChange(this.handleClickBox.bind(this));
						
						if(typeof state["id" + levelWidgetId] !== "undefined") {
							LevelBoxWidget.getBoxById(levelWidgetId).setLevel(state["id" + levelWidgetId]);
						}
					}
					
					lastRow = dataRow;
				}
				$(srcRowTr).css("display", "none");
				
			}).bind(this));
		}
	}
	
});

LevelsTableIdevice.prototype.constructor = LevelsTableIdevice;

Idevice.registerType("net.exelearning.levelstable", LevelsTableIdevice);

