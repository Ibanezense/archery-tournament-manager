
import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import type { Match, Team, ArrowValue, SetScore } from '../types';
import { ARROW_VALUES } from '../constants';

interface ScoresheetModalProps {
    match: Match;
    teamA: Team;
    teamB: Team;
    isEditing: boolean;
    onClose: () => void;
    onSave: (match: Match) => void;
}

const getArrowPoint = (val: ArrowValue) => {
    if (val === 'X') return 10;
    if (val === 'M') return 0;
    return val;
};
const isX10 = (val: ArrowValue) => val === 'X' || val === 10;

const ScoresheetModal: React.FC<ScoresheetModalProps> = ({ match, teamA, teamB, isEditing, onClose, onSave }) => {
    const [currentMatch, setCurrentMatch] = useState<Match>(JSON.parse(JSON.stringify(match)));
    const [currentSetIndex, setCurrentSetIndex] = useState(match.sets?.length || 0);
    const [currentArrowsA, setCurrentArrowsA] = useState<ArrowValue[]>([]);
    const [currentArrowsB, setCurrentArrowsB] = useState<ArrowValue[]>([]);
    const [editingSetIndex, setEditingSetIndex] = useState<number | null>(null);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const initialShootOffWinner = match.shootOffScore?.teamA_winner ? 'A' : match.shootOffScore?.teamB_winner ? 'B' : null;
    const [shootOffData, setShootOffData] = useState({
        winner: initialShootOffWinner,
        scoreA: match.shootOffScore?.teamA_arrow_score || '',
        scoreB: match.shootOffScore?.teamB_arrow_score || '',
    });

    const isReadOnly = useMemo(() => match.completed && !isEditing, [match.completed, isEditing]);

    const liveTotalSetPoints = useMemo(() => {
        return (currentMatch.sets || []).reduce((acc, set) => ({
            a: acc.a + set.teamA_set_points,
            b: acc.b + set.teamB_set_points,
        }), { a: 0, b: 0 });
    }, [currentMatch.sets]);

    const isMatchOver = liveTotalSetPoints.a >= 5 || liveTotalSetPoints.b >= 5;
    const needsShootOff = liveTotalSetPoints.a === 4 && liveTotalSetPoints.b === 4 && (currentMatch.sets?.length || 0) === 4;
    const isShootOffMode = needsShootOff && currentSetIndex === 4; // El set 5 (índice 4) es el shoot-off
    const canAddSet = !isMatchOver && currentSetIndex < 4;

    const currentSetTotals = useMemo(() => {
        const totalA = currentArrowsA.reduce((sum, val) => sum + getArrowPoint(val), 0);
        const totalB = currentArrowsB.reduce((sum, val) => sum + getArrowPoint(val), 0);
        const x10sA = currentArrowsA.filter(isX10).length;
        const x10sB = currentArrowsB.filter(isX10).length;
        return { totalA, totalB, x10sA, x10sB };
    }, [currentArrowsA, currentArrowsB]);

    const addArrow = (team: 'A' | 'B', value: ArrowValue) => {
        if (team === 'A' && currentArrowsA.length < 10) {
            setCurrentArrowsA([...currentArrowsA, value]);
        }
        if (team === 'B' && currentArrowsB.length < 10) {
            setCurrentArrowsB([...currentArrowsB, value]);
        }
    };
    
    const removeLastArrow = (team: 'A' | 'B') => {
        if (team === 'A') setCurrentArrowsA(currentArrowsA.slice(0, -1));
        if (team === 'B') setCurrentArrowsB(currentArrowsB.slice(0, -1));
    }
    
    const handleEditSet = (index: number) => {
        const setToEdit = currentMatch.sets?.[index];
        if (setToEdit) {
            setCurrentArrowsA(setToEdit.teamA_arrows);
            setCurrentArrowsB(setToEdit.teamB_arrows);
            setEditingSetIndex(index);
        }
    };

    const updateSet = () => {
        if (editingSetIndex === null || currentArrowsA.length !== 10 || currentArrowsB.length !== 10) return;

        let pointsA = 0, pointsB = 0;
        if (currentSetTotals.totalA > currentSetTotals.totalB) {
            pointsA = 2;
        } else if (currentSetTotals.totalB > currentSetTotals.totalA) {
            pointsB = 2;
        } else {
            pointsA = 1;
            pointsB = 1;
        }

        const updatedSet: SetScore = {
            teamA_arrows: currentArrowsA,
            teamB_arrows: currentArrowsB,
            teamA_set_total: currentSetTotals.totalA,
            teamB_set_total: currentSetTotals.totalB,
            teamA_x10s: currentSetTotals.x10sA,
            teamB_x10s: currentSetTotals.x10sB,
            teamA_set_points: pointsA,
            teamB_set_points: pointsB,
        };

        const newSets = [...(currentMatch.sets || [])];
        newSets[editingSetIndex] = updatedSet;
        
        const updatedMatch = { ...currentMatch, sets: newSets };
        
        // Recalcular totales de set points
        const totalSetPoints = (updatedMatch.sets || []).reduce((acc, set) => ({
            a: acc.a + set.teamA_set_points,
            b: acc.b + set.teamB_set_points,
        }), { a: 0, b: 0 });
        
        // Si después de editar ya ningún equipo tiene 5+ puntos, desmarcar como completado
        if (totalSetPoints.a < 5 && totalSetPoints.b < 5) {
            updatedMatch.completed = false;
            updatedMatch.winner_id = undefined;
            updatedMatch.editHistory = [
                ...(updatedMatch.editHistory || []),
                {
                    timestamp: new Date().toISOString(),
                    action: 'set_edited' as const,
                    setIndex: editingSetIndex,
                    details: `Set ${editingSetIndex + 1} edited: ${currentSetTotals.totalA}-${currentSetTotals.totalB}`
                }
            ];
        }
        
        // Guardar y cerrar el modal
        onSave(updatedMatch);
        onClose();
    };

    const deleteLastSet = useCallback(() => {
        if ((currentMatch.sets?.length || 0) === 0) return;
        
        if (window.confirm('Are you sure you want to delete the last set? This action cannot be undone.')) {
            const updatedMatch = {
                ...currentMatch,
                sets: (currentMatch.sets || []).slice(0, -1),
                completed: false,
                winner_id: undefined,
                isShootOff: false,
                shootOffScore: undefined,
                editHistory: [
                    ...(currentMatch.editHistory || []),
                    {
                        timestamp: new Date().toISOString(),
                        action: 'set_deleted' as const,
                        setIndex: (currentMatch.sets?.length || 1) - 1,
                        details: `Deleted set ${currentMatch.sets?.length || 0}`
                    }
                ]
            };
            
            setCurrentMatch(updatedMatch);
            onSave(updatedMatch);
            onClose();
        }
    }, [currentMatch, onSave, onClose]);

    const saveCurrentSet = useCallback(() => {
        if (currentArrowsA.length !== 10 || currentArrowsB.length !== 10) return;
        
        // Mostrar diálogo de confirmación
        setShowConfirmation(true);
    }, [currentArrowsA, currentArrowsB]);

    const confirmSaveSet = useCallback(() => {
        let pointsA = 0, pointsB = 0;
        if (currentSetTotals.totalA > currentSetTotals.totalB) {
            pointsA = 2;
        } else if (currentSetTotals.totalB > currentSetTotals.totalA) {
            pointsB = 2;
        } else {
            pointsA = 1;
            pointsB = 1;
        }

        const newSet: SetScore = {
            teamA_arrows: currentArrowsA,
            teamB_arrows: currentArrowsB,
            teamA_set_total: currentSetTotals.totalA,
            teamB_set_total: currentSetTotals.totalB,
            teamA_x10s: currentSetTotals.x10sA,
            teamB_x10s: currentSetTotals.x10sB,
            teamA_set_points: pointsA,
            teamB_set_points: pointsB,
        };

        const updatedMatch = { 
            ...currentMatch, 
            sets: [...(currentMatch.sets || []), newSet],
            editHistory: [
                ...(currentMatch.editHistory || []),
                {
                    timestamp: new Date().toISOString(),
                    action: 'set_added' as const,
                    setIndex: currentMatch.sets?.length || 0,
                    details: `Set ${(currentMatch.sets?.length || 0) + 1}: ${currentSetTotals.totalA}-${currentSetTotals.totalB} (${pointsA}-${pointsB} points)`
                }
            ]
        };
        
        // Calcular totales de set points después de agregar el nuevo set
        const totalSetPoints = (updatedMatch.sets || []).reduce((acc, set) => ({
            a: acc.a + set.teamA_set_points,
            b: acc.b + set.teamB_set_points,
        }), { a: 0, b: 0 });
        
        // Si algún equipo alcanzó 5 puntos, marcar como completado
        if (totalSetPoints.a >= 5 || totalSetPoints.b >= 5) {
            updatedMatch.completed = true;
            updatedMatch.winner_id = totalSetPoints.a >= 5 ? match.teamA_id : match.teamB_id;
            updatedMatch.editHistory = [
                ...(updatedMatch.editHistory || []),
                {
                    timestamp: new Date().toISOString(),
                    action: 'match_completed' as const,
                    details: `Match completed: ${totalSetPoints.a}-${totalSetPoints.b}`
                }
            ];
        }
        
        // Guardar y cerrar el modal (incluso si es 4-4 después del 4to set)
        setCurrentMatch(updatedMatch);
        setShowConfirmation(false);
        onSave(updatedMatch);
        onClose();
    }, [currentArrowsA, currentArrowsB, currentSetTotals, currentMatch, match.teamA_id, match.teamB_id, onSave, onClose]);

    const handleSaveMatch = () => {
        let finalMatch = { ...currentMatch, completed: true };
        
        if (isShootOffMode && shootOffData.winner) {
           finalMatch.isShootOff = true;
           finalMatch.shootOffScore = {
               teamA_winner: shootOffData.winner === 'A' ? 1 : 0,
               teamB_winner: shootOffData.winner === 'B' ? 1 : 0,
               teamA_arrow_score: shootOffData.scoreA,
               teamB_arrow_score: shootOffData.scoreB,
           };
        } else {
            finalMatch.isShootOff = false;
            finalMatch.shootOffScore = undefined;
        }

        const finalPoints = (finalMatch.sets || []).reduce((acc, set) => ({
            a: acc.a + set.teamA_set_points,
            b: acc.b + set.teamB_set_points,
        }), { a: 0, b: 0 });
        
        if (finalMatch.isShootOff) {
            if(finalMatch.shootOffScore?.teamA_winner === 1) finalPoints.a++;
            if(finalMatch.shootOffScore?.teamB_winner === 1) finalPoints.b++;
        }

        finalMatch.teamA_set_points_total = finalPoints.a;
        finalMatch.teamB_set_points_total = finalPoints.b;

        const totals = (finalMatch.sets || []).reduce((acc, set) => ({
            scoreA: acc.scoreA + set.teamA_set_total,
            scoreB: acc.scoreB + set.teamB_set_total,
            x10sA: acc.x10sA + set.teamA_x10s,
            x10sB: acc.x10sB + set.teamB_x10s,
        }), { scoreA: 0, scoreB: 0, x10sA: 0, x10sB: 0});

        finalMatch.teamA_arrow_score_total = totals.scoreA;
        finalMatch.teamB_arrow_score_total = totals.scoreB;
        finalMatch.teamA_x10s_total = totals.x10sA;
        finalMatch.teamB_x10s_total = totals.x10sB;

        finalMatch.winner_id = finalPoints.a > finalPoints.b ? teamA.id : finalPoints.b > finalPoints.a ? teamB.id : null;

        onSave(finalMatch);
        onClose();
    };

    const renderArrowInputs = (team: 'A' | 'B') => {
        const arrows = team === 'A' ? currentArrowsA : currentArrowsB;
        return(
        <div className="flex flex-col items-center">
            <div className="flex items-center justify-center p-2 bg-gray-50 border border-gray-200 rounded mb-2 w-full">
                <div className="grid grid-cols-5 gap-0.5 sm:gap-1 w-full">
                {Array.from({length: 10}).map((_, i) => (
                    <div key={i} className="h-6 w-6 sm:h-8 sm:w-8 flex items-center justify-center text-sm sm:text-lg font-mono rounded bg-white border border-gray-300 text-yellow-600 font-bold">
                        {arrows[i] !== undefined ? arrows[i] : '-'}
                    </div>
                ))}
                </div>
                <button onClick={() => removeLastArrow(team)} className="ml-1 sm:ml-2 text-red-500 text-xl sm:text-2xl font-bold flex-shrink-0">&times;</button>
            </div>
            <div className="grid grid-cols-4 gap-1 sm:gap-2 w-full">
                {ARROW_VALUES.map(val => (
                    <button key={val} onClick={() => addArrow(team, val)} className="bg-white hover:bg-yellow-50 border-2 border-gray-300 hover:border-yellow-600 rounded p-1.5 sm:p-2 text-base sm:text-lg font-bold text-gray-900 transition shadow-sm">
                        {val}
                    </button>
                ))}
            </div>
        </div>
    )};

    const renderSetSummary = () => (
        <div className="space-y-4">
            {isEditing && (currentMatch.sets?.length || 0) > 0 && (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={deleteLastSet}
                        className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-2 px-4 rounded shadow transition"
                    >
                        Delete Last Set
                    </button>
                </div>
            )}
            {(currentMatch.sets || []).map((set, index) => (
                <div key={index} className="bg-white border-2 border-gray-200 p-4 rounded-lg shadow-sm">
                    <h4 className="flex justify-between items-center text-lg font-bold mb-3 text-gray-900 border-b-2 border-gray-200 pb-2">
                        <span>
                            Set {index + 1}
                            <span className="ml-4 text-gray-700 font-semibold">
                                (Set Points: {set.teamA_set_points} - {set.teamB_set_points})
                            </span>
                        </span>
                        {isEditing && 
                            <button 
                                onClick={() => handleEditSet(index)}
                                className="bg-yellow-600 hover:bg-yellow-500 text-white text-xs font-bold py-1 px-2 rounded shadow-sm transition"
                            >
                                Edit Set
                            </button>
                        }
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                            <p className="font-semibold text-gray-900">{teamA.name} - Total: {set.teamA_set_total}</p>
                            <div className="flex flex-wrap gap-1 mt-2 font-mono">
                                {set.teamA_arrows.map((arrow, i) => (
                                    <span key={i} className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-300 rounded text-gray-900">{arrow}</span>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900">{teamB.name} - Total: {set.teamB_set_total}</p>
                            <div className="flex flex-wrap gap-1 mt-2 font-mono">
                                {set.teamB_arrows.map((arrow, i) => (
                                    <span key={i} className="w-8 h-8 flex items-center justify-center bg-gray-50 border border-gray-300 rounded text-gray-900">{arrow}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            ))}
            {currentMatch.isShootOff && (
                <div className="bg-yellow-50 border-2 border-yellow-600 p-4 rounded-lg text-center shadow-sm">
                    <h4 className="text-lg font-bold text-red-600">SHOOT-OFF RESULT</h4>
                    <p className="text-xl mt-2 text-gray-900">
                        Winner: <span className="font-bold text-yellow-600">{currentMatch.shootOffScore?.teamA_winner === 1 ? teamA.name : teamB.name}</span>
                    </p>
                    <p className="text-md mt-1 text-gray-700">
                        Scores: {teamA.name} ({currentMatch.shootOffScore?.teamA_arrow_score || 'N/A'}) vs {teamB.name} ({currentMatch.shootOffScore?.teamB_arrow_score || 'N/A'})
                    </p>
                </div>
            )}
        </div>
    );
    
    const renderContent = () => {
        // Modo edición de un set existente
        if (editingSetIndex !== null) {
            return <>
                <h3 className="text-xl font-bold mb-4 text-gray-900">Editing Set {editingSetIndex + 1}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div>
                     <h4 className="font-bold text-lg mb-2 text-gray-900">{teamA.name} - Set Score: <span className="text-yellow-600">{currentSetTotals.totalA}</span></h4>
                      {renderArrowInputs('A')}
                   </div>
                   <div>
                     <h4 className="font-bold text-lg mb-2 text-gray-900">{teamB.name} - Set Score: <span className="text-yellow-600">{currentSetTotals.totalB}</span></h4>
                      {renderArrowInputs('B')}
                   </div>
                </div>
                {currentArrowsA.length === 10 && currentArrowsB.length === 10 && (
                    <div className="text-center mt-6">
                       <button onClick={updateSet} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow-md transition">Save & Close</button>
                    </div>
                )}
            </>;
        }

        // Modo solo lectura: solo muestra el resumen
        if (isReadOnly) {
            return renderSetSummary();
        }

        // Modo shoot-off
        if (isShootOffMode && !isMatchOver) {
            return <>
                {(currentMatch.sets?.length || 0) > 0 && (
                    <div className="mb-6">
                        {renderSetSummary()}
                    </div>
                )}
                <div className="text-center border-t-2 border-gray-200 pt-6">
                    <h3 className="text-2xl font-bold text-red-600 mb-4">SHOOT-OFF</h3>
                     <p className="mb-4 text-gray-900">Select the winner of the shoot-off arrow and enter their score.</p>
                    <div className="flex flex-col items-center gap-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={shootOffData.scoreA}
                                onChange={(e) => setShootOffData(prev => ({...prev, scoreA: e.target.value}))}
                                className="w-20 bg-white border-2 border-gray-300 rounded-md p-2 text-gray-900 text-center focus:outline-none focus:border-yellow-600"
                                placeholder="Score"
                            />
                            <button
                                onClick={() => setShootOffData(prev => ({...prev, winner: 'A'}))}
                                className={`font-bold py-2 px-6 rounded w-48 text-center transition shadow-sm ${shootOffData.winner === 'A' ? 'bg-yellow-600 text-white border-2 border-yellow-600' : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-yellow-600'}`}>
                                {teamA.name} Wins
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={shootOffData.scoreB}
                                onChange={(e) => setShootOffData(prev => ({...prev, scoreB: e.target.value}))}
                                className="w-20 bg-white border-2 border-gray-300 rounded-md p-2 text-gray-900 text-center focus:outline-none focus:border-yellow-600"
                                placeholder="Score"
                            />
                            <button
                                onClick={() => setShootOffData(prev => ({...prev, winner: 'B'}))}
                                className={`font-bold py-2 px-6 rounded w-48 text-center transition shadow-sm ${shootOffData.winner === 'B' ? 'bg-yellow-600 text-white border-2 border-yellow-600' : 'bg-white text-gray-900 border-2 border-gray-300 hover:border-yellow-600'}`}>
                                {teamB.name} Wins
                            </button>
                        </div>
                    </div>
                </div>
            </>;
        }

        // Modo normal: ingreso de nuevo set
        if (canAddSet) {
            return <>
                {(currentMatch.sets?.length || 0) > 0 && (
                    <div className="mb-6">
                        {renderSetSummary()}
                        <div className="border-t-2 border-gray-200 mt-4"></div>
                    </div>
                )}
                <div className="pt-4">
                    <h3 className="text-xl font-bold mb-4 text-center text-gray-900">Set {currentSetIndex + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div>
                         <h4 className="font-bold text-lg mb-2 text-gray-900">
                            {teamA.name} - Set Score: <span className="text-yellow-600">{currentSetTotals.totalA}</span>
                            <span className="ml-2 text-sm text-gray-500">({currentArrowsA.length}/10 arrows)</span>
                         </h4>
                          {renderArrowInputs('A')}
                       </div>
                       <div>
                         <h4 className="font-bold text-lg mb-2 text-gray-900">
                            {teamB.name} - Set Score: <span className="text-yellow-600">{currentSetTotals.totalB}</span>
                            <span className="ml-2 text-sm text-gray-500">({currentArrowsB.length}/10 arrows)</span>
                         </h4>
                          {renderArrowInputs('B')}
                       </div>
                    </div>
                    <div className="text-center mt-6">
                        <button 
                            onClick={saveCurrentSet} 
                            disabled={currentArrowsA.length !== 10 || currentArrowsB.length !== 10}
                            className={`font-bold py-2 px-6 rounded shadow-md transition ${
                                currentArrowsA.length === 10 && currentArrowsB.length === 10
                                    ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                        >
                            Save Set & Close
                        </button>
                    </div>
                </div>
            </>;
        }

        // Match completado: solo resumen
        return renderSetSummary();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
                <div className="p-3 sm:p-4 md:p-6 border-b-2 border-gray-200 sticky top-0 bg-white z-10">
                    <div className="flex justify-between items-center">
                        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-yellow-600 truncate pr-2">{teamA.name} vs {teamB.name}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-900 text-2xl sm:text-3xl flex-shrink-0 transition">&times;</button>
                    </div>
                    <div className="text-3xl sm:text-4xl md:text-5xl text-center font-bold my-2 sm:my-4 text-gray-900">{liveTotalSetPoints.a} - {liveTotalSetPoints.b}</div>
                </div>

                <div className="p-3 sm:p-4 md:p-6 bg-gray-50">
                    {renderContent()}
                </div>

                <div className="p-3 sm:p-4 md:p-6 bg-white border-t-2 border-gray-200 rounded-b-lg flex justify-end sticky bottom-0 shadow-lg">
                    {isReadOnly ? (
                        <button onClick={onClose} className="bg-yellow-600 text-white font-bold py-2 px-4 sm:px-6 rounded-lg hover:bg-yellow-500 transition text-sm sm:text-base shadow-md">Close</button>
                    ) : (
                        (isShootOffMode && shootOffData.winner) && (
                             <button onClick={handleSaveMatch} className="bg-yellow-600 text-white font-bold py-2 px-4 sm:px-6 rounded-lg hover:bg-yellow-500 transition text-sm sm:text-base shadow-md">Save Shoot-Off & Close</button>
                        )
                    )}
                </div>
            </div>

            {/* Diálogo de confirmación */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-[60] p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full">
                        <h3 className="text-xl font-bold mb-4 text-gray-900">Confirm Set Score</h3>
                        <div className="mb-6 space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="font-semibold text-gray-900">{teamA.name}:</span>
                                <span className="text-2xl font-bold text-yellow-600">{currentSetTotals.totalA} pts</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded border border-gray-200">
                                <span className="font-semibold text-gray-900">{teamB.name}:</span>
                                <span className="text-2xl font-bold text-yellow-600">{currentSetTotals.totalB} pts</span>
                            </div>
                            <div className="text-center pt-2">
                                <p className="text-sm text-gray-600">
                                    Set Points: <span className="font-bold text-gray-900">
                                        {currentSetTotals.totalA > currentSetTotals.totalB ? '2-0' : 
                                         currentSetTotals.totalB > currentSetTotals.totalA ? '0-2' : '1-1'}
                                    </span>
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirmation(false)}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmSaveSet}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded transition"
                            >
                                Confirm & Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default memo(ScoresheetModal);
