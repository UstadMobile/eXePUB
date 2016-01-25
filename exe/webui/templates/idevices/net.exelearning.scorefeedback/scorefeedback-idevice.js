/**
 * 
 */

var ScoreFeedbackIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	this.scoreFeedbackItems = [];
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
	
	_addScoreFeedbackItem: function() {
		newFeedbackItem = $("<div/>", {
			"class" : "exe-score-feedback",
			"data-expression" : ""
		});
		newFeedbackItem.text("Feedback if matched");
		$(this._getEl()).append(newFeedbackItem);
		
		var newItem = new ScoreFeedbackItem(newFeedbackItem.get(0), this);
		this.scoreFeedbackItems.push(newItem);
	}
	
	
};


var ScoreFeedbackItem = function(el, idevice) {
	this.el = el;
	this.idevice = idevice;
}

ScoreFeedbackItem.prototype = {
	
	operators: ["=", ">", ">=", "<", "<="],
	
	getVarFnName: "eXeTinCan.getPkgStateValue(",
	
	_makeEditLine: function(joiner, varName, operator, compareTo) {
		var lineCont = $("<div/>", {
			'class' : "exe-scfb-editline exe-editing-only"
		});
		var varDropDown = $("<select/>", {
			'class': 'exe-scfb-varselect'
		});
		var varOpts = this.idevice.getVariableOptions();
		
		var i;
		var opt;
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
		
		return lineCont;
	},
	
	_buildExpressionFromEditor: function(editEl) {
		var editorLines = $(editEl).find(".exe-scfb-editline");
		var currentLine;
		var expr = "";
		for(var i = 0; i < editorLines.length; i++) {
			currentLine = $(editorLines.get(i));
			//TODO: check if this editor line has and/or
			
			expr += "eXeTinCan.getPkgStateValue(\"";
			expr += currentLine.find(".exe-scfb-varselect").val();
			expr += "\") ";
			expr += currentLine.find(".exe-scfb-conditionselect").val();
			expr += currentLine.find(".exe-scfb-compareto").val();
		}
		
		return expr;
	},
		
	editOn: function() {
		var $editLinesContainer = $("<div/>", {
			'class' : 'exe-editing-only exe-scfb-editlinecont'
		});
		var currentExpr = $(this.el).attr("data-expression");
		$($editLinesContainer).append(this._expressionToEditorEls(currentExpr))
		
		$(this.el).prepend($editLinesContainer);
	},
	
	editOff: function() {
		//build the expression
		var expr = this._buildExpressionFromEditor($(this.el).find(".exe-scfb-editlinecont"));
		$(this.el).attr("data-expression", expr);
		$(this.el).find(".exe-editing-only").remove();
		
	},
		
	_expressionToEditorEls: function(str) {
		if(str === "") {
			//it's blank - nothing here...
			return this._makeEditLine();
		}
		
		var fnStart = str.indexOf(this.getVarFnName);
		var quoteRegEx = /\'|\"/;
		var quoteStartIndex = quoteRegEx.exec(str).index;
		var quoteLength = quoteRegEx.exec(str.substring(quoteStartIndex+1)).index+1;
		var varName = str.substring(quoteStartIndex+1, quoteStartIndex + quoteLength);
		
		var operatorRegEx = /(=|<=|>=|>|<)/;
		var operatorMatch = operatorRegEx.exec(str);
		var operator = operatorMatch[0];
		
		var compareTo = str.substring(operatorMatch.index + operator.length).trim();
		
		return this._makeEditLine("&&", varName, operator, compareTo);
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




