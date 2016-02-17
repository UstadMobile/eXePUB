
QUnit.test( "Get TinCan Actors", function( assert ) {
  assert.ok( eXeTinCan.getActor(), "Got actor from LRS params" );
});

//Test async call that runs when state is loaded
QUnit.test("Run function after state loaded", function(assert) {
	assert.expect(1);
	var done = assert.async();
	eXeTinCan.runAfterStateLoaded({}, function() {
		assert.ok(true, "run after statement loaded called");
		done();
	});
});

//Test saving and then getting a value
QUnit.test("Save value to state and retrieve it", function(assert) {
	assert.expect(1);
	var testKeyName = "testkey";
	var testKeyValue = "TheAnswerIs42";
	
	var done = assert.async();
	eXeTinCan.runAfterStateLoaded({}, function() {
		eXeTinCan.setPkgStateValue(testKeyName, testKeyValue);
		eXeTinCan.saveState({}, function() {
			eXeTinCan.loadState({}, function(err, result) {
				assert.ok(result.contents[testKeyName] === testKeyValue, 
						"Key retrieved as it was saved");
				done();
			});
		});
	});
});

//Test saving and restoring using local storage
QUnit.test("Save and restore value using local storage state API substitution", function(assert) {
	assert.expect(2);
	var done = assert.async();
	
	var testKeyName = "testkey";
	var testKeyValue = "TheAnswerIs42";
	var activityIdLocal = "epub:123456789012345678901234567890";
	
	var stateParams = eXeTinCan._makeStateParams(activityIdLocal, function(err, result) {
		var localState = result.contents;
		assert.ok(localState, "Loaded local state not null");
		localState[testKeyName] = testKeyValue;
		
		var stateParams2 = eXeTinCan._makeStateParams(activityIdLocal, function(err, result){
			var stateParams3 = eXeTinCan._makeStateParams(activityIdLocal, function(err, result) {
				assert.ok(result.contents[testKeyName] === testKeyValue, 
						"Key retrieved as it was saved to local storage");
				done();
			});
			eXeTinCan.getStateFromLocalStorage("exe_pkg_state", stateParams3);
		});
		eXeTinCan.setStateToLocalStorage("exe_pkg_state", localState, stateParams2);
	});
	eXeTinCan.getStateFromLocalStorage("exe_pkg_state", stateParams);
});

//Test Synchronous fetching of package ID
QUnit.test("Get package xml and value synchronously", function(assert) {
	assert.expect(2);
	var tcXML = eXeTinCan.getPackageTinCanXML({});
	assert.ok(tcXML, "Got package xml:" + tcXML);
	var pkgId = eXeTinCan.getPackageTinCanID({});
	assert.ok(pkgId, "Got package tincan id base: " + pkgId);
});


//Test Synchronous setting of state

QUnit.test("Save package state synchronously", function(assert) {
	assert.expect(1);
	
	var testKeyName = "testkey";
	var testKeyValue = "TheAnswerIs42";
	
	//slightly changed here to be a new ID
	var activityIdLocal = "epub:S1234567890123456789012345678980";
	var stateParams = eXeTinCan._makeStateParams(activityIdLocal);
	
	var result = eXeTinCan.saveState(stateParams);
	assert.ok(result, "Saved result");	
});




