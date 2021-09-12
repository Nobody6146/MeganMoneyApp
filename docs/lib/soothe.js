//========== HTML Attribute Bindings ================//
SootheApp.prototype.modelBindAttr = "spa-model";
SootheApp.prototype.propBindAttr = "spa-property";
SootheApp.prototype.attrBindAttr = "spa-attribute";
SootheApp.prototype.inputBindAttr = "spa-input";
SootheApp.prototype.templateBindAttr = "spa-template";
SootheApp.prototype.compBindAttr = "spa-component";
SootheApp.prototype.listBindAttr = "spa-list";
SootheApp.prototype.dictBindAttr = "spa-dictionary";
SootheApp.prototype.funcBindAttr = "spa-function";
SootheApp.prototype.evtBindAttr = "spa-event";
SootheApp.prototype.staticBindAttr = "spa-static";
SootheApp.prototype.routeBindAttr = "spa-route";
SootheApp.prototype.expressionBindAttr = "spa-expression";
SootheApp.prototype.toggleBindAttr = "spa-toggle";
SootheApp.prototype.deleteBindAttr = "spa-delete";
SootheApp.prototype.repeatBindAttr = "spa-repeat";
SootheApp.prototype.conditionBindAttr = "spa-condition";
SootheApp.prototype.discreteBindAttr = "spa-discrete"; //Only allow discrete prop binding meaning "won't respond to generic wildcard events" def="model|prop|true|false", defaults to true
SootheApp.prototype.suppressBindAttr = "spa-suppress"; //Prevents default bevaior of an on-event
SootheApp.prototype.handlerBindAttr = "spa-handler"; //Fires a callback when the "on" event of the element is fired
SootheApp.prototype.triggerEventBindAttr = "spa-trigger"; //Triggers a spa dom event 
SootheApp.prototype.toggleClassBindAttr = "spa-class"; //Toggles the inclusion of a class to an element
SootheApp.prototype.appendBindAttr = "spa-append"; //Tells a component to append a value rather than replace it

SootheApp.prototype.wildcardChar = "*";
SootheApp.prototype.insertionChar = "_";

SootheApp.prototype.eventModifier = "event";

SootheApp.prototype.attributes = [
    SootheApp.prototype.modelBindAttr,
    SootheApp.prototype.propBindAttr,
    SootheApp.prototype.attrBindAttr,
    SootheApp.prototype.inputBindAttr,
    SootheApp.prototype.templateBindAttr,
    SootheApp.prototype.compBindAttr,
    SootheApp.prototype.listBindAttr,
    SootheApp.prototype.dictBindAttr,
    SootheApp.prototype.funcBindAttr,
    SootheApp.prototype.staticBindAttr,
    //SootheApp.prototype.routeBindAttr
    SootheApp.prototype.expressionBindAttr,
    SootheApp.prototype.toggleBindAttr,
    SootheApp.prototype.deleteBindAttr,
    SootheApp.prototype.repeatBindAttr,
    SootheApp.prototype.conditionBindAttr,
    SootheApp.prototype.triggerEventBindAttr,
    SootheApp.prototype.toggleClassBindAttr
];

//Controls the model prop that can be used on a proxy use
SootheApp.prototype.rawModelDataProp = "__this"

