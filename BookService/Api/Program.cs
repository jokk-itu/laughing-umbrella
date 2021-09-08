using System;
using System.Linq;
using Jokk.Microservice.Log.Extensions;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace Api
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args)
        {
            var builder = new ConfigurationBuilder()
                .SetBasePath(Environment.CurrentDirectory)
                .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
                .AddJsonFile($"appsettings.{Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")}.json", optional: true)
                .AddEnvironmentVariables()
                .Build();
            
            var host = Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder =>
                {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.ConfigureKestrel(options =>
                    {
                        var urls = Environment.GetEnvironmentVariable("ASPNETCORE_URLS")?.Split(';') ??
                                   throw new ArgumentException("Urls are not defined");
                        
                        var secureUri = new Uri(urls.First(url => url.StartsWith("https")));
                        
                        //var unsecureUri = new Uri(urls.First(url => url.StartsWith("http")));
                        
                        options.ListenAnyIP(secureUri.Port, listenOptions =>
                        {
                            listenOptions.UseHttps("localhost.pfx", "kelsen");
                        });
                    });
                }).AddMicroserviceLogging("BookApi", builder.GetSection("logging"));
            
            return host;
        }
    }
}
