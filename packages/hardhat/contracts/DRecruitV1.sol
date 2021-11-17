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
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract DRecruitV1 is
    Initializable,
    ERC1155Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ERC1155BurnableUpgradeable,
    UUPSUpgradeable
{
    struct Resume {
        address submitter;
        uint256 fees;
        string uri;
    }

    using Counters for Counters.Counter;
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    IERC20 public token;
    uint256 public fee; // payable in wei units of ether
    uint256 public accumulatedFees;

    Counters.Counter public tokenId;

    mapping(uint256 => Resume) public resumes;
    mapping(uint256 => mapping(address => uint256)) public requests; // tokenId -> (staker -> amount)
    mapping(address => uint256) public owners; // submitter -> tokenId
    mapping(uint256 => EnumerableSet.AddressSet) private requesters;

    event NewResume(address indexed submitter, uint256 indexed id);
    event RequestResume(
        address indexed requester,
        uint256 indexed id,
        uint256 stake
    );
    event ApproveRequest(address indexed approved, uint256 indexed id);
    event RejectRequest(address indexed rejected, uint256 indexed id);
    event RevokeRequest(address indexed requester, uint256 indexed id);

    // solhint-disable-next-line no-empty-blocks
    constructor() {}

    function uri(uint256 id) public view override returns (string memory) {
        Resume memory resume = resumes[id];
        return resume.uri;
    }

    function getRequesters(uint256 id)
        external
        view
        returns (address[] memory)
    {
        return requesters[id].values();
    }

    function initialize(uint256 _fee, IERC20 _token) external initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __Pausable_init();
        __ERC1155Burnable_init();
        __UUPSUpgradeable_init();

        fee = _fee;
        token = _token;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
    }

    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        token.safeTransfer(msg.sender, token.balanceOf(address(this)));
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function mint(string memory tokenUri, bytes memory data) external {
        require(owners[msg.sender] == 0, "TOKEN_EXISTS");
        resumes[tokenId.current()] = Resume(msg.sender, 0, tokenUri);
        tokenId.increment();
        _mint(msg.sender, tokenId.current() - 1, 1, data);
        emit NewResume(msg.sender, tokenId.current() - 1);
        emit URI(tokenUri, tokenId.current() - 1);
    }

    function request(uint256 id, uint256 stake) external payable {
        require(id < tokenId.current(), "NOT_MINTED_YET");
        require(stake >= fee, "UNPAID_FEE");
        require(requests[id][msg.sender] == 0, "ALREADY_REQUESTED");
        requests[id][msg.sender] = stake;
        requesters[id].add(msg.sender);
        token.safeTransferFrom(msg.sender, address(this), stake);
        emit RequestResume(msg.sender, id, stake);
    }

    function approveRequest(uint256 id, address account) external {
        Resume memory _resume = resumes[id];
        require(_resume.submitter == msg.sender, "UNAUTHORIZED");
        require(requests[id][account] != 0, "NOT_REQUESTED");
        uint256 resumeFee = (80 * requests[id][account]) / 100;
        accumulatedFees += (requests[id][account] - resumeFee);
        requests[id][account] = 0; // save some gas
        requesters[id].remove(account);
        _mint(account, id, 1, "");
        token.safeTransfer(msg.sender, resumeFee);
        emit ApproveRequest(account, id);
    }

    function approveRequests(uint256 id, address[] calldata accounts) external {
        Resume memory _resume = resumes[id];
        require(_resume.submitter == msg.sender, "UNAUTHORIZED");
        for (uint256 i = 0; i < accounts.length; i++) {
            if (requests[id][accounts[i]] == 0) {
                continue;
            }
            uint256 resumeFee = (80 * requests[id][accounts[i]]) / 100;
            accumulatedFees += (requests[id][accounts[i]] - resumeFee);
            requests[id][accounts[i]] = 0; // save some gas
            requesters[id].remove(accounts[i]);
            _mint(accounts[i], id, 1, "");
            token.safeTransfer(msg.sender, resumeFee);
            emit ApproveRequest(accounts[i], id);
        }
    }

    function rejectRequest(uint256 id, address account) external {
        Resume memory _resume = resumes[id];
        require(_resume.submitter == msg.sender, "UNAUTHORIZED");
        require(requests[id][account] != 0, "NOT_REQUESTED");
        requests[id][account] = 0; // save some gas
        requesters[id].remove(account);
        token.safeTransfer(account, requests[id][account]);
        emit RejectRequest(account, id);
    }

    function rejectRequests(uint256 id, address[] calldata accounts) external {
        Resume memory _resume = resumes[id];
        require(_resume.submitter == msg.sender, "UNAUTHORIZED");
        for (uint256 i = 0; i < accounts.length; i++) {
            if (requests[id][accounts[i]] == 0) {
                continue;
            }
            requests[id][accounts[i]] = 0; // save some gas
            requesters[id].remove(accounts[i]);
            token.safeTransfer(accounts[i], requests[id][accounts[i]]);
            emit RejectRequest(accounts[i], id);
        }
    }

    function revokeRequest(uint256 id) external {
        require(requests[id][msg.sender] != 0, "NOT_REQUESTED");
        requests[id][msg.sender] = 0; // save some gas
        requesters[id].remove(msg.sender);
        token.safeTransfer(msg.sender, requests[id][msg.sender]);
        emit RevokeRequest(msg.sender, id);
    }

    function _beforeTokenTransfer(
        address, /*operator*/
        address from,
        address to,
        uint256[] memory, /*ids*/
        uint256[] memory, /*amounts*/
        bytes memory /*data*/
    ) internal view override whenNotPaused {
        if (from != address(0)) {
            require(to == address(0), "TRANSFER_DISALLOWED");
        }
    }

    function _authorizeUpgrade(address newImplementation)
        internal
        override
        onlyRole(UPGRADER_ROLE)
    // solhint-disable-next-line no-empty-blocks
    {

    }

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
