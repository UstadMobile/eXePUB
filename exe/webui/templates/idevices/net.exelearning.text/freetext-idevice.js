/**
 * 
 */
document.addEventListener("idevicecreate", function(evt) {
	if(evt.detail.ideviceType === "net.exelearning.text") {
		eXeEpubTinyMce.initExternalToolbarHolder();
		var targetEl = evt.target || evt.srcElement;
		var elId= "id" + evt.detail.ideviceId;
		document.getElementById(elId).innerHTML = "Edit Me";
	}
}, false);

document.addEventListener("ideviceediton", function(evt) {
	if(evt.detail.ideviceType === "net.exelearning.text") {
		var editor = tinymce.get("id" + evt.detail.ideviceId);
		if(editor) {
			editor.getBody().setAttribute("contenteditable", true);
			editor.focus();
		}else {
			var tinyMceOpts = eXeEpubTinyMce.getDefaultOptions();
			tinyMceOpts.selector = "#id" + evt.detail.ideviceId; 
			tinyMceOpts.auto_focus = "id" + evt.detail.ideviceId;
			tinymce.init(tinyMceOpts);
		}
	}
}, false);


document.addEventListener("ideviceeditoff", function(evt) {
	if(evt.detail.ideviceType === "net.exelearning.text") {
		var editor = tinymce.get("id"+evt.detail.ideviceId);
		editor.getBody().setAttribute("contenteditable", false);
	}
}, false);

