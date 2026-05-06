'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import DartThrow, { type ScoreInfo, DIFF } from '@/components/games/DartThrow';

// ── Match config per level ────────────────────────────────────────────────────

interface LevelConfig {
  rounds:     number;
  winsNeeded: number;
  cpuDiff:    1|2|3|4|5;
  tagline:    string;
}

const LEVEL_CFG: Record<1|2|3|4|5, LevelConfig> = {
  1: { rounds:3, winsNeeded:2, cpuDiff:1, tagline:'Beat a Rookie CPU to advance' },
  2: { rounds:3, winsNeeded:2, cpuDiff:1, tagline:'CPU fights back — best of 3' },
  3: { rounds:5, winsNeeded:3, cpuDiff:2, tagline:'CPU upgraded — best of 5' },
  4: { rounds:5, winsNeeded:3, cpuDiff:3, tagline:'Legend match — CPU is dangerous' },
  5: { rounds:7, winsNeeded:4, cpuDiff:4, tagline:'Final challenge — best of 7' },
};

const MAX_LEVEL = 5 as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type MatchPhase = 'player_turn' | 'cpu_turn' | 'round_result' | 'match_result';

interface Round { player: ScoreInfo; cpu: ScoreInfo; }

const ZONE_COLORS: Record<string, string> = {
  bullseye: '#58cc02', inner: '#ffc700', outer: '#f97316', miss: '#afafaf',
};

// ── Scoreboard ────────────────────────────────────────────────────────────────

