# Rollup Architectures: Optimistic vs. Zero-Knowledge

Rollups are the dominant Layer 2 scaling paradigm.
By executing transactions off-chain while posting compressed transaction data to Layer 1, rollups scale throughput without sacrificing decentralization or data availability.
Rollup architectures diverge fundamentally in how they prove to Layer 1 that off-chain state transitions were computed correctly.
The two leading implementations are **Optimistic Rollups** and **Zero-Knowledge (Validity) Rollups**.

## The Two Proof Paradigms

The core distinction between Optimistic and Zero-Knowledge rollups lies in their verification philosophy:

```mermaid
flowchart TD
    subgraph Optimistic Paradigm: Fraud Proofs
        O1[Sequencer Proposes Batch & State Root] --> O2[State Assumed Valid Optimistically]
        O2 --> O3[7-Day Challenge Window Opens]
        O3 -->|No Dispute| O4[State Finalized on L1]
        O3 -->|Fraud Detected| O5[Challenger Submits Fraud Proof & Slashes Sequencer]
    end

    subgraph Zero-Knowledge Paradigm: Validity Proofs
        Z1[Sequencer Executes Batch] --> Z2[Prover Generates ZK-SNARK / STARK Proof]
        Z2 --> Z3[Post State Root + Validity Proof to L1]
        Z3 --> Z4[L1 Smart Contract Verifies Proof Mathematically]
        Z4 --> Z5[Instant Finality on L1 Verification]
    end
```

- **Optimistic Rollups:** Assume all proposed state transitions are valid by default without verifying execution up front. Correctness is guaranteed retroactively through economic incentives and an interactive **fraud proof** challenge window.
- **Zero-Knowledge Rollups:** Assume nothing is valid until cryptographically proven. Every state update posted to L1 must be accompanied by a succint mathematical **validity proof** (ZK-SNARK or ZK-STARK) evaluated by an on-chain verifier contract.

## Optimistic Rollups: Fraud Proof Mechanics

Optimistic rollups (such as Arbitrum One and Optimism Mainnet) execute transactions using an EVM-equivalent execution client.

```mermaid
sequenceDiagram
    autonumber
    participant Seq as Sequencer
    participant L1 as L1 Bridge Contract
    participant Ver as Challenger / Verifier Node

    Seq->>L1: Post Compressed Calldata / Blob + Proposed State Root
    Note over Seq,L1: Optimistic assumption: Root assumed valid
    Ver->>L1: Download Batch Data & Execute Locally
    Ver->>Ver: Assert Calculated Root matches Proposed Root
    alt State Root Valid
        Note over L1: 7-Day Window Expires -> Root Finalized
    else State Root Invalid (Fraud Detected)
        Ver->>L1: Initiate Fraud Dispute
        Note over Ver,Seq: Interactive Bisection Game on L1
        Ver->>L1: Prove Single Faulty Opcode
        L1->>L1: Revert Fraudulent State Root
        L1->>Seq: Slash Sequencer Bond & Reward Verifier
    end
```

### The 7-Day Challenge Window

To prevent an adversary sequencer from submitting an invalid state root (e.g. minting one billion tokens to a private address), Optimistic Rollups enforce a mandatory **7-Day Dispute Window**.
During this period:
- Any full node in the network can download the batch data from L1, re-execute the transactions locally, and verify the resulting state root.
- If a discrepancy is detected, the verifier submits a fraud proof to the L1 contract.
- If no challenge occurs within seven days, the state root is finalized, and withdrawals to L1 are unlocked.

### Interactive Multi-Round Bisection (Arbitrum Nitro)

