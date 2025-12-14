
export interface Player {
  id: string;
  name: string;
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicketkeeper';
  battingSkill: number; // 0-100
  bowlingSkill: number; // 0-100
  isCaptain?: boolean;
}

export interface Team {
  id: string;
  name: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
  players: Player[];
}

export type PitchType = 'FLAT' | 'GREEN' | 'DUSTY';

export interface MatchState {
  target: number;
  totalOvers: number;
  currentScore: number;
  wickets: number;
  ballsBowled: number; // Total legal balls bowled
  ballHistory: string[]; // List of all outcomes for display scrolling
  batsmen: {
    strikerId: string;
    nonStrikerId: string;
    stats: Record<string, BatsmanStats>; // playerId -> stats
  };
  bowler: {
    currentBowlerId: string;
    stats: Record<string, BowlerStats>;
  };
  partnership: {
    runs: number;
    balls: number;
  };
  // History logs for pattern detection
  recentActions: ('safe' | 'hard')[];
  consecutiveActionStats: {
    lastAction: 'safe' | 'hard' | null;
    count: number;
  };
  battingOrder: string[]; // Array of player IDs
  bowlingOrder: string[]; // Array of player IDs
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'WON' | 'LOST' | 'TIED';
  commentary: string;
  lastBallOutcome: string | null; // For display animation
  lastBallDetail?: string; // e.g. "Wide", "No Ball", "DRS Saved"
  isSuperOver: boolean;
  
  // New Features
  pitchType: PitchType;
  isFreeHit: boolean;
  playerOfTheMatch?: {
    playerId: string;
    points: number;
    reason: string;
  };
  // New logic tracking
  matchEvents: {
    bigOvers: number;      // Count of overs with 20+ runs
    collapseOvers: number; // Count of overs with 2+ wickets
    lastBoundaryBall: number; // Ball index of last 4/6
  };
}

export interface BatsmanStats {
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
}

export interface BowlerStats {
  overs: number; // e.g. 1.2 is 1 over 2 balls. Represented as balls in logic, converted for display
  runsConceded: number;
  wickets: number;
  maidens: number;
}

export interface TeamOption {
  name: string;
  short: string;
  color: string;
}
