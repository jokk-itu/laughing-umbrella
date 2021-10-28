using System;
using System.Collections.Generic;
using Jokk.Microservice.Cache;
using Jokk.Microservice.Cache.Extensions;
using Jokk.Microservice.Cors;
using Jokk.Microservice.Cors.Extensions;
using Jokk.Microservice.HealthCheck.Extensions;
using Jokk.Microservice.Log;
using Jokk.Microservice.Log.Extensions;
using Jokk.Microservice.Prometheus.Extensions;
using Jokk.Microservice.Swagger;
using MediatorRequests;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Identity.Web;
using Neo4j.Driver;
using Prometheus;

namespace Api
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        private IConfiguration Configuration { get; }

        public void ConfigureServices(IServiceCollection services)
        {
            var logConfiguration = Configuration.GetSection("Logging").Get<LogConfiguration>();
            var cacheConfiguration = Configuration.GetSection("Cache").Get<CacheConfiguration>();
            var corsConfiguration = Configuration.GetSection("Cors").Get<CorsConfiguration>();
            var healthCheckServices =
                Configuration.GetSection("HealthCheck:Services").Get<IDictionary<string, string>>();
            
            services.AddControllers();
            
            services.AddMicroserviceLogging(logConfiguration);
            
            services.AddMicroserviceClientCache();
            services.AddMicroserviceDistributedCache(cacheConfiguration);
            
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAd"));
            
            services.AddMediatR(typeof(ServiceEntrypoint).Assembly);
            services.AddAutoMapper(typeof(ObjectMapper.ServiceEntrypoint).Assembly);
            
            var neo4J = Configuration.GetSection("Neo4j");
            services.AddSingleton(_ => GraphDatabase.Driver(
                neo4J.GetValue<string>("Uri"),
                AuthTokens.Basic(
                    neo4J.GetValue<string>("Username"),
                    neo4J.GetValue<string>("Password"))));
            
            services.AddSwaggerAuthorization();
            
            services.AddMicroserviceCors(corsConfiguration);
            
            services.AddMicroservicePrometheus();
            
            /*foreach (var (name, uri) in healthCheckServices)
                services.AddServiceHealthCheck(name, new Uri(uri))
                    .ForwardToPrometheus();*/
            
            services.AddNeo4JHealthCheck("FoodDatabasePing")
                .ForwardToPrometheus();
            
            /*services.AddRedisHealthCheck(
                $"{cacheConfiguration.Password}@{cacheConfiguration.Host}:{cacheConfiguration.Port}")
                .ForwardToPrometheus();*/
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            
            app.UseMicroserviceLogging();
            app.UseMicroserviceClientCache();
            app.UseMicroserviceCors();
            app.UseMicroserviceSwagger();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();
            
            app.UseMicroservicePrometheus();
            
            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }
    }
}