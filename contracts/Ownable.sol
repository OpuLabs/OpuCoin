/*
This source file has been copied with modification from https://github.com/OpenZeppelin/openzeppelin-solidity
commit 2307467,  under MIT license. See LICENSE
*/
  
pragma solidity 0.4.24;
  
  
/**
* @title Ownable
* @dev The Ownable contract has an owner address, and provides basic authorization control
* functions, this simplifies the implementation of "user permissions".
*/
contract Ownable {
    address public owner;
    address public newOwner;

    event OwnershipRenounced(address indexed previousOwner);
    event OwnershipTransferInitiated(
        address indexed previousOwner,
        address indexed newOwner
    );
    event OwnershipTransferred(
        address indexed previousOwner,
        address indexed newOwner
    );
  
    /**
     * @dev The Ownable constructor sets the original `owner` of the contract to the sender
     * account.
     */
    constructor() public {
        owner = msg.sender;
    }
  
    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }
  
    /**
     * @dev Throws if called by any account other than the specific function owner.
     */
    modifier ownedBy(address _a) {
        require( msg.sender == _a );
        _;
    }

    /**
     * @dev Allows the current owner to relinquish control of the contract.
     * @notice Renouncing to ownership will leave the contract without an owner.
     * It will not be possible to call the functions with the `onlyOwner`
     * modifier anymore.
     */
    function renounceOwnership() public onlyOwner {
        emit OwnershipRenounced(owner);
        owner = address(0);
    }
  
    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to. Needs to be accepted by
     * the new owner.
     */
    function transferOwnership(address _newOwner) public onlyOwner {
        _transferOwnership(_newOwner);
    }

    /**
     * @dev Allows the current owner to transfer control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
     */
    function transferOwnershipAtomic(address _newOwner) public onlyOwner {
        owner = _newOwner;
        newOwner = address(0);
        emit OwnershipTransferred(owner, _newOwner);
    }
  
    /**
     * @dev Completes the ownership transfer by having the new address confirm the transfer.
     */
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, msg.sender);
        owner = msg.sender;
        newOwner = address(0);
    }
  
    /**
     * @dev Transfers control of the contract to a newOwner.
     * @param _newOwner The address to transfer ownership to.
     */
    function _transferOwnership(address _newOwner) internal {
        require(_newOwner != address(0));
        newOwner = _newOwner;
        emit OwnershipTransferInitiated(owner, _newOwner);
    }
}
