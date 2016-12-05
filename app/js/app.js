'use strict';

function OkayNav(target, options) {
    var defaultOptions = {
        align_right: true, // If false, the menu and the kebab icon will be on the left
        parent: this.parentNode, // will target nav's parent by default
        priority: true, // Enable/disable prioritization of items
        resize_delay: 10, // When resizing the window, okayNav can throttle its recalculations if enabled. Setting this to 50-250 will improve performance but make okayNav less accurate.
        swipe_enabled: true, // If true, you'll be able to swipe left/right to open the navigation
        threshold: 50, // Nav will auto open/close if swiped >= this many percent
        toggle_icon_class: 'okayNav__menu-toggle',
        toggle_icon_content: '<span /><span /><span />',
        afterClose: function() {}, // Will trigger after the nav gets closed
        afterOpen: function() {}, // Will trigger after the nav gets opened
        beforeClose: function() {}, // Will trigger before the nav gets closed
        beforeOpen: function() {}, // Will trigger before the nav gets opened
        itemDisplayed: function() {},
        itemHidden: function() {}
    };

    // Override the default options with the user options
    this.options = Object.assign(defaultOptions, options);

    // Initialize structure
    this.attachNodes();

    /**
     * priority.visible is for the visible part of the navigation
     * and priority.hidden is the hidden part of the navigation
     * Lowest-priority items will become hidden first when shrinking.
     * Highest-priority items will become visible first when expanding.
     */
    this.priority = {
        visible: [],
        hidden: []
    };
}

/**
 * This method allows caches the selector we are getting so that
 * document.querySelector is not called twice for the same element.
 *
 * @param {String} selector - the selector you want to retrieve
 * @returns {function} - getter
 */
OkayNav.prototype._getNode = function(selector) {
    var _ELEMENT = null;

    return function getTargetNode() {
        if (!_ELEMENT) {
            _ELEMENT = document.querySelector(selector);
        }

        return _ELEMENT;
    };
};

/**
 * Allows us to enforce timeouts between method calls
 * to avoid calling some methods too often
 *
 * @param {Function} func - the function we would like to call
 * @param {Number} wait - the timeout in milliseconds
 * @param {Boolean} immediate - call immediately or not
 * @see {@link http://underscorejs.org/#debounce}
 */
OkayNav.prototype._debounceCall = function(func, wait, immediate) {
    var timeout;

    return function() {
        var self = this;
        var args = arguments;
    
        var later = function() {
            timeout = null;
            if (!immediate) {
                func.apply(self, args);
            }
        };
    
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);

        if (callNow) {
            func.apply(self, args);
        }
    };
};

/**
 * Get an highest number from array
 * @param {Array} array - the array
 */
OkayNav.prototype._arrayMax = function(array) {
    return Math.max.apply(Math, array);
};

/**
 * Get an lowest number from array
 * @param {Array} array - the array
 */
OkayNav.prototype._arrayMin = function(array) {
    return Math.min.apply(Math, array);
};

/**
 * Adds the element's data-priority attribute value
 * to the priority list.
 * 
 * @param {Object} - nav item DOM element
 */
OkayNav.prototype._setPriority = function(element) {
    this.priority.visible.push(element.dataset.priority);
};

/**
 * Gets the lowest priority item either from the visible
 * or from the hidden part of the navigation.
 * @param {Boolean} visible
 * @returns {Number}
 */
OkayNav.prototype._getLowestPriority = function(visible) {
    var result = visible ? this._arrayMin(this.priority.visible) : this._arrayMin(this.priority.hidden);
    
    return result;
};

OkayNav.prototype.attachNodes = function() {
    console.log(this.options.parent);
};

new OkayNav(document.body);
