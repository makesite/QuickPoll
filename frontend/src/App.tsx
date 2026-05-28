import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useReadContract } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { arcTestnet } from "./wagmi";

const ADDR = (import.meta.env.VITE_CONTRACT_ADDRESS as `0x${string}`) || "0x0000000000000000000000000000000000000000";
const ABI = [
  { name: "createPoll", type: "function", stateMutability: "nonpayable", inputs: [{ name: "question", type: "string" }, { name: "options", type: "string[]" }], outputs: [{ type: "uint256" }] },
  { name: "vote", type: "function", stateMutability: "nonpayable", inputs: [{ name: "pollId", type: "uint256" }, { name: "optionIndex", type: "uint256" }], outputs: [] },
  { name: "getPoll", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ name: "creator", type: "address" }, { name: "question", type: "string" }, { name: "options", type: "string[]" }, { name: "votes", type: "uint256[]" }, { name: "createdAt", type: "uint256" }] },
  { name: "total", type: "function", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { name: "hasVoted", type: "function", stateMutability: "view", inputs: [{ name: "", type: "uint256" }, { name: "", type: "address" }], outputs: [{ type: "bool" }] },
] as const;

const AC = "#f59e0b";

export default function App() {
  const { isConnected, address } = useAccount();
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["Yes", "No"]);
  const [viewId, setViewId] = useState("");
  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  const { data: total } = useReadContract({ address: ADDR, abi: ABI, functionName: "total", query: { refetchInterval: 8000 } });
  const { data: pollData } = useReadContract({ address: ADDR, abi: ABI, functionName: "getPoll", args: [BigInt(viewId || "0")], query: { enabled: viewId !== "" && !isNaN(+viewId) } });
  const { data: voted } = useReadContract({ address: ADDR, abi: ABI, functionName: "hasVoted", args: [BigInt(viewId || "0"), address!], query: { enabled: !!address && viewId !== "" && !isNaN(+viewId) } });

  const { data: hash, isPending, writeContract, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });
  if (isSuccess && !done) { setDone("ok"); setTimeout(() => setDone(null), 3000); }
  const isLoading = isPending || isConfirming;

  const p = pollData as any;
  const totalVotes = p ? p[3].reduce((a: bigint, b: bigint) => a + b, 0n) : 0n;

  return (
    <div className="min-h-screen bg-[#080b14]">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-80px] left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[100px]" style={{ background: `${AC}15` }} />
      </div>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 sticky top-0 z-50 bg-[#080b14]/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📊</span>
          <span className="font-bold text-white text-lg">Quick<span style={{ color: AC }}>Poll</span></span>
          <span className="hidden sm:block text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">Arc Testnet</span>
        </div>
        <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
      </header>
      <main className="relative z-10 max-w-lg mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📊</div>
          <h1 className="text-3xl font-black text-white mb-2">On-chain <span style={{ color: AC }}>Polls</span></h1>
          <p className="text-slate-400 text-sm">Create polls and vote — open, permissionless, permanent on Arc.</p>
          <div className="mt-3 inline-flex items-center gap-2 bg-slate-800/60 px-4 py-2 rounded-full border border-slate-700">
            <span className="text-slate-400 text-sm">{total ? Number(total) : 0} polls created</span>
          </div>
        </div>
        <div className="space-y-4">
          {!isConnected ? (
            <div className="text-center py-8 text-slate-500">Connect wallet to create or vote</div>
          ) : !creating ? (
            <button onClick={() => setCreating(true)} className="w-full py-3 rounded-xl font-bold text-sm text-black" style={{ background: AC }}>+ Create Poll</button>
          ) : (
            <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
              <h2 className="font-bold text-white mb-4">📊 New Poll</h2>
              <div className="space-y-3 mb-4">
                <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="Your question..." className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/60" />
                {options.map((opt, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={opt} onChange={e => { const o = [...options]; o[i] = e.target.value; setOptions(o); }} placeholder={`Option ${i + 1}`} className="flex-1 bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/60" />
                    {options.length > 2 && <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="text-red-400 px-2 text-sm">✕</button>}
                  </div>
                ))}
                {options.length < 8 && <button onClick={() => setOptions([...options, ""])} className="text-amber-400 text-sm hover:text-amber-300">+ Add option</button>}
              </div>
              {done === "ok" ? (
                <div className="py-3 text-center rounded-xl font-bold text-sm" style={{ background: `${AC}20`, color: AC }}>📊 Poll created!</div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setCreating(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-slate-400 bg-slate-800">Cancel</button>
                  <button onClick={() => writeContract({ address: ADDR, abi: ABI, functionName: "createPoll", args: [question, options.filter(o => o.trim())] })}
                    disabled={isLoading || !question || options.filter(o => o.trim()).length < 2}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-black disabled:opacity-50" style={{ background: AC }}>
                    {isLoading ? (isPending ? "Confirm..." : "Creating...") : "Create"}
                  </button>
                </div>
              )}
              {error && <p className="mt-2 text-red-400 text-xs text-center">{error.message?.includes("User rejected") ? "Cancelled" : error.message?.slice(0, 80)}</p>}
            </div>
          )}
          <div className="bg-slate-900/60 border border-white/10 rounded-2xl p-5">
            <h2 className="font-bold text-white mb-3">🗳 Vote on a Poll</h2>
            <input type="number" value={viewId} onChange={e => setViewId(e.target.value)} placeholder={`Poll ID (0 – ${total ? Number(total) - 1 : 0})`}
              className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-amber-500/60 mb-3" />
            {p && (
              <div>
                <p className="text-white font-bold text-sm mb-3">{p[1]}</p>
                <div className="space-y-2">
                  {p[2].map((opt: string, i: number) => {
                    const pct = totalVotes > 0n ? Number((p[3][i] * 100n) / totalVotes) : 0;
                    return (
                      <button key={i} onClick={() => !voted && writeContract({ address: ADDR, abi: ABI, functionName: "vote", args: [BigInt(viewId), BigInt(i)] })}
                        disabled={!!voted || isLoading} className="w-full text-left rounded-xl p-3 border border-slate-700 bg-slate-800/40 disabled:cursor-default relative overflow-hidden hover:border-amber-500/40 transition-colors">
                        <div className="absolute inset-y-0 left-0 rounded-xl transition-all" style={{ width: `${pct}%`, background: `${AC}25` }} />
                        <div className="relative flex justify-between items-center">
                          <span className="text-white text-sm">{opt}</span>
                          <span className="text-slate-400 text-xs">{p[3][i].toString()} votes ({pct}%)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {voted && <p className="mt-2 text-xs text-slate-500 text-center">You already voted</p>}
              </div>
            )}
          </div>
        </div>
        <footer className="mt-10 text-center text-xs text-slate-600">
          <p>QuickPoll · <a href={`https://testnet.arcscan.app/address/${ADDR}`} target="_blank" rel="noreferrer" className="hover:text-slate-400">{ADDR.slice(0,6)}...{ADDR.slice(-4)}</a> · Chain {arcTestnet.id}</p>
        </footer>
      </main>
    </div>
  );
}