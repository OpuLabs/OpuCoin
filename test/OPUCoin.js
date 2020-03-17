const assertRevert = require("./helpers/assertRevert");
var OPUCoin = artifacts.require('OPUCoin');

contract('OPUCoin', accounts => {
  let token;

  beforeEach(async () => {
    token = await OPUCoin.new();
  });

  it('should start with a totalSupply of 0', async () => {
    let totalSupply = await token.totalSupply();

    assert.equal(totalSupply, 0);
  });

  it('should return mintingFinished false after construction', async () => {
    let mintingFinished = await token.mintingFinished();

    assert.equal(mintingFinished, false);
  });

  it('should mint a given amount of tokens to a given address', async () => {
    const result = await token.mint(accounts[0], 100);
    assert.equal(result.logs[0].event, 'Mint');
    assert.equal(result.logs[0].args.to.valueOf(), accounts[0]);
    assert.equal(result.logs[0].args.amount.valueOf(), 100);
    assert.equal(result.logs[1].event, 'Transfer');
    assert.equal(result.logs[1].args.from.valueOf(), 0x0);

    let balance0 = await token.balanceOf(accounts[0]);
    assert(balance0, 100);

    let totalSupply = await token.totalSupply();
    assert(totalSupply, 100);
  });

  it('should fail to mint after call to finishMinting', async () => {
    await token.finishMinting();
    var minting = await token.mintingFinished();
    assert.equal(minting, true);

    try {
      await token.mint(accounts[0], 100);
      assert.fail("should have thrown before");
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should return the correct allowance amount after approval', async () => {
    await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);

    assert.equal(allowance, 100);
  });

  it('should return correct balances after transfer', async () => {
    await token.mint(accounts[0], 100);
    await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should throw an error when trying to transfer more than balance', async () => {
    try {
      await token.transfer(accounts[1], 1);
      assert.fail("should have thrown before");
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should return correct balances after transfering from another account', async () => {
    await token.mint(accounts[0], 100);
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], accounts[2], 100, {
      from: accounts[1]
    });

    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);

    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);

    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it('should throw an error when trying to transfer more than allowed', async () => {
    await token.mint(accounts[0], 100);
    await token.approve(accounts[1], 99);

    try {
      await token.transferFrom(accounts[0], accounts[2], 100, {
        from: accounts[1]
      });
      assert.fail("should have thrown before");
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom more than _from has', async () => {
    let balance0 = await token.balanceOf(accounts[0]);
    await token.approve(accounts[1], 99);

    try {
      await token.transferFrom(accounts[0], accounts[2], balance0 + 1, {
        from: accounts[1]
      });
      assert.fail("should have thrown before");
    } catch (error) {
      assertRevert(error);
    }
  });

  describe('validating allowance updates to spender', () => {
    let preApproved;

    it('should start with zero', async () => {
      preApproved = await token.allowance(accounts[0], accounts[1]);
      assert.equal(preApproved, 0);
    });

    it('should increase by 50 then decrease by 10', async () => {
      await token.increaseApproval(accounts[1], 50);
      let postIncrease = await token.allowance(accounts[0], accounts[1]);
      assert.equal(postIncrease.toNumber(), preApproved.plus(50).toNumber());
      await token.decreaseApproval(accounts[1], 10);
      let postDecrease = await token.allowance(accounts[0], accounts[1]);
      assert.equal(postDecrease.toNumber(), postIncrease.minus(10).toNumber());
    });
  });

  it('should increase by 50 then set to 0 when decreasing by more than 50', async () => {
    await token.approve(accounts[1], 50);
    await token.decreaseApproval(accounts[1], 60);
    let postDecrease = await token.allowance(accounts[0], accounts[1]);
    assert.equal(0, postDecrease);
  });

  it('should throw an error when trying to transfer to 0x0', async () => {
    await token.mint(accounts[0], 100);
    try {
      await token.transfer(0x0, 100);
      assert.fail("should have thrown before");
    } catch (error) {
      assertRevert(error);
    }
  });

  it('should throw an error when trying to transferFrom to 0x0', async () => {
    await token.mint(accounts[0], 100);
    await token.approve(accounts[1], 100);

    try {
      await token.transferFrom(accounts[0], 0x0, 100, {
        from: accounts[1]
      });
      assert.fail("should have thrown before");
    } catch (error) {
      assertRevert(error);
    }
  });
});