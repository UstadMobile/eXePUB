# Idevice Development Howto

Idevices are user editable templates built with Javascript and HTML that
have an authoring mode.  The authoring mode enables the author to update 
within eXeLearning to change the template (e.g. add/remove questions).  Perhaps
one day authoring mode outside eXeLearning could work too.

An Idevice javascript is responsible to:  

1. Manage it's creation: When eXeLearning adds it to the page it will be generated as a blank div as below and the __idevicecreate__ event will be fired on the document element.  

```html
<div id="id1" data-idevice-type="com.ustadmobile.helloworldidevice"> </div>
```

2. Respond to the __ideviceeditmodeon__ and __ideviceeditmodeoff__ event.  
⋅⋅* __Edit On__ : Idevice should enter authoring mode: Manipulate the DOM to give the user a way to edit the idevice (e.g. add/remove questions, edit text, etc).  The idevice can use form items, dropdown items etc. as appropriate.  Fired when the user clicks the pencil edit icon underneath the idevice.
⋅⋅* __Edit Off__ :  Idevice should leave authoring mode: Remove editing controls and save anything that is needed from edit mode into the dom.  Eg. if you had a dropdown menu that controls how the idevice works you should get it's value and put this into the DOM (e.g. in a hidden form, data- attribute, etc).  At this point you should serialize the HTML and eXeLearning will save it into the XHTML of the page that contains the idevice.

3. Optionally: If you want the idevice to support the Experience API you should make XML __&lt;activity&gt;__ entries that will be saved into tincan.xml .

Most of the time it makes most sense to use the base parent class Idevice: the code looks like this:

```javascript
var MyIdevice = function(ideviceId) {
    this.ideviceId = ideviceId;
};

//Use Object.create to make a child class
MyIdevice.prototype = Object.create(Idevice.prototype, {

    onCreate: {
        value : function() {
            //put initial content in here
        }
    },
    
    editOn: {
        value: function() {
            //Allow user to edit : can use forms items, TinyMCE, etc.
        }
    },
    
    editOff: {
        value: function() {
            //Remove edit controls : then call this.save() to tell eXeLearning to save the HTML
        }
    }
});

```


# The Hello Button Idevice Example



## What's different between the old (Python) model and this one