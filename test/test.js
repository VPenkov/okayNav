var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var jsdom = require('jsdom-global');
var okayNav = require('../app/js/okayNav');

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
    var sandbox;

    jsdom();

    beforeEach(function() {
        sandbox = sinon.sandbox.create();
        document.body.innerHTML = markup;
        new okayNav('#nav-main');
    });

    afterEach(function() {
        sandbox.restore();
    });

    describe('_cleanWhitespace', function() {
        it('should clean the whitespace between the nodes', function() {
            // assert
            expect(markup).to.equal('<header id="header" class="okayNav-header"><a class="okayNav-header__logo" href="#">Test</a><nav class="okayNav" id="nav-main"><ul><li data-priority="1" class="okayNav__item"><a href="#">Nav Item 1</a></li><li data-priority="2" class="okayNav__item"><a href="#">Nav Item 2</a></li><li data-priority="4" class="okayNav__item"><a href="#">Nav Item 3</a></li><li data-priority="3" class="okayNav__item"><a href="#">Nav Item 4</a></li> /ul></nav></header>');
        });
    });
});
