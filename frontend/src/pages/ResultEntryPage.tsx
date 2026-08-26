import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import {
    adminLogout,
    getMethodByCode,
    getResultsByRegistration,
    searchMethods,
    searchSpecifications,
    updateResults,
    validateAdminSession,
    type MethodSuggestion,
    type ResultEntry,
    type SpecificationSuggestion,
} from "../services/ResultEntryService";

import "./ResultEntryPage.css";


const ADMIN_TOKEN_KEY =
    "result_entry_admin_token";


interface ResultEditorProps {
    html: string;

    disabled?: boolean;

    onChange:
    (html: string) => void;
}


/* =========================================================
   HELPERS
========================================================= */

const displayValue = (
    value:
        string |
        null |
        undefined
): string => {

    if (
        value == null ||
        value.trim() === ""
    ) {
        return "-";
    }


    return value;
};


const saveValue = (
    value:
        string |
        null |
        undefined
): string => {

    if (
        value == null ||
        value.trim() === ""
    ) {
        return "-";
    }


    return value;
};


const normalizeNabl = (
    value:
        string |
        null |
        undefined
): "Y" | "N" => {

    return (
        value
            ?.trim()
            .toUpperCase() === "Y"
    )
        ? "Y"
        : "N";
};


const isHodReviewed = (
    row: ResultEntry
): boolean => {

    return (
        row.hodReview
            ?.trim()
            .toUpperCase() === "Y"
    );
};


/* =========================================================
   RESULT EDITOR
========================================================= */

const ResultHtmlEditor = ({
    html,
    disabled = false,
    onChange,
}: ResultEditorProps) => {

    const editorRef =
        useRef<HTMLDivElement>(
            null
        );


    useEffect(() => {

        if (!editorRef.current) {
            return;
        }


        if (
            editorRef.current.innerHTML !==
            html
        ) {
            editorRef.current.innerHTML =
                html || "-";
        }

    }, [html]);


    const handleInput = () => {

        if (
            disabled ||
            !editorRef.current
        ) {
            return;
        }


        onChange(
            editorRef.current.innerHTML
        );
    };


    const handleBlur = () => {

        if (
            disabled ||
            !editorRef.current
        ) {
            return;
        }


        const visibleText =
            editorRef.current
                .innerText
                .replace(
                    /\u00A0/g,
                    " "
                )
                .trim();


        if (!visibleText) {

            editorRef.current.innerHTML =
                "-";

            onChange("-");

            return;
        }


        onChange(
            editorRef.current.innerHTML
        );
    };


    return (
        <div
            ref={editorRef}

            className={
                disabled
                    ? "result-editor result-editor-disabled"
                    : "result-editor"
            }

            contentEditable={
                !disabled
            }

            suppressContentEditableWarning

            onInput={
                disabled
                    ? undefined
                    : handleInput
            }

            onBlur={
                disabled
                    ? undefined
                    : handleBlur
            }
        />
    );
};


/* =========================================================
   METHOD SEARCH
========================================================= */

interface MethodSearchBoxProps {
    value: string;

    disabled: boolean;

    onSelect:
    (
        item:
            MethodSuggestion
    ) => void;

    onManualDash:
    () => void;
}


