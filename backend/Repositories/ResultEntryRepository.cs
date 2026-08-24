using System.Data;
using Microsoft.Data.SqlClient;
using ResultEntryApi.Models;

namespace ResultEntryApi.Repositories
{
    public class ResultEntryRepository : IResultEntryRepository
    {
        private readonly string _connectionString;

        public ResultEntryRepository(
            IConfiguration configuration
        )
        {
            _connectionString =
                configuration.GetConnectionString(
                    "DefaultConnection"
                )
                ?? throw new Exception(
                    "DefaultConnection connection string not found."
                );
        }


        // =====================================================
        // GET BY REGISTRATION
        // =====================================================

        public async Task<List<ResultEntryDto>>
            GetByRegistrationAsync(
                string registrationNo
            )
        {
            var results =
                new List<ResultEntryDto>();


            const string sql = @"
                SELECT
                    TRN2REFNO,
                    TRN2HEADER,
                    TRN2_METHDO_DTL,
                    TRN2METHOD,
                    TRN2OUTSTR,
                    TRN2INSTNO,
                    TRN2LOQ,
                    TRN2INPUT,
                    TRN2NABLYN,
                    TRN2HEADSPEC,
                    TRN2REFMETHOD,
                    TRN2OUT,
                    TRN2DATA,
                    TRN2AnlstTestDt
                FROM TRN205
                WHERE TRN2REFNO = @RegistrationNo
                ORDER BY TRN2HEADER;
            ";


            await using var connection =
                new SqlConnection(
                    _connectionString
                );

            await connection.OpenAsync();


            await using var command =
                new SqlCommand(
                    sql,
                    connection
                );


            command.Parameters.Add(
                "@RegistrationNo",
                SqlDbType.VarChar
            ).Value = registrationNo;


            await using var reader =
                await command
                    .ExecuteReaderAsync();


            while (
                await reader.ReadAsync()
            )
            {
                results.Add(
                    new ResultEntryDto
                    {
                        RegistrationNo =
                            GetDisplayValue(
                                reader[
                                    "TRN2REFNO"
                                ]
                            ),

                        TestCode =
                            GetDisplayValue(
                                reader[
                                    "TRN2HEADER"
                                ]
                            ),

                        MethodCode =
                            GetDisplayValue(
                                reader[
                                    "TRN2_METHDO_DTL"
                                ]
                            ),

                        Method =
                            GetDisplayValue(
                                reader[
                                    "TRN2METHOD"
                                ]
                            ),

                        Unit =
                            GetDisplayValue(
                                reader[
                                    "TRN2OUTSTR"
                                ]
                            ),

                        Instrument =
                            GetDisplayValue(
                                reader[
                                    "TRN2INSTNO"
                                ]
                            ),

                        LOQ =
                            GetDisplayValue(
                                reader[
                                    "TRN2LOQ"
                                ]
                            ),

                        /*
                         * IMPORTANT:
                         * Existing Result HTML is preserved.
                         *
                         * Example:
                         * <p> &lt;5</p>
                         */
                        Result =
                            GetDisplayValue(
                                reader[
                                    "TRN2INPUT"
                                ]
                            ),

                        /*
                         * NABL:
                         *
                         * Y -> Y
                         * everything else -> N
                         */
                        NABL =
                            NormalizeNabl(
                                reader[
                                    "TRN2NABLYN"
                                ]
                            ),

                        Spec =
                            GetDisplayValue(
                                reader[
                                    "TRN2HEADSPEC"
                                ]
                            ),

                        RefMethod =
                            GetDisplayValue(
                                reader[
                                    "TRN2REFMETHOD"
                                ]
                            ),

                        /*
                         * These values can still be
                         * returned by backend.
                         *
                         * They are simply not shown
                         * on frontend.
                         */
                        Out =
                            GetDisplayValue(
                                reader[
                                    "TRN2OUT"
                                ]
                            ),

                        Data =
                            GetDisplayValue(
                                reader[
                                    "TRN2DATA"
                                ]
                            ),

                        AnalystTestDate =
                            reader[
                                "TRN2AnlstTestDt"
                            ] == DBNull.Value

                                ? null

                                : Convert.ToDateTime(
                                    reader[
                                        "TRN2AnlstTestDt"
                                    ]
                                )
                    }
                );
            }


            return results;
        }


        // =====================================================
        // UPDATE
        // =====================================================

