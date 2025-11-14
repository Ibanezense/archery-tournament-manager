
export interface Team {
  id: number;
  name: string;
  color?: string;
  members?: string[]; // Nombres de los integrantes del equipo
}

export type ArrowValue = 'X' | 10 | 9 | 8 | 7 | 6 | 5 | 'M';

export interface SetScore {
  teamA_arrows: ArrowValue[];
  teamB_arrows: ArrowValue[];
  teamA_set_total: number;
  teamB_set_total: number;
  teamA_x10s: number;
  teamB_x10s: number;
  teamA_set_points: number;
  teamB_set_points: number;
}

export interface Match {
  id: number;
  teamA_id: number;
  teamB_id: number;
  sets: SetScore[];
  isShootOff?: boolean;
  shootOffScore?: { teamA_winner: 0 | 1; teamB_winner: 0 | 1; teamA_arrow_score?: string; teamB_arrow_score?: string };
  completed: boolean;
  winner_id?: number | null;
  teamA_set_points_total: number;
  teamB_set_points_total: number;
  teamA_arrow_score_total: number;
  teamB_arrow_score_total: number;
  teamA_x10s_total: number;
  teamB_x10s_total: number;
  stage: 'group' | 'semifinal' | 'bronze' | 'gold';
  label?: string;
  editHistory?: EditHistoryEntry[];
}

export interface EditHistoryEntry {
  timestamp: string;
  action: 'set_added' | 'set_edited' | 'set_deleted' | 'match_completed';
  setIndex?: number;
  details?: string;
}

export type TournamentStage = 'setup' | 'group' | 'playoffs' | 'finished';

export interface TournamentState {
  id?: string;
  name?: string;
  date?: string;
  stage: TournamentStage;
  teams: Team[];
  groupMatches: Match[];
  playoffMatches: Match[];
  adminPassword?: string;
  registeredTeams?: Team[];
}

export interface TournamentMetadata {
  id: string;
  name: string;
  date: string;
  teamsCount: number;
  stage: 'group' | 'playoffs' | 'finished';
}

export interface RankingData {
  teamId: number;
  teamName: string;
  matchesPlayed: number;
  wins: number;
  matchPoints: number;
  totalArrowScore: number;
  totalX10s: number;
  totalArrowsShot: number;
  arrowAverage: number;
}