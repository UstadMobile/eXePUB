# Idevice Development Howto

Idevices are user editable templates (like multi choice questions, sorting exercises, or maybe just non-interactive templated formatting) 
built with Javascript and HTML that have an authoring mode.  Authoring should enhance the HTML to enable the 
user to edit what they want (e.g. using TinyMCE, dropdown menus, input fields,
etc). Once authoring mode is finished the resulting HTML is saved by eXeLearning inside it's XHTML page in an EPUB file.  What happens in a nutshell is:

* __Creation__: eXeLearning adds a blank div with a generated id ; the idevice javascript puts in initial content
* __Authoring Mode On__ : The idevice Javascript shows editing options (dropdowns, fields, etc)
* __Authoring Mode Off__ : The idevice saves any choices made to the DOM, removes authoring controls.  eXeLearning saves the resulting HTML. 

## 1. Create idevice.xml file

Idevices should have a folder under exe/webui/templates/idevices with a file
called idevice.xml that looks like this listing it's required files:

__exe/webui/templates/idevices/com.ustadmobile.helloidevice/idevice.xml:__ 
```xml
<?xml version="1.0" encoding="UTF-8"?>

<idevice xmlns="http://www.ustadmobile.com/ns/exelearning-idevice">
    <!--
    Id must match the name of the folder it's located in
    e.g. this idevice should be in exe/webui/templates/idevice/com.mydomain.myidevice
    -->
    <id>com.ustadmobile.helloidevice</id>
    
    <-- The Label eXe shows to the user to select this Idevice -->
    <label>Hello Idevice</label>
    
    <-- Cateogry for grouping: Can be Text, Interactive, Non-Interactive -->
    <category>Interactive</category>
    
    <!-- Visible / not hidden by default -->
    <visible>true</visible>
    
    <!-- CSS class applied to the holder div -->
    <cssclass>HelloIdevice</cssclass>
    
    <!--Required files from exe/webui/templates directory -->
    <system-resources>
        <script>exe-epub-common.js</script>
    </system-resources>
    
    <!-- Required files from the idevice's own directory -->
    <idevice-resources>
        <script>hello-idevice.js</script>
    </idevice-resources>
</idevice>
```

eXeLearning will now add the required files to the EPUB and add the required script and css links to the page the user selected to add the idevice to.  It will then generate a blank div element like this:

```html
<div id="id1" data-idevice-type="com.ustadmobile.helloworldidevice"> </div>
```  

## 2. Implement in Javascript
The Idevice Javascript should handle entering and finishing authoring mode: eXeLearning will take care of saving the HTML (and can handle adding user files like pictures, videos, etc):

__exe/webui/templates/idevices/com.ustadmobile.helloidevice/hello-idevice.js__:
```javascript
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
            this.setTinyMceEnabled(true);// enables tinymce on all child elements with exe-editable class
            
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

//Register the Idevice so eXeLearning knows what class to use
Idevice.registerType("com.ustadmobile.helloidevice", HelloIdevice);
```

## 3 Try using the new Idevice in eXeLearning

Start or refresh eXeLearning running in 

An Idevice javascript is responsible to:  

1. Manage it's creation: When eXeLearning adds it to the page it will be generated as a blank div as below and the __idevicecreate__ event will be fired on the document element.  



2. Respond to the __ideviceeditmodeon__ and __ideviceeditmodeoff__ event.  
⋅⋅* __Edit On__ : Idevice should enter authoring mode: Manipulate the DOM to give the user a way to edit the idevice (e.g. add/remove questions, edit text, etc).  The idevice can use form items, dropdown items etc. as appropriate.  Fired when the user clicks the pencil edit icon underneath the idevice.
⋅⋅* __Edit Off__ :  Idevice should leave authoring mode: Remove editing controls and save anything that is needed from edit mode into the dom.  Eg. if you had a dropdown menu that controls how the idevice works you should get it's value and put this into the DOM (e.g. in a hidden form, data- attribute, etc).  At this point you should serialize the HTML and eXeLearning will save it into the XHTML of the page that contains the idevice.

3. Optionally: If you want the idevice to support the Experience API you should make XML __&lt;activity&gt;__ entries that will be saved into tincan.xml .

Most of the time it makes most sense to use the base parent class Idevice: the code looks like this:




# The Hello Button Idevice Example



## What's different between the old (Python) model and this one