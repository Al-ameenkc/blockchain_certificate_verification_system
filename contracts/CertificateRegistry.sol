// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertificateRegistry {
    address public owner;

    struct Certificate {
        string name;
        string matricNumber;
        string department;
        string classOfDegree;
        string date;
        bool isRegistered;
        address issuer;
    }

    // Mapping from a Reference string to a Certificate
    mapping(string => Certificate) public certificates;

    event CertificateIssued(string referenceId, string name, string matricNumber, address issuer);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function issueCertificate(
        string memory _ref,
        string memory _name,
        string memory _matricNumber,
        string memory _department,
        string memory _classOfDegree,
        string memory _date
    ) public onlyOwner {
        require(!certificates[_ref].isRegistered, "Certificate already exists!");

        certificates[_ref] = Certificate({
            name: _name,
            matricNumber: _matricNumber,
            department: _department,
            classOfDegree: _classOfDegree,
            date: _date,
            isRegistered: true,
            issuer: msg.sender
        });

        emit CertificateIssued(_ref, _name, _matricNumber, msg.sender);
    }

    function verifyCertificate(string memory _ref) public view returns (Certificate memory) {
        require(certificates[_ref].isRegistered, "Certificate not found.");
        return certificates[_ref];
    }
}
