/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

(function($, dataLayer) {
    'use strict';

    var $html = $(document.documentElement);
    var client = window.Mozilla.Client;
    var state; // track page state

    // check page version for tests
    var version = Number($('#masthead').data('version'));

    // duplicate and move /all link for desktop test
    var setupTest = function(version) {
        var $dlButton = $('#download-button-desktop-release');
        var $newLink;
        var linkCss;

        // make sure desktop download button exists and user is on a recognized platform
        if ($dlButton.length && $dlButton.find('.unrecognized-download:visible').length === 0) {
            linkCss = {
                'display': 'inline-block',
                'paddingTop': '10px'
            };

            if (version === 1) {
                // snag the link from the footer
                $newLink = $('#fx-footer-links-desktop-all').clone();

                // make footer element was found
                if ($newLink.length) {
                    $newLink.css(linkCss).data({
                        // GTM stuff?
                        'foo': 'bar',
                        'flim': 'flam'
                    });
                }
            } else if (version === 2) {
                // pull the nojs links out of the modal's download button
                var $directLis = $('#fx-modal-download .nojs-download li').remove();

                // container to hold direct download links in the modal
                var $modalDirectDownloadList = $('#fx-modal-direct-downloads');

                // os's to filter out of modal (as we have the app store specific buttons displayed already)
                var mobileOs = ['android', 'ios'];

                // remove button-y CSS
                $directLis.find('a').removeClass('button green').data({
                    // GTM stuff?
                    'boo': 'far',
                    'film': 'falm"'
                });

                // place 'other platform' links in the modal
                $directLis.each(function(i, li) {
                    // do not include mobileOs's
                    if (mobileOs.indexOf($(li).find('a').data('download-os').toLowerCase()) === -1) {
                        $modalDirectDownloadList.append(li);
                    }
                });

                // get platform display name
                var platformDisplayName = $dlButton.find('.download-list li:visible a').data('display-name');

                // make sure user is on a supported platform
                if (platformDisplayName) {
                    // put "for {user's os}" text underneath modal primary dl button
                    $('#fx-modal-user-platform').text('for ' + platformDisplayName);
                } else {
                    $('#fx-modal-user-platform').remove();
                }

                // conjure up a new link that will trigger the modal
                $newLink = $('<a href="" id="fx-modal-link">Download Firefox for another platform</a>');

                $newLink.css(linkCss).on('click', function(e) {
                    e.preventDefault();

                    // open up said modal
                    Mozilla.Modal.createModal(this, $('#fx-modal'));
                });
            }

            // place the new link (modal or direct to /firefox/all) underneath
            // the main download button
            $dlButton.append($newLink);
        }
    };

    setupTest(version);

    var uiTourSendEvent = function(action, data) {
        var event = new CustomEvent('mozUITour', {
            bubbles: true,
            detail: {
                action: action,
                data: data || {}
            }
        });

        document.dispatchEvent(event);
    };

    var uiTourWaitForCallback = function(callback) {
        var id = Math.random().toString(36).replace(/[^a-z]+/g, '');

        function listener(event) {
            if (typeof event.detail != 'object') {
                return;
            }
            if (event.detail.callbackID !== id) {
                return;
            }

            document.removeEventListener('mozUITourResponse', listener);
            callback(event.detail.data);
        }
        document.addEventListener('mozUITourResponse', listener);

        return id;
    };

    var showRefreshButton = function(canReset) {
        if (canReset) {
            $html.addClass('show-refresh');

            $('#refresh-firefox').on('click', function() {
                uiTourSendEvent('resetFirefox');
            });
        }
    };

    if (client.isFirefoxDesktop ||client.isFirefoxAndroid) {
        // Detect whether the Firefox is up-to-date in a non-strict way. The minor version and channel are not
        // considered. This can/should be strict, once the UX especially for ESR users is decided. (Bug 939470)
        if (client._isFirefoxUpToDate(false)) {
            // the firefox-latest class prevents the download button from displaying
            $html.addClass('firefox-latest');
            // if user is on desktop release channel and has latest version, offer refresh button
            if (client.isFirefoxDesktop) {
                client.getFirefoxDetails(function(data) {
                    // data.accurate will only be true if UITour API is working.
                    if (data.channel === 'release' && data.isUpToDate && data.accurate) {
                        // Bug 1274207 only show reset button if user profile supports it.
                        uiTourSendEvent('getConfiguration', {
                            callbackID: uiTourWaitForCallback(showRefreshButton),
                            configuration: 'canReset'
                        });

                        // show survey to up-to-date Firefox users (bug 1290996).
                        var $survey = $('#survey-message');

                        $survey.addClass('show');
                        setTimeout(function() {
                            $survey.addClass('animate');
                        }, 500);
                    }
                });
            }
        } else {
            $html.addClass('firefox-old');
        }
    }

    // Add GA custom tracking and external link tracking
    state = 'Desktop, not Firefox';

    if (client.platform === 'android') {
        if ($html.hasClass('firefox-latest')) {
            state = 'Android, Firefox up-to-date';
        } else if ($html.hasClass('firefox-old')) {
            state = 'Android, Firefox not up-to-date';
        } else {
            state = 'Android, not Firefox';
        }
    } else if (client.platform === 'ios') {
        state = 'iOS';
    } else if (client.platform === 'fxos') {
        state = 'FxOS';
    } else {
        if ($html.hasClass('firefox-latest')) {
            state = 'Desktop, Firefox up-to-date';
        } else if ($html.hasClass('firefox-old')) {
            state = 'Desktop, Firefox not up-to-date';
        }
    }

    //GA Custom Dimension in Pageview
    dataLayer.push({
        'event': 'set-state',
        'state': state
    });

})(window.jQuery, window.dataLayer = window.dataLayer || []);
