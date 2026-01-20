import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2, Plus, RefreshCw, User, MapPin, Briefcase, Linkedin, Image as ImageIcon, Lock, Edit2, Upload, FileSpreadsheet, Download } from 'lucide-react';
import { API_URL } from '../config';

const AdminPanel = () => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [authError, setAuthError] = useState("");

    // Data State
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        location: "",
        job_title: "",
        linkedin_url: "",
        image_url: ""
    });
    const [submitting, setSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Import State
    const [activeTab, setActiveTab] = useState('single'); // 'single', 'csv', 'google'
    const [csvFile, setCsvFile] = useState(null);
    const [googleSheetUrl, setGoogleSheetUrl] = useState("");
    const [importStatus, setImportStatus] = useState("");

    useEffect(() => {
        // Check for existing session
        const storedAuth = localStorage.getItem("isAdminAuthenticated");
        if (storedAuth === "true") {
            setIsAuthenticated(true);
            fetchStudents();
        } else {
            setLoading(false); // Stop loading if not auth to show login
        }
    }, []);

    const handleLogin = (e) => {
        e.preventDefault();
        if (username === "ditalumni125" && password === "alumni@dit@123") {
            setIsAuthenticated(true);
            localStorage.setItem("isAdminAuthenticated", "true");
            setAuthError("");
            fetchStudents();
        } else {
            setAuthError("Invalid credentials");
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem("isAdminAuthenticated");
        setUsername("");
        setPassword("");
    };

    const fetchStudents = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_URL}/students`);
            setStudents(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleEdit = (student) => {
        setFormData({
            name: student.name,
            location: student.location,
            job_title: student.job_title,
            linkedin_url: student.linkedin_url || "",
            image_url: student.image_url || ""
        });
        setEditingId(student.id);
    };

    const handleCancelEdit = () => {
        setFormData({
            name: "",
            location: "",
            job_title: "",
            linkedin_url: "",
            image_url: ""
        });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingId) {
                // Update
                await axios.put(`${API_URL}/students/${editingId}`, formData);
            } else {
                // Create
                await axios.post(`${API_URL}/students`, formData);
            }
            
            // Reset form
            handleCancelEdit();
            fetchStudents(); // Refresh list
        } catch (error) {
            alert("Error saving student. Please check the backend.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleCsvUpload = async (e) => {
        e.preventDefault();
        if (!csvFile) return;
        
        const formData = new FormData();
        formData.append("file", csvFile);
        
        setSubmitting(true);
        setImportStatus("Uploading and processing...");
        
        try {
            const res = await axios.post(`${API_URL}/students/upload_csv`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setImportStatus(res.data.message);
            setCsvFile(null);
            fetchStudents();
        } catch (error) {
            setImportStatus("Error uploading CSV: " + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleGoogleSheetImport = async (e) => {
        e.preventDefault();
        if (!googleSheetUrl) return;

        setSubmitting(true);
        setImportStatus("Fetching data from Google Sheets...");

        try {
            const res = await axios.post(`${API_URL}/students/import_google_sheet`, { url: googleSheetUrl });
            setImportStatus(res.data.message);
            setGoogleSheetUrl("");
            fetchStudents();
        } catch (error) {
            setImportStatus("Error importing sheet: " + (error.response?.data?.detail || error.message));
        } finally {
            setSubmitting(false);
        }
    };

    const downloadSampleCsv = () => {
        const csvContent = "name,location,job_title,linkedin_url,image_url\nJohn Doe,New York USA,Software Engineer,https://linkedin.com/in/johndoe,https://example.com/photo.jpg\nJane Smith,London UK,Product Manager,,";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "students_sample.csv";
        a.click();
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this student?")) {
            try {
                await axios.delete(`${API_URL}/students/${id}`);
                fetchStudents();
            } catch (error) {
                console.error(error);
            }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <div className="bg-bis-maroon p-3 rounded-full">
                            <Lock className="w-8 h-8 text-white" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Admin Login</h2>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                placeholder="Enter username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                placeholder="Enter password"
                            />
                        </div>
                        {authError && <p className="text-red-500 text-sm text-center">{authError}</p>}
                        <button
                            type="submit"
                            className="w-full bg-bis-maroon text-white py-2 rounded-lg hover:bg-[#60151c] transition font-medium"
                        >
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Form Section */}
            <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-6 border border-gray-100 h-fit">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-bis-maroon flex items-center">
                        {editingId ? <Edit2 className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                        {editingId ? "Edit Student" : "Add Students"}
                    </h2>
                    <button onClick={handleLogout} className="text-xs text-gray-500 hover:text-red-500 underline">
                        Logout
                    </button>
                </div>

                {/* Tabs */}
                {!editingId && (
                    <div className="flex mb-6 border-b border-gray-200">
                        <button 
                            className={`flex-1 pb-2 text-sm font-medium transition ${activeTab === 'single' ? 'text-bis-maroon border-b-2 border-bis-maroon' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('single')}
                        >
                            Single Entry
                        </button>
                        <button 
                            className={`flex-1 pb-2 text-sm font-medium transition ${activeTab === 'csv' ? 'text-bis-maroon border-b-2 border-bis-maroon' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('csv')}
                        >
                            CSV Import
                        </button>
                        <button 
                            className={`flex-1 pb-2 text-sm font-medium transition ${activeTab === 'google' ? 'text-bis-maroon border-b-2 border-bis-maroon' : 'text-gray-500 hover:text-gray-700'}`}
                            onClick={() => setActiveTab('google')}
                        >
                            Google Sheet
                        </button>
                    </div>
                )}
                
                {activeTab === 'single' && (
                    <form onSubmit={handleSubmit} className="space-y-4 animate-fadeIn">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                required
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                placeholder="e.g. Lasith Gunawardena"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                required
                                name="location"
                                value={formData.location}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                placeholder="City, Country (e.g. London, UK)"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Coordinates will be auto-generated.</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Title / Company</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                required
                                name="job_title"
                                value={formData.job_title}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                placeholder="e.g. Software Engineer at Google"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                        <div className="relative">
                            <Linkedin className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                name="linkedin_url"
                                value={formData.linkedin_url}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                placeholder="https://linkedin.com/in/..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                        <div className="relative">
                            <ImageIcon className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                            <input
                                name="image_url"
                                value={formData.image_url}
                                onChange={handleInputChange}
                                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                placeholder="Direct link to image (jpg/png)"
                            />
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-bis-maroon text-white py-2 rounded-lg hover:bg-[#60151c] transition flex items-center justify-center font-medium"
                        >
                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : (editingId ? <Edit2 className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />)}
                            {editingId ? "Update Student" : "Add to System"}
                        </button>
                        
                        {editingId && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </form>
                )}

                {activeTab === 'csv' && (
                    <form onSubmit={handleCsvUpload} className="space-y-4 animate-fadeIn">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">Instructions</h4>
                            <ul className="text-xs text-blue-700 list-disc list-inside space-y-1">
                                <li>Upload a .csv file</li>
                                <li>Required columns: <b>name</b>, <b>location</b></li>
                                <li>Optional: <b>job_title</b>, <b>linkedin_url</b>, <b>image_url</b></li>
                            </ul>
                            <button type="button" onClick={downloadSampleCsv} className="mt-3 flex items-center text-xs font-medium text-blue-600 hover:underline">
                                <Download className="w-3 h-3 mr-1" /> Download Sample CSV
                            </button>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Select CSV File</label>
                            <input 
                                type="file" 
                                accept=".csv"
                                onChange={(e) => setCsvFile(e.target.files[0])}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-bis-maroon/10 file:text-bis-maroon hover:file:bg-bis-maroon/20"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!csvFile || submitting}
                            className="w-full bg-bis-maroon text-white py-2 rounded-lg hover:bg-[#60151c] transition flex items-center justify-center font-medium disabled:opacity-50"
                        >
                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            Upload & Import
                        </button>
                        {importStatus && <p className="text-sm text-center text-gray-600 mt-2">{importStatus}</p>}
                    </form>
                )}

                {activeTab === 'google' && (
                    <form onSubmit={handleGoogleSheetImport} className="space-y-4 animate-fadeIn">
                         <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                            <h4 className="text-sm font-semibold text-green-800 mb-2">Google Sheets Guide</h4>
                            <ul className="text-xs text-green-700 list-disc list-inside space-y-1 mb-3">
                                <li>Make your Google Sheet <b>Public</b> (Anyone with link can view)</li>
                                <li>Ensure headers match exactly as shown below:</li>
                            </ul>
                            
                            <div className="overflow-x-auto bg-white rounded border border-green-200">
                                <table className="w-full text-xs text-left">
                                    <thead className="bg-green-100 text-green-800">
                                        <tr>
                                            <th className="px-2 py-1 border-r border-green-200">name</th>
                                            <th className="px-2 py-1 border-r border-green-200">location</th>
                                            <th className="px-2 py-1 border-r border-green-200">job_title</th>
                                            <th className="px-2 py-1 border-r border-green-200">linkedin_url</th>
                                            <th className="px-2 py-1">image_url</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-gray-600">
                                        <tr>
                                            <td className="px-2 py-1 border-r border-green-100 border-t">John Doe</td>
                                            <td className="px-2 py-1 border-r border-green-100 border-t">London, UK</td>
                                            <td className="px-2 py-1 border-r border-green-100 border-t">Engineer</td>
                                            <td className="px-2 py-1 border-r border-green-100 border-t">https://...</td>
                                            <td className="px-2 py-1 border-t">https://...</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-[10px] text-green-600 mt-2">Paste the browser URL below (e.g. docs.google.com/spreadsheets/d/...)</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Google Sheet URL</label>
                            <div className="relative">
                                <FileSpreadsheet className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input
                                    required
                                    value={googleSheetUrl}
                                    onChange={(e) => setGoogleSheetUrl(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-bis-maroon focus:outline-none"
                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={!googleSheetUrl || submitting}
                            className="w-full bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition flex items-center justify-center font-medium disabled:opacity-50"
                        >
                            {submitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                            Import from Sheets
                        </button>
                        {importStatus && <p className="text-sm text-center text-gray-600 mt-2">{importStatus}</p>}
                    </form>
                )}
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 border border-gray-100 overflow-hidden flex flex-col">
                <h2 className="text-xl font-bold text-gray-800 mb-6">Registered Alumni ({students.length})</h2>
                
                <div className="overflow-y-auto flex-1 pr-2">
                    {loading ? (
                        <p className="text-gray-500">Loading records...</p>
                    ) : (
                        <div className="space-y-3">
                            {students.map((student) => (
                                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition">
                                    <div className="flex items-center space-x-4">
                                        <img 
                                            src={student.image_url || "https://img.icons8.com/color/96/user-male-circle--v1.png"} 
                                            alt={student.name}
                                            className="w-10 h-10 rounded-full object-cover border border-gray-300"
                                        />
                                        <div>
                                            <h4 className="font-semibold text-gray-900">{student.name}</h4>
                                            <p className="text-sm text-gray-500">{student.job_title} • {student.location}</p>
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button 
                                            onClick={() => handleEdit(student)}
                                            className="text-blue-500 hover:bg-blue-50 p-2 rounded-full transition"
                                            title="Edit"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(student.id)}
                                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                            title="Delete"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {students.length === 0 && (
                                <p className="text-center text-gray-400 py-8">No students found. Add one on the left.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;

