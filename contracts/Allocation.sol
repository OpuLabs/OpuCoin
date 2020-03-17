pragma solidity 0.4.24;

import "./math/SafeMath.sol";
import "./ColdStorage.sol";
import "./OPUCoin.sol";
import "./Ownable.sol";
import "./Vesting.sol";

contract Allocation is Ownable {
    using SafeMath for uint256;

    address public backend;
    address public team;
    address public partners;
    address public toSendFromStorage; address public rewards;
    OPUCoin public token;
    Vesting public vesting;
    ColdStorage public coldStorage;

    bool public emergencyPaused = false;
    bool public finalizedHoldingsAndTeamTokens = false;
    bool public mintingFinished = false;

    // All the numbers on the following 8 lines are lower than 10^30
    // Which is in turn lower than 2^105, which is lower than 2^256
    // So, no overflows are possible, the operations are safe.
    uint constant internal MIL = 1e6 * 1e18;

    // Token distribution table, all values in millions of tokens
    uint constant internal ICO_DISTRIBUTION    = 550 * MIL;
    uint constant internal TEAM_TOKENS         = 550  * MIL;
    uint constant internal COLD_STORAGE_TOKENS = 75  * MIL;
    uint constant internal PARTNERS_TOKENS     = 175  * MIL;
    uint constant internal REWARDS_POOL        = 150  * MIL;

    uint internal totalTokensSold = 0;

    event TokensAllocated(address _buyer, uint _tokens);
    event TokensAllocatedIntoHolding(address _buyer, uint _tokens);
    event TokensMintedForRedemption(address _to, uint _tokens);
    event TokensSentIntoVesting(address _vesting, address _to, uint _tokens);
    event TokensSentIntoHolding(address _vesting, address _to, uint _tokens);
    event HoldingAndTeamTokensFinalized();
    event BackendUpdated(address oldBackend, address newBackend);
    event TeamUpdated(address oldTeam, address newTeam);
    event PartnersUpdated(address oldPartners, address newPartners);
    event ToSendFromStorageUpdated(address oldToSendFromStorage, address newToSendFromStorage);

    // Human interaction (only accepted from the address that launched the contract)
    constructor(
        address _backend,
        address _team,
        address _partners,
        address _toSendFromStorage,
        address _rewards
    )
        public
    {
        require( _backend           != address(0) );
        require( _team              != address(0) );
        require( _partners          != address(0) );
        require( _toSendFromStorage != address(0) );
        require( _rewards != address(0) );

        backend           = _backend;
        team              = _team;
        partners          = _partners;
        toSendFromStorage = _toSendFromStorage;
        rewards = _rewards;

        token       = new OPUCoin();
        vesting     = new Vesting(address(token), team);
        coldStorage = new ColdStorage(address(token));
    }

    function emergencyPause() public onlyOwner unpaused { emergencyPaused = true; }

    function emergencyUnpause() public onlyOwner paused { emergencyPaused = false; }

    function allocate(
        address _buyer,
        uint _tokensWithStageBonuses
    )
        public
        ownedBy(backend)
        mintingEnabled
    {
        uint tokensAllocated = _allocateTokens(_buyer, _tokensWithStageBonuses);
        emit TokensAllocated(_buyer, tokensAllocated);
    }

    function finalizeHoldingAndTeamTokens()
        public
        ownedBy(backend)
        unpaused
    {
        require( !finalizedHoldingsAndTeamTokens );

        finalizedHoldingsAndTeamTokens = true;

        vestTokens(team, TEAM_TOKENS);
        holdTokens(toSendFromStorage, COLD_STORAGE_TOKENS);
        token.mint(partners, PARTNERS_TOKENS);
        token.mint(rewards, REWARDS_POOL);

        // Can exceed ICO token cap

        vesting.finalizeVestingAllocation();

        mintingFinished = true;
        token.finishMinting();

        emit HoldingAndTeamTokensFinalized();
    }

    function _allocateTokens(
        address _to,
        uint _tokensWithStageBonuses
    )
        internal
        unpaused
        returns (uint)
    {
        require( _to != address(0) );

        checkCapsAndUpdate(_tokensWithStageBonuses);

        // Calculate the total token sum to allocate
        uint tokensToAllocate = _tokensWithStageBonuses.add();

        // Mint the tokens
        require( token.mint(_to, tokensToAllocate) );
        return tokensToAllocate;
    }

    function checkCapsAndUpdate(uint _tokensToSell, uint _tokensToReward) internal {
        uint newTotalTokensSold = totalTokensSold.add(_tokensToSell);
        require( newTotalTokensSold <= ICO_DISTRIBUTION );
        totalTokensSold = newTotalTokensSold;
    }

    function vestTokens(address _to, uint _tokens) internal {
        require( token.mint(address(vesting), _tokens) );
        vesting.initializeVesting( _to, _tokens );
        emit TokensSentIntoVesting(address(vesting), _to, _tokens);
    }

    function holdTokens(address _to, uint _tokens) internal {
        require( token.mint(address(coldStorage), _tokens) );
        coldStorage.initializeHolding(_to);
        emit TokensSentIntoHolding(address(coldStorage), _to, _tokens);
    }

    function updateBackend(address _newBackend) public onlyOwner {
        require(_newBackend != address(0));
        backend = _newBackend;
        emit BackendUpdated(backend, _newBackend);
    }

    function updateTeam(address _newTeam) public onlyOwner {
        require(_newTeam != address(0));
        team = _newTeam;
        emit TeamUpdated(team, _newTeam);
    }

    function updatePartners(address _newPartners) public onlyOwner {
        require(_newPartners != address(0));
        partners = _newPartners;
        emit PartnersUpdated(partners, _newPartners);
    }

    function updateToSendFromStorage(address _newToSendFromStorage) public onlyOwner {
        require(_newToSendFromStorage != address(0));
        toSendFromStorage = _newToSendFromStorage;
        emit ToSendFromStorageUpdated(toSendFromStorage, _newToSendFromStorage);
    }

    modifier unpaused() {
        require( !emergencyPaused );
        _;
    }

    modifier paused() {
        require( emergencyPaused );
        _;
    }

    modifier mintingEnabled() {
        require( !mintingFinished );
        _;
    }
}
