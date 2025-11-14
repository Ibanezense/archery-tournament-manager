
import React, { memo, useMemo } from 'react';
import type { TournamentState, RankingData, Match } from '../types';
import MatchList from './MatchList';
import RankingTable from './RankingTable';

interface DashboardProps {
    tournamentState: TournamentState;
    rankingData: RankingData[];
    onOpenScoresheet: (match: Match, isEditing?: boolean) => void;
    onContinueMatch: (match: Match) => void;
    onShowQrCode: (match: Match) => void;
    onGenerateFinals: () => void;
    isAdmin: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ tournamentState, rankingData, onOpenScoresheet, onContinueMatch, onShowQrCode, onGenerateFinals, isAdmin }) => {
    const allMatchesCompleted = useMemo(
        () => tournamentState.groupMatches.every(m => m.completed),
        [tournamentState.groupMatches]
    );

    const exportToCSV = () => {
        // Exportar ranking
        const rankingCSV = [
            ['Rank', 'Team', 'Matches Played', 'Match Points', 'Arrow Average', 'X+10s'],
            ...rankingData.map((team, index) => [
                index + 1,
                team.teamName,
                team.matchesPlayed,
                team.matchPoints,
                (Math.round(team.arrowAverage * 100) / 100).toFixed(2),
                team.totalX10s
            ])
        ].map(row => row.join(',')).join('\n');

        // Exportar matches
        const matchesCSV = [
            ['Match', 'Team A', 'Team B', 'Score', 'Winner', 'Sets Played'],
            ...tournamentState.groupMatches.map(match => {
                const teamA = tournamentState.teams.find(t => t.id === match.teamA_id);
                const teamB = tournamentState.teams.find(t => t.id === match.teamB_id);
                const winner = match.winner_id ? tournamentState.teams.find(t => t.id === match.winner_id)?.name : 'N/A';
                return [
                    match.label,
                    teamA?.name || 'N/A',
                    teamB?.name || 'N/A',
                    `${match.teamA_set_points_total}-${match.teamB_set_points_total}`,
                    winner,
                    match.sets.length
                ];
            })
        ].map(row => row.join(',')).join('\n');

        // Crear archivo combinado
        const fullCSV = `RANKING\n${rankingCSV}\n\nMATCHES\n${matchesCSV}`;
        
        const blob = new Blob([fullCSV], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `tournament_results_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            <div className="lg:col-span-2 order-2 lg:order-1">
                <MatchList 
                    title="Qualification Matches"
                    matches={tournamentState.groupMatches} 
                    teams={tournamentState.teams} 
                    onOpenScoresheet={onOpenScoresheet}
                    onContinueMatch={onContinueMatch}
                    onShowQrCode={onShowQrCode}
                    isAdmin={isAdmin}
                />
            </div>
            <div className="order-1 lg:order-2">
                <RankingTable rankingData={rankingData} teams={tournamentState.teams} />
                <button
                    onClick={exportToCSV}
                    className="mt-4 w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300 text-sm shadow-lg"
                >
                    📊 Export Results to CSV
                </button>
                 {allMatchesCompleted && isAdmin && (
                    <button
                        onClick={onGenerateFinals}
                        className="mt-4 sm:mt-6 w-full bg-yellow-600 text-white font-bold py-2 sm:py-3 px-3 sm:px-4 rounded-lg hover:bg-yellow-700 transition duration-300 text-sm sm:text-base shadow-lg"
                    >
                        Finish Group Stage & Generate Finals
                    </button>
                )}
            </div>
        </div>
    );
};

export default memo(Dashboard);