function Scoreboard({
  phase, playerTotal, cpuTotal, playerWins, cpuWins, lcfg, roundNum,
}: {
  phase: MatchPhase; playerTotal: number; cpuTotal: number;
  playerWins: number; cpuWins: number; lcfg: LevelConfig; roundNum: number;
}) {
  const isPlayer = phase === 'player_turn';
  const isCpu    = phase === 'cpu_turn';

  return (
    <div className="rounded-2xl overflow-hidden border-2 border-cloud-gray shadow-[0_4px_0_#e5e5e5]">
      {/* Top bar — round info */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#f9f9f9] border-b border-cloud-gray">
        <span className="text-[10px] font-black uppercase tracking-widest text-graphite">
          Round {Math.min(roundNum, lcfg.rounds)} of {lcfg.rounds}
        </span>
        {/* Round pips — player left, CPU right */}
        <div className="flex items-center gap-1">
          {Array.from({ length: lcfg.rounds }).map((_, i) => {
            const pWon = i < playerWins;
            const cWon = i < cpuWins;
            return (
              <motion.div key={i}
                initial={false}
                animate={{ scale: pWon || cWon ? [1.3, 1] : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                className="w-3 h-3 rounded-full border-2 transition-all"
                style={{
                  background:  pWon ? '#58cc02' : cWon ? '#f97316' : 'transparent',
                  borderColor: pWon ? '#3f8f01' : cWon ? '#ea580c' : '#d1d5db',
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Score panels */}
      <div className="grid grid-cols-[1fr_auto_1fr]">
        {/* Player panel */}
        <motion.div
          animate={{ background: isPlayer ? '#f0fdf4' : '#ffffff' }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center gap-0.5 px-4 py-5"
        >
          <span className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: isPlayer ? '#3f8f01' : '#afafaf' }}>You</span>
          <motion.span
            key={playerTotal}
            initial={{ scale: 1.25, color: '#58cc02' }}
            animate={{ scale: 1,    color: isPlayer ? '#166534' : '#1a1a1a' }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="font-fredoka font-black text-5xl tabular-nums leading-none"
          >{playerTotal}</motion.span>
          {isPlayer && (
            <motion.span initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold text-duo-green mt-1">Your throw</motion.span>
          )}
        </motion.div>

        {/* Divider */}
        <div className="flex flex-col items-center justify-center gap-1 px-3 border-x border-cloud-gray">
          <span className="font-fredoka font-black text-xs text-silver">vs</span>
          <div className="flex gap-1">
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: isPlayer ? '#58cc02' : '#e5e5e5' }} />
            <div className="w-1.5 h-1.5 rounded-full"
              style={{ background: isCpu ? '#f97316' : '#e5e5e5' }} />
          </div>
        </div>

        {/* CPU panel */}
        <motion.div
          animate={{ background: isCpu ? '#fff7ed' : '#ffffff' }}
          transition={{ duration: 0.25 }}
          className="flex flex-col items-center justify-center gap-0.5 px-4 py-5"
        >
          <span className="text-[9px] font-black uppercase tracking-widest"
            style={{ color: isCpu ? '#ea580c' : '#afafaf' }}>CPU</span>
          <motion.span
            key={cpuTotal}
            initial={{ scale: 1.25, color: '#f97316' }}
            animate={{ scale: 1,    color: isCpu ? '#9a3412' : '#1a1a1a' }}
            transition={{ type: 'spring', stiffness: 380, damping: 22 }}
            className="font-fredoka font-black text-5xl tabular-nums leading-none"
          >{cpuTotal}</motion.span>
          {isCpu && (
            <motion.span initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }}
              className="text-[10px] font-bold text-[#f97316] mt-1">Throwing…</motion.span>
          )}
        </motion.div>
      </div>

      {/* Win-progress bar at the bottom of the scoreboard */}
      <div className="px-4 pb-3 pt-1 bg-white border-t border-cloud-gray">
        <div className="h-1.5 bg-cloud-gray rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full bg-duo-green"
            animate={{ width: `${(playerWins / lcfg.winsNeeded) * 100}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          />
        </div>
        <p className="text-[9px] font-bold text-silver mt-1 tabular-nums">
          {playerWins}/{lcfg.winsNeeded} rounds to win
        </p>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function GamesPage() {
  const [unlockedLevel, setUnlockedLevel] = useState<1|2|3|4|5>(1);
  const [activeLevel,   setActiveLevel]   = useState<1|2|3|4|5>(1);
  const [phase,         setPhase]         = useState<MatchPhase>('player_turn');
  const [rounds,        setRounds]        = useState<Round[]>([]);
  const [, setPendingPlayer] = useState<ScoreInfo|null>(null);
  const [gameKey,       setGameKey]       = useState(0);
  const [showLevelPick, setShowLevelPick] = useState(false);

  const lcfg        = LEVEL_CFG[activeLevel];
  const diffCfg     = DIFF[activeLevel];
  const playerWins  = rounds.filter(r => r.player.xp > r.cpu.xp).length;
  const cpuWins     = rounds.filter(r => r.cpu.xp > r.player.xp).length;
  const playerTotal = rounds.reduce((s, r) => s + r.player.xp, 0);
  const cpuTotal    = rounds.reduce((s, r) => s + r.cpu.xp, 0);
  const roundNum    = rounds.length + (phase === 'round_result' ? 0 : 1);

  const matchWon  = playerWins >= lcfg.winsNeeded;
  const matchLost = cpuWins    >= lcfg.winsNeeded;
  const matchOver = matchWon || matchLost || rounds.length >= lcfg.rounds;

  const onPlayerThrow = useCallback((score: ScoreInfo) => {
    setPendingPlayer(score);
    setPhase('cpu_turn');
    setGameKey(k => k + 1);
  }, []);

  const onCpuThrow = useCallback((score: ScoreInfo) => {
    setPendingPlayer(prev => {
      if (!prev) return null;
      const newRounds = [...rounds, { player: prev, cpu: score }];
      setRounds(newRounds);
      const pW = newRounds.filter(r => r.player.xp > r.cpu.xp).length;
      const cW = newRounds.filter(r => r.cpu.xp    > r.player.xp).length;
      const over = pW >= lcfg.winsNeeded || cW >= lcfg.winsNeeded || newRounds.length >= lcfg.rounds;
      setPhase(over ? 'match_result' : 'round_result');
      if (over && pW >= lcfg.winsNeeded && activeLevel < MAX_LEVEL) {
        setUnlockedLevel(u => Math.max(u, (activeLevel + 1) as 1|2|3|4|5) as 1|2|3|4|5);
      }
      if (!over) {
        setTimeout(() => { setPhase('player_turn'); setGameKey(k => k + 1); }, 1800);
      }
      return null;
    });
  }, [rounds, lcfg, activeLevel]);

  const restartMatch = useCallback(() => {
    setRounds([]); setPendingPlayer(null);
    setPhase('player_turn'); setGameKey(k => k + 1);
  }, []);

  const goToLevel = useCallback((level: 1|2|3|4|5) => {
    setActiveLevel(level); setRounds([]); setPendingPlayer(null);
    setPhase('player_turn'); setGameKey(k => k + 1); setShowLevelPick(false);
  }, []);

  const isPlayerTurn = phase === 'player_turn';
  const isCpuTurn    = phase === 'cpu_turn';

  return (
    <div className="max-w-lg mx-auto py-8 px-4 space-y-4">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-silver mb-1">Game lab</p>
          <h1 className="font-fredoka font-black text-4xl leading-none tracking-tight text-almost-black">
            Dart <span className="text-duo-green">Duel</span>
          </h1>
        </div>
        <button onClick={() => setShowLevelPick(v => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all active:scale-95"
          style={{ background: '#f0fdf4', border: '2px solid #bbf7d0', boxShadow: '0 3px 0 #3f8f01' }}
        >
          <div className="w-2 h-2 rounded-full bg-duo-green flex-shrink-0" />
          <div className="text-left">
            <p className="font-fredoka font-black text-sm leading-none text-[#166534]">{diffCfg.name}</p>
            <p className="text-[9px] font-black uppercase tracking-widest text-graphite">Level {activeLevel}</p>
          </div>
        </button>
      </div>

      {/* ── Level picker ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showLevelPick && (
          <motion.div
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white border-2 border-cloud-gray rounded-xl shadow-[0_4px_0_#e5e5e5] p-2 flex gap-1">
              {([1,2,3,4,5] as const).map(l => {
                const locked = l > unlockedLevel;
                const active = l === activeLevel;
                return (
                  <button key={l} disabled={locked} onClick={() => goToLevel(l)}
                    className="flex-1 flex flex-col items-center py-3 rounded-lg transition-all"
                    style={{
                      background: active ? '#f0fdf4' : 'transparent',
                      border: active ? '2px solid #bbf7d0' : '2px solid transparent',
                      opacity: locked ? 0.35 : 1,
                    }}>
                    <span className="font-fredoka font-black text-xs" style={{ color: active ? '#166534' : '#1a1a1a' }}>
                      {DIFF[l].name}
                    </span>
                    <span className="text-[9px] text-silver">{locked ? 'Locked' : `Lvl ${l}`}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Scoreboard ──────────────────────────────────────────────────── */}
      <Scoreboard
        phase={phase} playerTotal={playerTotal} cpuTotal={cpuTotal}
        playerWins={playerWins} cpuWins={cpuWins} lcfg={lcfg} roundNum={roundNum}
      />

      {/* ── Game canvas ─────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!matchOver && (
          <motion.div key="canvas"
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          >
            {/* Turn pill */}
            <AnimatePresence mode="wait">
              <motion.div key={phase}
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 6 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2 mb-2 px-1"
              >
                <motion.div
                  animate={{ scale: isPlayerTurn ? [1, 1.4, 1] : 1 }}
                  transition={{ repeat: isPlayerTurn ? Infinity : 0, repeatDelay: 1.5, duration: 0.4 }}
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: isPlayerTurn ? '#58cc02' : isCpuTurn ? '#f97316' : '#afafaf' }}
                />
                <p className="text-sm font-fredoka font-bold"
                  style={{ color: isPlayerTurn ? '#166534' : isCpuTurn ? '#9a3412' : '#afafaf' }}>
                  {isPlayerTurn ? 'Your turn — grab and flick' : isCpuTurn ? 'CPU is throwing…' : 'Next round coming up'}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="rounded-2xl overflow-hidden shadow-[0_4px_0_#e5e5e5] border-2 border-cloud-gray">
              {isPlayerTurn && (
                <DartThrow key={`player-${gameKey}`} difficulty={activeLevel} onResult={onPlayerThrow} />
              )}
              {isCpuTurn && (
                <DartThrow key={`cpu-${gameKey}`} difficulty={lcfg.cpuDiff} onResult={onCpuThrow} autoThrow autoThrowDelay={800} />
              )}
              {phase === 'round_result' && rounds.length > 0 && (() => {
                const last = rounds[rounds.length - 1];
                const won = last.player.xp > last.cpu.xp;
                const tied = last.player.xp === last.cpu.xp;
                return (
                  <div className="flex items-center justify-center gap-8 py-14 bg-white">
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-silver">You</span>
                      <span className="font-fredoka font-black text-5xl tabular-nums"
                        style={{ color: ZONE_COLORS[last.player.result] }}>{last.player.xp}</span>
                      <span className="text-xs font-bold text-graphite">{last.player.label}</span>
                    </div>
                    <motion.div
                      initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 18, delay: 0.1 }}
                      className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl"
                      style={{
                        background: tied ? '#f9f9f9' : won ? '#f0fdf4' : '#fff7ed',
                        border: `2px solid ${tied ? '#e5e5e5' : won ? '#bbf7d0' : '#fed7aa'}`,
                      }}
                    >
                      <span className="font-fredoka font-black text-base"
                        style={{ color: tied ? '#afafaf' : won ? '#166534' : '#9a3412' }}>
                        {tied ? 'Draw' : won ? 'You won' : 'CPU won'}
                      </span>
                    </motion.div>
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-[9px] font-black uppercase tracking-widest text-silver">CPU</span>
                      <span className="font-fredoka font-black text-5xl tabular-nums"
                        style={{ color: ZONE_COLORS[last.cpu.result] }}>{last.cpu.xp}</span>
                      <span className="text-xs font-bold text-graphite">{last.cpu.label}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Match result ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {matchOver && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="rounded-2xl overflow-hidden border-2"
            style={{
              borderColor: matchWon ? '#bbf7d0' : '#fed7aa',
              boxShadow: `0 4px 0 ${matchWon ? '#3f8f01' : '#f97316'}`,
            }}
          >
            {/* Result header */}
            <div className="px-6 py-5 text-center"
              style={{ background: matchWon ? '#f0fdf4' : '#fff7ed' }}>
              <p className="font-fredoka font-black text-4xl leading-tight"
                style={{ color: matchWon ? '#166534' : '#9a3412' }}>
                {matchWon ? 'You won!' : 'CPU wins'}
              </p>
              <p className="text-sm font-bold mt-1"
                style={{ color: matchWon ? '#14532d' : '#7c2d12' }}>
                {matchWon
                  ? activeLevel < MAX_LEVEL ? `Level ${activeLevel + 1} unlocked` : 'Master level complete!'
                  : 'Try again to advance'}
              </p>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-2 divide-x divide-cloud-gray bg-white">
              <div className="flex flex-col items-center py-5 gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-silver">You</span>
                <span className="font-fredoka font-black text-4xl tabular-nums text-almost-black">{playerTotal}</span>
                <span className="text-[9px] font-bold text-silver tabular-nums">{playerWins} rounds won</span>
              </div>
              <div className="flex flex-col items-center py-5 gap-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-silver">CPU</span>
                <span className="font-fredoka font-black text-4xl tabular-nums text-almost-black">{cpuTotal}</span>
                <span className="text-[9px] font-bold text-silver tabular-nums">{cpuWins} rounds won</span>
              </div>
            </div>

            {/* Pip recap + CTA */}
            <div className="px-6 py-4 flex flex-col items-center gap-4 bg-white border-t border-cloud-gray">
              <div className="flex items-center gap-1.5">
                {rounds.map((r, i) => {
                  const pW = r.player.xp > r.cpu.xp;
                  const cW = r.cpu.xp > r.player.xp;
                  return (
                    <div key={i} className="w-3.5 h-3.5 rounded-full border-2"
                      style={{
                        background:  pW ? '#58cc02' : cW ? '#f97316' : '#e5e5e5',
                        borderColor: pW ? '#3f8f01' : cW ? '#ea580c' : '#d1d5db',
                      }} />
                  );
                })}
              </div>

              <div className="flex gap-3 w-full">
                <button onClick={restartMatch}
                  className="flex-1 py-3 rounded-xl font-fredoka font-black text-sm text-almost-black transition-all active:translate-y-0.5"
                  style={{ background: 'white', border: '2px solid #e5e5e5', boxShadow: '0 3px 0 #d1d5db' }}>
                  Rematch
                </button>
                {matchWon && activeLevel < MAX_LEVEL && (
                  <button onClick={() => goToLevel((activeLevel + 1) as 1|2|3|4|5)}
                    className="flex-1 py-3 rounded-xl font-fredoka font-black text-sm text-white transition-all active:translate-y-0.5"
                    style={{ background: '#58cc02', border: '2px solid #bbf7d0', boxShadow: '0 3px 0 #3f8f01' }}>
                    Next level →
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tagline ─────────────────────────────────────────────────────── */}
      {!matchOver && (
        <p className="text-[9px] font-bold text-silver px-1">{lcfg.tagline}</p>
      )}

    </div>
  );
}