function SootheApp(options) {
    this.routes = [];
    this.prevLocation = {
        pathname: null,
        hash: null,
        search: null
    };
    this.options = {
        dom: {
            root: "body"
        },
        routing: {
            hashRouting: true,
            exactMatch: true
        }
    };
    if(options && options.dom)
    {
        if(options.dom.root)
            this.options.dom.root = options.dom.root.toString();
    }
    if(options && options.routing)
    {
        if(options.routing.hashRouting === true)
            this.options.routing.hashRouting = true;
        if(options.routing.exactMatch === false)
            this.options.routing.exactMatch = false;
    }

    this.root = document.querySelector(this.options.dom.root);
    this.boundModels = {};
    this.boundModelListeners = [];

    this.routeListener = function(event) {
        let target = event.target;
        while(target) {
            if(target.attributes[SootheApp.prototype.routeBindAttr])
            {
                event.preventDefault();
                let modelAttr = target.attributes[SootheApp.prototype.modelBindAttr];
                let model = modelAttr ? this.getModelData(modelAttr.value) : null;
                if(model)
                    model = JSON.parse(JSON.stringify(model));
                let route;
                let elType = target.nodeName.toLowerCase();
                if(elType === "a")
                    route = target.href;
                else if(elType === form)
                    route = target.action;
                this.navigateTo(route, model);
                return;
            }
            else
                target = target.parentElement;
        }
    }
    this.historyListener = function(event) {
        this.route(event.state);
    }
    this.route = function(data) {

        //Supress hash changes causing routing unless user opts in for it
        if(!this.options.routing.hashRouting && 
            (this.prevLocation.pathname === location.pathname &&
                this.prevLocation.search === location.search &&
                this.prevLocation.hash !== location.hash))
            //If we are not using hash based routing and we only had a hash change, then don't trigger routing
            return;

        this.prevLocation.pathname = location.pathname;
        this.prevLocation.search = location.search;
        this.prevLocation.hash = location.hash;

        let path = !this.options.routing.hashRouting ? location.pathname : location.hash;

        let matches = this.routes.map(x => {
            return {
                route: x.path,
                path: path,
                callback: x.callback,
                result: path.match(this.pathToRegex(x.path))
            }
        }).filter(x => x.result != null);
        if(!matches || matches.length == 0)
            return;

        let query = null;
        if(location.search)
        {
            query = {};
            let vars = location.search.substring(1, location.search.length).split("&").forEach(x => {
                let parts = x.split("=");
                query[parts[0]] = parts[1];
            });
        }
        // let req = new SootheAppequest(match.path, match.route, this.getParams(match), model);
        // let res = new SootheAppesponse(this);
        let res = new SootheRouteResponse(this);

        let actions = matches.map(match => {
            return {
                callback: match.callback,
                req: new SootheRouteRequest(match.path, match.route, query, this.getParams(match), data),
                res: res,
                next: function() {}
            }
        });
        for(let i = 0; i < actions.length -1; i++)
        {
            let next = actions[i + 1];
            actions[i].next = function() {
                return next.callback(next.req, next.res, next.next);
            }
            //actions[i].next.bind(this);
        }

        let action = actions[0];
        let response = action.callback(action.req, action.res, action.next)
        if(response instanceof Promise)
            response.then().catch(err => console.error(err));
    }
    this.pathToRegex = function(path) {
        if(!path)
            return new RegExp(".*");

        let regex = path.replace(/\//g, "\\/").replace(/:\w+/g, "(.+)");
        return this.options.routing.exactMatch ? RegExp("^" + regex + "$") : RegExp(regex);
    }
    this.getParams = function(match) {
        let params = {};
        let keys = match.route.match(/:(\w+)/g);
        if(keys)
            for(let i = 0; i < keys.length; i++)
                params[keys[i].substr(1)] = match.result[i + 1];
        return params;
    };

    this.makeProxy = function(data, name, app, replace) {
        let models = {};
        let proxy;

        let bindOrGet = function(obj, prop, replace) {
            if(obj[prop] instanceof Date || !(obj[prop] instanceof Object))
                return null;
            let modelName = name + "." + prop;

            let model = models[prop];
            if(!replace && model)
                return model;
            else {
                //Make proxy
                models[prop] = app.makeProxy(obj[prop], modelName, app, replace);
                //Trigger bind event (we know this is a bind, because setting value triggers first event)
                
                //app.triggerEvent(app.getRootElement(), event);
                return models[prop];
            }
        }

        proxy = new Proxy(data, {
            get(obj, prop) {
                if(prop === SootheApp.prototype.rawModelDataProp)
                    return obj;
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
                if(app.getModel(name) !== proxy) {
                    obj[prop] = value;
                    return true;
                }
                
                //Delete old values for prop so we get unbind events
                let model = bindOrGet(obj, prop, false);
                // if(previousValue instanceof Object)
                //     Object.keys(previousValue).forEach(x => delete model[x]);
                obj[prop] = value == null || typeof value !== "object" ? value : value[SootheApp.prototype.rawModelDataProp] ? value[SootheApp.prototype.rawModelDataProp] : value;
                bindOrGet(obj, prop, true);
                // if(model) {
                
                //     app.refreshModel(model, name + "." + prop, app);
                // }
                let event = new SootheModelEvent(proxy, name, prop, previousValue, previousValue === undefined ? "bind" : "set", app.getRootElement(), undefined, app);
                //Make sure the properties exist so we can bind to dom and find them
                app.triggerEvent(app.getRootElement(), event);
                
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
                    let event = new SootheModelEvent(proxy, name, prop, property, "unbind", app.getRootElement(), undefined, app);
                    app.triggerEvent(app.getRootElement(), event);
                    if(!(property instanceof Object)) {
                        //This won't trigger automatically for sol values because there is no proxy to call generic event
                        event = new SootheModelEvent(proxy, name + "." + prop, SootheApp.prototype.wildcardChar, property, "unbind", app.getRootElement(), undefined, app);
                        app.triggerEvent(app.getRootElement(), event);
                    }
                  }
                
                  return true;
            }
        });

        
        //Now lets trigger nested proxies for all the properties
        this.refreshModel(proxy, name, app);
        if(!replace) {
            //Trigger a new event that the new data is being bound
            let event = new SootheModelEvent(proxy, name, SootheApp.prototype.wildcardChar, null, "bind", app.getRootElement(), undefined, app);
            app.triggerEvent(app.getRootElement(), event);
        }
        return proxy;
    }

    this.refreshModel = function(proxy, name, app) {
        if(proxy instanceof Object)
            Object.keys(proxy).forEach(prop => {
                //Do a get to force the proxy to be created
                proxy[prop];
                    let event = new SootheModelEvent(proxy, name, prop, null, "bind", app.getRootElement(), undefined, app);
                    app.triggerEvent(app.getRootElement(), event);
            });
    }

    /****************
        ****Callbacks****
        ****************/
    this.mutationCallback = function(mutations, observer) {
        let bindUpdates = [];
        mutations.forEach( m => {
            if(m.type === 'childList')
                m.addedNodes.forEach(n => this.bindNodeRecursive(n));
            if(m.type === 'attributes') 
                this.bindNodeRecursive(m.target);
        });
    }
    this.inputListener = function(event) {
        let attr = event.target.attributes[SootheApp.prototype.modelBindAttr];
        let input = event.target.attributes[SootheApp.prototype.inputBindAttr];
        if(attr != null && input != null) {
            let model = this.getModel(attr.value);
            if(model) {
                let args = input.value.split(" ");
                model[args[0]] = event.target[args[1]];
            }
        }
    }

    //============= Dom Manipulation ==============//
    /*
    Handling DOM updates
    */
    this.buildQuerySelectors = function(modelName, propName) {
        return this.buildModelSelectors(modelName).map(x => {
            return "[" + SootheApp.prototype.modelBindAttr + "='" + x + "']"
        });
    }
    this.buildModelSelectors = function(modelName) {
        const parts = modelName.split(".");
        let selectors = [modelName];
        if(parts.length == 1)
        {
            if(parts[0] !== SootheApp.prototype.wildcardChar)
                selectors.push(SootheApp.prototype.wildcardChar);
            return selectors;
        }
        
        for(let i = 0; i < parts.length; i++)
        {
            let selector = [... parts];
            selector[i] = SootheApp.prototype.wildcardChar;
            selectors.push(selector.join("."));
        }
        selectors.push(SootheApp.prototype.wildcardChar);
        return selectors;
    }
    this.triggerEvent = function(parent, event) {

        const modelListeners = this.getModelListeners(
            SootheModelListenerOptions.parse({
                modelName: event.modelName,
                propName: event.propName,
                events: event.type,
                discrete: event.propName !== SootheApp.prototype.wildcardChar
            })
        );

        //Call our callback functions
        modelListeners.forEach(x => {
            if(x.options.condition === true || (typeof x.options === "function" && x.options.condition(event)))
                x.callback(event);
        });

        //The parent is the element to start affecting at
        //It's time to update the DOM
        let domSelectors = this.buildQuerySelectors(event.modelName, event.propName);
        domSelectors.forEach(s => {
            let children = parent.querySelectorAll(s);
            this.updateDomForChild(parent, event);
            children.forEach(x => this.updateDomForChild(x, event));
        });
    }
    this.bindNodeRecursive = function(node, once) {
        const app = this;
        if(node instanceof Element || node instanceof HTMLDocument) {
            let attr = node.attributes[SootheApp.prototype.modelBindAttr];
            if(attr != null)
            {
                let model = this.getModel(attr.value);
                //let data = this.getModelData(attr.value);
                
                //if(data instanceof Object) {
                if(model instanceof Object) {
                    Object.keys(model).forEach(prop => {
                        let event = new SootheModelEvent(model, attr.value, prop, null, "bind", node, undefined, app);
                        app.updateDomForChild(node, event);
                    });
                } 
                else if(model) {
                    let seperator = attr.value.lastIndexOf(".");
                    if(seperator >= 0)
                    {
                        let propValue = data;
                        model = app.getModel(attr.value.substr(0, seperator));
                        if(model) {
                            let prop = attr.value.substr(attr.value.lastIndexOf("."), attr.value.length - seperator);
                            let event = new SootheModelEvent(model, attr.value, SootheApp.prototype.wildcardChar, null, "bind", node, propValue, this);
                            this.updateDomForChild(node, event);
                        }
                    }
                }
                else if(attr.value.endsWith(".*"))
                {
                    model = this.getModel(attr.value.substring(0, attr.value.lastIndexOf(".")));
                    if(model != null)
                    {
                        //Do we even track a child monitor?
                    }
                }
                else if(attr.value === SootheApp.prototype.wildcardChar) {
                    let event = new SootheModelEvent(null, SootheApp.prototype.wildcardChar, SootheApp.prototype.wildcardChar, null, "bind", node, undefined, this);
                        this.updateDomForChild(node, event);
                }
            }
            if(!once)
                node.childNodes.forEach(n => this.bindNodeRecursive(n));
        }
    }

    this.updateDomForChild = function(target, event) {

        let partOfTemplate = target;
        do {
            //Don't trigger an event if it's inside a template
            if(partOfTemplate.attributes[SootheApp.prototype.templateBindAttr])
                return;
            partOfTemplate = partOfTemplate.parentElement;
        }while(partOfTemplate !== null);

        let triggered = false;
        let attrs = this.loadSpaAttrs(target);
        // if(event.type === "pseudo" && pseudoAttr && )
        // let propValue = event.propName ? event.model[event.propName] : event.model;
        //These event types mean a DOM update is required
        if(attrs.static && attrs.static.value == "true")
        {
            return;
        }
        if(attrs.cond)
        {
            const value = attrs.cond.value.trim();
            const firstSpace = attrs.cond.value.indexOf(" ");
            const eventObjectName = firstSpace === -1 ? "event" : value.substring(0, firstSpace).trim();
            const rawExpression = firstSpace === -1 ? value : value.substring(firstSpace + 1).trim();
            const expression = this.resolveInsertionValue(rawExpression, event);
            const func = new Function(eventObjectName, "return " + expression);
            const result = func(event);
            if(result != true)
                return;
        }
        if(!this.passesDefinitiveCheck(attrs, event))
            return;
        let handleEvent = true; //!attrs.evt || attrs.evt.value.split(' ').find(x => x === event.type) !== undefined
        if(attrs.evt)
        {
            let respondTo = [];
            paramList = this.splitAttributeValue(attrs.evt.value);
            paramList.forEach(params => {
                const [propName, eventType] = params;
                if(propName == event.propName || propName == SootheApp.prototype.wildcardChar)
                    respondTo.push(eventType);
            });
            handleEvent = respondTo.length == 0 || respondTo.includes(event.type);
        }
        if(handleEvent)
        {
            if(attrs.hdlr) {
                const app = this;
                const modelName = event.modelName;
                let data = event.data;
                let paramList = this.splitAttributeValue(attrs.hdlr.value);
                paramList.forEach(params => {
                    const propName = params[0];
                    if(propName !== event.propName)
                        return;
                    let handlerName = params[1];
                    let handler = null;
                    if(data != null && typeof data === "object")
                    {
                        let modelHandler = data[propName];
                        if(typeof modelHandler === "function")
                            handler = (domEvent) => {
                                let spaEvent = new SootheModelEvent(app.getModel(modelName), modelName, propName, null, "handler", domEvent.target, null, app);
                                modelHandler(domEvent, spaEvent);
                            };
                    }
                    target[handlerName] = handler;
                });
            }
            if(attrs.attr)
            {
                let values = this.splitAttributeValue(attrs.attr.value).filter(x => x[0] === event.propName || x[0] === SootheApp.prototype.wildcardChar);
                values.forEach(attr => {
                    let propValue = attr[2] ? this.resolveInsertionValue(attr[2], event) : event.value !== undefined ? event.value : event.model;
                    if(target.attributes[attr[1]] !== propValue)
                        target.setAttribute(attr[1], propValue);
                    triggered = true;
                });
                //Reload the attributes
                attrs = this.loadSpaAttrs(target);
            }
            if(attrs.tgl)
            {
                let values = this.splitAttributeValue(attrs.tgl.value).filter(x => x[0] === event.propName || x[0] === SootheApp.prototype.wildcardChar);
                values.forEach(attr => {
                    let propValue = attr[2] ? this.resolveInsertionValue(attr[2], event) : event.value !== undefined ? event.value : event.model;
                    if(target.attributes[attr[1]] !== propValue) {
                        target.toggleAttribute(attr[1], propValue);
                    }
                    triggered = true;
                });
            }
            if(attrs.prop)
            {
                attrs.prop
                let props = this.splitAttributeValue(attrs.prop.value).filter(x => x[0] === event.propName || x[0] === SootheApp.prototype.wildcardChar);
                props.forEach(prop => {
                    let propValue = prop[2] ? this.resolveInsertionValue(prop[2], event) : event.value !== undefined ? event.value : event.model;
                    if(target[prop[1]] !== propValue) {
                        
                        target[prop[1]] = propValue;
                    }
                    triggered = true;
                });
            }
            if(attrs.comp) {
                let args = this.splitAttributeValue(attrs.comp.value)[0];
                let indexes = [""];
                if(args[0] === event.propName || args[0] === SootheApp.prototype.wildcardChar) {
                    let propValue = event.value !== undefined ? event.value : event.model;
                    let gen = false;
                    let modifier = args.length >= 3 ? args[2] : null;
                    if(propValue instanceof Object) {
                        propValue = [event.model];
                        gen = true;
                    } else {
                        propValue = [propValue];
                        gen = true;
                    }
                    if(!propValue || propValue.length == 0)
                        gen = false;
                    if(gen) {
                        let repeat = attrs.rpt && attrs.append ? parseInt(attrs.rpt.value) : 1;
                        if(isNaN(repeat))
                            repeat = event.model[attrs.rpt.value];
                        for(let i = 0; i < repeat; i++) {
                            indexes = indexes.map(x => event.modelName + "." + event.propName + (x !== "" ? "." + x : ""));
                            this.buildDomTemplate(target, args[1], propValue, event, attrs, indexes);
                            triggered = true;
                        }
                    }
                }
            }
            if(attrs.list) {
                let args = this.splitAttributeValue(attrs.list.value)[0];
                let indexes = [""];
                if(args[0] === event.propName || args[0] === SootheApp.prototype.wildcardChar) {
                    let propValue = event.value !== undefined ? event.value : event.model;
                    let gen = false;
                    let modifier = args.length >= 3 ? args[2] : null;
                    if(Array.isArray(propValue)) {
                        let i = 0;
                        indexes = propValue.map(x => i++);
                        gen = true;
                    }

                    if(!propValue || propValue.length == 0)
                        gen = false;
                    if(gen) {

                        let repeat = attrs.rpt && attrs.append ? parseInt(attrs.rpt.value) : 1;
                        if(isNaN(repeat))
                            repeat = event.model[attrs.rpt.value];
                        for(let i = 0; i < repeat; i++) {
                            indexes = indexes.map(x => event.modelName + "." + event.propName + (x !== "" ? "." + x : ""));
                            this.buildDomTemplate(target, args[1], propValue, event, attrs, indexes);
                            triggered = true;
                        }
                    }
                }
            }
            if(attrs.dict) {
                let args = this.splitAttributeValue(attrs.dict.value)[0];
                let indexes = [""];
                if(args[0] === event.propName || args[0] === SootheApp.prototype.wildcardChar) {
                    let propValue = event.value !== undefined ? event.value : event.model;
                    let gen = false;
                    let modifier = args.length >= 3 ? args[2] : null;
                    if(propValue instanceof Object) {
                        indexes = Object.keys(propValue);
                        propValue = Object.values(propValue);
                        gen = true;
                    }

                    if(!propValue || propValue.length == 0)
                        gen = false;
                    if(gen) {

                        let repeat = attrs.rpt && attrs.append ? parseInt(attrs.rpt.value) : 1;
                        if(isNaN(repeat))
                            repeat = event.model[attrs.rpt.value];
                        for(let i = 0; i < repeat; i++) {
                            indexes = indexes.map(x => event.modelName + "." + event.propName + (x !== "" ? "." + x : ""));
                            this.buildDomTemplate(target, args[1], propValue, event, attrs, indexes);
                            triggered = true;
                        }
                    }
                }
            }
            if(attrs.func)  {
                
                let args = this.splitAttributeValue(attrs.func.value);

                let repeat = attrs.rpt ? parseInt(attrs.rpt.value) : 1;
                if(isNaN(repeat))
                            repeat = event.model[attrs.rpt.value];
                for(let i = 0; i < repeat; i++) {
                    args.forEach(attr => {
                        if(attr[0] === event.propName || attr[0] === SootheApp.prototype.wildcardChar)
                        {
                            try {
                                let func = window;
                                attr[1].split(".").forEach(x => func = func[x]);
                                func(event);
                            } catch (error) {
                                console.error(error);
                            }
                        }
                        triggered = true;
                    });
                }
            }
            if(attrs.del)  {
                let values = this.splitAttributeValue(attrs.del.value);
                let propValue = event.value != undefined ? event.value : event.model;
                let props = values[0];
                let del = false;
                if(props[1] === SootheApp.prototype.eventModifier)
                    del = true;
                else if((props[0] === SootheApp.prototype.wildcardChar || props[0] === event.propName) && propValue == true) 
                    del = true;
                if(del){
                    target.parentNode.removeChild(target);
                    triggered = true;
                }
            }
            if(attrs.trig)  {
                let args = this.splitAttributeValue(attrs.trig.value);
                let repeat = attrs.rpt ? parseInt(attrs.rpt.value) : 1;
                if(isNaN(repeat))
                    repeat = event.model[attrs.rpt.value];
                for(let i = 0; i < repeat; i++) {
                    args.forEach(attr => {
                        if(attr[0] === event.propName || attr[0] === SootheApp.prototype.wildcardChar)
                        {
                            try {
                                const propValue = event.value !== undefined ? event.value : event.model;
                                const eventType = attr[1];
                                let modelName = attr[2] === undefined ? propValue : this.resolveInsertionValue(attr[2]);
                                let propName = SootheApp.prototype.wildcardChar;
                                const lastDotOperator = modelName.lastIndexOf(".");
                                if(lastDotOperator !== -1)
                                {
                                    propName = modelName.substring(lastDotOperator + 1);
                                    modelName = modelName.substring(0, lastDotOperator);
                                }
                                let model = this.getModel(modelName);

                                if(model != null){
                                    if(propName !== SootheApp.prototype.wildcardChar)
                                    {
                                        let domEvent = new SootheModelEvent(model, modelName, propName, model[propName], eventType, this.getRootElement(), undefined, this);
                                        this.triggerEvent(this.getRootElement(), domEvent);
                                    }
                                    let domEvent = new SootheModelEvent(model, modelName, propName, model, eventType, this.getRootElement(), undefined, this);
                                    this.triggerEvent(this.getRootElement(), domEvent);
                                }
                            } catch (error) {
                                console.error(error);
                            }
                        }
                        triggered = true;
                    });
                }
            }
            if(attrs.class)
            {
                let values = this.splitAttributeValue(attrs.class.value).filter(x => x[0] === event.propName || x[0] === SootheApp.prototype.wildcardChar);
                values.forEach(attr => {
                    let propValue = attr[2] ? this.resolveInsertionValue(attr[2], event) : event.value !== undefined ? event.value : event.model;
                    let className = attr[1];
                    if(!attr[1]) {
                        className = propValue;
                        propValue = true;
                    }
                    if(!target.classList.contains(className) == propValue)
                    {
                        target.classList.toggle(className, propValue);
                    }
                    triggered = true;
                });
            }
        }

        if(triggered && attrs.static) 
            attrs.static.value = "true";
        //Remove pseudo element so it will never overwrite again
        // if(attrs.pseudo)
        //     target.removeAttribute(SootheApp.prototype.pseudoBindAttr)
    }
    this.loadSpaAttrs = function(target) {
        return {
            model: target.attributes[SootheApp.prototype.modelBindAttr],
            prop: target.attributes[SootheApp.prototype.propBindAttr],
            attr: target.attributes[SootheApp.prototype.attrBindAttr],
            input: target.attributes[SootheApp.prototype.inputBindAttr],
            tmplt: target.attributes[SootheApp.prototype.templateBindAttr],
            comp: target.attributes[SootheApp.prototype.compBindAttr],
            list: target.attributes[SootheApp.prototype.listBindAttr],
            dict: target.attributes[SootheApp.prototype.dictBindAttr],
            pseudo: target.attributes[SootheApp.prototype.pseudoBindAttr],
            func: target.attributes[SootheApp.prototype.funcBindAttr],
            evt: target.attributes[SootheApp.prototype.evtBindAttr],
            static: target.attributes[SootheApp.prototype.staticBindAttr],
            tgl: target.attributes[SootheApp.prototype.toggleBindAttr],
            del: target.attributes[SootheApp.prototype.deleteBindAttr],
            rpt: target.attributes[SootheApp.prototype.repeatBindAttr],
            cond: target.attributes[SootheApp.prototype.conditionBindAttr],
            discrete: target.attributes[SootheApp.prototype.discreteBindAttr],
            trig: target.attributes[SootheApp.prototype.triggerEventBindAttr],
            class: target.attributes[SootheApp.prototype.toggleClassBindAttr],
            append: target.attributes[SootheApp.prototype.appendBindAttr], 
            hdlr: target.attributes[SootheApp.prototype.handlerBindAttr], 
        }
    }
    this.splitAttributeValue = function(value) {
        //return value.split(/({{.+}})?;/).filter(x => x !== undefined).map(x => { 
        return value.split(';').map(x => { 
            //return x.trim().split(/\s+/)
            let baseParams = x.trim();
            //splits on two whitespaces: "[model_prop] [el_prop] [THIRD_PARAM]"
            let regParams = baseParams.match(/[^\s]+\s+[^\s]+\s+/);
            if(!regParams)
                return baseParams.split(/\s+/);
            //We have a 3rd argument for a replacement/insertion value to stick into arg 2 field
            let result = baseParams.split(/\s+/);
            return [result[0], result[1], baseParams.substr(regParams[0].length)];
        });
    }
    this.passesDefinitiveCheck = function(attrs, event) {
        if(!attrs.discrete)
            return true;
        let discrete = attrs.discrete.value.trim();
        return (discrete !== "false" && event.propName !== SootheApp.prototype.wildcardChar) || (discrete === "false" && event.propName === SootheApp.prototype.wildcardChar);
    }
    this.resolveInsertionValue = function(expressionName, root) {
        let expression;
        if(expressionName.match(/^{{.+}}$/))
            expression = expressionName.substr(2, expressionName.length - 4);
        else {
            let pattern = document.querySelector("[" + SootheApp.prototype.expressionBindAttr + "=" + expressionName.trim() + "]");
            if(pattern)
                expression = pattern.innerText;
            else
                return root.value;
        }
        
        let result = expression;
        let insertionValues = expression.match(/{{[^{}]*}}/g);
        if(!insertionValues)
            return expression;
        insertionValues.forEach(insertionValue => {
            let props = insertionValue.replace("{{", "").replace("}}", "").trim().split(".");
            let value = root;
            props.forEach(prop => value = value[prop]);
            result = result.replace(insertionValue, value);
        });
        
        return result;
    }
    this.buildDomTemplate = function(target, templateName, values, event, attrs, indexes) {
        let template = document.querySelector("[" + SootheApp.prototype.templateBindAttr + "=" + templateName + "]");
        if(!template)
            return;
        while (!attrs.append && target.firstChild) {
            target.removeChild(target.firstChild);
        }
        for(let i = 0; i < values.length; i++)
        {
            let model = values[i];
            let index = indexes[i];
            template.childNodes.forEach(x => {
                let node = x.cloneNode(true);
                
                target.appendChild(node);
                //Bind all the local model and prop names
                let localModels = target.querySelectorAll("[" + SootheApp.prototype.modelBindAttr + "='" + SootheApp.prototype.insertionChar + "']");
                localModels.forEach(el => {
                    Object.values(el.attributes).map(x => x.name).forEach(attrName => {
                        if(attrName !== SootheApp.prototype.modelBindAttr &&
                            SootheApp.prototype.attributes.find(x => x === attrName)) {
                                el.setAttribute(attrName, el.getAttribute(attrName).replace(SootheApp.prototype.insertionChar
                                    , (model instanceof Object)  ? event.propName : SootheApp.prototype.wildcardChar));
                            }
                    });
                    let modelAttr = el.getAttribute(SootheApp.prototype.modelBindAttr);
                    if(modelAttr !== undefined)
                        el.setAttribute(SootheApp.prototype.modelBindAttr, modelAttr.replace(SootheApp.prototype.insertionChar, index));
                });
            });
        }
    }

    //Start the dom
    this.observer = new MutationObserver(this.mutationCallback.bind(this));
    this.observer.observe(this.root, 
        {childList: true, attributes: true, attributeFilter: SootheApp.prototype.attributes, subtree: true}
    );
    this.root.addEventListener("input", this.inputListener.bind(this));
    
    const makeOnEventListener = function(eventName, spa) {
        const app = spa;
        const elementEvent = eventName;
        return function(event) {
            let target = event.target;
            
            while(target != null && (target.attributes == null || target.attributes[SootheApp.prototype.handlerBindAttr] == null))
                target = target.parentElement;
            if(target == null)
                return;

            //Check to prevent default behavior
            if(target.attributes[SootheApp.prototype.suppressBindAttr] != null)
            {
                let paramList = app.splitAttributeValue(target.attributes[SootheApp.prototype.suppressBindAttr].value);
                for(let i = 0; i < paramList.length; i++)
                    if(eventName.toLowerCase() == elementEvent.toLowerCase())
                        event.preventDefault();
            }

            if(target.attributes[SootheApp.prototype.handlerBindAttr] == null)
                return;
                
            if(target.attributes[SootheApp.prototype.modelBindAttr] == null)
                return;
            
            let paramList = app.splitAttributeValue(target.attributes[SootheApp.prototype.handlerBindAttr].value);
            for(let i = 0; i < paramList.length; i++)
            {
                const params = paramList[i];
                let propName = params[0];
                let eventName = params[1];
                if(eventName != elementEvent)
                    continue;
                let modelName = target.attributes[SootheApp.prototype.modelBindAttr].value;
                let model = app.getModel(modelName);
                if(model == null || model[propName] == null)
                    continue;
                let func = model[propName];
                let domEvent = new SootheModelEvent(model, modelName, propName, func, "onEvent", target, undefined, app);
                func(event, domEvent);
            }
        }
    }

    let eventsList = ["ontouchstart", "ontouchmove", "ontouchend", "ontouchcancel"];
    //Add even listeners for every "on" event
    for(const key in document.body)
    {
        if (key.match(/^on(.*)/) && !eventsList.includes(key))
            eventsList.push(key);
    }
    // eventsList.forEach(key => 
    //     this.root.addEventListener(key.substr(2), makeOnEventListener(key, this).bind(this))
    // );

    //Start the router
    this.root.addEventListener("click", this.routeListener.bind(this));
    window.addEventListener("popstate", this.historyListener.bind(this));
}
SootheApp.prototype.getRootElement = function() {
    return this.root;
}
//======== Model Binding ==============//
SootheApp.prototype.getModels = function() {
    return Object.keys(this.boundModels).map(x => {
        return {
            name: x,
            model: this.boundModels[x]
        }
    });
}
SootheApp.prototype.getModel = function(name) {
    if(name == null)
        return undefined;
    let model = this.boundModels;
    name.split(".").forEach(x => {
        if(x == null)
            return undefined;
        model = model[x];
        if(model == null)
            return undefined;
    });
    return model;
}
SootheApp.prototype.getModelData = function(name) {
    const lastDotOperator = name.lastIndexOf(".");
    const modelName = lastDotOperator === -1 ? name : name.substring(0, lastDotOperator);
    let model = this.getModel(modelName);
    if(model == null)
        return model;
    let value = model[SootheApp.prototype.rawModelDataProp];
    return lastDotOperator === -1 ? value : value[name.substring(lastDotOperator + 1)];
}
SootheApp.prototype.bindModel = function(name, data) {
    if(!name)
        name = "";
    if(!data)
        data = {};

    //If this model already exist, unbind it first
    if(this.boundModels[name] != undefined)
        this.unbindModel(name);

    let proxy = this.makeProxy(data, name, this, false);
    this.boundModels[name] = proxy;
    return proxy;
}
SootheApp.prototype.unbindModel = function(name) {
    let model = this.getModel(name);
    if(!model)
        return null;

    let parts = name.split(".");
    const rootModelName = parts[0];
    delete this.boundModels[rootModelName];

    const app = this;
    //Remove and unbind all of it's children
    let triggerUnbind;
    triggerUnbind = function(name, data) {
        if(data instanceof Object)
        {
            Object.keys(data).forEach(key => {
                triggerUnbind(name + "." + key, model[key]);
                let event = new SootheModelEvent(undefined, name, key, JSON.parse(JSON.stringify(model)), "unbind", app.getRootElement(), undefined, app);
                app.triggerEvent(app.getRootElement(), event);
            });
        }
        
        let event = new SootheModelEvent(undefined, name, SootheApp.prototype.wildcardChar, JSON.parse(JSON.stringify(model)), "unbind", app.getRootElement(), undefined, app);
        app.triggerEvent(app.getRootElement(), event);
    }
    triggerUnbind(name, model);

    //Remove the listeners
    // this.boundModelListeners.forEach(x => {
    //     if(x.options.modelName.match("^" + rootModelName + "(\\.|$)"))
    //         this.removeModelListener(x.options, x.callback);
    // });
}
SootheApp.prototype.unbindAllModels = function() {
    Object.keys(this.boundModels).forEach(x => this.unbindModel(x));
    let event = new SootheModelEvent({}, SootheApp.prototype.wildcardChar, SootheApp.prototype.wildcardChar, null, "unbind", this.getRootElement(), undefined, this);
    this.triggerEvent(this.getRootElement(), event);
}
//========= Listeners =============//
SootheApp.prototype.getModelListeners = function(options) {
    const listenerOpts = SootheModelListenerOptions.parse(options);
    return this.boundModelListeners.filter(x => {
        const opts = x.options;
        if(!this.buildModelSelectors(opts.modelName).includes(listenerOpts.modelName))
            return false;
        if(listenerOpts.propName !== opts.propName && listenerOpts.propName !== SootheApp.prototype.wildcardChar && opts.propName !== SootheApp.prototype.wildcardChar)
            return false;
        if(listenerOpts.events.length !== 0 && opts.events.length !== 0 && !listenerOpts.events.some(x => opts.events.includes(x)))
            return false;
        if(listenerOpts.condition !== opts.condition && listenerOpts.condition !== true && opts.condition !== true)
            return false;
        if(listenerOpts.discrete !== opts.discrete && listenerOpts.discrete != null && opts.discrete != null)
            return false;
        return true;
    });
}
SootheApp.prototype.getListenersForModel = function(modelName) {
    return this.boundModelListeners.filter(x => x.options.modelName.match("^" + modelName + "(\\.|$)"));
}
SootheApp.prototype.addModelListener = function(options, callback) {
    const listenerOptions = SootheModelListenerOptions.parse(options);
    let listener = new SootheModelListener(listenerOptions, callback);
    this.boundModelListeners.push(listener);
    return listener;
}
SootheApp.prototype.removeModelListener = function(listener) {
    //Remove the listeners
    const index = this.boundModelListeners.indexOf(listener);
    if(index === -1)
        return;
    this.boundModelListeners.splice(index, 1);
}
SootheApp.prototype.removeAllModelListeners = function() {
    this.boundModelListeners = [];
}

