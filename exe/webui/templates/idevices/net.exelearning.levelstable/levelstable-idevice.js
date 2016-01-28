
var LevelsTableIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
};

LevelsTableIdevice.prototype = {
	create: function() {
		 $("#id" + this.ideviceId).load("exe-files/idevices/net.exelearning.levelstable/levelstable-template.html .levels-table-template");
	},
	
	editOn: function() {
		var levelRows = $("#id" + this.ideviceId).find(".levels-table-sourcerow");
		for(var i = 0; i < levelRows.length; i++) {
			this._editOnRow(levelRows[i]);
		}
	},
	
	_editOnRow: function(row) {
		var rowEditor = $("<div/>", {
			'class' : "exe-editing-only"
		});
		
		var selectSrc = $("<select/>", {
			'class' : 'levels-table-selectsrc'
		});
		$(rowEditor).append(selectSrc);
		
		$(rowEditor).append("Filter column:");
		
		var columnFilterIn = $("<input/>", {
			"size" : '2',
			'style' : 'width: 30px'
		}).css("width", "30px");
		if($(row)[0].hasAttribute("data-filter-col")) {
			columnFilterIn.val($(row).attr("data-filter-col"));
		}
		
		$(rowEditor).append(columnFilterIn);
		
		$(row).append(rowEditor);
	},
	
	editOff: function() {
		var levelRows = $("#id" + this.ideviceId).find(".levels-table-sourcerow");
		for(var i = 0; i < levelRows.length; i++) {
			var filterCol = $(levelRows[i]).find("input").val();
			$(levelRows[i]).attr("data-filter-col", filterCol);
		}
		
		$("#id" + this.ideviceId).find(".exe-editing-only").remove();
	}
};



(function() {
	var _idevices = {};
	
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
