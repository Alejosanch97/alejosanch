import React, { useContext } from "react";
import { Link } from "react-router-dom";
import { Context } from "../store/appContext";
import "../../styles/navbar.css";

export const Navbar = () => {
    const { store, actions } = useContext(Context);

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
            <div className="container">
                <Link className="navbar-brand" to="/">
                    <span className="fs-4">STACK</span>
                </Link>
                
                <button 
                    className="navbar-toggler" 
                    type="button" 
                    data-bs-toggle="collapse" 
                    data-bs-target="#navbarNav" 
                    aria-controls="navbarNav" 
                    aria-expanded="false" 
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                    <ul className="navbar-nav align-items-center">
                        {store.token ? (
                            <>
                                <li className="nav-item">
                                    <Link to="/mainPage" className="btn btn-primary navbar-btn me-2">
                                        Main Page
                                    </Link>
                                </li>
                                <li className="nav-item">
                                    <button
                                        onClick={() => actions.logout()}
                                        className="btn btn-danger navbar-btn btn-logout"
                                    >
                                        Logout
                                    </button>
                                </li>
                            </>
                        ) : null}
                    </ul>
                </div>
            </div>
        </nav>
    );
};
