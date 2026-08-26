using System.Data;
using Microsoft.Data.SqlClient;
using ResultEntryApi.Models;

namespace ResultEntryApi.Repositories
{
    public class ResultEntryRepository
        : IResultEntryRepository
    {
        private readonly string
            _connectionString;


        public ResultEntryRepository(
            IConfiguration configuration
        )
        {
            _connectionString =
                configuration
                    .GetConnectionString(
                        "DefaultConnection"
                    )
                ?? throw new Exception(
                    "Connection string not found."
                );
        }


        // =====================================================
        // EXTERNAL GET
        // =====================================================

        public async Task<List<ResultEntryDto>>
            GetByRegistrationAsync(
                string registrationNo,
                string labCode
            )
        {
            const string sql = @"
                SELECT
                    TRN2REFNO,
                    TRN2HEADER,
                    TRN2DEPARTCD,
                    TRN2_METHDO_DTL,
                    TRN2METHOD,
                    TRN2OUTSTR,
                    TRN2INSTNO,
                    TRN2LOQ,
                    TRN2INPUT,
                    TRN2NABLYN,
                    TRN2HEADSPEC,
                    TRN2REFMETHOD,
                    TRN2HODREVIEW,
                    TRN2OUT,
                    TRN2DATA,
                    TRN2AnlstTestDt

                FROM TRN205

                WHERE TRN2REFNO =
                    @RegistrationNo

                  AND TRN2DEPARTCD =
                    @LabCode

                ORDER BY TRN2HEADER;
            ";


            return await ReadRows(
                sql,
                registrationNo,
                labCode
            );
        }


        // =====================================================
        // ADMIN GET
        // =====================================================

        public async Task<List<ResultEntryDto>>
            GetByRegistrationForAdminAsync(
                string registrationNo
            )
        {
            const string sql = @"
                SELECT
                    TRN2REFNO,
                    TRN2HEADER,
                    TRN2DEPARTCD,
                    TRN2_METHDO_DTL,
                    TRN2METHOD,
                    TRN2OUTSTR,
                    TRN2INSTNO,
                    TRN2LOQ,
                    TRN2INPUT,
                    TRN2NABLYN,
                    TRN2HEADSPEC,
                    TRN2REFMETHOD,
                    TRN2HODREVIEW,
                    TRN2OUT,
                    TRN2DATA,
                    TRN2AnlstTestDt

                FROM TRN205

                WHERE TRN2REFNO =
                    @RegistrationNo

                ORDER BY
                    TRN2DEPARTCD,
                    TRN2HEADER;
            ";


            return await ReadRows(
                sql,
                registrationNo,
                null
            );
        }


        private async Task<List<ResultEntryDto>>
            ReadRows(
                string sql,
                string registrationNo,
                string? labCode
            )
        {
            var results =
                new List<ResultEntryDto>();


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
            ).Value =
                registrationNo.Trim();


            if (
                labCode != null
            )
            {
                command.Parameters.Add(
                    "@LabCode",
                    SqlDbType.VarChar
                ).Value =
                    labCode.Trim();
            }


            await using var reader =
                await command
                    .ExecuteReaderAsync();


            while (
                await reader.ReadAsync()
            )
            {
                results.Add(
                    MapRow(reader)
                );
            }


            return results;
        }


