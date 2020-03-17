
const web3 = global.web3;

const Allocation = artifacts.require("./Allocation.sol");
const OPUCoin = artifacts.require("./OPUCoin.sol");
const ColdStorage = artifacts.require("./ColdStorage.sol");

var allocation;
var token;
var coldStorageContract;

contract("ColdStorage test", async function(accounts) {
    const [manager, backend, founders, partners, coldStorage, holding] = accounts;

    it("setting up tokens and contracts", async () => {
        allocation = await Allocation.new(backend, founders, partners, 
                                          coldStorage, {from:manager});
        token = OPUCoin.at(await allocation.token());
        coldStorageContract = ColdStorage.at(await allocation.coldStorage());
        await allocation.finalizeHoldingAndTeamTokens(30, {from: backend});
    });

    it("nothing is released until a year passes", async () => {
        try {
            await coldStorageContract.claimTokens({from: coldStorage});
            assert.fail();
        } catch(err) {
            z = err.message.search("revert") >= 0;
            assert(z, "expected throw not received");
        }

        let ctokens = Number( await( token.balanceOf( coldStorage )));
        assert.equal(ctokens, 0, "no tokens should be released from cold storage");
    });

    it("everything is released after two years pass", async () => {
        let increaseTime = addSeconds => web3.currentProvider
            .send({jsonrpc: "2.0", method: "evm_increaseTime", params: [addSeconds], id: 0})

        increaseTime(3600 * 24 * (2 * 365 + 4));
        await coldStorageContract.claimTokens({from: coldStorage});

        assert.equal(Number( await( token.balanceOf( coldStorage ))), 189 * 1e6 * 1e18,
                "100% is collected by the cold storage");
    });
});
