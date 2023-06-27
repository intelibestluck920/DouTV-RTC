var typewriter_text = "";
var typewriter_index = 0;
var closed_flag = false;

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.subject === 'showResponse') {
        sendResponse({});
        let current_url = window.location.href;
        if ((current_url == msg.current_url) && !closed_flag) {
            var style = "";
            if ($("#openai_response_popup").length) {
                style = $("#openai_response_popup").attr("style");
                $("#openai_response_popup").remove();
            }

            let popup_content = "";
            if (msg.response === 'process_data') {
                popup_content = "Processing data...";
            } else if (msg.response === 'unexpected_api_error') {
                popup_content = "Some problem appeared during processing data, please retry";
            } else {
                popup_content = msg.response;
            }

            var html = $('<div id="openai_response_popup" style="' + style + '"><div id="popup_selected_text"><span id="popup_question_label">Q: </span><span id="popup_question_text"></span></div><br /><div id="openai_response_popup_content"><span id="popup_answer_label">A: </span><span id="popup_answer_text"></span></div><span id="openai_response_close">×</span></div>');
            dragElement(html[0]);
            $("body").append(html);
            $("#openai_response_popup").css("left", Math.max(0, (($(window).width() - $("#openai_response_popup").outerWidth()) / 2) + 
                                                $(window).scrollLeft()) + "px");
            if (msg.selected_text && (msg.response != "Incorrect API key provided")) {
                $("#popup_question_text").text(msg.selected_text);
                $("#popup_selected_text").show();
                $("#popup_answer_label").show();                
            }
            typewriter_text = popup_content;
            typewriter_index = 0;
            type_writer();
        }
    }

    if (msg.subject === 'statusChanged') {
        sendResponse({});
        chrome.storage.local.get(['enabled'], function (data) {
            let enabled = "";
            if (data['enabled'] && (data['enabled'] != 'undefined'))
                enabled = data['enabled'];

            if (enabled != "yes") {
                typewriter_text = "";
                $("#openai_response_popup").remove();
            }
        });
    }
});

$(document).ready(function () {
    $("body").on("click", "#openai_response_close", function () {
        $("#openai_response_popup").remove();
        typewriter_text = "";
        closed_flag = true;
        return false;
    });

    $('body').on('mouseup', function () {
        chrome.storage.local.get(['enabled'], function (data) {
            let enabled = "";
            if (data['enabled'] && (data['enabled'] != 'undefined'))
                enabled = data['enabled'];
            if (enabled == 'yes') {
                let selected_text = document.getSelection().toString();
                if (selected_text.length > 0) {
                    closed_flag = false;
                    chrome.runtime.sendMessage({
                        from: 'content',
                        subject: 'explainInDetail',
                        current_url: window.location.href,
                        selected_text: selected_text
                    });
                }
            }
        });
    })
});

function type_writer() {
    var speed = 4; /* The speed/duration of the effect in milliseconds */
    if (typewriter_text && (typewriter_index < typewriter_text.length)) {
        document.getElementById("popup_answer_text").innerHTML += typewriter_text.charAt(typewriter_index);
        typewriter_index++;
        setTimeout(type_writer, speed);
    }
}


function dragElement(elmnt) {
    var pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    elmnt.onmousedown = dragMouseDown;
    function dragMouseDown(e) {
        if (e.target == elmnt) {
            e = e || window.event;
            // e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDrag;
            document.onmousemove = elDrag;
        }
    }
    function elDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
    }
    function closeDrag() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}