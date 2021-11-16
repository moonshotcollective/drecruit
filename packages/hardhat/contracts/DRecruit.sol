// SPDX-License-Identifier: MIT
// solhint-disable
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

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract DRecruit is
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
    }
    using Counters for Counters.Counter;

    bytes32 public constant URI_SETTER_ROLE = keccak256("URI_SETTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public fee; // payable in wei units of ether
    uint256 public accumulatedFees;
    mapping(uint256 => Resume) public balances;

    uint256 public recruiterBaseFee = 0.1 ether;
    uint256 public unlockDeveloperBaseFee = 0.1 ether;
    address[] public developers;
    address[] public recruiters;
    mapping(address => string[]) public approvedRecruiters;
    mapping(address => string[]) public requestedRecruiters;

    Counters.Counter public tokenId;

    event NewDeveloper(address indexed developer, string indexed developerDID);
    event NewRecruiter(address indexed recruiter, string indexed recruiterDID);
    event NewPrivateProfileAccessRequest(
        address indexed recruiter,
        string indexed recruiterDID,
        address indexed developer
    );
    event NewPrivateProfileAccessApproval(
        address indexed developer,
        string indexed recruiterDID
    );
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
        // approvedRecruiters[msg.sender] = [newDeveloperDID];
        emit NewDeveloper(msg.sender, newDeveloperDID);
        console.log(msg.sender, "added newDeveloper", newDeveloperDID);
    }

    function joinDrecruiterAsRecruiter(string memory newRecruiterDID)
        public
        payable
    {
        require(
            msg.value >= recruiterBaseFee,
            "Value must be bigger or equal to the recruiter base fee"
        );
        recruiters.push(msg.sender);
        emit NewRecruiter(msg.sender, newRecruiterDID);
        console.log(msg.sender, "added new recruiter", newRecruiterDID);
    }

    function privateProfileAccessRequest(
        address developer,
        string memory recruiterDID
    ) public payable {
        require(
            msg.value >= unlockDeveloperBaseFee,
            "Value must be bigger or equal to the developer base fee"
        );
        requestedRecruiters[developer].push(recruiterDID);
        emit NewPrivateProfileAccessRequest(
            msg.sender,
            recruiterDID,
            developer
        );
        console.log(msg.sender, "new private profile request", recruiterDID);
    }

    function privateProfileAccessApproval(
        address developer,
        string memory recruiterDID
    ) public payable {
        require(msg.sender == developer, "Cannot approve someone for else!");
        approvedRecruiters[developer].push(recruiterDID);
        emit NewPrivateProfileAccessApproval(msg.sender, recruiterDID);
        console.log(msg.sender, "new private profile approval", recruiterDID);
    }

    function getDeveloperAccessRequests(address dev)
        public
        view
        returns (string[] memory)
    {
        return requestedRecruiters[dev];
    }

    function getDevelopers() public view returns (address[] memory) {
        return developers;
    }

    function mint(bytes memory data) external {
        balances[tokenId.current()] = Resume(msg.sender, 0);
        tokenId.increment();
        _mint(msg.sender, tokenId.current() - 1, 1, data);
        emit NewResume(msg.sender, tokenId.current() - 1, data);
    }

    function unlock(address account, uint256 id) external payable {
        require(id < tokenId.current(), "NOT_MINTED_YET");
        require(msg.value >= fee, "UNPAID_FEE");
        uint256 resumeFee = (80 * msg.value) / 100;
        Resume storage _resume = balances[id];
        _resume.fees += resumeFee;
        accumulatedFees += (msg.value - resumeFee);
        _mint(account, id, 1, "");
        emit UnlockResume(account, id);
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
