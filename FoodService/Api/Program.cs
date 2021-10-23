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
            var logConfig = serviceProvider.GetRequiredService<LogConfiguration>();
            var cacheConfig = serviceProvider.GetRequiredService<CacheConfiguration>();
            var corsConfig = serviceProvider.GetRequiredService<CorsConfiguration>();
            logger.LogInformation("Logging Configuration {Configuration}", JsonSerializer.Serialize(logConfig));
            logger.LogInformation("Cache Configuration {Configuration}", JsonSerializer.Serialize(cacheConfig));
            logger.LogInformation("Cors Configuration {Configuration}", JsonSerializer.Serialize(corsConfig));
        }
    }
}
