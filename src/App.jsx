import { Routes, Route } from "react-router-dom";
import SearchPage from "./components/SearchPage.jsx";
import FilmPage from "./components/FilmPage.jsx";
import "./App.css";

function App() {
    return (
        <Routes>
            <Route path="/" element={<SearchPage />} />
            <Route path="/film/:slug" element={<FilmPage />} />
        </Routes>
    );
}

export default App;
