/*
 Event manager for building event driven sites.

 Chains are used to complete sets of actions, deferred or not.
 This allows for asyncronous execution of code (concurrency).

 To use a chain, every function must return the args object
 passed to it with the 'chain' name or an args object containing
 a chain key hose value is the chain name passed in to the original
 function.

 This allows for the completion event to pass the chain name to
 any function bound to the 'chain_completion_event.'

 While not a technical requirement it is HIGHLY recommended.


 @author aevans
*/

var chains = {};
var chain_complete_event = new Event('chain_complete_event');


function create_junction(event, junction_handler, chain){
    $(document).bind(event, junction_handler);
}


function complete_chain(result){
    $(document).trigger(chain_complete_event, result)
}


function add_step(chain, step_name, fn, failed_callback=null, progress_callback, defer_timeout=0){
    chain.steps[step_name] = {
        func: fn,
        on_failed: failed_callback,
        on_progress: progress_callback,
        timeout: defer_timeout
    }
    chain.execution_order.push(step_name);
}


function call_junction(event, result){
    $(document).trigger(event, result);
}


function create_chain(chain_name){
    chain = {
        name: chain_name,
        steps: {},
        execution_order: []
    }
    chains[chain_name] = chain;
    return chain;
}


function execute_step_timeout(timeout, result){
    var deffered = $.Deferred();
    setTimeout(function(){
    	  alert(result);
        deffered.resolve(result);
    }, timeout);
    return deffered.promise();
}


function get_chain(step, execution_chain){
    var to = step.timeout;
    var func = step.func;
    var on_fail = step.on_failed;
    var on_progress = step.on_progress;
    if(to > 0){
        execution_chain = execution_chain.then(function(result){
            return execute_step_timeout(to, result);
        });
    }
    execution_chain = execution_chain.then(function(result){
           return func(result);
    }, on_fail, on_progress);
    return execution_chain;
}


function trigger_chain_completion(result){
    $(document).trigger(chain_complete_event, [result]);
}


function build_chain(chain_name){
    /* build a chain with a for loop to avoid clutter */
    var chain = chains[chain_name];
    console.log(chain);
    step_keys = Object.keys(chain.steps);
    if(chain && step_keys.length > 0){
        var deferred = $.Deferred();
        var order = chain.execution_order.slice(0);
        var execution_chain = $.Deferred();
        var tec = execution_chain.promise();
        while(order && order.length > 0){
            var step_name = order.shift();
            var step = chain.steps[step_name];
            tec = get_chain(step, tec);
        }
        return execution_chain;
    }
    return $.Deferred();
}


function execute(chain_name){
    args = {
        chain: chain_name
    };
    console.log(args);
    var dfrd = build_chain(chain_name);
    console.log('Attempting Resolve');
    dfrd.resolve(args);
}


function bind_complete_function(fn){
    $(document).bind(chain_complete_event, fn);
}
