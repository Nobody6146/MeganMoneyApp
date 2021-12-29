/*
    With Hydrate, you can bring life to your static web page by utilizing dynamic data and reactive components.
    Powerful features like 2-way modeling binding and client-side routing come out of the box.
*/

//******** Options *******//
/** Options for Hydrate DOM manipulation */
class HydrateDOMOptions
{
    root: string;
    attributePrefix: string;
    attributes: HydrateHTMLAttributeOptions;

    constructor()
    {
        this.root = "body";
        this.attributePrefix = "h";
        this.attributes = new HydrateHTMLAttributeOptions();
    }
}
class HydrateHTMLAttributeOptions
{
    //Basic
    model = "model";
    //Basic element manipulation
    property = "property";
    attribute = "attribute";
    toggle = "toggle"; //Toggles an attribute
    class = "class"; //Toggles the inclusion of a class to an element
    delete = "delete"; //removes an element
    //Binding
    input = "input";
    //Conditionals
    event = "event";
    static = "static"; //Executes once
    condition = "condition";
    discrete = "discrete"; //Only allow discrete prop binding meaning "won't respond to generic wildcard events" def="model|prop|true|false", defaults to true
    //Functions and execution
    callback = "callback"; //Calls a property function
    handler = "handler"; //Fires a callback when the "on" event of the element is fired
    //init = "init"; //Create's the model if it doesn't exist of the name, retrieves it, then fires the code inside if any. Sets to true if ran. Runs first time initialized
    script = "script"; //Sets a model property equal to the innerText of the element
    //Templating and Components
    expression = "expression";
    template = "template"; //template changes queries user of the templates then regenerate
    component = "component"; //="[PROP] [TEMPLATE] [object | array | dictionary | map]?"
    append = "append"; //Tells a component to append a value rather than replace it
    //Execution manipulation
    repeat = "repeat";
}
/** Options for Hydrate routing */
class HydrateRouterOptions
{
    hashRouting: boolean;
    exactMatch: boolean;

    constructor(){
        this.hashRouting = true;
        this.exactMatch = true;
    }
}
class HydrateModelOptions 
{
    stateProperty: string;
    nameProperty: string;
    wildcardOperator: string;
    insertionOperator: string;
    nestedOperator: string;

    constructor() {
        this.stateProperty = "__state";
        this.nameProperty = "__name";
        this.wildcardOperator = "*";
        this.insertionOperator = "_";
        this.nestedOperator = ".";
    }
}
/** Hydrate app options */
class HydrateAppOptions
{
    dom: HydrateDOMOptions;
    router: HydrateRouterOptions;
    models: HydrateModelOptions;

    constructor()
    {
        this.dom = new HydrateDOMOptions();
        this.router = new HydrateRouterOptions();
        this.models = new HydrateModelOptions();
    }
}
//****************//
//********Events********//
type HydrateModelEventType = 'bind' | "unbind" | 'set' | 'handler';

class HydrateModelEvent {
    app: HydrateApp;
    target: Element;
    type: HydrateModelEventType;

    model: any;
    modelName: string;
    rootModelName: string;
    state: any;
    previousState: any;
    propName: string;
    propFullName: string;
    prop: any;

    constructor(type:HydrateModelEventType, model: any, previousState: any, propName: string, target: Element, app: HydrateApp, modelName?: string)
    {
        this.app = app;
        this.target = target;
        this.type = type;
        this.model = model;
        this.modelName = app.name(model) ?? modelName;
        this.rootModelName = this.modelName != null 
            ? this.modelName.split(app.options.models.nestedOperator)[0]
            : undefined;
        this.state = app.state(model) ?? model;
        this.previousState = previousState;
        this.propName = propName;
        this.propFullName = (this.modelName != null && this.propName != null)
            ? this.modelName + app.options.models.nestedOperator + this.propName
            : undefined;
        this.prop = (typeof this.state === 'object')
            ? this.state[this.propName]
            : undefined;
    }
}

//****************//

class HydrateApp
{
    #models: Map<string, any>;
    #eventListeners : Map<string, ((event: HydrateModelEvent) => any)[]>;
    #observer : MutationObserver;

