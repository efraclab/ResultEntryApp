import {
    BrowserRouter,
    Navigate,
    Route,
    Routes,
} from "react-router-dom";

import AdminLoginPage from "./pages/AdminLoginPage";
import ResultEntryPage from "./pages/ResultEntryPage";


function App() {
    return (
        <BrowserRouter>
            <Routes>

                <Route
                    path="/"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

                <Route
                    path="/login"
                    element={
                        <AdminLoginPage />
                    }
                />

                <Route
                    path="/result-entry"
                    element={
                        <ResultEntryPage />
                    }
                />

                <Route
                    path="*"
                    element={
                        <Navigate
                            to="/login"
                            replace
                        />
                    }
                />

            </Routes>
        </BrowserRouter>
    );
}


export default App;