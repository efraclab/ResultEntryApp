using ResultEntryApi.Repositories;
using ResultEntryApi.Services;

var builder =
    WebApplication.CreateBuilder(args);

// Controllers
builder.Services.AddControllers();

// OpenAPI
builder.Services.AddOpenApi();

// Dependency Injection
builder.Services.AddScoped<
    IResultEntryRepository,
    ResultEntryRepository
>();

builder.Services.AddScoped<
    IResultEntryService,
    ResultEntryService
>();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
    // Local development
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",

    // Remote server
    "http://localhost:5185",
    "http://192.168.2.220:5185"
)
                .AllowAnyHeader()
                .AllowAnyMethod();
        }
    );
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.MapControllers();

app.Run();