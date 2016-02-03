/**
 * 
 */

var InstitutionalProfileIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.availableSources = null;
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
	
	addTextboxes: {
		value: function() {
			var srcRows = $(this._getEl()).find("tr.inst-profile-srcrow");
			var textboxes = $(this._getEl()).find("table").attr("data-textboxes").split(",");
			for(var i = 0; i < textboxes.length; i++) {
				textboxes[i] = textboxes[i].trim();
			}
			
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
	}
	
});

InstitutionalProfileIdevice.prototype.constructor = InstitutionalProfileIdevice;

Idevice.registerType("net.exelearning.institutionalprofile", InstitutionalProfileIdevice);

