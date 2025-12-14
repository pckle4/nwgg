
import { Player, MatchState, BatsmanStats, BowlerStats, PitchType } from "../types";

const generateTarget = (isSuperOver: boolean): number => {
  if (isSuperOver) return Math.floor(Math.random() * 8) + 12; 
  // Target: 175 - 215 (Balanced)
  return Math.floor(Math.random() * 41) + 175;
};

const getRandomPitch = (): PitchType => {
  const rand = Math.random();
  if (rand < 0.33) return 'FLAT'; 
  if (rand < 0.66) return 'GREEN'; 
  return 'DUSTY'; 
};

export const initializeMatch = (
  battingTeamPlayers: Player[],
  bowlingTeamPlayers: Player[],
  totalOvers: number,
  isSuperOver: boolean = false
): MatchState => {
  const battingOrder = battingTeamPlayers.map(p => p.id);
  
  // Ensure we have at least 5 bowling options
  let bowlers = bowlingTeamPlayers
    .filter(p => p.role === 'Bowler' || p.role === 'All-rounder')
    .map(p => p.id);

  if (bowlers.length < 5) {
      const others = bowlingTeamPlayers.filter(p => !bowlers.includes(p.id)).map(p=>p.id);
      bowlers = [...bowlers, ...others].slice(0, 5);
  } else {
      bowlers = bowlers.slice(0, 6); // Take top 6 options
  }
  
  // Shuffle slightly but keep main bowlers prioritized
  bowlers = bowlers.sort(() => Math.random() - 0.3);

  const initialBatsmanStats: Record<string, BatsmanStats> = {};
  battingOrder.forEach(id => {
    initialBatsmanStats[id] = { runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
  });

  const initialBowlerStats: Record<string, BowlerStats> = {};
  bowlingTeamPlayers.forEach(p => {
    initialBowlerStats[p.id] = { overs: 0, runsConceded: 0, wickets: 0, maidens: 0 };
  });

  const pitch = getRandomPitch();
  const pitchDesc = pitch === 'FLAT' ? "Batting paradise!" : pitch === 'GREEN' ? "Something in it for the bowlers." : "Spinners might enjoy this.";

  return {
    target: generateTarget(isSuperOver),
    totalOvers,
    currentScore: 0,
    wickets: 0,
    ballsBowled: 0,
    ballHistory: [],
    batsmen: {
      strikerId: battingOrder[0],
      nonStrikerId: battingOrder[1],
      stats: initialBatsmanStats
    },
    bowler: {
      currentBowlerId: bowlers[0],
      stats: initialBowlerStats
    },
    partnership: {
      runs: 0,
      balls: 0
    },
    recentActions: [],
    consecutiveActionStats: {
        lastAction: null,
        count: 0
    },
    battingOrder,
    bowlingOrder: bowlers,
    status: 'SCHEDULED',
    commentary: isSuperOver ? "SUPER OVER! Every ball counts." : `Pitch Report: ${pitchDesc} Chase ${generateTarget(isSuperOver) > 0 ? '' : 'Target Set.'}`,
    lastBallOutcome: null,
    isSuperOver,
    pitchType: pitch,
    isFreeHit: false,
    matchEvents: {
        bigOvers: 0,
        collapseOvers: 0,
        lastBoundaryBall: -10
    }
  };
};

export const calculatePOTM = (state: MatchState, allPlayers: Player[]): { playerId: string, points: number, reason: string } | undefined => {
    let bestPlayerId = '';
    let maxPoints = -1;
    let reason = '';

    allPlayers.forEach(p => {
        let points = 0;
        let reasons: string[] = [];
        const batStats = state.batsmen.stats[p.id];
        if (batStats) {
            points += batStats.runs;
            points += batStats.fours * 2; 
            points += batStats.sixes * 4;
            if (batStats.runs >= 50) points += 40;
            if (batStats.runs > 40) reasons.push(`${batStats.runs} runs`);
        }
        const bowlStats = state.bowler.stats[p.id];
        if (bowlStats) {
            points += bowlStats.wickets * 40;
            if (bowlStats.wickets > 0) reasons.push(`${bowlStats.wickets} wickets`);
        }
        if (points > maxPoints) {
            maxPoints = points;
            bestPlayerId = p.id;
            reason = reasons.join(' & ');
        }
    });
    return bestPlayerId ? { playerId: bestPlayerId, points: maxPoints, reason: reason || 'Impact Player' } : undefined;
};

// --- SOPHISTICATED GAME ENGINE ---

export const playBall = (
  state: MatchState,
  action: 'safe' | 'hard',
  striker: Player,
  bowler: Player
): MatchState => {
  if (state.status !== 'IN_PROGRESS') return state;

  const newState = { ...state };
  let commentary = "";
  let ballDisplay = "";
  let detailDisplay = "";

  // 1. ANALYZE CONTEXT
  const ballsBowled = state.ballsBowled;
  const overs = Math.floor(ballsBowled / 6);
  const ballsInOver = ballsBowled % 6;
  const runsNeeded = Math.max(0, state.target - state.currentScore);
  const ballsRemaining = (state.totalOvers * 6) - ballsBowled;
  const rrr = ballsRemaining > 0 ? (runsNeeded / (ballsRemaining / 6)) : 99;
  
  const strikerStats = state.batsmen.stats[striker.id];
  
  const isDeathOvers = ballsBowled >= 90;
  
  // 2. BASE WEIGHTS (Dynamic Randomization)
  const noise = () => 0.9 + Math.random() * 0.2;
  
  // Initialize weights
  let weights: Record<string, number> = { 
      '0': 0, '1': 0, '2': 0, '3': 0, '4': 0, '6': 0, 'W': 0 
  };

  if (action === 'safe') {
      // SAFE MODE: 0, 1, 2, 3 Only. No 4, 6, W.
      weights['0'] = 35 * noise(); // Increased pressure (dots)
      weights['1'] = 42 * noise();
      weights['2'] = 13 * noise();
      weights['3'] = 10 * noise(); // Increased chance of 3s
      // Enforce 0
      weights['4'] = 0;
      weights['6'] = 0;
      weights['W'] = 0;
  } else {
      // HARD MODE: 0, 4, 6, W Only. No 1, 2, 3.
      weights['0'] = 32 * noise(); // Increased Swing and miss
      weights['4'] = 38 * noise(); // Increased boundaries (4s)
      weights['6'] = 12 * noise(); // Reduced sixes
      weights['W'] = 18 * noise(); // Reduced wickets (High Risk)
      // Enforce 0
      weights['1'] = 0;
      weights['2'] = 0;
      weights['3'] = 0;
  }

  // 3. ACTION MODIFIERS & GAME LOGIC
  
  // Rule 1: Anti-Spam (Probabilistic)
  const history = [...newState.recentActions, action];
  if (history.length > 5) history.shift();
  newState.recentActions = history;
  
  const isSpamming = history.length >= 3 && history.slice(-3).every(a => a === action);
  // Only penalize 50% of the time to keep user guessing
  if (isSpamming && Math.random() > 0.5) {
      if (action === 'hard') {
          weights['W'] += 35; // Significant increase in wicket risk
          commentary = "Bowler predicted the slog!";
      } else {
          weights['0'] += 40; // Significant increase in dot balls
          commentary = "Field tightens, no gaps found.";
      }
  }

  // Rule 2: Heat Check (Prevent continuous boundaries in Hard mode)
  if (action === 'hard') {
    const ballsSinceBoundary = ballsBowled - state.matchEvents.lastBoundaryBall;
    if (ballsSinceBoundary === 1) {
        weights['W'] += 15; // Risk of getting out after a boundary
        weights['0'] += 10;
        weights['6'] -= 5;
    }
  }

  // Rule 3: Collapse Guard (Mercy Rule)
  // Only applies if user is doing terribly, reduces Wicket chance in Hard mode
  const earlyCollapse = state.wickets >= 5 && overs < 8;
  if (earlyCollapse && action === 'hard') {
      weights['W'] *= 0.3; // Reduce wicket chance to extend game
      weights['0'] += 20;  // More dots instead of wickets
  }

  // Rule 4: Skill Gap
  const skillDiff = striker.battingSkill - bowler.bowlingSkill;
  if (action === 'hard') {
      if (skillDiff > 20) { weights['4'] += 10; weights['6'] += 10; }
      else if (skillDiff < -20) { weights['W'] += 15; weights['0'] += 10; }
  } else {
      // Safe mode skill impact
      if (skillDiff > 20) { weights['1'] += 15; weights['2'] += 10; }
      else if (skillDiff < -20) { weights['0'] += 20; }
  }

  // Rule 5: Death Overs
  if (isDeathOvers && action === 'hard') {
      weights['6'] += 15;
      weights['W'] += 10; // Carnage
  }

  // --- STRICT ENFORCEMENT ---
  // Ensure strict mode rules are not violated by modifiers
  if (action === 'safe') {
      weights['4'] = 0;
      weights['6'] = 0;
      weights['W'] = 0;
  } else {
      weights['1'] = 0;
      weights['2'] = 0;
      weights['3'] = 0;
  }

  // 5. RESOLVE OUTCOME
  Object.keys(weights).forEach(k => { if (weights[k] < 0) weights[k] = 0; });
  const outcomes = ['0', '1', '2', '3', '4', '6', 'W'];
  let totalWeight = outcomes.reduce((sum, k) => sum + weights[k], 0);
  if (totalWeight <= 0) { totalWeight = 1; weights['0'] = 1; }

  let randomVal = Math.random() * totalWeight;
  let outcome = '0';
  for (const o of outcomes) {
    randomVal -= weights[o];
    if (randomVal <= 0) { outcome = o; break; }
  }

  // 6. POST-PROCESSING (Drama)
  let isOut = false;
  let runs = 0;

  newState.ballsBowled += 1;

  // Lucky Edge: 0 -> 4 (Only valid in Hard Mode)
  if (outcome === '0' && action === 'hard' && Math.random() < 0.05) {
      outcome = '4';
      detailDisplay = 'Edge';
      commentary = "Thick edge... flies past slip for FOUR! Lucky.";
  }

  // Great Catch: 6 -> W (Only valid in Hard Mode)
  if (outcome === '6' && Math.random() < 0.03) {
      outcome = 'W';
      detailDisplay = 'Stunner';
      commentary = "He's hit that well but... CAUGHT! Absolute blinder on the ropes!";
  }

  // DRS Save: W -> 0 (Only valid in Hard Mode)
  if (outcome === 'W' && Math.random() < 0.08) {
      outcome = '0';
      detailDisplay = 'DRS';
      commentary = "Given OUT! Review taken... Missing leg! NOT OUT.";
  }

  if (outcome === 'W') {
      isOut = true;
      ballDisplay = 'W';
      const wComms = ["Clean Bowled!", "Caught at cover!", "Edged to the keeper!", "Holes out to long on!", "Trapped LBW!"];
      if (!commentary) commentary = wComms[Math.floor(Math.random() * wComms.length)];
  } else {
      runs = parseInt(outcome);
      ballDisplay = runs.toString();
      
      if (runs === 4 || runs === 6) {
          newState.matchEvents.lastBoundaryBall = newState.ballsBowled;
      }

      if (!commentary) {
        if (runs === 6) commentary = "That's huge! Out of the ground!";
        else if (runs === 4) commentary = "Classy shot, finds the gap for four.";
        else if (runs === 1) commentary = "Quick single taken.";
        else if (runs === 2) commentary = "Good running, they come back for two.";
        else if (runs === 3) commentary = "Great placement! They push hard for three.";
        else if (runs === 0) commentary = action === 'hard' ? "Swing and a miss!" : "Solid defense.";
      }
  }

  // --- 7. STATE UPDATES ---
  newState.currentScore += runs;
  newState.ballHistory.push(ballDisplay);
  newState.lastBallOutcome = ballDisplay;
  newState.lastBallDetail = detailDisplay;
  newState.commentary = commentary;

  // Update Stats
  const sStats = newState.batsmen.stats[newState.batsmen.strikerId];
  sStats.runs += runs;
  sStats.balls += 1;
  if (runs === 4) sStats.fours += 1;
  if (runs === 6) sStats.sixes += 1;

  const bStats = newState.bowler.stats[newState.bowler.currentBowlerId];
  bStats.runsConceded += runs;

  let rotateBowlerNow = false;

  if (isOut) {
      sStats.out = true;
      newState.wickets += 1;
      bStats.wickets += 1;
      
      // Force rotation if bowler hits 5 wickets
      if (bStats.wickets >= 5) rotateBowlerNow = true;

      // Rotate Strike on wicket
      const currentBatters = [newState.batsmen.strikerId, newState.batsmen.nonStrikerId];
      const nextBatterId = newState.battingOrder.find(id => {
         const pStat = newState.batsmen.stats[id];
         return !pStat.out && !currentBatters.includes(id); 
      });
      
      if (nextBatterId && newState.wickets < 10) {
         newState.batsmen.strikerId = nextBatterId;
         newState.partnership = { runs: 0, balls: 0 };
      }
  } else {
      bStats.overs += 1; // 1 Ball bowled
      newState.partnership.runs += runs;
      newState.partnership.balls += 1;
      
      if (runs % 2 !== 0) {
          const temp = newState.batsmen.strikerId;
          newState.batsmen.strikerId = newState.batsmen.nonStrikerId;
          newState.batsmen.nonStrikerId = temp;
      }
  }

  // End of Over Processing or Forced Rotation
  const isEndOfOver = newState.ballsBowled % 6 === 0 && newState.ballsBowled > 0;
  
  if (isEndOfOver || rotateBowlerNow) {
      // Check for Big Over / Collapse Over (Only at true end of over)
      if (isEndOfOver) {
        const last6 = newState.ballHistory.slice(-6);
        const overRuns = last6.reduce((a,b) => a + (parseInt(b)||0), 0);
        const overWickets = last6.filter(b => b === 'W').length;
        if (overRuns >= 20) newState.matchEvents.bigOvers += 1;
        if (overWickets >= 2) newState.matchEvents.collapseOvers += 1;

        // Rotate Strike at end of over
        const temp = newState.batsmen.strikerId;
        newState.batsmen.strikerId = newState.batsmen.nonStrikerId;
        newState.batsmen.nonStrikerId = temp;
      }

      // Rotate Bowler Logic
      const currentBowlerId = newState.bowler.currentBowlerId;
      
      // Find next eligible bowler:
      // 1. Not current bowler (unless only 1 bowler exists, unlikely)
      // 2. Has bowled < 24 balls (4 overs) - Standard T20 rule
      // 3. Has < 5 wickets - User specific rule
      const eligibleBowlers = newState.bowlingOrder.filter(id => {
          const stats = newState.bowler.stats[id];
          const isCurrent = id === currentBowlerId;
          // In T20, max 4 overs (24 balls).
          const quotaExhausted = stats.overs >= 24;
          const wicketLimitReached = stats.wickets >= 5;
          
          if (isCurrent) return false; // Don't bowl 2 overs in a row
          return !quotaExhausted && !wicketLimitReached;
      });

      if (eligibleBowlers.length > 0) {
          // Pick the next one in the list order to maintain rotation
          const currentIdx = newState.bowlingOrder.indexOf(currentBowlerId);
          // Find first eligible bowler appearing AFTER current index
          let nextBowler = eligibleBowlers.find(id => newState.bowlingOrder.indexOf(id) > currentIdx);
          // If none, wrap around to start
          if (!nextBowler) nextBowler = eligibleBowlers[0];
          
          newState.bowler.currentBowlerId = nextBowler;
      } else {
          // Fallback if everyone is exhausted (shouldn't happen in normal flow)
          // Just rotate to next valid person even if they bowled previous over, to prevent crash
          const fallback = newState.bowlingOrder.find(id => id !== currentBowlerId && newState.bowler.stats[id].overs < 24);
          if (fallback) newState.bowler.currentBowlerId = fallback;
      }
  }

  // Game End Status
  if (newState.currentScore >= newState.target) {
    newState.status = 'WON';
    newState.commentary = "CHASE COMPLETE! A fantastic victory!";
  } else if (newState.wickets >= 10 || newState.ballsBowled >= newState.totalOvers * 6) {
    if (newState.currentScore === newState.target - 1) newState.status = 'TIED';
    else newState.status = 'LOST';
  }

  return newState;
};
