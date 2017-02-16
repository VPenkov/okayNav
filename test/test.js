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
                '<li class="okayNav__item"><a href="#">Nav Item 1</a></li>' +
                '<!-- HTML comment node -->' +
                '<li data-priority="1" class="okayNav__item"><a href="#">Nav Item 2</a></li>' +
                '<li data-priority="2" class="okayNav__item"><a href="#">Nav Item 3</a></li>' +
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

        it('should provide a default layout', function() {
            // arrange
            let kebabMenuSVG = '<svg viewBox="0 0 100 100"><g><circle cx="51" cy="17.75" r="10.75"></circle><circle cx="51" cy="50" r="10.75"></circle><circle cx="51" cy="82.25" r="10.75"></circle></g></svg>';
            let button = document.querySelector('.okayNav__menu-toggle');

            // assert
            expect(button.innerHTML).to.equal(kebabMenuSVG);
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

    describe('_initLinkProperties', () => {
        it('should call _savePriority for each link', () => {
            // arrange
            let totalNavItems = document.querySelectorAll('.okayNav__item');
            let totalVisibleItems = okayNavInstance.priority.visible.length + 1; // toggle button is not included

            // assert
            expect(totalNavItems.length).to.equal(totalVisibleItems);
        });

        it('should assign a default priority of 1', function() {
            let visibleItems = okayNavInstance.priority.visible;

            expect(visibleItems).to.eql([1, 1, 2, 3]);
        });
    });

    describe('_savePriority', () => {
        it('should be able to add items to the visible list', () => {
            // arrange
            okayNavInstance.priority.visible = [];
            let testItem = document.querySelector('[data-priority]');
            testItem.setAttribute('data-priority', '13'); // element.dataset doesn't work with jsdom

            // act
            okayNavInstance._savePriority(testItem, true);

            // assert
            expect(okayNavInstance.priority.visible).to.eql([13]);
        });

        it('should be able to add items to the invisible list', () => {
            // arrange
            let testItem = document.querySelector('[data-priority]');
            testItem.setAttribute('data-priority', '15'); // element.dataset doesn't work with jsdom

            // act
            okayNavInstance._savePriority(testItem);

            // assert
            expect(okayNavInstance.priority.invisible).to.eql([15]);
        });
    });

    describe('getChildrenWidth', () => {
        let stubWidths = () => {
            let baseWidth = 10;
            let navVisible = document.querySelector('.okayNav__nav--visible');

            for (let child of navVisible.children) {
                child.offsetWidth = baseWidth;
                baseWidth += 10;
            }
        };

        it('should return the total width of an element\'s children', () => {
            // arrange
            stubWidths();
            let parent = document.querySelector('.okayNav__nav--visible');

            // act
            let childrenWidth = okayNavInstance.getChildrenWidth(parent);

            // assert
            expect(childrenWidth).to.equal(150);
        });
    });

    describe('getWrapperWidth', () => {
        it('should return the width of okayNav\'s parent', () => {
            // arrange
            let wrapper = document.querySelector('.okayNav-header');
            wrapper.offsetWidth = 100;

            // act
            let result = okayNavInstance.getWrapperWidth();

            // assert
            expect(result).to.equal(100);
        });
    });

    describe('getWrapperChildrenWidth', () => {
        it('should get the wrapper\'s children total width', () => {
            // arrange
            let spy = sandbox.spy(okayNavInstance, 'getChildrenWidth');
            let wrapper = document.querySelector('.okayNav-header');

            // act
            okayNavInstance.getWrapperChildrenWidth();

            // assert
            expect(spy.withArgs(wrapper)).to.be.calledOnce;
        });
    });

    describe('_getAction', () => {
        it('should return "collapse" if children\'s width is too close to the wrapper width', () => {
            // arrange
            sandbox.stub(okayNavInstance, 'getWrapperWidth').returns(120);
            sandbox.stub(okayNavInstance, 'getWrapperChildrenWidth').returns(100);

            // act
            // threshold is 20
            let result = okayNavInstance._getAction();

            // assert
            expect(result).to.equal('collapse');
        });

        it('should return "expand" if the wrapper is large enough', () => {
            // arrange
            sandbox.stub(okayNavInstance, 'getWrapperWidth').returns(131);
            sandbox.stub(okayNavInstance, 'getWrapperChildrenWidth').returns(100);
            okayNavInstance.itemWidths = [10, 20, 30];

            // act
            // threshold is 20
            let result = okayNavInstance._getAction();

            // assert
            expect(result).to.equal('expand');
        });

        it('should return false if no collapsed items are found', () => {
            // arrange
            sandbox.stub(okayNavInstance, 'getWrapperWidth').returns(1000);
            sandbox.stub(okayNavInstance, 'getWrapperChildrenWidth').returns(100);

            // act
            // threshold is 20
            let result = okayNavInstance._getAction();

            // assert
            expect(result).be.false;
        });
    });

    describe('getItemByPriority', () => {
        it('should be able to return a high-priority visible item', () => {
            // arrange
            // highest-priority test content has a priority of 3
            let expectedElement = okayNavInstance.navVisible.querySelector('[data-priority="3"]');

            // act
            let result = okayNavInstance.getItemByPriority(true, true);

            // result
            expect(result.outerHTML).to.eql(expectedElement.outerHTML);
        });

        it('should be able to return a low-priority visible item', () => {
            // arrange
            let expectedElement = okayNavInstance.navVisible.querySelector('[data-priority="1"]');

            // act
            let result = okayNavInstance.getItemByPriority(false, true);

            // result
            expect(result).to.eql(expectedElement);
        });

        it('should be able to return a high-priority invisible item', () => {
            // arrange
            let element1 = okayNavInstance.navVisible.querySelector('[data-priority="3"]');
            let element2 = okayNavInstance.navVisible.querySelector('[data-priority="2"]');
            okayNavInstance._moveItemTo(element1, false);
            okayNavInstance._moveItemTo(element2, false);
            okayNavInstance.priority.visible.pop();
            okayNavInstance.priority.visible.pop();
            okayNavInstance.priority.invisible.push(2, 3);

            // act
            let result = okayNavInstance.getItemByPriority(true, false);

            // result
            expect(result).to.eql(element1);
        });

        it('should be able to return a low-priority invisible item', () => {
            // arrange
            let element1 = okayNavInstance.navVisible.querySelector('[data-priority="3"]');
            let element2 = okayNavInstance.navVisible.querySelector('[data-priority="2"]');
            okayNavInstance._moveItemTo(element1, false);
            okayNavInstance._moveItemTo(element2, false);
            okayNavInstance.priority.visible.pop();
            okayNavInstance.priority.visible.pop();
            okayNavInstance.priority.invisible.push(2, 3);

            // act
            let result = okayNavInstance.getItemByPriority(false, false);

            // result
            expect(result).to.eql(element2);
        });
    });
});
