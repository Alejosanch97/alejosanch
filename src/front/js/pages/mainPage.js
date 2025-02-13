import React, { useContext, useEffect, useState } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import "../../styles/Mainpage.css";

export const MainPage = () => {
    const { store, actions } = useContext(Context);
    const navigate = useNavigate();
    const [profileImage, setProfileImage] = useState(null);
    const [userData, setUserData] = useState(null);

    // Sample data for the chart
    const activityData = [
        { name: 'Ene', value: 65 },
        { name: 'Feb', value: 59 },
        { name: 'Mar', value: 80 },
        { name: 'Abr', value: 81 },
        { name: 'May', value: 56 },
        { name: 'Jun', value: 55 },
    ];

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // Protect the route
    useEffect(() => {
        const checkAuthAndLoadUser = async () => {
            try {
                // Check if we have a token
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/");
                    return;
                }

                // Get user data from localStorage
                const storedUser = JSON.parse(localStorage.getItem("currentUser"));
                console.log("Stored user data:", storedUser);
                if (storedUser) {
                    setUserData(storedUser);
                }
            } catch (error) {
                console.error("Error loading user data:", error);
                navigate("/");
            }
        };

        checkAuthAndLoadUser();
    }, [navigate]);

    const handleLogout = () => {
        actions.logout();
        navigate("/");
    };

    return (
        <div className="dashboard-container">
            {/* Sidebar */}
            <div className="sidebar">
                <div className="profile-section">
                    <div className="profile-image-container">
                        <img 
                            src={profileImage || "https://i.pinimg.com/474x/ec/0e/f1/ec0ef171d9c4606b76c4a6217461409a.jpg"} 
                            alt="Profile" 
                            className="profile-image"
                        />
                        <div className="upload-overlay">
                            <input 
                                type="file" 
                                onChange={handleImageUpload} 
                                className="file-input"
                                accept="image/*"
                            />
                            <i className="fas fa-camera"></i>
                        </div>
                    </div>
                    {userData && (
                        <>
                            <h3 className="mt-3 text-white">
                                {userData.first_name} {userData.last_name}
                            </h3>
                            <p className="text-muted">@{userData.role || userData.email}</p>
                        </>
                    )}
                    <div className="menu-section">
                        <div className="menu-item">
                            <i className="fas fa-user"></i>
                            <span>Perfil</span>
                        </div>
                        <div className="menu-item">
                            <i className="fas fa-chart-pie"></i>
                            <span>Dashboard</span>
                        </div>
                        <div className="menu-item" onClick={() => navigate('/forms')}>
                            <i className="fas fa-file-alt"></i>
                            <span>Formatos</span>
                        </div>
                        <div className="menu-item" onClick={() => navigate('/locations')}>
                            <i className="fas fa-map-marker-alt"></i>
                            <span>Locaciones</span>
                        </div>
                        <div className="menu-item">
                            <i className="fas fa-cog"></i>
                            <span>Settings</span>
                        </div>
                    </div>

                    <button onClick={handleLogout} className="btn btn-danger mt-4">
                        <i className="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <div className="dashboard-header">
                    <h2>Dashboard Overview</h2>
                    <div className="date-range">
                        <i className="far fa-calendar"></i>
                        <span>Last 6 months</span>
                    </div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <h4>Activity Overview</h4>
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height={200}>
                                <LineChart data={activityData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="value" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <h4>Recent Projects</h4>
                        <div className="project-list">
                            <div className="project-item">
                                <div className="project-info">
                                    <h5>Website Redesign</h5>
                                    <div className="progress">
                                        <div className="progress-bar bg-success" style={{width: '75%'}}></div>
                                    </div>
                                </div>
                                <span className="badge bg-success">75%</span>
                            </div>
                            <div className="project-item">
                                <div className="project-info">
                                    <h5>Mobile App</h5>
                                    <div className="progress">
                                        <div className="progress-bar bg-warning" style={{width: '45%'}}></div>
                                    </div>
                                </div>
                                <span className="badge bg-warning">45%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};