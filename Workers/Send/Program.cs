using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;

namespace Send
{
    public class Program
    {
        public static void Main(string[] args)
        {
            CreateHostBuilder(args).Build().Run();
        }

        private static IHostBuilder CreateHostBuilder(string[] args) =>
            Host.CreateDefaultBuilder(args)
                .ConfigureServices((hostContext, services) =>
                {
                    services.AddMassTransit(configurator =>
                    {
                        configurator.UsingRabbitMq((busContext, factoryConfigurator) =>
                        {
                            var hostname = hostContext.Configuration.GetSection("ServiceBus:Hostname").Value;
                            factoryConfigurator.Host($"rabbitmq://{hostname}:5670", hostConfigurator =>
                            {
                                hostConfigurator.Username(hostContext.Configuration.GetSection("ServiceBus:Username").Value);
                                hostConfigurator.Password(hostContext.Configuration.GetSection("ServiceBus:Password").Value);
                            });
                        });
                    });
                    services.AddHostedService<Worker>();
                })
                .ConfigureAppConfiguration((hostContext, appContext) =>
                {
                });
    }
}
