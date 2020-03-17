pragma solidity 0.4.24;

import "./math/SafeMath.sol";
import "./Ownable.sol";
import "./Token/ERC20.sol";

contract ColdStorage is Ownable {
    using SafeMath for uint8;
    using SafeMath for uint256;

    ERC20 public token;

    uint public lockupEnds;
    uint public lockupPeriod;
    uint public lockupRewind = 109 days;
    bool public storageInitialized = false;
    address public founders;

    event StorageInitialized(address _to, uint _tokens);
    event TokensReleased(address _to, uint _tokensReleased);

    constructor(address _token) public {
        require( _token != address(0) );
        token = ERC20(_token);
        uint lockupYears = 2;
        lockupPeriod = lockupYears.mul(365 days);
    }

    function claimTokens() external {
        require( now > lockupEnds );
        require( msg.sender == founders );

        uint tokensToRelease = token.balanceOf(address(this));
        require( token.transfer(msg.sender, tokensToRelease) );
        emit TokensReleased(msg.sender, tokensToRelease);
    }

    function initializeHolding(address _to) public onlyOwner {
        uint tokens = token.balanceOf(address(this));
        require( !storageInitialized );
        require( tokens != 0 );

        lockupEnds = now.sub(lockupRewind).add(lockupPeriod);
        founders = _to;
        storageInitialized = true;
        emit StorageInitialized(_to, tokens);
    }
}
