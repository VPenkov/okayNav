;function OkayNav(target, options) {
    // Accept a class or a DOM node as argument
    this.navigation = (typeof target === 'object' && 'nodeType' in target) ? target : document.querySelector(target);

    // Override the default options with the user options
    var defaultOptions = this._getDefaults();
    this.options = this._extend(defaultOptions, options);

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

    this.breakpoints = [];

    // Fire!
    this._init();
}

OkayNav.prototype = {

    /**
     * Returns the default options for okayNav
     */
    _getDefaults: function() {
        return {
            align_right: true, // If false, the menu and the kebab icon will be on the left
            parent: this.navigation.parentNode, // will target nav's parent by default
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
    },

    /**
     * Initialization method
     */
    _init: function() {
        this._attachNodes();
        this._cleanWhitespace();
        this._initLinkProperties();
    },

    /**
     * If the browser does not support Object.assign, use a for() loop
     * @param {Object} - target object to merge into
     * @param {Object} - source object to merge from
     */
    _extend: function(target, varArgs) {
        if (typeof Object.assign === 'function') {
            Object.assign(target, varArgs);
            return; // exit early
        }

        if (!target) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        var to = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var nextSource = arguments[index];

            if (nextSource !== null || nextSource !== undefined) { // Skip over if undefined or null and not if false
                for (var nextKey in nextSource) {
                    if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                        to[nextKey] = nextSource[nextKey];
                    }
                }
            }
        }
        return to;
    },

    /**
     * This method allows caches the selector we are getting so that
     * document.querySelector is not called twice for the same element.
     *
     * @param {String} selector - the selector you want to retrieve
     * @returns {function} - getter
     */
    _getNode: function(selector) {
        var _ELEMENT = null;

        return function getTargetNode() {
            if (!_ELEMENT) {
                _ELEMENT = document.querySelector(selector);
            }

            return _ELEMENT;
        };
    },

    /**
     * Allows us to enforce timeouts between method calls
     * to avoid calling some methods too often
     *
     * @param {Function} func - the function we would like to call
     * @param {Number} wait - the timeout in milliseconds
     * @param {Boolean} immediate - call immediately or not
     * @see {@link http://underscorejs.org/#debounce}
     */
    _debounceCall: function(func, wait, immediate) {
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
    },

    /**
     * Cleans up the whitespace between tags to ensure inline-block works correctly
     */
    _cleanWhitespace: function() {
        var cleanMarkup = this.navVisible.innerHTML.replace(/>\s+</g, "><");
        this.navVisible.innerHTML = cleanMarkup;
    },

    /**
     * Get an highest number from array
     * @param {Array} array - the array
     */
    _arrayMax: function(array) {
        return Math.max.apply(Math, array);
    },

    /**
     * Get an lowest number from array
     * @param {Array} array - the array
     */
    _arrayMin: function(array) {
        return Math.min.apply(Math, array);
    },

    /**
     * Create the invisible part of the navigation and set the classes
     */
    _attachNodes: function() {
        // Set the class to the visible part of the navigation
        this.navVisible = this.navigation.querySelector('ul');
        this.navVisible.classList.add('okayNav__nav--visible');

        // Create the invisible navigation and set its class
        this.navInvisible = document.createElement('ul');
        this.navInvisible.classList.add('okayNav__nav--invisible');
        this.navigation.appendChild(this.navInvisible);
    },

    /**
     * Run one big loop for all nav items during initialization.
     * Initial bulk routines run here to avoid performance hiccups.
     * Currently only used for caching link priorities.
     */
    _initLinkProperties: function() {
        var navItems = this.navVisible.querySelectorAll('li');

        for (var item in navItems) {
            this._savePriority(navItems[item]);
        }
    },

    /**
     * Adds the element's data-priority attribute value to the
     * invisible or visible priority list.
     * 
     * @param {Object} element - nav item DOM element
     * @param {Boolean} visible - save to the visible or invisible list
     */
    _savePriority: function(element, visible) {
        if (!element.dataset) {
            return;
        }

        var priority = element.dataset.priority || 1;

        if (visible) {
            this.priority.visible.push(priority);
        } else {
            this.priority.invisible.push(priority);
        }
    },

    /**
     * Caches the width of the wrapper when the last actionable method
     * has been called. Must be called before moving an item to the invisible part
     */
    _cacheLastBreakpoint: function() {
        this.breakpoints.push(this.getWrapperWidth());
    },

    _getLastBreakpoint: function() {
        var totalBreakpoints = this.breakpoints.length;

        return this.breakpoints[totalBreakpoints];
    },

    _removeLastBreakpoint: function() {
        this.breakpoints.pop();
    },

    /**
     * Get the width of an element's children.
     * @param {Object} element - DOM node
     */
    getChildrenWidth: function(element) {
        var totalWidth = 0;
        var children = element.children;

        for (var child in children) {
            totalWidth = totalWidth + children[child].offsetWidth;
        }

        return totalWidth;
    },

    /**
     * Get the width of the navVisible's parent
     * @returns {Number} - the total width
     */
    getWrapperWidth: function() {
        var parent = this.options.parent;
        return parent.offsetWidth;
    },

    /**
     * Get the width of the visible nav
     * @returns {Number} - the total width
     */
    getNavWidth: function() {
        return this.navVisible.offsetWidth;
    },

    /**
     * Get the width of the nav's siblings.
     * We cannot subtract the navWidth from wrapperWidth because the nav
     * might not have flex: 1 so it might not take the full available space.
     */
    getNavSiblingsWidth: function() {
        var parent = this.options.parent;
        var navWidth = this.getNavWidth();
        var wrapperChildrenWidth = this.getChildrenWidth(parent);
        var siblingsWidth = wrapperChildrenWidth - navWidth;

        return siblingsWidth;
    },

    /**
     * Calculates the available free space and returns the desired action
     * 'expand', false or 'collapse'
     *
     * @returns {String} expand|false|collapse
     */
    _getAction: function() {
        var bufferSpace = 40; // "Safety offset"
        var parentWidth = this.getWrapperWidth();
        var navWidth = this.getNavWidth();
        var navSiblingsWidth = this.getNavSiblingsWidth();
        var navItemsWidth = this.navItemsWidth || this.getNavItemsWidth(true);
        var availableSpace = parentWidth - navWidth - navSiblingsWidth;
        var expandAt = this._getLastBreakpoint();

        if (availableSpace <= (navSiblingsWidth + navItemsWidth + bufferSpace)) {
            // If available space is smaller than (navSiblingsWidth + navWidth + bufferSpace), shrink
            return 'collapse';
        } else if (availableSpace > expandAt + bufferSpace) {
            // If available space is bigger than (navWidth + cacheFirstItemWidth), expand
            return 'expand';
        } else {
            // Do nothing
            return false;
        }
    },

    /**
     * We need this method because the visible nav must not overflow.
     * Therefore, the navItems' total width could be greater than their parent's.
     *
     * @param {Boolean} cache - if true, it would cache the result to this.navItemsWidth
     */
    getNavItemsWidth: function(cache) {
        var totalWidth = this.getChildrenWidth(this.navVisible);

        if (cache) {
            this.navItemsWidth = totalWidth;
        }

        return totalWidth;
    },

    /**
     * Gets the highest or lowest-priority item either from the visible
     * or from the invisible part of the navigation.
     *
     * @param {Boolean} important - true for important, false for unimportant
     * @param {Boolean} visible
     * @returns {Number}
     */
    getItemByPriority: function(important, visible) {
        var target = important ? this._arrayMax(this.priority.visible) : this._arrayMin(this.priority.visible);

        var getFrom = function(element) {
            return element.querySelector('li[data-priority=' + target + ']');
        };

        return visible ? getFrom(this.navVisible) : getFrom(this.navInvisible);
    },

    /**
     * Move an item from the invisible to the visible part of the
     * navigation or vice versa.
     *
     * @param {Object} element - DOM node
     * @param {Boolean} visible - if true, move to visible; else move to invisible
     */
    _moveItemTo: function(element, visible) {
        var moveTo = function(navPart) {
            navPart.appendChild(element);
        };

        visible ? moveTo(this.navVisible) : moveTo(this.navInvisible);
    },

    /**
     * Hide the least important item from the visible part.
     * If items have the same priority, it will hide the first DOM match.
     */
    _collapseNavItem: function() {
        // Get least important visible item
        var nextToCollapse = this.getItemByPriority(false, true);
        this._moveItemTo(nextToCollapse, false);
    },

    /**
     * Restore the most important item from the invisible part.
     * If items have the same priority, it will hide the first DOM match.
     */
    _expandNavItem: function() {
        // Get least important invisible item
        var nextToCollapse = this.getItemByPriority(true);
        this._moveItemTo(nextToCollapse, false);
    },

    /**
     * Recursive function. It will call itself as long as an action is necessary
     * @returns {Boolean} - true if it should be called again, false otherwise
     */
    recalcNav: function() {
        var action = this.getAction();

        if (action === 'collapse') {
            this._cacheLastBreakpoint();
            this._collapseNavItem();
        } else if (action === 'expand') {
            this._expandNavItem();
        } else {
            return;
        }

        this.recalcNav();
    }
};

// OkayNav.prototype. = function() {};