Submitting an entire failed block to L1 for execution would exceed L1 gas limits.
Instead, Arbitrum uses an **interactive bisection protocol**:
1. The challenger and the sequencer play a turn-based verification game coordinated by an L1 dispute contract.
2. The challenger asserts that the execution diverged over a range of $N$ instructions.
3. The players repeatedly bisect the disputed execution trace: $\frac{N}{2}, \frac{N}{4}, \dots, 1$.
4. Within $\mathcal{O}(\log N)$ rounds, they isolate the disagreement to a single atomic EVM instruction (e.g. an `ADD` or `SSTORE` opcode).
5. The L1 smart contract executes that single opcode within its own EVM runtime, verifies who was truthful, slashes the loser's bonded deposit, and rolls back the fraudulent root.

## Zero-Knowledge Rollups: Validity Proof Mechanics

Zero-Knowledge rollups (such as Starknet, zkSync Era, and Polygon zkEVM) rely on advanced polynomial cryptography to prove the correctness of off-chain execution.

```mermaid
flowchart LR
    TxBatch[10,000 L2 Transactions] --> Exec[L2 Execution Engine]
    Exec --> Trace[Execution Trace & Witness Generation]
    Trace --> Prover[Hardware-Accelerated ZK Prover]
    Prover --> Proof["Succinct Proof: pi (ZK-SNARK / STARK)"]
    Proof --> L1Verifier[L1 On-Chain Verifier Contract]
    L1Verifier -->|Constant-Time Verification| Confirmed[Instant State Finality]
```

### 1. Execution Traces and Arithmetization

Transactions execute off-chain, generating an execution trace of CPU registers, memory access lookups, and state mutations.
The compiler converts these traces into a set of multivariate algebraic polynomials (arithmetization via R1CS, Plonkish, or AIR representations).

### 2. Proof Generation (SNARKs vs. STARKs)

A cryptographic prover constructs a proof $\pi$ demonstrating that a valid sequence of transactions transformed state root $S_t$ into $S_{t+1}$ according to virtual machine rules:

- **ZK-SNARK (Succinct Non-Interactive Argument of Knowledge):** Ultra-compact proof sizes (hundreds of bytes) and fast verification times ($\sim 200,000$ gas on L1). Older variants (Groth16) require a trusted cryptographic setup, while modern systems (PLONK, Halo2) use transparent setups.
- **ZK-STARK (Scalable Transparent Argument of Knowledge):** Relies solely on cryptographic hash functions and Reed-Solomon error-correcting codes. Transparent (zero trusted setup) and post-quantum secure, but produces larger proof byte sizes (dozens of kilobytes).

### 3. Immediate Finality

When the prover submits the proof $\pi$ to the L1 verifier contract, the contract evaluates the mathematical pairing equations.
If the equations check out, the state update is instantly finalized.
There is no challenge period.
Users can withdraw funds back to Layer 1 as soon as the block containing the validity proof is mined on L1 (typically within minutes to hours).

## Deep Architectural Comparison

| Architectural Dimension | Optimistic Rollups | Zero-Knowledge Rollups |
| :--- | :--- | :--- |
| **Trust Model** | $1$-of-$N$ honest verifier assumption (Safety preserved if at least one honest node runs fraud checks) | Pure cryptographic truth (No honest verifier assumption required) |
| **L1 Verification Cost** | Extremely low during normal operations (Only simple state root updates; high only during fraud dispute) | Fixed base gas cost per proof verification ($\approx 200\text{k} - 400\text{k}$ L1 gas) |
| **Prover Computational Cost** | Minimal (Standard commodity CPU server running execution client) | Substantial (Massive GPU / FPGA / ASIC clusters computing complex polynomial proofs) |
| **L1 Withdrawal Latency** | 7-day delay required for challenge dispute window | Immediate upon proof verification ($\approx 15 \text{ min} - 2 \text{ hours}$) |
| **EVM Equivalence** | High (Direct fork of Geth / Erigon codebases) | Complex (Requires compiling EVM to ZK circuits: zkEVM Type 1-4) |
| **Data Compression Efficiency** | Moderate (Calldata / Blobs must contain signatures for validation)| Extreme (Signatures verified off-chain; only final state deltas posted to L1) |
