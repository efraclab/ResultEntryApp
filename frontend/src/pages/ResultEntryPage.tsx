import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useSearchParams,
} from "react-router-dom";

import {
    getMethodByCode,
    getResultsByRegistration,
    searchMethods,
    updateResults,
    type MethodSuggestion,
    type ResultEntry,
} from "../services/ResultEntryService";

import "./ResultEntryPage.css";


/* =========================================================
   PROPS
========================================================= */

interface Props {
    registrationNo?: string;
}


/* =========================================================
   RESULT EDITOR
========================================================= */

interface ResultEditorProps {
    html: string;
    disabled?: boolean;
    onChange: (html: string) => void;
}


const ResultHtmlEditor = ({
    html,
    disabled = false,
    onChange,
}: ResultEditorProps) => {
    const editorRef =
        useRef<HTMLDivElement>(null);


    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        const incomingHtml =
            html || "";

        if (
            editorRef.current.innerHTML !==
            incomingHtml
        ) {
            editorRef.current.innerHTML =
                incomingHtml;
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

        let updatedHtml =
            editorRef.current.innerHTML;

        const visibleText =
            editorRef.current.innerText
                .replace(
                    /\u00A0/g,
                    " "
                )
                .trim();

        if (
            visibleText === "" ||
            updatedHtml.trim() === ""
        ) {
            updatedHtml = "-";

            editorRef.current.innerHTML =
                "-";
        }

        onChange(
            updatedHtml
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
            title={
                disabled
                    ? "HOD review completed. Editing is locked."
                    : ""
            }
        />
    );
};


/* =========================================================
   METHOD SEARCH BOX
========================================================= */

interface MethodSearchBoxProps {
    value: string;
    disabled: boolean;

    onSelect: (
        method: MethodSuggestion
    ) => void;
}


const MethodSearchBox = ({
    value,
    disabled,
    onSelect,
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
        showSuggestions,
        setShowSuggestions,
    ] = useState(false);


    const [
        searching,
        setSearching,
    ] = useState(false);


    /*
     * IMPORTANT:
     *
     * Search should NOT run when page loads
     * and Method value comes from database.
     *
     * Search starts only after user types.
     */
    const [
        hasUserTyped,
        setHasUserTyped,
    ] = useState(false);


    /*
     * When Method changes externally:
     *
     * Example:
     * M Code 6174
     *      ↓
     * Method becomes ATP-CMSS
     *
     * Update textbox but DON'T search.
     */
    useEffect(() => {

        setText(
            value
        );

        setHasUserTyped(
            false
        );

        setSuggestions([]);

        setShowSuggestions(
            false
        );

    }, [value]);


    /*
     * Search only after user has typed.
     */
    useEffect(() => {

        if (
            disabled ||
            !hasUserTyped
        ) {
            return;
        }


        const searchText =
            text.trim();


        if (
            searchText === "" ||
            searchText === "-"
        ) {
            setSuggestions([]);

            setShowSuggestions(
                false
            );

            return;
        }


        const timer =
            setTimeout(
                async () => {

                    try {

                        setSearching(
                            true
                        );


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
                    catch (error) {

                        console.error(
                            "Method search failed:",
                            error
                        );


                        setSuggestions([]);

                        setShowSuggestions(
                            false
                        );

                    }
                    finally {

                        setSearching(
                            false
                        );
                    }

                },
                300
            );


        return () => {

            clearTimeout(
                timer
            );

        };

    }, [
        text,
        disabled,
        hasUserTyped,
    ]);


    return (

        <div className="method-search-wrapper">

            <input
                type="text"

                value={
                    text
                }

                disabled={
                    disabled
                }

                onChange={(e) => {

                    /*
                     * NOW we know the user
                     * actually typed something.
                     */
                    setHasUserTyped(
                        true
                    );


                    setText(
                        e.target.value
                    );


                    setShowSuggestions(
                        true
                    );
                }}

                onFocus={() => {

                    /*
                     * Simply clicking/focusing
                     * should NOT open suggestions.
                     *
                     * Only reopen if user has
                     * already typed something.
                     */
                    if (
                        hasUserTyped &&
                        suggestions.length > 0
                    ) {

                        setShowSuggestions(
                            true
                        );
                    }

                }}

                onBlur={() => {

                    setTimeout(
                        () => {

                            setShowSuggestions(
                                false
                            );

                        },
                        150
                    );

                }}

                placeholder="Search Method"

                title={
                    disabled
                        ? "HOD review completed. Editing is locked."
                        : "Type Method name and select from suggestions."
                }
            />


            {searching && (

                <div className="method-search-status">

                    Searching...

                </div>

            )}


            {!disabled &&
                hasUserTyped &&
                showSuggestions &&
                suggestions.length > 0 && (

                <div className="method-suggestions">

                    {suggestions.map(
                        (item) => (

                            <button
                                type="button"

                                key={
                                    `${item.code}-${item.method}`
                                }

                                className="method-suggestion-item"

                                onMouseDown={(e) => {

                                    /*
                                     * Prevent input blur
                                     * before click selection.
                                     */
                                    e.preventDefault();


                                    setText(
                                        item.method
                                    );


                                    setHasUserTyped(
                                        false
                                    );


                                    setShowSuggestions(
                                        false
                                    );


                                    setSuggestions(
                                        []
                                    );


                                    onSelect(
                                        item
                                    );
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
   COMMON HELPERS
========================================================= */

const displayValue = (
    value: string | null | undefined
): string => {
    if (
        value === null ||
        value === undefined ||
        value.trim() === ""
    ) {
        return "-";
    }

    return value;
};


const saveValue = (
    value: string | null | undefined
): string => {
    if (
        value === null ||
        value === undefined ||
        value.trim() === ""
    ) {
        return "-";
    }

    return value;
};


const normalizeNabl = (
    value: string | null | undefined
): "Y" | "N" => {
    return value
        ?.trim()
        .toUpperCase() === "Y"
        ? "Y"
        : "N";
};


const normalizeHodReview = (
    value: string | null | undefined
): "Y" | "N" => {
    return value
        ?.trim()
        .toUpperCase() === "Y"
        ? "Y"
        : "N";
};


/* =========================================================
   PAGE
========================================================= */

const ResultEntryPage = ({
    registrationNo: propRegistrationNo,
}: Props) => {

    /* =====================================================
       URL PARAMETERS
    ===================================================== */

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


    const initialRegistrationNo =
        registrationFromUrl ||
        propRegistrationNo ||
        "";


    /* =====================================================
       STATE
    ===================================================== */

    const [
        registrationNo,
        setRegistrationNo,
    ] = useState(
        initialRegistrationNo
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
    ] = useState<number | null>(
        null
    );


    /* =====================================================
       HOD REVIEW CHECK
    ===================================================== */

    const isReviewed = (
        row: ResultEntry
    ): boolean => {
        return (
            normalizeHodReview(
                row.hodReview
            ) === "Y"
        );
    };


    /* =====================================================
       BACK
    ===================================================== */

    const handleBack = () => {
        window.close();

        setTimeout(() => {
            if (!window.closed) {
                window.history.back();
            }
        }, 150);
    };


    /* =====================================================
       LOAD REGISTRATION
    ===================================================== */

    const loadRegistration = async (
        regValue?: string
    ) => {
        const regNo = (
            regValue ||
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
                    regNo
                );


            const normalized:
                ResultEntry[] =
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
                            normalizeHodReview(
                                row.hodReview
                            ),
                    })
                );


            setRows(
                normalized
            );


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
            console.error(
                "Load registration error:",
                err
            );


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


    /* =====================================================
       AUTO LOAD
    ===================================================== */

    useEffect(() => {
        const incomingRegistrationNo =
            registrationFromUrl ||
            propRegistrationNo ||
            "";


        if (!incomingRegistrationNo) {
            return;
        }


        setRegistrationNo(
            incomingRegistrationNo
        );


        void loadRegistration(
            incomingRegistrationNo
        );

    }, [
        registrationFromUrl,
        propRegistrationNo,
    ]);


    /* =====================================================
       GENERIC FIELD CHANGE
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
                            rowIndex !== index
                        ) {
                            return row;
                        }


                        if (
                            isReviewed(row)
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
       RESULT CHANGE
    ===================================================== */

    const handleResultChange = (
        index: number,
        html: string
    ) => {
        handleChange(
            index,
            "result",
            html
        );
    };


    /* =====================================================
       M CODE CHANGE
    ===================================================== */

    const handleMethodCodeInput = (
        index: number,
        value: string
    ) => {
        handleChange(
            index,
            "methodCode",
            value
        );


        /*
         * Clear previous Method
         * until new lookup finishes.
         */
        handleChange(
            index,
            "method",
            "-"
        );


        setError("");
        setMessage("");
    };


    /* =====================================================
       M CODE → METHOD LOOKUP
    ===================================================== */

    const handleMethodCodeBlur = async (
        index: number
    ) => {
        const row =
            rows[index];


        if (!row) {
            return;
        }


        if (
            isReviewed(row)
        ) {
            return;
        }


        const methodCode =
            row.methodCode
                ?.trim() || "";


        if (
            !methodCode ||
            methodCode === "-"
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

            setError("");


            const methodName =
                await getMethodByCode(
                    methodCode
                );


            setRows(
                (previous) =>
                    previous.map(
                        (
                            currentRow,
                            rowIndex
                        ) => {

                            if (
                                rowIndex !== index
                            ) {
                                return currentRow;
                            }


                            if (
                                isReviewed(
                                    currentRow
                                )
                            ) {
                                return currentRow;
                            }


                            if (
                                currentRow
                                    .methodCode
                                    .trim() !==
                                methodCode
                            ) {
                                return currentRow;
                            }


                            return {
                                ...currentRow,

                                method:
                                    methodName?.trim() ||
                                    "-",
                            };
                        }
                    )
            );

        }
        catch (err: any) {
            console.error(
                "Method lookup failed:",
                err
            );


            setRows(
                (previous) =>
                    previous.map(
                        (
                            currentRow,
                            rowIndex
                        ) => {

                            if (
                                rowIndex !== index
                            ) {
                                return currentRow;
                            }


                            return {
                                ...currentRow,
                                method: "-",
                            };
                        }
                    )
            );


            setError(
                err?.response
                    ?.data
                    ?.message ||
                `No Method found for M Code: ${methodCode}`
            );

        }
        finally {
            setMethodLookupIndex(
                null
            );
        }
    };


    /* =====================================================
       METHOD → M CODE
    ===================================================== */

    const handleMethodSelect = (
        index: number,
        selected: MethodSuggestion
    ) => {
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
        setMessage("");
    };


    /* =====================================================
       MODIFIED CHECK
    ===================================================== */

    const isModified = (
        row: ResultEntry,
        index: number
    ): boolean => {
        if (
            isReviewed(row)
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


    /* =====================================================
       MODIFIED COUNT
    ===================================================== */

    const modifiedRowsCount =
        useMemo(() => {

            return rows.filter(
                (
                    row,
                    index
                ) =>
                    isModified(
                        row,
                        index
                    )
            ).length;

        }, [
            rows,
            originalRows,
        ]);


    /* =====================================================
       CANCEL
    ===================================================== */

    const handleCancelChanges = () => {
        if (
            modifiedRowsCount === 0
        ) {
            return;
        }


        const confirmed =
            window.confirm(
                "Are you sure you want to cancel all unsaved changes?"
            );


        if (!confirmed) {
            return;
        }


        const restoredRows:
            ResultEntry[] =
            JSON.parse(
                JSON.stringify(
                    originalRows
                )
            );


        setRows(
            restoredRows
        );


        setError("");


        setMessage(
            "Unsaved changes have been cancelled."
        );
    };


    /* =====================================================
       SAVE CHANGED ROWS
    ===================================================== */

    const saveChangedRows = async (
        changedRows: ResultEntry[]
    ) => {
        if (!userIdFromUrl) {
            setError(
                "User ID is missing. Unable to save changes."
            );

            return;
        }


        const editableRows =
            changedRows.filter(
                (row) =>
                    !isReviewed(row)
            );


        if (
            editableRows.length === 0
        ) {
            setError(
                "No editable rows are available to save."
            );

            return;
        }


        try {
            setSaving(true);

            setError("");
            setMessage("");


            await updateResults(
                registrationNo,

                userIdFromUrl,

                editableRows.map(
                    (row) => ({

                        testCode:
                            row.testCode,

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
                )
            );


            await loadRegistration(
                registrationNo
            );


            setMessage(
                "Changes saved successfully."
            );

        }
        catch (err: any) {
            console.error(
                "Save result error:",
                err
            );


            setError(
                err?.response
                    ?.data
                    ?.message ||
                "Unable to save changes. Please try again."
            );

        }
        finally {
            setSaving(false);
        }
    };


    /* =====================================================
       SAVE
    ===================================================== */

    const handleSave = async () => {
        if (!userIdFromUrl) {
            setError(
                "User ID is missing. Unable to save changes."
            );

            return;
        }


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
            (resolve) => {
                setTimeout(
                    resolve,
                    0
                );
            }
        );


        const changedRows =
            rows.filter(
                (
                    row,
                    index
                ) =>
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
         * M Code exists but Method wasn't resolved.
         */
        const invalidMethodRow =
            changedRows.find(
                (row) =>
                    row.methodCode.trim() !== "-" &&
                    row.method.trim() === "-"
            );


        if (invalidMethodRow) {
            setError(
                `Please select or enter a valid Method for Test Code ${invalidMethodRow.testCode}.`
            );

            return;
        }


        const confirmed =
            window.confirm(
                `You have modified ${changedRows.length} row(s).\n\nDo you want to save these changes?`
            );


        if (!confirmed) {
            return;
        }


        await saveChangedRows(
            changedRows
        );
    };


    /* =====================================================
       MANUAL LOADER
    ===================================================== */

    const showManualRegistrationLoader =
        !registrationFromUrl &&
        !propRegistrationNo;


    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="result-entry-page">


            {/* HEADER */}

            <header className="efrac-banner">

                <img
                    src="/efrac-header.jpg"
                    alt="EFRAC"
                />

            </header>


            {/* BACK */}

            <div className="top-action-bar">

                <button
                    type="button"
                    className="back-button"
                    onClick={
                        handleBack
                    }
                >
                    Back
                </button>

            </div>


            {/* MANUAL REGISTRATION */}

            {showManualRegistrationLoader && (

                <div className="registration-loader">

                    <label>
                        Registration No.
                    </label>


                    <input
                        type="text"
                        value={
                            registrationNo
                        }
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
                        onClick={() =>
                            void loadRegistration()
                        }
                        disabled={
                            loading
                        }
                    >
                        {loading
                            ? "Loading..."
                            : "Load"}
                    </button>

                </div>

            )}


            {/* LOADING */}

            {loading && (

                <div className="loading-message">
                    Loading registration data...
                </div>

            )}


            {/* ERROR */}

            {error && (

                <div className="error-message">
                    {error}
                </div>

            )}


            {/* MESSAGE */}

            {!loading &&
                message && (

                <div className="success-message">
                    {message}
                </div>

            )}


            {/* TABLE */}

            {rows.length > 0 && (

                <>

                    <div className="table-scroll">

                        <table className="result-table">

                            <thead>

                                <tr>

                                    <th>
                                        Sample ID
                                    </th>

                                    <th>
                                        Test Code
                                    </th>

                                    <th>
                                        M Code
                                    </th>

                                    <th>
                                        Method
                                    </th>

                                    <th>
                                        Unit
                                    </th>

                                    <th>
                                        Instrument
                                    </th>

                                    <th>
                                        LOQ
                                    </th>

                                    <th>
                                        Result
                                    </th>

                                    <th>
                                        NABL
                                    </th>

                                    <th>
                                        Spec
                                    </th>

                                    <th>
                                        Ref Method
                                    </th>

                                </tr>

                            </thead>


                            <tbody>

                                {rows.map(
                                    (
                                        row,
                                        index
                                    ) => {

                                        const reviewed =
                                            isReviewed(
                                                row
                                            );


                                        const modified =
                                            isModified(
                                                row,
                                                index
                                            );


                                        const lookingUpMethod =
                                            methodLookupIndex ===
                                            index;


                                        return (

                                            <tr
                                                key={
                                                    `${row.registrationNo}-${row.testCode}-${index}`
                                                }

                                                className={
                                                    reviewed
                                                        ? "reviewed-row"
                                                        : modified
                                                            ? "modified-row"
                                                            : ""
                                                }

                                                title={
                                                    reviewed
                                                        ? "HOD review completed. Editing is locked."
                                                        : ""
                                                }
                                            >


                                                {/* SAMPLE ID */}

                                                <td
                                                    className="
                                                        readonly-cell
                                                        sample-id-cell
                                                    "
                                                >
                                                    {
                                                        row.registrationNo
                                                    }
                                                </td>


                                                {/* TEST CODE */}

                                                <td
                                                    className="
                                                        readonly-cell
                                                        test-code-cell
                                                    "
                                                >
                                                    {
                                                        row.testCode
                                                    }
                                                </td>


                                                {/* M CODE */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.methodCode
                                                        }

                                                        disabled={
                                                            reviewed ||
                                                            lookingUpMethod
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

                                                        title={
                                                            reviewed
                                                                ? "HOD review completed. Editing is locked."
                                                                : "Enter M Code. Method will be filled automatically."
                                                        }
                                                    />

                                                </td>


                                                {/* METHOD SEARCH */}

                                                <td>

                                                    {lookingUpMethod ? (

                                                        <input
                                                            type="text"
                                                            value="Loading..."
                                                            readOnly
                                                            className="auto-filled-input"
                                                        />

                                                    ) : (

                                                        <MethodSearchBox
                                                            value={
                                                                row.method
                                                            }

                                                            disabled={
                                                                reviewed
                                                            }

                                                            onSelect={(
                                                                selected
                                                            ) =>
                                                                handleMethodSelect(
                                                                    index,
                                                                    selected
                                                                )
                                                            }
                                                        />

                                                    )}

                                                </td>


                                                {/* UNIT */}

                                                <td>

                                                    <input
                                                        type="text"
                                                        value={
                                                            row.unit
                                                        }
                                                        disabled={
                                                            reviewed
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "unit",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                {/* INSTRUMENT */}

                                                <td>

                                                    <input
                                                        type="text"
                                                        value={
                                                            row.instrument
                                                        }
                                                        disabled={
                                                            reviewed
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "instrument",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                {/* LOQ */}

                                                <td>

                                                    <input
                                                        type="text"
                                                        value={
                                                            row.loq
                                                        }
                                                        disabled={
                                                            reviewed
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "loq",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                {/* RESULT */}

                                                <td className="result-cell">

                                                    <ResultHtmlEditor
                                                        html={
                                                            row.result
                                                        }
                                                        disabled={
                                                            reviewed
                                                        }
                                                        onChange={(html) =>
                                                            handleResultChange(
                                                                index,
                                                                html
                                                            )
                                                        }
                                                    />

                                                </td>


                                                {/* NABL */}

                                                <td>

                                                    <select
                                                        value={
                                                            normalizeNabl(
                                                                row.nabl
                                                            )
                                                        }
                                                        disabled={
                                                            reviewed
                                                        }
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


                                                {/* SPEC */}

                                                <td>

                                                    <input
                                                        type="text"
                                                        value={
                                                            row.spec
                                                        }
                                                        disabled={
                                                            reviewed
                                                        }
                                                        onChange={(e) =>
                                                            handleChange(
                                                                index,
                                                                "spec",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                {/* REF METHOD */}

                                                <td>

                                                    <input
                                                        type="text"
                                                        value={
                                                            row.refMethod
                                                        }
                                                        disabled={
                                                            reviewed
                                                        }
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


                    {/* ACTION AREA */}

                    <div className="save-area">

                        <div className="change-info">

                            {modifiedRowsCount > 0
                                ? `${modifiedRowsCount} row(s) modified`
                                : ""}

                        </div>


                        <button
                            type="button"
                            className="cancel-button"
                            onClick={
                                handleCancelChanges
                            }
                            disabled={
                                saving ||
                                methodLookupIndex !== null ||
                                modifiedRowsCount === 0
                            }
                        >
                            Cancel Changes
                        </button>


                        <button
                            type="button"
                            className="save-button"
                            onClick={() =>
                                void handleSave()
                            }
                            disabled={
                                saving ||
                                methodLookupIndex !== null ||
                                modifiedRowsCount === 0
                            }
                        >

                            {saving
                                ? "Saving..."
                                : methodLookupIndex !== null
                                    ? "Checking Method..."
                                    : "Save Changes"}

                        </button>

                    </div>

                </>

            )}

        </div>
    );
};


export default ResultEntryPage;