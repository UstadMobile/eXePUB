/**
 * 
 */

var ScoreFeedbackIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.scoreFeedbackItems = [];
	var scoreFeedbackEls = $("#id" + ideviceId).find(".exe-score-feedback");
	for(var i = 0; i < scoreFeedbackEls.length; i++) {
		this.scoreFeedbackItems.push(new ScoreFeedbackItem(
			scoreFeedbackEls.get(i), this));
	}
	
	this.choiceActivities = null;
}

ScoreFeedbackIdevice.prototype = {
		
	create: function() {
		this._addScoreFeedbackItem();
	},
	
	editOn: function() {
		if(this.choiceActivities === null) {
			eXeTinCan.getActivitiesByInteractionType(['choice'], {context: this}, function(activitiesArr) {
				this.choiceActivities = activitiesArr;
				this._editOn2();
			});
		}else {
			this._editOn2();
		}
	},
	
	/**
	 * This runs once we have the choiceActivities list...
	 */
	_editOn2: function() {
		for(var i = 0; i < this.scoreFeedbackItems.length; i++) {
			this.scoreFeedbackItems[i].editOn();
		}
	},
	
	editOff: function() {
		for(var i = 0; i < this.scoreFeedbackItems.length; i++) {
			this.scoreFeedbackItems[i].editOff();
		}
		
		var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
		eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
	},
	
	getVariableOptions: function() {
		var opts = [['score', 'Total Score']];
		var actName;
		var actId;
		
		for(var i = 0; i < this.choiceActivities.length; i++) {
			var actName = "Score: " + this.choiceActivities[i].querySelector("name").textContent;
			var actId = this.choiceActivities[i].getAttribute("id");
			opts.push([actId, actName]);
		}
		
		return opts;
	},
	
	
	_getEl: function() {
		return document.getElementById("id" + this.ideviceId);
	},
	
	_getNextBlockId: function() {
		var allBlocks = $(this._getEl()).find(".exe-score-feedback");
		var maxId = 0;
		for(var i = 0; i < allBlocks.length; i++) {
			maxId = Math.max(maxId, parseInt($(allBlocks.get(i)).attr("data-block-id")));
		}
		
		return maxId;
	},
	
	_addScoreFeedbackItem: function() {
		var newBlockId = this._getNextBlockId();
		newFeedbackItem = $("<div/>", {
			"class" : "exe-score-feedback",
			"data-expression" : "",
			"data-block-id" : "" + newBlockId
		});
		newFeedbackItem.append($("<div/>", {
			"class" : "exe-score-feedback-content",
			"id" : "exe_sfbc_" + this.ideviceId + "_" + newBlockId
		}).text("feedback if matched"));
		$(this._getEl()).append(newFeedbackItem);
		
		var newItem = new ScoreFeedbackItem(newFeedbackItem.get(0), this);
		this.scoreFeedbackItems.push(newItem);
	}
	
	
};


var ScoreFeedbackItem = function(el, idevice) {
	this.el = el;
	this.idevice = idevice;
	this.blockId = $(el).attr("data-block-id")
}

