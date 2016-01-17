/**
 * 
 */
document.body.addEventListener("idevicecreate", function(evt) {
	if(evt.detail.ideviceType === "net.exelearning.text") {
		eXeEpubTinyMce.initExternalToolbarHolder();
		var targetEl = evt.target || evt.srcElement;
		var elId= "id" + evt.detail.ideviceId;
		document.getElementById(elId).innerHTML = "Edit Me";
		
		var tinyMceOpts = eXeEpubTinyMce.getDefaultOptions();
		tinyMceOpts.selector = "#" + elId; 
		tinymce.init(tinyMceOpts);
	}
}, false);
