using System;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using MessageContracts;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Send
{
    public class Worker : BackgroundService
    {
        private readonly ILogger<Worker> _logger;
        private readonly IBusControl _busControl;

        public Worker(ILogger<Worker> logger, IBusControl busControl)
        {
            _logger = logger;
            _busControl = busControl;
        }

        public override async Task StartAsync(CancellationToken cancellationToken)
        {
            await _busControl.StartAsync(cancellationToken);
            await base.StartAsync(cancellationToken);
        }

        public override async Task StopAsync(CancellationToken cancellationToken)
        {
            await _busControl.StopAsync(cancellationToken);
            await base.StopAsync(cancellationToken);
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var endpoint = await _busControl.GetSendEndpoint(new Uri("exchange:account-service"));
                var correlationId = Guid.NewGuid();
                var id = new Random().Next(1, 10000);
                Console.WriteLine($"Sent message: {id}, {correlationId}");
                await endpoint.Send<IAccountUpdate>(new
                {
                    __CorrelationId = correlationId,
                    AccountId = id,
                    Name = "John Doe",
                    Age = new Random().Next(18,99),
                    Gender = new Random().Next(0,1)
                }, stoppingToken);
                
                await Task.Delay(1000, stoppingToken);
            }
        }
    }
}