const MethodSearchBox = ({
    value,
    disabled,
    onSelect,
    onManualDash,
}: MethodSearchBoxProps) => {

    const [
        text,
        setText,
    ] = useState(
        value
    );


    const [
        suggestions,
        setSuggestions,
    ] = useState<
        MethodSuggestion[]
    >([]);


    const [
        searching,
        setSearching,
    ] = useState(false);


    const [
        showSuggestions,
        setShowSuggestions,
    ] = useState(false);


    const [
        userTyped,
        setUserTyped,
    ] = useState(false);


    useEffect(() => {

        setText(value);

        setUserTyped(false);

        setSuggestions([]);

        setShowSuggestions(false);

    }, [value]);


    useEffect(() => {

        if (
            disabled ||
            !userTyped
        ) {
            return;
        }


        const searchText =
            text.trim();


        if (
            !searchText ||
            searchText === "-"
        ) {

            setSuggestions([]);

            setShowSuggestions(false);

            return;
        }


        const timer =
            window.setTimeout(
                async () => {

                    try {

                        setSearching(true);


                        const results =
                            await searchMethods(
                                searchText
                            );


                        setSuggestions(
                            results
                        );

                        setShowSuggestions(
                            true
                        );

                    }
                    catch {

                        setSuggestions([]);

                        setShowSuggestions(false);

                    }
                    finally {

                        setSearching(false);
                    }
                },
                300
            );


        return () =>
            window.clearTimeout(
                timer
            );

    }, [
        text,
        disabled,
        userTyped,
    ]);


    return (
        <div className="method-search-wrapper">

            <input
                type="text"

                value={text}

                disabled={disabled}

                placeholder="Search Method"

                onChange={(e) => {

                    const value =
                        e.target.value;


                    setText(value);


                    if (
                        value.trim() === "-"
                    ) {

                        setUserTyped(false);

                        setSuggestions([]);

                        setShowSuggestions(
                            false
                        );

                        onManualDash();

                        return;
                    }


                    setUserTyped(true);

                    setShowSuggestions(true);
                }}

                onBlur={() => {

                    window.setTimeout(
                        () =>
                            setShowSuggestions(
                                false
                            ),
                        150
                    );

                }}
            />


            {searching && (

                <div className="method-search-status">
                    Searching...
                </div>

            )}


            {!disabled &&
                userTyped &&
                showSuggestions &&
                suggestions.length > 0 && (

                    <div className="method-suggestions">

                        {suggestions.map(
                            (item) => (

                                <button
                                    key={
                                        `${item.code}-${item.method}`
                                    }

                                    type="button"

                                    className="method-suggestion-item"

                                    onMouseDown={(e) => {

                                        e.preventDefault();


                                        setText(
                                            item.method
                                        );

                                        setUserTyped(false);

                                        setSuggestions([]);

                                        setShowSuggestions(
                                            false
                                        );

                                        onSelect(item);
                                    }}
                                >

                                    <span className="suggestion-method">
                                        {item.method}
                                    </span>

                                    <span className="suggestion-code">
                                        {item.code}
                                    </span>

                                </button>

                            )
                        )}

                    </div>

                )}

        </div>
    );
};


/* =========================================================
   SPEC SEARCH
========================================================= */

interface SpecSearchProps {
    value: string;

    disabled: boolean;

    onSelect:
    (
        item:
            SpecificationSuggestion
    ) => void;
}


const SpecificationSearchBox = ({
    value,
    disabled,
    onSelect,
}: SpecSearchProps) => {

    const [
        text,
        setText,
    ] = useState(value);


    const [
        suggestions,
        setSuggestions,
    ] = useState<
        SpecificationSuggestion[]
    >([]);


    const [
        userTyped,
        setUserTyped,
    ] = useState(false);


    const [
        searching,
        setSearching,
    ] = useState(false);


    const [
        showSuggestions,
        setShowSuggestions,
    ] = useState(false);


    useEffect(() => {

        setText(value);

        setUserTyped(false);

        setSuggestions([]);

        setShowSuggestions(false);

    }, [value]);


    useEffect(() => {

        if (
            disabled ||
            !userTyped
        ) {
            return;
        }


        const searchText =
            text.trim();


        if (
            !searchText ||
            searchText === "-"
        ) {

            setSuggestions([]);

            setShowSuggestions(false);

            return;
        }


        const timer =
            window.setTimeout(
                async () => {

                    try {

                        setSearching(true);


                        const result =
                            await searchSpecifications(
                                searchText
                            );


                        setSuggestions(result);

                        setShowSuggestions(
                            true
                        );

                    }
                    catch {

                        setSuggestions([]);

                        setShowSuggestions(false);

                    }
                    finally {

                        setSearching(false);
                    }
                },
                300
            );


        return () =>
            window.clearTimeout(
                timer
            );

    }, [
        text,
        disabled,
        userTyped,
    ]);


    return (
        <div className="spec-search-wrapper">

            <input
                type="text"

                value={text}

                disabled={disabled}

                placeholder="Search Spec"

                onChange={(e) => {

                    setText(
                        e.target.value
                    );

                    setUserTyped(true);

                    setShowSuggestions(
                        true
                    );
                }}

                onBlur={() => {

                    window.setTimeout(
                        () =>
                            setShowSuggestions(
                                false
                            ),
                        150
                    );

                }}
            />


            {searching && (

                <div className="spec-search-status">
                    Searching...
                </div>

            )}


            {!disabled &&
                userTyped &&
                showSuggestions &&
                suggestions.length > 0 && (

                    <div className="spec-suggestions">

                        {suggestions.map(
                            (
                                item,
                                index
                            ) => (

                                <button
                                    key={
                                        `${item.specName}-${index}`
                                    }

                                    type="button"

                                    className="spec-suggestion-item"

                                    onMouseDown={(e) => {

                                        e.preventDefault();


                                        setText(
                                            item.specName
                                        );

                                        setUserTyped(false);

                                        setSuggestions([]);

                                        setShowSuggestions(
                                            false
                                        );

                                        onSelect(item);
                                    }}
                                >
                                    {item.specName}
                                </button>

                            )
                        )}

                    </div>

                )}

        </div>
    );
};


