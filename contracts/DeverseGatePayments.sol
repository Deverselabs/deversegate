// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DeverseGatePayments {
    address public owner;
    
    event InvoicePaid(
        string indexed invoiceNumber,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );
    
    constructor() {
        owner = msg.sender;
    }
    
    function payInvoice(
        string memory invoiceNumber,
        address payable recipient
    ) external payable {
        require(msg.value > 0, "Must send ETH");
        require(recipient != address(0), "Invalid recipient");
        
        (bool success, ) = recipient.call{value: msg.value}("");
        require(success, "Transfer failed");
        
        emit InvoicePaid(
            invoiceNumber,
            msg.sender,
            recipient,
            msg.value,
            block.timestamp
        );
    }
    
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
    
    receive() external payable {
        revert("Use payInvoice function");
    }
}
