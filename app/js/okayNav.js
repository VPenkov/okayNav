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
class OkayNav {
    constructor(target, options) {
        // Accept a class or a DOM node as argument
        this.navigation = (typeof target === 'object' && 'nodeType' in target) ? target : document.querySelector(target);

        // Override the default options with the user options
        options = options || {};
        this.options = {
            align_right: options.align_right || true, // If false, the menu and the kebab icon will be on the left
            parent: options.parent || this.navigation.parentNode, // will target nav's parent by default
            resize_delay: options.resize_delay || 10, // When resizing the window, okayNav can throttle its recalculations if enabled. Setting this to 50-250 will improve performance but make okayNav less accurate.
            swipe_enabled: options.swipe_enabled || true, // If true, you'll be able to swipe left/right to open the navigation
            threshold: options.threshold || 20, // Nav will auto open/close if swiped >= this many percent
            toggle_icon_class: options.toggle_icon_class || 'okayNav__menu-toggle', // classname of the toggle button
            toggle_icon_parent_class: options.toggle_icon_parent_class || 'okayNav__item', // classname of the <li> wrapping the toggle butotn
            toggle_icon_content: options.toggle_icon_content || '<svg viewBox="0 0 100 100"><g><circle cx="51" cy="17.75" r="10.75"></circle><circle cx="51" cy="50" r="10.75"></circle><circle cx="51" cy="82.25" r="10.75"></circle></g></svg>',
            afterClose: options.afterClose || function() {}, // Will trigger after the nav gets closed
            afterOpen: options.afterOpen || function() {}, // Will trigger after the nav gets opened
            beforeClose: options.beforeClose || function() {}, // Will trigger before the nav gets closed
            beforeOpen: options.beforeOpen || function() {}, // Will trigger before the nav gets opened
            itemDisplayed: options.itemDisplayed || function() {},
            itemHidden: options.itemHidden || function() {}
        };

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

    /**
     * Initialization method
     */
    _init() {
        this._attachNodes();
        this._cleanWhitespace();
        this._initLinkProperties();
        this._attachEvents();
    }

    /**
     * Allows us to enforce timeouts between method calls
     * to avoid calling them too often and decrease performance
     *
     * @param {Function} fn - the function we would like to call
     * @param {Number} wait - the timeout in milliseconds
     * @param {Boolean} immediate - call immediately or not
     * @see {@link http://underscorejs.org/#debounce}
     */
    _debounce(fn, wait, immediate) {
        let timeout;
        let self = this;

        return () => {
            let args = arguments;

            let later = () => {
                timeout = null;
                if (!immediate) {
                    fn.apply(self, args);
                }
            };

            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);

            if (callNow) {
                fn.apply(self, args);
            }
        };
    }

    /**
     * Cleans up the whitespace between tags to ensure inline-block works correctly
     */
    _cleanWhitespace() {
        let cleanMarkup = this.navVisible.innerHTML.replace(/>\s+</g, '><');
        this.navVisible.innerHTML = cleanMarkup;
    }

    /**
     * Get the highest number from array
     * @param {Array} array - the array
     */
    _arrayMax(array) {
        return Math.max(...array);
    }

    /**
     * Get the lowest number from array
     * @param {Array} array - the array
     */
    _arrayMin(array) {
        return Math.min(...array);
    }

    /**
     * Create the invisible part of the navigation and set the classes
     */
    _attachNodes() {
        // Set the class to the visible part of the navigation
        this.navVisible = this.navigation.querySelector('ul');
        this.navVisible.classList.add('okayNav__nav--visible');

        // Create the invisible navigation and set its class
        this.navInvisible = document.createElement('ul');
        this.navInvisible.classList.add('okayNav__nav--invisible');
        this.navigation.appendChild(this.navInvisible);

        // Create the toggle button
        let closeButton = this._createToggleButton();
        this.navVisible.appendChild(closeButton);
    }

    /**
     * You'd never guess what this does
     * @returns {Object} - DOM node containing the toggle button
     */
    _createToggleButton() {
        let toggleButton = document.createElement('button');
        toggleButton.classList.add(this.options.toggle_icon_class);
        toggleButton.innerHTML = this.options.toggle_icon_content;

        let toggleButtonWrapper = document.createElement('li');
        toggleButtonWrapper.classList.add(this.options.toggle_icon_parent_class);
        toggleButtonWrapper.appendChild(toggleButton);

        return toggleButtonWrapper;
    }

    /**
     * Attach window events
     */
    _attachEvents() {
        let events = ['load', 'resize'];

        for (let event of events) {
            window.addEventListener(event,
                this._debounce(this.recalcNav, this.options.resize_delay)
            );
        }
    }

