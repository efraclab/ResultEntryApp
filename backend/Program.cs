using ResultEntryApi.Repositories;
using ResultEntryApi.Services;


var builder =
    WebApplication
        .CreateBuilder(args);


// Controllers

builder.Services
    .AddControllers();


// OpenAPI

builder.Services
    .AddOpenApi();


// Repository

builder.Services.AddScoped<
    IResultEntryRepository,
    ResultEntryRepository
>();


// Service

builder.Services.AddScoped<
    IResultEntryService,
    ResultEntryService
>();


// Admin session must be singleton.

builder.Services.AddSingleton<
    AdminAuthService
>();


// CORS

builder.Services.AddCors(
    options =>
    {
        options.AddPolicy(
            "AllowFrontend",

            policy =>
            {
                policy
                    .WithOrigins(
                        "http://localhost:5173",
                        "http://localhost:5174",
                        "http://localhost:5175",
                        "http://localhost:5176",
                        "http://localhost:5185",
                        "http://192.168.2.220:5185"
                    )
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            }
        );
    }
);


var app =
    builder.Build();


if (
    app.Environment
        .IsDevelopment()
)
{
    app.MapOpenApi();
}


app.UseCors(
    "AllowFrontend"
);


app.UseHttpsRedirection();


app.MapControllers();


app.Run();