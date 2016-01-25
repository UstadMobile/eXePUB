/**
 * 
 */

var CheckboxTableIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
}

CheckboxTableIdevice.prototype = {
	
	
	_getEl: function() {
		return document.getElementById("id" + this.ideviceId);
	},
	
	_getTable: function() {
		return document.getElementById('ect' + this.ideviceId);
	},
	
	_getQuestionIds: function() {
		var $questionRows = $(this._getEl()).find(".exe-checkbox-table-questionrow");
		var questionIds = [];
		for(var i = 0; i < $questionRows.length; i++) {
			questionIds.push($($questionRows.get(i)).attr("data-block-id"));
		}
		
		return questionIds;
	},
	
	_getColIds: function() {
		var colIds = [];
		var $questionCols = $(this._getEl()).find(".exe-checkbox-table-col-header");
		for(var i = 0; i < $questionCols.length; i++) {
			colIds.push($($questionCols.get(i)).attr("data-block-id"));
		}
		
		return colIds;
	},
	
	_getColNameById: function(colId) {
		return  $("#ectcbl" + colId).text();
	},
	
	_getNextBlockId: function() {
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
	},
	
		
	create: function() {
		var $table = $("<table/>", {
			'class' : "exe-checkbox-table",
			'id' : 'ect' + this.ideviceId
		});
		
		var $trHeader = $("<tr/>", {
			'class' : 'exe-checkbox-table-header-tr'
		});
		
		$(this._getEl()).append($table);
		
		
		$trHeader.append($("<th/>", {
			'class' : 'exe-checkbox-table-spacer'
		}));
		$table.append($trHeader);
		this._addColumn();
		this._addQuestionRow();
	},
	
	_addColumn: function() {
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
		
		var selectEls = $(this._getEl()).find(".exe-checkbox-table-selectprompt");
		for(var i = 0; i < selectEls.length; i++) {
			$(selectEls.get(i)).append(this._makeSelectOptionForCol(labelBlockId));
		}
		
		return labelBlockId;
	},
	
	_addQuestionRow: function() {
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
	},
	
	_makeQuestionInputTD: function(questionId, colId) {
		var $tdEl = $("<td/>", {
			'class' : 'exe-checkbox-table-qbox',
			'data-ect-col' : colId
		});
		$tdEl.append($("<input/>", {
			'type': 'checkbox',
			'id' : 'etcbox' + this.ideviceId + "_" + questionId + '_' + colId
		}));
		return $tdEl;
	},
	
	_questionRowEditOn: function(questionId) {
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
		var $textPromptDiv = $("<div/>", {
			"class": "exe-editing-only"
		});
		$textPromptDiv.text("Text Entry on");
		var $promptSelectEl = $("<select/>", {
			'id' : 'ectsp' + this.ideviceId + "_" + questionId,
			'class' : 'exe-checkbox-table-selectprompt exe-editing-only'
		});
		var colIds = this._getColIds();
		$promptSelectEl.append(this._makeSelectOptionForCol("", textPrompt === ""));
		for(var i = 0; i < colIds.length; i++) {
			$promptSelectEl.append(this._makeSelectOptionForCol(colIds[i], colIds[i] === textPrompt));
		}
		$textPromptDiv.append($promptSelectEl);
		
		$("#"+textDivId).after($textPromptDiv);
	},
	
	_questionRowEditOff: function(questionId) {
		var promptFor = $('#ectsp' + this.ideviceId + "_" + questionId).val(); 
		$('#etcqdiv' + this.ideviceId + "_" + questionId).attr(
			"data-textprompt", promptFor);
	},
	
	_makeSelectOptionForCol: function(colId, isSelected) {
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
	},
	
	_columnEditOn: function(columnId) {
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
	
	handleClickAddRow: function() {
		var newQuestionId = this._addQuestionRow();
		this._questionRowEditOn(newQuestionId);
	},
	
	handleClickAddCol: function() {
		var newColId = this._addColumn();
		this._columnEditOn(newColId);
	},
	
	handleClickDeleteRow: function(evt) {
		var trEl = document.getElementById("ectqr_" + evt.data.questionId);
		eXeEpubAuthoring.removeAllTinyMceInstances(trEl);
		$(trEl).remove();
	},
	
	handleClickDeleteCol: function(evt) {
		var colId = evt.data.columnId;
		var thEl = document.getElementById('ectcblth' + colId);
		eXeEpubAuthoring.removeAllTinyMceInstances(thEl);
		$(this._getEl()).find("[data-ect-col='" + colId + "']").remove();
	},
	
	
	editOn: function() {
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
	},
	
	editOff: function() {
		var questionIds = this._getQuestionIds();
		for(var i = 0; i < questionIds.length; i++) {
			this._questionRowEditOff(questionIds[i]);
		}
		$(this._getEl()).find(".exe-editing-only").remove();
		
		var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
		eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
	}

};


(function() {
	var _idevices = {};
	
	document.addEventListener("idevicecreate", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.checkboxtable") {
			var targetEl = evt.target || evt.srcElement;
			var ideviceId = evt.detail.ideviceId;
			_idevices[ideviceId] = new CheckboxTableIdevice(ideviceId);
			_idevices[ideviceId].create();
		}
	}, false);
	
	document.addEventListener("ideviceediton", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.checkboxtable") {
			var ideviceId = evt.detail.ideviceId;
			if(!_idevices[ideviceId]) {
				_idevices[ideviceId] = new CheckboxTableIdevice(ideviceId);
			}
			
			_idevices[evt.detail.ideviceId].editOn();
		}
	}, false);
	
	document.addEventListener("ideviceeditoff", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.checkboxtable") {
			_idevices[evt.detail.ideviceId].editOff();
		}
	});
})();
