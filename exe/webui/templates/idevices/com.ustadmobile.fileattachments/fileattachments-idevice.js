
/**
 * Idevice to handle attaching documents etc.
 */
var FileAttachmentsIdevice = function(ideviceId) {
	this.ideviceId = ideviceId;
	
	this.getUserFiles({}, (function(err, userFilesArr) {
		debugger;
	}).bind(this));
}


FileAttachmentsIdevice.prototype = Object.create(Idevice.prototype, {
	
	onCreate: {
		value : function() {
			this._getEl().textContent = "Attachments here please";
		}
	},

	editOn: {
		value: function() {
			var buttonEl = document.createElement("button");
			buttonEl.textContent = "Add File";
			buttonEl.addEventListener("click", this.handleClickAddFile.bind(this), false);
			this._getEl().appendChild(buttonEl);
		}
	},
	
	handleClickAddFile: {
		value: function() {
			eXeEpubAuthoring.requestUserFiles({ideviceId : this.ideviceId}, function(entry) {
				var newHref = entry.href;
			});
		}
	}
	
});

FileAttachmentsIdevice.prototype.constructor = FileAttachmentsIdevice;

Idevice.registerType("com.ustadmobile.fileattachments", FileAttachmentsIdevice);
