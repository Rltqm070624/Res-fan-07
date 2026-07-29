
(function () {
    function showLive() {
        var badge = document.getElementById('liveStatusBadge');
        var offlineBox = document.getElementById('liveOfflineBox');
        var iframe = document.getElementById('todayLiveIframe');
        if (badge) badge.style.display = 'flex';
        if (offlineBox) offlineBox.style.display = 'none';
        if (iframe) iframe.style.display = 'block';
    }

    function showOffline() {
        var badge = document.getElementById('liveStatusBadge');
        var offlineBox = document.getElementById('liveOfflineBox');
        var iframe = document.getElementById('todayLiveIframe');
        if (badge) badge.style.display = 'none';
        if (offlineBox) offlineBox.style.display = 'flex';
        if (iframe) iframe.style.display = 'none';
    }

    var resolved = false;
    function resolveOnce(fn) {
        if (resolved) return;
        resolved = true;
        fn();
    }

    var iframeEl = document.getElementById('todayLiveIframe');
    if (!iframeEl) return;

    // 안전장치: 6초 안에 상태가 확인되지 않으면 오프라인으로 간주
    setTimeout(function () { resolveOnce(showOffline); }, 6000);

    window.onYouTubeIframeAPIReady = function () {
        try {
            new YT.Player('todayLiveIframe', {
                events: {
                    onError: function () { resolveOnce(showOffline); },
                    onStateChange: function (e) {
                        // -1 unstarted, 0 ended, 1 playing, 2 paused, 3 buffering, 5 cued
                        if (e.data === YT.PlayerState.PLAYING || e.data === YT.PlayerState.BUFFERING) {
                            resolveOnce(showLive);
                        } else if (e.data === YT.PlayerState.ENDED) {
                            resolveOnce(showOffline);
                        }
                    }
                }
            });
        } catch (e) {
            resolveOnce(showOffline);
        }
    };

    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
        document.head.appendChild(tag);
    }
})();
