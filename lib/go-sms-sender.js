var vumigo = require("vumigo_v01");
var jed = require("jed");

if (typeof api === "undefined") {
    // testing hook (supplies api when it is not passed in by the real sandbox)
    var api = this.api = new vumigo.dummy_api.DummyApi();
}

var Promise = vumigo.promise.Promise;
var success = vumigo.promise.success;
var Choice = vumigo.states.Choice;
var ChoiceState = vumigo.states.ChoiceState;
var FreeText = vumigo.states.FreeText;
var EndState = vumigo.states.EndState;
var InteractionMachine = vumigo.state_machine.InteractionMachine;
var StateCreator = vumigo.state_machine.StateCreator;

function SmsSender() {
    var self = this;
    // The first state to enter
    StateCreator.call(self, 'first_state');


    self.add_state(new FreeText(
        "first_state",
        "second_state",
        "Say something please..."
    ));

    self.add_creator('second_state', function(state_name, im) {
        return new ChoiceState(
            state_name,
            function(choice) {
                return (choice.value == 'yes' ? 'end_state' : 'end_state');
            },
            "Thank you! SMSs sent!",
            [
                new Choice("yes", "Continue?")
            ]
            );
    });

    self.add_state(new EndState(
        "end_state",
        "Thank you and bye bye!",
        "first_state"
    ));
}

// launch app
var states = new SmsSender();
var im = new InteractionMachine(api, states);
im.attach();