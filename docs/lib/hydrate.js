/*
    With Hydrate, you can bring life to your static web page by utilizing dynamic data and reactive components.
    Powerful features like 2-way modeling binding and client-side routing come out of the box.
*/
//******** Options *******//
/** Options for Hydrate DOM manipulation */
class HydrateDOMOptions {
    root;
    attributePrefix;
    attributes;
    modifiers;
    constructor() {
        this.root = "body";
        this.attributePrefix = "h";
        this.attributes = new HydrateHTMLAttributeOptions();
        this.modifiers = new HydrateHTMLAttributeModifiers();
    }
}
class HydrateHTMLAttributeOptions {
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
    //Functions and execution
    callback = "callback"; //Calls a property function
    handler = "handler"; //Fires a callback when the "on" event of the element is fired
    function = "function";
    dispatch = "dispatch"; //dispatches an event
    //Templating and Components
    script = "script";
    template = "template"; //template changes queries user of the templates then regenerate
    initialize = "initialize"; //script called on creation of template to initialize component
    component = "component"; //="[PROP] [TEMPLATE] [property | model | array | dictionary | map]?
    //Routing
    route = "route"; //Make element only respond to route request
    page = "page"; //Tells component how page should be inserted
}
class HydrateHTMLAttributeModifiers {
    array;
    dictionary;
    model;
    prop;
    append;
    enumerable;
    constructor() {
        this.array = "array"; //generate a component for each element in the array
        this.dictionary = "dictionary"; //generate a component for each value pair in the model
        this.model = "model"; //generate component using the model as the model
        this.prop = "prop"; //Generate a component using the prop as the model (default)
        this.append = "append"; //Append component text instead of deleting everything
        this.enumerable = "enumerable"; //only allow enumerable properties to be turned into components
    }
}
/** Options for Hydrate routing */
class HydrateRouterOptions {
    hashRouting;
    exactMatch;
    constructor() {
        this.hashRouting = true;
        this.exactMatch = true;
    }
}
class HydrateModelOptions {
    stateProperty;
    nameProperty;
    parentModelproperty;
    baseModelProperty;
    wildcardOperator;
    insertionOperator;
    nestedOperator;
    constructor() {
        this.stateProperty = "__state";
        this.nameProperty = "__name";
        this.parentModelproperty = "__parent";
        this.baseModelProperty = "__base";
        this.wildcardOperator = "*";
        this.insertionOperator = "_";
        this.nestedOperator = ".";
    }
}
/** Hydrate app options */
class HydrateAppOptions {
    dom;
    router;
    models;
    constructor() {
        this.dom = new HydrateDOMOptions();
        this.router = new HydrateRouterOptions();
        this.models = new HydrateModelOptions();
    }
}
class HydrateModelEvent {
    hydrate;
    target;
    type;
    model;
    modelName;
    rootModelName;
    state;
    previousState;
    propName;
    propFullName;
    prop;
    constructor(type, model, previousState, propName, target, hydrate, modelName) {
        this.hydrate = hydrate;
        this.target = target;
        this.type = type;
        this.model = model;
        this.modelName = hydrate.name(model) ?? modelName;
        this.rootModelName = this.modelName != null
            ? this.modelName.split(hydrate.options.models.nestedOperator)[0]
            : undefined;
        this.state = hydrate.state(model) ?? model;
        this.previousState = previousState;
        this.propName = propName;
        this.propFullName = (this.modelName != null && this.propName != null)
            ? this.modelName + hydrate.options.models.nestedOperator + this.propName
            : undefined;
        this.prop = (this.state instanceof Object)
            ? this.state[this.propName]
            : undefined;
    }
}
//****************//
class HydrateDomAttributeArguments {
    arg1;
    arg2;
    arg3;
    constructor(arg1, arg2, arg3) {
        this.arg1 = arg1;
        this.arg2 = arg2;
        this.arg3 = arg3;
    }
}
class HydrateDomUpdateAttributes {
    model;
    attribute;
    property;
    toggle;
    class;
    delete;
    input;
    callback;
    handler;
    function;
    dispatch;
    script;
    template;
    initialize;
    component;
    route;
    page;
    event;
    static;
    condition;
}
class HydrateDeterminePropResult {
    success;
    prop;
    propName;
    constructor(prop, propName) {
        this.success = prop === undefined ? false : true;
        this.prop = prop;
        this.propName = propName;
    }
}
//*************//
class HydrateRouteRequest {
    route;
    url;
    pathname;
    search;
    query;
    hash;
    params;
    state;
}
class HydrateRouteResponse {
    hydrate;
    continue; //Continues down routing middleware pipeliine and processes next piece of middleware (will auto call resolve if no more middleware)
    resolve; //Completes the routing middleware pipeline, and continues with the rest of routing (dom routing)
}
class HydrateRoute {
    path;
    callback;
}
class HydrateRouterContext {
    path;
    url;
    pathname;
    search;
    hash;
    state;
    constructor() {
        this.path = null;
        this.url = null;
        this.pathname = null;
        this.search = null;
        this.hash = null;
        this.state = null;
    }
}
//****************//
class HydrateApp {
    #models;
    #eventListeners;
    #observer;
    #routes;
    #routerContext;
    options;
    constructor(options) {
        this.options = options ?? new HydrateAppOptions();
        this.#models = new Map();
        this.#eventListeners = new Map();
        const app = this;
        const mutationOptions = {
            subtree: true,
            childList: true,
            attributes: true,
            attributeFilter: [
                this.attribute(this.options.dom.attributes.model),
                this.attribute(this.options.dom.attributes.attribute),
                this.attribute(this.options.dom.attributes.property),
                this.attribute(this.options.dom.attributes.toggle),
                this.attribute(this.options.dom.attributes.class),
                this.attribute(this.options.dom.attributes.delete),
                this.attribute(this.options.dom.attributes.event),
                this.attribute(this.options.dom.attributes.static),
                this.attribute(this.options.dom.attributes.condition),
                this.attribute(this.options.dom.attributes.callback),
                this.attribute(this.options.dom.attributes.handler),
                this.attribute(this.options.dom.attributes.function),
                this.attribute(this.options.dom.attributes.dispatch),
                this.attribute(this.options.dom.attributes.component),
                this.attribute(this.options.dom.attributes.route),
                this.attribute(this.options.dom.attributes.page),
            ],
        };
        //Start the dom
        this.#observer = new MutationObserver(this.#mutationCallback.bind(this));
        this.#observer.observe(this.root, mutationOptions);
        this.root.addEventListener("input", this.#inputListener.bind(this));
        //Start the router
        this.#routes = [];
        this.#routerContext = new HydrateRouterContext();
        // this.root.addEventListener("click", this.routeListener.bind(this));
        window.addEventListener("popstate", this.#historyListener.bind(this));
    }
    //=============== Helpful methods ==============/
    /** Gets the root element the app is attached to */
    get root() {
        return document.querySelector(this.options.dom.root);
    }
    /** Gets the full directive name for the HTML attribute */
    attribute(name) {
        return `${this.options.dom.attributePrefix}-${name}`;
    }
    /** Makes a copy of a JS object */
    copy(value) {
        return JSON.parse(JSON.stringify(value));
    }
    //******** Basic model methods ********//
    /** Returns a list of the models bound to the framework */
    get models() {
        return [...this.#models.values()];
    }
    /** Retrieves the model resulting from the search. Search can be a string (name of model) or the state of the model */
    model(search) {
        if (search == null)
            return undefined;
        let model;
        let name;
        if (typeof search === "string") {
            model = this.#getRootModel(search);
            name = search;
        }
        else {
            model = search;
            name = this.name(search);
        }
        if (name === undefined || model === undefined)
            return undefined;
        const nameParts = name.split(this.options.models.nestedOperator);
        if (nameParts.length === 0)
            //We asked for a root model and found it    
            return model;
        for (let i = 1; i < nameParts.length; i++) {
            model = model[nameParts[i]];
            //If we can't dive any further but we haven't reached our model, then it doesn't exist
            if (model == null && i < nameParts.length + 1)
                return undefined;
        }
        return model;
    }
    /** Retrieves the parent model of the model */
    parent(search) {
        let model = (typeof search === "object")
            ? search : this.model(search);
        if (model == null)
            return model;
        return this.model(model[this.options.models.parentModelproperty]);
    }
    base(search) {
        let model = (typeof search === "object")
            ? search : this.model(search);
        if (model == null)
            return model;
        return this.model(model[this.options.models.baseModelProperty]);
    }
    /** Retrieves the state associated with the search. Search can be a string (name of model) or the state of the model */
    state(search) {
        let model = (typeof search === "object")
            ? search : this.model(search);
        if (model == null)
            return model;
        return model[this.options.models.stateProperty];
    }
    /** Gets the model name of the search. Search can be a string (name of model) or the state of the model */
    name(search) {
        if (search == null)
            return undefined;
        let model = (typeof search !== "string")
            ? search : this.model(search);
        if (model == null)
            return undefined;
        return model[this.options.models.nameProperty];
    }
    /** Bind a new model to the framework */
    bind(name, state) {
        if (name == null)
            name = "";
        if (state == null)
            state = {};
        //If this model already exist, unbind it first
        if (this.#models.get(name) != undefined)
            this.unbind(name);
        let proxy = this.#makeProxy(state, name, undefined);
        this.#models.set(name, proxy);
        this.dispatch("bind", proxy, undefined, undefined, this.root, "all");
        return proxy;
    }
    /** Unbinds the model from the framework related to the search. Search can be a string (name of model) or the state of the model */
    unbind(search) {
        let model;
        let name;
        if (typeof search === "string") {
            model = this.model(search);
            name = search;
        }
        else {
            model = search;
            name = this.name(search);
        }
        let nameParts = name.split(this.options.models.nestedOperator);
        const rootModelName = nameParts[0];
        this.#models.delete(rootModelName);
        this.dispatch("unbind", model, undefined, this.state(model), this.root, "all");
    }
    //Refreshes all of the data on the page
    refresh(mode) {
        this.dispatch("bind", undefined, undefined, undefined, this.root, mode ?? "all", "*");
        this.dispatch("route", undefined, undefined, undefined, this.root, mode ?? "all", "*");
    }
    //******** Basic model methods ********//
    /** Subscribes to an even listener for the following events */
    subscriptions(search, handler) {
        const name = (typeof search === "string")
            ? search
            : this.name(search);
        if (search != null && name == null)
            return null;
        let results = [];
        [...this.#eventListeners.keys()].forEach(key => {
            if (search != null && search !== key)
                return;
            let listeners = this.#eventListeners.get(key);
            if (listeners == null)
                return;
            listeners.forEach(listener => {
                if (handler != null && handler !== listener)
                    return;
                results.push({ modelName: key, handler: listener });
            });
        });
        return results;
    }
    subscribe(search, handler) {
        const name = (typeof search === "string")
            ? search
            : this.name(search);
        if (name == null)
            return null;
        let listeners = this.#eventListeners.get(name);
        if (listeners === undefined) {
            listeners = [];
            this.#eventListeners.set(name, listeners);
        }
        if (listeners.includes(handler))
            return handler;
        listeners.push(handler);
        return handler;
    }
    /** Removes an event listener */
    unsubscribe(search, handler) {
        const name = (typeof search === "string")
            ? search
            : this.name(search);
        if (name == null)
            return null;
        const listeners = this.#eventListeners.get(name);
        if (listeners == null)
            return null;
        let index = listeners.indexOf(handler);
        if (index === -1)
            return;
        listeners.splice(index, 1);
    }
    //======== Routing =============//
    //Queries the routes
    routes(path, handler) {
        return this.#routes.filter(route => (path == null || route.path === path) && (handler == null || handler === route.callback));
    }
    route(path, callback) {
        let route = {
            path: path,
            callback: callback
        };
        this.#routes.push(route);
        return route;
    }
    //Navigates to the url
    navigate(url, state) {
        if (url == null)
            url = window.location.pathname + window.location.search + window.location.hash;
        history.pushState(state, "", url);
        this.#navigateToRoute(state);
    }
    //Reloads the current page
    reload() {
        history.go();
    }
    //Goes backwards in browser history
    back() {
        history.back();
    }
    //Goes forward in browser history
    forward() {
        history.forward();
    }
    //Updates the history of the current entry
    history(state, url) {
        history.replaceState(state, "", url === undefined ? this.#routerContext.url : url);
    }
    //******** Advance features methods ********//
    /** Generates and dispatches events and sends it to HTML and listeners */
    async dispatch(type, model, propName, previousState, target, mode, modelName) {
        const routerContext = this.#routerContext;
        const attribute = this.attribute(this.options.dom.attributes.model);
        //Get the DOM elements subscriped for model events that isn't part of a template model (requires model insertion)
        const selector = `[${attribute}]:not([${attribute}*=${this.options.models.insertionOperator}])`;
        let listeningElements = [];
        if (target.isConnected) {
            if (target.matches(selector))
                listeningElements.push(target);
            listeningElements = listeningElements.concat([...target.querySelectorAll(selector)]);
        }
        let eventListeners = [...this.#eventListeners.keys()];
        //Figure out all the models we're subscribed to
        let searchKeys = [];
        if (mode === 'all' || mode === 'domOnly') {
            searchKeys = listeningElements.map(x => x.attributes[attribute].value);
        }
        if (mode === 'all' || mode === 'subscriptionsOnly') {
            searchKeys = searchKeys.concat(eventListeners);
        }
        //Determine all the base handlers to notify (using a distinct list)
        let eventMappings = new Map();
        [...new Set(searchKeys)].forEach(key => {
            eventMappings.set(key, this.#generateEvents(type, target, this.name(model) ?? modelName, model, propName, key, previousState));
        });
        //Fire all the event handlers
        if (mode === 'all' || mode === 'subscriptionsOnly') {
            eventListeners.forEach(key => {
                let events = eventMappings.get(key);
                if (events == null)
                    return;
                this.#eventListeners.get(key).forEach(handler => {
                    events.forEach(event => {
                        handler(event);
                    });
                });
            });
        }
        //Trigger all the DOM updates
        if (mode === 'all' || mode === 'domOnly') {
            listeningElements.forEach(async (element) => {
                let events = eventMappings.get(element.attributes[attribute].value);
                if (events == null)
                    return;
                events.forEach(async (event) => {
                    await this.#dom(event, element, routerContext);
                });
            });
        }
    }
    //====================
    /** Search can be a string (name of model) or the state of the model */
    #getRootModel(search) {
        let model;
        let name;
        let nameParts;
        if (typeof search === "string") {
            nameParts = search.split(this.options.models.nestedOperator);
            model = this.#models.get(nameParts[0]);
            if (model == null)
                return undefined;
            name = search;
        }
        else {
            name = this.name(search);
            if (name == null)
                return undefined;
            nameParts = name.split(this.options.models.nestedOperator);
            model = this.#models.get(nameParts[0]);
            if (model == null)
                return undefined;
        }
        return model;
    }
    //Internal
    #makeProxy(data, name, parent) {
        const app = this;
        const baseName = parent == null ? name : parent.split(this.options.models.nestedOperator)[0];
        let models = {};
        let proxy;
        let bindOrGet = function (obj, prop, parentName) {
            if (obj[prop] instanceof Date || !(obj[prop] instanceof Object))
                return null;
            let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
            let modelName = name + app.options.models.nestedOperator + propName;
            let model = models[prop];
            if (model !== undefined)
                return model;
            else {
                //Make proxy
                models[prop] = app.#makeProxy(obj[prop], modelName, parentName);
                return models[prop];
            }
        };
        proxy = new Proxy(data, {
            get(obj, prop) {
                if (prop === app.options.models.stateProperty)
                    return obj;
                if (prop === app.options.models.nameProperty)
                    return name;
                if (prop === app.options.models.parentModelproperty)
                    return parent;
                if (prop === app.options.models.baseModelProperty)
                    return baseName;
                if (prop === 'toJson') {
                    if (typeof obj.toJson === 'function')
                        return obj.toJson;
                    else
                        return function () { return JSON.stringify(this); };
                }
                if (obj[prop] instanceof Object && obj[prop] != null) {
                    let model = bindOrGet(obj, prop, name);
                    //let model = null;
                    return model ? model : obj[prop];
                }
                else
                    return obj[prop];
            },
            set: function (obj, prop, value) {
                let previousValue = obj[prop];
                obj[prop] = value;
                models = {};
                //Don't allow DOM update to trigger if value is up-to-date or this model is no longer bound
                if (app.model(name) !== proxy) {
                    return true;
                }
                // if(!obj.propertyIsEnumerable(prop))
                //     return;
                let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                app.dispatch("set", proxy, propName, previousValue, app.root, "all");
                return true;
            },
            deleteProperty: function (obj, prop) {
                if (prop in obj) {
                    let property = obj[prop];
                    delete obj[prop];
                    if (models[prop] != undefined)
                        delete models[prop];
                    let propName = (typeof prop === 'symbol') ? prop.toString() : prop;
                    app.dispatch("unbind", proxy, propName, property, app.root, "all");
                }
                return true;
            }
        });
        return proxy;
    }
    #generateEvents(type, target, modelName, model, propName, searchKey, previousState) {
        const nameParts = modelName.split(this.options.models.nestedOperator);
        const keyParts = searchKey.split(this.options.models.nestedOperator);
        //match on any combination of nested models with wildcards such as: "people.profile.*.info.*""
        if (nameParts.length > keyParts.length) {
            //This even won't concern you
            if (nameParts.length > keyParts.length + 1 && propName !== undefined) {
                return [];
            }
        }
        else if (keyParts.length > nameParts.length) {
            //We are a child of this change, propogate to the correct event that would happen to the child
            switch (type) {
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
        for (i; i < keyParts.length; i++) {
            //If we match, then continue checking for full name
            if (i > 0 && keyParts[i] === this.options.models.wildcardOperator) {
                let reference = type == 'unbind' ? localPreviousState : localModel;
                if (reference instanceof Object && reference != null) {
                    return Object.keys(reference).flatMap(x => {
                        let parts = keyParts.map(x => x);
                        parts[i] = x;
                        let key = parts.join(this.options.models.nestedOperator);
                        return this.#generateEvents(type, target, modelName, model, propName, key, previousState);
                    });
                }
                else {
                    return [];
                }
            }
            else if (i == 0 && nameParts[i] === this.options.models.wildcardOperator) {
                if (keyParts[i] !== this.options.models.wildcardOperator) {
                    name = keyParts[i];
                    propName = undefined;
                    localModel = this.model(name);
                    localPreviousState = this.state(localModel);
                }
                else {
                    [...this.#models.keys()].flatMap(modelName => {
                        let model = this.#models.get(modelName);
                        let previousState = this.state(model);
                        return this.#generateEvents(type, target, modelName, model, undefined, searchKey, previousState);
                    });
                }
            }
            else if ((i == 0 && keyParts[0] === this.options.models.wildcardOperator)
                || i >= nameParts.length || keyParts[i] === nameParts[i]) {
                if (i == 0) {
                    name = nameParts[i];
                }
                else {
                    name += this.options.models.nestedOperator + keyParts[i];
                    let x = keyParts[i];
                    if (i >= nameParts.length) {
                        localModel = localModel instanceof Object && localModel != null
                            ? localModel[x]
                            : undefined;
                        localPreviousState = localPreviousState instanceof Object && localPreviousState != null
                            ? localPreviousState[x]
                            : undefined;
                    }
                }
            }
            else {
                //no match
                return [];
            }
            //We reached the end of the model name where the event happens, if this doesn't match then ignore
            if (nameParts.length < keyParts.length && i == nameParts.length - 1) {
                if (keyParts[i + 1] !== propName
                    && propName !== undefined
                    && keyParts[i + 1] !== this.options.models.wildcardOperator) {
                    //We've reached the end and the prop name doesn't match our path, so ignore
                    return [];
                }
            }
        }
        //We didn't find any relevant data for the model based on the search key
        if ((type !== 'route' && propName !== undefined) && localModel === undefined && previousState === undefined) {
            return [];
        }
        if (keyParts.length === nameParts.length) {
            return [new HydrateModelEvent(type, localModel, localPreviousState, propName, target, this)];
        }
        else {
            return [new HydrateModelEvent(type, localModel, localPreviousState, undefined, target, this, name)];
        }
        ;
    }
    #mutationCallback(mutations, observer) {
        let updatedElements = [];
        const modelAttribute = this.attribute(this.options.dom.attributes.model);
        const selector = `[${modelAttribute}]:not([${modelAttribute}*=${this.options.models.insertionOperator}])`;
        mutations.forEach(mutation => {
            if (!(mutation.target instanceof HTMLElement))
                return;
            const target = mutation.target;
            switch (mutation.type) {
                case "attributes":
                    {
                        if (mutation.target.matches(selector))
                            updatedElements.push(mutation.target);
                    }
                case "childList":
                    {
                        mutation.addedNodes.forEach(node => {
                            if (!(node instanceof HTMLElement))
                                return;
                            if (node.matches(selector))
                                updatedElements.push(node);
                            node.querySelectorAll(selector).forEach(x => {
                                updatedElements.push(x);
                            });
                        });
                    }
            }
        });
        //Update each element
        [...new Set(updatedElements)].forEach(element => {
            //Look up the lowest level model to bind, let the dispatch method handle generating the specifc event
            this.dispatch("bind", undefined, undefined, undefined, element, "domOnly", "*");
        });
    }
    #inputListener(event) {
        var attributes = this.#loadDomAttributes(event.target);
        if (attributes.model !== undefined && attributes.input !== undefined) {
            let model = this.model(attributes.model[0].arg1);
            if (model === undefined && (typeof model == "object"))
                return;
            attributes.input.forEach(arg => {
                model[arg.arg1] = event.target[arg.arg2];
            });
        }
    }
    /** Updates the DOM using the provided model event */
    async #dom(event, target, routerContext) {
        try {
            if (target == null)
                target = this.root;
            let partOfTemplate = target;
            do {
                //Don't trigger an event if it's inside a template
                if (partOfTemplate.attributes[this.attribute(this.options.dom.attributes.template)])
                    return;
                partOfTemplate = partOfTemplate.parentElement;
            } while (partOfTemplate !== null);
            //Determine how to update our DOM
            var attributes = this.#loadDomAttributes(target);
            let routeRequest;
            //Only allow elements with routing to respond to route request
            if (event.type === 'route') {
                if (attributes.route === undefined)
                    return;
                let result = this.#getDomRouteRequest(event, attributes, routerContext);
                if (result != null) {
                    document.title = result.title !== "" ? result.title : document.title;
                    routeRequest = result.request;
                }
            }
            //If we are static, don't trigger anything
            if (attributes.static !== undefined && attributes.static[0].arg1 === "true")
                return;
            if (attributes.event !== undefined) {
                let hasEvent = false;
                attributes.event.forEach(arg => {
                    if (arg.arg1 === event.type)
                        hasEvent = true;
                });
                if (!hasEvent)
                    return;
            }
            if (attributes.condition !== undefined) {
                let localEvent = this.#createLocalizedEvent(target, event, event.propName);
                let arg = attributes.condition[0];
                let expression = `${arg.arg1 ?? ""} ${arg.arg2 ?? ""} ${arg.arg3 ?? ""}`.trim();
                let prop = this.#getScriptValue(expression, localEvent, event.prop, routeRequest);
                if (prop !== true)
                    return;
            }
            let responded = false;
            if (attributes.attribute !== undefined)
                responded = this.#updateHTMLAttribute(target, event, attributes, routeRequest) || responded;
            if (attributes.property !== undefined)
                responded = this.#updateHTMLProperty(target, event, attributes, routeRequest) || responded;
            if (attributes.toggle !== undefined)
                responded = this.#updateHTMLToggleAttribute(target, event, attributes, routeRequest) || responded;
            if (attributes.class !== undefined)
                responded = this.#updateHTMLToggleClass(target, event, attributes, routeRequest) || responded;
            if (attributes.callback !== undefined)
                responded = this.#updateHTMLCallback(target, event, attributes, routeRequest) || responded;
            if (attributes.handler !== undefined)
                responded = this.#updateHTMLHandler(target, event, attributes, routeRequest) || responded;
            if (attributes.function !== undefined)
                responded = this.#updateHTMLFunction(target, event, attributes, routeRequest) || responded;
            if (attributes.dispatch !== undefined)
                responded = this.#updateHTMLDispatch(target, event, attributes, routeRequest) || responded;
            if (attributes.component !== undefined)
                responded = await this.#updateHTMLComponent(target, event, attributes, routeRequest) || responded;
            if (attributes.delete !== undefined)
                responded = this.#updateHTMLDeleteElement(target, event, attributes, routeRequest) || responded;
            //If we are static, don't trigger anything
            if (responded === true && attributes.static !== undefined)
                target.setAttribute(this.attribute(this.options.dom.attributes.static), "true");
        }
        catch (error) {
            console.error("failed to updated element");
        }
    }
    #loadDomAttributes(target) {
        const app = this;
        let getArguments = function (target, name) {
            let attribute = target.attributes[app.attribute(name)];
            if (attribute === undefined)
                return undefined;
            return app.#splitAttributeValue(attribute.value.trim());
        };
        let attributes = new HydrateDomUpdateAttributes();
        attributes.model = getArguments(target, this.options.dom.attributes.model);
        attributes.attribute = getArguments(target, this.options.dom.attributes.attribute);
        attributes.property = getArguments(target, this.options.dom.attributes.property);
        attributes.toggle = getArguments(target, this.options.dom.attributes.toggle);
        attributes.class = getArguments(target, this.options.dom.attributes.class);
        attributes.delete = getArguments(target, this.options.dom.attributes.delete);
        attributes.input = getArguments(target, this.options.dom.attributes.input);
        attributes.callback = getArguments(target, this.options.dom.attributes.callback);
        attributes.handler = getArguments(target, this.options.dom.attributes.handler);
        attributes.function = getArguments(target, this.options.dom.attributes.function);
        attributes.dispatch = getArguments(target, this.options.dom.attributes.dispatch);
        attributes.script = getArguments(target, this.options.dom.attributes.script);
        attributes.template = getArguments(target, this.options.dom.attributes.template);
        attributes.component = getArguments(target, this.options.dom.attributes.component);
        attributes.initialize = getArguments(target, this.options.dom.attributes.initialize);
        attributes.route = getArguments(target, this.options.dom.attributes.route);
        attributes.page = getArguments(target, this.options.dom.attributes.page);
        attributes.event = getArguments(target, this.options.dom.attributes.event);
        attributes.static = getArguments(target, this.options.dom.attributes.static);
        attributes.condition = getArguments(target, this.options.dom.attributes.condition);
        return attributes;
    }
    #splitAttributeValue(value) {
        if (value == null)
            return undefined;
        //return value.split(/({{.+}})?;/).filter(x => x !== undefined).map(x => { 
        return value.split(';').map(x => {
            //return x.trim().split(/\s+/)
            let baseParams = x.trim();
            //splits on two whitespaces: "[model_prop] [el_prop] [THIRD_PARAM]"
            let regParams = baseParams.match(/[^\s]+\s+[^\s]+\s+/);
            if (!regParams) {
                let args = baseParams.split(/\s+/);
                return new HydrateDomAttributeArguments(args[0], args[1], undefined);
            }
            //We have a 3rd argument for a replacement/insertion value to stick into arg 2 field
            let result = baseParams.split(/\s+/);
            return new HydrateDomAttributeArguments(result[0], result[1], baseParams.substring(regParams[0].length));
        });
    }
    //******** HTML DOM MANIUPLATIONS *****//
    #determinePropValue(event, arg) {
        //If routing, accept it as valid
        const wildcard = this.options.models.wildcardOperator;
        if (event.propName === undefined) {
            if (arg.arg1 !== wildcard) {
                if (event.state instanceof Object) {
                    return new HydrateDeterminePropResult(event.state[arg.arg1], arg.arg1);
                }
                else
                    return new HydrateDeterminePropResult();
            }
            else {
                if (event.state instanceof Object) {
                    let keys = Object.keys(event.state);
                    let key = keys.length - 1;
                    return new HydrateDeterminePropResult(keys[key], key.toString());
                }
                else
                    return new HydrateDeterminePropResult(event.state, undefined);
            }
        }
        else if (arg.arg1 === event.propName || arg.arg1 === wildcard)
            return new HydrateDeterminePropResult(event.prop, event.propName);
        //This event doesn't match, so ignore
        else
            return new HydrateDeterminePropResult();
    }
    #createLocalizedEvent(target, event, propName) {
        let type = event.type;
        // if(event.propName === undefined && event.propName !== propName)
        // {
        //     switch(type)
        //     {
        //         case "bind":
        //         case "set":
        //             type = "bind";
        //             break;
        //     }
        // }
        return new HydrateModelEvent(type, event.model, event.previousState, propName, target, event.hydrate, event.modelName);
    }
    #getScriptValue(expression, event, prop, route) {
        if (expression === undefined)
            return prop;
        let match = expression.match(/^{{(.*)}}$/);
        if (match != null) {
            return new Function("event", "route", `'use strict'; return ${match[1]}`)(event, route);
        }
        let attrib = this.attribute(this.options.dom.attributes.script);
        let element = document.querySelector(`[${attrib}=${expression}]`);
        if (element === undefined)
            return prop;
        let func = new Function(`'use strict'; return ${element.innerText.trim()}`)();
        if (func == null || (typeof func !== "function"))
            return prop;
        return func(event, route);
    }
    #getDomRouteRequest(event, attributes, routerContext) {
        if (event.type !== 'route' || attributes.route === undefined)
            return undefined;
        for (let i = 0; i < attributes.route.length; i++) {
            let route = attributes.route[i];
            let match = this.#matchRoute(route.arg1, routerContext);
            if (match == null)
                continue;
            return {
                title: `${route.arg2 ?? ""} ${route.arg3 ?? ""}`.trim(),
                request: this.#generateRouteRequest(route.arg1, match, routerContext)
            };
        }
        return undefined;
    }
    async #getTemplate(templateSearch, templateSource) {
        if (templateSource === 'template') {
            const templateAttribute = this.attribute(this.options.dom.attributes.template);
            let template = document.querySelector(`[${templateAttribute}=${templateSearch}]`);
            if (template == null) {
                console.error(`cannont find template ${templateSearch} from source ${templateSource}`);
                return Promise.resolve([]);
            }
            return Promise.resolve((template instanceof HTMLTemplateElement)
                ? [...template.content.childNodes]
                : [...template.childNodes]);
        }
        try {
            let fetchResult = await fetch(templateSearch);
            let html = await fetchResult.text();
            let div = document.createElement("div");
            div.innerHTML = html;
            return Promise.resolve([...div.childNodes]);
        }
        catch (error) {
            console.error(error);
            return Promise.reject(error);
        }
    }
    async #insertComponent(template, event, propNames, append, routeRequest) {
        if (template === undefined)
            return undefined;
        let target = event.target;
        while (!append && target.firstChild) {
            target.removeChild(target.firstChild);
        }
        const app = this;
        const modelAttribute = this.attribute(this.options.dom.attributes.model);
        const insertionOperator = this.options.models.insertionOperator;
        const modelSelector = `[${modelAttribute}*=${insertionOperator}]`;
        const intializeAttribute = this.attribute(this.options.dom.attributes.initialize);
        const initializeSelector = `[${intializeAttribute}]`;
        const insertModelName = function (element, propName) {
            let localEvent = app.#createLocalizedEvent(element, event, propName);
            let modelName = localEvent.propFullName ?? localEvent.modelName;
            let value = element.attributes[modelAttribute].value.trim().replace(insertionOperator, modelName);
            element.setAttribute(modelAttribute, value);
        };
        const initializeComponent = function (element, propName) {
            //Initialize the component if script provided
            let func = new Function(`'use strict'; return ${element.innerText.trim()}`)();
            if (func == null || (typeof func !== "function"))
                return;
            let intializeEvent = app.#createLocalizedEvent(element, event, propName);
            intializeEvent.type = 'initialize';
            func(intializeEvent, routeRequest);
        };
        //for(let i = 0; i < propNames.length; i++)
        let children = [];
        propNames.forEach(propName => {
            template.forEach(x => {
                let node = x.cloneNode(true);
                children.push(node);
                if (!(node instanceof HTMLElement))
                    return;
                //Inject model name and initialize component
                if (node.matches(modelSelector))
                    insertModelName(node, propName);
                node.querySelectorAll(modelSelector).forEach(element => {
                    insertModelName(element, propName);
                });
                //Call initialization script
                if (node.matches(initializeSelector))
                    initializeComponent(node, propName);
                node.querySelectorAll(initializeSelector).forEach(element => {
                    initializeComponent(element, propName);
                });
            });
        });
        children.forEach(x => target.appendChild(x));
    }
    #updateHTMLAttribute(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.attribute.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate attribute for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let localEvent = this.#createLocalizedEvent(target, event, propResult.propName);
            let prop = this.#getScriptValue(arg.arg3, localEvent, propResult.prop, routeRequest);
            if (target.attributes[arg.arg2]?.value !== prop) {
                target.setAttribute(arg.arg2, prop);
            }
            updated = true;
        });
        return updated;
    }
    #updateHTMLProperty(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.property.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate property for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let localEvent = this.#createLocalizedEvent(target, event, propResult.propName);
            let prop = this.#getScriptValue(arg.arg3, localEvent, propResult.prop, routeRequest);
            if (target[arg.arg2] !== prop) {
                target[arg.arg2] = prop;
            }
            updated = true;
        });
        return updated;
    }
    #updateHTMLToggleAttribute(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.toggle.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate toggle for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let localEvent = this.#createLocalizedEvent(target, event, propResult.propName);
            let prop = this.#getScriptValue(arg.arg3, localEvent, propResult.prop, routeRequest);
            if (target.hasAttribute(arg.arg2) !== (prop === true)) {
                target.toggleAttribute(arg.arg2, prop === true);
                updated = true;
            }
        });
        return updated;
    }
    #updateHTMLToggleClass(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.class.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate toggle class for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let localEvent = this.#createLocalizedEvent(target, event, propResult.propName);
            let prop = this.#getScriptValue(arg.arg3, localEvent, propResult.prop, routeRequest);
            if (target.classList.contains(arg.arg2) !== (prop === true)) {
                target.classList.toggle(arg.arg2, prop === true);
                updated = true;
            }
        });
        return updated;
    }
    #updateHTMLDeleteElement(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.delete.forEach(arg => {
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let expression = `${arg.arg2 ?? ""} ${arg.arg3 ?? ""}`.trim();
            let localEvent = this.#createLocalizedEvent(target, event, propResult.propName);
            let prop = this.#getScriptValue(expression, localEvent, propResult.prop, routeRequest);
            if (prop === true) {
                target.parentElement.removeChild(target);
                updated = true;
            }
        });
        return updated;
    }
    #updateHTMLCallback(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.callback.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate callback for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let propNames = event.type === "route" || propResult.propName !== undefined
                ? [propResult.propName]
                : (event.state instanceof Object) ? Object.keys(event.state) : [undefined];
            let callback = (event.state instanceof Object) ? event.state[arg.arg2] : undefined;
            if (callback == null || (typeof callback !== "function"))
                return false;
            propNames.forEach(propName => {
                let localEvent = this.#createLocalizedEvent(target, event, propName);
                let prop = this.#getScriptValue(arg.arg3, localEvent, undefined, routeRequest);
                callback(localEvent, prop, routeRequest);
                updated = true;
            });
        });
        return updated;
    }
    #updateHTMLFunction(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.function.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate function for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let propNames = event.type === 'route' || propResult.propName !== undefined
                ? [propResult.propName]
                : (event.state instanceof Object) ? Object.keys(event.state) : [undefined];
            //retrieve the function in question
            let func = new Function(`'use strict'; return ${arg.arg2}`)();
            if (func == null || (typeof func !== "function"))
                return false;
            propNames.forEach(propName => {
                let localEvent = this.#createLocalizedEvent(target, event, propName);
                let prop = this.#getScriptValue(arg.arg3, localEvent, undefined, routeRequest);
                func(localEvent, prop, routeRequest);
                updated = true;
            });
        });
        return updated;
    }
    #updateHTMLHandler(target, event, attributes, routeRequest) {
        let updated = false;
        attributes.handler.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate handler for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            if (propResult.prop == null || (typeof propResult.prop !== "function")) {
                target[arg.arg2] = null;
            }
            else {
                const app = this;
                target[arg.arg2] = (elementEvent) => {
                    let model = app.model(attributes.model[0].arg1);
                    let localEvent = new HydrateModelEvent("handler", model, app.state(model), propResult.propName, target, app, app.name(model));
                    let prop = this.#getScriptValue(arg.arg3, localEvent, undefined, routeRequest);
                    propResult.prop(localEvent, elementEvent, prop, routeRequest);
                };
            }
            updated = true;
        });
        return updated;
    }
    #updateHTMLDispatch(target, event, attributes, routeRequest) {
        let updated = false;
        let app = this;
        attributes.dispatch.forEach(arg => {
            //We don't have 
            if (arg.arg2 === undefined) {
                console.error(`missing arg2 for hydrate dispatch for element ${target}`);
                return false;
            }
            //Determine the value we need to evaluate
            let propResult = this.#determinePropValue(event, arg);
            if (propResult.success === false)
                return false;
            let propNames = event.type === 'route' || propResult.propName !== undefined
                ? [propResult.propName]
                : (event.state instanceof Object) ? Object.keys(event.state) : [undefined];
            //retrieve the function in question
            propNames.forEach(propName => {
                let localEvent = this.#createLocalizedEvent(target, event, propName);
                let name = this.#getScriptValue(arg.arg3, localEvent, localEvent.modelName, routeRequest);
                if (typeof name !== "string")
                    return;
                let lastIndex = name.lastIndexOf(this.options.models.nestedOperator);
                let mName = lastIndex < 0 ? name : name.substring(0, lastIndex);
                let pName = lastIndex < 0 ? undefined : name.substring(lastIndex + 1, name.length);
                //We are using an ignore here because the passed string may not be a hard coded type
                app.dispatch(arg.arg2, app.model(mName), pName, app.state(mName), target, "all");
                updated = true;
            });
        });
        return updated;
    }
    async #updateHTMLComponent(target, event, attributes, routeRequest) {
        let updated = false;
        try {
            attributes.component.forEach(async (arg) => {
                //We don't have 
                if (arg.arg2 === undefined) {
                    console.error(`missing arg2 for hydrate component for element ${target}`);
                    return false;
                }
                if (event.type === 'route') {
                    if (event.modelName !== attributes.model[0].arg1)
                        return;
                }
                else {
                    //Determine the value we need to evaluate
                    let propResult = this.#determinePropValue(event, arg);
                    if (propResult.success === false)
                        return false;
                }
                const templateName = arg.arg2;
                const modifiers = arg.arg3 === undefined ? [] : arg.arg3.split(" ");
                const appendMode = modifiers.indexOf(this.options.dom.modifiers.append) >= 0;
                const enumerableMode = modifiers.indexOf(this.options.dom.modifiers.enumerable) >= 0;
                if (event.propName !== undefined && (event.state instanceof Object)
                    && enumerableMode && !event.state.propertyIsEnumerable(event.propName))
                    return false;
                //Highjack the route event to only send the generic route
                let propNames = event.type === "route" || event.propName !== undefined
                    ? [event.propName]
                    : (event.state instanceof Object) ? Object.keys(event.state) : [undefined];
                let componentSource = "template";
                //Handle component routing
                if (event.type === 'route' && attributes.route !== undefined) {
                    let isPage = attributes.page !== undefined;
                    if (isPage && attributes.page[0].arg1 === "url")
                        componentSource = "url";
                    //If this route request doesn't apply, then skip;
                    if (routeRequest == null) {
                        //If this component is a page component, clear it since we're not on this page
                        while (isPage && target.firstChild)
                            target.removeChild(target.firstChild);
                        return true;
                    }
                }
                let template = await this.#getTemplate(templateName, componentSource);
                //retrieve the function in question
                propNames.forEach(async (propName) => {
                    let localEvent = this.#createLocalizedEvent(target, event, propName);
                    let componentType;
                    if (modifiers.indexOf(this.options.dom.modifiers.prop) >= 0)
                        componentType = "prop";
                    else if (modifiers.indexOf(this.options.dom.modifiers.model) >= 0)
                        componentType = "model";
                    else if (modifiers.indexOf(this.options.dom.modifiers.array) >= 0)
                        componentType = "array";
                    else if (modifiers.indexOf(this.options.dom.modifiers.dictionary) >= 0)
                        componentType = 'dictionary';
                    else if (localEvent.prop instanceof Array)
                        componentType = 'array';
                    else if (localEvent.propName === undefined && (typeof localEvent.prop !== "object"))
                        componentType = 'model';
                    else
                        componentType = 'prop';
                    if (componentType === 'model') {
                        await this.#insertComponent(template, localEvent, [undefined], appendMode, routeRequest);
                    }
                    else {
                        let model = (localEvent.model instanceof Object)
                            ? localEvent.model[localEvent.propName]
                            : undefined;
                        let previousSate = (localEvent.previousState instanceof Object)
                            ? localEvent.previousState[localEvent.propName]
                            : undefined;
                        let componentEvent = new HydrateModelEvent(localEvent.type, model, previousSate, undefined, target, this, this.name(model));
                        let propNames = componentType === 'prop' || !(componentEvent.state instanceof Object)
                            ? [undefined]
                            : Object.keys(componentEvent.state);
                        await this.#insertComponent(template, componentEvent, propNames, appendMode, routeRequest);
                    }
                    updated = true;
                });
            });
            return updated;
        }
        catch (error) {
            console.error("failed to generate component");
            return false;
        }
    }
    //=========== Routing =============//
    #historyListener(event) {
        this.#navigateToRoute(event.state);
    }
    #pathToRegex(path) {
        if (!path)
            return new RegExp(".*");
        let regex = path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)");
        return this.options.router.exactMatch ? RegExp("^" + regex + "$") : RegExp(regex);
    }
    #matchRoute(path, routerContext) {
        return routerContext.path.match(this.#pathToRegex(path));
    }
    #generateRouteRequest(path, match, routerContext) {
        return {
            route: path,
            url: routerContext.url,
            pathname: routerContext.pathname,
            search: routerContext.search,
            hash: routerContext.hash,
            params: this.#getRouteParams(path, match),
            query: this.#getQueryParams(routerContext.search),
            state: routerContext.state,
        };
    }
    #getRouteParams(route, match) {
        let params = {};
        let keys = route.match(/:(\w+)/g);
        if (keys)
            for (let i = 0; i < keys.length; i++)
                params[keys[i].substring(1)] = match[i + 1];
        return params;
    }
    ;
    #getQueryParams(search) {
        let query = {};
        location.search.substring(1, location.search.length).split("&").forEach(x => {
            let parts = x.split("=");
            if (parts[0] === "")
                return;
            query[parts[0]] = parts[1];
        });
        return query;
    }
    async #navigateToRoute(state) {
        const app = this;
        //Supress hash changes causing routing unless user opts in for it
        if (!this.options.router.hashRouting &&
            (this.#routerContext.pathname === location.pathname &&
                this.#routerContext.search === location.search &&
                this.#routerContext.hash !== location.hash))
            //If we are not using hash based routing and we only had a hash change, then don't trigger routing
            return;
        let routerContext = {
            path: !app.options.router.hashRouting ? location.pathname
                : (location.hash === "" ? "/" : location.hash),
            pathname: location.pathname,
            search: location.search,
            hash: location.hash,
            url: window.location.pathname + window.location.search + window.location.hash,
            state: state
        };
        this.#routerContext = routerContext;
        const routeMatches = this.#routes.map(x => {
            return {
                route: x,
                result: this.#matchRoute(x.path, routerContext)
            };
        }).filter(x => x.result != null);
        const resolve = async function () {
            return await app.#routeDom(routerContext);
        };
        const middlewarePipeline = function* () {
            for (let i = 0; i < routeMatches.length; i++) {
                yield routeMatches[i];
            }
        };
        const middleware = middlewarePipeline();
        const continuePipeline = async function () {
            let result = middleware.next();
            if (result.done === true) {
                return await resolve();
            }
            let match = result.value;
            let req = app.#generateRouteRequest(match.route.path, match.result, routerContext);
            let res = {
                hydrate: app,
                continue: continuePipeline,
                resolve: resolve
            };
            return await match.route.callback(req, res);
        };
        return continuePipeline();
    }
    #routeDom(routeContext) {
        this.dispatch("route", undefined, undefined, undefined, this.root, "domOnly", "*");
    }
}
