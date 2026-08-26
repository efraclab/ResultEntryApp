using ResultEntryApi.Models;
using ResultEntryApi.Repositories;

namespace ResultEntryApi.Services
{
    public class ResultEntryService
        : IResultEntryService
    {
        private readonly
            IResultEntryRepository
                _repository;


        public ResultEntryService(
            IResultEntryRepository repository
        )
        {
            _repository =
                repository;
        }


        public async Task<List<ResultEntryDto>>
            GetByRegistrationAsync(
                string registrationNo,
                string labCode
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    registrationNo
                )
            )
            {
                throw new ArgumentException(
                    "Registration number is required."
                );
            }


            if (
                string.IsNullOrWhiteSpace(
                    labCode
                )
            )
            {
                throw new ArgumentException(
                    "Lab Code is required."
                );
            }


            return await _repository
                .GetByRegistrationAsync(
                    registrationNo.Trim(),
                    labCode.Trim()
                );
        }


        public async Task<List<ResultEntryDto>>
            GetByRegistrationForAdminAsync(
                string registrationNo
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    registrationNo
                )
            )
            {
                throw new ArgumentException(
                    "Registration number is required."
                );
            }


            return await _repository
                .GetByRegistrationForAdminAsync(
                    registrationNo.Trim()
                );
        }


        public async Task<bool>
            UpdateResultsAsync(
                UpdateResultRequest request,
                bool isAdmin
            )
        {
            if (request == null)
            {
                throw new ArgumentNullException(
                    nameof(request)
                );
            }


            if (
                string.IsNullOrWhiteSpace(
                    request.RegistrationNo
                )
            )
            {
                throw new ArgumentException(
                    "Registration number is required."
                );
            }


            if (isAdmin)
            {
                /*
                 * Never trust frontend's
                 * admin username.
                 */
                request.UserId =
                    "admin";
            }
            else
            {
                if (
                    string.IsNullOrWhiteSpace(
                        request.UserId
                    )
                )
                {
                    throw new ArgumentException(
                        "User ID is required."
                    );
                }


                if (
                    string.IsNullOrWhiteSpace(
                        request.LabCode
                    )
                )
                {
                    throw new ArgumentException(
                        "Lab Code is required."
                    );
                }
            }


            if (
                request.Rows == null ||
                request.Rows.Count == 0
            )
            {
                throw new ArgumentException(
                    "No rows provided."
                );
            }


            request.RegistrationNo =
                request
                    .RegistrationNo
                    .Trim();


            request.UserId =
                request
                    .UserId
                    .Trim();


            request.LabCode =
                request
                    .LabCode
                    ?.Trim()
                ?? "";


            foreach (
                var row in request.Rows
            )
            {
                if (
                    string.IsNullOrWhiteSpace(
                        row.TestCode
                    )
                )
                {
                    throw new ArgumentException(
                        "Test Code is required."
                    );
                }


                row.TestCode =
                    row.TestCode.Trim();


                if (
                    isAdmin &&
                    string.IsNullOrWhiteSpace(
                        row.LabCode
                    )
                )
                {
                    throw new ArgumentException(
                        $"Lab Code missing for {row.TestCode}."
                    );
                }


                row.NABL =
                    string.Equals(
                        row.NABL?.Trim(),
                        "Y",
                        StringComparison
                            .OrdinalIgnoreCase
                    )
                        ? "Y"
                        : "N";
            }


            return await _repository
                .UpdateResultsAsync(
                    request,
                    isAdmin
                );
        }


        public async Task<string?>
            GetMethodNameByCodeAsync(
                string methodCode
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    methodCode
                )
            )
            {
                throw new ArgumentException(
                    "Method Code is required."
                );
            }


            return await _repository
                .GetMethodNameByCodeAsync(
                    methodCode.Trim()
                );
        }


        public async Task<List<MethodLookupDto>>
            SearchMethodsAsync(
                string searchText
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    searchText
                )
            )
            {
                return new();
            }


            return await _repository
                .SearchMethodsAsync(
                    searchText.Trim()
                );
        }


        public async Task<
            List<SpecificationLookupDto>
        >
            SearchSpecificationsAsync(
                string searchText
            )
        {
            if (
                string.IsNullOrWhiteSpace(
                    searchText
                )
            )
            {
                return new();
            }


            return await _repository
                .SearchSpecificationsAsync(
                    searchText.Trim()
                );
        }
    }
}