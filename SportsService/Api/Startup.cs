using System;
using System.Linq;
using Database;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using Prometheus;
using Prometheus.SystemMetrics;

namespace Api
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAd"));

            services.AddAuthorization(options =>
            {
                options.AddPolicy("default", policy =>
                {
                    policy.RequireAssertion(context =>
                    {
                        var scopes = Configuration.GetSection("AzureAd:Scopes").Key;
                        var claim = context.User.FindFirst("scope");
                        return claim?.Value.Split(' ').Any(scope =>
                            scopes.Contains(scope, StringComparison.OrdinalIgnoreCase)) ?? false;
                    });
                });
            });
            
            services.AddAutoMapper(typeof(Profiles.ServiceEntrypoint).Assembly);

            services.AddMediatR(typeof(Mediator.ServiceEntrypoint).Assembly);

            services.AddDbContext<SportsContext>(
                options => options.UseSqlServer(Configuration.GetConnectionString("default"),
                    b => b.MigrationsAssembly("Api")));

            services.AddControllers();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo {Title = "WebApi", Version = "v1"});
                var securitySchema = new OpenApiSecurityScheme
                {
                    Description =
                        "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.Http,
                    Scheme = "bearer",
                    Reference = new OpenApiReference
                    {
                        Type = ReferenceType.SecurityScheme,
                        Id = "Bearer"
                    }
                };
                c.AddSecurityDefinition("Bearer", securitySchema);
                var securityRequirement = new OpenApiSecurityRequirement
                {
                    {securitySchema, new[] {"Bearer"}}
                };
                c.AddSecurityRequirement(securityRequirement);
            });
            services.AddCors(options =>
            {
                options.AddPolicy("default", policy =>
                {
                    policy.WithOrigins("http://localhost:5003", "https://localhost:5003")
                        .AllowAnyHeader()
                        .AllowAnyMethod();
                });
            });
            services.AddSystemMetrics();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "WebApi v1"));

            app.UseRouting();
            app.UseHttpMetrics();
            
            app.UseCors("default");
            
            app.UseAuthentication();
            app.UseAuthorization();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
                endpoints.MapMetrics();
            });
        }
    }
}
