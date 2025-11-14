
import React, { memo, useCallback, useMemo } from 'react';
import type { Match, Team } from '../types';

interface PlayoffsBracketProps {
    teams: Team[];
    matches: Match[];
    onOpenScoresheet: (match: Match, isEditing?: boolean) => void;
    onContinueMatch: (match: Match) => void;
    onShowQrCode: (match: Match) => void;
    isAdmin: boolean;
}

const PlayoffsBracket: React.FC<PlayoffsBracketProps> = ({ teams, matches, onOpenScoresheet, onContinueMatch, onShowQrCode, isAdmin }) => {
    const getTeamName = useCallback((id: number) => {
        return teams.find(t => t.id === id)?.name || 'TBD';
    }, [teams]);

    const findMatch = useCallback((stage: 'semifinal' | 'bronze' | 'gold', label?: string) => {
        if (label) return matches.find(m => m.stage === stage && m.label === label);
        return matches.find(m => m.stage === stage);
    }, [matches]);

    const { semi1, semi2, bronzeMatch, goldMatch } = useMemo(() => ({
        semi1: findMatch('semifinal', 'Semifinal 1'),
        semi2: findMatch('semifinal', 'Semifinal 2'),
        bronzeMatch: findMatch('bronze'),
        goldMatch: findMatch('gold'),
    }), [findMatch]);

    const renderMatch = (match: Match | undefined, title: string) => {
        if (!match) return (
            <div className="bg-white border-2 border-gray-200 p-3 sm:p-4 rounded-md text-center shadow-sm">
                <div className="font-bold text-gray-700 mb-2 text-sm sm:text-base">{title}</div>
                <div className="text-gray-500 text-xs sm:text-sm">Waiting for previous round...</div>
            </div>
        );

        return (
             <div className="bg-white border-2 border-gray-200 p-3 sm:p-4 rounded-md shadow-sm">
                <div className="font-bold text-gray-900 mb-2 text-center text-sm sm:text-base">{title}</div>
                 <div className="flex items-center justify-between text-sm sm:text-base text-gray-900">
                    <span className={`truncate flex-1 ${match.completed && match.winner_id === match.teamA_id ? 'font-bold text-yellow-600' : ''}`}>{getTeamName(match.teamA_id)}</span>
                    <span className="font-bold ml-2">{match.completed ? match.teamA_set_points_total : (match.sets.length > 0 ? match.teamA_set_points_total : '-')}</span>
                 </div>
                  <div className="flex items-center justify-between mt-1 text-sm sm:text-base text-gray-900">
                    <span className={`truncate flex-1 ${match.completed && match.winner_id === match.teamB_id ? 'font-bold text-yellow-600' : ''}`}>{getTeamName(match.teamB_id)}</span>
                    <span className="font-bold ml-2">{match.completed ? match.teamB_set_points_total : (match.sets.length > 0 ? match.teamB_set_points_total : '-')}</span>
                 </div>
                 {!match.completed && match.sets.length > 0 && (
                    <div className="text-center mt-1">
                        <span className="text-xs text-gray-500">
                            Set {match.sets.length}/{match.teamA_set_points_total === 4 && match.teamB_set_points_total === 4 ? '5' : '4'}
                        </span>
                    </div>
                 )}
                 <div className="text-center mt-3">
                     {match.completed ? (
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                             <button onClick={() => onOpenScoresheet(match, false)} className="bg-gray-600 hover:bg-gray-500 text-white text-xs font-bold py-1 px-2 rounded shadow-sm transition" title="View Scoresheet">
                                 View
                             </button>
                             {isAdmin && (
                                <>
                                    <button
                                        onClick={() => onOpenScoresheet(match, true)}
                                        className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded shadow-sm transition"
                                        title="Edit Scoresheet"
                                    >
                                        Edit
                                    </button>
                                    {match.teamA_set_points_total < 5 && match.teamB_set_points_total < 5 && (
                                        <button
                                            onClick={() => onContinueMatch(match)}
                                            className="bg-green-600 hover:bg-green-700 text-white text-xs font-bold py-1 px-2 rounded shadow"
                                            title="Continue Match"
                                        >
                                            Continue
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                     ) : (
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                             {isAdmin ? (
                                <>
                                    <button
                                        onClick={() => onShowQrCode(match)}
                                        className="bg-gray-600 hover:bg-gray-500 text-white text-xs sm:text-sm font-bold py-1 px-2 sm:px-3 rounded shadow-sm transition"
                                        title="Show QR Code for Scoring"
                                    >
                                        QR
                                    </button>
                                    <button 
                                        onClick={() => onOpenScoresheet(match)} 
                                        className={`text-white text-xs sm:text-sm font-bold py-1 px-2 sm:px-3 rounded shadow-sm transition ${
                                            match.teamA_set_points_total === 4 && match.teamB_set_points_total === 4 && match.sets.length === 4
                                                ? 'bg-red-600 hover:bg-red-700'
                                                : 'bg-blue-600 hover:bg-blue-500'
                                        }`}
                                    >
                                        {match.teamA_set_points_total === 4 && match.teamB_set_points_total === 4 && match.sets.length === 4
                                            ? 'Shoot-Off'
                                            : `Enter Set ${match.sets.length + 1}`
                                        }
                                    </button>
                                </>
                            ) : (
                                <span className="text-gray-600 text-xs italic">In progress...</span>
                            )}
                         </div>
                     )}
                 </div>
            </div>
        );
    };

    return (
        <div className="bg-white border-2 border-gray-200 p-3 sm:p-4 md:p-6 rounded-lg shadow-md">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center text-yellow-600">Playoffs</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 items-start md:items-center">
                {/* Semifinals */}
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                    {renderMatch(semi1, 'Semifinal 1')}
                    {renderMatch(semi2, 'Semifinal 2')}
                </div>

                {/* Finals */}
                <div className="space-y-4 sm:space-y-6 md:space-y-8">
                     {renderMatch(goldMatch, 'Gold Medal Match')}
                     {renderMatch(bronzeMatch, 'Bronze Medal Match')}
                </div>

                {/* Winners */}
                <div className="text-center space-y-4 sm:space-y-6">
                    {goldMatch?.completed && (
                        <>
                            <div className="mb-4 sm:mb-8">
                                <div className="text-xl sm:text-2xl font-bold text-yellow-500">GOLD MEDAL</div>
                                <div className="text-base sm:text-lg md:text-xl mt-1 text-gray-900">{getTeamName(goldMatch.winner_id!)}</div>
                            </div>
                             <div className="mb-4 sm:mb-8">
                                <div className="text-xl sm:text-2xl font-bold text-gray-500">SILVER MEDAL</div>
                                <div className="text-base sm:text-lg md:text-xl mt-1 text-gray-900">{getTeamName(goldMatch.teamA_id === goldMatch.winner_id! ? goldMatch.teamB_id : goldMatch.teamA_id)}</div>
                            </div>
                        </>
                    )}
                    {bronzeMatch?.completed && (
                         <div className="mt-4 sm:mt-8 md:mt-0">
                            <div className="text-xl sm:text-2xl font-bold text-yellow-700">BRONZE MEDAL</div>
                            <div className="text-base sm:text-lg md:text-xl mt-1 text-gray-900">{getTeamName(bronzeMatch.winner_id!)}</div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default memo(PlayoffsBracket);