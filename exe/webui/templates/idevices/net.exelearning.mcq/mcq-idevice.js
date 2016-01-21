
var eXeMCQIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
};

eXeMCQIdevice.prototype = {
	
	_nextBlockId : 0,
		
	create: function() {
		var el = this._getEl();
		var emphasisEl = $("<div/>", {
			"class" : "iDevice emphasis1"
		});
		
		
		var headerEl = $("<header/>", {
			"class" : "iDevice_header"
		});
		$(emphasisEl).append(headerEl);
		
		var titleEl = $("<h1/>", {
			"class" : "ideviceTitle"
		});
		$(titleEl).text("Multi Choice Exercise");
		$(headerEl).append(titleEl);
		
		var innerDiv = $("<div/>", {
			"class" : "iDevice_inner"
		});
		emphasisEl.append(innerDiv);
		
		var contentWrapperDiv = $("<div/>", {
			"class" : "iDevice_content_wrapper"
		});
		innerDiv.append(contentWrapperDiv);
		
		
		$(el).append(emphasisEl);
		this._addQuestionSection("0");
		this._addAnswerToQuestion("0", "1");
		this._addAnswerToQuestion("0", "2");
		this._updateAnswerSections("0");
	},
	
	/**
	 * Add a new question section to the given parent element
	 */
	_addQuestionSection: function(questionId) {
		var parentEl = $("#id" + this.ideviceId).find(
				".iDevice_content_wrapper");
		
		var questionSection = $("<section", {
			"class" : "question"
		});
		$(parentEl).append(questionSection);
		
		var formEl = $("<form/>", {
			name : "multi-choice-form-" + this.ideviceId + "_" + questionId,
			action: "#",
			onsubmit : "return false",
			"class": "activity-form"
		});
		$(parentEl).append(formEl);
		
		formEl.append("<h1 class=\"js-sr-av\">Question</h1>");
		var questionDiv = $("<div/>", {
			"id" : "taquestion" + this.ideviceId + "_" + questionId,
			"class" : "block question iDevice_content"
		});
		questionDiv.html("<p>Question Text Here</p>");
		formEl.append(questionDiv);
		
		var answersEl = $("<section/>", {
			"class" : "iDevice_answers"
		});
		formEl.append(answersEl);
		answersEl.append("<h1 class=\"js-sr-av\">Answers</h1>");
		
		var feedbackEl = $("<section/>", {
			"class" : "iDevice_feedbacks js-feedback"
		});
		feedbackEl.append("<h1 class=\"js-sr-av\">Feedback</h1>");
		formEl.append(feedbackEl);
	},
	
	_getNumAnswersForQuestion: function(questionId) {
		return this._getQuestionForm(questionId).find(".iDevice_answer").length;
	},
	
	_getQuestionForm: function(questionId) {
		return $("form[name='multi-choice-form-" + this.ideviceId + "_" + questionId + "']");
	},
	
	_addAnswerToQuestion: function(questionId, answerId) {
		//As per exe mcqs: a question lives inside of a form
		var questionFormEl  = this._getQuestionForm(questionId);
		var answersEl = $(questionFormEl).find(".iDevice_answers");
		var answerEl = $("<section/>", {
			"class" : "iDevice_answer" 
		});
		
		var pLabelHolder = $("<p/>", {
			"class" : "iDevice_answer-field js-required"
		});
		$(answerEl).append(pLabelHolder);
		var labelEl = $("<label/>", {
			"for" : "i" + this.ideviceId + "_" + answerId,
			"class" : "sr-av"
		});
		pLabelHolder.append(labelEl);
		
		var numAnswers = this._getNumAnswersForQuestion(questionId);
		labelEl.text("Option " + (numAnswers+1));
		
		var inputEl = $("<input/>", {
			"type" : "radio",
			"name" : "option" + this.ideviceId + "_" + questionId,
			"onclick" : "$exe.getFeedback(" + numAnswers + "," +
				(numAnswers+1) + ", '" + this.ideviceId + "_" + questionId + "', " +
				"'multi')"
		});
		pLabelHolder.append(inputEl);
		
		var answerOuterDiv = $("<div/>", {
			"class" : "iDevice_answer-content",
			id : "answer-" + this.ideviceId + "_" + answerId
		});
		answerEl.append(answerOuterDiv);
		
		var answerInnerDiv = $("<div/>", {
			id: "taans" + this.ideviceId + "_" + answerId,
			"class": "block iDevice_content"
		});
		answerInnerDiv.text("Answer Content");
		answerOuterDiv.append(answerInnerDiv);
		
		$(answersEl).append(answerEl);
		
		//make the feedback element for this answer
		var feedbacksSection = questionFormEl.find(".iDevice_feedbacks");
		var feedbackSection = $("<section/>", {
			id: "sa" + numAnswers + "b" + this.ideviceId + "_" + questionId,
			"class" : "feedback js-hidden"
		});
		feedbacksSection.append(feedbackSection);
		var feedbackDiv = $("<div/>", {
			"id" : "taf" + this.ideviceId + "_" + answerId,
			"class" : "iDevice_content"
		});
		feedbackDiv.text("Answer Feedback");
		feedbackSection.append(feedbackDiv);
		feedbacksSection.append(feedbackSection);
	},
	
	_updateAnswerSections: function(questionId) {
		var ideviceId = this.ideviceId;
		var numAnswers = this._getNumAnswersForQuestion(questionId);
		$(this._getQuestionForm(questionId)).find(".iDevice_answer").each(function(index) {
			var inputEl = $(this).find("input");
			$(inputEl).attr("onclick", "$exe.getFeedback(" +
				index + ", " + numAnswers + ",'" + ideviceId + "_" +
				questionId + "', 'multi')");
		});
	},
	
	_getEl: function() {
		return document.getElementById("id" + this.ideviceId);
	},
		
		
	editOn: function() {
		
	},
	
	editOff: function() {
		
	}
};

(function() {
	var _mcqIdevices = {};
	
	document.addEventListener("idevicecreate", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.mcq") {
			var targetEl = evt.target || evt.srcElement;
			var ideviceId = evt.detail.ideviceId;
			_mcqIdevices[ideviceId] = new eXeMCQIdevice(ideviceId);
			_mcqIdevices[ideviceId].create();
		}
	}, false);
	
	
	
})();






