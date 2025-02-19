import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ScrollToTop from "./component/scrollToTop";
import { BackendURL } from "./component/backendURL";

import { Home } from "./pages/home";
import { Demo } from "./pages/demo";
import { Single } from "./pages/single";
import { MainPage } from "./pages/mainPage";
import { Locations } from "./pages/Locations";
import { Forms } from "./pages/Forms";



import injectContext from "./store/appContext";

import { Navbar } from "./component/navbar";
import { Footer } from "./component/footer";
import { FormResponse } from "./component/FormResponse";
import { FormAnswers } from "./component/FormAnswers";

const Layout = () => {
    const basename = process.env.BASENAME || "";

    if(!process.env.BACKEND_URL || process.env.BACKEND_URL == "") return <BackendURL />;

    return (
        <div>
            <BrowserRouter basename={basename}>
                <ScrollToTop>
                    <Navbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/mainPage" element={<MainPage />} />
                        <Route path="/locations" element={<Locations />} />
                        <Route path="/forms" element={<Forms />} />
                        <Route path="/forms/:formId/respond" element={<FormResponse />} />
                        <Route path="/forms/:formId/responses" element={<FormAnswers />} />
                        <Route path="/demo" element={<Demo />} />
                        <Route path="/single/:theid" element={<Single />} />
                        <Route path="*" element={<h1>Not found!</h1>} />
                    </Routes>
                    <Footer />
                </ScrollToTop>
            </BrowserRouter>
        </div>
    );
};

export default injectContext(Layout);
