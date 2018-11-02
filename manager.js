/*
 Event manager for building event driven sites

 @author aevans
*/

var chains = {};


function finish_step(args=null){
    if(args){
        $(document).trigger('step_finished', args);
    }else{
        $(document).trigger('step_finished');
    }
}


function add_callback(chain, step_name, callback, callback_args){
    var steps = chain.steps;

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
    var new_chain =  $.Deferred();
    if(to > 0){
        new_chain.then(function(result){
            return execute_step_timeout(to, result);
        })
    }
    new_chain.then(function(result){
           return func(result);
    });
    if(previous_chain){
        new_chain.then(function(result){
            previous_chain.resolve(result);
        });
    }
    return new_chain;
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
    return $.Deffered;
}


function execute(chain_name){
    build_chain(chain_name).resolve();
}
