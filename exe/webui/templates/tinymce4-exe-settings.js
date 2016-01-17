/*
 * TinyMCE4 Settings for eXe.  Uses inline editing mode, places the
 * toolbar in #externalToolbarHolder at the top of the page.
 * 
 * To make the bundle from TinyMCE source code:
 * 
 * grunt --force
 * grunt bundle --themes modern --plugins advlist,autolink,lists,link,image,charmap,print,preview,anchor,searchreplace,visualblocks,code,fullscreen,insertdatetime,media,table,contextmenu,paste,textcolor
 * 
 * Built from TinyMCE from:
 * https://github.com/UstadMobile/tinymce
 * 
 * Forked to add support for Autoplay and Controls in HTML Media 
 * 
 */

var eXeEpubTinyMce = (function() {
	
	//When creating space at the top: ignore these elements
	var _boxlessElements = ["script", "meta", "base"];
	
	return {
		
		/**
		 * The ID used for the TinyMCE toolbar fixed at the top
		 */
		toolbarElId: "externalToolbarHolder",
		
		
		
		/**
		 * We normally want to put the TinyMCE toolbar in at the top of
		 * the document where users would expect it.  This will check 
		 * and if required create the needed DOM elment for it to live 
		 * in.
		 */
		initExternalToolbarHolder: function() {
			var holderEl = document.getElementById("externalToolbarHolder");
			if(!holderEl) {
				holderEl = document.createElement("div");
				holderEl.style.zIndex = 1000;
				holderEl.style.position = "fixed";
				holderEl.style.top = "0px";
				holderEl.style.width = "100%";
				holderEl.style.left = "0px";
				holderEl.style.borderBottom = "2px solid gray";
				holderEl.style.height = "36px";
				holderEl.setAttribute("class", "mce-panel");
				holderEl.setAttribute("id", "externalToolbarHolder");

				//find the first element that has height (e.g. avoid script tags)
				var firstEl = null;
				var bodyChildren = document.body.children;
				for(var i = 0; i < bodyChildren.length; i++) {
					if(bodyChildren[i].nodeType === 1 && _boxlessElements.indexOf(bodyChildren[i].nodeName) === -1) {
						firstEl = bodyChildren[i];
						break;
					}
				}
				
				
				document.body.insertBefore(holderEl, firstEl ? 
					firstEl : document.bodyChildren.firstElementChild);
				if(firstEl !== null){
					firstEl.style.marginTop = "32px";
				}
			}
		},
		
		getDefaultOptions: function() {
			return {
				convert_urls: false,
				inline: true,
				fixed_toolbar_container: "#externalToolbarHolder",
				menubar: false,
			    //file_browser_callback : exe_tinymce.chooseImage,
			    entity_encoding: 'raw',
			    //see plugin note above if changing
			    plugins: [
				      "advlist autolink lists link image charmap print preview anchor",
				      "searchreplace visualblocks code fullscreen",
				      "insertdatetime media table contextmenu paste textcolor" //,
				      //"directionality"
				  ],
			    toolbar: "undo redo | styleselect | fontselect | fontsizeselect | bold italic underline | ltr rtl | alignleft aligncenter alignright alignjustify | bullist numlist | link image media | forecolor backcolor ",
			    fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt 48pt 60pt 72pt 88pt 100pt 112pt 124pt",
			}
		}
	};
})();

/*
var eXeTinyMceDefaults = {
	// General options
	selector: "div.mceEditor",	
	convert_urls : false,
	inline: true,
	fixed_toolbar_container: "#externalToolbarHolder",
	menubar: false,
    file_browser_callback : exe_tinymce.chooseImage,
    entity_encoding: 'raw',
    //see plugin note above if changing
    plugins: [
	      "advlist autolink lists link image charmap print preview anchor",
	      "searchreplace visualblocks code fullscreen",
	      "insertdatetime media table contextmenu paste textcolor",
	      "directionality"
	  ],
    toolbar: "undo redo | styleselect | fontselect | fontsizeselect | bold italic underline | ltr rtl | alignleft aligncenter alignright alignjustify | bullist numlist | link image media | forecolor backcolor ",
    fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt 48pt 60pt 72pt 88pt 100pt 112pt 124pt",
    setup: function(ed) {
		ed.on("init", function(e) {
			EXEAuthoringDefaultPrompts.setupTinyMCEEditor(ed);
		});
	},
	link_list: tinymceLinkListURL,
	link_list_label: "Link to page"
};
*/

/*
$(function() {
	//Set the the height of the external toolbar holder to be fixed
	if($("div.mceEditor").length > 0) {
		$("#externalToolbarHolder").css("height", "36px").addClass("mce-panel");
		$("#main").css("margin-top", "32px");
	}
});
*/


