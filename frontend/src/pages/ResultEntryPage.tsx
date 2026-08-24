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
    onChange: (html: string) => void;
}


/* =========================================================
   COMMON VALUE RULES
========================================================= */

/*
 * NULL / undefined / blank from database
 * should display as "-"
 */
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


/*
 * Before saving:
 *
 * blank / spaces only => "-"
 */
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
 * NABL rule:
 *
 * Only:
 * Y
 * N
 *
 * Anything other than Y becomes N.
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


/* =========================================================
   RESULT HTML EDITOR
========================================================= */

const ResultHtmlEditor = ({
    html,
    onChange,
}: ResultEditorProps) => {
    const editorRef =
        useRef<HTMLDivElement>(null);


    /*
     * Put DB HTML into contentEditable.
     *
     * Example:
     *
     * DB:
     * <p>   &lt;5</p>
     *
     * User sees:
     * <5
     */
    useEffect(() => {
        if (!editorRef.current) {
            return;
        }

        const currentHtml =
            editorRef.current.innerHTML;

        const incomingHtml =
            html || "";

        if (
            currentHtml !==
            incomingHtml
        ) {
            editorRef.current.innerHTML =
                incomingHtml;
        }
    }, [html]);


    /*
     * Update React state while user edits.
     *
     * We store innerHTML, NOT innerText,
     * because TRN2INPUT uses HTML.
     */
    const handleInput = () => {
        if (!editorRef.current) {
            return;
        }

        const updatedHtml =
            editorRef.current.innerHTML;

        onChange(updatedHtml);
    };


    /*
     * When user leaves the Result field,
     * blank value becomes "-".
     */
    const handleBlur = () => {
        if (!editorRef.current) {
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

        onChange(updatedHtml);
    };


    return (
        <div
            ref={editorRef}
            className="result-editor"
            contentEditable
            suppressContentEditableWarning
            onInput={handleInput}
            onBlur={handleBlur}
        />
    );
};


/* =========================================================
   RESULT ENTRY PAGE
========================================================= */

const ResultEntryPage = ({
    registrationNo: propRegistrationNo,
}: Props) => {

    /* =====================================================
       READ URL PARAMETERS
    ===================================================== */

    const [
        searchParams,
    ] = useSearchParams();


    /*
     * Example URL:
     *
     * /result-entry
     * ?registrationNo=EFRAC%2FAYS%2F250823001
     *
     * React Router automatically gives:
     *
     * EFRAC/AYS/250823001
     */
    const registrationFromUrl =
        searchParams
            .get("registrationNo")
            ?.trim() || "";

    const userIdFromUrl =
        searchParams
            .get("userId")
            ?.trim() || "";

    /*
     * Priority:
     *
     * 1. URL registration
     * 2. Prop registration
     * 3. blank/manual entry
     */
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


            /*
             * Normalize database values.
             *
             * NULL / blank => "-"
             *
             * NABL:
             * Y => Y
             * everything else => N
             *
             * Result HTML stays intact.
             */
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
                         * DO NOT remove HTML.
                         */
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
                    })
                );


            setRows(
                normalized
            );


            /*
             * Original values are stored
             * so Cancel Changes can restore them
             * and modified rows can be detected.
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
       AUTO LOAD REGISTRATION FROM URL / PROP
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


        /*
         * Put incoming registration
         * into state.
         */
        setRegistrationNo(
            incomingRegistrationNo
        );


        /*
         * Automatically fetch data.
         *
         * User does NOT need to click Load.
         */
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
       RESULT HTML CHANGE
    ===================================================== */

    const handleResultChange = (
        index: number,
        html: string
    ) => {

        /*
         * html contains Result HTML.
         *
         * Examples:
         *
         * <p> BLQ</p>
         *
         * <p> &lt;5</p>
         *
         * <p>R1 : Absent</p>
         * <p>R2 : Present</p>
         *
         * We preserve it.
         */
        handleChange(
            index,
            "result",
            html
        );
    };


    /* =====================================================
       CHECK WHETHER ROW CHANGED
    ===================================================== */

    const isModified = (
        row: ResultEntry,
        index: number
    ) => {

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
       MODIFIED ROW COUNT
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


        /*
         * Restore original values.
         */
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

        try {
            setSaving(true);

            setError("");
            setMessage("");


            await updateResults(
                registrationNo,
                userIdFromUrl,

                changedRows.map(
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


            /*
             * Reload database values
             * after successful update.
             */
            await loadRegistration(
                registrationNo
            );


            /*
             * loadRegistration clears message,
             * so success message comes afterwards.
             */
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
       SAVE BUTTON
    ===================================================== */

    const handleSave = async () => {

        /*
         * If Result contentEditable is focused,
         * blur it first.
         *
         * This guarantees its latest HTML
         * is written into React state.
         */
        if (!userIdFromUrl) {
            setError(
                "User ID is missing. Unable to save changes."
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


        /*
         * Give React one event cycle
         * to finish state update.
         */
        await new Promise<void>(
            (resolve) => {
                setTimeout(
                    resolve,
                    0
                );
            }
        );


        /*
         * Because normal inputs update state
         * immediately, rows contains latest data.
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
       SHOW MANUAL REGISTRATION LOADER?
    ===================================================== */

    /*
     * If registration comes from:
     *
     * URL
     * or
     * prop
     *
     * then manual Registration No field
     * should NOT be displayed.
     */
    const showManualRegistrationLoader =
        !registrationFromUrl &&
        !propRegistrationNo;


    /* =====================================================
       UI
    ===================================================== */

    return (
        <div className="result-entry-page">


            {/* =============================================
                EFRAC BANNER
            ============================================= */}

            <header className="efrac-banner">

                <img
                    src="/efrac-header.png"
                    alt="EFRAC"
                />

            </header>


            {/* =============================================
                MANUAL REGISTRATION LOADER

                Only visible for manual testing.

                It automatically disappears when registration
                is supplied through URL.
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
                LOADING MESSAGE
            ============================================= */}

            {loading && (
                <div className="success-message">

                    Loading registration data...

                </div>
            )}


            {/* =============================================
                ERROR MESSAGE
            ============================================= */}

            {error && (

                <div className="error-message">

                    {error}

                </div>

            )}


            {/* =============================================
                SUCCESS / INFORMATION MESSAGE
            ============================================= */}

            {!loading &&
                message && (

                    <div className="success-message">

                        {message}

                    </div>

                )}


            {/* =============================================
                RESULT TABLE
            ============================================= */}

            {rows.length > 0 && (

                <>

                    <div className="table-scroll">

                        <table className="result-table">


                            {/* =================================
                                TABLE HEADER
                            ================================= */}

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


                            {/* =================================
                                TABLE BODY
                            ================================= */}

                            <tbody>

                                {rows.map(
                                    (
                                        row,
                                        index
                                    ) => {

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
                                                    modified
                                                        ? "modified-row"
                                                        : ""
                                                }
                                            >


                                                {/* =================
                                                    SAMPLE ID
                                                    READ ONLY
                                                ================= */}

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


                                                {/* =================
                                                    TEST CODE
                                                    READ ONLY
                                                ================= */}

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


                                                {/* =================
                                                    M CODE
                                                ================= */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.methodCode
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


                                                {/* =================
                                                    METHOD
                                                ================= */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.method
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


                                                {/* =================
                                                    UNIT
                                                ================= */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.unit
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


                                                {/* =================
                                                    INSTRUMENT
                                                ================= */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.instrument
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


                                                {/* =================
                                                    LOQ
                                                ================= */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.loq
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


                                                {/* =================
                                                    RESULT

                                                    HTML AWARE
                                                ================= */}

                                                <td className="result-cell">

                                                    <ResultHtmlEditor
                                                        html={
                                                            row.result
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


                                                {/* =================
                                                    NABL

                                                    ONLY:
                                                    N
                                                    Y
                                                ================= */}

                                                <td>

                                                    <select
                                                        value={
                                                            normalizeNabl(
                                                                row.nabl
                                                            )
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


                                                {/* =================
                                                    SPEC
                                                ================= */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.spec
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


                                                {/* =================
                                                    REF METHOD
                                                ================= */}

                                                <td>

                                                    <input
                                                        type="text"

                                                        value={
                                                            row.refMethod
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


                    {/* =========================================
                        ACTION AREA
                    ========================================= */}

                    <div className="save-area">


                        {/* MODIFIED COUNT */}

                        <div className="change-info">

                            {modifiedRowsCount > 0
                                ? `${modifiedRowsCount} row(s) modified`
                                : ""}

                        </div>


                        {/* CANCEL */}

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


                        {/* SAVE */}

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