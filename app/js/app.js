;function Plugin(target, options) {
    // Override the default options with the user options
    var defaultOptions = this._getDefaults();
    this.options = Object.assign(defaultOptions, options);

    /**
     * priority.visible is for the visible part of the navigation
     * and priority.invisible is the invisible part of the navigation
     * Lowest-priority items will become invisible first when shrinking.
     * Highest-priority items will become visible first when expanding.
     */
    this.priority = {
        visible: [],
        invisible: []
    };

    // Accept a class or a DOM node as argument
    this.navigation = (typeof target === 'object' && 'nodeType' in target) ? target : document.querySelector(target);

    // Fire!
    this._init();
}

/**
 * This method allows caches the selector we are getting so that
 * document.querySelector is not called twice for the same element.
 *
 * @param {String} selector - the selector you want to retrieve
 * @returns {function} - getter
 */
Plugin.prototype._getNode = function(selector) {
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
Plugin.prototype._debounceCall = function(func, wait, immediate) {
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
 * Cleans up the whitespace between tags to ensure inline-block works correctly
 */
Plugin.prototype._cleanWhitespace = function() {
    var cleanMarkup = this.navVisible.innerHTML.replace(/>\s+</g, "><");
    this.navVisible.innerHTML = cleanMarkup;
};

/**
 * Get an highest number from array
 *
 * @param {Array} array - the array
 */
Plugin.prototype._arrayMax = function(array) {
    return Math.max.apply(Math, array);
};

/**
 * Get an lowest number from array
 * @param {Array} array - the array
 */
Plugin.prototype._arrayMin = function(array) {
    return Math.min.apply(Math, array);
};

/**
 * Gets the highest priority item either from the visible
 * or from the invisible part of the navigation.
 *
 * @param {Boolean} visible
 * @returns {Number}
 */
Plugin.prototype.getMostImportant = function(visible) {
    var getFrom = function(element) {
        element.querySelector('a[data-priority=' + this._arrayMax(this.priority.visible) + ']');
    };

    return visible ? getFrom(this.navVisible) : getFrom(this.navInvisible);
};

/**
 * Gets the lowest priority item either from the visible
 * or from the invisible part of the navigation.
 *
 * @param {Boolean} visible
 * @returns {Number}
 */
Plugin.prototype.getLeastImportant = function(visible) {
    var getFrom = function(element) {
        element.querySelector('a[data-priority=' + this._arrayMin(this.priority.visible) + ']');
    };

    return visible ? getFrom(this.navVisible) : getFrom(this.navInvisible);
};

Plugin.prototype._init = function() {
    this._attachNodes();
    this._cleanWhitespace();
    this._initLinks();
};

Plugin.prototype._getDefaults = function() {
    return {
        align_right: true, // If false, the menu and the kebab icon will be on the left
        parent: this.parentNode, // will target nav's parent by default
        priority: true, // Enable/disable prioritization of items
        resize_delay: 10, // When resizing the window, 123456 can throttle its recalculations if enabled. Setting this to 50-250 will improve performance but make 123456 less accurate.
        swipe_enabled: true, // If true, you'll be able to swipe left/right to open the navigation
        threshold: 50, // Nav will auto open/close if swiped >= this many percent
        toggle_icon_class: '123456__menu-toggle',
        toggle_icon_content: '<span /><span /><span />',
        afterClose: function() {}, // Will trigger after the nav gets closed
        afterOpen: function() {}, // Will trigger after the nav gets opened
        beforeClose: function() {}, // Will trigger before the nav gets closed
        beforeOpen: function() {}, // Will trigger before the nav gets opened
        itemDisplayed: function() {},
        itemHidden: function() {}
    };
};

Plugin.prototype._collapseNavItem = function() {
    var nextToCollapse = this.getLeastImportant()
};

Plugin.prototype._expandNavItem = function() {};

Plugin.prototype._collapseAllItems = function() {};

Plugin.prototype._expandAllItems = function() {};

/**
 * Create the invisible part of the navigation and set the classes
 */
Plugin.prototype._attachNodes = function() {
    // Set the class to the visible part of the navigation
    this.navVisible = this.navigation.querySelector('ul');
    this.navVisible.classList.add('okayNav__nav--visible');

    // Create the invisible navigation and set its class
    this.navInvisible = document.createElement('ul');
    this.navInvisible.classList.add('okayNav__nav--invisible');
    this.navigation.appendChild(this.navInvisible);
};

/**
 * Run one big loop for all nav items during initialization.
 * Initial bulk routines run here to avoid performance hiccups.
 */
Plugin.prototype._initLinks = function() {
    var navItems = this.navVisible.querySelectorAll('a');

    for (var item in navItems) {
        this._savePriority(navItems[item]);
    }
};

/**
 * Adds the element's data-priority attribute value to the
 * invisible or visible priority list.
 * 
 * @param {Object} element - nav item DOM element
 * @param {Boolean} visible - save to the visible or invisible list
 */
Plugin.prototype._savePriority = function(element, visible) {
    if (!element.dataset) {
        return;
    }

    var priority = element.dataset.priority || 1;

    if (visible) {
        this.priority.visible.push(priority);
    } else {
        this.priority.invisible.push(priority);
    }
};

// Plugin.prototype. = function() {};