    options: HydrateAppOptions;

    constructor(options?: HydrateAppOptions)
    {
        this.options = options ?? new HydrateAppOptions();
        this.#models = new Map();
        this.#eventListeners = new Map();

        //Start the dom
        this.#observer = new MutationObserver(this.#mutationCallback.bind(this));
        this.#observer.observe(this.root, 
            {childList: true, attributes: true, attributeFilter: Object.keys(this.options.dom.attributes).map(x => this.attribute(x)), subtree: true}
        );
        this.root.addEventListener("input", this.#inputListener.bind(this));

        //Start the router
        // this.root.addEventListener("click", this.routeListener.bind(this));
        // window.addEventListener("popstate", this.historyListener.bind(this));
    }

    //=============== Helpful methods ==============/
    /** Gets the root element the app is attached to */
    get root(): Element {
        return document.querySelector(this.options.dom.root);
    }
    /** Gets the full directive name for the HTML attribute */
    attribute(name: string) {
        return `${this.options.dom.attributePrefix}-${name}`;
    }
    /** Makes a copy of a JS object */
    copy(value) {
        return JSON.parse(JSON.stringify(value));
    }

    //******** Basic model methods ********//
    /** Returns a list of the models bound to the framework */
    get models() : any[] {
        return [...this.#models.values()];
    }
    /** Retrieves the model resulting from the search. Search can be a string (name of model) or the state of the model */
    model(search : string | object): any {
        let model : any;
        let name : string;
        if(typeof search === "string")
        {
            model = this.#getRootModel(search);
            name = search;
        }
        else
        {
            model = search;
            name = this.name(search);
        }

        if(name === undefined || model === undefined)
            return undefined;

        const nameParts = name.split(this.options.models.nestedOperator);
        if(nameParts.length === 0)
            //We asked for a root model and found it    
            return model;
        for(let i = 1; i < nameParts.length; i++)
        {
            model = model[nameParts[i]];
            //If we can't dive any further but we haven't reached our model, then it doesn't exist
            if(model == null && i < nameParts.length + 1)
                return undefined;
        }
        return model;
    }
    /** Retrieves the state associated with the search. Search can be a string (name of model) or the state of the model */
    state(search: string | object) : any {
        let model = (typeof search === "object")
            ? search : this.model(search);
        if(model == null)
            return model;
        return model[this.options.models.stateProperty];
    }
    /** Gets the model name of the search. Search can be a string (name of model) or the state of the model */
    name(search: string | object) : string {
        let model = (typeof search === "object")
            ? search : this.model(search)
        if(model == null)
            return undefined;
        return model[this.options.models.nameProperty];
    }
    /** Bind a new model to the framework */
    bind(name?: string, state?: object) {
        if(name == null)
            name = "";
        if(state == null)
            state = {};

        //If this model already exist, unbind it first
        if(this.#models.get(name) != undefined)
            this.unbind(name);

        let proxy = this.#makeProxy(state, name);
        this.#models.set(name, proxy);
        this.dispatch("bind", proxy, undefined, undefined, this.root);
        return proxy;
    }
    /** Unbinds the model from the framework related to the search. Search can be a string (name of model) or the state of the model */
    unbind(search: string | object): void {
        let model : any;
        let name : string;
        if(typeof search === "string")
        {
            model = this.model(search);
            name = search;
        }
        else
        {
            model = search;
            name = this.name(search);
        }

        let nameParts = name.split(this.options.models.nestedOperator);
        const rootModelName = nameParts[0];
        this.#models.delete(rootModelName);

        this.dispatch("unbind", model, undefined, this.state(model), this.root);
    }
    
    //******** Basic model methods ********//
    /** Adds an even listener for the following events */
    listen(search : string | object, handler: (event: HydrateModelEvent) => any) : (event: HydrateModelEvent) => any
    {
        const name = (typeof search === "string")
            ? search
            : this.name(search);
        if(name == null)
            return null;

        let listeners = this.#eventListeners.get(name);
        if(listeners === undefined)
        {
            listeners = [];
            this.#eventListeners.set(name, listeners);
        }
        if(listeners.includes(handler))
            return handler;
        listeners.push(handler);
        return handler;
    }
    /** Removes an event listener */
    unlisten(search: string | object, handler: (event: HydrateModelEvent) => any) : (event: HydrateModelEvent) => any
    {
        const name = (typeof search === "string")
            ? search
            : this.name(search);
        if(name == null)
            return null;

        const listeners = this.#eventListeners.get(name);
        if(listeners == null)
            return null;
        let index = listeners.indexOf(handler);
        if(index === -1)
            return;
        listeners.splice(index, 1);
    }

    //******** Advance features methods ********//
    /** Updates the DOM using the provided model event */
    dom(event: HydrateModelEvent, target?: Element)
    {
        if(target == null)
            target = this.root;
        //Determine how to update our DOM
    }
    /** Generates and dispatches events and sends it to HTML and listeners */
    dispatch(type: HydrateModelEventType,  model: any, propName: string, previousState: any, target?: Element) {
        if(target == null)
            target = this.root;

        const attribute = this.attribute(this.options.dom.attributes.model);
        //Get the DOM elements subscriped for model events
        let listeningElements = [...this.root.querySelectorAll(`[${attribute}]`)];
        let eventListeners = [...this.#eventListeners.keys()];
        //Figure out all the models we're subscribed to
        const searchKeys =  listeningElements.map(x => x.attributes[attribute].value)
            .concat(eventListeners);
        //Determine all the base handlers to notify (using a distinct list)
        let eventMappings = new Map<string, HydrateModelEvent[]>();
        [...new Set(searchKeys)].forEach(key => {
            eventMappings.set(key, 
                this.#generateEvents(type, target, this.name(model), model, propName, key, previousState));
        });

        //Fire all the event handlers
        eventListeners.forEach(key =>
        {
            let events = eventMappings.get(key);
            if(events == null)
                return;
            this.#eventListeners.get(key).forEach(handler => {
                events.forEach(event => {
                    handler(event);
                });
            }); 
        })

        //Trigger all the DOM updates
        listeningElements.forEach(element => {
            let events = eventMappings.get(element.attributes[attribute].value);
            if(events == null)
                return;
            events.forEach(event => {
                this.dom(event, element);
            });
        })
    }
    //====================

    /** Search can be a string (name of model) or the state of the model */
    #getRootModel(search): any {
        let model : any;
        let name : string;
        let nameParts: string[];
        if(typeof search === "string")
        {
            nameParts = search.split(this.options.models.nestedOperator);
            model = this.#models.get(nameParts[0]);
            if(model == null)
                return undefined;
            name = search;
        }
        else
        {
            name = this.name(search);
            if(name == null)
                return undefined;
            nameParts = name.split(this.options.models.nestedOperator);
            model = this.#models.get(nameParts[0]);
            if(model == null)
                return undefined;
        }

        return model;
    }

    //Internal
    #makeProxy(data: any, name: string) {
        const app = this;
        let models = {};
        let proxy;

        let bindOrGet = function(obj: any, prop: string | symbol) {
            if(obj[prop] instanceof Date || !(obj[prop] instanceof Object))
                return null;
            let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
            let modelName = name + "." + propName;

            let model = models[prop];
            if(model !== undefined)
                return model;
            else {
                //Make proxy
                models[prop] = app.#makeProxy(obj[prop], modelName);
                return models[prop];
            }
        }

        proxy = new Proxy(data, {
            get(obj, prop) {
                if(prop === app.options.models.stateProperty)
                    return obj;
                if(prop === app.options.models.nameProperty)
                    return name;
                if(prop === 'toJson')
                {
                    if(typeof obj.toJson === 'function')
                        return obj.toJson;
                    else return function() {return JSON.stringify(this)};
                }

                if (typeof obj[prop] === 'object' && obj[prop] != null)
                {
                    let model = bindOrGet(obj, prop);
                    //let model = null;
                    return model ? model : obj[prop];
                }
                else
                    return obj[prop];
            },
            set: function(obj, prop, value) {
                let previousValue = obj[prop];
                obj[prop] = value;
                models = {};

                //Don't allow DOM update to trigger if value is up-to-date or this model is no longer bound
                if(app.model(name) !== proxy) {
                    return true;
                }
                let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                app.dispatch("set", proxy, propName, previousValue, app.root);
                return true;
            },
            deleteProperty: function(obj, prop) {
                if (prop in obj) {
                    let property = obj[prop];
                    delete obj[prop];
                    if(models[prop] != undefined)
                        delete models[prop];
                    let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                    app.dispatch("unbind", proxy, propName, property, app.root);
                }
                return true;
            }
        });

        return proxy;
    }
    #generateEvents(type: HydrateModelEventType, target: Element, modelName: string, model: any, propName: string, searchKey: string, previousState: any) : HydrateModelEvent[] {
        const nameParts = modelName.split(this.options.models.nestedOperator);
        const keyParts = searchKey.split(this.options.models.nestedOperator);

