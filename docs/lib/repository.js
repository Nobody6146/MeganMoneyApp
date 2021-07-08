function BrowserRepository(name, version) {
    this.name = name;
    this.version = version;
    // In the following line, you should include the prefixes of implementations you want to test.
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
    // DON'T use "var indexedDB = ..." if you're not in a function.
    // Moreover, you may need references to some window.IDB* objects:
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
    // (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
}

BrowserRepository.prototype.isSupported = function() {
    return window.indexedDB ? true : false;
}

function BrowserRepositoryError(message, fileName, lineNumber) {
    var instance = new Error("IndexDB - " + message, fileName, lineNumber);
    instance.name = 'BrowserRepositoryError';
    Object.setPrototypeOf(instance, Object.getPrototypeOf(this));
    if (Error.captureStackTrace) {
        Error.captureStackTrace(instance, BrowserRepositoryError);
    }
    return instance;
}
BrowserRepositoryError.prototype = Object.create(Error.prototype, {
    constructor: {
        value: Error,
        enumerable: false,
        writable: true,
        configurable: true
    }
});

BrowserRepository.prototype.promise = async function(request) {
    return new Promise( (resolve, reject) => {
        request.onsuccess = function(event) {
            resolve(event);
        }
        request.oncomplete = function(event) {
            resolve(event);
        }
        request.onerror = function(event) {
            reject(new BrowserRepositoryError(event.target.errorCode));
        }
    });
}

BrowserRepository.prototype.open = function(upgradeCallback) {
    //Break out if we don't have compatibility
    if(!this.isSupported())
        return Promise.reject(new BrowserRepositoryError("Your browser doesn't support IndexDB"));

    let request = window.indexedDB.open(this.name, this.version);
    let repository = this;

    return new Promise( (resolve, reject) => {
        request.onupgradeneeded = async function(event) {
            let response = upgradeCallback(event);
            await response instanceof Promise ? response
                : Promise.resolve();
        }
        request.onsuccess = function(event) {
            repository.db = event.target.result;
            resolve(event);
        }
        request.onerror = function(event) {
            reject(new BrowserRepositoryError(event.target.errorCode));
        }
        request.onblocked = function(event) {
            reject(new BrowserRepositoryError("DB Blocked"));
        }
    });
}

BrowserRepository.prototype.deleteDatabase = function() {
    if(!this.isSupported())
        return Promise.reject(new BrowserRepositoryError("Your browser doesn't support IndexDB"));
    return this.promise(window.indexedDB.deleteDatabase(this.name));
}

BrowserRepository.prototype.read = function(stores, code) {
    return this.transaction("readonly", stores, code);
}
BrowserRepository.prototype.write = function(stores, code) {
    return this.transaction("readwrite", stores, code);
}
BrowserRepository.prototype.readCursor = function(table, callback) {
    let code = this.generateCursorCallback(table, callback);
    return this.read(table, code);
}
BrowserRepository.prototype.writeCursor = function(table, callback) {
    let code = this.generateCursorCallback(table, callback);
    return this.write(table, code);
}
BrowserRepository.prototype.generateCursorCallback = function(table, callback) {
    let response = {result: undefined};
    return function(transaction) {
        var objectStore = transaction.objectStore(table);
        objectStore.openCursor().onsuccess = function(event) {
            response.result = callback(event.target.result);
        }
        return response;
    }
}

BrowserRepository.prototype.transaction = function(type, stores, code) {
    let transaction = this.db.transaction(stores, type);
    return new Promise( (resolve, reject) => {
        let response = code(transaction);
        transaction.oncomplete = function(event) {
            resolve(response ? response : event);
        }
        transaction.onerror = function(event) {
            reject(new BrowserRepositoryError(event.target.error));
        }
    });
}