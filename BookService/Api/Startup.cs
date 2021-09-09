using System.Linq;
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
            services.AddControllers();
            
            services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddMicrosoftIdentityWebApi(Configuration.GetSection("AzureAd"));
            
            services.AddAutoMapper(typeof(AutoMapperEntrypoint).Assembly);
            services.AddMediatR(typeof(MediatREntryPoint).Assembly);
            
            services.AddSingleton(new MongoClient(Configuration["Mongo:Uri"]));
            services.AddScoped(serviceProvider =>
            {
                var client = (MongoClient) serviceProvider.GetService(typeof(MongoClient));
                return client!.GetDatabase(Configuration.GetSection("Mongo:Database").Value);
            });
            services.AddScoped<MongoContext>();

            services.AddMicroserviceLogging();
            services.AddMicroservicePrometheus(new PrometheusConfiguration()
            {
                MongoDatabase = Configuration["Mongo:Database"],
                MongoConnectionString = Configuration["Mongo:Uri"],
                Services = Configuration.GetSection("Services").GetChildren()
                    .ToDictionary(section => section.Key, section => section.Value)
            });
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

            app.UseMicroserviceCors();
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
