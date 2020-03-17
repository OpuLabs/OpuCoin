pragma solidity 0.4.24;

import "./math/SafeMath.sol";
import "./Ownable.sol";
import "./Token/ERC20.sol";

contract Vesting is Ownable {
    using SafeMath for uint;
    using SafeMath for uint256;

    ERC20 public token;
    mapping (address => Holding) public holdings;
    address internal founders;

    uint constant internal PERIOD_INTERVAL = 30 days;
    uint constant internal FOUNDERS_HOLDING = 365 days;
    uint constant internal BONUS_HOLDING = 0;
    uint constant internal TOTAL_PERIODS = 12;

    uint internal totalTokensCommitted = 0;

    bool internal vestingStarted = false;
    uint internal vestingStart = 0;
    uint vestingRewind = 109 days;

    struct Holding {
        uint tokensCommitted;
        uint tokensRemaining;
        uint batchesClaimed;

        bool isFounder;
        bool isValue;
    }

    event TokensReleased(address _to, uint _tokensReleased, uint _tokensRemaining);
    event VestingInitialized(address _to, uint _tokens);
    event VestingUpdated(address _to, uint _totalTokens);

    constructor(address _token, address _founders) public {
        require( _token != 0x0);
        require(_founders != 0x0);
        token = ERC20(_token);
        founders = _founders;
    }

    function claimTokens() external {
        require( holdings[msg.sender].isValue );
        require( vestingStarted );
        uint personalVestingStart =
            (holdings[msg.sender].isFounder) ? (vestingStart.add(FOUNDERS_HOLDING)) : (vestingStart);
        require( now > personalVestingStart );
        uint periodsPassed = now.sub(personalVestingStart).div(PERIOD_INTERVAL);
        uint batchesToClaim = periodsPassed.sub(holdings[msg.sender].batchesClaimed);
        require( batchesToClaim > 0 );
        uint tokensPerBatch = (holdings[msg.sender].tokensRemaining).div(
            TOTAL_PERIODS.sub(holdings[msg.sender].batchesClaimed)
        );
        uint tokensToRelease = 0;

        if (periodsPassed >= TOTAL_PERIODS) {
            tokensToRelease = holdings[msg.sender].tokensRemaining;
            delete holdings[msg.sender];
        } else {
            tokensToRelease = tokensPerBatch.mul(batchesToClaim);
            holdings[msg.sender].tokensRemaining = (holdings[msg.sender].tokensRemaining).sub(tokensToRelease);
            holdings[msg.sender].batchesClaimed = holdings[msg.sender].batchesClaimed.add(batchesToClaim);
        }
        require( token.transfer(msg.sender, tokensToRelease) );
        emit TokensReleased(msg.sender, tokensToRelease, holdings[msg.sender].tokensRemaining);
    }

    function tokensRemainingInHolding(address _user) public view returns (uint) {
        return holdings[_user].tokensRemaining;
    }

    function initializeVesting(address _beneficiary, uint _tokens) public onlyOwner {
        bool isFounder = (_beneficiary == founders);
        _initializeVesting(_beneficiary, _tokens, isFounder);
    }

    function finalizeVestingAllocation() public onlyOwner {
        vestingStarted = true;
        vestingStart = now.sub(vestingRewind);
    }

    function _initializeVesting(address _to, uint _tokens, bool _isFounder) internal {
        require( !vestingStarted );
        if (!_isFounder) totalTokensCommitted = totalTokensCommitted.add(_tokens);
        if (!holdings[_to].isValue) {
            holdings[_to] = Holding({
                tokensCommitted: _tokens,
                tokensRemaining: _tokens,
                batchesClaimed: 0,
                isFounder: _isFounder,
                isValue: true
            });
            emit VestingInitialized(_to, _tokens);
        } else {
            holdings[_to].tokensCommitted = (holdings[_to].tokensCommitted).add(_tokens);
            holdings[_to].tokensRemaining = (holdings[_to].tokensRemaining).add(_tokens);
            emit VestingUpdated(_to, holdings[_to].tokensRemaining);
        }
    }
}
