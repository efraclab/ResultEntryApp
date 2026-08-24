namespace ResultEntryApi.Models
{
    public class ResultEntryDto
    {
        public string? RegistrationNo { get; set; }
        public string? TestCode { get; set; }

        public string? MethodCode { get; set; }
        public string? Method { get; set; }
        public string? Unit { get; set; }
        public string? Instrument { get; set; }
        public string? LOQ { get; set; }
        public string? Result { get; set; }
        public string? NABL { get; set; }
        public string? Spec { get; set; }
        public string? RefMethod { get; set; }

        public string? HodReview { get; set; }

        // Backend-only fields.
        // These values are fetched from TRN205
        // but are not displayed on the frontend.
        public string? Out { get; set; }
        public string? Data { get; set; }
        public DateTime? AnalystTestDate { get; set; }
    }
}