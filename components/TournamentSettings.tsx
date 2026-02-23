import React, { useMemo, useState } from 'react';
import type { TournamentConfig } from '../types';

interface TournamentSettingsProps {
    tournamentName: string;
    tournamentDate: string;
    teamsCount: number;
    config: TournamentConfig;
    isAdmin: boolean;
    onBack: () => void;
    onSaveDraft: (data: { name: string; date: string; config: TournamentConfig }) => void;
    onStartTournament: (data: { name: string; date: string; config: TournamentConfig }) => void;
}

const emptyConfig: TournamentConfig = {
    distances: [],
    categories: [],
    divisions: [],
};

const dedupeValues = (values: string[]) => {
    const normalized = new Set<string>();
    const output: string[] = [];
    values.forEach((value) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        const key = trimmed.toLowerCase();
        if (normalized.has(key)) return;
        normalized.add(key);
        output.push(trimmed);
    });
    return output;
};

const TournamentSettings: React.FC<TournamentSettingsProps> = ({
    tournamentName,
    tournamentDate,
    teamsCount,
    config,
    isAdmin,
    onBack,
    onSaveDraft,
    onStartTournament,
}) => {
    const [name, setName] = useState(tournamentName);
    const [date, setDate] = useState(tournamentDate);
    const [draftConfig, setDraftConfig] = useState<TournamentConfig>(config || emptyConfig);
    const [distanceInput, setDistanceInput] = useState('');
    const [categoryInput, setCategoryInput] = useState('');
    const [divisionInput, setDivisionInput] = useState('');

    const canStart = useMemo(() => {
        return (
            name.trim().length > 0 &&
            draftConfig.distances.length > 0 &&
            draftConfig.categories.length > 0 &&
            draftConfig.divisions.length > 0
        );
    }, [name, draftConfig]);

    const addConfigValue = (key: keyof TournamentConfig, value: string, clear: () => void) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        setDraftConfig((prev) => ({
            ...prev,
            [key]: dedupeValues([...prev[key], trimmed]),
        }));
        clear();
    };

    const removeConfigValue = (key: keyof TournamentConfig, index: number) => {
        setDraftConfig((prev) => ({
            ...prev,
            [key]: prev[key].filter((_, i) => i !== index),
        }));
    };

    return (
        <div className="max-w-5xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-xl border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-yellow-600">Tournament Configuration</h2>
                    <p className="text-gray-600 text-sm mt-1">Draft mode: define distances, categories and divisions before starting.</p>
                </div>
                <button
                    onClick={onBack}
                    className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg transition"
                >
                    Back
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tournament Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Tournament name"
                            className="w-full bg-white border-2 border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Tournament Date</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full bg-white border-2 border-gray-300 rounded-md p-3 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                        />
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                        <p className="font-semibold text-gray-900">Selected Teams: {teamsCount}</p>
                        <p className="mt-1">This tournament stays in draft until you press "Start Tournament".</p>
                    </div>
                </div>

                <div className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Distances</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={distanceInput}
                                onChange={(e) => setDistanceInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConfigValue('distances', distanceInput, () => setDistanceInput('')))}
                                placeholder="e.g. 70m"
                                className="flex-1 bg-white border-2 border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                            <button onClick={() => addConfigValue('distances', distanceInput, () => setDistanceInput(''))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-md transition">Add</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {draftConfig.distances.map((value, idx) => (
                                <button key={`${value}-${idx}`} onClick={() => removeConfigValue('distances', idx)} className="bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full hover:bg-blue-200 transition" title="Remove">
                                    {value} ×
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Categories</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={categoryInput}
                                onChange={(e) => setCategoryInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConfigValue('categories', categoryInput, () => setCategoryInput('')))}
                                placeholder="e.g. U18, Senior"
                                className="flex-1 bg-white border-2 border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                            <button onClick={() => addConfigValue('categories', categoryInput, () => setCategoryInput(''))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-md transition">Add</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {draftConfig.categories.map((value, idx) => (
                                <button key={`${value}-${idx}`} onClick={() => removeConfigValue('categories', idx)} className="bg-green-100 text-green-800 text-xs font-semibold px-3 py-1 rounded-full hover:bg-green-200 transition" title="Remove">
                                    {value} ×
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Divisions</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={divisionInput}
                                onChange={(e) => setDivisionInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addConfigValue('divisions', divisionInput, () => setDivisionInput('')))}
                                placeholder="e.g. Recurve, Compound"
                                className="flex-1 bg-white border-2 border-gray-300 rounded-md p-2 text-gray-900 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            />
                            <button onClick={() => addConfigValue('divisions', divisionInput, () => setDivisionInput(''))} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 rounded-md transition">Add</button>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {draftConfig.divisions.map((value, idx) => (
                                <button key={`${value}-${idx}`} onClick={() => removeConfigValue('divisions', idx)} className="bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full hover:bg-purple-200 transition" title="Remove">
                                    {value} ×
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {!isAdmin && (
                <div className="mt-6 p-3 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                    You need admin access to edit tournament configuration.
                </div>
            )}

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => onSaveDraft({ name, date, config: draftConfig })}
                    disabled={!isAdmin}
                    className="flex-1 bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
                >
                    Save Draft
                </button>
                <button
                    onClick={() => onStartTournament({ name, date, config: draftConfig })}
                    disabled={!isAdmin || !canStart}
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition"
                >
                    Start Tournament
                </button>
            </div>
            {!canStart && (
                <p className="mt-2 text-sm text-red-600 text-center">
                    Complete name, distances, categories and divisions to start the tournament.
                </p>
            )}
        </div>
    );
};

export default TournamentSettings;
