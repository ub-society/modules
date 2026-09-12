# Protocol Security and Maximum Extractable Value

Smart contract protocols operate in hostile, adversarial execution environments.
Unlike traditional software where source code and databases sit protected behind corporate firewalls, smart contract bytecode, execution state, and pending transaction pools are public to the entire internet.
Any economic flaw, reentrancy bug, or transaction ordering exploit can be targeted by automated bots within seconds of discovery.
Protocol security requires understanding low-level virtual machine vulnerabilities alongside game-theoretic exploitation via Maximum Extractable Value (MEV).

## Core Smart Contract Vulnerabilities

Smart contract bugs frequently arise from the impedance mismatch between high-level programming assumptions and low-level EVM execution mechanics.

```mermaid
flowchart TD
    Vulnerabilities[Critical EVM Vulnerabilities]
    Vulnerabilities --> V1[1. Reentrancy]
    Vulnerabilities --> V2[2. Arithmetic Overflow / Underflow]
    Vulnerabilities --> V3[3. Access Control & Authorization]
    Vulnerabilities --> V4[4. Unchecked External Calls]
```

### 1. Reentrancy Attacks

A reentrancy vulnerability occurs when a contract makes an external call to an untrusted address before resolving its internal state updates.
The recipient can hijack control flow and recursively call back into the original contract before the initial execution has updated balances.

```solidity
// Vulnerable withdrawal function: State updated AFTER external call
function withdraw() public {
    uint256 balance = balances[msg.sender];
    require(balance > 0, "No balance");

    // External call surrenders execution control to recipient
    (bool success, ) = msg.sender.call{value: balance}("");
    require(success, "Transfer failed");

    // Execution never reaches this line before attacker drains contract
    balances[msg.sender] = 0;
}
```

```mermaid
sequenceDiagram
    autonumber
    actor Attacker
    participant Target as Vulnerable Contract
    participant AttackerContract as Exploit Contract (fallback)

    Attacker->>Target: Call withdraw()
    Target->>Target: Check balance > 0 (Passes)
    Target->>AttackerContract: Call raw value transfer (Control Given)
    AttackerContract->>Target: Call withdraw() AGAIN (Reentrancy Loop)
    Target->>Target: Balance is STILL > 0 (State wasn't updated yet!)
    Target->>AttackerContract: Transfer value again
    Note over Target,AttackerContract: Loop drains contract completely until gas runs out
```

#### Defenses against Reentrancy:
- **Checks-Effects-Interactions (CEI) Pattern:** Always update internal state variables and zero-out balances **before** making external calls.
- **Reentrancy Guards:** Implement non-reentrant mutex locks (such as OpenZeppelin's `ReentrancyGuard`) that revert if execution re-enters a protected function before completion.

### 2. Arithmetic Overflow and Underflow

Prior to Solidity version 0.8.0, arithmetic operations wrapped around silently without throwing errors.
For example, subtracting 1 from a `uint256` value of zero wrapped to $2^{256} - 1$.
Modern Solidity includes built-in compiler overflow checks that automatically invoke `REVERT` on mathematical underflows, eliminating the need for historical libraries like OpenZeppelin `SafeMath` unless developers explicitly use the `unchecked { ... }` block for gas optimization.

### 3. Access Control and Authorization Failures

Failing to restrict administrative functions (such as `initialize()`, `upgradeTo()`, or `setFeeRecipient()`) allows any external caller to take ownership of contract storage.
A famous example was the Parity Multi-Sig wallet freeze in 2017, where an uninitialized library contract allowed an attacker to call `initWallet()`, claim contract ownership, and invoke `selfdestruct()`, permanently locking 513,774 ETH.

## Maximum Extractable Value (MEV)

Phil Daian et al. formalized Maximum Extractable Value (initially Miner Extractable Value) in their 2019 paper *Flash Boys 2.0*.
MEV is the maximum value that can be extracted from block production in excess of the standard block reward and gas fees by including, excluding, or changing the chronological order of transactions within a block.

```mermaid
flowchart TD
    Mempool[Public Mempool: Unconfirmed Txs] --> Searchers[MEV Searchers: Algorithmic Bots]
    Searchers -->|Simulate & Construct Bundles| Bundles["Private Bundles (Tx Front-Run + Target + Back-Run)"]
    Bundles --> Builders[Block Builders]
    Builders -->|MEV-Boost Auction: Direct Tip| Proposers[Block Proposers / Validators]
```

### Common MEV Extraction Strategies

#### 1. Front-Running and Back-Running

- **Front-Running:** A searcher bot detects a pending profitable trade in the public mempool (e.g. an oracle liquidation or large DEX swap) and submits the identical transaction with a higher priority gas fee to ensure it is mined earlier.
- **Back-Running:** A searcher bot detects a large trade that will shift AMM pool prices and submits an immediate arbitrage swap right behind it to capture the resulting price discrepancy.

#### 2. The Sandwich Attack

A predatory MEV pattern targeting decentralized exchange traders who set high slippage tolerances:

```mermaid
sequenceDiagram
    autonumber
    actor Victim as Trader Alice
    participant Bot as MEV Searcher Bot
    participant AMM as DEX Pool

    Bot->>AMM: 1. Front-run: Buy Token X (Pushes price up to Alice's max slippage)
    Victim->>AMM: 2. Alice's Trade: Executes at worst-possible slippage price
    Bot->>AMM: 3. Back-run: Sell Token X immediately at inflated price
    Note over Bot,AMM: Bot extracts risk-free profit and Alice suffers maximum slippage
```

#### 3. Liquidations

Searcher bots monitor lending protocols 24/7.
The moment an oracle transaction updates prices, hundreds of bots compete in priority gas auctions (PGA) to execute the liquidation within the identical block, capturing the liquidation bonus.

## The Architecture of Modern MEV: MEV-Boost and PBS

In naive Proof of Work and early Proof of Stake, validators captured MEV directly by inspecting their local mempools and reordering transactions.
This created dangerous network centralization: large validator cartels with specialized algorithmic infrastructure earned significantly higher yields than individual home stakers.

To preserve validator decentralization, Ethereum adopted **Proposer-Builder Separation (PBS)** via the off-chain **MEV-Boost** middleware.

```mermaid
flowchart LR
    Searcher[MEV Searchers] -->|Optimized Bundles| Builder[Block Builders]
    Builder -->|Complete Candidate Block + Bid| Relay[MEV Relays]
    Relay -->|Header + Bid Value Only| Proposer[Block Proposer / Validator]
    Proposer -->|Signs Header with Highest Bid| Relay
    Relay -->|Releases Full Block to Network| Consensus[Canonical L1 Block]
```

1. **Searchers:** Specialized algorithmic bots identify arbitrage opportunities, construct atomic bundles of transactions, and submit them privately to block builders.
2. **Builders:** Specialized high-performance servers assemble bundles and public mempool transactions into complete, optimal candidate blocks that maximize total block value.
3. **Relays:** Trusted data escrow agents that verify block validity and prevent builders from cheating proposers, or proposers from stealing MEV strategies before signing.
4. **Proposers:** The designated slot validator does not know the internal contents of the block.
   The proposer merely signs the header of the block builder who submits the highest economic bid.

Through PBS, complex algorithmic MEV extraction is decoupled from consensus validation, allowing solo home stakers to earn competitive MEV yields without running high-frequency trading infrastructure.
