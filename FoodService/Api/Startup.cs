using Jokk.Microservice.Cache;
using Jokk.Microservice.Cors;
using Jokk.Microservice.Log.Extensions;
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
            services.AddControllers();

            services.AddMicroserviceLogging();

            services.AddCacheStore();
            
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
            services.AddMicroserviceCors(
                Configuration.GetSection("Services"),
                Configuration.GetSection("Methods"));
        }

        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }
            
            app.UseMicroserviceLogging();
            app.UseMicroserviceCors();
            app.UseMicroserviceSwagger();
            app.UseCacheStore();

            app.UseRouting();

            app.UseAuthentication();
            app.UseAuthorization();
            
            app.UseEndpoints(endpoints => { endpoints.MapControllers(); });
        }
    }
}