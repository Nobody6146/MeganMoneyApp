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

class HydrateModelEvent
{
    app: HydrateApp;
    model: any;
    state: any;
    modelName: string;
    propName: string;
    prop: any;
    previousValue: any;
    type: HydrateModelEventType;
    target: Element;
    value: any;
    varName: string;
    rootModelName: string;

    constructor(model: any, modelName: string, propName:string, previousValue: any, type: HydrateModelEventType, target: Element, value: any, app: HydrateApp)
    {
        this.app = app;
        this.model = model;
        this.state = !(model instanceof Object) || model[app.options.models.stateProperty] === undefined
            ? model : model[app.options.models.stateProperty];
        this.modelName = modelName;
        this.propName = propName;
        this.previousValue = previousValue;
        this.type = type;
        this.target = target;

        if(value === undefined) {
            if(model != null && modelName !== app.options.models.wildcardOperator && propName !== app.options.models.wildcardOperator)
                this.value = propName ? model[propName] : model;
            else
                this.value = null;
        } else {
            this.value = value;
        }

        let nameParts = modelName != null ? modelName.split(app.options.models.nestedOperator) : null;
        this.varName = nameParts == null ? null : nameParts[nameParts.length - 1];
        this.rootModelName = nameParts == null ? null : nameParts[0];
    }
}

//****************//

class HydrateApp
{
    #models: Map<string, any>;
    #eventListeners : Map<HydrateModelEventType, ((event: HydrateModelEvent) => any)[]>;
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

