import { BrowserRouter, Routes, Route } from "react-router-dom";
import ResultEntryPage from "./pages/ResultEntryPage";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<ResultEntryPage />}
                />

                <Route
                    path="/result-entry"
                    element={<ResultEntryPage />}
                />
            </Routes>
        </BrowserRouter>
    );
}

export default App;