# Idevice Development Howto

Idevices are user editable templates (like multi choice questions, sorting exercises, or maybe just non-interactive templated formatting) 
built with Javascript and HTML that have an authoring mode.  Authoring should enhance the HTML to enable the 
user to edit what they want (e.g. using TinyMCE, dropdown menus, input fields,
etc). Once authoring mode is finished the resulting HTML is saved by eXeLearning inside it's XHTML page in an EPUB file.  What happens in a nutshell is:

* __Creation__: eXeLearning adds a blank div with a generated id ; loads specified Javascript and CSS, then the idevice javascript puts in initial content
* __Authoring Mode On__ : The idevice Javascript shows editing options (dropdowns, fields, etc)
* __Authoring Mode Off__ : The idevice saves any choices made to the DOM, removes authoring controls.  eXeLearning saves the resulting HTML. 

Idevices can also support generating Experience API (TinCan) statements and using the state api to save/retrieve states.

## 1. Create idevice.xml file

Idevices should have a folder named the same as the idevice's id (e.g. com.ustadmobile.helloidevice) under exe/webui/templates/idevices or in the user's own generated preferences folder ~/.exe/idevices .

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

Start or refresh the eXeLearning instance already running.  You should see your idevice listed in the panel on the left like this.


![alt text](https://raw.githubusercontent.com/UstadMobile/eXePUB/master/doc/hello-idevice-new.png "Screenshot")

When the author clicks the edit button the editOn method is called allowing the author to enter authoring mode and customize the template.  They then click the checkbox to finish authoring mode and save the idevice.  Et voila! You have your first iDevice!

## Advanced Topics

### Using Files

Sometimes you want the user to be able to customize the idevice by uploading their own files (images, sound files etc)... There's an API for that

#### Adding a file
Use this function with a callback to prompt the user to add a file.
```javascript
eXeEpubAuthoring.requestUserFiles({ideviceId : this.ideviceId}, function(entry) {
    //entry has the properties id, mediaType and href (as per it's entry in the EPUB OPF
    var newHref = entry.href;
    var mimeType = entry.mediaType;
});
```

### Get a list of user files
```javascript
this.getUserFiles({}, function(err, userFilesArr) {
    for(var i = 0; i < userFilesArr.length; i++) {
        console.log("User File : " + userFilesArr[i].href + " media type = " +
            userFilesArr[i].mediaType + " opf entry id = " + userFilesArr[i].id);
            
    }
});
```


### File structure
__Common Files:__
Are kept in exe/webui/templates including exe-epub-common.js and exe_jquery.js .  When they are required in the EPUB they are automatically added to exe-files/common

__Idevice Files:__
Should be kept in the idevice's directory.  When they are required in the EPUB they are automatically added to exe-files/idevices/ideviceid



##3 What's different between the old (Python) model and this one?

A lot... the previous model [Roughly documented here](https://forja.cenatic.es/plugins/mediawiki/wiki/iteexe/index.php/CreatingAnIdevice) required you to use Python in eXeLearning to add a new idevice.

 

