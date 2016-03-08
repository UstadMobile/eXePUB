/*

*/
var LevelBoxWidget = function(id, opts) {
	this.id = id;
	if(!this._getEl() && opts.container) {
		var newEl = document.createElement("img");
		newEl.setAttribute("class", "cordaid-level-box-widget");
		newEl.setAttribute("id", "id" + id);
		newEl.setAttribute("data-level", "0");
		newEl.setAttribute("src", "exe-files/common/cordaid-level0.png");
		opts.container.appendChild(newEl);
	}
	
	this._getEl().addEventListener("click", this.handleClick.bind(this));
	this.onLevelChange = null;
};

LevelBoxWidget._activeWidgets = {};

LevelBoxWidget.initLevelBox = function(id, opts) {
	if(!LevelBoxWidget._activeWidgets[id]) {
		var newWidget = new LevelBoxWidget(id, opts);
		LevelBoxWidget._activeWidgets[id] = newWidget;
	}
	
	return LevelBoxWidget._activeWidgets[id];
};

LevelBoxWidget.getBoxById = function(id){
	return LevelBoxWidget._activeWidgets[id];
};

LevelBoxWidget.prototype = {
	
	_getEl: function() {
		return document.getElementById("id" + this.id);
	},
	
	getLevel: function() {
		var level = this._getEl().getAttribute("data-level");
		if(typeof level === "string") {
			level = parseInt(level);
		}else {
			level = 0;
		}
		
		//should not really happen... but just in case
		if(isNaN(level)) {
			level = 0;
		}
		
		return level;
	},
	
	setLevel: function(level) {
		this._getEl().setAttribute("data-level", level);
		this._getEl().setAttribute("src", "exe-files/common/cordaid-level" 
				+ level + ".png");
	},
	
	setOnLevelChange: function(onLevelChangeFn) {
		this.onLevelChange = onLevelChangeFn;
	},
	
	handleClick: function() {
		var level = this.getLevel();
		level += 1;
		if(level > 2) {
			level = 0;
		}
		this.setLevel(level);
		if(typeof this.onLevelChange === "function") {
			this.onLevelChange(this, level);
		}
	}
};
