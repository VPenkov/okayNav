var chai = require('chai');
var expect = chai.expect;
var sinon = require('sinon');
var jsdom = require('jsdom');

sinon.use(require('sinon-chai'));

describe('okayNav', function() {
    var okayNav;
    var sandbox;

    before(function() {
        sandbox = sinon.sandbox.create();
    });

    after(function() {
        sandbox.restore();
    });

    describe('test', function() {
        it('should return true', function() {
            expect(true).to.be.true;
        });
    });
});
