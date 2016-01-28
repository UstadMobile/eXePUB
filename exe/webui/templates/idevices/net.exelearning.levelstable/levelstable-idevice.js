
var LevelsTableIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	this.availableCheckboxActivities = null;
	this.handleClickLevelBound = this.handleClickLevel.bind(this);
	this.bindEvents();
};

LevelsTableIdevice.prototype = {
	create: function() {
		
		 $("#id" + this.ideviceId).load("exe-files/idevices/net.exelearning.levelstable/levelstable-template.html .levels-table-template",
				 this.bindEvents.bind(this));
		 
	},
	
	handleClickLevel: function(evt) {
		var tdEl = evt.delegateTarget;
		var currentLevel = parseInt($(tdEl).attr('data-level'));
		currentLevel += 1;
		if(currentLevel > 2) {
			currentLevel = 0;
		}
		$(tdEl).attr('data-level', ""+currentLevel);
	},
	
	bindEvents: function() {
		$(".levels-box").off("click", this.handleClickLevelBound);
		$(".levels-box").on("click", this.handleClickLevelBound);
	},
	
	editOn: function() {
		if(this.availableCheckboxActivities === null) {
			eXeTinCan.getActivitiesByExtension(
				"http://www.ustadmobile.com/ns/tincan-ext-checkboxtable-parent",
				"true", {}, (function(matchingActivities) {
					this.availableCheckboxActivities = matchingActivities;
					this._editOn2();
				}).bind(this));
		}else {
			this._editOn2();
		}
	},
	
	_addRow: function() {
		var newRow = $("<tr/>", {
			'class': 'levels-table-template'
		});
		var newTd = $("<td class='levels-table-sourcerow'>&#160;</td>");
		newRow.append(newTd);
		for(var i = 0; i < 6; i++) {
			newRow.append("<td class='levels-box' data-level='0'>&#160;</td>");
		}
		
		$("#id" + this.ideviceId).find(".levels-table-template tr").last().after(newRow);
		this._editOnRow(newTd);
	},
	
	
	_editOn2: function() {
		var levelRows = $("#id" + this.ideviceId).find(".levels-table-sourcerow");
		for(var i = 0; i < levelRows.length; i++) {
			this._editOnRow(levelRows[i]);
		}
		
		var btnHolder = $("<div/>", {
			'class' : 'exe-editing-only'
		});
		var addSrcBtn = $("<button/>").text("Add Source");
		addSrcBtn.on("click", this._addRow.bind(this));
		btnHolder.append(addSrcBtn);
		
		$("#id" + this.ideviceId).find(".levels-table-template").last().after(btnHolder);
	},
	
	_editOnRow: function(row) {
		var rowEditor = $("<div/>", {
			'class' : "exe-editing-only"
		});
		
		var selectSrc = $("<select/>", {
			'class' : 'levels-table-selectsrc'
		});
		$(rowEditor).append(selectSrc);
		
		var sourceEls = this.availableCheckboxActivities;
		var currentSrc =  $(row).attr("data-src-checkbox-table");
		for(var i = 0; i < sourceEls.length; i++) {
			var opt = $("<option/>", {
				value: sourceEls[i].getAttribute("id")
			}).text(sourceEls[i].querySelector("name").textContent);
			if(currentSrc === sourceEls[i].getAttribute("id")) {
				opt.attr("selected", "selected");
			}
			selectSrc.append(opt);
		}
		
		
		$(rowEditor).append("Filter column:");
		
		var columnFilterIn = $("<input/>", {
			"size" : '2',
			'style' : 'width: 30px'
		}).css("width", "30px");
		if($(row)[0].hasAttribute("data-filter-col")) {
			columnFilterIn.val($(row).attr("data-filter-col"));
		}
		
		$(rowEditor).append(columnFilterIn);
		
		var deleteImg = $("<img/>", {
			"src" : "/images/stock-delete.png"
		});
		
		deleteImg.on("click", this._handleClickDeleteRow.bind(this));
		rowEditor.prepend(deleteImg);
		
		$(row).append(rowEditor);
	},
	
	_handleClickDeleteRow: function(evt) {
		$(evt.delegateTarget).closest("tr").remove();
	},
	
	editOff: function() {
		var levelRows = $("#id" + this.ideviceId).find(".levels-table-sourcerow");
		for(var i = 0; i < levelRows.length; i++) {
			var filterCol = $(levelRows[i]).find("input").val();
			$(levelRows[i]).attr("data-filter-col", filterCol);
			var dataSrc= $(levelRows[i]).find("select").val();
			$(levelRows[i]).attr("data-src-checkbox-table", dataSrc);
			$(levelRows[i]).text("Checked items from: " + 
					$(levelRows[i]).find("select option:selected").text());
		}
		
		$("#id" + this.ideviceId).find(".exe-editing-only").remove();
		this.bindEvents();
		
		var htmlToSave = eXeEpubAuthoring.getSavableHTML(document.getElementById("id" + this.ideviceId));
		eXeEpubAuthoring.saveIdeviceHTML(this.ideviceId, htmlToSave);
	}
};



(function() {
	var _idevices = {};
	
	var _initFn = function() {
		var allIdevices = document.querySelectorAll("div[data-idevice-type='net.exelearning.levelstable']");
		var deviceId;
		for(var i = 0; i < allIdevices.length; i++) {
			deviceId = allIdevices[i].getAttribute("id").substring(2);//idevice id attributes are prefixed by the letters 'id'
			_idevices[deviceId] = new LevelsTableIdevice(deviceId);
		}
	};
	
	if(document.readyState === "interactive" || document.readyState === "complete") {
		_initFn();
	}else {
		document.addEventListener("DOMContentLoaded", _initFn, false);
	}
	
	document.addEventListener("idevicecreate", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.levelstable") {
			var targetEl = evt.target || evt.srcElement;
			var ideviceId = evt.detail.ideviceId;
			_idevices[ideviceId] = new LevelsTableIdevice(ideviceId);
			_idevices[ideviceId].create();
		}
	}, false);
	
	document.addEventListener("ideviceediton", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.levelstable") {
			var ideviceId = evt.detail.ideviceId;
			if(!_idevices[ideviceId]) {
				_idevices[ideviceId] = new LevelsTableIdevice(ideviceId);
			}
			
			_idevices[evt.detail.ideviceId].editOn();
		}
	}, false);
	
	document.addEventListener("ideviceeditoff", function(evt) {
		if(evt.detail.ideviceType === "net.exelearning.levelstable") {
			_idevices[evt.detail.ideviceId].editOff();
		}
	});
})();
