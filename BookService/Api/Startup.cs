using Database;
using Jokk.Microservice.Cors;
using Jokk.Microservice.Log.Extensions;
using Jokk.Microservice.Prometheus;
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
using Microsoft.OpenApi.Models;
using MongoDB.Driver;
using ObjectMapper;

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
            
            services.AddAutoMapper(typeof(AutoMapperEntrypoint).Assembly);
            services.AddMediatR(typeof(MediatREntryPoint).Assembly);

            var connectionString = Configuration.GetConnectionString("Mongo");
            services.AddSingleton(new MongoClient(connectionString));
            services.AddScoped(serviceProvider =>
            {
                var client = (MongoClient) serviceProvider.GetService(typeof(MongoClient));
                return client!.GetDatabase(Configuration.GetSection("Mongo:Database").Value);
            });
            services.AddScoped<MongoContext>();
            
            services.AddControllers();
            
            services.AddMicroserviceLogging();
            services.AddMicroservicePrometheus(Configuration.GetSection("Services"), mongodb: connectionString);
            services.AddMicroserviceCors(
                Configuration.GetSection("Services"), 
                Configuration.GetSection("Methods"));
            services.AddSwaggerAuthorization();
        }
        
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            app.UseHttpsRedirection();
            app.UseMicroserviceSwagger();
            app.UseMicroserviceLogging();
            
            app.UseRouting();

            app.UseAuthorization();
            app.UseAuthentication();
            
            app.UseMicroservicePrometheus();
            app.UseEndpoints(endpoints =>
            {
                endpoints.MapControllers();
            });
        }
    }
}
