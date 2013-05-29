var fs = require("fs");
var assert = require("assert");
var vumigo = require("vumigo_v01");
// CHANGE THIS to your-app-name
var app = require("../lib/go-sms-sender");

// This just checks that you hooked you InteractionMachine
// up to the api correctly and called im.attach();
describe("test_api", function() {
    it("should exist", function() {
        assert.ok(app.api);
    });
    it("should have an on_inbound_message method", function() {
        assert.ok(app.api.on_inbound_message);
    });
    it("should have an on_inbound_event method", function() {
        assert.ok(app.api.on_inbound_event);
    });
});

// YOUR TESTS START HERE
// CHANGE THIS to test_your_app_name
describe("When using the SMS sender via USSD", function() {

    // These are used to mock API reponses
    // EXAMPLE: Response from google maps API
    var fixtures = [
       'test/fixtures/example-geolocation.json'
    ];

    var tester = new vumigo.test_utils.ImTester(app.api, {
        custom_setup: function (api) {
            api.config_store.config = JSON.stringify({
                sms_tag: ['pool', 'addr']
                //user_store: "go_skeleton"
            });
            fixtures.forEach(function (f) {
                api.load_http_fixture(f);
            });
        },
        async: true
    });

    var assert_single_sms = function(to_addr, content) {
        var teardown = function(api) {
            var sms = api.outbound_sends[0];
            assert.equal(api.outbound_sends.length, 1);
            assert.equal(sms.to_addr, to_addr);
            assert.equal(sms.content, content);
        };
        return teardown;
    };

    // first test should always start 'null, null' because we haven't
    // started interacting yet
    it("first screen should ask us to say something ", function (done) {
        var p = tester.check_state({
            user: null,
            content: null,
            next_state: "first_state",
            response: "^Say something please",
            continue_session: true
        });
        p.then(done, done);
    });

    it("we should be told SMS sent and asked if we want to do another", function (done) {
        var p = tester.check_state({
            user: null,
            content: "Hello Mike",
            next_state: "second_state",
            response: "^Thank you, SMS sent! Send another\\?[^]" +
                    "1. Yes[^]"+
                    "2. No$",
            continue_session: true
        });
        p.then(done, done);
    });

    it("we should decline sending another and get an ending thankyou", function (done) {
        var user = {
            current_state: "second_state",
            answers: {
                first_state: "Hello Mike"
            }
        }
        var p = tester.check_state({
            user: user,
            content: "2",
            next_state: "end_state",
            response: "^Thank you and bye bye!$",
            continue_session: false
        });
        p.then(done, done);
    });

});