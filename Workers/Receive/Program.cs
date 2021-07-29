using System;
using GreenPipes;
using MassTransit;
using MassTransit.Pipeline.Observables;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
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
                            var hostname = hostContext.Configuration.GetSection("ServiceBus:Hostname").Value;
                            factoryConfigurator.Host($"rabbitmq://{hostname}:5670", hostConfigurator =>
                            {
                                hostConfigurator.Username(hostContext.Configuration.GetSection("ServiceBus:Username").Value);
                                hostConfigurator.Password(hostContext.Configuration.GetSection("ServiceBus:Password").Value);
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
                                endpointConfigurator.UseInMemoryOutbox();
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