        let eventsList = ["ontouchstart", "ontouchmove", "ontouchend", "ontouchcancel"];
        //Add even listeners for every "on" event
        for(const key in document.body)
        {
            if (key.match(/^on(.*)/) && !eventsList.includes(key))
                eventsList.push(key);
        }
        //Start the router
        this.root.addEventListener("click", this.routeListener.bind(this));
        window.addEventListener("popstate", this.historyListener.bind(this));
    }

    get root(): Element {
        return document.querySelector(this.options.dom.root);
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
            model = this.#getModel(search);
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
        let model = this.#getModel(search)
        if(model == null)
            return model;
        return model[this.options.models.stateProperty];
    }
    /** Gets the model name of the search. Search can be a string (name of model) or the state of the model */
    name(search: string | object) : string {
        let model = this.#getModel(search)
        if(model == null)
            return model;
        return model[this.options.models.nameProperty];
    }
    /** Bind a new model to the framework */
    bind(name?: string, state?: object) {
        if(name == null)
            name = "";
        if(state == null)
            state = {};

        //If this model already exist, unbind it first
        if(this.#models[name] != undefined)
            this.unbind(name);

        let proxy = this.#makeProxy(state, name, false);
        this.#models.set(name, proxy);
        return proxy;
    }
    /** Unbinds the model from the framework related to the search. Search can be a string (name of model) or the state of the model */
    unbind(search: string | object): void {
        let model : any;
        let name : string;
        if(typeof search === "string")
        {
            model = this.#getModel(search);
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

        const app = this;
        //Remove and unbind all of it's children
        let triggerUnbind;
        triggerUnbind = function(name: string, state : any) {
            if(state instanceof Object)
            {
                Object.keys(state).forEach(key => {
                    triggerUnbind(name + "." + key, model[key]);
                    let event = new HydrateModelEvent(undefined, name, key, JSON.parse(JSON.stringify(model)), "unbind", app.root, undefined, app);
                    app.triggerEvent(app.root, event);
                });
            }
            
            let event = new HydrateModelEvent(undefined, name, app.options.models.wildcardOperator, JSON.parse(JSON.stringify(model)), "unbind", app.root, undefined, app);
            app.triggerEvent(app.root, event);
        }
        triggerUnbind(name, model);

        //Remove the listeners
        // this.boundModelListeners.forEach(x => {
        //     if(x.options.modelName.match("^" + rootModelName + "(\\.|$)"))
        //         this.removeModelListener(x.options, x.callback);
        // });
    }
    refresh(search? : string | object) {
        const app = this;

        if(search == null || search === "")
        {
            //Refresh all models
            this.models.forEach(x => this.refresh(x));
            return;
        }
        const model = this.model(search);
        const name = this.name(model);
        
        if(name == null)
            return;
        if(model instanceof Object)
            Object.keys(model).forEach(prop => {
                //Do a get to force the proxy to be created
                let property = model[prop];
                let event = new HydrateModelEvent(model, name, prop, null, "bind", app.root, undefined, app);
                app.triggerEvent(app.root, event);
                app.refresh(property);
            });
    }
    
    //******** Basic model methods ********//
    /** Adds an even listener for the following events */
    addEventListener(eventType: HydrateModelEventType, handler: (event: HydrateModelEvent) => any) : ((event: HydrateModelEvent) => any)
    {
        let listeners = this.#eventListeners.get(eventType);
        if(listeners === undefined)
        {
            listeners = [];
            this.#eventListeners.set(eventType, listeners);
        }
        if(listeners.includes(handler))
            return handler;
        listeners.push(handler);
        return handler;
    }
    /** Removes an event listener */
    removeEventListener(eventType: HydrateModelEventType, handler: (event: HydrateModelEvent) => any)
    {
        let listeners = this.#eventListeners.get(eventType);
        if(listeners === undefined)
            return;

        let index = listeners.indexOf(handler);
        if(index === -1)
            return;
        listeners.splice(index, 1);
    }
    removeEventListeners() {
        this.#eventListeners.clear();
    }

    /** Search can be a string (name of model) or the state of the model */
    #getModel(search): any {
        if(typeof search === 'string')
            return this.#models.get(search);
        return [...this.#models.values()].find(x => x === search);
    }
    #getModelMapKey(model: any): string {
        return [...this.#models].find(([key, value]) => model === value)[0];
    }

    /** Gets the full directive name for the HTML attribute */
    attribute(name: string) {
        return `${this.options.dom.attributePrefix}_${name}`;
    }
    //Internal
    #makeProxy(data: any, name: string, replace: boolean) {
        const app = this;
        let models = {};
        let proxy;

        let bindOrGet = function(obj: any, prop: string | symbol, replace: boolean) {
            if(obj[prop] instanceof Date || !(obj[prop] instanceof Object))
                return null;
            let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
            let modelName = name + "." + propName;

            let model = models[prop];
            if(!replace && model)
                return model;
            else {
                //Make proxy
                models[prop] = app.#makeProxy(obj[prop], modelName, replace);
                //Trigger bind event (we know this is a bind, because setting value triggers first event)
                
                //app.triggerEvent(app.getRootElement(), event);
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

                //Make sure functions apply to work on original prop by binding
                // if (typeof obj[prop] === 'function') {
                //     return obj[prop].bind(obj);
                // }
                
                //var type = 
                if (typeof obj[prop] === 'object' && obj[prop] != null)
                {
                    let model = bindOrGet(obj, prop, false);
                    //let model = null;
                    return model ? model : obj[prop];
                }
                else
                    return obj[prop];
            },
            set: function(obj, prop, value) {
                let previousValue = obj[prop];
                //Don't allow DOM update to trigger if value is up-to-date or this model is no longer bound
                if(app.model(name) !== proxy) {
                    obj[prop] = value;
                    return true;
                }
                
                //Delete old values for prop so we get unbind events
                let model = bindOrGet(obj, prop, false);
                // if(previousValue instanceof Object)
                //     Object.keys(previousValue).forEach(x => delete model[x]);
                obj[prop] = value == null || typeof value !== "object" ? value : value[app.options.models.stateProperty] ? value[app.options.models.stateProperty] : value;
                bindOrGet(obj, prop, true);
                // if(model) {
                
                //     app.refreshModel(model, name + "." + prop, app);
                // }
                let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                let event = new HydrateModelEvent(proxy, name, propName, previousValue, previousValue === undefined ? "bind" : "set", app.root, undefined, app);
                //Make sure the properties exist so we can bind to dom and find them
                app.triggerEvent(app.root, event);
                
                return true;
            },
            deleteProperty: function(obj, prop) {
                if (prop in obj) {
                    let property = JSON.parse(JSON.stringify(obj[prop]));
                    let model = models[prop];
                    if(property instanceof Object)
                        Object.keys(property).forEach(x => { if(model) delete model[x]});
                    delete obj[prop];
                    delete models[prop];
                    obj[prop] = property;
                    let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                    let event = new HydrateModelEvent(proxy, name, propName, property, "unbind", app.root, undefined, app);
                    app.triggerEvent(app.root, event);
                    if(!(property instanceof Object)) {
                        //This won't trigger automatically for sol values because there is no proxy to call generic event
                        event = new HydrateModelEvent(proxy, name + "." + propName, app.options.models.wildcardOperator, property, "unbind", app.root, undefined, app);
                        app.triggerEvent(app.root, event);
                    }
                  }
                  return true;
            }
        });

        
        //Now lets trigger nested proxies for all the properties
        this.refresh(proxy);
        if(!replace) {
            //Trigger a new event that the new data is being bound
            let event = new HydrateModelEvent(proxy, name, app.options.models.wildcardOperator, null, "bind", app.root, undefined, app);
            app.triggerEvent(app.root, event);
        }
        return proxy;
    }

    triggerEvent(target: Element, event: HydrateModelEvent)
    {
        //Call our callback functions
        let listeners = this.#eventListeners.get(event.type) ?? [];
        [...listeners].forEach(handler => {
            handler(event);
        });

        //The parent is the element to start affecting at
        //It's time to update the DOM
        let domSelectors = this.#buildModelQuerySelectors(event.modelName, event.propName);
        domSelectors.forEach(s => {
            let children = target.querySelectorAll(s);
            //this.updateDomForChild(parent, event);
            //children.forEach(x => this.updateDomForChild(x, event));
        });
    }

    #buildModelQuerySelectors(modelName : string, propName: string) : string[] {
        return this.#buildModelSelectors(modelName).map(x => {
            return "[" + this.attribute(this.options.dom.attributes.model) + "='" + x + "']"
        });
    }
    #buildModelSelectors(modelName : string) : string[] {
        const parts = modelName.split(".");
        let selectors = [modelName];
        if(parts.length == 1)
        {
            if(parts[0] !== this.options.models.wildcardOperator)
                selectors.push(this.options.models.wildcardOperator);
            return selectors;
        }
        
        for(let i = 0; i < parts.length; i++)
        {
            let selector = [... parts];
            selector[i] = this.options.models.wildcardOperator;
            selectors.push(selector.join("."));
        }
        selectors.push(this.options.models.wildcardOperator);
        return selectors;
    }
    #mutationCallback(mutations, observer) {
        let bindUpdates = [];
        mutations.forEach( m => {
            if(m.type === 'childList')
                m.addedNodes.forEach(n => this.bindNodeRecursive(n));
            if(m.type === 'attributes') 
                this.bindNodeRecursive(m.target);
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