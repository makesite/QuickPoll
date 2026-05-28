// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract QuickPoll {
    struct Poll {
        address creator;
        string question;
        string[] options;
        uint256[] votes;
        uint256 createdAt;
    }

    Poll[] private polls;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event PollCreated(uint256 indexed id, address indexed creator, string question);
    event Voted(uint256 indexed pollId, address indexed voter, uint256 optionIndex);

    function createPoll(string calldata question, string[] calldata options) external returns (uint256) {
        require(options.length >= 2 && options.length <= 8, "2-8 options required");
        uint256 id = polls.length;
        polls.push();
        Poll storage p = polls[id];
        p.creator = msg.sender;
        p.question = question;
        p.createdAt = block.timestamp;
        for (uint i = 0; i < options.length; i++) {
            p.options.push(options[i]);
            p.votes.push(0);
        }
        emit PollCreated(id, msg.sender, question);
        return id;
    }

    function vote(uint256 pollId, uint256 optionIndex) external {
        require(pollId < polls.length, "Poll not found");
        require(!hasVoted[pollId][msg.sender], "Already voted");
        Poll storage p = polls[pollId];
        require(optionIndex < p.options.length, "Invalid option");
        p.votes[optionIndex]++;
        hasVoted[pollId][msg.sender] = true;
        emit Voted(pollId, msg.sender, optionIndex);
    }

    function getPoll(uint256 id) external view returns (address creator, string memory question, string[] memory options, uint256[] memory votes, uint256 createdAt) {
        require(id < polls.length, "Not found");
        Poll storage p = polls[id];
        return (p.creator, p.question, p.options, p.votes, p.createdAt);
    }

    function total() external view returns (uint256) { return polls.length; }
}