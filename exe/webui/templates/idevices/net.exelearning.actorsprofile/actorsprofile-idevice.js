/**
 * 
 */

var ActorsProfileIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.availableSources = null;
	
	this.textInputCommitTimeouts = {};
};

ActorsProfileIdevice.COMMIT_TIMEOUT = 500;

ActorsProfileIdevice.prototype = Object.create(Idevice.prototype, {
	onCreate: {
		value: function() {
			$("#id" + this.ideviceId).load("exe-files/idevices/net.exelearning.actorsprofile/actorsprofile-template.html .actors-profile-template",
					this.onCreate2.bind(this));
		}
	},
	
	
	onCreate2: {
		value: function(){
			this.setIdeviceIdAttrs(this._getEl());
			this._addRow.bind(this)
		}
	},
	
	_addRow: {
		value: function(){
			var newRow = $("<tr/>", {
				"class" : "exe-actorsprofile-tr",
				"data-block-id" : this.getNextBlockId()
			});
			
			var labelTd = $("<td/>", {
				"class" : "exe-actorsprofile-labeltd",
				"data-text-src" : ""
			});
			newRow.append(labelTd);
			
			var textTd = $("<td/>", {
				"class" : "exe-actorsprofile-texttd"
			});
			textTd.append("<input/>", {
				"type" : "text"
			});
			newRow.append(textTd);
			
			
			$("#id" + this.ideviceId).find(".actors-profile-template tr").last().after(newRow);
		}
	},
	
	_getSrcRows: {
		value: function() {
			return $("#id" + this.ideviceId).find(".actors-profile-template tr.exe-actorsprofile-tr");
		}
	},
	
	_getColIds: {
		value: function() {
			var colIds = [];
			var cols = $(this._getEl()).find("td.actors-profile-levelcol");
			for(var i = 0; i < cols.length; i++) {
				colIds.push(cols.get(i).getAttribute("data-block-id"));
			}
			
			return colIds;
		}
	},
	
	_addCol: {
		value: function(){
			var blockId = this.getNextBlockId();
			var newTd = $("<td/>", {
				"class" : "actors-profile-levelcol",
				'data-block-id' : blockId
			});
			var newDiv = $("<div/>", {
				"class" : "actors-profile-level-name exe-editable",
				"id" : "apln_" + this.ideviceId + "_" + blockId
			}).text("Name");
			newTd.append(newDiv);
			
			var lastLevelCol = $(this._getEl()).find(".actors-profile-levelcol");
			if(lastLevelCol.length > 0) {
				lastLevelCol.last().after(newTd);
			}else {
				$(this._getEl()).find(".actors-role-header-td").after(newTd);
			}
		}
	},
	
	editOn: {
		value: function(){
			if(this.availableSources === null) {
				eXeTinCan.getActivitiesByInteractionType(['fill-in'], 
					{context : this}, function(matchingActivities){
						this.availableSources = matchingActivities;
						this.editOn2();
					});
			}else {
				this.editOn2();
			}
		}
	},
	
	editOn2: {
		value: function() {
			var rows = $(this._getEl()).find("tr.exe-actorsprofile-tr");
			var rowSrc;
			var labelTd;
			var deleteBtn;
			var i;
			
			for(i = 0; i < rows.length; i++) {
				if(!rows.get(i).hasAttribute("data-exe-editing")) {
					labelTd = $(rows.get(i)).find(".exe-actorsprofile-labeltd");
					rowSrc = labelTd.attr("data-text-src");
					labelTd.empty();
					deleteBtn = $("<img/>", {
						src : "/images/stock-delete.png"
					});
					deleteBtn.on("click", {blockId : $(rows.get(i)).attr('data-block-id')}, 
							this.handleClickDeleteRow.bind(this));
					labelTd.append(deleteBtn);
					labelTd.append(eXeEpubAuthoring.activitiesArrToSelectEl(
							this.availableSources, rowSrc));
					$(rows.get(i)).attr("data-exe-editing", "true");
				}
			}
			
			
			var cols = $(this._getEl()).find("td.actors-profile-levelcol:not([data-exe-editing])");
			for(i = 0; i < cols.length; i++) {
				deleteBtn = $("<img/>", {
					src : "/images/stock-delete.png",
					'class' : 'exe-editing-only'
				});
				deleteBtn.on("click", {blockId : $(cols.get(i)).attr("data-block-id")},
						this.handleClickDeleteCol.bind(this));
				$(cols.get(i)).prepend(deleteBtn);
				$(cols.get(i)).attr('data-exe-editing', 'true');
			}
			
			var editingBar = $(this._getEl()).find(".exe-editing-bar");
			if(!editingBar.length) {
				editingBar = $("<div/>", {
					"class" : "exe-editing-only exe-editing-bar"
				});
				
				var addRowBtn = $("<button/>").text("Add Row");
				addRowBtn.on("click", this.handleClickAddRow.bind(this));
				editingBar.append(addRowBtn);
				
				var addColBtn = $("<button/>").text("Add Col");
				addColBtn.on("click", this.handleClickAddCol.bind(this));
				editingBar.append(addColBtn);
				
				$(this._getEl()).find("table").after(editingBar);
			}
			
			eXeEpubAuthoring.setTinyMceEnabledBySelector(this._getEl(), 
					".exe-editable", true);
		}
	},
	
	handleClickDeleteRow: {
		value: function(evt) {
			var trEl = $(this._getEl()).find("tr[data-block-id=" + evt.data.blockId + "]");
			eXeEpubAuthoring.removeAllTinyMceInstances(trEl.get(0));
			trEl.remove();
		}
	},
	
	handleClickAddRow: {
		value: function(evt) {
			this._addRow();
			this.editOn2();
		}
	},
	
	handleClickDeleteCol: {
		value: function(evt) {
			var tdEl = $(this._getEl()).find("td.actors-profile-levelcol[data-block-id=" + evt.data.blockId + "]");
			eXeEpubAuthoring.removeAllTinyMceInstances(tdEl.get(0));
			tdEl.remove();
		}
	},
	
	handleClickAddCol:{
		value: function(evt) {
			this._addCol();
			this.editOn2();
		}
	},
	
	editOff: {
		value: function() {
			var rows = $(this._getEl()).find("tr.exe-actorsprofile-tr[data-exe-editing]");
			var rowSrc;
			var labelTd;
			for(var i = 0; i < rows.length; i++) {
				labelTd = $(rows.get(i)).find(".exe-actorsprofile-labeltd");
				rowSrc = labelTd.find("select").val();
				labelTd.attr("data-text-src", rowSrc);
				labelTd.text(labelTd.find("select option:selected").text());
				$(rows.get(i)).removeAttr("data-exe-editing");
			}
			
			$(this._getEl()).find(".exe-editing-only").remove();
			$(this._getEl()).find("[data-exe-editing]").removeAttr("data-exe-editing");
			eXeEpubAuthoring.setTinyMceEnabledBySelector(this._getEl(), 
					".exe-editable", false);
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
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
			var rows = this._getSrcRows();
			var labelTd, srcId, textLines, srcIdeviceId;
			
			
			for(var i = 0; i < rows.length; i++) {
				labelTd = $(rows.get(i)).find(".exe-actorsprofile-labeltd");
				srcId = labelTd.attr('data-text-src');
				srcId = srcId.substring(srcId.lastIndexOf("/") + 1);
				eXeTinCan.getPkgStateValue(["id"+srcId, "id" + this.ideviceId], (function(state){
					//TODO: check this - values should be coming with id prefix...
					if(state['id'+srcId] && state['id'+srcId].response) {
						var lines = state['id'+srcId].response.split('\n');
						var lastRow = rows.get(i);
						$(rows.get(i)).css('display', 'none');
						for(var j = 0; j < lines.length; j++) {
							var dataRowId = this.ideviceId + "_" +
								$(rows.get(i)).attr("data-block-id") +"_" +
								srcId + "_" + j;
								
							var newTr = $("<tr/>", {
								'class': "exe-actorsprofile-data-row",
								'data-row-id' : dataRowId
							});
							
							var actorNameTd = $("<td/>", {
								'class' : 'exe-actorsprofile-actor-name-td'
							}).text(lines[j]);
							newTr.append(actorNameTd);
							
							var actorRoleTd = $("<td/>", {
								'class' : 'exe-actorsprofile-actor-role-td'
							});
							var actorRoleInput = $("<input/>", {
								'id' : 'apdri_' + dataRowId,
								'class' : 'exe-actorsprofile-actor-role-input'
							});
							actorRoleInput.on("input", 
									this.handleTextInputChanged.bind(this));
							
							
							var baseStateId = 'id' + this.ideviceId + "_"; 
							if(state[baseStateId + dataRowId]) {
								//responses are available
								actorRoleInput.val(state[baseStateId + dataRowId].response);
							}
							
							actorRoleTd.append(actorRoleInput);
							newTr.append(actorRoleTd);
							$(lastRow).after(newTr);
							
							var colIds = this._getColIds();
							var levelTd, levelId;
							for(var k = 0; k < colIds.length; k++) {
								levelTd = $("<td/>", {
									'class' : 'exe-actorsprofile-actor-role-leveltd'
								});
								levelId = dataRowId + "_" + k
								newTr.append(levelTd);
								LevelBoxWidget.initLevelBox(levelId, {
									container : levelTd.get(0)
								}).setOnLevelChange(this.handleLevelChanged.bind(this));
								
								if(state[baseStateId + levelId]) {
									LevelBoxWidget.getBoxById(levelId).setLevel(
											state[baseStateId + levelId]);
								}
							}
							
							lastRow = newTr;
						}
					}
					
					
				}).bind(this), {prefix : true});
			}
		}
	},
	
	handleLevelChanged: {
		value: function(levelWidget, level) {
			var dataRowId = levelWidget.id.substring(0, levelWidget.id.lastIndexOf("_"));
			this.saveRowState(dataRowId);
		}
	},
	
	handleTextInputChanged: {
		value: function(evt) {
			var dataRowId = $(evt.target).closest("tr.exe-actorsprofile-data-row").attr('data-row-id');
			if(this.textInputCommitTimeouts[dataRowId]) {
				clearInterval(this.textInputCommitTimeouts[dataRowId]);
				this.textInputCommitTimeouts[dataRowId] = null;
			}
			
			this.textInputCommitTimeouts[dataRowId] = setTimeout((function() {
				this.saveRowState(dataRowId);
			}).bind(this), ActorsProfileIdevice.COMMIT_TIMEOUT);
		}
	},
	
	saveRowState: {
		value: function(dataRowId) {
			var stateVal = {};
			var row = $(this._getEl()).find("tr[data-row-id='" + dataRowId +"']");
			
			stateVal[dataRowId] = {
				response : $('#apdri_' + dataRowId).val()
			};
			
			var colIds = this._getColIds();
			for(var k = 0; k < colIds.length; k++) {
				levelBoxId = dataRowId + "_" + k;
				stateVal[levelBoxId] = LevelBoxWidget.getBoxById(levelBoxId).getLevel();
			}
			
			this.saveStateValues(stateVal);
		}
	}
});

ActorsProfileIdevice.prototype.constructor = ActorsProfileIdevice;

Idevice.registerType("net.exelearning.actorsprofile", ActorsProfileIdevice);

