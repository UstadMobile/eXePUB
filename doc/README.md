# Developer Documentation

eXeLearning EPUB edition is designed to make it easy for users to put together education content (including interactivity and support for the Experience API) AND make it easy for developers to make new template types (sometimes you want a little more than a Multi Choice Question).  You can add new question types with just a small XML file and HTML/javascript.  

eXeLearning EPUB edition runs a nevow internal web server to run a local server and opens up in a browser.


## Checkout from source

```
git clone https://github.com/UstadMobile/eXePUB.git
```

## Run from source on the command line:

Run this from the folder you checked out into:
```
./exe/exe --standalone
```

You might need some python libraries... take a look __debian/control__ to see the requirements.

## Make a new idevice template: 

See the [Idevice-HOWTO.md](Idevice-HOWTO.md) for a guide.

## Setup Eclipse for eXeLearning development

This is a rough guide to using Eclipse for developing with eXe.  Tested with Eclipse 4.2.2 on Ubuntu 13.10 .  _You don't need to do this if you just want to develop idevice templates._

1.  Install PyDev in Eclipse to provide Python support

2. Make a new PyDev project in your eclipse workspace (Type: Python, Grammar Version 2.7, select configure pythonpath later).  Name can be whatever you like - e.g. eclipse-exe

3. Git checkout the source into the project folder (e.g. cd ~/workspace/eclipse-exe ; git clone ... )

4. Right click on the project, select refresh and you should see the sources in Eclipse

5. Right click and select project properties.  On the left Choose PyDev - PYTHONPATH .  Click add source folder.  From the project name select the folder you checked out into (e.g. eXePUB) .  Click OK

7. Right click on exe/exe and select to edit as a python file.

8. Right click on exe/exe , select debug as , Debug Configurations

10. Click the arguments tab.  In the arguments field enter --standalone (so exe will run in standalone mode using the local source in the development environment and not any others).  From working directory select other, select workspace/eXePUB (or the directory you checked out into) .  Click close to finish or debug to get started with the debugger.




