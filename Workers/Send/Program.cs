using System;
using GreenPipes;
using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Send.Observers;

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
                            factoryConfigurator.UseRetry(retryConfigurator =>
                            {
                                retryConfigurator.Incremental(5,TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
                            });
                            factoryConfigurator.UseScheduledRedelivery(retryConfigurator =>
                            {
                                retryConfigurator.Intervals(TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(15), TimeSpan.FromMinutes(30));
                            });
                            var hostname = hostContext.Configuration["ServiceBus:Hostname"];
                            var port = hostContext.Configuration["ServiceBus:Port"];
                            factoryConfigurator.Host($"rabbitmq://{hostname}:{port}", hostConfigurator =>
                            {
                                hostConfigurator.Username(hostContext.Configuration["ServiceBus:Username"]);
                                hostConfigurator.Password(hostContext.Configuration["ServiceBus:Password"]);
                            });
                            factoryConfigurator.ConnectSendObserver(new SendObserver());
                        });
                    });
                    services.AddHostedService<Worker>();
                })
                .ConfigureAppConfiguration((hostContext, appContext) =>
                {
                });
    }
}
