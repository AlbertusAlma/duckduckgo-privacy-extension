/* This class contains information about what trackers and sites
 * are on a given tab:
 *  id: Chrome tab id
 *  url: url of the tab
 *  site: ref to a Site object
 *  trackers: {object} all trackers requested on page/tab (listed by company)
 *  trackersBlocked: {object} tracker instances we blocked on page/tab (listed by company)
 *      both `trackers` and `trackersBlocked` objects are in this format:
 *      {
 *         '<companyName>': {
 *              parentCompany: ref to a Company object
 *              urls: all unique tracker urls we have seen for this company
 *              count: total number of requests to unique tracker urls for this company
 *          }
 *      }
 */
const scoreIconLocations = {
    'A': 'img/toolbar-rating-a@2x.png',
    'B': 'img/toolbar-rating-b@2x.png',
    'C': 'img/toolbar-rating-c@2x.png',
    'D': 'img/toolbar-rating-d@2x.png',
    'F': 'img/toolbar-rating-f@2x.png'
}

const Site = require('./site.es6')
const Tracker = require('./tracker.es6')
const HttpsRedirects = require('./https-redirects.es6')
const utils = require('../utils.es6')
const Companies = require('../companies.es6')
const browserWrapper = require('./../$BROWSER-wrapper.es6')

class Tab {
    constructor (tabData) {
        this.id = tabData.id || tabData.tabId
        this.trackers = {}
        this.trackersBlocked = {}
        this.url = tabData.url
        this.upgradedHttps = false
        this.requestId = tabData.requestId
        this.parentEntity = utils.findParent(tabData.url)
        this.status = tabData.status
        this.site = new Site(utils.extractHostFromURL(tabData.url))
        this.httpsRedirects = new HttpsRedirects()
        this.statusCode = null // statusCode is set when headers are recieved in tabManager.js
        this.stopwatch = {
            begin: Date.now(),
            end: null,
            completeMs: null
        }
        // set the new tab icon to the dax logo
        browserWrapper.setBadgeIcon({path: 'img/icon_48.png', tabId: tabData.tabId})
    };

    updateBadgeIcon (target) {
        if (!this.site.specialDomain()) {
            if (this.site.isBroken) {
                browserWrapper.setBadgeIcon({path: 'img/icon_48.png', tabId: this.id})
            } else {
                let scoreIcon
                if (this.site.whitelisted) {
                    scoreIcon = scoreIconLocations[this.site.score.get().before]
                } else {
                    scoreIcon = scoreIconLocations[this.site.score.get().after]
                }
                let badgeData = {path: scoreIcon, tabId: this.id}
                if (target) badgeData.target = target

                browserWrapper.setBadgeIcon(badgeData)
            }
        }
    };

    updateSite () {
        this.site = new Site(utils.extractHostFromURL(this.url))
        // reset badge to dax whenever we go to a new site
        browserWrapper.setBadgeIcon({path: 'img/icon_48.png', tabId: this.id})
    };

    // Store all trackers for a given tab even if we don't block them.
    addToTrackers (t) {
        let tracker = this.trackers[t.parentCompany]
        if (tracker) {
            tracker.increment()
            tracker.update(t)
        } else {
            let newTracker = new Tracker(t)
            this.trackers[t.parentCompany] = newTracker

            // first time we have seen this network tracker on the page
            if (t.parentCompany !== 'unknown') Companies.countCompanyOnPage(t.parentCompany)

            return newTracker
        }
    };

    addOrUpdateTrackersBlocked (t) {
        let tracker = this.trackersBlocked[t.parentCompany]
        if (tracker) {
            tracker.increment()
            tracker.update(t)
        } else {
            let newTracker = new Tracker(t)
            this.trackersBlocked[t.parentCompany] = newTracker
            return newTracker
        }
    };

    checkHttpsRequestsOnComplete () {
        // TODO later: watch all requests for http/https status and
        // report mixed content
    }

    endStopwatch () {
        this.stopwatch.end = Date.now()
        this.stopwatch.completeMs = (this.stopwatch.end - this.stopwatch.begin)
        console.log(`tab.status: complete. site took ${this.stopwatch.completeMs / 1000} seconds to load.`)
    }
}

module.exports = Tab
