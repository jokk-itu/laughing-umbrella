using System;
using System.Linq;
using Database;
using Jokk.Microservice.Cors;
using Jokk.Microservice.Log.Extensions;
using Jokk.Microservice.Prometheus;
using Jokk.Microservice.Swagger;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.ApplicationParts;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Microsoft.OpenApi.Models;
using Prometheus;

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
            
            services.AddControllers();

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

            var connectionString = Configuration.GetConnectionString("sqlServer");
            services.AddDbContext<SportsContext>(
                options => options.UseSqlServer(connectionString,
                    b => b.MigrationsAssembly("Api")));

            services.AddMicroserviceCors(Configuration.GetSection("Services"), Configuration.GetSection("Methods"));
            services.AddMicroserviceLogging();
            services.AddMicroservicePrometheus(new PrometheusConfiguration()
            {
                SqlServerConnectionString = Configuration.GetConnectionString("SqlServer"),
                Services = Configuration.GetSection("Services").GetChildren()
                    .ToDictionary(section => section.Key, section => section.Value)
            });
            services.AddSwaggerAuthorization();
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseMicroserviceSwagger();
            app.UseMicroserviceLogging();
            app.UseMicroserviceCors();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();

            app.UseMicroservicePrometheus();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
