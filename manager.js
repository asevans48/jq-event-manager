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

var event_chains = {};
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


function create_chain(chain_name){
    return {
        name: chain_name,
        steps: {},
        execution_order: []
    }
}


function execute_step_timeout(timeout, result){
    var deffered = $.Deferred();
    setTimeout(function(){
    	  alert(result);
        deffered.resolve(result);
    }, timeout);
    return deffered.promise();
}


function get_chain(step, previous_chain){
    var to = step.timeout;
    var func = step.func;
    var on_fail = step.on_failed;
    var on_progress = step.on_progress;
    var new_chain =  $.Deferred();
    if(to > 0){
        new_chain.then(function(result){
            return execute_step_timeout(to, result);
        });
    }
    new_chain.then(function(result){
           return func(result);
    }, on_fail, on_progress);
    if(previous_chain){
        new_chain.then(function(result){
            previous_chain.resolve(result);
        }, on_fail, on_progress);
    }
    return new_chain;
}


function trigger_chain_completion(result){
    $(document).trigger(chain_complete_event, [result]);
}


function build_chain(chain_name){
    /* build a chain with a for loop to avoid clutter */
    var chain = chains[chain_name];
    if(chain && chain.steps.length > 0){
        var deffered = $.Deffered();
        var tmp_dfrd = deferred;
        var steps = chain.steps;
        var order = chain.execution_order;
        var rebuilt_order = [];
        var previous_chain = null;
        while(steps && steps.length > 0){
            var step_name = order.pop();
            var step = steps[step_name];
            rebuilt_order.unshift(step_name);
            previous_chain = get_chain(step, previous_chain);
        }
        chain.steps = rebuilt_order;
        return deferred;
    }
    return $.Deffered();
}


function execute(chain_name){
    args = {
        chain: chain_name
    }
    build_chain(chain_name).resolve(args);
}


function bind_complete_function(fn){
    $(document).bind(chain_complete_event, fn);
}
