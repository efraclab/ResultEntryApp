using ResultEntryApi.Models;
using ResultEntryApi.Repositories;

namespace ResultEntryApi.Services
{
    public class ResultEntryService : IResultEntryService
    {
        private readonly IResultEntryRepository _repository;

        public ResultEntryService(
            IResultEntryRepository repository
        )
        {
            _repository = repository;
        }

        public async Task<List<ResultEntryDto>>
            GetByRegistrationAsync(
                string registrationNo
            )
        {
            if (string.IsNullOrWhiteSpace(
                registrationNo
            ))
            {
                throw new ArgumentException(
                    "Registration number is required."
                );
            }

            return await _repository
                .GetByRegistrationAsync(
                    registrationNo.Trim()
                );
        }

        public async Task<bool> UpdateResultsAsync(
            UpdateResultRequest request
        )
        {
            if (request == null)
            {
                throw new ArgumentNullException(
                    nameof(request)
                );
            }

            if (string.IsNullOrWhiteSpace(
                request.RegistrationNo
            ))
            {
                throw new ArgumentException(
                    "Registration number is required."
                );
            }

            if (request.Rows == null ||
                request.Rows.Count == 0)
            {
                throw new ArgumentException(
                    "No rows provided for update."
                );
            }

            foreach (var row in request.Rows)
            {
                if (string.IsNullOrWhiteSpace(
                    row.TestCode
                ))
                {
                    throw new ArgumentException(
                        "Test Code is required for every row."
                    );
                }
            }

            return await _repository
                .UpdateResultsAsync(request);
        }
    }
}