    /**
     * Run one big loop for all nav items during initialization.
     * Initial bulk routines run here to avoid performance hiccups.
     * Currently only used for caching link priorities.
     */
    _initLinkProperties() {
        let navItems = this.navVisible.children;

        for (let i = 0; i < navItems.length; i++) {
            this._savePriority(navItems[i], true);
            this._savePosition(navItems[i], i);
        }

        this.priority.visible.pop();
    }

    /**
     * Adds the element's data-priority attribute value to the
     * invisible or visible priority list.
     *
     * @param {Object} element - nav item node
     * @param {Boolean} visible - save to the visible or invisible list
     */
    _savePriority(element, visible) {
        let itemPriority = element.getAttribute('data-okaynav-priority') || 1;
        itemPriority = parseInt(itemPriority);
        let priorityList = visible ? 'visible' : 'invisible';

        this.priority[priorityList].push(itemPriority);
    }

    _savePosition(element, position) {
        element.setAttribute('data-okaynav-position', position);
    }

    /**
     * Get the total width of an element's children.
     * @param {Number} - the total width of childre
     */
    getChildrenWidth(element) {
        let totalWidth = 0;
        let children = element.children;

        for (let child of children) {
            totalWidth += child.offsetWidth || 0;
        }

        return totalWidth;
    }

    /**
     * Get the width of the navVisible's parent
     * @returns {Number} - the total width
     */
    getWrapperWidth() {
        let parent = this.options.parent;

        return parent.offsetWidth;
    }

    /**
     * Get the width of the visible nav
     * @returns {Number} - the total width
     */
    getNavWidth() {
        return this.navVisible.offsetWidth;
    }

    getWrapperChildrenWidth() {
        return this.getChildrenWidth(this.options.parent);
    }

    /**
     * Calculates the available free space and returns the desired action
     * 'expand', false or 'collapse'
     *
     * @returns {String} expand|false|collapse
     */
    _getAction() {
        let action;
        let bufferSpace = this.options.threshold; // "Safety offset"
        let parentWidth = this.getWrapperWidth();
        let wrapperChildrenWidth = this.getWrapperChildrenWidth();
        let availableSpace = parentWidth - wrapperChildrenWidth - bufferSpace;

        if (availableSpace <= 0) {
            // If available space is not enough, shrink
            action = 'collapse';
        } else if (availableSpace > this.itemWidths[0]) {
            // If available space is bigger than the last breakpoint we've shrinked at, expand
            action = 'expand';
        } else {
            // Do nothing if no collapsed items
            action = false;
        }

        return action;
    }

    /**
     * Gets the highest or lowest-priority item either from the visible
     * or from the invisible part of the navigation.
     *
     * @param {Boolean} important - true for important, false for unimportant
     * @param {Boolean} visible - if false, it will fetch an item from the invisible part
     * @returns {Number}
     */
    getItemByPriority(important, visible) {
        let targetNav = visible ? this.navVisible : this.navInvisible;
        let targetArray = visible ? this.priority.visible : this.priority.invisible;
        let priority = important ? this._arrayMax(targetArray) : this._arrayMin(targetArray);

        let item = targetNav.querySelector('li[data-okaynav-priority="' + priority + '"]');

        return item;
    }

    /**
     * Move an item from the invisible to the visible part of the
     * navigation or vice versa.
     *
     * @TODO: when moving to the visible part, move before the toggle button
     *
     * @param {Object} element - DOM node
     * @param {Boolean} visible - if true, move to visible; else move to invisible
     */
    _moveItemTo(element, visible) {
        if (visible) {
            this.navVisible.insertBefore(element, this.toggleButtonWrapper);
        } else {
            this.navInvisible.appendChild(element);
        }
    }

    /**
     * Hide the least important item from the visible part.
     * If items have the same priority, it will hide the first DOM match.
     */
    _collapseNavItem() {
        // Get least important visible item
        let nextToCollapse = this.getItemByPriority(false, true);

        // Save it to the invisible list
        this._savePriority(nextToCollapse, false);

        // Remove it from the visible list
        this.priority.visible.shift();

        // Cache its width
        this.itemWidths.push(nextToCollapse.scrollWidth);

        // Move the item
        this._moveItemTo(nextToCollapse, false);

        // callback
        this.options.itemHidden.call();
    }

    /**
     * Restore the most important item from the invisible part.
     * If items have the same priority, it will hide the first DOM match.
     */
    _expandNavItem() {
        // Get least important invisible item
        let nextToCollapse = this.getItemByPriority(true, false);
        this._moveItemTo(nextToCollapse, true);
        this.itemWidths.pop();

        // callback
        this.options.itemDisplayed.call();
    }

    /**
     * Recursive function. It will call itself as long as an action is necessary
     */
    recalcNav() {
        let action = this._getAction();

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
}

module.exports = OkayNav;
