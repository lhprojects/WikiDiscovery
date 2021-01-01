

SERVER_HOSTNAME="localhost"


function on_click() {
    console.log(this)
    element = this
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        var tab = tabs[0];
        console.log(this.href)
        chrome.tabs.update(tab.id, {url: element.href});
        window.close();
    });

}

function on_request_error() {

     content = document.getElementById("content");
     bodyDiv = "<h2>Article Not Included or Internet Error!</h2>";
     content.innerHTML = bodyDiv;

}

function on_data_ready(json) {
    // data avliable, now to generate html

    results = JSON.parse(json);
    console.log(results);

    rec = []
    for (i = 0; i < 2; i++) {

        rlist = ""
        for (j = 0; j < results[i].length; j++) {

            id = `${i}_${j}`
            title=results[i][j]
            url = `https://en.wikipedia.org/wiki/` + encodeURIComponent(title);
            rlist = rlist + `<a href=${url} id="${id}"> ${title} </a><br>\n`;
        }
        rec.push(rlist)
    }


    bodyDiv = `<h2>Related Articles</h2>\n\
    ${rec[0]}\n\
    <h2>Similar Articles</h2>\n\
    ${rec[1]}\n\
    `;

     content = document.getElementById("content");
     bodyDiv =bodyDiv;
     content.innerHTML = bodyDiv;

     for (i = 0; i < 2; i++) {
        for (j = 0; j < results[i].length; j++) {

            id = `${i}_${j}`;
            a = document.getElementById(id);
            a.onclick = on_click;
        }
        rec.push(rlist)
    }
}

function request_data(title) {
    // request_data from server

    const xhr = new XMLHttpRequest();

    xhr.onload = function() {
        console.log(this);
        on_data_ready(xhr.responseText);
    }

    xhr.onerror = function() {
        console.log(this)
        on_request_error();
    }

    const url = "http://" + SERVER_HOSTNAME + ":8080/?article=" + encodeURIComponent(title);
    xhr.open("GET", url);
    xhr.send();

}

function on_tab(tab) {
    tab = tab[0];
    console.log("tab", tab);
    url = tab.url;
    title = tab.title;
    console.log("url", url);
    console.log("title", title);

    if (url.startsWith("chrome://extensions/")) {
        return
    }


    // weired way to parse url
    var parser = document.createElement('a')
    parser.href = url;
    console.log("hostname", parser.hostname);

    if (parser.hostname == "en.wikipedia.org") {
        // not on wikipeida

        console.log("on wikipeida");
        content = document.getElementById("content");
        bodyDiv = "<h2>Waiting...</h2>";
        content.innerHTML = bodyDiv;

        console.log(parser.pathname)
        pathname = decodeURIComponent(parser.pathname)
        if (pathname.startsWith("/wiki/")) {
            // this is an article
            title = pathname.substr("/wiki/".length);

            if (title.startsWith("Talk:")) {
                title = title.substr("Talk:".length)
            }

            // replace all ...
            title = title.replace("_", " ");
            title = title.replace("_", " ");
            title = title.replace("_", " ");
            title = title.replace("_", " ");
            title = title.replace("_", " ");
            console.log(title)
            request_data(title);
        }

    } else {
        // not on wikipeida
        console.log("not on wikipedia");
        content = document.getElementById("content");
        content.innerHTML = "<h2>Avaliable only on en.wikipedia.org<h2/>";
    }
    
}

chrome.tabs.query({ active: true, currentWindow: true }, on_tab);
