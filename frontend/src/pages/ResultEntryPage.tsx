import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    getResultsByRegistration,
    updateResults,
    type ResultEntry,
} from "../services/ResultEntryService";

import "./ResultEntryPage.css";

interface Props {
    registrationNo?: string;
}

const ResultEntryPage = ({
    registrationNo: propRegistrationNo,
}: Props) => {
    const [registrationNo, setRegistrationNo] =
        useState(propRegistrationNo || "");

    const [rows, setRows] =
        useState<ResultEntry[]>([]);

    const [originalRows, setOriginalRows] =
        useState<ResultEntry[]>([]);

    const [loading, setLoading] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const loadRegistration = async (
        regValue?: string
    ) => {
        const regNo = (
            regValue || registrationNo
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

            const normalized: ResultEntry[] =
                data.map((row) => ({
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
            console.error(err);

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
            previous.map(
                (row, rowIndex) =>
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
        useMemo(() => {
            return rows.filter(
                (row, index) =>
                    isModified(row, index)
            ).length;
        }, [rows, originalRows]);

    const handleSave = async () => {
        const changedRows =
            rows.filter(
                (row, index) =>
                    isModified(row, index)
            );

        if (
            changedRows.length === 0
        ) {
            setMessage(
                "No changes to save."
            );

            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            await updateResults(
                registrationNo,
                changedRows.map(
                    (row) => ({
                        testCode:
                            row.testCode,

                        methodCode:
                            row.methodCode,

                        method:
                            row.method,

                        unit:
                            row.unit,

                        instrument:
                            row.instrument,

                        loq:
                            row.loq,

                        result:
                            row.result,

                        nabl:
                            row.nabl,

                        spec:
                            row.spec,

                        refMethod:
                            row.refMethod,
                    })
                )
            );

            setMessage(
                "Changes saved successfully."
            );

            await loadRegistration(
                registrationNo
            );
        } catch (err: any) {
            console.error(err);

            setError(
                err?.response?.data?.message ||
                    "Unable to save changes."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="result-entry-page">

            <header className="efrac-banner">
                <img
                    src="/efrac-header.png"
                    alt="EFRAC"
                />
            </header>

            {!propRegistrationNo && (
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
                                e.key === "Enter"
                            ) {
                                loadRegistration();
                            }
                        }}
                    />

                    <button
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
            )}

            {error && (
                <div className="error-message">
                    {error}
                </div>
            )}

            {message && (
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
                                        const modified =
                                            isModified(
                                                row,
                                                index
                                            );

                                        return (
                                            <tr
                                                key={`${row.registrationNo}-${row.testCode}-${index}`}
                                                className={
                                                    modified
                                                        ? "modified-row"
                                                        : ""
                                                }
                                            >
                                                <td className="readonly-cell sample-id-cell">
                                                    {
                                                        row.registrationNo
                                                    }
                                                </td>

                                                <td className="readonly-cell test-code-cell">
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
                                                                index,
                                                                "methodCode",
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
                                                            row.method
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleChange(
                                                                index,
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
                                                                index,
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
                                                                index,
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
                                                                index,
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
                                                                index,
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
                                                                index,
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
                                                    <input
                                                        value={
                                                            row.spec
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleChange(
                                                                index,
                                                                "spec",
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
                                                            row.refMethod
                                                        }
                                                        onChange={(
                                                            e
                                                        ) =>
                                                            handleChange(
                                                                index,
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

                    <div className="save-area">
                        <div className="change-info">
                            {modifiedRowsCount >
                            0
                                ? `${modifiedRowsCount} row(s) modified`
                                : ""}
                        </div>

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
                                : "Save Changes"}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ResultEntryPage;