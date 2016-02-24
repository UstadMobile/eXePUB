/**
 Utilities for cordaid idevices that rework values from
 checkbox tables.
 
*/

var CheckboxUtils = function() {
	
};

/**
 * For a given checkbox table get an array of the choices that are 
 * offered here so filtering can be applied
 */
CheckboxUtils.getChoicesByActivityId = function(activityId, callback) {
	var ideviceId = activityId.substring(activityId.lastIndexOf("/")+1);
	ideviceId = ideviceId.substring(0, ideviceId.indexOf("."));
	
	
	
	eXeTinCan.getActivitiesByExtension(
		"http://ustadmobile.com/ns/tincan-ext-idevice",
		ideviceId, {}, (function(ideviceActivities) {
			var choicesEl = null;
			for(var i = 0; i < ideviceActivities.length && !choicesEl; i++) {
				choicesEl = ideviceActivities[i].querySelector("choices");
			}
			
			var choices = [];
			var compEls = choicesEl.querySelectorAll("component");
			for(var i = 0; i < compEls.length; i++) {
				var id = compEls[i].querySelector("id").textContent;
				id = id.substring(id.lastIndexOf(".") + 1);
				var desc = compEls[i].querySelector("description").textContent;
				choices.push([id, desc]);
			}
			
			callback(choices, ideviceActivities);
		}).bind(this));
};

CheckboxUtils.getIdeviceIdFromActivityId = function(activityId) {
	var ideviceId = activityId.substring(activityId.lastIndexOf("/")+1);
	ideviceId = ideviceId.substring(0, ideviceId.indexOf("."));
	return ideviceId;
}

CheckboxUtils.getCheckedItemsByCheckedId = function(activityId, checkedId, ideviceActivities, callback) {
	//var ideviceId = activityId.substring(activityId.lastIndexOf("/")+1);
	//ideviceId = ideviceId.substring(0, ideviceId.indexOf("."));
	var ideviceId = CheckboxUtils.getIdeviceIdFromActivityId(activityId);
	
	eXeTinCan.getPkgStateValue("id"+ideviceId, function(state){
		var checkedItems = [];
		var checkedItemObj;
		for(prop in state) {
			if(state.hasOwnProperty(prop)) {
				if(state[prop].checkedItem === checkedId) {
					var questionId = prop.substring(prop.indexOf("_")+1);
					var checkedActivityId = 
						activityId.substring(0, activityId.lastIndexOf(".")+1) + questionId;
					var checkedActivity = eXeTinCan.getActivityByIdFromArr(ideviceActivities, checkedActivityId);
					var checkedDesc = checkedActivity.querySelector("description").textContent;
					checkedItemObj = { 
						id: prop, 
						desc : checkedDesc 
					};
					
					if(state[prop].response) {
						checkedItemObj.response = state[prop].response;
					}
					
					checkedItems.push(checkedItemObj);
				}
			}
		}
		
		callback(checkedItems);
	}, {prefix : true});
	
};

CheckboxUtils.getCheckedItemsByCheckedIndex = function(activityId, checkedIndex, callback) {
	CheckboxUtils.getChoicesByActivityId(activityId, function(choices, ideviceActivities) {
		var itemId = choices[checkedIndex][0];
		CheckboxUtils.getCheckedItemsByCheckedId(activityId, itemId, ideviceActivities, function(items) {
			callback(items);
		});
	});
};


