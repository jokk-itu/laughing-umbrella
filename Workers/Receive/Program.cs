using System;
using GreenPipes;
using MassTransit;
using MassTransit.Definition;
using MassTransit.Pipeline.Observables;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Receive.Filters;
using Receive.Observers;

namespace Receive
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
                            factoryConfigurator.ConnectConsumeObserver(new ConsumeObserver());
                            factoryConfigurator.ConnectReceiveObserver(new ReceiveObserver());
                            factoryConfigurator.ReceiveEndpoint("account-service", endpointConfigurator =>
                            {
                                endpointConfigurator.Lazy = true;
                                endpointConfigurator.PrefetchCount = 20;
                                endpointConfigurator.Consumer<AccountConsumer>();
                                endpointConfigurator.Durable = false;
                                endpointConfigurator.PrefetchCount = 100;
                                endpointConfigurator.UseFilter(new ConsumeFilter());
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