        //match on any combination of nested models with wildcards such as: "people.profile.*.info.*""
        if(nameParts.length > keyParts.length)
        {
            //This even won't concern you
            if(nameParts.length > keyParts.length + 1 && propName !== undefined)
            {
                return [];
            }
        }
        else if(keyParts.length > nameParts.length)
        {
            //We are a child of this change, propogate to the correct event that would happen to the child
            switch(type)
            {
                case "bind":
                case "set":
                    type = "bind";
                    break;
            }
        }

        let name = "";
        let i = 0;
        let localModel = model;
        let localPreviousState = previousState;
        for(i; i < keyParts.length; i++)
        {
            //If we match, then continue checking for full name
            
            if(i > 0 && keyParts[i] === this.options.models.wildcardOperator)
            {
                let reference = type == 'unbind' ? localPreviousState : localModel;
                if(typeof reference === 'object' && reference != null)
                {
                    return Object.keys(reference).flatMap(x => {
                        let parts = keyParts.map(x => x);
                        parts[i] = x;
                        let key = parts.join(this.options.models.nestedOperator);
                        return this.#generateEvents(type, target, modelName, model, propName, key, previousState);
                    });
                }
                else
                {
                    return [];
                }
            }
            else if((i == 0 && keyParts[0] === this.options.models.wildcardOperator)
                || i >= nameParts.length || keyParts[i] === nameParts[i])
            {
                if(i == 0)
                {
                    name = nameParts[i];
                }
                else
                {
                    name += this.options.models.nestedOperator + keyParts[i];
                    let x = keyParts[i];
                    localModel = typeof localModel === 'object' && localModel != null
                        ? localModel[x]
                        : undefined;
                    localPreviousState = typeof localPreviousState === 'object' && localPreviousState != null
                        ? localPreviousState[x]
                        : undefined;
                }
            }
            else
            {
                //no match
                return [];
            }
            

            //We reached the end of the model name where the event happens, if this doesn't match then ignore
            if(nameParts.length < keyParts.length && i == nameParts.length - 1)
            {
                if(keyParts[i + 1] !== propName && keyParts[i + 1] !== this.options.models.wildcardOperator)
                {
                    //We've reached the end and the prop name doesn't match our path, so ignore
                    return [];
                }
            }
        }

        //We didn't find any relevant data for the model based on the search key
        if(localModel === undefined && previousState === undefined)
            return [];

        if(keyParts.length === nameParts.length)
        {
            return [new HydrateModelEvent(type, localModel, localPreviousState, propName, target, this)];
        }
        else
        {
            return [new HydrateModelEvent(type, localModel, localPreviousState, undefined, target, this, name)]
        };
    }
    #mutationCallback(mutations, observer) {
        let bindUpdates = [];
        mutations.forEach( m => {
            // if(m.type === 'childList')
            //     m.addedNodes.forEach(n => this.bindNodeRecursive(n));
            // if(m.type === 'attributes') 
            //     this.bindNodeRecursive(m.target);
        });
    }
    #inputListener(event) {
        let attr = event.target.attributes[this.attribute(this.options.dom.attributes.model)];
        let input = event.target.attributes[this.attribute(this.options.dom.attributes.model)];
        if(attr != null && input != null) {
            let model = this.model(attr.value);
            if(model) {
                let args = input.value.split(" ");
                model[args[0]] = event.target[args[1]];
            }
        }
    }
}