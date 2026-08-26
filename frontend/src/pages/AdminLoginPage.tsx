import {
    type FormEvent,
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import {
    adminLogin,
    validateAdminSession,
} from "../services/ResultEntryService";

import "./AdminLoginPage.css";


export const ADMIN_TOKEN_KEY =
    "result_entry_admin_token";


const AdminLoginPage = () => {

    const navigate =
        useNavigate();


    const [
        username,
        setUsername,
    ] = useState("");


    const [
        password,
        setPassword,
    ] = useState("");


    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    useEffect(() => {

        const checkExistingLogin =
            async () => {

                const token =
                    sessionStorage.getItem(
                        ADMIN_TOKEN_KEY
                    );


                if (!token) {
                    return;
                }


                const valid =
                    await validateAdminSession(
                        token
                    );


                if (valid) {

                    navigate(
                        "/result-entry",
                        {
                            replace: true,
                        }
                    );

                }
                else {

                    sessionStorage.removeItem(
                        ADMIN_TOKEN_KEY
                    );
                }
            };


        void checkExistingLogin();

    }, [navigate]);


    const handleLogin = async (
        event: FormEvent<HTMLFormElement>
    ) => {

        event.preventDefault();


        if (
            !username.trim() ||
            !password
        ) {

            setError(
                "Username and password are required."
            );

            return;
        }


        try {

            setLoading(true);

            setError("");


            const response =
                await adminLogin(
                    username.trim(),
                    password
                );


            sessionStorage.setItem(
                ADMIN_TOKEN_KEY,
                response.token
            );


            navigate(
                "/result-entry",
                {
                    replace: true,
                }
            );

        }
        catch (err: any) {

            setError(
                err?.response
                    ?.data
                    ?.message ||
                "Invalid username or password."
            );

        }
        finally {

            setLoading(false);
        }
    };


    return (
        <div className="admin-login-page">

            <div className="admin-login-card">

                <div className="admin-login-heading">

                    <h1>
                        Result Entry
                    </h1>

                    <p>
                        Administrator Login
                    </p>

                </div>


                {error && (

                    <div className="admin-login-error">
                        {error}
                    </div>

                )}


                <form onSubmit={handleLogin}>

                    <div className="admin-login-field">

                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) =>
                                setUsername(
                                    e.target.value
                                )
                            }
                            autoFocus
                            autoComplete="username"
                        />

                    </div>


                    <div className="admin-login-field">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) =>
                                setPassword(
                                    e.target.value
                                )
                            }
                            autoComplete="current-password"
                        />

                    </div>


                    <button
                        type="submit"
                        className="admin-login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"}

                    </button>

                </form>

            </div>

        </div>
    );
};


export default AdminLoginPage;