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
    getResultsByRegistration,
    updateResults,
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
   RESULT EDITOR PROPS
========================================================= */

interface ResultEditorProps {
    html: string;
    disabled?: boolean;
    onChange: (html: string) => void;
}


/* =========================================================
   COMMON VALUE RULES
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


/*
 * Only Y remains Y.
 * Anything else becomes N.
 */
const normalizeNabl = (
    value: string | null | undefined
): "Y" | "N" => {

    return value
        ?.trim()
        .toUpperCase() === "Y"
        ? "Y"
        : "N";
};


/*
 * HOD Review:
 *
 * Y => reviewed / locked
 * anything else => not reviewed
 */
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
   RESULT HTML EDITOR
========================================================= */

const ResultHtmlEditor = ({
    html,
    disabled = false,
    onChange,
}: ResultEditorProps) => {

    const editorRef =
        useRef<HTMLDivElement>(null);


    /*
     * Load HTML coming from DB.
     */
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


    /*
     * Store Result as HTML.
     */
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


    /*
     * Blank Result becomes "-"
     */
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
                .replace(/\u00A0/g, " ")
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


    /*
     * Example:
     *
     * ?registrationNo=EFRAC%2FAYS%2F250823001
     */
    const registrationFromUrl =
        searchParams
            .get("registrationNo")
            ?.trim() || "";


    /*
     * Example:
     *
     * &userId=USR004
     */
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


    /* =====================================================
       HOD REVIEW CHECK
    ===================================================== */

    const isReviewed = (
        row: ResultEntry
    ): boolean => {

        return normalizeHodReview(
            row.hodReview
        ) === "Y";
    };


    /* =====================================================
       BACK BUTTON
    ===================================================== */

    const handleBack = () => {

        /*
         * Works when senior's application
         * opened this page using window.open().
         */
        window.close();


        /*
         * Browser may block window.close()
         * when user manually opened the page.
         *
         * Fallback to previous page.
         */
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

                        /*
                         * Result HTML is preserved.
                         */
                        result:
                            displayValue(
                                row.result
                            ),

                        /*
                         * NABL only Y/N
                         */
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

                        /*
                         * HOD REVIEW
                         *
                         * Y => lock row.
                         */
                        hodReview:
                            normalizeHodReview(
                                row.hodReview
                            ),
                    })
                );


            setRows(
                normalized
            );


            /*
             * Store original values.
             *
             * Used for:
             * - modified checking
             * - Cancel Changes
             */
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
       AUTO LOAD FROM URL
    ===================================================== */

    useEffect(() => {

        const incomingRegistrationNo =
            registrationFromUrl ||
            propRegistrationNo ||
            "";


        if (
            !incomingRegistrationNo
        ) {
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
       NORMAL FIELD CHANGE
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


                        /*
                         * HOD reviewed row:
                         * ignore any attempted modification.
                         */
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
       MODIFIED CHECK
    ===================================================== */

    const isModified = (
        row: ResultEntry,
        index: number
    ) => {

        /*
         * Reviewed rows should never
         * be treated as editable changes.
         */
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
       CANCEL CHANGES
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


        /*
         * Defensive filtering:
         *
         * Even if something unexpected happened
         * in frontend state, never send reviewed
         * rows to update API.
         */
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

                        /*
                         * Preserve Result HTML
                         */
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


            /*
             * Reload database values.
             */
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


        /*
         * Blur Result contentEditable
         * so its latest HTML is captured.
         */
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


        /*
         * Reviewed rows are automatically
         * excluded because isModified()
         * returns false for them.
         */
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
       MANUAL REGISTRATION LOADER
    ===================================================== */

    const showManualRegistrationLoader =
        !registrationFromUrl &&
        !propRegistrationNo;


    /* =====================================================
       UI
    ===================================================== */

    return (

        <div className="result-entry-page">


            {/* =============================================
                EFRAC HEADER
            ============================================= */}

            <header className="efrac-banner">

                <img
                    src="/efrac-header.jpg"
                    alt="EFRAC"
                />

            </header>


            {/* =============================================
                BACK BAR
            ============================================= */}

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


            {/* =============================================
                MANUAL REGISTRATION

                Only visible during manual testing.
            ============================================= */}

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

                        onChange={(
                            e
                        ) =>
                            setRegistrationNo(
                                e.target.value
                            )
                        }

                        onKeyDown={(
                            e
                        ) => {

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


            {/* =============================================
                LOADING
            ============================================= */}

            {loading && (

                <div className="loading-message">

                    Loading registration data...

                </div>

            )}


            {/* =============================================
                ERROR
            ============================================= */}

            {error && (

                <div className="error-message">

                    {error}

                </div>

            )}


            {/* =============================================
                SUCCESS
            ============================================= */}

            {!loading &&
                message && (

                <div className="success-message">

                    {message}

                </div>

            )}


            {/* =============================================
                TABLE
            ============================================= */}

            {rows.length > 0 && (

                <>

                    <div className="table-scroll">

                        <table className="result-table">


                            {/* TABLE HEADER */}

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


                            {/* TABLE BODY */}

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
                                                            reviewed
                                                        }

                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleChange(
                                                                index,
                                                                "methodCode",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

                                                </td>


                                                {/* METHOD */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.method
                                                        }

                                                        disabled={
                                                            reviewed
                                                        }

                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleChange(
                                                                index,
                                                                "method",
                                                                e.target.value
                                                            )
                                                        }
                                                    />

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

                                                        onChange={(
                                                            e
                                                        ) =>
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

                                                        onChange={(
                                                            e
                                                        ) =>
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

                                                        onChange={(
                                                            e
                                                        ) =>
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

                                                        onChange={(
                                                            html
                                                        ) =>
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

                                                        onChange={(
                                                            e
                                                        ) =>
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

                                                        onChange={(
                                                            e
                                                        ) =>
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

                                                        onChange={(
                                                            e
                                                        ) =>
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


                    {/* =====================================
                        BOTTOM ACTION AREA
                    ===================================== */}

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
                                modifiedRowsCount ===
                                    0
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
                                modifiedRowsCount ===
                                    0
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