        public async Task<bool>
            UpdateResultsAsync(
                UpdateResultRequest request
            )
        {
            await using var connection =
                new SqlConnection(
                    _connectionString
                );


            await connection.OpenAsync();


            await using var transaction =
                await connection
                    .BeginTransactionAsync();


            try
            {
                const string sql = @"
                    UPDATE TRN205
                    SET
                        TRN2LOQ = @LOQ,
                        TRN2INSTNO = @Instrument,
                        TRN2INPUT = @Result,

                        TRN2OUT = '1',
                        TRN2DATA = 'Y',

                        TRN2HEADSPEC = @Spec,
                        TRN2REFMETHOD = @RefMethod,

                        TRN2AnlstTestDt = GETDATE(),

                        ADDR_REMK =
    CASE
        WHEN ADDR_REMK IS NULL
             OR LTRIM(RTRIM(ADDR_REMK)) = ''
        THEN
            @UserId + ' | ' +
            CONVERT(VARCHAR(19), GETDATE(), 120)

        ELSE
            ADDR_REMK +
            ' ; ' +
            @UserId + ' | ' +
            CONVERT(VARCHAR(19), GETDATE(), 120)
    END,
                        TRN2NABLYN = @NABL,
                        TRN2OUTSTR = @Unit,
                        TRN2METHOD = @Method,
                        TRN2_METHDO_DTL = @MethodCode

                    WHERE TRN2REFNO = @RegistrationNo
                    AND TRN2HEADER = @TestCode;
                ";


                foreach (
                    var row in request.Rows
                )
                {
                    await using var command =
                        new SqlCommand(
                            sql,
                            connection,
                            (SqlTransaction)
                                transaction
                        );


                    // =============================
                    // Editable fields
                    //
                    // Blank => "-"
                    // =============================

                    AddStringParameter(
                        command,
                        "@LOQ",
                        NormalizeValue(
                            row.LOQ
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Instrument",
                        NormalizeValue(
                            row.Instrument
                        )
                    );


                    /*
                     * Result HTML is NOT stripped.
                     *
                     * Existing HTML stays intact.
                     *
                     * Blank => "-"
                     */
                    AddStringParameter(
                        command,
                        "@Result",
                        NormalizeValue(
                            row.Result,
                            trimValue: false
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Spec",
                        NormalizeValue(
                            row.Spec
                        )
                    );


                    AddStringParameter(
                        command,
                        "@RefMethod",
                        NormalizeValue(
                            row.RefMethod
                        )
                    );


                    /*
                     * NABL is guaranteed to be
                     * either Y or N.
                     */
                    AddStringParameter(
                        command,
                        "@NABL",
                        NormalizeNabl(
                            row.NABL
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Unit",
                        NormalizeValue(
                            row.Unit
                        )
                    );


                    AddStringParameter(
                        command,
                        "@Method",
                        NormalizeValue(
                            row.Method
                        )
                    );


                    AddStringParameter(
                        command,
                        "@MethodCode",
                        NormalizeValue(
                            row.MethodCode
                        )
                    );


                    // =============================
                    // WHERE
                    // =============================

                    command.Parameters.Add(
                        "@RegistrationNo",
                        SqlDbType.VarChar
                    ).Value =
                        request
                            .RegistrationNo
                            .Trim();


                    command.Parameters.Add(
                        "@TestCode",
                        SqlDbType.VarChar
                    ).Value =
                        row.TestCode.Trim();

                    command.Parameters.Add(
                                "@UserId",
                                SqlDbType.VarChar
                                ).Value = request.UserId;


                    var affectedRows =
                        await command
                            .ExecuteNonQueryAsync();


                    if (
                        affectedRows == 0
                    )
                    {
                        throw new Exception(
                            $"No row found for Registration No: {request.RegistrationNo}, Test Code: {row.TestCode}"
                        );
                    }
                }


                await transaction
                    .CommitAsync();


                return true;
            }
            catch
            {
                await transaction
                    .RollbackAsync();

                throw;
            }
        }


        // =====================================================
        // DISPLAY VALUE
        // =====================================================

        /*
         * Database:
         *
         * NULL       => "-"
         * ""         => "-"
         * "   "      => "-"
         *
         * Everything else is returned unchanged.
         *
         * This is especially important for Result HTML.
         */
        private static string
            GetDisplayValue(
                object value
            )
        {
            if (
                value == DBNull.Value
            )
            {
                return "-";
            }


            var text =
                value.ToString();


            if (
                string.IsNullOrWhiteSpace(
                    text
                )
            )
            {
                return "-";
            }


            return text;
        }


        // =====================================================
        // NORMALIZE SAVE VALUE
        // =====================================================

        /*
         * Blank values must NOT become NULL.
         *
         * They become:
         *
         * -
         */
        private static string
            NormalizeValue(
                string? value,
                bool trimValue = true
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    value
                )
            )
            {
                return "-";
            }


            if (trimValue)
            {
                return value.Trim();
            }


            /*
             * Result HTML:
             *
             * Don't Trim() the actual HTML.
             * We want to preserve the existing
             * Result formatting.
             */
            return value;
        }


        // =====================================================
        // NABL
        // =====================================================

        private static string
            NormalizeNabl(
                object value
            )
        {
            if (
                value == DBNull.Value
            )
            {
                return "N";
            }


            return NormalizeNabl(
                value.ToString()
            );
        }


        private static string
            NormalizeNabl(
                string? value
            )
        {
            /*
             * ONLY Y is accepted as Y.
             *
             * N        => N
             * NULL     => N
             * ""       => N
             * "-"      => N
             * ABC      => N
             * YES      => N
             */
            return string.Equals(
                value?.Trim(),
                "Y",
                StringComparison
                    .OrdinalIgnoreCase
            )
                ? "Y"
                : "N";
        }


        // =====================================================
        // SQL PARAMETER
        // =====================================================

        private static void
            AddStringParameter(
                SqlCommand command,
                string parameterName,
                string value
            )
        {
            var parameter =
                command.Parameters.Add(
                    parameterName,
                    SqlDbType.VarChar
                );


            /*
             * IMPORTANT:
             *
             * We no longer use DBNull.Value
             * for editable fields.
             *
             * Blank has already been
             * converted to "-".
             */
            parameter.Value =
                value;
        }
    }
}