namespace ResultEntryApi.Models
{
    public class UpdateResultRequest
    {
        public string RegistrationNo { get; set; } = string.Empty;

        public string UserId { get; set; } = string.Empty;

        public string LabCode { get; set; } = string.Empty;

        public List<UpdateResultRowDto> Rows { get; set; } = new();
    }


    public class UpdateResultRowDto
    {
        public string TestCode { get; set; } = string.Empty;

        public string? MethodCode { get; set; }

        public string? Method { get; set; }

        public string? Unit { get; set; }

        public string? Instrument { get; set; }

        public string? LOQ { get; set; }

        public string? Result { get; set; }

        public string? NABL { get; set; }

        public string? Spec { get; set; }

        public string? RefMethod { get; set; }
    }
}