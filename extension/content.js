var last_stand = false;

function communicateToBackground(host, anime, cur_ep = null, max_ep = null, season = null, episode = null) {

    browser.runtime.sendMessage({ "cmd": "check" })
        .then((response) => {

            console.info("Playing_state: ", response);

            if (response == true && last_stand == false) {

                browser.storage.local.get("anilist").then((url) => {

                    if (url.anilist == undefined) {
                        url.anilist = "";
                    }

                    if (host == "aniworld") {

                        browser.runtime.sendMessage({
                            "cmd": "update",
                            "args": {
                                "type": "update",
                                "host": "aniworld",
                                "details": anime,
                                "state": `Episode (${cur_ep} of ${max_ep}), Season ${season}`,
                                "anilist": url.anilist
                            }
                        });

                    }

                    else if (host == "crunchyroll") {

                        browser.runtime.sendMessage({
                            "cmd": "update",
                            "args": {
                                "type": "update",
                                "host": "crunchyroll",
                                "details": anime,
                                "state": `Episode: ${episode}`,
                                "anilist": url.anilist
                            }
                        });

                    }

                    else if (host == "animesama") {

                        browser.runtime.sendMessage({
                            "cmd": "update",
                            "args": {
                                "type": "update",
                                "host": "animesama",
                                "details": anime,
                                "state": `Episode (${cur_ep} of ${max_ep})${season ? " - " + season : ""}`,
                                "anilist": url.anilist
                            }
                        });

                    }

                });

            }

            else if (response == false && last_stand == true) {
                browser.runtime.sendMessage({ "cmd": "clear" });
            }

            last_stand = response;
        });
}


// wait for element to appear
function waitElement(selector, callback) {
    var observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            var element = mutation.target.querySelector(selector);
            if (element) {
                observer.disconnect();
                callback(element);
            }
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
}


window.onload = () => {

    // aniworld
    if (document.location.host == "aniworld.to") {

        console.clear();

        let streamBox = document.getElementsByClassName("inSiteWebStream");

        if (streamBox.length > 0) {

            let infos = document.getElementsByClassName("hosterSiteTitle")[0];

            if (infos.getAttribute("data-season") != "0") {

                var anime = document.getElementsByClassName("series-title")[0].children[0].innerText;
                var season = infos.getAttribute("data-season");
                var cur_ep = document.getElementsByClassName("active")[1].innerText;
                var max_ep = document.getElementsByClassName("active")[1].parentElement.parentElement.childElementCount - 1;

                console.log("Anime: ", anime);
                console.log("Season: ", season);
                console.log("Cur Episode: ", cur_ep);
                console.log("Max Episode: ", max_ep);

                browser.storage.local.set({
                    "cur_stream_data": {
                        "anime": anime,
                        "cur_ep": cur_ep,
                        "tot_ep": max_ep,
                        "season": season
                    }
                });

                let checkPlaying = setInterval(() => {

                    browser.storage.local.get('auto_rpc').then((item) => {

                        if (item.auto_rpc == undefined) {
                            browser.storage.local.set({ "auto_rpc": "enabled" });
                            item.auto_rpc = "enabled";
                        }

                        if (item.auto_rpc == 'enabled') {
                            communicateToBackground("aniworld", anime, cur_ep, max_ep, season);
                        }
                    });

                }, 5000);
            }
        }
    }


    // crunchyrol
    if (document.location.host == "www.crunchyroll.com") {

        console.clear();

        waitElement('.erc-current-media-info', () => {

            var anime = document.querySelector("a.show-title-link").innerText;
            var episode = document.querySelector(".erc-current-media-info h1.title").innerText;

            console.log("Anime: ", anime);
            console.log("Episode: ", episode);

            browser.storage.local.set({
                "cur_stream_data": {
                    "anime": anime,
                    "cur_ep": "",
                    "tot_ep": "",
                    "season": ""
                }
            });

            let checkPlaying = setInterval(() => {

                browser.storage.local.get('auto_rpc').then((item) => {

                    if (item.auto_rpc == undefined) {
                        browser.storage.local.set({ "auto_rpc": "enabled" });
                        item.auto_rpc = "enabled";
                    }

                    if (item.auto_rpc == 'enabled') {
                        communicateToBackground("crunchyroll", anime, null, null, null, episode);
                    }
                });

            }, 5000);

        });
    }


    // animesama
    if (document.location.host.includes("anime-sama")) {

        console.clear();

        const anime =
            document.getElementById("titreOeuvre")?.innerText || "";

        const season =
            document.getElementById("avOeuvre")?.innerText || "";

        const episode =
            document.getElementById("selectEpisodes")?.value || "";

        const totalEpisodes =
            document.getElementById("selectEpisodes")?.options.length || "";

        console.log("Anime:", anime);
        console.log("Season:", season);
        console.log("Episode:", episode);
        console.log("Total Episodes:", totalEpisodes);

        browser.storage.local.set({
            "cur_stream_data": {
                "anime": anime,
                "cur_ep": episode.replace("Episode ", ""),
                "tot_ep": totalEpisodes,
                "season": season
            }
        });

        let checkPlaying = setInterval(() => {

            browser.storage.local.get('auto_rpc').then((item) => {

                if (item.auto_rpc == undefined) {
                    browser.storage.local.set({ "auto_rpc": "enabled" });
                    item.auto_rpc = "enabled";
                }

                if (item.auto_rpc == "enabled") {
                    communicateToBackground(
                        "animesama",
                        anime,
                        episode.replace("Episode ", ""),
                        totalEpisodes,
                        season
                    );
                }
            });

        }, 5000);
    }
};


// stop rpc on close
window.onbeforeunload = () => {

    browser.storage.local.get('auto_rpc').then((item) => {

        if (item.auto_rpc == undefined) {
            browser.storage.local.set({ "auto_rpc": "enabled" });
            item.auto_rpc = "enabled";
        }

        if (item.auto_rpc == 'enabled') {
            browser.runtime.sendMessage({ "cmd": "clear" });
        }
    });
};
