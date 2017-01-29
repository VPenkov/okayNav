/**
 * OkayNav constructor
 * @param {String|Object} target - a selector or a DOM node to apply okayNav on
 * @param {Object} options - the options
 *
 * @example
 * new OkayNav('.nav-main', {
 *     swipe_enabled: false
 * });
 */
;function OkayNav(target, options) {
    // Polyfill Object.assign if necessary
    this._objectAssign();

    // Accept a class or a DOM node as argument
    this.navigation = (typeof target === 'object' && 'nodeType' in target) ? target : document.querySelector(target);

    // Override the default options with the user options
    this.options = Object.assign(this._getDefaults(), options);

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

    /**
     * Right before hiding a nav item, okayNav will cache its width
     * in this array in order to determine when it should be expanded
     * if the viewport gets expanded. We cache it here because we want
     * to know before its style gets changed when moved.
     */
    this.itemWidths = [];

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
            resize_delay: 10, // When resizing the window, okayNav can throttle its recalculations if enabled. Setting this to 50-250 will improve performance but make okayNav less accurate.
            swipe_enabled: true, // If true, you'll be able to swipe left/right to open the navigation
            threshold: 50, // Nav will auto open/close if swiped >= this many percent
            toggle_icon_class: 'okayNav__menu-toggle', // classname of the toggle button
            toggle_icon_parent_class: 'okayNav__item', // classname of the <li> wrapping the toggle butotn
            toggle_icon_content: '<svg viewBox="0 0 100 100"><title>Navigation</title><g><circle cx="51" cy="17.75" r="10.75"></circle><circle cx="51" cy="50" r="10.75"></circle><circle cx="51" cy="82.25" r="10.75"></circle></g></svg>',
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
        this._attachEvents();
    },

    /**
     * If the browser does not support Object.assign, use a for() loop
     */
    _objectAssign: function() {
        if (Object.assign !== undefined) {
            return Object.assign;
        }

        return function(target) {
            if (target === null || target === undefined) {
                target = {};
            }

            target = Object(target);
            for (var i = 1; i < arguments.length; i++) {
                var source = arguments[i];
                if (source !== null) {
                    for (var key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
            return target;
        };
    },

    /**
     * Allows us to enforce timeouts between method calls
     * to avoid calling them too often and decrease performance
     * @TODO
     *
     * @param {Function} fn - the function we would like to call
     * @param {Number} wait - the timeout in milliseconds
     * @param {Boolean} immediate - call immediately or not
     * @see {@link http://underscorejs.org/#debounce}
     */
    _debounce: function(fn, wait, immediate) {
        var timeout;

        return function() {
            var self = this;
            var args = arguments;

            var later = function() {
                timeout = null;
                if (!immediate) {
                    fn.apply(self, args);
                }
            };

            var callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) {
                fn.apply(self, args);
            }
        };
    },

    /**
     * Cleans up the whitespace between tags to ensure inline-block works correctly
     */
    _cleanWhitespace: function() {
        var cleanMarkup = this.navVisible.innerHTML.replace(/>\s+</g, '><');
        this.navVisible.innerHTML = cleanMarkup;
    },

    /**
     * Get the highest number from array
     * @param {Array} array - the array
     */
    _arrayMax: function(array) {
        return Math.max.apply(Math, array);
    },

    /**
     * Get the lowest number from array
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

        // Create the toggle button
        var closeButton = this._createToggleButton();
        this.navVisible.appendChild(closeButton);
    },

    /**
     * You'd never guess what this does
     * @returns {Object} - DOM node containing the toggle button
     */
    _createToggleButton: function() {
        var toggleButton = document.createElement('button');
        toggleButton.classList.add(this.options.toggle_icon_class);
        toggleButton.innerHTML = this.options.toggle_icon_content;

        var toggleButtonWrapper = document.createElement('li');
        toggleButtonWrapper.classList.add(this.options.toggle_icon_parent_class);
        toggleButtonWrapper.dataset.priority = 9999;
        toggleButtonWrapper.appendChild(toggleButton);

        return toggleButtonWrapper;
    },

    /**
     * Attach window events
     */
    _attachEvents: function() {
        window.addEventListener('resize', this.getWindowResizeEvent.bind(this));
    },

    /**
     * Actions which need to occur on resize
     */
    getWindowResizeEvent: function() {
        this._debounce(this.recalcNav(), this.options.resize_delay);
    },

    /**
     * Run one big loop for all nav items during initialization.
     * Initial bulk routines run here to avoid performance hiccups.
     * Currently only used for caching link priorities.
     */
    _initLinkProperties: function() {
        var navItems = this.navVisible.children;

        for (var i = 0; i < navItems.length; i++) {
            this._savePriority(navItems[i], true);
        }
    },

    /**
     * Adds the element's data-priority attribute value to the
     * invisible or visible priority list.
     *
     * @param {Object} element - nav item node
     * @param {Boolean} visible - save to the visible or invisible list
     */
    _savePriority: function(element, visible) {
        var itemPriority = element.getAttribute('data-priority') || 1;
        var priorityList = visible ? 'visible' : 'invisible';

        this.priority[priorityList].push(itemPriority);
    },

    /**
     * Get the total width of an element's children.
     * @param {Number} - the total width of childre
     */
    getChildrenWidth: function(element) {
        var totalWidth = 0;
        var children = element.children;

        for (var i = 0; i < children.length; i++) {
            totalWidth += children[i].offsetWidth || 0;
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

    getWrapperChildrenWidth: function() {
        return this.getChildrenWidth(this.options.parent);
    },

    /**
     * Calculates the available free space and returns the desired action
     * 'expand', false or 'collapse'
     *
     * @returns {String} expand|false|collapse
     */
    _getAction: function() {
        var action;
        var bufferSpace = this.options.threshold; // "Safety offset"
        var parentWidth = this.getWrapperWidth();
        var wrapperChildrenWidth = this.getWrapperChildrenWidth();
        var availableSpace = parentWidth - wrapperChildrenWidth - bufferSpace;
        var expandAt = availableSpace + this.itemWidths[0];

        if (availableSpace <= 0) {
            // If available space is not enough, shrink
            action = 'collapse';
        } else if (parentWidth > expandAt) {
            // If available space is bigger than the last breakpoint we've shrinked at, expand
            action = 'expand';
        } else {
            // Do nothing
            action = false;
        }

        return action;
    },

    /**
     * Gets the highest or lowest-priority item either from the visible
     * or from the invisible part of the navigation.
     *
     * @param {Boolean} important - true for important, false for unimportant
     * @param {Boolean} visible - if false, it will fetch an item from the invisible part
     * @returns {Number}
     */
    getItemByPriority: function(important, visible) {
        var targetNav = visible ? this.navVisible : this.navInvisible;
        var targetArray = visible ? this.priority.visible : this.priority.invisible;
        var priority = important ? this._arrayMax(targetArray) : this._arrayMin(targetArray);

        var item = targetNav.querySelector('li[data-priority="' + priority + '"]');

        return item;
    },

    /**
     * Move an item from the invisible to the visible part of the
     * navigation or vice versa.
     *
     * @param {Object} element - DOM node
     * @param {Boolean} visible - if true, move to visible; else move to invisible
     */
    _moveItemTo: function(element, visible) {
        var targetNav = visible ? this.navVisible : this.navInvisible;

        targetNav.appendChild(element);
    },

    /**
     * Hide the least important item from the visible part.
     * If items have the same priority, it will hide the first DOM match.
     */
    _collapseNavItem: function() {
        // Get least important visible item
        var nextToCollapse = this.getItemByPriority(false, true);

        // Save it to the invisible list
        this._savePriority(nextToCollapse, false);

        // Remove it from the visible list
        this.priority.visible.shift();

        // MCache its width
        this.itemWidths.push(nextToCollapse.scrollWidth);

        // Move the item
        this._moveItemTo(nextToCollapse, false);

        // callback
        this.options.itemHidden.call();
    },

    /**
     * Restore the most important item from the invisible part.
     * If items have the same priority, it will hide the first DOM match.
     */
    _expandNavItem: function() {
        // Get least important invisible item
        var nextToCollapse = this.getItemByPriority(true, false);
        this._moveItemTo(nextToCollapse, true);
        this.itemWidths.pop();

        // callback
        this.options.itemDisplayed.call();
    },

    /**
     * Recursive function. It will call itself as long as an action is necessary
     */
    recalcNav: function() {
        var action = this._getAction();

        if (action === 'collapse') {
            this._collapseNavItem();
        } else if (action === 'expand') {
            this._expandNavItem();
        } else {
            // exit if no further recalcs are necessary
            return;
        }

        // If we haven't exited yet, check again if we're good to go
        this.recalcNav();
    }
};
