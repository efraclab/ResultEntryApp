using ResultEntryApi.Models;

namespace ResultEntryApi.Services
{
    public interface IResultEntryService
    {
        Task<List<ResultEntryDto>>
            GetByRegistrationAsync(
                string registrationNo,
                string labCode
            );


        Task<bool>
            UpdateResultsAsync(
                UpdateResultRequest request
            );


        Task<string?>
            GetMethodNameByCodeAsync(
                string methodCode
            );


        Task<List<MethodLookupDto>>
            SearchMethodsAsync(
                string searchText
            );


        Task<List<SpecificationLookupDto>>
            SearchSpecificationsAsync(
                string searchText
            );
    }
}