importScripts('ExtPay.js');
var extpay = ExtPay('dropin-ai');
extpay.startBackground();

extpay.onPaid.addListener(user => {
    chrome.storage.local.set({
        logged_in: "yes",
    }, function () {
        chrome.runtime.sendMessage({
            from: 'background',
            subject: 'userPaid'
        });
    });
});

add_contextmenu_option();

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.subject === 'statusChangedForBackground') {
        sendResponse({});
        add_contextmenu_option();
    }
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
    let selected_text = info.selectionText;
    let current_url = tab["url"];
    send_message_to_content("showResponse", "process_data", current_url, '');
    send_api_request(selected_text, current_url);
});

function send_api_request(selected_text, current_url) {

    let message = [
        {role: "user", content: selected_text}
    ];

    let post_data = {"model": "gpt-3.5-turbo", messages: message};
    chrome.storage.local.get(['api_key'], function (data) {
        let api_key = "";
        if (data['api_key'] && (data['api_key'] != 'undefined'))
            api_key = data['api_key'];

        fetch("https://api.openai.com/v1/chat/completions", {
            headers: {
                'Authorization': 'Bearer ' + api_key,
                'Content-Type': 'application/json'
            },
            method: 'POST',
            body: JSON.stringify(post_data)
        }).then(response => response.json()).then(data => {
            console.log(data);
            let response_text = "";
            if (data["error"]) {
                if (data["error"]["code"] == "invalid_api_key") {
                    response_text = "Incorrect API key provided";
                } else if (data["error"]["type"] == "invalid_request_error") {
                    response_text = data["error"]["message"];
                }
            } else if (data["choices"]) {
                response_text = data["choices"][0]["message"]["content"];
            }
            send_message_to_content('showResponse', response_text, current_url, selected_text);
        }).catch(error => {
            send_message_to_content('showResponse', 'unexpected_api_error', current_url, '');
        });
    });
}

function send_message_to_content(subject, response, current_url, selected_text) {
    chrome.tabs.query({
        active: true,
        currentWindow: true
    }, function (tabs) {
        if (tabs[0].id) {
            chrome.tabs.sendMessage(tabs[0].id, {from: 'background', subject: subject, response: response, current_url: current_url, selected_text: selected_text});
        }
    });
}

function add_contextmenu_option() {
    chrome.storage.local.get(['enabled'], function (data) {
        let enabled = "";
        if (data['enabled'] && (data['enabled'] != 'undefined'))
            enabled = data['enabled'];

        if (enabled == "yes") {
            chrome.contextMenus.create({
                id: "search",
                title: "Search",
                contexts: ["selection"]
            }, () => chrome.runtime.lastError);
        } else {
            chrome.contextMenus.removeAll();
        }
    });
}