require('jsdom-global')();

var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var simulant = require('simulant');
var OkayNav = require('../app/js/okayNav');

var markup = '<header id="header" class="okayNav-header">' +
        '<a class="okayNav-header__logo" href="#">Test</a>' +
        '<nav class="okayNav" id="nav-main">' +
            '<ul>' +
                '<li data-priority="1" class="okayNav__item"><a href="#">Nav Item 1</a></li>' +
                '<li data-priority="2" class="okayNav__item"><a href="#">Nav Item 2</a></li>' +
                '<li data-priority="4" class="okayNav__item"><a href="#">Nav Item 3</a></li>' +
                '<li data-priority="3" class="okayNav__item"><a href="#">Nav Item 4</a></li>' +
            '</ul>' +
        '</nav>' +
    '</header>';

describe('okayNav', function() {
    var okayNavInstance;
    var windowEvents;
    var sandbox;

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        document.body.innerHTML = markup;
        windowEvents = sandbox.spy(window, 'addEventListener');
        okayNavInstance = new OkayNav('#nav-main');
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('_cleanWhitespace', function() {
        it('should clean the whitespace between the nodes', function() {
            // assert
            var whitespace = markup.match(/>\s+</g);
            expect(whitespace).to.equal(null);
        });
    });

    describe('Array operations', function() {
        // arrange
        var testArray = [1, 2, 3, 4, 10];

        it('should return the highest array integer', function() {
            // act
            var result = okayNavInstance._arrayMax(testArray);

            // assert
            expect(result).to.equal(10);
        });

        it('should return the lowest array integer', function() {
            // act
            var result = okayNavInstance._arrayMin(testArray);

            // assert
            expect(result).to.equal(1);
        });
    });

    describe('_attachNodes', function() {
        it('should add the correct class to the visible nav', function() {
            // arrange
            var navVisible = document.querySelector('#nav-main > ul');

            // assert
            expect(navVisible.classList.contains('okayNav__nav--visible')).to.be.true;
        });

        it('should create the invisible nav', function() {
            // arrange
            var navInvisible = document.querySelectorAll('.okayNav__nav--invisible');

            // assert
            expect(navInvisible.length).to.equal(1);
        });
    });

    describe('_createToggleButton', function() {
        it('should create the close button', function() {
            // arrange
            var navInvisible = document.querySelectorAll('.okayNav__menu-toggle');

            // assert
            expect(navInvisible.length).to.equal(1);
        });
    });

    describe('_attachEvents', function() {
        it('should listen to the load event', function() {
            // assert
            expect(windowEvents.withArgs('load')).to.be.calledOnce;
        });

        it('should listen to the resize event', function() {
            // assert
            expect(windowEvents.withArgs('resize')).to.be.calledOnce;
        });

        it('should utilize the debounce script', function() {
            // arrange
            var spy = sandbox.spy(okayNavInstance, '_debounce');

            // act
            simulant.fire(window, 'scroll');

            // assert
            expect(spy).to.be.calledOnce;
        });
    });
});
