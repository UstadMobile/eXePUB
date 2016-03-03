var HelloIdevice = function(ideviceId) {
    this.ideviceId = ideviceId;
    this.bindEvents();
};

//Use Object.create to make a child class
HelloIdevice.prototype = Object.create(Idevice.prototype, {

	//put initial content in here
    onCreate: {
        value : function() {
            var myElement = this._getEl();
        	
        	var instructionsEl = document.createElement("div");
        	instructionsEl.textContent = "Your instructions here";
        	instructionsEl.setAttribute("class", "exe-editable");
        	instructionsEl.setAttribute("id", this.ideviceId +"_instructions");
        	myElement.appendChild(instructionsEl);
        	
        	var buttonEl = document.createElement("button");
        	buttonEl.textContent = "Say Hello";
        	myElement.appendChild(buttonEl);
        	this.bindEvents();
        }
    },
    
    
    //Allow user to author to edit: can use forms items, TinyMCE, etc.
    editOn: {
        value: function() {
            this.setTinyMceEnabled(true);// enables tinymce on all elements with exe-editable class
        	
            var buttonTextField = document.createElement("input");
            buttonTextField.value = this._getButtonEl().textContent;
            this._getButtonEl().style.display = "none";
            
            var labelInstructionsEl = document.createElement("div");
            labelInstructionsEl.setAttribute("class", "exe-editing-only")
            labelInstructionsEl.textContent = "Button Text:";
            
            this._getEl().appendChild(labelInstructionsEl);
            this._getEl().appendChild(buttonTextField);
        }
    },
    
    editOff: {
        value: function() {
            //Remove edit controls : update the HTML as needed, eXeLearning.net will save the HTML contents into the page on disk.
        	this.setTinyMceEnabled(false);
        	
        	var buttonTextField = this._getEl().querySelector("input");
        	this._getButtonEl().textContent = buttonTextField.value; 
        	this._getButtonEl().style.display = "inline";
        	
        	this._getEl().removeChild(buttonTextField);
        	this._getEl().removeChild(this._getEl().querySelector(".exe-editing-only"));
        }
    },

    _getButtonEl: {
    	value: function() {
    		return this._getEl().querySelector("button");
    	}
    },
    
    bindEvents: {
    	value: function() {
    		if(this._getButtonEl()) {
    			this._getButtonEl().addEventListener("click", 
    					this.sayHi.bind(this), false);
    		}
    	}
    },
    
    sayHi: {
    	value: function() {
    		alert("Hi!!");
    	}
    }
});

HelloIdevice.prototype.constructor = HelloIdevice;

Idevice.registerType("com.ustadmobile.helloidevice", HelloIdevice);
