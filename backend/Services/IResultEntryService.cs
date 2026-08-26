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


        Task<List<ResultEntryDto>>
            GetByRegistrationForAdminAsync(
                string registrationNo
            );


        Task<bool>
            UpdateResultsAsync(
                UpdateResultRequest request,
                bool isAdmin
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