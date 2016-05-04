/*
 * A basic tool tip functionality.  This will surround selected text
 * with a span with the class 'tooltip_holder' and a title attribute.
 * 
 * When editing a new span is created in TinyMCE that can be edited.
 * On serialize that span is taken out and it's contents are put into
 * the title attribute to make the tooltip.
 */

tinymce.PluginManager.add('inserttooltip', function(editor, url) {
    var idPrefix = editor.id + "_tooltip_";
    
    var getNextTooltipId = function(ed) {
    	var tooltips = ed.getBody().querySelectorAll("[data-exe-tooltip]");
    	var maxTipId = 0;
    	
    	var tipId;
    	for(var i = 0; i < tooltips.length; i++) {
    		try {
    			tipId = parseInt(tooltips[i].getAttribute("data-exe-tooltip").substring(idPrefix.length));
    			if(tipId > maxTipId) {
    				maxTipId = tipId;
    			}
    		}catch(err) {
    			//leave it
    		}
    	}
    	
    	return maxTipId;
    };
    
    var findNextElWithClass = function(el, className) {
    	var foundEl = null;
    	do {
    		el = el.nextSibling;
    		if(el && el.nodeType === Node.ELEMENT_NODE && el.classList.contains(className)){
    			foundEl = el;
    		}
    	}while(!foundEl && el);
    	
    	return foundEl;
    };
    
    var findNextNodeById = function(node, id) {
    	var nextNode = null;
    	
    	do {
    		node = node.walk();
    		if(node && node.attr("id") === id) {
    			nextNode = node;
    		}
    	}while(node && !nextNode);
    	
    	return nextNode;
    };
    
    editor.on("init", function() {
    	//show the tooltip elements
    	var tooltipContents = editor.getBody().querySelectorAll(".tooltip_holder");
    	for(var i = 0; i < tooltipContents.length; i++) {
    		var titleText = tooltipContents[i].getAttribute("title");
    		var tooltipContentEl = findNextElWithClass(tooltipContents[i], 
    				"tooltip_content");
    		
    		//old saved content might already have this...
    		if(!tooltipContentEl && titleText) {
    			tooltipContentEl = document.createElement("span");
    			tooltipContentEl.setAttribute("class", "tooltip_content");
    			tooltipContentEl.setAttribute("style", "display: inline-block; background-color: gray; border: 1px dashed black");
    			tooltipContentEl.textContent = titleText;
    			tooltipContents[i].parentNode.insertBefore(tooltipContentEl, 
    					tooltipContents[i].nextSibling);
    		}
    		
			var tooltipId = idPrefix + getNextTooltipId(editor);
			tooltipContents[i].setAttribute("data-exe-tooltip",
				tooltipId); 
			tooltipContentEl.setAttribute("id", tooltipId);
    	}
    	
    	editor.serializer.addAttributeFilter('title', function(nodes, name) {
    		var tooltipId;
    		var tooltipContentEl;
    		for(var i = 0; i < nodes.length; i++) {
    			tooltipId = nodes[i].attr("data-exe-tooltip");
    			var tooltipContentEl = document.getElementById(tooltipId);
    			if(tooltipContentEl) {
    				nodes[i].attr("title", tooltipContentEl.textContent);
        			var tooltipNode = findNextNodeById(nodes[i], tooltipId);
        			if(tooltipNode) {
        				tooltipNode.remove();
        			}
    			}
    			nodes[i].attr("data-exe-tooltip", null);
    		}
        });
    });
    
    editor.addButton('inserttooltip', {
        //text: 'Insert Response',
        icon: "insert_tooltip",
        
        onclick: function() {
        	var tooltipId = idPrefix + getNextTooltipId(editor);
        	editor.selection.setContent('<span class="tooltip_holder" data-exe-tooltip="' + 
        			tooltipId + '" title="title">' + 
        			editor.selection.getContent() + '</span>' +
        			'<span class="tooltip_content" id="' + tooltipId + '" style="display: inline-block; background-color: gray; border: 1px dashed black">Popup content here</span>');
        }
    });
    
});