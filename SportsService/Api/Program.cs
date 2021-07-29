using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Serilog;

namespace Api
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var seqUrl =
                Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT")!.Equals("Development")
                    ? "http://localhost:5341"
                    : "http://logger:5341";
            Log.Logger = new LoggerConfiguration()
                .WriteTo.Seq(seqUrl)
                .CreateLogger();
            var host = CreateHostBuilder(args).Build();
            await host.RunAsync();
        }

        private static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .UseSerilog()
                .ConfigureWebHostDefaults(webBuilder => { webBuilder.UseStartup<Startup>(); });
    }
}