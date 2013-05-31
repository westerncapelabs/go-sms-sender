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

    self.send_sms = function(im, content, to_addr) {
        var sms_tag = im.config.sms_tag;
        if (!sms_tag) return success(true);
        var p = im.api_request("outbound.send_to_tag", {
            to_addr: to_addr,
            content: content,
            tagpool: sms_tag[0],
            tag: sms_tag[1]
        });
        return p;
    };

    self.add_state(new FreeText(
        "first_state",
        "end_state",
        "Say something please..."
    ));


    self.add_creator('end_state', function(state_name, im) {
        //im.log = console.log
        var p = im.api_request('contacts.get_or_create', {
            delivery_class: 'sms',
            addr: im.user_addr
        });

        var msg = im.get_user_answer('first_state');
        var recipients = ["+27845091190", "+27845091190", "+27845091190"];
        var sendMessage = function(number) {
          im.log("sending: "+ number );
          p.add_callback(function(result) { return self.send_sms(im, msg, number);});
        };

        for (var i=0;i<recipients.length;i++){
          sendMessage(recipients[i]);
        }

        p.add_callback(function(result) {
            if (result.success){
                // console.log("SMS send should have worked");
                im.log("SMS send should have worked");
            } else {
                // console.log("SMS send failed");
                im.log("SMS send failed");
            }
            // console.log(im.get_user_answer('first_state'));
            return new EndState(
                "end_state",
                "You said '" + im.get_user_answer('first_state') + "'. Thank you and bye bye!",
                "first_state"
            );
        });
        return p;
    });
}

// launch app
var states = new SmsSender();
var im = new InteractionMachine(api, states);
im.attach();