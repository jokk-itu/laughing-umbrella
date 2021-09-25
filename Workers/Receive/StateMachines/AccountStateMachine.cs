using System;
using System.Threading.Tasks;
using Automatonymous;
using MassTransit.Saga;
using MessageContracts;

namespace Receive.StateMachines
{
    public class AccountStateMachine : MassTransitStateMachine<AccountState>
    {
        #region States
        
        public State UpdateStart { get; private set; }
        
        public State Updated { get; private set; }
        
        public State UpdateComplete { get; private set; }

        #endregion

        #region Events

        public Event<IAccountUpdateStart> AccountUpdateStart { get; private set; }
        public Event<IAccountUpdate> AccountUpdate { get; private set; }
        
        public Event<IAccountUpdateComplete> AccountUpdateComplete { get; private set; } 

        #endregion

        public AccountStateMachine()
        {
            SetupStates();
            SetupEvents();
            SetupBehaviors();
        }

        private void SetupStates()
        {
            InstanceState(x => x.CurrentState, 
                UpdateStart, Updated, UpdateComplete);
        }

        private void SetupEvents()
        {
            Event(
                () => AccountUpdateStart, 
                x 
                    => x.CorrelateById(c =>
                    {
                        if (c.CorrelationId.HasValue)
                            return c.CorrelationId.Value;
                
                        throw new ArgumentException(nameof(c.CorrelationId));
                    }));
            
            Event(
                () => AccountUpdate, 
                x 
                    => x.CorrelateById(c =>
                    {
                        if (c.CorrelationId.HasValue)
                            return c.CorrelationId.Value;
                
                        throw new ArgumentException(nameof(c.CorrelationId));
                    }));
            
            Event(
                () => AccountUpdateComplete, 
                x 
                    => x.CorrelateById(c =>
                    {
                        if (c.CorrelationId.HasValue)
                            return c.CorrelationId.Value;
                
                        throw new ArgumentException(nameof(c.CorrelationId));
                    }));
        }

        //In a real world example, one would also have to take care of
        //messages which arrive unordered.
        private void SetupBehaviors()
        {
            //From Initial to UpdateStart
            Initially(
                When(AccountUpdateStart)
                    .ThenAsync(async context =>
                    {
                        await Task.Run(() => Console.WriteLine($"During Initial, Received AccountUpdateStart: {context.Instance.CorrelationId}"));
                    })
                    .TransitionTo(UpdateStart));
            
            //From UpdateStart to Update
            During(UpdateStart,
                When(AccountUpdate)
                    .ThenAsync(async context =>
                    {
                        await Task.Run(() => Console.WriteLine($"During UpdateStart State, Received AccountUpdate: {context.Instance.CorrelationId}"));
                    })
                    .TransitionTo(Updated));
            
            //FromUpdate to UpdateComplete
            During(Updated,
                When(AccountUpdateComplete)
                    .ThenAsync(async context =>
                    {
                        await Task.Run(() => Console.WriteLine($"During Updated State, Received AccountUpdateComplete: {context.Instance.CorrelationId}"));
                    })
                    .TransitionTo(Final));
        }
    }
    
    public class AccountState : SagaStateMachineInstance, ISagaVersion
    {
        public Guid CorrelationId { get; set; }
        public int CurrentState { get; set; }
        public int Version { get; set; }
    }
}

//StateMachine handles the messages in a machine, and transitions from state to state

//State is a state in the machine, Initial and Final are basic states

//Event is when something that happens and it might change state

//Behavior is what happens when an Event occurs during a State

//Composite Event when one requires any of a collection of Events to occur

//Missing instance when an Event is received, but it cannot be mapped to an instance,
//then one can handle such a case.