/* =========================================================
   PAGE
========================================================= */

const ResultEntryPage = () => {

    const navigate =
        useNavigate();


    const [
        searchParams,
    ] = useSearchParams();


    const registrationFromUrl =
        searchParams
            .get("registrationNo")
            ?.trim() || "";


    const userIdFromUrl =
        searchParams
            .get("userId")
            ?.trim() || "";


    const labCodeFromUrl =
        searchParams
            .get("labCode")
            ?.trim() || "";


    const hasAnyExternalArgument =
        !!registrationFromUrl ||
        !!userIdFromUrl ||
        !!labCodeFromUrl;


    const hasCompleteExternalArguments =
        !!registrationFromUrl &&
        !!userIdFromUrl &&
        !!labCodeFromUrl;


    const [
        adminToken,
        setAdminToken,
    ] = useState(
        sessionStorage.getItem(
            ADMIN_TOKEN_KEY
        ) || ""
    );


    const [
        isAdmin,
        setIsAdmin,
    ] = useState(false);


    const [
        accessChecking,
        setAccessChecking,
    ] = useState(true);


    const [
        registrationNo,
        setRegistrationNo,
    ] = useState(
        registrationFromUrl
    );


    const [
        rows,
        setRows,
    ] = useState<ResultEntry[]>([]);


    const [
        originalRows,
        setOriginalRows,
    ] = useState<ResultEntry[]>([]);


    const [
        loading,
        setLoading,
    ] = useState(false);


    const [
        saving,
        setSaving,
    ] = useState(false);


    const [
        error,
        setError,
    ] = useState("");


    const [
        message,
        setMessage,
    ] = useState("");


    const [
        methodLookupIndex,
        setMethodLookupIndex,
    ] = useState<
        number | null
    >(null);


    /* =====================================================
       ACCESS VALIDATION
    ===================================================== */

    useEffect(() => {

        const checkAccess =
            async () => {

                /*
                 * Partial external link.
                 */
                if (
                    hasAnyExternalArgument &&
                    !hasCompleteExternalArguments
                ) {

                    navigate(
                        "/login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }


                /*
                 * Valid external link.
                 */
                if (
                    hasCompleteExternalArguments
                ) {

                    setIsAdmin(false);

                    setAccessChecking(false);

                    return;
                }


                /*
                 * No URL args.
                 *
                 * Must be admin.
                 */
                if (!adminToken) {

                    navigate(
                        "/login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }


                const valid =
                    await validateAdminSession(
                        adminToken
                    );


                if (!valid) {

                    sessionStorage.removeItem(
                        ADMIN_TOKEN_KEY
                    );

                    setAdminToken("");

                    navigate(
                        "/login",
                        {
                            replace: true,
                        }
                    );

                    return;
                }


                setIsAdmin(true);

                setAccessChecking(false);
            };


        void checkAccess();

    }, [
        adminToken,
        hasAnyExternalArgument,
        hasCompleteExternalArguments,
        navigate,
    ]);


    /* =====================================================
       LOAD
    ===================================================== */

    const loadRegistration =
        async (
            value?: string
        ) => {

            const regNo =
                (
                    value ||
                    registrationNo
                ).trim();


            if (!regNo) {

                setError(
                    "Registration number is required."
                );

                return;
            }


            try {

                setLoading(true);

                setError("");

                setMessage("");


                const data =
                    await getResultsByRegistration(
                        regNo,

                        isAdmin
                            ? undefined
                            : labCodeFromUrl,

                        isAdmin
                            ? adminToken
                            : undefined
                    );


                const normalized =
                    data.map(
                        (row) => ({

                            registrationNo:
                                displayValue(
                                    row.registrationNo
                                ),

                            testCode:
                                displayValue(
                                    row.testCode
                                ),

                            labCode:
                                displayValue(
                                    row.labCode
                                ),

                            methodCode:
                                displayValue(
                                    row.methodCode
                                ),

                            method:
                                displayValue(
                                    row.method
                                ),

                            unit:
                                displayValue(
                                    row.unit
                                ),

                            instrument:
                                displayValue(
                                    row.instrument
                                ),

                            loq:
                                displayValue(
                                    row.loq
                                ),

                            result:
                                displayValue(
                                    row.result
                                ),

                            nabl:
                                normalizeNabl(
                                    row.nabl
                                ),

                            spec:
                                displayValue(
                                    row.spec
                                ),

                            refMethod:
                                displayValue(
                                    row.refMethod
                                ),

                            hodReview:
                                displayValue(
                                    row.hodReview
                                ),
                        })
                    );


                setRows(normalized);


                setOriginalRows(
                    JSON.parse(
                        JSON.stringify(
                            normalized
                        )
                    )
                );


                setRegistrationNo(
                    regNo
                );

            }
            catch (err: any) {

                setRows([]);

                setOriginalRows([]);


                setError(
                    err?.response
                        ?.data
                        ?.message ||
                    "Unable to load registration."
                );

            }
            finally {

                setLoading(false);
            }
        };


    /*
     * External user auto-load.
     */
    useEffect(() => {

        if (
            accessChecking ||
            isAdmin ||
            !hasCompleteExternalArguments
        ) {
            return;
        }


        setRegistrationNo(
            registrationFromUrl
        );


        void loadRegistration(
            registrationFromUrl
        );

    }, [
        accessChecking,
        isAdmin,
        hasCompleteExternalArguments,
        registrationFromUrl,
    ]);


    /* =====================================================
       CHANGE
    ===================================================== */

    const handleChange = (
        index: number,
        field: keyof ResultEntry,
        value: string
    ) => {

        setRows(
            (previous) =>
                previous.map(
                    (
                        row,
                        rowIndex
                    ) => {

                        if (
                            rowIndex !== index ||
                            isHodReviewed(row)
                        ) {
                            return row;
                        }


                        return {
                            ...row,

                            [field]:
                                value,
                        };
                    }
                )
        );
    };


    /* =====================================================
       M CODE
    ===================================================== */

    const handleMethodCodeInput =
        (
            index: number,
            value: string
        ) => {

            handleChange(
                index,
                "methodCode",
                value
            );


            /*
             * '-' is valid.
             */
            if (
                value.trim() === "-"
            ) {

                handleChange(
                    index,
                    "method",
                    "-"
                );

                return;
            }


            /*
             * Remove old Method.
             */
            handleChange(
                index,
                "method",
                "-"
            );
        };


    const handleMethodCodeBlur =
        async (
            index: number
        ) => {

            const row =
                rows[index];


            if (
                !row ||
                isHodReviewed(row)
            ) {
                return;
            }


            const code =
                row.methodCode
                    .trim();


            if (
                !code ||
                code === "-"
            ) {

                handleChange(
                    index,
                    "methodCode",
                    "-"
                );

                handleChange(
                    index,
                    "method",
                    "-"
                );

                return;
            }


            try {

                setMethodLookupIndex(
                    index
                );


                const method =
                    await getMethodByCode(
                        code
                    );


                handleChange(
                    index,
                    "method",
                    method || "-"
                );

                setError("");

            }
            catch (err: any) {

                handleChange(
                    index,
                    "method",
                    "-"
                );


                setError(
                    err?.response
                        ?.data
                        ?.message ||
                    `No Method found for M Code: ${code}`
                );

            }
            finally {

                setMethodLookupIndex(
                    null
                );
            }
        };


    /* =====================================================
       MODIFIED
    ===================================================== */

    const isModified = (
        row: ResultEntry,
        index: number
    ) => {

        if (
            isHodReviewed(row)
        ) {
            return false;
        }


        const original =
            originalRows[index];


        if (!original) {
            return false;
        }


        return (
            row.methodCode !==
            original.methodCode ||

            row.method !==
            original.method ||

            row.unit !==
            original.unit ||

            row.instrument !==
            original.instrument ||

            row.loq !==
            original.loq ||

            row.result !==
            original.result ||

            row.nabl !==
            original.nabl ||

            row.spec !==
            original.spec ||

            row.refMethod !==
            original.refMethod
        );
    };


    const modifiedRowsCount =
        useMemo(
            () =>
                rows.filter(
                    (row, index) =>
                        isModified(
                            row,
                            index
                        )
                ).length,

            [
                rows,
                originalRows,
            ]
        );


    /* =====================================================
       CANCEL
    ===================================================== */

    const handleCancel = () => {

        if (
            modifiedRowsCount === 0
        ) {
            return;
        }


        if (
            !window.confirm(
                "Cancel all unsaved changes?"
            )
        ) {
            return;
        }


        setRows(
            JSON.parse(
                JSON.stringify(
                    originalRows
                )
            )
        );


        setMessage(
            "Unsaved changes have been cancelled."
        );


        setError("");
    };


    /* =====================================================
       SAVE
    ===================================================== */

    const handleSave =
        async () => {

            if (
                methodLookupIndex !== null
            ) {

                setError(
                    "Please wait for Method lookup to complete."
                );

                return;
            }


            if (
                document.activeElement
                instanceof HTMLElement
            ) {

                document
                    .activeElement
                    .blur();
            }


            await new Promise<void>(
                (resolve) =>
                    setTimeout(
                        resolve,
                        0
                    )
            );


            const changedRows =
                rows.filter(
                    (row, index) =>
                        isModified(
                            row,
                            index
                        )
                );


            if (
                changedRows.length === 0
            ) {

                setMessage(
                    "No changes to save."
                );

                return;
            }


            /*
             * This is valid:
             *
             * M Code = -
             * Method = -
             */
            const invalidMethod =
                changedRows.find(
                    (row) =>
                        (
                            row.methodCode
                                .trim() === "-"
                        ) !==
                        (
                            row.method
                                .trim() === "-"
                        )
                );


            if (invalidMethod) {

                setError(
                    `M Code and Method must match for Test Code ${invalidMethod.testCode}.`
                );

                return;
            }


            if (
                !window.confirm(
                    `Save ${changedRows.length} changed row(s)?`
                )
            ) {
                return;
            }


            try {

                setSaving(true);

                setError("");

                setMessage("");


                await updateResults(
                    registrationNo,

                    isAdmin
                        ? "admin"
                        : userIdFromUrl,

                    isAdmin
                        ? ""
                        : labCodeFromUrl,

                    changedRows.map(
                        (row) => ({

                            testCode:
                                row.testCode,

                            /*
                             * Important for admin.
                             */
                            labCode:
                                row.labCode,

                            methodCode:
                                saveValue(
                                    row.methodCode
                                ),

                            method:
                                saveValue(
                                    row.method
                                ),

                            unit:
                                saveValue(
                                    row.unit
                                ),

                            instrument:
                                saveValue(
                                    row.instrument
                                ),

                            loq:
                                saveValue(
                                    row.loq
                                ),

                            result:
                                saveValue(
                                    row.result
                                ),

                            nabl:
                                normalizeNabl(
                                    row.nabl
                                ),

                            spec:
                                saveValue(
                                    row.spec
                                ),

                            refMethod:
                                saveValue(
                                    row.refMethod
                                ),
                        })
                    ),

                    isAdmin
                        ? adminToken
                        : undefined
                );


                await loadRegistration(
                    registrationNo
                );


                setMessage(
                    "Changes saved successfully."
                );

            }
            catch (err: any) {

                setError(
                    err?.response
                        ?.data
                        ?.message ||
                    "Unable to save changes."
                );

            }
            finally {

                setSaving(false);
            }
        };

    const handleLogout = async () => {

        if (
            !window.confirm(
                "Are you sure you want to logout?"
            )
        ) {
            return;
        }

        try {

            if (adminToken) {
                await adminLogout(adminToken);
            }

        }
        catch (error) {

            console.error(
                "Admin logout request failed:",
                error
            );

        }
        finally {

            sessionStorage.removeItem(
                ADMIN_TOKEN_KEY
            );

            setAdminToken("");

            setIsAdmin(false);

            navigate(
                "/login",
                {
                    replace: true,
                }
            );
        }
    };


    /* =====================================================
       BACK
    ===================================================== */

    const handleBack = () => {

        window.close();


        window.setTimeout(
            () => {

                if (!window.closed) {

                    window.history.back();
                }

            },
            150
        );
    };


    if (accessChecking) {

        return (
            <div className="loading-message">
                Checking access...
            </div>
        );
    }


    return (
        <div className="result-entry-page">

            <header className="efrac-banner">

                <img
                    src="/efrac-header.jpg"
                    alt="EFRAC"
                />

            </header>


            <div className="top-action-bar">

                {isAdmin && (

                    <span className="admin-mode-label">
                        Admin Mode
                    </span>

                )}

                {isAdmin && (

                    <button
                        type="button"
                        className="logout-button"
                        onClick={() =>
                            void handleLogout()
                        }
                    >
                        Logout
                    </button>

                )}

                <button
                    type="button"
                    className="back-button"
                    onClick={handleBack}
                >
                    Back
                </button>

            </div>


            {/* ADMIN MANUAL SEARCH */}

            {isAdmin && (

                <div className="registration-loader">

                    <label>
                        Registration No.
                    </label>


                    <input
                        type="text"
                        value={registrationNo}
                        onChange={(e) =>
                            setRegistrationNo(
                                e.target.value
                            )
                        }
                        onKeyDown={(e) => {

                            if (
                                e.key ===
                                "Enter"
                            ) {
                                void loadRegistration();
                            }

                        }}
                    />


                    <button
                        type="button"
                        disabled={loading}
                        onClick={() =>
                            void loadRegistration()
                        }
                    >
                        {loading
                            ? "Loading..."
                            : "Load"}
                    </button>

                </div>

            )}


            {loading && (

                <div className="loading-message">
                    Loading registration data...
                </div>

            )}


            {error && (

                <div className="error-message">
                    {error}
                </div>

            )}


            {!loading &&
                message && (

                    <div className="success-message">
                        {message}
                    </div>

                )}


            {rows.length > 0 && (

                <>

                    <div className="table-scroll">

                        <table className="result-table">

                            <thead>

                                <tr>
                                    <th>Sample ID</th>
                                    <th>Test Code</th>
                                    <th>M Code</th>
                                    <th>Method</th>
                                    <th>Unit</th>
                                    <th>Instrument</th>
                                    <th>LOQ</th>
                                    <th>Result</th>
                                    <th>NABL</th>
                                    <th>Spec</th>
                                    <th>Ref Method</th>
                                </tr>

                            </thead>


                            <tbody>

                                {rows.map(
                                    (
                                        row,
                                        index
                                    ) => {

                                        const reviewed =
                                            isHodReviewed(
                                                row
                                            );


                                        const lookingMethod =
                                            methodLookupIndex ===
                                            index;


                                        return (

                                            <tr
                                                key={
                                                    `${row.registrationNo}-${row.labCode}-${row.testCode}-${index}`
                                                }

                                                className={
                                                    reviewed
                                                        ? "reviewed-row"
                                                        : isModified(
                                                            row,
                                                            index
                                                        )
                                                            ? "modified-row"
                                                            : ""
                                                }
                                            >

                                                <td className="readonly-cell sample-id-cell">
                                                    {row.registrationNo}
                                                </td>


                                                <td className="readonly-cell test-code-cell">
                                                    {row.testCode}
                                                </td>


                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.methodCode
                                                        }

                                                        disabled={
                                                            reviewed ||
                                                            lookingMethod
                                                        }

                                                        onChange={(e) =>
                                                            handleMethodCodeInput(
                                                                index,
                                                                e.target.value
                                                            )
                                                        }

                                                        onBlur={() =>
                                                            void handleMethodCodeBlur(
                                                                index
                                                            )
                                                        }
                                                    />

                                                </td>


                                                <td>

                                                    {lookingMethod
                                                        ? (

                                                            <input
                                                                type="text"
                                                                value="Loading..."
                                                                readOnly
                                                                className="auto-filled-input"
                                                            />

                                                        )
                                                        : (

                                                            <MethodSearchBox
                                                                value={
                                                                    row.method
                                                                }

                                                                disabled={
                                                                    reviewed
                                                                }

                                                                onManualDash={() => {

                                                                    handleChange(
                                                                        index,
                                                                        "method",
                                                                        "-"
                                                                    );

                                                                    handleChange(
                                                                        index,
                                                                        "methodCode",
                                                                        "-"
                                                                    );
                                                                }}

                                                                onSelect={(selected) => {

                                                                    handleChange(
                                                                        index,
                                                                        "method",
                                                                        selected.method
                                                                    );

                                                                    handleChange(
                                                                        index,
                                                                        "methodCode",
                                                                        selected.code
                                                                    );

                                                                    setError("");
                                                                }}
                                                            />

                                                        )}

                                                </td>


                                                <td>

                                                    <input
                                                        type="text"
                                                        value={row.unit}
                                                        disabled={reviewed}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "unit",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                <td>

                                                    <input
                                                        type="text"
                                                        value={row.instrument}
                                                        disabled={reviewed}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "instrument",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                <td>

                                                    <input
                                                        type="text"
                                                        value={row.loq}
                                                        disabled={reviewed}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "loq",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                <td className="result-cell">

                                                    <ResultHtmlEditor
                                                        html={row.result}
                                                        disabled={reviewed}
                                                        onChange={(html) =>
                                                            handleChange(
                                                                index,
                                                                "result",
                                                                html
                                                            )
                                                        }
                                                    />

                                                </td>


                                                <td>

                                                    <select
                                                        value={
                                                            normalizeNabl(
                                                                row.nabl
                                                            )
                                                        }

                                                        disabled={reviewed}

                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "nabl",
                                                                e.target.value
                                                            )
                                                        }
                                                    >

                                                        <option value="N">
                                                            N
                                                        </option>

                                                        <option value="Y">
                                                            Y
                                                        </option>

                                                    </select>

                                                </td>


                                                <td>

                                                    <SpecificationSearchBox
                                                        value={row.spec}

                                                        disabled={
                                                            reviewed
                                                        }

                                                        onSelect={(selected) => {

                                                            handleChange(
                                                                index,
                                                                "spec",
                                                                selected.specName
                                                            );

                                                            setError("");
                                                        }}
                                                    />

                                                </td>


                                                <td>

                                                    <input
                                                        type="text"
                                                        value={row.refMethod}
                                                        disabled={reviewed}
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "refMethod",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>

                                            </tr>

                                        );
                                    }
                                )}

                            </tbody>

                        </table>

                    </div>


                    <div className="save-area">

                        <div className="change-info">

                            {modifiedRowsCount > 0
                                ? `${modifiedRowsCount} row(s) modified`
                                : ""}

                        </div>


                        <button
                            type="button"
                            className="cancel-button"
                            disabled={
                                saving ||
                                modifiedRowsCount === 0
                            }
                            onClick={
                                handleCancel
                            }
                        >
                            Cancel Changes
                        </button>


                        <button
                            type="button"
                            className="save-button"
                            disabled={
                                saving ||
                                methodLookupIndex !== null ||
                                modifiedRowsCount === 0
                            }
                            onClick={() =>
                                void handleSave()
                            }
                        >
                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>

                    </div>

                </>

            )}

        </div>
    );
};


export default ResultEntryPage;