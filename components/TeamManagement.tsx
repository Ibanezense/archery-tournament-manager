import React, { useState, useMemo } from 'react';
import type { Team } from '../types';

interface TeamManagementProps {
    registeredTeams: Team[];
    onSaveTeams: (teams: Team[]) => void;
    onBack: () => void;
}

const TeamManagement: React.FC<TeamManagementProps> = ({ registeredTeams, onSaveTeams, onBack }) => {
    const [teams, setTeams] = useState<Team[]>(registeredTeams);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [teamName, setTeamName] = useState('');
    const [memberInput, setMemberInput] = useState('');
    const [members, setMembers] = useState<string[]>([]);
    const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
    const [duplicateWarning, setDuplicateWarning] = useState<string[]>([]);

    const teamColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'];

    // Detectar miembros duplicados
    const checkDuplicateMembers = useMemo(() => {
        const memberCount = new Map<string, string[]>();
        
        teams.forEach(team => {
            if (team.members) {
                team.members.forEach(member => {
                    const normalizedMember = member.toLowerCase().trim();
                    if (!memberCount.has(normalizedMember)) {
                        memberCount.set(normalizedMember, []);
                    }
                    memberCount.get(normalizedMember)!.push(team.name);
                });
            }
        });
        
        const duplicates: string[] = [];
        memberCount.forEach((teamNames, member) => {
            if (teamNames.length > 1) {
                duplicates.push(`${member} (in: ${teamNames.join(', ')})`);
            }
        });
        
        return duplicates;
    }, [teams]);

    const handleAddMember = () => {
        if (memberInput.trim()) {
            setMembers([...members, memberInput.trim()]);
            setMemberInput('');
        }
    };

    const handleRemoveMember = (index: number) => {
        setMembers(members.filter((_, i) => i !== index));
    };

    const handleEditMember = (index: number) => {
        setEditingMemberIndex(index);
    };

    const handleSaveMemberEdit = (index: number, newName: string) => {
        if (newName.trim()) {
            const updatedMembers = [...members];
            updatedMembers[index] = newName.trim();
            setMembers(updatedMembers);
        }
        setEditingMemberIndex(null);
    };

    const handleCancelMemberEdit = () => {
        setEditingMemberIndex(null);
    };

    const handleSaveTeam = () => {
        if (!teamName.trim()) {
            alert('Team name is required');
            return;
        }

        if (editingTeam) {
            // Editando equipo existente
            console.log('Updating team:', editingTeam.id, 'with name:', teamName, 'members:', members);
            const updatedTeams = teams.map(t => 
                t.id === editingTeam.id 
                    ? { ...t, name: teamName.trim(), members: [...members] }
                    : t
            );
            console.log('Updated teams array:', updatedTeams);
            setTeams(updatedTeams);
        } else {
            // Nuevo equipo
            const newTeam: Team = {
                id: teams.length > 0 ? Math.max(...teams.map(t => t.id)) + 1 : 1,
                name: teamName.trim(),
                color: teamColors[teams.length % teamColors.length],
                members: [...members]
            };
            console.log('Adding new team:', newTeam);
            setTeams([...teams, newTeam]);
        }

        // Reset form
        setTeamName('');
        setMembers([]);
        setMemberInput('');
        setEditingTeam(null);
        setShowForm(false);
    };

    const handleEditTeam = (team: Team) => {
        setEditingTeam(team);
        setTeamName(team.name);
        setMembers(team.members || []);
        setShowForm(true);
    };

    const handleDeleteTeam = (teamId: number) => {
        if (confirm('Are you sure you want to delete this team?')) {
            setTeams(teams.filter(t => t.id !== teamId));
        }
    };

    const handleCancel = () => {
        setTeamName('');
        setMembers([]);
        setMemberInput('');
        setEditingTeam(null);
        setShowForm(false);
    };

    return (
        <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-yellow-600">Team Management</h2>
                <button
                    onClick={onBack}
                    className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    ← Back
                </button>
            </div>

            {checkDuplicateMembers.length > 0 && (
                <div className="mb-4 bg-orange-50 border-2 border-orange-400 rounded-lg p-4">
                    <p className="font-bold text-orange-800 mb-2">⚠️ Duplicate Members Detected:</p>
                    <ul className="text-sm text-orange-700 space-y-1">
                        {checkDuplicateMembers.map((dup, idx) => (
                            <li key={idx}>• {dup}</li>
                        ))}
                    </ul>
                </div>
            )}

            {!showForm ? (
                <>
                    <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg"
                        >
                            + Add New Team
                        </button>
                        {teams.length > 0 && (
                            <button
                                onClick={() => {
                                    const csv = [
                                        ['Team', 'Members'],
                                        ...teams.map(team => [
                                            team.name,
                                            team.members ? team.members.join('; ') : 'No members'
                                        ])
                                    ].map(row => row.join(',')).join('\n');
                                    
                                    const blob = new Blob([csv], { type: 'text/csv' });
                                    const link = document.createElement('a');
                                    link.href = URL.createObjectURL(blob);
                                    link.download = `teams_export_${new Date().toISOString().split('T')[0]}.csv`;
                                    link.click();
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg"
                            >
                                📊 Export to CSV
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {teams.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No teams registered yet. Add your first team!</p>
                        ) : (
                            teams.map(team => (
                                <div key={team.id} className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4 hover:border-yellow-400 transition">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div 
                                                    className="w-4 h-4 rounded-full flex-shrink-0" 
                                                    style={{ backgroundColor: team.color }}
                                                />
                                                <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                                            </div>
                                            {team.members && team.members.length > 0 && (
                                                <div className="ml-6">
                                                    <p className="text-sm font-semibold text-gray-600 mb-1">Members:</p>
                                                    <ul className="list-disc list-inside text-sm text-gray-700">
                                                        {team.members.map((member, idx) => (
                                                            <li key={idx}>{member}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <button
                                                onClick={() => handleEditTeam(team)}
                                                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-1 px-3 rounded transition"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDeleteTeam(team.id)}
                                                className="bg-red-600 hover:bg-red-700 text-white text-sm font-bold py-1 px-3 rounded transition"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {teams.length > 0 && (
                        <div className="mt-6">
                            <button
                                onClick={() => {
                                    console.log('Save & Continue clicked with teams:', teams);
                                    onSaveTeams(teams);
                                }}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition shadow-lg"
                            >
                                Save & Continue
                            </button>
                        </div>
                    )}
                </>
            ) : (
                <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900">
                        {editingTeam ? 'Edit Team' : 'Add New Team'}
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Name *</label>
                        <input
                            type="text"
                            value={teamName}
                            onChange={(e) => setTeamName(e.target.value)}
                            placeholder="Enter team name"
                            className="w-full bg-white border-2 border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Team Members</label>
                        <div className="flex gap-2 mb-2">
                            <input
                                type="text"
                                value={memberInput}
                                onChange={(e) => setMemberInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                                placeholder="Enter member name"
                                className="flex-1 bg-white border-2 border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                            <button
                                onClick={handleAddMember}
                                type="button"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-md transition"
                            >
                                Add
                            </button>
                        </div>
                        {members.length > 0 && (
                            <div className="bg-gray-50 border-2 border-gray-200 rounded-md p-3">
                                <p className="text-sm font-semibold text-gray-600 mb-2">Added members:</p>
                                <ul className="space-y-1">
                                    {members.map((member, idx) => (
                                        <li key={idx} className="flex justify-between items-center gap-2 text-sm text-gray-700">
                                            {editingMemberIndex === idx ? (
                                                <>
                                                    <input
                                                        type="text"
                                                        defaultValue={member}
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleSaveMemberEdit(idx, e.currentTarget.value);
                                                            } else if (e.key === 'Escape') {
                                                                handleCancelMemberEdit();
                                                            }
                                                        }}
                                                        className="flex-1 px-2 py-1 border-2 border-yellow-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-600"
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                                            handleSaveMemberEdit(idx, input.value);
                                                        }}
                                                        className="text-xs px-2 py-1 bg-green-600 text-white hover:bg-green-700 rounded transition font-bold"
                                                    >
                                                        ✓
                                                    </button>
                                                    <button
                                                        onClick={handleCancelMemberEdit}
                                                        className="text-xs px-2 py-1 bg-gray-400 text-white hover:bg-gray-500 rounded transition font-bold"
                                                    >
                                                        ✕
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <span>• {member}</span>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleEditMember(idx)}
                                                            className="text-blue-600 hover:text-blue-800 font-bold text-xs"
                                                        >
                                                            ✏️ Edit
                                                        </button>
                                                        <button
                                                            onClick={() => handleRemoveMember(idx)}
                                                            className="text-red-600 hover:text-red-800 font-bold text-xs"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleCancel}
                            className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-900 font-bold py-2 px-4 rounded transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveTeam}
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded transition"
                        >
                            {editingTeam ? 'Update Team' : 'Add Team'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
