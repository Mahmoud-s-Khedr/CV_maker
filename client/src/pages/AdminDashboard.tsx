import React, { useEffect, useState, useMemo } from 'react';
import * as api from '../lib/api';
import { useAuthStore } from '../store/auth';
import { usePDF } from '@react-pdf/renderer';
import { ResumeDocument } from '../components/pdf/ResumeDocument';
import { DUMMY_RESUME } from '../data/dummyResume';
import { PDFPreview } from '../components/editor/PDFPreview';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

interface User {
    id: string;
    email: string;
    role: string;
    isPremium: boolean;
    googleId: string | null;
    createdAt: string;
    isEmailVerified: boolean;
}

interface Log {
    id: string;
    action: string;
    details: any;
    createdAt: string;
    admin: { email: string };
}

interface Template {
    id: string;
    name: string;
    isPremium: boolean;
    thumbnailUrl: string | null;
}

export const AdminDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'users' | 'logs' | 'templates'>('users');
    const [users, setUsers] = useState<User[]>([]);
    const [logs, setLogs] = useState<Log[]>([]);
    const [templates, setTemplates] = useState<Template[]>([]);

    // New Template Form State
    const [newTemplateName, setNewTemplateName] = useState('');
    const initialConfigString = '{\n  "layout": "single-column",\n  "theme": {\n    "primaryColor": "#000000",\n    "secondaryColor": "#666666",\n    "backgroundColor": "#FFFFFF",\n    "textColor": "#333333",\n    "fontFamily": "Helvetica",\n    "fontSize": 10,\n    "lineHeight": 1.5,\n    "margins": { "top": 30, "right": 30, "bottom": 30, "left": 30 }\n  },\n  "header": {\n     "layout": "left",\n     "name": { "fontSize": 20, "fontWeight": "bold" },\n     "title": { "fontSize": 12, "color": "#666666" },\n     "showPhoto": false\n  },\n  "sections": {\n      "experience": {\n          "titleStyle": { "fontSize": 14, "fontWeight": "bold", "textTransform": "uppercase", "marginBottom": 10 },\n          "itemStyle": { \n              "title": { "fontSize": 12, "fontWeight": "bold" },\n              "subtitle": { "fontSize": 10, "fontStyle": "italic" },\n              "date": { "fontSize": 10 },\n              "description": { "fontSize": 10 },\n              "marginBottom": 10\n          },\n          "layout": "list"\n      }\n  }\n}';
    const [newTemplateConfig, setNewTemplateConfig] = useState(initialConfigString);
    const [newTemplatePremium, setNewTemplatePremium] = useState(false);

    // Preview State
    // Initialize with parsed config to avoid initial null/flash
    const [previewConfig, setPreviewConfig] = useState<any>(() => {
        try {
            return JSON.parse(initialConfigString);
        } catch {
            return null;
        }
    });
    const [jsonError, setJsonError] = useState<string | null>(null);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        if (activeTab === 'users') fetchUsers();
        else if (activeTab === 'logs') fetchLogs();
        else if (activeTab === 'templates') fetchTemplates();
    }, [activeTab]);

    // Update preview when config changes
    useEffect(() => {
        try {
            const parsed = JSON.parse(newTemplateConfig);
            setPreviewConfig(parsed);
            setJsonError(null);
        } catch (e) {
            // Don't update previewConfig if JSON is invalid, just set error
            setJsonError('Invalid JSON');
        }
    }, [newTemplateConfig]);

    // PDF Generation Logic
    const pdfDocument = useMemo(() => (
        <ResumeDocument data={DUMMY_RESUME} dynamicConfig={previewConfig} />
    ), [previewConfig]);

    const [instance, updateInstance] = usePDF({ document: pdfDocument });

    useEffect(() => {
        updateInstance(pdfDocument);
    }, [pdfDocument, updateInstance]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await api.getUsers();
            setUsers(data.users);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const data = await api.getAuditLogs();
            setLogs(data.logs);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch logs');
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await api.getTemplates();
            setTemplates(data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to fetch templates');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTemplate = async () => {
        try {
            let config;
            try {
                config = JSON.parse(newTemplateConfig);
            } catch (e) {
                alert('Invalid JSON Config');
                return;
            }

            await api.createTemplate({
                name: newTemplateName,
                config,
                isPremium: newTemplatePremium
            });

            setNewTemplateName('');
            alert('Template created successfully');
            fetchTemplates();
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to create template');
        }
    };

    const handleDeleteUser = async (id: string) => {
        if (!confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete user');
        }
    };

    const handleDeleteTemplate = async (id: string) => {
        if (!confirm('Delete this template? Resumes using it will still keep their saved content, but the template will no longer be selectable.')) return;
        try {
            await api.deleteTemplate(id);
            setTemplates(templates.filter(t => t.id !== id));
        } catch (err: any) {
            alert(err.response?.data?.error || 'Failed to delete template');
        }
    };

    return (
        <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className={`mx-auto ${activeTab === 'templates' ? 'w-full max-w-[98%]' : 'max-w-6xl'}`}>
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setActiveTab('users')}
                            className={`px-4 py-2 rounded-md ${activeTab === 'users' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            Users
                        </button>
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={`px-4 py-2 rounded-md ${activeTab === 'logs' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            Audit Logs
                        </button>
                        <button
                            onClick={() => setActiveTab('templates')}
                            className={`px-4 py-2 rounded-md ${activeTab === 'templates' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                        >
                            Templates
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error} <button onClick={() => setError(null)} className="float-right font-bold">&times;</button>
                    </div>
                )}

                {loading ? (
                    <p className="text-center py-10">Loading...</p>
                ) : (
                    <div className="bg-white shadow rounded-lg overflow-hidden">
                        {activeTab === 'users' && (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map(user => (
                                        <tr key={user.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div>
                                                        <div className="text-sm font-medium text-gray-900">{user.email}</div>
                                                        <div className="text-sm text-gray-500">{user.isEmailVerified ? 'Verified' : 'Unverified'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.isPremium ? '✅' : '❌'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {user.id !== currentUser?.id && (
                                                    <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900">
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {activeTab === 'logs' && (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {logs.map(log => (
                                        <tr key={log.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {log.admin.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {log.action}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                <pre className="text-xs bg-gray-50 p-1 rounded">{JSON.stringify(log.details, null, 2)}</pre>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'templates' && (
                    <div className="space-y-6">
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold mb-4">Create New Template</h2>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                                <div className="space-y-4 flex flex-col h-full">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Template Name</label>
                                        <input
                                            type="text"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border"
                                            value={newTemplateName}
                                            onChange={e => setNewTemplateName(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Is Premium</label>
                                        <input
                                            type="checkbox"
                                            className="mt-1"
                                            checked={newTemplatePremium}
                                            onChange={e => setNewTemplatePremium(e.target.checked)}
                                        />
                                    </div>
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            JSON Config
                                            {jsonError && <span className="text-red-500 ml-2 text-xs">({jsonError})</span>}
                                        </label>
                                        <div className={`mt-1 flex-1 w-full rounded-md shadow-sm border ${jsonError ? 'border-red-500' : 'border-gray-300'} overflow-y-auto`}>
                                            <Editor
                                                value={newTemplateConfig}
                                                onValueChange={code => setNewTemplateConfig(code)}
                                                highlight={code => highlight(code, languages.json, 'json')}
                                                padding={10}
                                                style={{
                                                    fontFamily: '"Fira code", "Fira Mono", monospace',
                                                    fontSize: 12,
                                                    backgroundColor: '#f8f9fa',
                                                    minHeight: '100%'
                                                }}
                                                className="min-h-full"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCreateTemplate}
                                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 w-full"
                                    >
                                        Create Template
                                    </button>
                                </div>

                                <div className="border rounded-md bg-gray-50 flex flex-col h-full overflow-hidden">
                                    <div className="p-2 border-b bg-gray-100 font-medium text-gray-700 text-sm">
                                        Live Preview
                                    </div>
                                    <div className="flex-1 overflow-hidden relative bg-gray-900">
                                        {previewConfig ? (
                                            <PDFPreview
                                                url={instance.url}
                                                loading={instance.loading}
                                                error={instance.error ? new Error(instance.error.toString()) : null}
                                                downloadFileName="preview.pdf"
                                                initialScale={0.8}
                                            />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-white">
                                                Invalid Config
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white shadow rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {templates.map(t => (
                                        <tr key={t.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{t.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{t.isPremium ? '✅' : '❌'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{t.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleDeleteTemplate(t.id)}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
