# Idevice Development Howto

Idevices are user editable templates built with Javascript and HTML that
(optionally) can generate interactive activities like multi choice questions,
puzzles etc.  An Idevice javascript is responsible to:  

1. Manage it's own creation: When eXeLearning adds it to the page it will be generated as a blank div like this and the __idevicecreate__ event will be fired.  

```
<div id="id1" data-idevice-type="com.ustadmobile.helloworldidevice"> </div>
```

2. Respond to the __ideviceeditmodeon__ and __ideviceeditmodeoff__ event.  
** __Edit On__ : Manipulate the DOM to give the user a way to edit the idevice (e.g. add/remove questions, edit text, etc).  The idevice can use form items, dropdown items etc. as appropriate.  Fired when the user clicks the pencil edit icon underneath the idevice.
** __Edit Off__ :  Remove editing controls and save anything that is needed from edit mode into the dom.  Eg. if you had a dropdown menu that controls how the idevice works you should get it's value and put this into the DOM (e.g. in a hidden form, data- attribute, etc).  At this point you should serialize the HTML and eXeLearning will save it into the XHTML
of the page that contains the idevice.

3. Optionally: If you want the idevice to support the Experience API you should make XML __&lt;activity&gt;__ entries that will be saved into tincan.xml .


# The Hello World Idevice Example



## What's different between the old (Python) model and this one