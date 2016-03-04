tinymce.PluginManager.add('insertresponse', function(editor, url) {
	// Add a button that opens a window
	
	var self;
	
	
    editor.addButton('insertresponse', {
        //text: 'Insert Response',
        icon: "insertresponse",
        
        onclick: function() {
        	self = this;
        	eXeTinCan.getActivitiesByInteractionType(['fill-in'], {}, function(activities){
        		// Open window
        		self.activities = activities;
                editor.windowManager.open({
                    title: 'Insert Response Field',
                    body: [
                        {
                        	type: 'listbox', 
                        	name: 'response_id', 
                        	label: 'Question',
                        	values: eXeEpubAuthoring.activitiesArrToTinyMCEListValues(activities)
                		}
                    ],
                    onsubmit: function(e) {
                        // Insert content when the window form is submitted
                    	
                    	var selectedActivity = eXeTinCan.getActivityByIdFromArr(self.activities, e.data.response_id);
                    	var responseElHTML = "<span class='exe-insert-response' data-activity-id='" + e.data.response_id + "'>" +
                    		"(Response: " + selectedActivity.querySelector("name").textContent +
                    		")</span>";
                    		
                        editor.insertContent(responseElHTML);
                    }
                });
        	});
        }
        
    });
    
});

