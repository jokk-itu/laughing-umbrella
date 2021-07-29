using System;
using System.Threading.Tasks;
using MassTransit;

namespace Send.Observers
{
    public class SendObserver : ISendObserver
    {
        public async Task PreSend<T>(SendContext<T> context) where T : class
        {
            throw new NotImplementedException();
        }

        public async Task PostSend<T>(SendContext<T> context) where T : class
        {
            throw new NotImplementedException();
        }

        public async Task SendFault<T>(SendContext<T> context, Exception exception) where T : class
        {
            throw new NotImplementedException();
        }
    }
}