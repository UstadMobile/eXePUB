
document.body.addEventListener("idevicecreate", function(evt) {
	if(evt.detail.ideviceType === "net.exelearning.mcq") {
		var targetEl = evt.target || evt.srcElement;
		targetEl.innerHTML = "New MCQ";
	}
}, false);



