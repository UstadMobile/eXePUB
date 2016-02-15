
var ReviewCapacityIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.availableSources = null;
	this.enhance();
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
		value: function() {
			var srcRows = $(this._getEl()).find("tr.review-capacity-srcrow");
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
					
					for(var k = 0; k < 2; k++) {
						var td = $("<td/>", {
							'class' : 'review-capacity-td-checkbox'
						});
						
						var inId = "rci_" + this.ideviceId + "_" + i + 
							"_cb" + j + "_" + k;
						td.append($("<label/>", {
							'for' : inId
						}).text(" "));
						td.append($("<input/>", {
							'type' : 'checkbox',
							'id' : inId,
							'name' : inId
						}));
						
						tr.append(td);
					}
					rightTable.append(tr);
				}
				
				$(srcRows.get(i)).find(".review-capacity-td-1").empty().append(rightTable);
			}
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
	}
});

ReviewCapacityIdevice.prototype.constructor = ReviewCapacityIdevice;

Idevice.registerType("net.exelearning.reviewcapacity", ReviewCapacityIdevice);
