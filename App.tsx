
import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import type { Team, Match, TournamentState } from './types';
import { GROUP_SCHEDULES } from './constants';
import SetupScreen from './components/SetupScreen';
import TeamManagement from './components/TeamManagement';
import AllTeamsModal from './components/AllTeamsModal';
import HomeScreen from './components/HomeScreen';
import LoadingSpinner from './components/LoadingSpinner';
import { RankingData } from './types';
import { preloadDashboard, preloadScoresheetModal, preloadQRCodeModal } from './preload';
import { database } from './firebase';
import { ref, onValue, set, get } from 'firebase/database';

// Lazy load components that are not immediately needed
const Dashboard = lazy(() => import('./components/Dashboard'));
const PlayoffsBracket = lazy(() => import('./components/PlayoffsBracket'));
const ScoresheetModal = lazy(() => import('./components/ScoresheetModal'));
const QRCodeModal = lazy(() => import('./components/QRCodeModal'));
const ScorerPage = lazy(() => import('./components/ScorerPage'));

const LOCAL_STORAGE_KEY = 'archery-tournament-state';
const REGISTERED_TEAMS_KEY = 'archery-registered-teams';

const App: React.FC = () => {
    const [tournamentState, setTournamentState] = useState<TournamentState | null>(null);
    const [registeredTeams, setRegisteredTeams] = useState<Team[]>([]);
    const [showTeamManagement, setShowTeamManagement] = useState(false);
    const [showSetupScreen, setShowSetupScreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeMatch, setActiveMatch] = useState<Match | null>(null);
    const [isEditingMatch, setIsEditingMatch] = useState(false);
    const [qrCodeMatch, setQrCodeMatch] = useState<Match | null>(null);
    const [path, setPath] = useState(() => {
        const fullPath = window.location.pathname;
        // Remove base path for GitHub Pages
        return fullPath.replace('/archery-tournament-manager', '') || '/';
    });
    const [isAdmin, setIsAdmin] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showAllTeamsModal, setShowAllTeamsModal] = useState(false);
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Basic router
    useEffect(() => {
        const onLocationChange = () => {
            const fullPath = window.location.pathname;
            setPath(fullPath.replace('/archery-tournament-manager', '') || '/');
        };
        window.addEventListener('popstate', onLocationChange);
        return () => window.removeEventListener('popstate', onLocationChange);
    }, []);

    // Load state from Firebase on initial render + migrate from localStorage if needed
    useEffect(() => {
        const tournamentRef = ref(database, 'tournamentState');
        const teamsRef = ref(database, 'registeredTeams');
        
        // Check and migrate from localStorage to Firebase (one-time migration)
        const migrateFromLocalStorage = async () => {
            try {
                // Check if Firebase is empty
                const firebaseSnapshot = await get(teamsRef);
                const firebaseData = firebaseSnapshot.val();
                
                // Only migrate if Firebase is empty but localStorage has data
                if (!firebaseData || (Array.isArray(firebaseData) && firebaseData.length === 0)) {
                    const localTeams = localStorage.getItem(REGISTERED_TEAMS_KEY);
                    if (localTeams) {
                        try {
                            const parsedTeams = JSON.parse(localTeams);
                            if (Array.isArray(parsedTeams) && parsedTeams.length > 0) {
                                console.log('Migrating teams from localStorage to Firebase:', parsedTeams);
                                await set(teamsRef, parsedTeams);
                                // Optionally clear localStorage after successful migration
                                // localStorage.removeItem(REGISTERED_TEAMS_KEY);
                            }
                        } catch (parseErr) {
                            console.error('Error parsing localStorage teams:', parseErr);
                        }
                    }
                }
            } catch (migrationErr) {
                console.error('Error during migration:', migrationErr);
            }
        };

        // Run migration first, then set up listeners
        migrateFromLocalStorage();
        
        // Set up real-time listeners
        const unsubscribeTournament = onValue(tournamentRef, (snapshot) => {
            try {
                const data = snapshot.val();
                setTournamentState(data || null);
            } catch (err) {
                console.error("Error processing tournament state:", err);
            } finally {
                setLoading(false);
            }
        }, (error) => {
            console.error("Failed to load tournament state:", error);
            setError("Could not load tournament data from server.");
            setLoading(false);
        });

        const unsubscribeTeams = onValue(teamsRef, (snapshot) => {
            try {
                const data = snapshot.val();
                // Ensure it's always an array
                setRegisteredTeams(Array.isArray(data) ? data : (data ? [data] : []));
            } catch (err) {
                console.error("Error processing registered teams:", err);
                setRegisteredTeams([]);
            }
        }, (error) => {
            console.error("Failed to load registered teams:", error);
            setRegisteredTeams([]);
        });

        return () => {
            unsubscribeTournament();
            unsubscribeTeams();
        };
    }, []);

    // Save tournament state to Firebase
    useEffect(() => {
        if (tournamentState) {
            const tournamentRef = ref(database, 'tournamentState');
            set(tournamentRef, tournamentState).catch((err) => {
                console.error("Failed to save tournament state:", err);
                setError("Could not save tournament data to server.");
            });
        }
    }, [tournamentState]);

    // Save registered teams to Firebase (only when explicitly changed, not on initial load)
    useEffect(() => {
        if (loading) return; // Don't save during initial load
        
        const teamsRef = ref(database, 'registeredTeams');
        set(teamsRef, registeredTeams).catch((err) => {
            console.error("Failed to save registered teams:", err);
        });
    }, [registeredTeams, loading]);

    const handleSaveRegisteredTeams = useCallback((teams: Team[]) => {
        setRegisteredTeams(teams);
        
        // Si hay torneo activo, actualizar los equipos del torneo con la info actualizada
        if (tournamentState) {
            const updatedTournamentTeams = tournamentState.teams.map(tournamentTeam => {
                const updatedTeam = teams.find(t => t.id === tournamentTeam.id);
                if (updatedTeam) {
                    // Mantener el id del torneo pero actualizar nombre y miembros
                    return {
                        ...tournamentTeam,
                        name: updatedTeam.name,
                        members: updatedTeam.members,
                        color: updatedTeam.color
                    };
                }
                return tournamentTeam;
            });
            
            setTournamentState({
                ...tournamentState,
                teams: updatedTournamentTeams
            });
        }
        
        setShowTeamManagement(false);
    }, [tournamentState]);

    const handleSetupComplete = useCallback((teams: Team[], tournamentName: string, tournamentDate: string) => {
        const schedule = GROUP_SCHEDULES[teams.length];
        const groupMatches: Match[] = schedule.map((matchPair, index) => ({
            id: index + 1,
            teamA_id: matchPair[0],
            teamB_id: matchPair[1],
            sets: [],
            completed: false,
            teamA_set_points_total: 0,
            teamB_set_points_total: 0,
            teamA_arrow_score_total: 0,
            teamB_arrow_score_total: 0,
            teamA_x10s_total: 0,
            teamB_x10s_total: 0,
            stage: 'group',
        }));

        const initialState: TournamentState = {
            id: Date.now().toString(),
            name: tournamentName,
            date: tournamentDate,
            stage: 'group',
            teams,
            groupMatches,
            playoffMatches: [],
        };
        
        setTournamentState(initialState);
        setShowSetupScreen(false);
        setIsAdmin(true); // El creador es admin automáticamente
        
        // Preload Dashboard and modal components after setup
        preloadDashboard();
        preloadScoresheetModal();
        preloadQRCodeModal();
    }, []);
    
    const handleOpenScoresheet = useCallback((match: Match, isEditing = false) => {
        if (isEditing && !isAdmin) {
            setShowLoginModal(true);
            return;
        }
        setActiveMatch(match);
        setIsEditingMatch(isEditing);
    }, [isAdmin]);

    const handleShowQrCode = useCallback((match: Match) => {
        setQrCodeMatch(match);
    }, []);

    const handleCloseScoresheet = useCallback(() => {
        setActiveMatch(null);
        setIsEditingMatch(false);
    }, []);
    
    const handleCloseQrCode = useCallback(() => {
        setQrCodeMatch(null);
    }, []);

    const handleLogin = useCallback(() => {
        const FIXED_ADMIN_PASSWORD = 'AbsoluteArchery25';
        
        if (loginPassword === FIXED_ADMIN_PASSWORD) {
            setIsAdmin(true);
            setShowLoginModal(false);
            setLoginPassword('');
            setLoginError('');
        } else {
            setLoginError('Incorrect password');
        }
    }, [loginPassword]);

    const handleLogout = useCallback(() => {
        setIsAdmin(false);
    }, []);

    const handleExportBackup = useCallback(() => {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            tournamentState,
            registeredTeams
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `archery_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [tournamentState, registeredTeams]);

    const handleImportBackup = useCallback(() => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';
        input.onchange = (e: Event) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const backup = JSON.parse(event.target?.result as string);
                    
                    // Support old backup format (data property) and new format (direct properties)
                    const tournamentData = backup.tournamentState || backup.data;
                    const teamsData = backup.registeredTeams || [];
                    
                    if (tournamentData) {
                        setTournamentState(tournamentData);
                    }
                    if (teamsData.length > 0) {
                        setRegisteredTeams(teamsData);
                    }
                    
                    alert('✅ Backup restored successfully!');
                } catch (err) {
                    console.error('Failed to restore backup:', err);
                    alert('❌ Failed to restore backup. Invalid file format.');
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }, []);

    const handleSaveMatch = useCallback((updatedMatch: Match) => {
        if (!tournamentState) return;

        // Calcular totales de arrow scores y X+10s a partir de los sets
        updatedMatch.teamA_arrow_score_total = updatedMatch.sets.reduce((sum, set) => sum + set.teamA_set_total, 0);
        updatedMatch.teamB_arrow_score_total = updatedMatch.sets.reduce((sum, set) => sum + set.teamB_set_total, 0);
        updatedMatch.teamA_x10s_total = updatedMatch.sets.reduce((sum, set) => sum + set.teamA_x10s, 0);
        updatedMatch.teamB_x10s_total = updatedMatch.sets.reduce((sum, set) => sum + set.teamB_x10s, 0);
        
        // Calcular totales de set points desde los sets
        updatedMatch.teamA_set_points_total = updatedMatch.sets.reduce((sum, set) => sum + set.teamA_set_points, 0);
        updatedMatch.teamB_set_points_total = updatedMatch.sets.reduce((sum, set) => sum + set.teamB_set_points, 0);
        
        // Agregar el punto del shoot-off si existe
        if (updatedMatch.isShootOff && updatedMatch.shootOffScore) {
            if (updatedMatch.shootOffScore.teamA_winner === 1) {
                updatedMatch.teamA_set_points_total++;
            }
            if (updatedMatch.shootOffScore.teamB_winner === 1) {
                updatedMatch.teamB_set_points_total++;
            }
        }

        const isGroupMatch = updatedMatch.stage === 'group';
        const matchesKey = isGroupMatch ? 'groupMatches' : 'playoffMatches';
        
        const updatedMatches = tournamentState[matchesKey].map(m => 
            m.id === updatedMatch.id ? updatedMatch : m
        );

        const newState: TournamentState = {
            ...tournamentState,
            [matchesKey]: updatedMatches,
        };
        
        setTournamentState(newState);
        handleCloseScoresheet();
    }, [tournamentState]);

    const handleContinueMatch = useCallback((match: Match) => {
        if (!tournamentState) return;
        
        const updatedMatch: Match = {
            ...match,
            completed: false,
            winner_id: undefined,
        };

        const newState = { ...tournamentState };
        if (tournamentState.stage === 'group') {
            const idx = newState.groupMatches.findIndex(m => m.id === match.id);
            if (idx !== -1) newState.groupMatches[idx] = updatedMatch;
        } else {
            const idx = newState.playoffMatches.findIndex(m => m.id === match.id);
            if (idx !== -1) newState.playoffMatches[idx] = updatedMatch;
        }

        setTournamentState(newState);
    }, [tournamentState]);
    
    const rankingData = useMemo<RankingData[]>(() => {
        if (!tournamentState || tournamentState.stage === 'setup' || !tournamentState.teams.length) return [];
        
        const rankings: RankingData[] = tournamentState.teams.map(team => ({
            teamId: team.id,
            teamName: team.name,
            matchesPlayed: 0,
            wins: 0,
            matchPoints: 0,
            totalArrowScore: 0,
            totalX10s: 0,
            totalArrowsShot: 0,
            arrowAverage: 0,
        }));

        tournamentState.groupMatches.forEach(match => {
            if (!match.completed) return;

            const rankingA = rankings.find(r => r.teamId === match.teamA_id);
            const rankingB = rankings.find(r => r.teamId === match.teamB_id);

            const arrowsShotInMatch = match.sets.reduce((sum, set) => sum + set.teamA_arrows.length + set.teamB_arrows.length, 0);

            if (rankingA) {
                rankingA.matchesPlayed++;
                rankingA.totalArrowScore += match.teamA_arrow_score_total;
                rankingA.totalX10s += match.teamA_x10s_total;
                rankingA.totalArrowsShot += arrowsShotInMatch / 2;
            }
            if (rankingB) {
                rankingB.matchesPlayed++;
                rankingB.totalArrowScore += match.teamB_arrow_score_total;
                rankingB.totalX10s += match.teamB_x10s_total;
                rankingB.totalArrowsShot += arrowsShotInMatch / 2;
            }

            if (match.winner_id === match.teamA_id) {
                rankingA && (rankingA.matchPoints += 2);
                rankingA && (rankingA.wins += 1);
            } else if (match.winner_id === match.teamB_id) {
                rankingB && (rankingB.matchPoints += 2);
                rankingB && (rankingB.wins += 1);
            } else if (match.winner_id === null) { // Tie in group stage, if rules allow
                rankingA && (rankingA.matchPoints += 1);
                rankingB && (rankingB.matchPoints += 1);
            }
        });

        rankings.forEach(r => {
            if (r.totalArrowsShot > 0) {
                r.arrowAverage = r.totalArrowScore / r.totalArrowsShot;
            }
        });

        return rankings.sort((a, b) => {
            if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
            if (b.arrowAverage !== a.arrowAverage) return b.arrowAverage - a.arrowAverage;
            return b.totalX10s - a.totalX10s;
        });

    }, [tournamentState]);

    const handleGenerateFinals = useCallback(() => {
        if (!tournamentState) return;

        const top4 = rankingData.slice(0, 4);
        if (top4.length < 4) {
            setError("Need at least 4 ranked teams to generate finals.");
            return;
        }

        const semi1: Match = {
            id: 101, label: "Semifinal 1", stage: 'semifinal',
            teamA_id: top4[0].teamId, teamB_id: top4[3].teamId,
            sets: [], completed: false, teamA_set_points_total: 0, teamB_set_points_total: 0, teamA_arrow_score_total: 0, teamB_arrow_score_total: 0, teamA_x10s_total: 0, teamB_x10s_total: 0,
        };
        const semi2: Match = {
            id: 102, label: "Semifinal 2", stage: 'semifinal',
            teamA_id: top4[1].teamId, teamB_id: top4[2].teamId,
            sets: [], completed: false, teamA_set_points_total: 0, teamB_set_points_total: 0, teamA_arrow_score_total: 0, teamB_arrow_score_total: 0, teamA_x10s_total: 0, teamB_x10s_total: 0,
        };
        
        setTournamentState({ ...tournamentState, stage: 'playoffs', playoffMatches: [semi1, semi2] });

    }, [tournamentState, rankingData]);

    // Effect to auto-generate final matches after semifinals are complete
    useEffect(() => {
        if (tournamentState?.stage !== 'playoffs') return;

        const semis = tournamentState.playoffMatches.filter(m => m.stage === 'semifinal');
        if (semis.length === 2 && semis.every(m => m.completed)) {
            const finalsExist = tournamentState.playoffMatches.some(m => m.stage === 'gold' || m.stage === 'bronze');
            if (finalsExist) {
                // Check if both finals are completed to mark tournament as finished
                const goldMatch = tournamentState.playoffMatches.find(m => m.stage === 'gold');
                const bronzeMatch = tournamentState.playoffMatches.find(m => m.stage === 'bronze');
                if (goldMatch?.completed && bronzeMatch?.completed && tournamentState.stage !== 'finished') {
                    setTournamentState({ ...tournamentState, stage: 'finished' });
                }
                return;
            }

            const semi1 = semis.find(m => m.id === 101)!;
            const semi2 = semis.find(m => m.id === 102)!;

            const semi1Winner = semi1.winner_id!;
            const semi1Loser = semi1.winner_id === semi1.teamA_id ? semi1.teamB_id : semi1.teamA_id;
            const semi2Winner = semi2.winner_id!;
            const semi2Loser = semi2.winner_id === semi2.teamA_id ? semi2.teamB_id : semi2.teamA_id;

            const goldMatch: Match = {
                id: 201, label: "Gold Medal Match", stage: 'gold',
                teamA_id: semi1Winner, teamB_id: semi2Winner,
                sets: [], completed: false, teamA_set_points_total: 0, teamB_set_points_total: 0, teamA_arrow_score_total: 0, teamB_arrow_score_total: 0, teamA_x10s_total: 0, teamB_x10s_total: 0,
            };
            const bronzeMatch: Match = {
                id: 202, label: "Bronze Medal Match", stage: 'bronze',
                teamA_id: semi1Loser, teamB_id: semi2Loser,
                sets: [], completed: false, teamA_set_points_total: 0, teamB_set_points_total: 0, teamA_arrow_score_total: 0, teamB_arrow_score_total: 0, teamA_x10s_total: 0, teamB_x10s_total: 0,
            };
            
            setTournamentState({ ...tournamentState, playoffMatches: [...tournamentState.playoffMatches, bronzeMatch, goldMatch]});
        }
    }, [tournamentState]);

    const handleResetTournament = useCallback(() => {
        if (window.confirm("Are you sure you want to reset the tournament? All data will be lost.")) {
            const tournamentRef = ref(database, 'tournamentState');
            set(tournamentRef, null);
            setTournamentState(null);
            setActiveMatch(null);
            setIsEditingMatch(false);
            window.history.pushState({}, '', '/');
            setPath('/');
        }
    }, []);
    
    const renderDashboard = () => {
        // Si está mostrando TeamManagement
        if (showTeamManagement) {
            return (
                <TeamManagement
                    registeredTeams={registeredTeams}
                    onSaveTeams={handleSaveRegisteredTeams}
                    onBack={() => setShowTeamManagement(false)}
                />
            );
        }
        
        // Si está mostrando SetupScreen (crear torneo)
        if (showSetupScreen) {
            return (
                <SetupScreen
                    registeredTeams={registeredTeams}
                    onSetupComplete={handleSetupComplete}
                />
            );
        }
        
        // Si no hay torneo, mostrar HomeScreen
        if (!tournamentState) {
            return (
                <HomeScreen
                    registeredTeams={registeredTeams}
                    hasTournament={false}
                    onEnterTournament={() => {}}
                    onCreateTournament={() => setShowSetupScreen(true)}
                    isAdmin={isAdmin}
                />
            );
        }
        
        // Si hay torneo activo, mostrar dashboard correspondiente
        if (tournamentState.stage === 'group') {
             return (
                <Suspense fallback={<LoadingSpinner />}>
                    <Dashboard 
                        tournamentState={tournamentState} 
                        rankingData={rankingData}
                        onOpenScoresheet={handleOpenScoresheet}
                        onContinueMatch={handleContinueMatch}
                        onShowQrCode={handleShowQrCode}
                        onGenerateFinals={handleGenerateFinals}
                        isAdmin={isAdmin}
                    />
                </Suspense>
             );
        }
        if (tournamentState.stage === 'playoffs' || tournamentState.stage === 'finished') {
            return (
                <Suspense fallback={<LoadingSpinner />}>
                    <PlayoffsBracket 
                        teams={tournamentState.teams} 
                        matches={tournamentState.playoffMatches} 
                        onOpenScoresheet={handleOpenScoresheet}
                        onContinueMatch={handleContinueMatch}
                        onShowQrCode={handleShowQrCode}
                        isAdmin={isAdmin}
                    />
                </Suspense>
            );
        }
        return <div className="text-center mt-10">Invalid tournament stage.</div>;
    };

    const renderContent = () => {
        if (path.startsWith('/score/')) {
            const matchId = parseInt(path.split('/score/')[1], 10);
            return (
                <Suspense fallback={<LoadingSpinner />}>
                    <ScorerPage matchId={matchId} />
                </Suspense>
            );
        }
        return renderDashboard();
    };

    const downloadBackup = useCallback(() => {
        const backup = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            tournamentState,
            registeredTeams
        };
        
        const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const date = new Date().toISOString().split('T')[0];
        link.href = url;
        link.download = `archery_backup_${date}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }, [tournamentState, registeredTeams]);

    return (
        <div className="container mx-auto p-2 sm:p-4 lg:p-6 min-h-screen bg-gray-50">
            <header className="my-4 sm:my-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-yellow-600">
                    Archery Tournament Manager
                </h1>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-center sm:justify-end">
                    {tournamentState && path === '/' && (
                        <button
                            onClick={() => setShowAllTeamsModal(true)}
                            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition text-xs sm:text-sm shadow-lg"
                            title="View All Teams"
                        >
                            📋 Teams
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={() => setShowTeamManagement(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition text-xs sm:text-sm shadow-lg"
                            title="Manage Teams"
                        >
                            ⚙️ Equipos
                        </button>
                    )}
                    {!isAdmin ? (
                        <button
                            onClick={() => setShowLoginModal(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition text-xs sm:text-sm shadow-lg"
                            title="Admin Login"
                        >
                            🔒 Admin
                        </button>
                    ) : (
                        <>
                            {tournamentState && (
                                <>
                                    <button
                                        onClick={downloadBackup}
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition text-xs sm:text-sm shadow-lg"
                                        title="Download Backup"
                                    >
                                        💾 Backup
                                    </button>
                                    <button
                                        onClick={handleImportBackup}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition text-xs sm:text-sm shadow-lg"
                                        title="Restore Backup"
                                    >
                                        📂 Restore
                                    </button>
                                    <button
                                        onClick={handleLogout}
                                        className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition text-xs sm:text-sm shadow-lg"
                                        title="Logout"
                                    >
                                        Logout
                                    </button>
                                    <button
                                        onClick={handleResetTournament}
                                        className="bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-4 rounded-lg transition text-xs sm:text-sm shadow-lg"
                                        title="Reset Tournament"
                                    >
                                        Reset
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </header>
            <main>
                {error ? (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-2 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Reload Page
                        </button>
                    </div>
                ) : (
                    renderContent()
                )}
            </main>
            {activeMatch && tournamentState && (
                <Suspense fallback={null}>
                    <ScoresheetModal
                        match={activeMatch}
                        isEditing={isEditingMatch}
                        teamA={tournamentState.teams.find(t => t.id === activeMatch.teamA_id)!}
                        teamB={tournamentState.teams.find(t => t.id === activeMatch.teamB_id)!}
                        onClose={handleCloseScoresheet}
                        onSave={handleSaveMatch}
                    />
                </Suspense>
            )}
            {qrCodeMatch && tournamentState && (
                <Suspense fallback={null}>
                    <QRCodeModal
                        match={qrCodeMatch}
                        teamA={tournamentState.teams.find(t => t.id === qrCodeMatch.teamA_id)!}
                        teamB={tournamentState.teams.find(t => t.id === qrCodeMatch.teamB_id)!}
                        onClose={handleCloseQrCode}
                    />
                </Suspense>
            )}
            
            {/* Modal de Login Admin */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm w-full">
                        <h3 className="text-2xl font-bold mb-4 text-gray-900">Admin Login</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Enter the admin password to edit tournament data
                        </p>
                        <div className="mb-4">
                            <label htmlFor="loginPassword" className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                            <input
                                type="password"
                                id="loginPassword"
                                value={loginPassword}
                                onChange={(e) => {
                                    setLoginPassword(e.target.value);
                                    setLoginError('');
                                }}
                                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                                className="w-full bg-white border-2 border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                                placeholder="Enter admin password"
                                autoFocus
                            />
                            {loginError && (
                                <p className="text-red-600 text-sm mt-2 font-medium">{loginError}</p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    setLoginPassword('');
                                    setLoginError('');
                                }}
                                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded transition"
                            >
                                Cancel
                            </button>
                            {tournamentState?.adminPassword ? (
                                <button
                                    onClick={handleLogin}
                                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition"
                                >
                                    Login
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        if (confirm('This tournament has no admin password. Reset to create a new one?')) {
                                            handleResetTournament();
                                            setShowLoginModal(false);
                                        }
                                    }}
                                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition"
                                >
                                    Reset Tournament
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de All Teams */}
            {showAllTeamsModal && tournamentState && (
                <AllTeamsModal
                    teams={tournamentState.teams}
                    onClose={() => setShowAllTeamsModal(false)}
                />
            )}
        </div>
    );
};

export default App;