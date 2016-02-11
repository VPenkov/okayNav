;(function ( $, window, document, undefined ) {

    // Defaults
    var okayNav = 'okayNav',
        defaults = {
            swipe : true,
            nav_parent : '', // will call nav's parent() by default
            nav_toggle_icon_class : 'okayNav__menu-toggle',
            nav_toggle_icon_content: '<span /><span /><span />',
            nav_beforeopen : function() {}, // Will trigger before the nav gets opened
            nav_open : function() {}, // Will trigger after the nav gets opened
            nav_beforeclose : function() {}, // Will trigger before the nav gets closed
            nav_close : function() {}, // Will trigger after the nav gets closed
        };

    // Begin
    function Plugin( element, options ) {
        this.options = $.extend( {}, defaults, options) ;
        _okayNav = this; // Plugin

        _invisibleNavState = false; // Is the hidden menu open?
        _options = this.options;

        $document = $(document); // for event triggering
        $window = $(window); // for load/resize events
        $body = $('body'); // for controlling the overflow
        $navigation = $(element); // jQuery object

        this.options.nav_parent == '' ? this.options.nav_parent = $navigation.parent() : '';

        // At this point, we have access to the jQuery element and the options
        // via the instance, e.g., $navigation and _options. We can access these
        // anywhere in the plugin.
        _okayNav.init();
    }

    Plugin.prototype = {

        init: function () {
            // Some DOM manipulations
            _okayNav.setupElements($navigation);

            // Cache new elements for further use
            $nav_visible = $navigation.children('.okayNav__nav--visible');
            $nav_invisible = $navigation.children('.okayNav__nav--invisible');
            $nav_toggle_icon = $navigation.children('.' + _options.nav_toggle_icon_class);
            _nav_toggle_icon_width = $nav_toggle_icon.outerWidth();

            // Events are up once everything is set
            _okayNav.initEvents();
        },

        /*
         * Let's setup the elements and attach events
         */
        // Elements
        setupElements: function(el) {
            $body.addClass('okayNav-loaded');

            // Add classes
            $navigation
                .addClass('okayNav loaded')
                .children('ul').addClass('okayNav__nav--visible');
                //   .append('<ul class="okayNav__nav--invisible" />'); // add the invisible menu part

            // Append elements
            $navigation
                .append('<ul class="okayNav__nav--invisible"><li><a href="#">Test</a></li></ul>')
                .append('<a href="#" class="' + _options.nav_toggle_icon_class + '">' + _options.nav_toggle_icon_content + '</a>')
        },

        // Events
        initEvents: function() {
            // Toggle hidden nav when hamburger icon is clicked
            $document.on('click', $nav_toggle_icon, function(event) {
                event.preventDefault();
                _okayNav.toggleInvisibleNav();
            });

            // Collapse hidden nav on click outside the header
            $document.on('click', function(event) {
                if (_invisibleNavState) {
                    var _target = $(event.target);
                    if (!_target.parents(_options.nav_parent).length)
                        _okayNav.closeInvisibleNav();
                }
            });

            $window.on('load resize', function(event) {
                _okayNav.recalcNav();
            });

        },

        /*
         * A few methods to allow working with elements
         */
        getParent: function () {
            return _options.nav_parent;
        },

        getVisibleNav: function() { // Visible navigation
            return $nav_visible;
        },

        getInvisibleNav: function() { // Hidden behind the kebab icon
            return $nav_invisible;
        },

        getNavToggleIcon: function() { // Kebab icon
            return $nav_toggle_icon;
        },

        /*
         * Operations
         */
        openInvisibleNav: function() {
            _options.nav_beforeopen.call();
            $nav_toggle_icon.addClass('icon--active');
            $nav_invisible.addClass('nav-open');
            _invisibleNavState = true;
            _options.nav_open.call();
        },

        closeInvisibleNav: function() {
            _options.nav_beforeclose.call();
            $nav_toggle_icon.removeClass('icon--active');
            $nav_invisible.removeClass('nav-open');
            _invisibleNavState = false;
            _options.nav_close.call();
        },

        toggleInvisibleNav: function() {
            if (!_invisibleNavState) {
                _invisibleNavState = true;
                _okayNav.openInvisibleNav();
            }
            else {
                _invisibleNavState = false;
                _okayNav.closeInvisibleNav();
            }
        },

        destroy: function() {},


        /*
         * Math stuff
         */
        getParentWidth: function(el) {
            var parent = el || _options.nav_parent;
            var parent_width = $(parent).outerWidth();

            return parent_width;
        },

        getChildrenWidth: function(el) {
            var children_width = 0;
            $(el).children().each(function() {
                children_width += $(this).outerWidth(true);
            });

            return children_width;
        },

        countNavItems: function(el) {
            var $menu = $(el);
            var items = $('li', $menu).length;

            return items;
        },

        getFirstInvisChildWidth: function() {
            var $first_child = $('li:first-child a', $nav_invisible);
            $first_child.wrapInner('<span />');
            var $wrapped_child = $('span', $first_child);
            var first_child_width = $('span', $first_child).outerWidth();
            $wrapped_child.contents().appendTo($first_child);
            $wrapped_child.remove();

            return first_child_width;
        },

        recalcNav: function() {
            var wrapper_width = $(_options.nav_parent).outerWidth();
            var nav_full_width = $navigation.outerWidth();
            var visible_nav_items = _okayNav.countNavItems($nav_visible);
            var first_invisible_child_width = _okayNav.getFirstInvisChildWidth();
            console.log(first_invisible_child_width);

            var collapse_width = $nav_visible.outerWidth() + _nav_toggle_icon_width;
            // var expand_width = _okayNav.getChildrenWidth(_options.nav_parent) - (collapse_width + first_invisible_child_width);


            if (visible_nav_items > 0 && nav_full_width < collapse_width)
                _okayNav.collapseNavItem();

            else if (wrapper_width > _okayNav.getChildrenWidth(_options.nav_parent) + first_invisible_child_width)
                 _okayNav.expandNavItem();
        },

        collapseNavItem: function() {
            $('li:last-child', $nav_visible).detach().prependTo($nav_invisible);
        },


        expandNavItem: function() {
            $('li:first-child', $nav_invisible).detach().appendTo($nav_visible);
        }

    }



    // Plugin wrapper
    $.fn[okayNav] = function ( options ) {
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            return this.each(function () {
                if (!$.data(this, 'plugin_' + okayNav)) {
                    $.data(this, 'plugin_' + okayNav, new Plugin( this, options ));
                }
            });

        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            var returns;
            this.each(function () {
                var instance = $.data(this, 'plugin_' + okayNav);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    returns = instance[options].apply( instance, Array.prototype.slice.call( args, 1 ) );
                }

                if (options === 'destroy') {
                  $.data(this, 'plugin_' + okayNav, null);
                }
            });

            return returns !== undefined ? returns : this;
        }
    };

}(jQuery, window, document));


/*
 * swipe.jQuery.js
 * https://github.com/Tundra-Interactive/swipe.jquery.js
*/
