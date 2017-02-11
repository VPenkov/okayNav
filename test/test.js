require('jsdom-global')();
const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const simulant = require('simulant');
const OkayNav = require('../app/js/okayNav');

let markup = '<header id="header" class="okayNav-header">' +
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

describe('okayNav', () => {
    let okayNavInstance;
    let windowEvents;
    let sandbox;

    beforeEach(() => {
        sandbox = sinon.sandbox.create();
        document.body.innerHTML = markup;
        windowEvents = sandbox.spy(window, 'addEventListener');
        okayNavInstance = new OkayNav('#nav-main');
    });

    afterEach(() => {
        sandbox.restore();
    });

    describe('_cleanWhitespace', () => {
        it('should clean the whitespace between the nodes', () => {
            // assert
            let whitespace = markup.match(/>\s+</g);
            expect(whitespace).to.equal(null);
        });
    });

    describe('Array operations', () => {
        // arrange
        let testArray = [1, 2, 3, 4, 10];

        it('should return the highest array integer', () => {
            // act
            let result = okayNavInstance._arrayMax(testArray);

            // assert
            expect(result).to.equal(10);
        });

        it('should return the lowest array integer', () => {
            // act
            let result = okayNavInstance._arrayMin(testArray);

            // assert
            expect(result).to.equal(1);
        });
    });

    describe('_attachNodes', () => {
        it('should add the correct class to the visible nav', () => {
            // arrange
            let navVisible = document.querySelector('#nav-main > ul');

            // assert
            expect(navVisible.classList.contains('okayNav__nav--visible')).to.be.true;
        });

        it('should create the invisible nav', () => {
            // arrange
            let navInvisible = document.querySelectorAll('.okayNav__nav--invisible');

            // assert
            expect(navInvisible.length).to.equal(1);
        });
    });

    describe('_createToggleButton', () => {
        it('should create the close button', () => {
            // arrange
            let navInvisible = document.querySelectorAll('.okayNav__menu-toggle');

            // assert
            expect(navInvisible.length).to.equal(1);
        });
    });

    describe('_attachEvents', () => {
        it('should listen to the load event', () => {
            // assert
            expect(windowEvents.withArgs('load')).to.be.calledOnce;
        });

        it('should listen to the resize event', () => {
            // assert
            expect(windowEvents.withArgs('resize')).to.be.calledOnce;
        });

        it('should utilize the debounce script', () => {
            // arrange
            let spy = sandbox.spy(okayNavInstance, '_debounce');

            // act
            simulant.fire(window, 'scroll');

            // assert
            expect(spy).to.be.calledOnce;
        });
    });
});
