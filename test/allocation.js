
const web3 = global.web3;

const OPUCoin = artifacts.require("./OPUCoin.sol");
const Allocation = artifacts.require("./Allocation.sol");
const ColdStorage = artifacts.require("./ColdStorage.sol");
const Vesting = artifacts.require("./Vesting.sol");

var token;
var allocation;
var coldStorageContract;
var holders = 12;
var vesting;
var c1purchase = 30 * 1e18;
var c1bounty = 5 * 1e18;
var c2purchase = 400 * 1e18;
var c2bounty = 25 * 1e18;
var c3purchase = 6000 * 1e18;
var c3bounty = 40 * 1e18;
var holdingPool = 220*1e6*1e18;

contract("Allocation testing", async function(accounts) {
    const [manager, backend, founders, partners, coldStorage, holding, c1, c2, c3, c4] = accounts;

    it("allocation deploys", async () => {
        allocation = await Allocation.new(backend, founders, partners, coldStorage, {from:manager, gas:6000000});
        assert.isOk(allocation && allocation.address, "allocation should have valid address");
        token = OPUCoin.at(await allocation.token());
        assert.isOk(token && token.address, "token should have valid address");
    });

    it("total supply is 0 at start", async () => {
        let totalSupply = await(token.totalSupply());
        assert.equal(Number(totalSupply), 0, "total supply not zero");
    });

    it("backend can perform an allocation", async () => {
        await allocation.allocate(c1, c1purchase, c1bounty, {from: backend});
        let c1tokens = Number(await token.balanceOf(c1));
        assert.equal(c1tokens, c1purchase + c1bounty, "wrong number of tokens allocated");
        let totalSupply = await(token.totalSupply());
        assert.equal(Number(totalSupply), c1tokens, "total supply not updated");
    });

    it("another allocation", async () => {
        await allocation.allocate(c2, c2purchase, c2bounty, {from: backend});
        let c2tokens = Number(await token.balanceOf(c2));
        assert.equal(c2tokens, c2purchase + c2bounty, "wrong number of tokens allocated");
        let totalSupply = await(token.totalSupply());
        assert.equal(Number(totalSupply), c1purchase+c1bounty+c2tokens, "total supply not updated");
    });

    it("allocations don't work when paused by manager", async () => {
        await allocation.emergencyPause({from: manager});
        let paused = await allocation.emergencyPaused();
        assert.isTrue(paused, "the pause didn't work");

        try {
            await allocation.allocate(c2, 8 * 1e18, 0, {from: backend});
            assert.fail();
        } catch(err) {
            z = err.message.search("revert") >= 0;
            assert(z, "contract should reject transaction");
        } finally {
            await allocation.emergencyUnpause({from: manager});
            paused = await allocation.emergencyPaused();
            assert.isFalse(paused, "couldn't cancel the pause");
        }
    });

    it("allocate tokens into holding", async () => {
        vesting = Vesting.at(await allocation.vesting());
        let vestingListener = vesting.VestingInitialized({fromBlock: 'latest', toBlock: 'latest'});
        let allocationListener = allocation.TokensAllocatedIntoHolding({fromBlock: 'latest', toBlock: 'latest'});

        await allocation.allocateIntoHolding(c3, c3purchase, c3bounty, {from: backend});

        let vestingLog = await new Promise(
                (resolve, reject) => vestingListener.get(
                    (error, log) => error ? reject(error) : resolve(log)
                    ));
        let allocationLog = await new Promise(
                (resolve, reject) => allocationListener.get(
                    (error, log) => error ? reject(error) : resolve(log)
                    ));

        let vs = vestingLog[0].args;
        let al = allocationLog[0].args;

        let expectedTokens = c3purchase + c3bounty;
        assert.equal(al._buyer, c3, "Allocation event has wrong address");
        assert.isAtLeast(Number(al._tokens), 0.99 * expectedTokens, "Allocation event has the wrong number of tokens");
        assert.isAtMost(Number(al._tokens), 1.01 * expectedTokens, "Allocation event has the wrong number of tokens");
        assert.equal(vs._to, c3, "Vesting has wrong address");
        assert.isAtLeast(Number(vs._tokens), 0.99 * expectedTokens, "Vesting event has the wrong number of tokens");
        assert.isAtMost(Number(vs._tokens), 1.01 * expectedTokens, "Vesting event has the wrong number of tokens");
    });

    it("finalize allocation: team, partners, cold storage, network storage", async () => {
        res = await allocation.finalizeHoldingAndTeamTokens(holdingPool, {from: backend, gas: 6500000});

        let foundersTokens = Number(await vesting.tokensRemainingInHolding(founders));
        assert.equal(foundersTokens, 675 * 1e6 * 1e18, "wrong number of tokens vested into founders' wallet");

        let partnersTokens = Number(await token.balanceOf(partners));
        assert.equal(partnersTokens, 297 * 1e6 * 1e18, "wrong number of tokens allocated into partners'");

        coldStorageContract = await allocation.coldStorage();
        let coldStorageTokens = Number(await token.balanceOf(coldStorageContract));
        assert.equal(coldStorageTokens, 189 * 1e6 * 1e18, "wrong number of tokens allocated into coldStorage");
    });

    it("releases nothing until a year and a month passes", async () => {
        try {
            await vesting.claimTokens({from: founders});
            assert.fail();
        } catch(err) {
            z = err.message.search("revert") >= 0;
            assert(z, "expected throw not received");
        }

        let ftokens = Number( await( token.balanceOf( founders )));
        assert.equal(ftokens, 0, "founders should not have received any tokens");
    });
});
