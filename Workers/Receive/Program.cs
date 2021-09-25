using System;
using GreenPipes;
using MassTransit;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Receive.Activities;
using Receive.Consumers;
using Receive.Filters;
using Receive.Observers;
using Receive.StateMachines;
using StackExchange.Redis;
using Serilog;
using Activity = Automatonymous.Activity;

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
                        configurator.AddSagaStateMachine<AccountStateMachine, AccountState>()
                            .RedisRepository(c =>
                                {
                                    c.ConnectionFactory(() =>
                                    {
                                        var co = new ConfigurationOptions()
                                        {
                                            Password = hostContext.Configuration["Redis:Password"],
                                            ResolveDns = true,
                                            ConnectRetry = 5,
                                            SyncTimeout = 50000,
                                            EndPoints =
                                            {
                                                {
                                                    hostContext.Configuration["Redis:Host"],
                                                    int.Parse(hostContext.Configuration["Redis:Port"])
                                                }
                                            },
                                            AbortOnConnectFail = false
                                        };
                                        return ConnectionMultiplexer.Connect(co);
                                    });
                                }
                            );
                        configurator.AddActivitiesFromNamespaceContaining<Activity>();
                        configurator.UsingRabbitMq((busContext, factoryConfigurator) =>
                        {
                            factoryConfigurator.UseRetry(retryConfigurator =>
                            {
                                retryConfigurator.Incremental(5, TimeSpan.FromSeconds(5), TimeSpan.FromSeconds(5));
                            });
                            factoryConfigurator.UseScheduledRedelivery(retryConfigurator =>
                            {
                                retryConfigurator.Intervals(TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(15),
                                    TimeSpan.FromMinutes(30));
                            });
                            var hostname = hostContext.Configuration["ServiceBus:Hostname"];
                            var port = hostContext.Configuration["ServiceBus:Port"];
                            factoryConfigurator.Host($"rabbitmq://{hostname}:{port}", hostConfigurator =>
                            {
                                hostConfigurator.Username(hostContext.Configuration["ServiceBus:Username"]);
                                hostConfigurator.Password(hostContext.Configuration["ServiceBus:Password"]);
                            });
                            factoryConfigurator.ConnectConsumeObserver(
                                new ConsumeObserver(busContext.GetService<ILogger<ConsumeObserver>>()));
                            factoryConfigurator.ConnectReceiveObserver(
                                new ReceiveObserver(busContext.GetService<ILogger<ReceiveObserver>>()));
                            factoryConfigurator.ReceiveEndpoint("account-service", endpointConfigurator =>
                            {
                                endpointConfigurator.Lazy = true;
                                endpointConfigurator.PrefetchCount = 20;
                                endpointConfigurator.Consumer<AccountStartConsumer>();
                                endpointConfigurator.Consumer<AccountConsumer>();
                                endpointConfigurator.Consumer<AccountCompleteConsumer>();
                                endpointConfigurator.UseFilter(new ConsumeFilter());
                                endpointConfigurator.StateMachineSaga(busContext.GetService<AccountStateMachine>(),
                                    busContext);
                            });
                        });
                    });

                    services.AddHostedService<Worker>();
                })
                .ConfigureAppConfiguration((hostContext, appContext) => { }).UseSerilog((context, services, config) =>
                {
                    config
                        .WriteTo.Console()
                        .Enrich.FromLogContext()
                        .MinimumLevel.Debug();
                });
    }
}