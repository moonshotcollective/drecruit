// SPDX-License-Identifier: MIT
/**
                                            ..
                                          ,*.
                                        .**,
                                       ,***.
                                 .,.   ,***,
                               .**,    *****.
                             .****.    ,*****,
                           .******,     ,******,
                         .*******.       .********,              .
                       ,******.            .*************,,*****.
                     ,*****.        ,,.        ,************,.
                  .,****.         ,*****,
                 ,***,          ,*******,.              ..
               ,**,          .*******,.       ,********.
                           .******,.       .********,
                         .*****,         .*******,
                       ,****,          .******,
                     ,***,.          .*****,
                   ,**,.           ./***,
                  ,,             .***,
                               .**,
            __  _______  ____  _   _______ __  ______  ______
           /  |/  / __ \/ __ \/ | / / ___// / / / __ \/_  __/
          / /|_/ / / / / / / /  |/ /\__ \/ /_/ / / / / / /
         / /  / / /_/ / /_/ / /|  /___/ / __  / /_/ / / /
        /_/  /_/\____/\____/_/_|_//____/_/_/_/\____/_/_/__    ________
          / ____/ __ \/ /   / /   / ____/ ____/_  __/  _/ |  / / ____/
         / /   / / / / /   / /   / __/ / /     / /  / / | | / / __/
        / /___/ /_/ / /___/ /___/ /___/ /___  / / _/ /  | |/ / /___
        \____/\____/_____/_____/_____/\____/ /_/ /___/  |___/_____/
*/
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract DRecruitV1 is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, PausableUpgradeable,
    ERC1155BurnableUpgradeable, UUPSUpgradeable {
    struct Resume {
        address submitter;
        uint256 fees;
    }
    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public fee; // payable in wei units of ether
    uint256 public accumulatedFees;
    mapping(uint256 => Resume) public balances;
    mapping(uint256 => mapping(address => uint256)) public requests; // tokenId -> (staker -> amount)
    mapping(uint256 => string) public tokenUris;
    Counters.Counter public tokenId;

    mapping(uint256 => EnumerableSet.AddressSet) private requesters;

    event NewResume(address indexed submitter, uint256 indexed id);
    event RequestResume(address indexed requester, uint256 indexed id, uint256 stake);
    event ApproveRequest(address indexed approved, uint256 indexed id);
    event RejectRequest(address indexed rejected, uint256 indexed id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    // solhint-disable-next-line no-empty-blocks
    constructor() initializer {}

    function uri(uint256 id) public view override returns (string memory) {
        return tokenUris[id];
    }

    function getRequesters(uint256 id) external view returns (address[] memory) {
        return requesters[id].values();
    }

    function initialize(uint256 _fee) external initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __Pausable_init();
        __ERC1155Burnable_init();
        __UUPSUpgradeable_init();

        fee = _fee;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
    }

    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // solhint-disable-next-line avoid-low-level-calls
        address(msg.sender).call{value: accumulatedFees}("");
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(string memory _tokenUri, bytes memory data)
        external
    {
        balances[tokenId.current()] = Resume(msg.sender, 0);
        tokenUris[tokenId.current()] = _tokenUri;
        tokenId.increment();
        _mint(msg.sender, tokenId.current() - 1, 1, data);
        emit NewResume(msg.sender, tokenId.current() - 1);
        emit URI(_tokenUri, tokenId.current() - 1);
    }

    function request(uint256 id)
        external payable
    {
        require(id < tokenId.current(), "NOT_MINTED_YET");
        require(msg.value >= fee, "UNPAID_FEE");
        require(requests[id][msg.sender] == 0, "ALREADY_REQUESTED");
        requests[id][msg.sender] = msg.value;
        requesters[id].add(msg.sender);
        emit RequestResume(msg.sender, id, msg.value);
    }

    function approveRequest(uint256 id, address account)
        external
    {
        Resume memory _resume = balances[id];
        require(_resume.submitter == msg.sender, "UNAUTHORIZED");
        require(requests[id][account] != 0, "NOT_REQUESTED");
        uint256 resumeFee = (80*requests[id][account])/100;
        // solhint-disable-next-line avoid-low-level-calls
        address(msg.sender).call{value: resumeFee}("");
        accumulatedFees += (requests[id][account] - resumeFee);
        requests[id][account] = 0; // save some gas
        requesters[id].remove(account);
        _mint(account, id, 1, "");
        emit ApproveRequest(account, id);
    }

    function approveRequests(uint256 id, address[] calldata accounts)
        external
    {
        Resume memory _resume = balances[id];
        require(_resume.submitter == msg.sender, "UNAUTHORIZED");
        for(uint256 i = 0; i < accounts.length; i++) {
            if(requests[id][accounts[i]] == 0) {
                continue;
            }
            uint256 resumeFee = (80*requests[id][accounts[i]])/100;
            // solhint-disable-next-line avoid-low-level-calls
            address(msg.sender).call{value: resumeFee}("");
            accumulatedFees += (requests[id][accounts[i]] - resumeFee);
            requests[id][accounts[i]] = 0; // save some gas
            requesters[id].remove(accounts[i]);
            _mint(accounts[i], id, 1, "");
            emit ApproveRequest(accounts[i], id);
        }
    }

    function rejectRequests(uint256 id, address[] calldata accounts)
        external
    {
        Resume memory _resume = balances[id];
        require(_resume.submitter == msg.sender, "UNAUTHORIZED");
        for(uint256 i = 0; i < accounts.length; i++) {
            if(requests[id][accounts[i]] == 0) {
                continue;
            }
            // solhint-disable-next-line avoid-low-level-calls
            address(accounts[i]).call{value: requests[id][accounts[i]]}("");
            requests[id][accounts[i]] = 0; // save some gas
            requesters[id].remove(accounts[i]);
            emit RejectRequest(accounts[i], id);
        }
    }

    function _beforeTokenTransfer(
        address /*operator*/,
        address from,
        address to,
        uint256[] memory /*ids*/,
        uint256[] memory /*amounts*/,
        bytes memory /*data*/)
        internal view
        whenNotPaused
        override
    {
        if(from != address(0)) {
            require(to == address(0), "TRANSFER_DISALLOWED");
        }
    }


    function _authorizeUpgrade(address newImplementation)
        internal
        onlyRole(UPGRADER_ROLE)
        override
    // solhint-disable-next-line no-empty-blocks
    {}

    // The following functions are overrides required by Solidity.

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
