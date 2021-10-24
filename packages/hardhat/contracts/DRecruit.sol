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
import "hardhat/console.sol";

contract DRecruit is Initializable, ERC1155Upgradeable, AccessControlUpgradeable, PausableUpgradeable,
    ERC1155BurnableUpgradeable, UUPSUpgradeable {
    struct Resume {
        address submitter;
        uint256 fees;
    }
    using Counters for Counters.Counter;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public fee; // payable in wei units of ether
    uint256 public accumulatedFees;
    address[] public developers;
    mapping(uint256 => Resume) public balances;
    mapping(address => string[]) public approvedRecruiters;

    Counters.Counter public tokenId;

    event NewDeveloper(address indexed developer, string indexed did);
    event NewResume(address indexed submitter, uint256 indexed id, bytes hash);
    event UnlockResume(address indexed unlocker, uint256 indexed id);

    /// @custom:oz-upgrades-unsafe-allow constructor
    // solhint-disable-next-line no-empty-blocks
    constructor() initializer {}

    function initialize(uint256 _fee) external initializer {
        __ERC1155_init("");
        __AccessControl_init();
        __Pausable_init();
        __ERC1155Burnable_init();
        __UUPSUpgradeable_init();

        fee = _fee;

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(URI_SETTER_ROLE, msg.sender);
        _setupRole(PAUSER_ROLE, msg.sender);
        _setupRole(UPGRADER_ROLE, msg.sender);
    }

    function withdrawFees() external onlyRole(DEFAULT_ADMIN_ROLE) {
        // solhint-disable-next-line avoid-low-level-calls
        address(msg.sender).call{value: accumulatedFees}("");
    }

    function setURI(string memory newuri) external onlyRole(URI_SETTER_ROLE) {
        _setURI(newuri);
    }

    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function joinDrecruiterAsDev(string memory newDeveloperDID) public {
      developers.push(msg.sender);
      approvedRecruiters[msg.sender] = [newDeveloperDID];
      emit NewDeveloper(msg.sender, newDeveloperDID);
      console.log(msg.sender, "added newDeveloper", newDeveloperDID);
    }

    function getDeveloperApprovedRecruiters(address dev) public view returns (string[] memory) {
        return approvedRecruiters[dev];
    }
    function getDevelopers() public view returns (address[] memory) {
        return developers;
    }
    
    function mint(bytes memory data)
        external
    {
        balances[tokenId.current()] = Resume(msg.sender, 0);
        tokenId.increment();
        _mint(msg.sender, tokenId.current() - 1, 1, data);
        emit NewResume(msg.sender, tokenId.current() - 1, data);
    }

    function unlock(address account, uint256 id)
        external payable
    {
        require(id < tokenId.current(), "NOT_MINTED_YET");
        require(msg.value >= fee, "UNPAID_FEE");
        uint256 resumeFee = (80*msg.value)/100;
        Resume storage _resume = balances[id];
        _resume.fees += resumeFee;
        accumulatedFees += (msg.value - resumeFee);
        _mint(account, id, 1, "");
        emit UnlockResume(account, id);
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