//=========== Events =============//
function SootheModelEvent(model, modelName, propName, previousValue, type, target, value, app) {
    this.app = app;
    this.model = model;
    this.data = !(model instanceof Object) || model[SootheApp.prototype.rawModelDataProp] === undefined
    ? model : model[SootheApp.prototype.rawModelDataProp];
    this.modelName = modelName;
    this.propName = propName;
    this.previousValue = previousValue;
    this.type = type; //Type of event
    this.target = target; //The element that triggered the event

    if(value === undefined) {
        if(model != null && modelName !== SootheApp.prototype.wildcardChar && propName !== SootheApp.prototype.wildcardChar)
            this.value = propName ? model[propName] : model;
        else
            this.value = null;
    } else {
        this.value = value;
    }

    let nameParts = modelName.split(".");
    this.varName = nameParts[nameParts.length - 1];
    this.rootModelName = nameParts[0];
}

function SootheModelListenerOptions(modelName, propName, events, condition, discrete) {
    this.modelName = modelName == null ? SootheApp.prototype.wildcardChar : modelName;
    this.propName = propName == null ? SootheApp.prototype.wildcardChar : propName;
    this.events = events == null ? [] : Array.isArray(events) ? events : [events];
    this.condition = condition == null ? true : 
        typeof condition === "function" ? condition : (event) => condition;
    this.discrete = discrete == null ? discrete : discrete === true ? true : false;
}
SootheModelListenerOptions.parse = function(options)
{
    return options == null ? new SootheModelListenerOptions() :
        new SootheModelListenerOptions(options.modelName, options.propName, options.events, options.condition, options.discrete);
}
function SootheModelListener(options, callback) {
    this.options = options;
    this.callback = callback;
}

