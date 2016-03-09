tinymce.PluginManager.add('inserttooltip', function(editor, url) {
    // Add a button that opens a window
    
    var self;
    
    
    /*
     * For some reason this is not playing ball: needs to be moved to common 
     * disable tinymce function
     * 
    editor.on("PreProcess", function() {
    	//hide the tooltip elements and make position absolute
    	var tooltipContents = editor.getBody().querySelectorAll(".tooltip_content");
    	for(var i = 0; i < tooltipContents.length; i++) {
    		tooltipContents[i].style.display = "none";
    	}
    });
    */
    editor.on("init", function() {
    	//show the tooltip elements
    	var tooltipContents = editor.getBody().querySelectorAll(".tooltip_content");
    	for(var i = 0; i < tooltipContents.length; i++) {
    		tooltipContents[i].style.display = "inline-block";
    	}
    });
    
    editor.addButton('inserttooltip', {
        //text: 'Insert Response',
        icon: "insert_tooltip",
        
        onclick: function() {
        	editor.selection.setContent('<span class="tooltip_holder" style="display: inline-block">' + editor.selection.getContent() + '</span><span class="tooltip_content" style="display: inline-block; background-color: gray; border: 1px dashed black">Popup content here</span>');
        }
    });
});