        private static ResultEntryDto
            MapRow(
                SqlDataReader reader
            )
        {
            return new ResultEntryDto
            {
                RegistrationNo =
                    Display(
                        reader[
                            "TRN2REFNO"
                        ]
                    ),

                TestCode =
                    Display(
                        reader[
                            "TRN2HEADER"
                        ]
                    ),

                LabCode =
                    Display(
                        reader[
                            "TRN2DEPARTCD"
                        ]
                    ),

                MethodCode =
                    Display(
                        reader[
                            "TRN2_METHDO_DTL"
                        ]
                    ),

                Method =
                    Display(
                        reader[
                            "TRN2METHOD"
                        ]
                    ),

                Unit =
                    Display(
                        reader[
                            "TRN2OUTSTR"
                        ]
                    ),

                Instrument =
                    Display(
                        reader[
                            "TRN2INSTNO"
                        ]
                    ),

                LOQ =
                    Display(
                        reader[
                            "TRN2LOQ"
                        ]
                    ),

                Result =
                    Display(
                        reader[
                            "TRN2INPUT"
                        ]
                    ),

                NABL =
                    NormalizeNabl(
                        reader[
                            "TRN2NABLYN"
                        ]
                    ),

                Spec =
                    Display(
                        reader[
                            "TRN2HEADSPEC"
                        ]
                    ),

                RefMethod =
                    Display(
                        reader[
                            "TRN2REFMETHOD"
                        ]
                    ),

                HodReview =
                    Display(
                        reader[
                            "TRN2HODREVIEW"
                        ]
                    ),

                Out =
                    Display(
                        reader[
                            "TRN2OUT"
                        ]
                    ),

                Data =
                    Display(
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
            };
        }


        // =====================================================
        // UPDATE
        // =====================================================

        public async Task<bool>
            UpdateResultsAsync(
                UpdateResultRequest request,
                bool isAdmin
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


            const string sql = @"
                UPDATE TRN205

                SET
                    TRN2LOQ =
                        @LOQ,

                    TRN2INSTNO =
                        @Instrument,

                    TRN2INPUT =
                        @Result,

                    TRN2OUT =
                        '1',

                    TRN2DATA =
                        'Y',

                    TRN2HEADSPEC =
                        @Spec,

                    TRN2REFMETHOD =
                        @RefMethod,

                    TRN2AnlstTestDt =
                        GETDATE(),

                    TRN2_ANALYSIST_NAME =
                        @UserId,

                    ADDR_REMK =
                        CASE

                            WHEN ADDR_REMK IS NULL
                              OR LTRIM(
                                    RTRIM(
                                        ADDR_REMK
                                    )
                                 ) = ''

                            THEN
                                @UserId
                                + ' | '
                                + CONVERT(
                                    VARCHAR(19),
                                    GETDATE(),
                                    120
                                )

                            ELSE
                                ADDR_REMK
                                + ' ; '
                                + @UserId
                                + ' | '
                                + CONVERT(
                                    VARCHAR(19),
                                    GETDATE(),
                                    120
                                )

                        END,

                    TRN2NABLYN =
                        @NABL,

                    TRN2OUTSTR =
                        @Unit,

                    TRN2METHOD =
                        @Method,

                    TRN2_METHDO_DTL =
                        @MethodCode

                WHERE TRN2REFNO =
                    @RegistrationNo

                  AND TRN2HEADER =
                    @TestCode

                  AND TRN2DEPARTCD =
                    @EffectiveLabCode

                  AND ISNULL(
                        TRN2HODREVIEW,
                        'N'
                      ) <> 'Y';
            ";


            try
            {
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


                    AddString(
                        command,
                        "@LOQ",
                        Normal(row.LOQ)
                    );


                    AddString(
                        command,
                        "@Instrument",
                        Normal(
                            row.Instrument
                        )
                    );


                    AddString(
                        command,
                        "@Result",
                        Normal(
                            row.Result,
                            false
                        )
                    );


                    AddString(
                        command,
                        "@Spec",
                        Normal(row.Spec)
                    );


                    AddString(
                        command,
                        "@RefMethod",
                        Normal(
                            row.RefMethod
                        )
                    );


                    AddString(
                        command,
                        "@NABL",
                        NormalizeNabl(
                            row.NABL
                        )
                    );


                    AddString(
                        command,
                        "@Unit",
                        Normal(row.Unit)
                    );


                    AddString(
                        command,
                        "@Method",
                        Normal(
                            row.Method
                        )
                    );


                    AddString(
                        command,
                        "@MethodCode",
                        Normal(
                            row.MethodCode
                        )
                    );


                    AddString(
                        command,
                        "@RegistrationNo",
                        request
                            .RegistrationNo
                    );


                    AddString(
                        command,
                        "@TestCode",
                        row.TestCode
                    );


                    AddString(
                        command,
                        "@UserId",
                        request.UserId
                    );


                    /*
                     * External:
                     * URL lab
                     *
                     * Admin:
                     * actual row lab
                     */
                    var effectiveLab =
                        isAdmin
                            ? row.LabCode
                            : request.LabCode;


                    AddString(
                        command,
                        "@EffectiveLabCode",
                        effectiveLab
                    );


                    var affected =
                        await command
                            .ExecuteNonQueryAsync();


                    if (
                        affected == 0
                    )
                    {
                        throw new Exception(
                            $"Unable to update Test Code {row.TestCode}. HOD review may be complete or lab does not match."
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
        // METHOD CODE
        // =====================================================

        public async Task<string?>
            GetMethodNameByCodeAsync(
                string methodCode
            )
        {
            const string sql = @"
                SELECT TOP 1
                    CODEDESC

                FROM OCODEMST

                WHERE CODETYPE = 'ME'

                  AND LTRIM(
                        RTRIM(
                            CODECD
                        )
                      ) =
                        @MethodCode;
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


            AddString(
                command,
                "@MethodCode",
                methodCode
            );


            var result =
                await command
                    .ExecuteScalarAsync();


            return (
                result == null ||
                result == DBNull.Value
            )
                ? null
                : result
                    .ToString()
                    ?.Trim();
        }


        // =====================================================
        // METHOD SEARCH
        // =====================================================

        public async Task<List<MethodLookupDto>>
            SearchMethodsAsync(
                string searchText
            )
        {
            const string sql = @"
                SELECT TOP 5
                    CODECD,
                    CODEDESC

                FROM OCODEMST

                WHERE CODETYPE = 'ME'

                  AND CODEDESC IS NOT NULL

                  AND LTRIM(
                        RTRIM(
                            CODEDESC
                        )
                      ) <> ''

                  AND CODEDESC LIKE
                        @Search

                ORDER BY CODEDESC;
            ";


            var result =
                new List<MethodLookupDto>();


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


            AddString(
                command,
                "@Search",
                $"%{searchText.Trim()}%"
            );


            await using var reader =
                await command
                    .ExecuteReaderAsync();


            while (
                await reader.ReadAsync()
            )
            {
                result.Add(
                    new MethodLookupDto
                    {
                        Code =
                            reader[
                                "CODECD"
                            ]
                            ?.ToString()
                            ?.Trim()
                            ?? "",

                        Method =
                            reader[
                                "CODEDESC"
                            ]
                            ?.ToString()
                            ?.Trim()
                            ?? ""
                    }
                );
            }


            return result;
        }


        // =====================================================
        // SPEC SEARCH
        // =====================================================

        public async Task<
            List<SpecificationLookupDto>
        >
            SearchSpecificationsAsync(
                string searchText
            )
        {
            const string sql = @"
                SELECT DISTINCT TOP 5
                    SpecName

                FROM SpecificationMst

                WHERE SpecName IS NOT NULL

                  AND LTRIM(
                        RTRIM(
                            SpecName
                        )
                      ) <> ''

                  AND SpecName LIKE
                        @Search

                ORDER BY SpecName;
            ";


            var result =
                new List<
                    SpecificationLookupDto
                >();


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


            AddString(
                command,
                "@Search",
                $"%{searchText.Trim()}%"
            );


            await using var reader =
                await command
                    .ExecuteReaderAsync();


            while (
                await reader.ReadAsync()
            )
            {
                result.Add(
                    new SpecificationLookupDto
                    {
                        SpecName =
                            reader[
                                "SpecName"
                            ]
                            ?.ToString()
                            ?.Trim()
                            ?? ""
                    }
                );
            }


            return result;
        }


        // =====================================================
        // HELPERS
        // =====================================================

        private static string Display(
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


            return string
                .IsNullOrWhiteSpace(
                    text
                )
                    ? "-"
                    : text;
        }


        private static string Normal(
            string? value,
            bool trim = true
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


            return trim
                ? value.Trim()
                : value;
        }


        private static string
            NormalizeNabl(
                object value
            )
        {
            return value == DBNull.Value
                ? "N"
                : NormalizeNabl(
                    value.ToString()
                );
        }


        private static string
            NormalizeNabl(
                string? value
            )
        {
            return string.Equals(
                value?.Trim(),
                "Y",
                StringComparison
                    .OrdinalIgnoreCase
            )
                ? "Y"
                : "N";
        }


        private static void AddString(
            SqlCommand command,
            string name,
            string? value
        )
        {
            command.Parameters.Add(
                name,
                SqlDbType.VarChar
            ).Value =
                value?.Trim()
                ?? "";
        }
    }
}