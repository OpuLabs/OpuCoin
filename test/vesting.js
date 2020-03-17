
const web3 = global.web3;

const Allocation = artifacts.require("./Allocation.sol");
const OPUCoin = artifacts.require("./OPUCoin.sol");
const Vesting = artifacts.require("./Vesting.sol");

var allocation;
var token;
var vesting;

var c0purchase = 6000 * 1e18;
var c0bounty = 40 * 1e18;
var holdingPool = 220 * 1e6 * 1e18;
var c0total = holdingPool + c0purchase + c0bounty;

var foundersShare = 675 * 1e6 * 1e18;

contract("Vesting test", async function(accounts) {
    const [manager, backend, founders, partners, coldStorage, holding, c0] = accounts;

    it("setting up tokens and contracts", async () => {
        allocation = await Allocation.new(backend, founders, partners, 
                                          coldStorage, {from:manager});
        token = OPUCoin.at(await allocation.token());
        assert.isOk(token && token.address, "token should have valid address");
        vesting = Vesting.at(await allocation.vesting());
    });

    it("allocate tokens into holding", async () => {
        await allocation.allocateIntoHolding(c0, c0purchase, c0bounty, {from: backend});

        let actualTokens = await vesting.tokensRemainingInHolding(c0);
        assert.equal(Number(actualTokens), c0purchase + c0bounty, "Wrong number of tokens went into vesting");
    });

    it("launch vesting", async () => {
        res = await allocation.finalizeHoldingAndTeamTokens(
            holdingPool, 
            {from: backend, gas: 6500000}
        );
    });

    it("holder can release vesting batch of 1/12 size after 31 days", async () => {
        let increaseTime = addSeconds => web3.currentProvider
            .send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})

        increaseTime(3600 * 24 * 31);
        await vesting.claimTokens({from: c0});

        assert.isAtLeast(
                Number( await( token.balanceOf( c0 ))) * 1.02,
                c0total / 12,
                "1/12th is collected by the holder");
                
        assert.isAtMost(
                Number( await( token.balanceOf( c0 ))) * 0.98,
                c0total / 12,
                "1/12th is collected by the holder");
    });

    it("founders can release vesting batch of 1/12 size after 365 + 31 days", async () => {
        let increaseTime = addSeconds => web3.currentProvider
            .send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})

        increaseTime(3600 * 24 * 365);
        await vesting.claimTokens({from: founders});

        assert.isAtLeast(
                Number( await( token.balanceOf( founders ))) * 1.02,
                foundersShare / 12,
                "1/12th is collected by the founders");
                
        assert.isAtMost(
                Number( await( token.balanceOf( founders ))) * 0.98,
                foundersShare / 12,
                "1/12th is collected by the founders");
    });

    it("holder can release their full token amount in a year", async () => {
        let increaseTime = addSeconds => web3.currentProvider
            .send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})

        await vesting.claimTokens({from: c0});

        assert.equal(Number( await( token.balanceOf( c0 ))), c0total,
                "Held tokens are not released properly");
    });

    it("can release another vesting batch of 1/12 size after 365 + 60 days", async () => {
        let increaseTime = addSeconds => web3.currentProvider
            .send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})

        // increase time by 30 more days, making it 365 + 30 + 30 + 1 from start
        increaseTime(3600 * 24 * 30);
        await vesting.claimTokens({from: founders});

        assert.isAtLeast(
                Number( await( token.balanceOf( founders ))) * 1.02,
                foundersShare * 2 / 12,
                "1/12th is collected by the founders");
                
        assert.isAtMost(
                Number( await( token.balanceOf( founders ))) * 0.98,
                foundersShare * 2 / 12,
                "1/12th is collected by the founders");
    });

    it("11/12th are vested after 11 30-day periods during year 2", async () => {
        let increaseTime = addSeconds => web3.currentProvider
            .send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})

        // increase time by 300 more days, making it 
        // 365 + 30 + 30 + 30 * 9 + 1 = 365 + 331 from start
        increaseTime(3600 * 24 * 290);
        await vesting.claimTokens({from: founders});

        assert.isAtLeast(
                Number( await( token.balanceOf( founders ))) * 1.02,
                foundersShare * 11 / 12,
                "11/12th is collected by the founders");
                
        assert.isAtMost(
                Number( await( token.balanceOf( founders ))) * 0.98,
                foundersShare * 11 / 12,
                "11/12th is collected by the founders");
    });

    it("all the founders' tokens are vested after 2 years", async () => {
        let increaseTime = addSeconds => web3.currentProvider
            .send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})

        // Moving up a month further
        increaseTime(3600 * 24 * 30);
        await vesting.claimTokens({from: founders});

        assert.equal(Number( await( token.balanceOf( founders ))), foundersShare,
                "100% is collected by the founders");
    });
});
