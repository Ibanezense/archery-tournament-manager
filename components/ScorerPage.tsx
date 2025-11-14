
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Match, Team, ArrowValue, SetScore, TournamentState } from '../types';
import { ARROW_VALUES } from '../constants';

const LOCAL_STORAGE_KEY = 'archery-tournament-state';

interface ScorerPageProps {
    matchId: number;
}

const getArrowPoint = (val: ArrowValue) => {
    if (val === 'X') return 10;
    if (val === 'M') return 0;
    return val;
};
const isX10 = (val: ArrowValue) => val === 'X' || val === 10;

const ScorerPage: React.FC<ScorerPageProps> = ({ matchId }) => {
    const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSaved, setIsSaved] = useState(false);

    const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
    const [teamA, setTeamA] = useState<Team | null>(null);
    const [teamB, setTeamB] = useState<Team | null>(null);

    const [currentSetIndex, setCurrentSetIndex] = useState(0);
    const [currentArrowsA, setCurrentArrowsA] = useState<ArrowValue[]>([]);
    const [currentArrowsB, setCurrentArrowsB] = useState<ArrowValue[]>([]);

    const [shootOffData, setShootOffData] = useState({ winner: null as 'A' | 'B' | null, scoreA: '', scoreB: '' });

    useEffect(() => {
        try {
            const savedStateJSON = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (savedStateJSON) {
                const state: TournamentState = JSON.parse(savedStateJSON);
                setTournamentState(state);
                
                const allMatches = [...state.groupMatches, ...state.playoffMatches];
                const foundMatch = allMatches.find(m => m.id === matchId);
                
                if (foundMatch) {
                    if (foundMatch.completed) {
                        setError("This match has already been completed.");
                        return;
                    }
                    setCurrentMatch(JSON.parse(JSON.stringify(foundMatch)));
                    setTeamA(state.teams.find(t => t.id === foundMatch.teamA_id) || null);
                    setTeamB(state.teams.find(t => t.id === foundMatch.teamB_id) || null);
                    setCurrentSetIndex(foundMatch.sets.length);
                } else {
                    setError("Match not found.");
                }
            } else {
                setError("Tournament data not found. Please set up a tournament first.");
            }
        } catch (err) {
            setError("Could not load tournament data.");
        }
    }, [matchId]);

    const liveTotalSetPoints = useMemo(() => {
        if (!currentMatch) return { a: 0, b: 0 };
        return currentMatch.sets.reduce((acc, set) => ({
            a: acc.a + set.teamA_set_points,
            b: acc.b + set.teamB_set_points,
        }), { a: 0, b: 0 });
    }, [currentMatch?.sets]);

    const isMatchOver = liveTotalSetPoints.a >= 5 || liveTotalSetPoints.b >= 5;
    const isShootOff = liveTotalSetPoints.a === 4 && liveTotalSetPoints.b === 4 && currentMatch?.sets.length === 4;
    const canAddSet = !isMatchOver && !isShootOff && currentSetIndex < 4;

    const currentSetTotals = useMemo(() => {
        const totalA = currentArrowsA.reduce((sum, val) => sum + getArrowPoint(val), 0);
        const totalB = currentArrowsB.reduce((sum, val) => sum + getArrowPoint(val), 0);
        return { totalA, totalB };
    }, [currentArrowsA, currentArrowsB]);

    const addArrow = (team: 'A' | 'B', value: ArrowValue) => {
        if (team === 'A' && currentArrowsA.length < 10) setCurrentArrowsA([...currentArrowsA, value]);
        if (team === 'B' && currentArrowsB.length < 10) setCurrentArrowsB([...currentArrowsB, value]);
    };
    
    const removeLastArrow = (team: 'A' | 'B') => {
        if (team === 'A') setCurrentArrowsA(currentArrowsA.slice(0, -1));
        if (team === 'B') setCurrentArrowsB(currentArrowsB.slice(0, -1));
    }

    const saveCurrentSet = useCallback(() => {
        if (!currentMatch || currentArrowsA.length !== 10 || currentArrowsB.length !== 10) return;
        
        let pointsA = 0, pointsB = 0;
        if (currentSetTotals.totalA > currentSetTotals.totalB) pointsA = 2;
        else if (currentSetTotals.totalB > currentSetTotals.totalA) pointsB = 2;
        else { pointsA = 1; pointsB = 1; }

        const newSet: SetScore = {
            teamA_arrows: currentArrowsA, teamB_arrows: currentArrowsB,
            teamA_set_total: currentSetTotals.totalA, teamB_set_total: currentSetTotals.totalB,
            teamA_x10s: currentArrowsA.filter(isX10).length, teamB_x10s: currentArrowsB.filter(isX10).length,
            teamA_set_points: pointsA, teamB_set_points: pointsB,
        };

        setCurrentMatch(prev => prev ? ({ ...prev, sets: [...prev.sets, newSet] }) : null);
        setCurrentSetIndex(prev => prev + 1);
        setCurrentArrowsA([]);
        setCurrentArrowsB([]);
    }, [currentArrowsA, currentArrowsB, currentSetTotals, currentMatch]);

    const handleSaveMatch = () => {
        if (!currentMatch || !tournamentState || !teamA || !teamB) return;

        let finalMatch = { ...currentMatch, completed: true };
        
        if (isShootOff && shootOffData.winner) {
           finalMatch.isShootOff = true;
           finalMatch.shootOffScore = {
               teamA_winner: shootOffData.winner === 'A' ? 1 : 0,
               teamB_winner: shootOffData.winner === 'B' ? 1 : 0,
               teamA_arrow_score: shootOffData.scoreA,
               teamB_arrow_score: shootOffData.scoreB,
           };
        }

        const finalPoints = finalMatch.sets.reduce((acc, set) => ({
            a: acc.a + set.teamA_set_points,
            b: acc.b + set.teamB_set_points,
        }), { a: 0, b: 0 });
        
        if (finalMatch.isShootOff) {
            if(finalMatch.shootOffScore?.teamA_winner === 1) finalPoints.a++;
            if(finalMatch.shootOffScore?.teamB_winner === 1) finalPoints.b++;
        }

        finalMatch.teamA_set_points_total = finalPoints.a;
        finalMatch.teamB_set_points_total = finalPoints.b;

        const totals = finalMatch.sets.reduce((acc, set) => ({
            scoreA: acc.scoreA + set.teamA_set_total, scoreB: acc.scoreB + set.teamB_set_total,
            x10sA: acc.x10sA + set.teamA_x10s, x10sB: acc.x10sB + set.teamB_x10s,
        }), { scoreA: 0, scoreB: 0, x10sA: 0, x10sB: 0});

        finalMatch.teamA_arrow_score_total = totals.scoreA;
        finalMatch.teamB_arrow_score_total = totals.scoreB;
        finalMatch.teamA_x10s_total = totals.x10sA;
        finalMatch.teamB_x10s_total = totals.x10sB;
        finalMatch.winner_id = finalPoints.a > finalPoints.b ? teamA.id : finalPoints.b > finalPoints.a ? teamB.id : null;

        // Update state in localStorage
        const isGroupMatch = finalMatch.stage === 'group';
        const matchesKey = isGroupMatch ? 'groupMatches' : 'playoffMatches';
        const updatedMatches = tournamentState[matchesKey].map(m => m.id === finalMatch.id ? finalMatch : m);
        const newState: TournamentState = { ...tournamentState, [matchesKey]: updatedMatches };
        
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newState));
        setIsSaved(true);
    };

    if (error) {
        return <div className="text-red-600 text-center mt-10 p-4 bg-red-50 border-2 border-red-200 rounded-lg max-w-md mx-auto shadow-md">{error}</div>;
    }
    if (!currentMatch || !teamA || !teamB) {
        return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-yellow-600"></div></div>;
    }
    if (isSaved) {
        return (
            <div className="text-center p-8 bg-white border-2 border-gray-200 rounded-lg max-w-md mx-auto shadow-md">
                <h2 className="text-3xl font-bold text-green-600 mb-4">Score Saved!</h2>
                <p className="text-gray-700 mb-6">The tournament dashboard has been updated.</p>
                <div className="text-2xl font-bold text-gray-900">{teamA.name} <span className="text-yellow-600">{liveTotalSetPoints.a}</span> - <span className="text-yellow-600">{liveTotalSetPoints.b}</span> {teamB.name}</div>
                <button onClick={() => window.close()} className="mt-6 bg-yellow-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-yellow-500 transition shadow-md">
                    Close Window
                </button>
            </div>
        );
    }
    
    const renderArrowInputs = (team: 'A' | 'B') => {
        const arrows = team === 'A' ? currentArrowsA : currentArrowsB;
        return(
        <div className="flex flex-col items-center">
            <div className="flex items-center justify-center p-2 bg-gray-50 border border-gray-200 rounded mb-2 w-full">
                <div className="grid grid-cols-5 gap-1 w-full">
                {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className="h-8 w-8 flex items-center justify-center text-lg font-mono rounded bg-white border border-gray-300 text-yellow-600 font-bold">
                        {arrows[i] !== undefined ? arrows[i] : '-'}
                    </div>
                ))}
                </div>
                <button onClick={() => removeLastArrow(team)} className="ml-2 text-red-500 text-2xl font-bold">&times;</button>
            </div>
            <div className="grid grid-cols-4 gap-2">
                {ARROW_VALUES.map(val => (
                    <button key={val} onClick={() => addArrow(team, val)} className="bg-white hover:bg-yellow-50 border-2 border-gray-300 hover:border-yellow-600 rounded p-2 text-lg font-bold text-gray-900 transition shadow-sm">
                        {val}
                    </button>
                ))}
            </div>
        </div>
    )};

    return (
        <div className="bg-white border-2 border-gray-200 rounded-lg shadow-xl w-full max-w-4xl mx-auto">
            <div className="p-3 sm:p-4 md:p-6 border-b-2 border-gray-200 text-center bg-white">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 truncate px-2">{teamA.name} vs {teamB.name}</h2>
                <div className="text-4xl sm:text-5xl md:text-6xl font-bold my-3 sm:my-4 text-gray-900">{liveTotalSetPoints.a} - {liveTotalSetPoints.b}</div>
            </div>

            <div className="p-3 sm:p-4 md:p-6 bg-gray-50">
                {canAddSet && (
                     <div className="border-b-2 border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
                        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 text-center text-gray-900">Set {currentSetIndex + 1}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
                           <div>
                             <h4 className="font-bold text-base sm:text-lg mb-2 text-gray-900">{teamA.name} - Score: <span className="text-yellow-600">{currentSetTotals.totalA}</span></h4>
                              {renderArrowInputs('A')}
                           </div>
                           <div>
                             <h4 className="font-bold text-base sm:text-lg mb-2 text-gray-900">{teamB.name} - Score: <span className="text-yellow-600">{currentSetTotals.totalB}</span></h4>
                              {renderArrowInputs('B')}
                           </div>
                        </div>
                        {currentArrowsA.length === 10 && currentArrowsB.length === 10 && (
                            <div className="text-center mt-4 sm:mt-6">
                               <button onClick={saveCurrentSet} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 sm:px-6 rounded text-sm sm:text-base shadow-md transition">Save Set</button>
                            </div>
                        )}
                    </div>
                )}

                {isShootOff && !isMatchOver && (
                     <div className="text-center border-b-2 border-gray-200 pb-4 sm:pb-6 mb-4 sm:mb-6">
                        <h3 className="text-xl sm:text-2xl font-bold text-red-600 mb-3 sm:mb-4">SHOOT-OFF</h3>
                        <div className="flex flex-col items-center gap-3 sm:gap-4">
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                <input type="text" value={shootOffData.scoreA} onChange={(e) => setShootOffData(prev => ({...prev, scoreA: e.target.value}))} className="w-20 bg-white border-2 border-gray-300 rounded-md p-2 text-gray-900 text-center focus:outline-none focus:border-yellow-600" placeholder="Score"/>
                                <button onClick={() => setShootOffData(prev => ({...prev, winner: 'A'}))} className={`font-bold py-2 px-4 sm:px-6 rounded w-full sm:w-48 text-center text-sm sm:text-base transition shadow-sm ${shootOffData.winner === 'A' ? 'bg-yellow-600 text-white border-2 border-yellow-600' : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-yellow-600'}`}>{teamA.name} Wins</button>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                                <input type="text" value={shootOffData.scoreB} onChange={(e) => setShootOffData(prev => ({...prev, scoreB: e.target.value}))} className="w-20 bg-white border-2 border-gray-300 rounded-md p-2 text-gray-900 text-center focus:outline-none focus:border-yellow-600" placeholder="Score"/>
                                <button onClick={() => setShootOffData(prev => ({...prev, winner: 'B'}))} className={`font-bold py-2 px-4 sm:px-6 rounded w-full sm:w-48 text-center text-sm sm:text-base transition shadow-sm ${shootOffData.winner === 'B' ? 'bg-yellow-600 text-white border-2 border-yellow-600' : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-yellow-600'}`}>{teamB.name} Wins</button>
                            </div>
                        </div>
                    </div>
                )}
                 
                 {(isMatchOver || (isShootOff && shootOffData.winner)) && (
                    <div className="text-center mt-4 sm:mt-6">
                        <h3 className="text-xl sm:text-2xl font-bold text-green-600 mb-3 sm:mb-4">Match Ready to Save</h3>
                        <button onClick={handleSaveMatch} className="bg-yellow-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg hover:bg-yellow-500 transition text-base sm:text-lg shadow-md">Confirm and Save Final Score</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ScorerPage;