//Router
SootheApp.prototype.navigateTo = function(url, data) {
    if(url == null)
        url = window.location.pathname + window.location.search + window.location.hash;
    history.pushState(data, null, url);
    this.route(data);
}
SootheApp.prototype.addRoute = function(path, callback) {
    this.routes.push({path, callback});
}

//=========== Routing ===============//
function SootheRouteRequest(path, route, query, params, data){
    this.path = path;
    this.route = route;
    this.query = query;
    this.params = params;
    this.data = data;
}
function SootheRouteResponse(spa){
    this.spa = spa;
}

function SootheView() {
}   
SootheView.prototype.render = function(req, res, next) {

    return new Promise( (resolve, reject) => {
        
        let checkForFetchError = function() {
            if (res && res.ok === false)
                throw new Error(res.status);
        };

        let promises = [];
        try {
            this.startRendering();
            document.title = this.getTitle();
            promises.push(this.getHTML(req));
            promises.push(this.getData(req));
            promises.push(this.getJavaScript(req));
        }
        catch (error) {
            try {
                this.finishRendering(error);
            }
            catch (err) {
                console.error(err);
            }
            reject(error);
            return;
        }

        Promise.all(promises)
        .then(responses => {
            responses.forEach(res => checkForFetchError(res));
            let html = responses[0];
            let data = responses[1];
            let js = responses[2];
            let promises = [html ? html.text ? html.text() : html : null
                , data ? data.json ? data.json() : data : null
                ,js ? js.text ? js.text() : js : null];
            return Promise.all(promises)
        })
        .then(responses => {
            let html = responses[0];
            let data = responses[1];
            let js = responses[2];

            let root = this.getRoot();
            let el = root;
            //Clean Html
            if (data) {
                this.processData(data);
            }
            if(html)
                while (el.firstChild)
                    el.removeChild(el.firstChild);
            
            if(js) {
                let script = document.createElement("script");
                script.innerHTML = js;
                root.appendChild(script);
            }
            if(html) {
                //Add html
                root.innerHTML += html;
            }

            //if we have a hash value to scroll to, scroll to it
            if(window.location.hash)
            {
                let el = document.getElementById(window.location.hash.substr(1));
                if(el)
                    el.scrollIntoView(true);
                else
                    root.parentNode.scrollIntoView();
            }
            else
            //Scroll back "to top"
                root.parentNode.scrollIntoView();
                const viewport = document.querySelector('meta[name="viewport"]');

                if ( viewport ) {
                    viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
                }
            this.finishRendering();
            resolve();
        })
        .catch(error => {
            this.finishRendering(error);
            reject(error);
        });
    });
}
SootheView.prototype.getTitle = function() {
    return document.title;
}
SootheView.prototype.getRoot = function() {
    let root = document.querySelector("main");
    return root ? root : document.body;
}
SootheView.prototype.getHTML = function(req) {
    return new Promise( (resolve, reject) => {
        resolve(null);
    });
}
SootheView.prototype.getJavaScript = function(req) {
    return new Promise( (resolve, reject) => {
        resolve(null);
    });
}
SootheView.prototype.getData = function(req) {
    return new Promise( (resolve, reject) => {
        resolve({});
    });
}
SootheView.prototype.processData = function(data) {

}
SootheView.prototype.startRendering = function() {

}
SootheView.prototype.finishRendering = function() {

}