ScoreFeedbackItem.prototype = {
	
	operators: ["=", ">", ">=", "<", "<="],
	
	joiners: [['&&', 'AND'], ['||', 'OR']],
	
	getVarFnName: "eXeTinCan.getPkgStateValue(",
	
	_makeEditLine: function(joiner, varName, operator, compareTo) {
		var i;
		var opt;
		
		
		var lineCont = $("<div/>", {
			'class' : "exe-scfb-editline exe-editing-only"
		});
		
		if(joiner) {
			var joinerSelect = $("<select/>", {
				'class' : 'exe-scfb-joinerselect'
			});
			for(i = 0; i < this.joiners.length; i++) {
				opt = $("<option/>", {
					value : this.joiners[i][0]
				}).text(this.joiners[i][1]);
				if(joiner === this.joiners[i][0]) {
					opt.attr("selected", "selected");
				}
				joinerSelect.append(opt);
			}
			lineCont.append(joinerSelect);
		}
		
		var varDropDown = $("<select/>", {
			'class': 'exe-scfb-varselect'
		});
		var varOpts = this.idevice.getVariableOptions();
		
		for(i = 0; i < varOpts.length; i++) {
			opt = $("<option/>", {
				value : varOpts[i][0]
			});
			
			if(varName === varOpts[i][0]) {
				opt.attr("selected", "selected");
			}
			
			opt.text(varOpts[i][1]);
			varDropDown.append(opt);
		}
		
		lineCont.append(varDropDown);
		
		var conditionDropDown = $("<select/>", {
			'class' : 'exe-scfb-conditionselect'
		});
		
		for(i = 0; i < this.operators.length; i++) {
			opt = $("<option/>", {
				value: this.operators[i]
			});
			
			if(operator === this.operators[i]) {
				opt.attr("selected", "selected");
			}
			
			opt.text(this.operators[i]);
			conditionDropDown.append(opt);
		}
		lineCont.append(conditionDropDown);
		
		var compareVal = typeof compareTo !== "undefined" ? compareTo : "";
		var compareTo = $("<input/>", {
			'type' : 'text',
			'class' : 'exe-scfb-compareto',
			'value' : compareVal
		});
		lineCont.append(compareTo);
		if(joiner) {
			var delButton = $("<img/>", {
				"src" : "/images/stock-delete.png"
			}).on("click", this.handleClickDeleteExprLine.bind(this));
			lineCont.append(delButton);
		}
		
		
		return lineCont;
	},
	
	handleClickDeleteExprLine: function(evt) {
		$(evt.delegateTarget).closest(".exe-scfb-editline").remove();
	},
	
	_buildExpressionFromEditor: function(editEl) {
		var editorLines = $(editEl).find(".exe-scfb-editline");
		var currentLine;
		var expr = "";
		for(var i = 0; i < editorLines.length; i++) {
			currentLine = $(editorLines.get(i));
			//TODO: check if this editor line has and/or
			if(i > 0) {
				expr += currentLine.find(".exe-scfb-joinerselect").val() + " ";
			}
			
			expr += "eXeTinCan.getPkgStateValue(\"";
			expr += currentLine.find(".exe-scfb-varselect").val();
			expr += "\") ";
			expr += currentLine.find(".exe-scfb-conditionselect").val();
			expr += currentLine.find(".exe-scfb-compareto").val();
		}
		
		return expr;
	},
		
	editOn: function() {
		var $editControlsContainer = $("<div/>", {
			'class' : 'exe-editing-only exe-scfb-editctrls'
		});
		var $editLinesContainer = $("<div/>", {
			'class' : 'exe-editing-only exe-scfb-editlinecont'
		});
		var currentExpr = $(this.el).attr("data-expression");
		var editorEls = this._expressionToEditorEls(currentExpr);
		for(var i = 0; i < editorEls.length; i++) {
			$editLinesContainer.append(editorEls[i]);
		}
		var addExprImg = $("<img/>", {
			'src' : '/images/stock-add.png'
		});
		addExprImg.on("click", this.handleClickAddExpr.bind(this));
		$editControlsContainer.append($editLinesContainer);
		$editControlsContainer.append(addExprImg);
		
		eXeEpubAuthoring.setTinyMceEnabledById("exe_sfbc_" + this.idevice.ideviceId 
				+ "_" + this.blockId, true);
		
		$(this.el).prepend($editControlsContainer);
	},
	
	handleClickAddExpr: function(evt) {
		$(this.el).find(".exe-scfb-editlinecont").append(this._makeEditLine("&&"));
	},
	
	editOff: function() {
		//build the expression
		var expr = this._buildExpressionFromEditor($(this.el).find(".exe-scfb-editlinecont"));
		$(this.el).attr("data-expression", expr);
		$(this.el).find(".exe-editing-only").remove();
		eXeEpubAuthoring.setTinyMceEnabledById("exe_sfbc_" + this.idevice.ideviceId 
				+ "_" + this.blockId, false);
	},
		
	_expressionToEditorEls: function(expression) {
		if(expression === "") {
			//it's blank - nothing here...
			return [this._makeEditLine()];
		}
		
		var editorEls = [];
		var myRe = /\|\||&&/;
		var startPos = 0;
		
		var nextMatch;
		var exprRemaining = expression;
		var lastJoiner = null;
		
		do{
			nextMatch = myRe.exec(exprRemaining);
			var currentSection = exprRemaining.substring(0, nextMatch ? nextMatch.index : exprRemaining.length);
			var fnStart = currentSection.indexOf(this.getVarFnName);
			var quoteRegEx = /\'|\"/;
			var quoteStartIndex = quoteRegEx.exec(currentSection).index;
			var quoteLength = quoteRegEx.exec(currentSection.substring(quoteStartIndex+1)).index+1;
			var varName = currentSection.substring(quoteStartIndex+1, quoteStartIndex + quoteLength);
			
			var operatorRegEx = /(=|<=|>=|>|<)/;
			var operatorMatch = operatorRegEx.exec(currentSection);
			var operator = operatorMatch[0];
			
			var compareTo = currentSection.substring(operatorMatch.index + operator.length).trim();
			
			editorEls.push(this._makeEditLine(lastJoiner, varName, operator, compareTo));
			
			if(nextMatch != null) {
				lastJoiner = nextMatch[0];
				exprRemaining = exprRemaining.substring(nextMatch.index+nextMatch[0].length)
			}
		}while (nextMatch != null); 
		
		
		return editorEls;
	}
		
};

(function() {
	var _idevices = {};
	
	document.addEventListener("idevicecreate", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.scorefeedback") {
			var targetEl = evt.target || evt.srcElement;
			var ideviceId = evt.detail.ideviceId;
			_idevices[ideviceId] = new ScoreFeedbackIdevice(ideviceId);
			_idevices[ideviceId].create();
		}
	}, false);
	
	document.addEventListener("ideviceediton", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.scorefeedback") {
			var ideviceId = evt.detail.ideviceId;
			if(!_idevices[ideviceId]) {
				_idevices[ideviceId] = new ScoreFeedbackIdevice(ideviceId);
			}
			
			_idevices[evt.detail.ideviceId].editOn();
		}
	}, false);
	
	document.addEventListener("ideviceeditoff", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.scorefeedback") {
			_idevices[evt.detail.ideviceId].editOff();
		}
	});
})();




