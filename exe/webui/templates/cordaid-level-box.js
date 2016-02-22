/*

*/

var LevelBoxWidget = function(id) {
	this._getEl().addEventListener("click", this.handleClick.bind(this));
};

LevelBoxWidget._activeWidgets = {};

LevelBoxWidget.initLevelBox = function(id) {
	if(!LevelBoxWidget._activeWidgets[id]) {
		LevelBoxWidget._activeWidgets[id] = new LevelBoxWidget(id);
	}
};



LevelBoxWidget.prototype = {
	
	_getEl: function() {
		return document.getElementById("id" + id);
	},
	
	handleClick: function() {
		
	}
};
