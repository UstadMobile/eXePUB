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
		
	_makeEditLine: function() {
		var lineCont = $("<div/>", {
			'class' : "exe-score-feedback-editline exe-editing-only"
		});
		var varDropDown = $("<select/>");
		var varOpts = this.idevice.getVariableOptions();
		
		var i;
		var opt;
		for(i = 0; i < varOpts.length; i++) {
			opt = $("<option/>", {
				value : varOpts[i][0]
			});
			opt.text(varOpts[i][1]);
			varDropDown.append(opt);
		}
		
		lineCont.append(varDropDown);
		
		var conditionDropDown = $("<select/>");
		
		for(i = 0; i < this.operators.length; i++) {
			opt = $("<option/>", {
				value: this.operators[i]
			});
			opt.text(this.operators[i]);
			conditionDropDown.append(opt);
		}
		lineCont.append(conditionDropDown);
		
		var compareTo = $("<input/>", {
			'type' : 'text'
		});
		lineCont.append(compareTo);
		
		return lineCont;
	},
		
	editOn: function() {
		$(this.el).prepend(this._makeEditLine());
	},
	
	editOff: function() {
		$(this.el).find(".exe-editing-only").remove();
	},
		
	parseExpression: function() {
		
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




