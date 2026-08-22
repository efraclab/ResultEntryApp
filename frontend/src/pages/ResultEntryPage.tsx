import {
    useEffect,
    useMemo,
    useState,
} from "react";
import "./ResultEntryPage.css";
import {
    getResultsByRegistration,
    updateResults,
} from "../services/ResultEntryService";

import type {
    ResultEntry,
} from "../services/ResultEntryService";

interface Props {
    registrationNo?: string;
}

const ResultEntryPage = ({
    registrationNo: propRegistrationNo,
}: Props) => {
    const [registrationNo, setRegistrationNo] =
        useState(propRegistrationNo || "");

    const [rows, setRows] = useState<ResultEntry[]>([]);
    const [originalRows, setOriginalRows] =
        useState<ResultEntry[]>([]);

    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const loadRegistration = async (
        value?: string
    ) => {
        const regNo = (
            value || registrationNo
        ).trim();

        if (!regNo) {
            setError(
                "Please enter a registration number."
            );

            return;
        }

        try {
            setLoading(true);
            setError("");
            setMessage("");

            const data =
                await getResultsByRegistration(regNo);

            const normalized = data.map((row) => ({
                ...row,

                registrationNo:
                    row.registrationNo ?? "",

                testCode:
                    row.testCode ?? "",

                methodCode:
                    row.methodCode ?? "",

                method:
                    row.method ?? "",

                unit:
                    row.unit ?? "",

                instrument:
                    row.instrument ?? "",

                loq:
                    row.loq ?? "",

                result:
                    row.result ?? "",

                nabl:
                    row.nabl ?? "",

                spec:
                    row.spec ?? "",

                refMethod:
                    row.refMethod ?? "",
            }));

            setRows(normalized);

            setOriginalRows(
                JSON.parse(
                    JSON.stringify(normalized)
                )
            );

            setRegistrationNo(regNo);
        } catch (err: any) {
            setRows([]);
            setOriginalRows([]);

            setError(
                err?.response?.data?.message ||
                "Unable to load registration."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (propRegistrationNo) {
            loadRegistration(
                propRegistrationNo
            );
        }
    }, [propRegistrationNo]);

    const handleChange = (
        index: number,
        field: keyof ResultEntry,
        value: string
    ) => {
        setRows((previous) =>
            previous.map((row, rowIndex) =>
                rowIndex === index
                    ? {
                        ...row,
                        [field]: value,
                    }
                    : row
            )
        );
    };

    const isModified = (
        row: ResultEntry,
        index: number
    ) => {
        const original = originalRows[index];

        if (!original) return false;

        return (
            row.methodCode !== original.methodCode ||
            row.method !== original.method ||
            row.unit !== original.unit ||
            row.instrument !==
            original.instrument ||
            row.loq !== original.loq ||
            row.result !== original.result ||
            row.nabl !== original.nabl ||
            row.spec !== original.spec ||
            row.refMethod !==
            original.refMethod
        );
    };

    const modifiedRowsCount = useMemo(() => {
        return rows.filter((row, index) =>
            isModified(row, index)
        ).length;
    }, [rows, originalRows]);

    const handleReset = () => {
        setRows(
            JSON.parse(
                JSON.stringify(originalRows)
            )
        );

        setMessage("");
        setError("");
    };

    const handleSave = async () => {
        const changedRows = rows.filter(
            (row, index) =>
                isModified(row, index)
        );

        if (changedRows.length === 0) {
            setMessage(
                "There are no changes to save."
            );

            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            await updateResults(
                registrationNo,
                changedRows.map((row) => ({
                    testCode: row.testCode,
                    methodCode: row.methodCode,
                    method: row.method,
                    unit: row.unit,
                    instrument:
                        row.instrument,
                    loq: row.loq,
                    result: row.result,
                    nabl: row.nabl,
                    spec: row.spec,
                    refMethod:
                        row.refMethod,
                }))
            );

            setMessage(
                "Changes saved successfully."
            );

            // Fetch again because OUT, DATA
            // and Analyst Test Date are
            // automatically updated by backend.
            await loadRegistration(
                registrationNo
            );
        } catch (err: any) {
            setError(
                err?.response?.data?.message ||
                "Unable to save changes."
            );
        } finally {
            setSaving(false);
        }
    };

    const filteredRows = rows.filter(
        (row) => {
            if (!search.trim()) return true;

            const value =
                search.toLowerCase();

            return (
                row.testCode
                    .toLowerCase()
                    .includes(value) ||
                row.methodCode
                    .toLowerCase()
                    .includes(value) ||
                row.method
                    .toLowerCase()
                    .includes(value) ||
                row.result
                    .toLowerCase()
                    .includes(value)
            );
        }
    );


    return (
        <div className="result-page">
            <div className="result-container">

                <div className="page-header">
                    <div>
                        <h1>Result Entry</h1>

                        <p>
                            Review and update test
                            result information
                        </p>
                    </div>

                    {rows.length > 0 && (
                        <div className="header-count">
                            <span>
                                Total Tests
                            </span>

                            <strong>
                                {rows.length}
                            </strong>
                        </div>
                    )}
                </div>

                <div className="registration-card">
                    <label>
                        Registration Number
                    </label>

                    <div className="registration-row">
                        <input
                            value={registrationNo}
                            onChange={(e) =>
                                setRegistrationNo(
                                    e.target.value
                                )
                            }
                            placeholder="Enter registration number"
                            onKeyDown={(e) => {
                                if (
                                    e.key ===
                                    "Enter"
                                ) {
                                    loadRegistration();
                                }
                            }}
                        />

                        <button
                            className="load-button"
                            onClick={() =>
                                loadRegistration()
                            }
                            disabled={loading}
                        >
                            {loading
                                ? "Loading..."
                                : "Load"}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="alert error">
                        {error}
                    </div>
                )}

                {message && (
                    <div className="alert success">
                        {message}
                    </div>
                )}

                {rows.length > 0 && (
                    <>
                        <div className="toolbar">
                            <div>
                                <strong>
                                    Registration:
                                </strong>{" "}
                                {registrationNo}
                            </div>

                            <div className="toolbar-right">
                                <span className="modified-count">
                                    {
                                        modifiedRowsCount
                                    }{" "}
                                    modified
                                </span>

                                <input
                                    className="search-input"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(
                                            e.target
                                                .value
                                        )
                                    }
                                    placeholder="Search test..."
                                />
                            </div>
                        </div>

                        <div className="table-wrapper">
                            <table>
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

                                        <th>Unit</th>

                                        <th>
                                            Instrument
                                        </th>

                                        <th>LOQ</th>

                                        <th>
                                            Result
                                        </th>

                                        <th>NABL</th>

                                        <th>Spec</th>

                                        <th>
                                            Ref Method
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredRows.map(
                                        (row) => {
                                            const actualIndex =
                                                rows.findIndex(
                                                    (
                                                        r
                                                    ) =>
                                                        r ===
                                                        row
                                                );

                                            const modified =
                                                isModified(
                                                    row,
                                                    actualIndex
                                                );

                                            return (
                                                <tr
                                                    key={`${row.registrationNo}-${row.testCode}`}
                                                    className={
                                                        modified
                                                            ? "modified-row"
                                                            : ""
                                                    }
                                                >
                                                    <td className="readonly-cell registration-cell">
                                                        {
                                                            row.registrationNo
                                                        }
                                                    </td>

                                                    <td className="readonly-cell test-code">
                                                        {
                                                            row.testCode
                                                        }
                                                    </td>

                                                    <td>
                                                        <input
                                                            value={
                                                                row.methodCode
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "methodCode",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <textarea
                                                            value={
                                                                row.method
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "method",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            value={
                                                                row.unit
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "unit",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            value={
                                                                row.instrument
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "instrument",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            value={
                                                                row.loq
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "loq",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <input
                                                            value={
                                                                row.result
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "result",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <select
                                                            value={
                                                                row.nabl
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "nabl",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        >
                                                            <option value="">
                                                                -
                                                            </option>

                                                            <option value="Y">
                                                                Y
                                                            </option>

                                                            <option value="N">
                                                                N
                                                            </option>
                                                        </select>
                                                    </td>

                                                    <td>
                                                        <textarea
                                                            value={
                                                                row.spec
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "spec",
                                                                    e
                                                                        .target
                                                                        .value
                                                                )
                                                            }
                                                        />
                                                    </td>

                                                    <td>
                                                        <textarea
                                                            value={
                                                                row.refMethod
                                                            }
                                                            onChange={(
                                                                e
                                                            ) =>
                                                                handleChange(
                                                                    actualIndex,
                                                                    "refMethod",
                                                                    e
                                                                        .target
                                                                        .value
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

                        <div className="footer-actions">
                            <div>
                                <span>
                                    {
                                        filteredRows.length
                                    }{" "}
                                    of{" "}
                                    {rows.length}{" "}
                                    tests
                                </span>
                            </div>

                            <div className="button-group">
                                <button
                                    className="reset-button"
                                    onClick={
                                        handleReset
                                    }
                                    disabled={
                                        saving
                                    }
                                >
                                    Reset
                                </button>

                                <button
                                    className="save-button"
                                    onClick={
                                        handleSave
                                    }
                                    disabled={
                                        saving ||
                                        modifiedRowsCount ===
                                        0
                                    }
                                >
                                    {saving
                                        ? "Saving..."
                                        : `Save Changes (${modifiedRowsCount})`}
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ResultEntryPage;