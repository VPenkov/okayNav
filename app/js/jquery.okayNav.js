/*!
 * jquery.okayNav.js 2.0.1 (https://github.com/VPenkov/okayNav)
 * Author: Vergil Penkov (http://vergilpenkov.com/)
 * MIT license: https://opensource.org/licenses/MIT
 */

;(function($, window, document, undefined) {

    // Defaults
    var okayNav = 'okayNav',
        defaults = {
            parent: '', // will call nav's parent() by default
            toggle_icon_class: 'okayNav__menu-toggle',
            toggle_icon_content: '<span /><span /><span />',
            align_right: true, // If false, the menu and the kebab icon will be on the left
            swipe_enabled: true, // If true, you'll be able to swipe left/right to open the navigation
            threshold: 50, // Nav will auto open/close if swiped >= this many percent
            resize_delay: 10, // When resizing the window, okayNav can throttle its recalculations if enabled. Setting this to 50-250 will improve performance but make okayNav less accurate.
            beforeOpen: function() {}, // Will trigger before the nav gets opened
            afterOpen: function() {}, // Will trigger after the nav gets opened
            beforeClose: function() {}, // Will trigger before the nav gets closed
            afterClose: function() {}, // Will trigger after the nav gets closed
            itemHidden: function() {},
            itemDisplayed: function() {}
        };

    // Begin
    function Plugin(element, options) {
        self = this;
        this.options = $.extend({}, defaults, options);
        _options = this.options;

        $navigation = $(element);
        $document = $(document);
        $window = $(window);

        this.options.parent == '' ? this.options.parent = $navigation.parent() : '';

        _nav_visible = false; // Store the state of the hidden nav
        _nav_full_width = 0;
        _parent_full_width = 0;

        // Swipe stuff
        radCoef = 180 / Math.PI;
        _sTouch = {
            x: 0,
            y: 0
        };
        _cTouch = {
            x: 0,
            y: 0
        };
        _sTime = 0;
        _nav_position = 0;
        _percent_open = 0;
        _nav_moving = false;


        self.init();
    }

    Plugin.prototype = {

        init: function() {

            $('body').addClass('okayNav-loaded');

            // Add classes
            $navigation
                .addClass('okayNav loaded')
                .children('ul').addClass('okayNav__nav--visible');

            // Append elements
            if (self.options.align_right) {
                $navigation
                    .append('<ul class="okayNav__nav--invisible transition-enabled nav-right" />')
                    .append('<a href="#" class="' + _options.toggle_icon_class + ' okay-invisible">' + _options.toggle_icon_content + '</a>')
            } else {
                $navigation
                    .prepend('<ul class="okayNav__nav--invisible transition-enabled nav-left" />')
                    .prepend('<a href="#" class="' + _options.toggle_icon_class + ' okay-invisible">' + _options.toggle_icon_content + '</a>')
            }

            // Cache new elements for further use
            $nav_visible = $navigation.children('.okayNav__nav--visible');
            $nav_invisible = $navigation.children('.okayNav__nav--invisible');
            $nav_toggle_icon = $navigation.children('.' + _options.toggle_icon_class);

            _toggle_icon_width = $nav_toggle_icon.outerWidth(true);
            _nav_default_width = self.getChildrenWidth($navigation);
            _parent_full_width = $(_options.parent).outerWidth(true);
            _last_visible_child_width = 0; // We'll define this later

            // Events are up once everything is set
            self.initEvents();
            if (_options.swipe_enabled == true) self.initSwipeEvents();
        },

        initEvents: function() {
            // Toggle hidden nav when hamburger icon is clicked and
            // Collapse hidden nav on click outside the header
            $document.on('click.okayNav', function(e) {
                var _target = $(e.target);

                if (_nav_visible === true && _target.closest('.okayNav').length == 0)
                    self.closeInvisibleNav();

                if (_target.hasClass(_options.toggle_icon_class)) {
                    e.preventDefault();
                    self.toggleInvisibleNav();
                }
            });

            var optimizeResize = self._debounce(function(){self.recalcNav()}, _options.recalc_delay);
            $window.on('load.okayNav resize.okayNav', optimizeResize);
        },

        initSwipeEvents: function() {
            $document
                .on('touchstart.okayNav', function(e) {
                    $nav_invisible.removeClass('transition-enabled');

                    //Trigger only on touch with one finger
                    if (e.originalEvent.touches.length == 1) {
                        var touch = e.originalEvent.touches[0];
                        if (
                            ((touch.pageX < 25 && self.options.align_right == false) ||
                                (touch.pageX > ($(_options.parent).outerWidth(true) - 25) &&
                                self.options.align_right == true)) ||
                                _nav_visible === true) {

                            _sTouch.x = _cTouch.x = touch.pageX;
                            _sTouch.y = _cTouch.y = touch.pageY;
                            _sTime = Date.now();
                        }

                    }
                })
                .on('touchmove.okayNav', function(e) {
                    var touch = e.originalEvent.touches[0];
                    self._triggerMove(touch.pageX, touch.pageY);
                    _nav_moving = true;
                })
                .on('touchend.okayNav', function(e) {
                    _sTouch = {
                        x: 0,
                        y: 0
                    };
                    _cTouch = {
                        x: 0,
                        y: 0
                    };
                    _sTime = 0;

                    //Close menu if not swiped enough
                    if (_percent_open > (100 - self.options.threshold)) {
                        _nav_position = 0;
                        self.closeInvisibleNav();

                    } else if (_nav_moving == true) {
                        _nav_position = $nav_invisible.width();
                        self.openInvisibleNav();
                    }

                    _nav_moving = false;

                    $nav_invisible.addClass('transition-enabled');
                });
        },

        _getDirection: function(dx) {
            if (self.options.align_right) {
                return (dx > 0) ? -1 : 1;
            } else {
                return (dx < 0) ? -1 : 1;
            }
        },

        _triggerMove: function(x, y) {
            _cTouch.x = x;
            _cTouch.y = y;

            var currentTime = Date.now();
            var dx = (_cTouch.x - _sTouch.x);
            var dy = (_cTouch.y - _sTouch.y);

            var opposing = dy * dy;
            var distance = Math.sqrt(dx * dx + opposing);
            //Length of the opposing side of the 90deg triagle
            var dOpposing = Math.sqrt(opposing);

            var angle = Math.asin(Math.sin(dOpposing / distance)) * radCoef;
            var speed = distance / (currentTime - _sTime);

            //Set new start position
            _sTouch.x = x;
            _sTouch.y = y;

            //Remove false swipes
            if (angle < 20) {
                var dir = self._getDirection(dx);

                var newPos = _nav_position + dir * distance;
                var menuWidth = $nav_invisible.width();
                var overflow = 0;


                if (newPos < 0) {
                    overflow = -newPos;
                } else if (newPos > menuWidth) {
                    overflow = menuWidth - newPos;
                }

                var size = menuWidth - (_nav_position + dir * distance + overflow);
                var threshold = (size / menuWidth) * 100;

                //Set new position and threshold
                _nav_position += dir * distance + overflow;
                _percent_open = threshold;

                $nav_invisible.css('transform', 'translateX(' + (self.options.align_right ? 1 : -1) * threshold + '%)');
            }

        },

        /*
         * A few methods to allow working with elements
         */
        getParent: function() {
            return _options.parent;
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
        _debounce: function(func, wait, immediate) {
            var timeout;
        	return function() {
        		var context = this, args = arguments;
        		var later = function() {
        			timeout = null;
        			if (!immediate) func.apply(context, args);
        		};
        		var callNow = immediate && !timeout;
        		clearTimeout(timeout);
        		timeout = setTimeout(later, wait);
        		if (callNow) func.apply(context, args);
        	};
        },

        openInvisibleNav: function() {
            !_options.enable_swipe ? _options.beforeOpen.call() : '';

            $nav_toggle_icon.addClass('icon--active');
            $nav_invisible.addClass('nav-open');
            _nav_visible = true;
            $nav_invisible.css({
                '-webkit-transform': 'translateX(0%)',
                'transform': 'translateX(0%)'
            });

            _options.afterOpen.call();
        },

        closeInvisibleNav: function() {
            !_options.enable_swipe ? _options.beforeClose.call() : '';

            $nav_toggle_icon.removeClass('icon--active');
            $nav_invisible.removeClass('nav-open');

            if (self.options.align_right) {
                $nav_invisible.css({
                    '-webkit-transform': 'translateX(100%)',
                    'transform': 'translateX(100%)'
                });
            } else {
                $nav_invisible.css({
                    '-webkit-transform': 'translateX(-100%)',
                    'transform': 'translateX(-100%)'
                });
            }
            _nav_visible = false;

            _options.afterClose.call();
        },

        toggleInvisibleNav: function() {
            if (!_nav_visible) {
                self.openInvisibleNav();
            } else {
                self.closeInvisibleNav();
            }
        },


        /*
         * Math stuff
         */
        getChildrenWidth: function(el) {
            var children_width = 0;
            var children = $(el).children();
            for (var i = 0; i < children.length; i++) {
                children_width += $(children[i]).outerWidth(true);
            };

            return children_width;
        },

        getVisibleItemCount: function() {
            return $('li', $nav_visible).length;
        },
        getHiddenItemCount: function() {
            return $('li', $nav_invisible).length;
        },

        recalcNav: function() {
            var wrapper_width = $(_options.parent).outerWidth(true),
                space_taken = self.getChildrenWidth(_options.parent),
                nav_full_width = $navigation.outerWidth(true),
                visible_nav_items = self.getVisibleItemCount(),
                collapse_width = $nav_visible.outerWidth(true) + _toggle_icon_width,
                expand_width = space_taken + _last_visible_child_width + _toggle_icon_width,
                expandAll_width = space_taken - nav_full_width + self.getChildrenWidth($navigation);

            if (wrapper_width > expandAll_width) {
                self._expandAllItems();
                $nav_toggle_icon.addClass('okay-invisible');
                return;
            }

            if (visible_nav_items > 0 &&
                nav_full_width <= collapse_width &&
                wrapper_width <= expand_width) {
                self._collapseNavItem();
            }

            if (wrapper_width > expand_width + _toggle_icon_width + 15) {
                self._expandNavItem();
            }

            // Hide the kebab icon if no items are hidden
            self.getHiddenItemCount() == 0 ?
                $nav_toggle_icon.addClass('okay-invisible') :
                $nav_toggle_icon.removeClass('okay-invisible');
        },

        _collapseNavItem: function() {
            var $last_child = $('li:last-child', $nav_visible);
            _last_visible_child_width = $last_child.outerWidth(true);
            $document.trigger('okayNav:collapseItem', $last_child);
            $last_child.detach().prependTo($nav_invisible);
            _options.itemHidden.call();
            // All nav items are visible by default
            // so we only need recursion when collapsing

            self.recalcNav();
        },

        _expandNavItem: function() {
            var $first = $('li:first-child', $nav_invisible);
            $document.trigger('okayNav:expandItem', $first);
            $first.detach().appendTo($nav_visible);
            _options.itemDisplayed.call();
        },

        _expandAllItems: function() {
            $('li', $nav_invisible).detach().appendTo($nav_visible);
            _options.itemDisplayed.call();
        },

        _collapseAllItems: function() {
            $('li', $nav_visible).detach().appendTo($nav_invisible);
            _options.itemHidden.call();
        },

        destroy: function() {
            $('li', $nav_invisible).appendTo($nav_visible);
            $nav_invisible.remove();
            $nav_visible.removeClass('okayNav__nav--visible');
            $nav_toggle_icon.remove();

            $document.unbind('.okayNav');
            $window.unbind('.okayNav');
        }

    }

    // Plugin wrapper
    $.fn[okayNav] = function(options) {
        var args = arguments;

        if (options === undefined || typeof options === 'object') {
            return this.each(function() {
                if (!$.data(this, 'plugin_' + okayNav)) {
                    $.data(this, 'plugin_' + okayNav, new Plugin(this, options));
                }
            });

        } else if (typeof options === 'string' && options[0] !== '_' && options !== 'init') {

            var returns;
            this.each(function() {
                var instance = $.data(this, 'plugin_' + okayNav);
                if (instance instanceof Plugin && typeof instance[options] === 'function') {
                    returns = instance[options].apply(instance, Array.prototype.slice.call(args, 1));
                }

                if (options === 'destroy') {
                    $.data(this, 'plugin_' + okayNav, null);
                }
            });

            return returns !== undefined ? returns : this;
        }
    };

}(jQuery, window, document));
