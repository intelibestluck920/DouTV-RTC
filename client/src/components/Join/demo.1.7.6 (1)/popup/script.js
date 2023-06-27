const extpay = ExtPay('dropin-ai');
var typewriter_text = "";
var typewriter_index = 0;

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if ((msg.from === 'background') && (msg.subject === 'userPaid')) {
        sendResponse({});
        load_wrappers();
    }

    if ((msg.from === 'background') && (msg.subject === 'trialStarted')) {
        sendResponse({});
        load_wrappers();
    }
});

$(document).ready(function () {
    extpay.getUser().then(user => {
        if (user.paid) {
            chrome.storage.local.set({
                logged_in: "yes",
            }, function () {
                load_wrappers();
            });
        } else if (user.subscriptionStatus === 'canceled') {
            chrome.storage.local.set({
                logged_in: "",
                api_key: ""
            }, function () {
                load_wrappers();
            });
        } else {
            load_wrappers();
        }
    });

    $("#save").click(function () {
        $("#message").remove();
        let api_key = $("#api_key").val();
        if (api_key) {
            chrome.storage.local.set({
                api_key: api_key
            }, function () {
                $("#api_key_wrapper").hide();
                $("#extension_features_wrapper").show();
                $("#wrapper").prepend('<p id="message">API key is saved</p>');
                setTimeout(function () {
                    $("#message").remove();
                }, 2500);
            });
        } else {
            $("#wrapper").prepend('<p id="message">API key can not be empty</p>');
        }
        return false;
    });

    $("#get_started").click(function () {
        chrome.storage.local.set({
            get_started: "clicked"
        }, function () {
            $("#explanation_wrapper").hide();
            $("#api_key_wrapper").show();
        });
        return false;
    });

    $("#pay").click(function () {
        extpay.openPaymentPage();
    });

    $("#manage_subscription").click(function () {
        extpay.openPaymentPage();
    });

    $("#api_key").focus(function () {
        $("#message").remove();
    });

    $("#generate").click(function () {
        typewriter_text = "";
        $("#output").text("Processing data...");
        $("#output").show();
        send_to_api();
        return false;
    });

    $("#cb_enabled").change(function () {

        let enabled = "no";
        if ($(this).is(":checked")) {
            enabled = "yes";
        }

        chrome.storage.local.set({
            enabled: enabled
        }, function () {
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, function (tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {from: 'popup', subject: 'statusChanged'});
                chrome.runtime.sendMessage({
                    from: 'popup',
                    subject: 'statusChangedForBackground'
                });
            });
        });
    });

    $("#api_key_button").click(function () {
        $("#api_key_wrapper").toggle();
        $("#extension_features_wrapper").toggle();
        $("#extension_login_wrapper").hide();
        return false;
    });
});

function send_to_api() {
    let input_text = $("#input_text").val();
    let api_key = $("#api_key").val();
    let message = [
        {role: "user", content: input_text}
    ];

    let post_data = {"model": "gpt-3.5-turbo", messages: message};
    $.ajax({
        url: "https://api.openai.com/v1/chat/completions",
        method: "POST",
        data: JSON.stringify(post_data),
        headers: {
            'Authorization': 'Bearer ' + api_key,
            'Content-Type': 'application/json'
        },
        success: function (response) {
            $("#output").text("");
            typewriter_text = response["choices"][0]["message"]["content"];
            typewriter_index = 0;
            type_writer();
        },
        error: function (xhr, ajaxOptions, thrownError) {
            $("#output").text("");
            typewriter_index = 0;
            typewriter_text = "Error status:" + xhr.status + "\n" + "Error message:" + thrownError + "\nNOTE: Please click on API and enter your API key";
            type_writer();
        }
    });
}

function type_writer() {
    var speed = 25 /* The speed/duration of the effect in milliseconds */
    if (typewriter_text && (typewriter_index < typewriter_text.length)) {
        document.getElementById("output").innerHTML += typewriter_text.charAt(typewriter_index);
        typewriter_index++;
        setTimeout(type_writer, speed);
    }
}

function load_wrappers() {
    chrome.storage.local.get(['api_key', 'logged_in', 'enabled', 'get_started'], function (data) {
        let api_key = "";
        let enabled = "";
        let logged_in = "";
        let get_started = "";
        if (data['api_key'] && (data['api_key'] != 'undefined'))
            api_key = data['api_key'];
        if (data['enabled'] && (data['enabled'] != 'undefined'))
            enabled = data['enabled'];
        if (data['logged_in'] && (data['logged_in'] != 'undefined'))
            logged_in = data['logged_in'];
        if (data['get_started'] && (data['get_started'] != 'undefined'))
            get_started = data['get_started'];

        $("#api_key").val(api_key);
        if (enabled == 'yes') {
            $("#cb_enabled").prop("checked", true);
        }

        if (api_key) {
            $("#extension_features_wrapper").show();
        } else {
            if (logged_in == "yes") {
                $("#extension_login_wrapper").hide();
                if (get_started == "clicked") {
                    $("#api_key_wrapper").show();
                } else {
                    $("#explanation_wrapper").show();
                }
            } else {
                $("#extension_login_wrapper").show();
            }
        }
    });
}