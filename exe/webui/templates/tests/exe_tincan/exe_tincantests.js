
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


