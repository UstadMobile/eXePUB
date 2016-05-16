/**
 * 
 */

var CheckboxTableIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	this._checkInputLabels();
	
	this._handleClickInputElBound = this.handleClickInputEl.bind(this);
	
	this._handleTextAreaInputBound = this.handleTextAreaInput.bind(this);
	
	this.textAreaInputTimeouts = {};
	
	this.bindEvents();
	
	//Array of the items ordered as they appear in the nav.xhtml table of contents
	this.navList = null;
	
	if(!eXeEpubCommon.isAuthoringMode()) {
		var $header = $(this._getEl()).find("tr.exe-checkbox-table-header-tr");
		var headerText = $header.text();
		
		if(typeof $header.text() === "string" && $header.text().trim() === "") {
			//it's blank - collapse it to avoid excess space
			$header.css("display", "none");
		}
	}
};

/**
 * The time in ms from the last input event until saving state
 */
CheckboxTableIdevice.TEXT_COMMIT_TIMEOUT = 500;

CheckboxTableIdevice.prototype = Object.create(Idevice.prototype, {
	
	bindEvents: {
		value: function() {
			if(this._getTable()) {
				$(this._getTable()).find("input[type='checkbox']").off("click", this._handleClickInputElBound);
				$(this._getTable()).find("input[type='checkbox']").on("click", this._handleClickInputElBound);				
			}
		}
	},
	
	handleClickInputEl: {
		value: function(evt) {
			var inputEl = evt.target;
			var inputId = inputEl.getAttribute("id");
			var firstSep = inputId.indexOf("_");
			var questionId = inputId.substring(firstSep+1, 
					inputId.indexOf("_", firstSep+1));
			this._updateQuestionTextInput(questionId);
			this._updatePageSkipInfo(questionId);
			if(!eXeEpubCommon.isAuthoringMode()) {
				this.saveQuestionState(questionId);
			}
		}
	},
	
	handleTextAreaInput: {
		value: function(evt) {
			var elId = evt.target.id;
			if(this.textAreaInputTimeouts[elId]) {
				clearInterval(this.textAreaInputTimeouts[elId]);
				this.textAreaInputTimeouts[elId] = null;
			}
			
			setTimeout((function() {
				this.commitTextArea(elId);
			}).bind(this), CheckboxTableIdevice.TEXT_COMMIT_TIMEOUT);
		}
	},
	
	commitTextArea: {
		value: function(elId) {
			var questionId = elId.substring(elId.lastIndexOf("_")+1);
			this.saveQuestionState(questionId);
		}
	},
	
	_updateQuestionTextInput: {
		value: function(questionId) {
			var questionDiv = document.getElementById("etcqdiv" + 
					this.ideviceId + "_" + questionId);
			var textPrompt = questionDiv.getAttribute("data-textprompt");
			var colSelected = this._getQuestionSelectedInputEl(questionId);
			var questionTextInputId = "etcqti_" +this.ideviceId + "_" + questionId;
			var promptElId = "etctpi_" + this.ideviceId + "_" + questionId;
			var inputGuidanceId = 'etcigd_'  +this.ideviceId + "_" + questionId;
			if(textPrompt === colSelected) {
				//we need to show a textinput area
				if(!$("#" + questionTextInputId).length) {
					var textAreaEl = $("<textarea/>", {
						'rows' : 1,
						'cols' : 72,
						'class' : 'exe-checkbox-table-question-textarea',
						'id' : questionTextInputId
					});
					textAreaEl.on("input", this._handleTextAreaInputBound);
					
					$(questionDiv).after(textAreaEl);
					var inputGuidance = $("<div/>", {
						'id' : inputGuidanceId
					}).html($("#"+promptElId).html());
					$(questionDiv).after(inputGuidance);
				}
			}else {
				//we need to hide text input area
				$("#" + questionTextInputId).remove();
				$("#" + inputGuidanceId).remove();
			}
		}
	},
	
	_updatePageSkipInfo: {
		value: function(questionId) {
			var questionDiv = document.getElementById("etcqdiv" + 
					this.ideviceId + "_" + questionId);
			var skipPageId = $(questionDiv).attr("data-skip-page"); 
			if(skipPageId) {
				//this answer controls skipping a particular question.  
				var colSelected = this._getQuestionSelectedInputEl(questionId);
				var skipOn = $(questionDiv).attr("data-skip-on");
				var skipPage = colSelected === skipOn;
				eXeTinCan.setPkgStateValue("skip_" + skipPageId, skipPage);
			}
		}
	},
	
	_getQuestionSelectedInputEl: {
		value: function(questionId) {
			var colIds = this._getColIds();
			var inputEl
			for(var i = 0; i < colIds.length; i++) {
				inputEl = document.getElementById('etcbox' + 
						this.ideviceId + "_" + questionId + '_' + colIds[i]);
				if(inputEl.checked) {
					return colIds[i];
				}
			}
			
			return null;
		}
	},
	
	/**
	 * For the given question set the column which is to be selected
	 * 
	 * @param questionId {string} block id of the question element
	 * @param selectColId {string} block id of the column to select for this question
	 */
	_setQuestionSelectedInputEl: {
		value: function(questionId, selectColId) {
			var colIds = this._getColIds();
			var inputEl
			for(var i = 0; i < colIds.length; i++) {
				inputEl = document.getElementById('etcbox' + 
						this.ideviceId + "_" + questionId + '_' + colIds[i]);
				inputEl.checked = (colIds[i] === selectColId);
			}
			
			this._updateQuestionTextInput(questionId);
			this._updatePageSkipInfo(questionId);
		}
	},
	
	_lockQuestionAnswer: {
		value: function(questionId) {
			var colIds = this._getColIds();
			var inputEl
			for(var i = 0; i < colIds.length; i++) {
				inputEl = document.getElementById('etcbox' + 
						this.ideviceId + "_" + questionId + '_' + colIds[i]);
				inputEl.setAttribute("disabled", "disabled");
			}
		}
	},
	
	_getTable: {
		value: function() {
			return document.getElementById('ect' + this.ideviceId);
		}
	},
	
	_getQuestionIds: {
		value: function() {
			var $questionRows = $(this._getEl()).find(".exe-checkbox-table-questionrow");
			var questionIds = [];
			for(var i = 0; i < $questionRows.length; i++) {
				questionIds.push($($questionRows.get(i)).attr("data-block-id"));
			}
			
			return questionIds;
		}
	},
	
	_getColIds: {
		value: function() {
			var colIds = [];
			var $questionCols = $(this._getEl()).find(".exe-checkbox-table-col-header");
			for(var i = 0; i < $questionCols.length; i++) {
				colIds.push($($questionCols.get(i)).attr("data-block-id"));
			}
			
			return colIds;
		},
	},
	
	_getColNameById: {
		value: function(colId) {
			return  $("#ectcbl" + colId).text();
		}
	},
	
	_getNextBlockId: {
		value: function() {
			var maxId = 0;
			var $allBlocks = $("[data-block-id]");
			var idVal;
			for(var i = 0; i < $allBlocks.length; i++) {
				try {
					idVal = parseInt($($allBlocks[i]).attr("data-block-id"));
					maxId = Math.max(maxId, idVal);
				}catch(err) {
					//do nothing - non numerical id
				}
			}
			
			return maxId + 1;
		}
	},
	
	onCreate: {
		value: function() {
			var headerEl = $("<h2/>", {
				'class' : 'checkbox-table-header',
				'id' : 'ecth_' + this.ideviceId
			});
			headerEl.text("Checkbox Table Title");
			
			var $table = $("<table/>", {
				'class' : "exe-checkbox-table",
				'id' : 'ect' + this.ideviceId
			});
			
			var $trHeader = $("<tr/>", {
				'class' : 'exe-checkbox-table-header-tr'
			});
			
			$(this._getEl()).append(headerEl);
			$(this._getEl()).append($table);
			
			
			$trHeader.append($("<th/>", {
				'class' : 'exe-checkbox-table-spacer'
			}));
			$table.append($trHeader);
			this._addColumn();
			this._addQuestionRow();
		}
	},
	
	_addColumn: {
		value: function() {
			var labelBlockId = this._getNextBlockId();
			var $headerCol = $("<th/>", {
				'class' : 'exe-checkbox-table-itemheader',
				'data-ect-col' : labelBlockId,
				'id' : 'ectcblth' + labelBlockId
			});
			
			
			var $headerNameDiv = $("<div/>", {
				'id' : 'ectcbl' + labelBlockId,
				'data-block-id' : labelBlockId,
				'class' : 'exe-checkbox-table-col-header'
			});
			$headerNameDiv.text("name");
			$headerCol.append($headerNameDiv);
			
			var $trHeader = $(this._getTable()).find("tr.exe-checkbox-table-header-tr");
			$trHeader.find(".exe-checkbox-table-spacer").before($headerCol);
			
			//Make a input table cell for each of the existing questions
			var questionIds = this._getQuestionIds();
			for(var i = 0; i < questionIds.length; i++) {
				var $qTD = $("#ectqr_" + questionIds[i]).find(
						".exe-checkbox-table-qtext");
				
				$qTD.before(this._makeQuestionInputTD(questionIds[i], labelBlockId));
			}
			
			var selectEls = $(this._getEl()).find(".exe-checkbox-table-selectprompt, .exe-checkbox-table-lockanswer");
			for(var i = 0; i < selectEls.length; i++) {
				$(selectEls.get(i)).append(this._makeSelectOptionForCol(labelBlockId));
			}
			
			return labelBlockId;
		}
	},
	
	_addQuestionRow: {
		value: function() {
			var numBoxes = $(this._getEl()).find(".exe-checkbox-table-itemheader").length;
			var questionId = this._getNextBlockId();
			var $newRow = $("<tr/>", {
				'class' : 'exe-checkbox-table-questionrow',
				'data-block-id' : questionId,
				'id' : 'ectqr_' + questionId
			});
			
			var $tdEl;
			
			var colIds = this._getColIds();
			for(var i = 0; i < colIds.length; i++) {
				$tdEl = this._makeQuestionInputTD(questionId, colIds[i]);
				$newRow.append($tdEl);
			}
			
			$tdEl = $("<td/>", {
				"class" : "exe-checkbox-table-qtext",
				'id' : 'etctd' + this.ideviceId + "_" + questionId
			});
			$tdEl.append($("<div/>", {
				'class':  'exe-checkbox-table-qdiv',
				'id': 'etcqdiv' + this.ideviceId + "_" + questionId
			}).text('Question Text'));
			$newRow.append($tdEl);
			$(this._getTable()).append($newRow);
			
			return questionId;
		}
	},
	
	_makeQuestionInputTD: {
		value: function(questionId, colId) {
			var $tdEl = $("<td/>", {
				'class' : 'exe-checkbox-table-qbox',
				'data-ect-col' : colId
			});
			$tdEl.append($("<input/>", {
				'type': 'checkbox',
				'id' : 'etcbox' + this.ideviceId + "_" + questionId + '_' + colId
			}));
			return $tdEl;
		}
	},
	
	
	/**
	 * Make sure that there is check box label for each checkbox
	 */
	_checkInputLabels: {
		value: function(){
			var checkboxEls = $(this._getEl()).find("input[type=checkbox]");
			for(var i = 0; i < checkboxEls.length; i++) {
				var nextEl = $(checkboxEls.get(i)).next();
				if(nextEl.length < 1 || nextEl.get(0).nodeName !== "label") {
					$(checkboxEls.get(i)).after($("<label/>", {
						'for' : checkboxEls.get(i).id
					}));
				}
			}
		}
	},
		
		
	
	_questionRowEditOn: {
		value: function(questionId) {
			var textDivId = 'etcqdiv' + this.ideviceId + "_" + questionId;
			eXeEpubAuthoring.setTinyMceEnabledById(textDivId, true);
			var $rowDeleteDiv = $("<div/>", {
				'class' : 'exe-editing-only exe-editing-delete-div'
			});
			
			var $rowDeleteImg = $("<img/>", {
				src : '/images/stock-delete.png',
				'class' : 'exe-delete-button'
			});
			$rowDeleteImg.on("click", {questionId : questionId}, 
					this.handleClickDeleteRow.bind(this));
			$rowDeleteDiv.append($rowDeleteImg);
			$("#"+textDivId).before($rowDeleteDiv);
			
			var textPrompt = $("#" + textDivId).attr("data-textprompt");
			var lockedAnswer = $("#" + textDivId).attr("data-locked-answer");
			var skipPage = $("#" + textDivId).attr('data-skip-page');
			var skipOnAnswer = $("#" + textDivId).attr('data-skip-on');
			
			var $textPromptDiv = $("<div/>", {
				'id' : 'ecttpd_' + this.ideviceId + "_" + questionId,
				"class": "exe-editing-only textprompt-container"
			});
			$textPromptDiv.text("Text Entry on");
			var $promptSelectEl = $("<select/>", {
				'id' : 'ectsp_' + this.ideviceId + "_" + questionId,
				'class' : 'exe-checkbox-table-selectprompt exe-editing-only'
			});
			var colIds = this._getColIds();
			$promptSelectEl.append(this._makeSelectOptionForCol("", textPrompt === ""));
			for(var i = 0; i < colIds.length; i++) {
				$promptSelectEl.append(this._makeSelectOptionForCol(colIds[i], colIds[i] === textPrompt));
			}
			$textPromptDiv.append($promptSelectEl);
			
			var $promptTextEl = $("#etctd" + this.ideviceId + "_" + questionId).find(".exe-checkbox-table-textpompt-instructions");
			var promptElId = "etctpi_" + this.ideviceId + "_" + questionId
			if(!$promptTextEl.length) {
				$("#" + textDivId).after($("<div/>", {
					'class' : 'exe-checkbox-table-textpompt-instructions exe-editable',
					'id' : promptElId
				}).text("-"));
			}
			$textPromptDiv.append("<div class='exe-editing-only'>Text fill in guidance (optional):</div>");
			$("#" + promptElId).detach().appendTo($textPromptDiv).css("display", "block");
			$("#"+textDivId).after($textPromptDiv);
			
			var $lockAnswerDiv = $("<div/>", {
				'class' : 'exe-editing-only'
			});
			$lockAnswerDiv.text("Lock answer:");
			var $lockPromptSelect = $("<select/>", {
				"id" : "ectla_" + this.ideviceId + "_" + questionId,
				'class' : "exe-checkbox-table-lockanswer"
			});
			
			$lockPromptSelect.append(this._makeSelectOptionForCol("", lockedAnswer === ""));
			for(var i = 0; i < colIds.length; i++) {
				$lockPromptSelect.append(this._makeSelectOptionForCol(colIds[i], colIds[i] === lockedAnswer));
			}
			$lockAnswerDiv.append($lockPromptSelect);
			
			$textPromptDiv.after($lockAnswerDiv);
			
			var $skipPageDiv = $("<div/>", {
				"class" : "exe-editing-only"
			}).text("Skip Page ");
			var pageSkipSelectEl = eXeEpubAuthoring.navItemsToSelectEl(this.navList, skipPage);
			$(pageSkipSelectEl).attr("id", "ectlsp_" + this.ideviceId + "_" + questionId);
			$skipPageDiv.append(pageSkipSelectEl);
			
			$skipPageDiv.append(" When answer = ");
			
			var $pageSkipAnswerSelect = $("<select/>", {
				"id" : "ectlsa_" + this.ideviceId + "_" + questionId,
				'class' : "exe-checkbox-table-lockanswer"
			});
			for(var i = 0; i < colIds.length; i++) {
				$pageSkipAnswerSelect.append(this._makeSelectOptionForCol(colIds[i], colIds[i] === skipOnAnswer));
			}
			$skipPageDiv.append($pageSkipAnswerSelect);
			
			//skipOnAnswer
			
			$lockAnswerDiv.after($skipPageDiv);
			
			eXeEpubAuthoring.setTinyMceEnabledById(promptElId, true);
		},
	},
	
	_questionRowEditOff: {
		value: function(questionId) {
			var promptElId = "ectsp_" + this.ideviceId + "_" + questionId;
			var lockedAnswerId = "ectla_" + this.ideviceId + "_" + questionId;
			var skipPageId = "ectlsp_" + this.ideviceId + "_" + questionId;
			var skipPageAnswerId = "ectlsa_" + this.ideviceId + "_" + questionId;
			
			var promptFor = $('#' + promptElId).val();
			var lockedAnswer = $("#" + lockedAnswerId).val();
			var skipPage = $("#" + skipPageId).val();
			var skipPageAnswer = $("#" + skipPageAnswerId).val();
			
			var questionDivId = 'etcqdiv' + this.ideviceId + "_" + questionId;
			var questionEl = $('#' + questionDivId);
			
			questionEl.attr("data-textprompt", promptFor).attr("data-locked-answer", lockedAnswer);
			if(skipPage) {
				questionEl.attr("data-skip-page", skipPage).attr("data-skip-on", skipPageAnswer);
			}else {
				questionEl.removeAttr('data-skip-page').removeAttr("data-skip-on");
			}
			
			//hide the text prompt and put it after the question itself
			var textPromptInstructionsId = "etctpi_" + this.ideviceId + "_" + questionId;
			var textPromptInstructionsEl = $("#"+textPromptInstructionsId);
			questionEl.after(textPromptInstructionsEl.detach().css("display", "none"));
			
			var promptTextEl = $("#" + promptElId).css("display", "none");
			eXeEpubAuthoring.setTinyMceEnabledById(textPromptInstructionsId, false);
			eXeEpubAuthoring.removeAllTinyMceInstances(document.getElementById("ectsp_"+ 
					this.ideviceId + "_" + questionId));
			$('#etcqdiv' + this.ideviceId + "_" + questionId).after(promptTextEl.detach());
			eXeEpubAuthoring.setTinyMceEnabledById(questionDivId, false);
		},
	},
	
	_makeSelectOptionForCol: {
		value: function(colId, isSelected) {
			var optEl = $("<option/>", {
				'value' : colId,
				'class' : 'exe-checkbox-table-promptel'
			});
			
			if(isSelected){
				optEl.attr("selected", "selected");
			}
			
			if(colId !== "") {
				optEl.text(this._getColNameById(colId));
			}else {
				optEl.text("[Not required]");
			}
			
			return optEl;
		}
	},
	
	_columnEditOn: {
		value: function(columnId) {
			var columnNameDivId = 'ectcbl' + columnId;
			eXeEpubAuthoring.setTinyMceEnabledById(columnNameDivId, true);
			var $deleteColDiv = $("<div/>", {
				'class' : 'exe-editing-only exe-editing-delete-div'
			});
			
			var $deleteImg = $("<img/>", {
				src : '/images/stock-delete.png',
				'class' : 'exe-delete-button'
			});
			$deleteImg.on("click", {columnId : columnId}, 
					this.handleClickDeleteCol.bind(this));
			$deleteColDiv.append($deleteImg);
			
			$("#" + columnNameDivId).before($deleteColDiv);
		},
	},
	
	handleClickAddRow: {
		value: function() {
			var newQuestionId = this._addQuestionRow();
			this._questionRowEditOn(newQuestionId);
		}
	},
	
	setupTextAreaForEl: {
		value: function() {
			
		}
	},
	
	
	handleClickAddCol: {
		value: function() {
			var newColId = this._addColumn();
			this._columnEditOn(newColId);
		}
	},
	
	handleClickDeleteRow: {
		value: function(evt) {
			var trEl = document.getElementById("ectqr_" + evt.data.questionId);
			eXeEpubAuthoring.removeAllTinyMceInstances(trEl);
			$(trEl).remove();
		}
	},
	
	handleClickDeleteCol: {
		value: function(evt) {
			var colId = evt.data.columnId;
			var thEl = document.getElementById('ectcblth' + colId);
			eXeEpubAuthoring.removeAllTinyMceInstances(thEl);
			$(this._getEl()).find("[data-ect-col='" + colId + "']").remove();
		}
	},
	
	editOn: {
		value: function() {
			if(this.navList) {
				this.editOn2();
			}else {
				eXeEpubCommon.getNavOptions({}, (function(err, navList) {
					this.navList = navList;
					this.editOn2();
				}).bind(this));
			}
		}
	},
	
	editOn2: {
		value: function() {
			//add title if it's not already there
			if(!$("#ecth_" + this.ideviceId).length) {
				var headerEl = $("<h2/>", {
					'class' : 'checkbox-table-header',
					'id' : 'ecth_' + this.ideviceId
				});
				headerEl.text("Checkbox Table Title");
				$(this._getEl()).prepend(headerEl);
			}
			
			eXeEpubAuthoring.setTinyMceEnabledById('ecth_' + this.ideviceId, true);
			
			var addRowButton = $("<button/>", {
				"class" : "exe-editing-only"
			});
			addRowButton.text("Add Row");
			addRowButton.on("click", this.handleClickAddRow.bind(this));
			$(this._getTable()).after(addRowButton);
			
			var addColButton = $("<button/>", {
				'class' : 'exe-editing-only'
			});
			addColButton.text("Add Column");
			addColButton.on("click", this.handleClickAddCol.bind(this));
			addRowButton.after(addColButton);
			
			var questionIds = this._getQuestionIds();
			for(var i = 0; i < questionIds.length; i++) {
				this._questionRowEditOn(questionIds[i]);
			}
			
			var columnIds = this._getColIds();
			for(var i = 0; i < columnIds.length; i++) {
				this._columnEditOn(columnIds[i]);
			}
		}
	},
	
	
	editOff: {
		value: function() {
			eXeEpubAuthoring.setTinyMceEnabledById('ecth_' + this.ideviceId, false);
			var questionIds = this._getQuestionIds();
			for(var i = 0; i < questionIds.length; i++) {
				this._questionRowEditOff(questionIds[i]);
			}
			$(this._getEl()).find(".exe-editing-only").remove();
			
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
			
			this._checkInputLabels();
			this.bindEvents();
			//make a tincan entry for this
			
			var checkboxTinCan = this.makeTinCanActivities();
			var activitiesXML = this.makeTinCanActivities();
			var tinCanStr = new XMLSerializer().serializeToString(activitiesXML);
			eXeEpubAuthoring.saveIdeviceTinCanXML(this.ideviceId, tinCanStr);
		}
	},
	
	makeTinCanActivities: {
		value: function() {
			var ns = eXeEpubAuthoring.NS_TINCAN;
			var xmlDoc = document.implementation.createDocument(ns, "activities");
			
			//parent activity that can be used for all subquestions
			var parentActivity = xmlDoc.createElementNS(ns, "activity");
			parentActivity.setAttribute("id", this.ideviceId + ".0");
			var titleStr = $('#ecth_' + this.ideviceId).text();
			
			var questionTextEls = ["name", "description"];
			for(var q = 0; q < questionTextEls.length; q++) {
				var questionTextEl = xmlDoc.createElementNS(ns, questionTextEls[q]);
				questionTextEl.setAttribute("lang", "en");
				questionTextEl.textContent = titleStr;
				parentActivity.appendChild(questionTextEl);
			}
			
			var extsEl = xmlDoc.createElementNS(ns, "extensions");
			var extEl = xmlDoc.createElementNS(ns, "extension");
			extEl.setAttribute("key", "http://www.ustadmobile.com/ns/tincan-ext-checkboxtable-parent");
			extEl.textContent = "true";
			extsEl.appendChild(extEl);
			parentActivity.appendChild(extsEl);
			
			xmlDoc.documentElement.appendChild(parentActivity);
			
			
			var questionIds = this._getQuestionIds();
			var interactionTypeEl;
			for(var i = 0; i < questionIds.length; i++) {
				var activityEl = xmlDoc.createElementNS(ns, "activity");
				activityEl.setAttribute("id", this.ideviceId + "." + 
						questionIds[i]);
				
				//for now set name and desc to be the same
				
				var j;
				for(j = 0; j < questionTextEls.length; j++) {
					var questionTextEl = xmlDoc.createElementNS(ns, questionTextEls[j]);
					questionTextEl.setAttribute("lang", "en");
					questionTextEl.textContent = $('#etcqdiv' + this.ideviceId + "_" + questionIds[i]).text();
					activityEl.appendChild(questionTextEl);
				}
				
				interactionTypeEl = xmlDoc.createElementNS(ns, "interactionType");
				interactionTypeEl.textContent = "choice";
				activityEl.appendChild(interactionTypeEl);
				
				var choicesEl = xmlDoc.createElementNS(ns, "choices");
				activityEl.appendChild(choicesEl);
				
				var colIds = this._getColIds();
				var colName;
				for(j = 0; j < colIds.length; j++) {
					colName = this._getColNameById(colIds[j]);
					var compEl = xmlDoc.createElementNS(ns, "component");
					var idEl = xmlDoc.createElementNS(ns, "id");
					idEl.textContent = "choice_" + this.ideviceId + "." + 
						questionIds[i] + "." + colIds[j];
					compEl.appendChild(idEl);
					
					var descEl = xmlDoc.createElementNS(ns, "description");
					descEl.setAttribute("lang", "en");
					descEl.textContent = this._getColNameById(colIds[j]);
					compEl.appendChild(descEl);
					choicesEl.appendChild(compEl);
				}
				xmlDoc.documentElement.appendChild(activityEl);
				
				//Check and see if this question has a text response
				var questionDiv = document.getElementById("etcqdiv" + 
						this.ideviceId + "_" + questionIds[i]);
				var textPrompt = questionDiv.getAttribute("data-textprompt");
				if(textPrompt) {
					activityEl = xmlDoc.createElementNS(ns, "activity");
					activityEl.setAttribute("id", this.ideviceId + "." + 
						questionIds[i] + "_text");
					var textActivityTitle = titleStr + " / " + $('#etcqdiv' + this.ideviceId + "_" + questionIds[i]).text();
					for(j = 0; j < questionTextEls.length; j++) {
						var questionTextEl = xmlDoc.createElementNS(ns, questionTextEls[j]);
						questionTextEl.setAttribute("lang", "en");
						questionTextEl.textContent = textActivityTitle;
						activityEl.appendChild(questionTextEl);
					}
					
					interactionTypeEl = xmlDoc.createElementNS(ns, "interactionType");
					interactionTypeEl.textContent = "fill-in";
					activityEl.appendChild(interactionTypeEl);
					
					xmlDoc.documentElement.appendChild(activityEl);
				}
			}
			
			return xmlDoc;
		}
	},
	
	isStateSupported: {
		value: function() {
			return true;
		}
	},
	
	saveQuestionState: {
		value: function(questionId) {
			var questionState = {
				checkedItem: this._getQuestionSelectedInputEl(questionId)
			};
			
			var questionStateId = "id" + this.ideviceId + "_" + questionId;
			var textStateId = questionStateId + "_text";
			
			var questionTextAreaId = "etcqti_" +this.ideviceId + "_" + questionId;
			var textAreaEl = document.getElementById(questionTextAreaId);
			if(textAreaEl) {
				questionState.response = textAreaEl.value;
			}
			
			eXeTinCan.setPkgStateValue(questionStateId, questionState);
		}
	},
	
	setState: {
		value: function(state) {
			if(!state) {
				return;//nothing was saved...
			}
			
			var questionIds = this._getQuestionIds();
			var idPrefix = "id" + this.ideviceId + "_";
			var questionState, questionTextAreaEl;
			var textStateKey;
			for(var i = 0; i < questionIds.length; i++) {
				questionTextAreaEl = null;
				questionState = state[idPrefix + questionIds[i]];
				if(questionState) {//its possible that not all questions have been answered
					this._setQuestionSelectedInputEl(questionIds[i],
							questionState.checkedItem);
					
					textStateKey = idPrefix + questionIds[i] + "_text";
					if(questionState.response) {
						questionTextArea = document.getElementById("etcqti_" 
								+this.ideviceId + "_" + questionIds[i]);
						if(questionTextArea) {
							questionTextArea.value = questionState.response;
						}
					}
				}
				
				var etcQDiv = $('#etcqdiv' + this.ideviceId + "_" + questionIds[i]);
				if(etcQDiv.attr("data-locked-answer")) {
					this._setQuestionSelectedInputEl(questionIds[i],
							etcQDiv.attr("data-locked-answer"));
					this._lockQuestionAnswer(questionIds[i]);
				}
			}
		}
	}
	
});

CheckboxTableIdevice.prototype.constructor = CheckboxTableIdevice;

Idevice.registerType("net.exelearning.checkboxtable", CheckboxTableIdevice);

