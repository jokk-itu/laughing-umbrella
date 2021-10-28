using System;
using System.Text.Json;
using Jokk.Microservice.Cache;
using Jokk.Microservice.Cors;
using Jokk.Microservice.Log;
using Jokk.Microservice.Log.Extensions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Api
{
    public static class Program
    {
        public static void Main(string[] args)
        {
            var host = CreateHostBuilder(args).Build();
            LogConfiguration(host.Services);
            host.Run();
        }

        private static IHostBuilder CreateHostBuilder(string[] args)
        {
            return Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                })
                .AddMicroserviceLogging();
        }

        private static void LogConfiguration(IServiceProvider serviceProvider)
        {
            var logger = serviceProvider.GetRequiredService<ILogger<Startup>>();
            var serializeOptions = new JsonSerializerOptions()
            {
                WriteIndented = true
            };
            var logConfig = JsonSerializer.Serialize(
                serviceProvider.GetRequiredService<LogConfiguration>(), serializeOptions);
            var cacheConfig = JsonSerializer.Serialize(
                serviceProvider.GetRequiredService<CacheConfiguration>(), serializeOptions);
            var corsConfig = JsonSerializer.Serialize(
                serviceProvider.GetRequiredService<CorsConfiguration>(), serializeOptions);

            logger.LogInformation("Logging Configuration {Configuration}", logConfig);
            logger.LogInformation("Cache Configuration {Configuration}", cacheConfig);
            logger.LogInformation("Cors Configuration {Configuration}", corsConfig);
        }
    }
}
