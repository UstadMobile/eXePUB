
function eXeMCQIdevice(ideviceId) {
	Idevice.call(this, ideviceId);
	this._nextBlockId = 0;
	this._handleAnswerSelectedBound = this.handleAnswerSelected.bind(this);
	this.bindEvents();
}

eXeMCQIdevice.prototype = Object.create(Idevice.prototype, {
	
	onCreate: {
		value: function() {
			var el = this._getEl();
			var emphasisEl = $("<div/>", {
				"class" : "iDevice emphasis1"
			});
			
			
			var headerEl = $("<header/>", {
				"class" : "iDevice_header"
			});
			$(emphasisEl).append(headerEl);
			
			var titleEl = $("<h1/>", {
				"class" : "ideviceTitle",
				"id" : "exe-mcq-title-" + this.ideviceId
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
			
		},
		enumerable: true,
	    configurable: true, 
	    writable: true
	},
	
	bindEvents: {
		value : function() {
			var inputEls = $(this._getEl()).find("input");
			var currentId;
			for(var i = 0; i < inputEls.length; i++) {
				currentId = $(inputEls.get(i)).attr("id");
				if(currentId && currentId.charAt(0) === 'i') {
					//make sure to remove any previous handlers
					$(inputEls.get(i)).off("click", this._handleAnswerSelectedBound);
					$(inputEls.get(i)).on("click", this._handleAnswerSelectedBound);
				}
			}
		}
	},
	
	handleAnswerSelected: {
		value: function(evt) {
			//when coming from the input element itself. get the id 
			//will be in the form of ideviceId_blockId e.g. 0_4
			var id = $(evt.delegateTarget).attr("id").substring(1);
			var answerEl = $("#answer-" +id);
			var stmtOpts = {
				result: {
					response: id
				}
			};
			
			var answerScore = $(answerEl).attr("data-score");
			if(typeof answerScore !== "undefined" && answerScore !== "") {
				stmtOpts.result.score = {
					raw : parseFloat(answerScore)
				};
			}
			
			//get the TinCan base id first; then send the statement
			eXeTinCan.getPackageTinCanID(function(err, packageTinCanId) {
				var stmt = eXeTinCan.makeAnsweredStmt(packageTinCanId + "-" + this.ideviceId, stmtOpts);
				eXeTinCan.sendStatement(stmt);
			}, { context: this});
		}
	},
	
	
	/**
	 * Add a new question section to the given parent element
	 */
	_addQuestionSection: {
		value: function(questionId) {
			var parentEl = $("#id" + this.ideviceId).find(
			".iDevice_content_wrapper");
	
			var questionSection = $("<section/>", {
				"class" : "question"
			});
			$(parentEl).append(questionSection);
			
			var formEl = $("<form/>", {
				name : "multi-choice-form-" + this.ideviceId + "_" + questionId,
				action: "#",
				onsubmit : "return false",
				"class": "activity-form"
			});
			$(questionSection).append(formEl);
			
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
		enumerable: true,
	    configurable: true, 
	    writable: true
	},
		
	_getNumAnswersForQuestion: {
		value: function(questionId) {
			return this._getQuestionForm(questionId).find(".iDevice_answer").length;
		} 
	},
	
	_getQuestionForm: {
		value: function(questionId) {
			return $("form[name='multi-choice-form-" + this.ideviceId + "_" + questionId + "']");
		},
	},
	
	_getNextBlockId: {
		value: function() {
			var currentMax = 0;
			var questionIds = this._getQuestionIds();
			var thisVal;
			for(var i = 0; i < questionIds.length; i++) {
				try {
					thisVal = parseInt(questionIds[i]);
					currentMax = Math.max(thisVal, currentMax);
				}catch(err) {
					//do nothing - not a numerical id
				}
				
				var answerIds = this._getAnswerIds(questionIds[i]);
				for(var j = 0; j < answerIds.length; j++) {
					try {
						thisVal = parseInt(answerIds[j]);
						currentMax = Math.max(thisVal, currentMax);
					}catch(err){
						//do nothing - not a numerical id
					}
				}
			}
			
			return currentMax + 1;
		}
	}, 
	
	_getQuestionIds: {
		value: function() {
			var questionIds = [];
			var questionEls = $("#id" + this.ideviceId).find(".block.question.iDevice_content");
			
			var currentId = null;
			for(var i = 0; i < questionEls.length; i++) {
				currentId = $(questionEls[i]).attr("id");
				if(currentId) {
					//The question id itself has an id in the form of taquestionX_YY
					currentId = currentId.substring(currentId.indexOf("_")+1);
					questionIds.push(currentId);
				}
			}
			
			return questionIds;
		}
	},
	
	_getAnswerIds: {
		value: function(questionId) {
			var answerInputEls =  this._getQuestionForm(questionId).find("input");
			var answerIds = [];
			var currentId;
			for(var i = 0; i < answerInputEls.length; i++) {
				currentId = answerInputEls[i].getAttribute("id");
				if(currentId && currentId.charAt(0) === 'i') {
					answerIds.push(currentId.substring(currentId.indexOf("_") + 1));
				}
			}
			
			return answerIds;
		}
	}, 
		
	
	handleClickAddQuestion: {
		value: function(evt) {
			var newQuestionId = ""+this._getNextBlockId();
			this._addQuestionSection(newQuestionId);
			eXeEpubAuthoring.setTinyMceEnabledById("taquestion" + this.ideviceId + 
					"_" + newQuestionId, true);
			
			for(var i = 0; i < 2; i++) {
				this.handleClickAddAnswer({ 
					data: {
						questionId : newQuestionId
					}
				});
			}
			
			this._addEditControlsToQuestion(newQuestionId);
		}
	},
	
	handleClickAddAnswer: {
		value: function(evt) {
			var questionId = evt.data.questionId;
			var newAnswerId = this._getNextBlockId();
			this._addAnswerToQuestion(questionId, "" + newAnswerId);
			this._setAnswerToEditingMode(questionId, newAnswerId, 
					this._getNumAnswersForQuestion(questionId)-1);
			eXeEpubAuthoring.setTinyMceEnabledById("taans" + this.ideviceId 
					+ "_" + newAnswerId, true);
			eXeEpubAuthoring.setTinyMceEnabledById("taf" + this.ideviceId 
					+ "_" + newAnswerId, true);
		}
	},
		
	
	_addAnswerToQuestion: {
		value: function(questionId, answerId) {
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
				"id" : "i" + this.ideviceId + "_" + answerId,
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
			this._updateAnswerSections(questionId);
		} 
	}, 
	
	_updateAnswerSections: {
		value: function(questionId) {
			var ideviceId = this.ideviceId;
			var numAnswers = this._getNumAnswersForQuestion(questionId);
			$(this._getQuestionForm(questionId)).find(".iDevice_answer").each(function(index) {
				var inputEl = $(this).find("input");
				$(inputEl).attr("onclick", "$exe.getFeedback(" +
					index + ", " + numAnswers + ",'" + ideviceId + "_" +
					questionId + "', 'multi')");
			});
		}
	},
	
	/**
	 * Make a list of all element ids that tinymce should be
	 * enabled on
	 */
	_getEditableElIds: {
		value :function() {
			var questionIds = this._getQuestionIds();
			var editableIds = ["exe-mcq-title-" + this.ideviceId];
			
			var answerIds;
			var j;
			for(var i = 0; i < questionIds.length; i++) {
				editableIds.push("taquestion" + this.ideviceId + "_" + questionIds[i]);
				
				answerIds = this._getAnswerIds(questionIds[i]);
				for(j = 0; j < answerIds.length; j++) {
					//The answer element itself
					editableIds.push("taans" + this.ideviceId + "_" + answerIds[j]);
					//The feedback element
					editableIds.push("taf" + this.ideviceId + "_" + answerIds[j]);
				}
			}
			
			return editableIds;
		}
	},
	
	/**
	 * Runs the given function for each potential answer for
	 * every question.  The function should take three arguments:
	 * the questionId, the answerId and the answer index
	 */
	_runOnEachAnswer: {
		value: function(fn) {
			var questionIds = this._getQuestionIds();
			
			var j;
			var answerIds;
			for(var i = 0; i < questionIds.length; i++) {
				answerIds = this._getAnswerIds(questionIds[i]);
				for(j = 0; j < answerIds.length; j++) {
					fn.apply(this, [questionIds[i], answerIds[j], j]);
				}
			}
		}
	}, 
	
	editOn: {
		value: function() {
			var editableIds = this._getEditableElIds();
			for(var i = 0; i < editableIds.length; i++){
				eXeEpubAuthoring.setTinyMceEnabledById(editableIds[i], true);
			}
			
			var questionIds = this._getQuestionIds();
			var questionFormEl;
			for(var i = 0; i < questionIds.length; i++) {
				this._addEditControlsToQuestion(questionIds[i]);
			}
			
			var addQuestionEl = $("<button class='exe_edit_addquestion exe-editing-only'>Add Question</button>");
			addQuestionEl.on("click", this.handleClickAddQuestion.bind(this));
			$("#id" + this.ideviceId).find(".iDevice_inner").append(addQuestionEl);
			
			this._runOnEachAnswer(this._setAnswerToEditingMode.bind(this));
		},
		configurable: true,
		enumerable: true,
		writable: true
	
	},
	
	_addEditControlsToQuestion: {
		value: function(questionId) {
			var addAnswerEl = $("<button class='exe_edit_addanswer exe-editing-only'>Add Answer</button>");
			addAnswerEl.on("click", { questionId : questionId },
					this.handleClickAddAnswer.bind(this));
			questionFormEl = this._getQuestionForm(questionId);
			$(questionFormEl).find(".iDevice_answers").after(addAnswerEl);
			
			var deleteAnswerImg = $("<img/>", {
				src: "/images/stock-delete.png",
				"class" : "exe-mcq-delete-button"
			});
			deleteAnswerImg.on("click", {
				questionId : questionId
			}, this.handleClickDeleteQuestion.bind(this));
			var deleteQuestionDiv = $("<div/>", {
				"class": "exe-editing-only exe-mcq-delete-holder"
			});
			deleteQuestionDiv.append(deleteAnswerImg);
			
			$(this._getQuestionForm(questionId)).prepend(deleteQuestionDiv);
		}
	},
	
	/**
	 * Enable editing of feedback for the given answer by shifting its 
	 * feedback element
	 */
	_setAnswerToEditingMode: {
		value: function(questionId, answerId, answerIndex) {
			var feedbackElId = "taf" + this.ideviceId + "_" + answerId;
			var feedbackEl = $("#" + feedbackElId).detach();
			var answerContentEl = $("#answer-" + this.ideviceId + "_" + answerId);
			answerContentEl.append("<div class='exe-editing-only'>Feedback:</div>");
			answerContentEl.append(feedbackEl);
			answerContentEl.append("<div class='exe-editing-only'>Score:</div>");
			var currentAnswerScore = answerContentEl.attr("data-score") || "";
			
			answerContentEl.append($("<input/>", {
				id : "exe-mcq-score-" +this.ideviceId + "_" + questionId 
					+ "_" + answerId,
				value : currentAnswerScore,
				'class' : "exe-editing-only exe-mcq-score-input"
			}));
			
			var deleteAnswerImg = $("<img/>", {
				src: "/images/stock-delete.png",
				"class" : "exe-mcq-delete-button"
			});
			
			
			deleteAnswerImg.on("click", { 
					answerId : answerId, 
					questionId: questionId
				}, this.handleClickDeleteAnswer.bind(this));
			
			var deleteAnswerDiv = $("<div/>", {
				"class" : "exe-editing-only exe-mcq-delete-holder"
			});
			deleteAnswerDiv.append(deleteAnswerImg);
			
			answerContentEl.closest(".iDevice_answer").prepend(deleteAnswerDiv);
			
		} 
	},
	
	
	
	handleClickDeleteAnswer: {
		value: function(evt) {
			var answerId = evt.data.answerId;
			var numAnswers = this._getNumAnswersForQuestion(evt.data.questionId);
			
			var answerEl = $("#answer-" + this.ideviceId + "_" + answerId).closest(".iDevice_answer");
			eXeEpubAuthoring.removeAllTinyMceInstances(answerEl[0]);
			answerEl.remove();
			
			var feedbackEl = $("#taf" + this.ideviceId + "_" + answerId)
			eXeEpubAuthoring.removeAllTinyMceInstances(feedbackEl[0]);
			feedbackEl.remove();
			
			//Remove the last indexed hidden feedback holder
			$("#sa" + (numAnswers-1) + "b" + this.ideviceId + "_" + evt.data.questionId).remove();
			
			this._updateAnswerSections(evt.data.questionId);
		}
	},
	
	handleClickDeleteQuestion: {
		value:  function(evt) {
			var questionId = evt.data.questionId;
			var questionEl = this._getQuestionForm(questionId).parent();
			eXeEpubAuthoring.removeAllTinyMceInstances(questionEl[0]);
			questionEl.remove();
		},
	},
	
	editOff: {
		value: function() {
			var editableIds = this._getEditableElIds();
			for(var i = 0; i < editableIds.length; i++){
				eXeEpubAuthoring.setTinyMceEnabledById(editableIds[i], false);
			}
			
			this._runOnEachAnswer(function(questionId, answerId, answerIndex) {
				var feedbackElId = "taf" + this.ideviceId + "_" + answerId;
				var feedbackElHiderId = "sa" + answerIndex +"b" + this.ideviceId + 
					"_" + questionId;
				$("#" + feedbackElHiderId).append($("#" + feedbackElId).detach());
				var score = $("#answer-" + this.ideviceId + "_" + answerId).find(".exe-mcq-score-input").val();
				$("#answer-" + this.ideviceId + "_" + answerId).attr("data-score", score);
			});
			
			$("#id" + this.ideviceId).find(".exe-editing-only").remove();
			
			var htmlToSave = eXeEpubAuthoring.getSavableHTML(this._getEl());
			eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
			
			var activitiesXML = this.makeTinCanActivities();
			var tinCanStr = new XMLSerializer().serializeToString(activitiesXML);
			eXeEpubAuthoring.saveIdeviceTinCanXML(this.ideviceId, tinCanStr);
			this.bindEvents();
		},
		configurable: true,
		writable: true,
		enumerable: true
	}, 
		
	
	/**
	 * Generate a set of tincan activities for this 
	 */
	makeTinCanActivities: {
		value: function() {
			var ns = eXeEpubAuthoring.NS_TINCAN;
			var xmlDoc = document.implementation.createDocument(ns, "activities");
			var questionIds = this._getQuestionIds();
			for(var i = 0; i < questionIds.length; i++) {
				var activityEl = xmlDoc.createElementNS(ns, "activity");
				activityEl.setAttribute("id", this.ideviceId + "_" + 
						questionIds[i]);
				
				//for now set name and desc to be the same
				var questionTextEls = ["name", "description"];
				for(var j = 0; j < questionTextEls.length; j++) {
					var questionTextEl = xmlDoc.createElementNS(ns, questionTextEls[j]);
					questionTextEl.setAttribute("lang", "en");
					questionTextEl.textContent = $("#taquestion" + this.ideviceId + "_" + questionIds[i]).text();
					activityEl.appendChild(questionTextEl);
				}
				
				var interactionTypeEl = xmlDoc.createElementNS(ns, "interactionType");
				interactionTypeEl.textContent = "choice";
				activityEl.appendChild(interactionTypeEl);
				
				var choicesEl = xmlDoc.createElementNS(ns, "choices");
				activityEl.appendChild(choicesEl);
				
				var answerIds = this._getAnswerIds(questionIds[i]);
				for(var k = 0; k < answerIds.length; k++) {
					var compEl = xmlDoc.createElementNS(ns, "component");
					var idEl = xmlDoc.createElementNS(ns, "id");
					idEl.textContent = this.ideviceId + "_" + answerIds[k];
					compEl.appendChild(idEl);
					
					var descEl = xmlDoc.createElementNS(ns, "description");
					descEl.setAttribute("lang", "en");
					descEl.textContent = $("#taans" + this.ideviceId + "_" + answerIds[k]).text();
					compEl.appendChild(descEl);
					choicesEl.appendChild(compEl);
				}
				xmlDoc.documentElement.appendChild(activityEl);
			}
			
			return xmlDoc;
		}
	}
});

eXeMCQIdevice.prototype.constructor = eXeMCQIdevice;

Idevice.registerType("net.exelearning.mcq", eXeMCQIdevice);
